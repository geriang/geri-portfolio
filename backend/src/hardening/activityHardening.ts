/**
 * US-5 hardening policy: the single source of every hardening fact (env-var
 * names, the 60/min and 60 s constants, CORS max-age, the Allow value and the
 * three frozen error bodies) plus the two pure parsers. This module is pure:
 * it imports nothing, reads only process.env and never logs (NFR-5).
 */

export const ENV_ALLOWED_ORIGINS: 'ACTIVITY_ALLOWED_ORIGINS' = 'ACTIVITY_ALLOWED_ORIGINS';
export const ENV_RATE_LIMIT_PER_MINUTE: 'ACTIVITY_RATE_LIMIT_PER_MINUTE' =
  'ACTIVITY_RATE_LIMIT_PER_MINUTE';

export const ACTIVITY_PATH: '/activity' = '/activity';

/** AC-4: one minute counting window (backlog figure). */
export const RATE_LIMIT_WINDOW_MS: 60_000 = 60_000;
/** AC-4: admitted requests per window per client IP (backlog figure). */
export const RATE_LIMIT_MAX_REQUESTS_PER_MINUTE: 60 = 60;
/** AC-2: preflight cache lifetime the allowlist cors advertises. */
export const CORS_MAX_AGE_SECONDS: 600 = 600;
/** AC-1: the only methods the public activity surface answers. */
export const ALLOW_HEADER_VALUE: 'GET, OPTIONS' = 'GET, OPTIONS';

export interface HardeningErrorBody {
  readonly error: { readonly code: string; readonly message: string };
}

/** AC-1: frozen 405 body (US-4 error-shape style, no interpolation). */
export const ACTIVITY_METHOD_NOT_ALLOWED_BODY: HardeningErrorBody = Object.freeze({
  error: Object.freeze({
    code: 'ACTIVITY_METHOD_NOT_ALLOWED',
    message: 'this endpoint only supports GET',
  }),
});

/** AC-4: frozen 429 body. */
export const ACTIVITY_RATE_LIMITED_BODY: HardeningErrorBody = Object.freeze({
  error: Object.freeze({
    code: 'ACTIVITY_RATE_LIMITED',
    message: 'too many requests, try again shortly',
  }),
});

/** AC-2: frozen terminal-404 body for /activity subpaths. */
export const ACTIVITY_NOT_FOUND_BODY: HardeningErrorBody = Object.freeze({
  error: Object.freeze({
    code: 'ACTIVITY_NOT_FOUND',
    message: 'no such activity endpoint',
  }),
});

/**
 * AC-2: parse the comma-separated allowlist env value.
 * undefined | null | '' | all-blank  =>  empty Set (deny by default).
 * Otherwise: split on ',', trim each entry, drop empty entries, dedupe.
 * Exact string match, NO case folding. Values arrive only from env —
 * never hardcoded anywhere.
 */
export function parseAllowedOrigins(raw: string | undefined | null): ReadonlySet<string> {
  if (raw === undefined || raw === null) {
    return new Set<string>();
  }
  const origins = new Set<string>();
  for (const entry of raw.split(',')) {
    const trimmed = entry.trim();
    if (trimmed !== '') {
      origins.add(trimmed);
    }
  }
  return origins;
}

/**
 * AC-4: resolve the admitted-request ceiling for one window.
 * A valid explicit override (test seam) wins; else the env value when it is a
 * trimmed /^\d+$/ of at least 1; else the 60 default. Garbage env values
 * ('0', '-5', 'abc', '1e3', '60.5') all fall back — never disable the limiter.
 */
export function resolveRateLimitMax(override?: number): number {
  if (override !== undefined && Number.isInteger(override) && override >= 1) {
    return override;
  }
  const raw = process.env[ENV_RATE_LIMIT_PER_MINUTE];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (/^\d+$/.test(trimmed) && Number(trimmed) >= 1) {
      return Number(trimmed);
    }
  }
  return RATE_LIMIT_MAX_REQUESTS_PER_MINUTE;
}
