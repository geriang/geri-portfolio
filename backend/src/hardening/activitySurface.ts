import cors from 'cors';
import type { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { Router as CreateRouter } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  ACTIVITY_METHOD_NOT_ALLOWED_BODY,
  ACTIVITY_NOT_FOUND_BODY,
  ACTIVITY_PATH,
  ACTIVITY_RATE_LIMITED_BODY,
  ALLOW_HEADER_VALUE,
  CORS_MAX_AGE_SECONDS,
  ENV_ALLOWED_ORIGINS,
  RATE_LIMIT_WINDOW_MS,
  parseAllowedOrigins,
  resolveRateLimitMax,
} from './activityHardening';

/**
 * US-5 hardening composition: the middleware chain factories and the
 * hardened activity router. This module owns composition only — every number,
 * env name and frozen string lives in activityHardening (pure policy), and
 * the inner US-4 router arrives as a factory thunk so this module never
 * imports activityRouter (acyclic dependency, Strategy seam).
 */

/** AC-3: helmet scoped to the activity surface only (legacy keeps its headers). */
export function createActivityHelmet(): RequestHandler {
  return helmet({
    // CSP off: this surface serves JSON only, never a rendered document;
    // nosniff, XFO, HSTS, referrer-policy, dns-prefetch and download-options
    // stay on. If HTML is ever served here, re-enable CSP (design open note).
    contentSecurityPolicy: false,
    // the endpoint is deliberately readable from the allowlisted site origin
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
}

/**
 * AC-2: allowlist CORS. The env value is read per request (never hardcoded);
 * unset/blank allowlist => empty set => deny (no ACAO header, ever).
 */
export function createActivityCors(): RequestHandler {
  return cors({
    origin: (origin: string | undefined, callback): void => {
      const allowed =
        origin !== undefined && parseAllowedOrigins(process.env[ENV_ALLOWED_ORIGINS]).has(origin);
      callback(null, allowed);
    },
    methods: ['GET'],
    allowedHeaders: [],
    maxAge: CORS_MAX_AGE_SECONDS,
    // preflightContinue stays false (default): cors answers preflights itself.
  });
}

export interface ActivityRateLimiterOptions {
  readonly windowMs?: number;
  readonly max?: number;
}

/**
 * AC-4: fixed-window limiter keyed on req.ip. The window belongs to the
 * client-IP key (opened by that key's first request), so tests recover by
 * sleeping past Retry-After, never by assuming wall-clock alignment.
 */
export function createActivityRateLimiter(options?: ActivityRateLimiterOptions): RequestHandler {
  return rateLimit({
    windowMs: options?.windowMs ?? RATE_LIMIT_WINDOW_MS,
    limit: () => resolveRateLimitMax(options?.max), // env re-read per request
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // AC-4 mandates app.set('trust proxy', true) so req.ip is the tunneled
    // client IP; the library's PERMISSIVE_TRUST_PROXY guard would throw on
    // that mandated setting, so only that one validation is switched off.
    validate: { trustProxy: false },
    handler: (_req, res): void => {
      res.status(429).json(ACTIVITY_RATE_LIMITED_BODY);
    },
  });
}

/**
 * AC-1: the method lock. GET/HEAD continue (express serves HEAD as it does
 * for GET); OPTIONS answers 204 + Allow defensively (cors normally short-
 * circuits preflights first); every other method is refused 405 with the
 * frozen body — no activity handler ever runs for it.
 */
export function activityMethodGuard(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD') {
    next();
    return;
  }
  if (req.method === 'OPTIONS') {
    res.set('Allow', ALLOW_HEADER_VALUE).status(204).end();
    return;
  }
  res.set('Allow', ALLOW_HEADER_VALUE).status(405).json(ACTIVITY_METHOD_NOT_ALLOWED_BODY);
}

/** AC-2 hermeticity: no /activity subpath may escape the chain to the wildcard cors. */
export function activitySurfaceNotFound(req: Request, res: Response): void {
  res.status(404).json(ACTIVITY_NOT_FOUND_BODY);
}

/**
 * AC-7 decorator: wrap the legacy wildcard cors so activity paths never
 * reach it while every other path is delegated untouched (legacy responses
 * keep their tested ACAO: * behaviour byte-for-byte).
 */
export function legacyCorsGuard(wildcard: RequestHandler): RequestHandler {
  return (req, res, next) =>
    req.path === ACTIVITY_PATH || req.path.startsWith(`${ACTIVITY_PATH}/`)
      ? next()
      : wildcard(req, res, next);
}

export type ActivityInnerFactory = () => Router;

export interface HardenedRouterOptions {
  readonly dbPath?: string;
  readonly rateLimit?: ActivityRateLimiterOptions;
}

/**
 * The inner lock as one ordered chain (normative adjudication order):
 * helmet -> cors allowlist -> rate limiter -> method guard -> inner US-4
 * router -> terminal 404. Every /activity* request terminates inside with
 * 200/204/404/405/429, so the legacy wildcard cors provably never answers an
 * activity response. makeInner is invoked exactly once, at construction.
 */
export function buildHardenedRouter(
  makeInner: ActivityInnerFactory,
  options?: HardenedRouterOptions,
): Router {
  const router = CreateRouter();
  router.use(createActivityHelmet());
  router.use(createActivityCors());
  router.use(createActivityRateLimiter(options?.rateLimit));
  router.use(activityMethodGuard);
  router.use('/', makeInner());
  router.use(activitySurfaceNotFound);
  return router;
}
