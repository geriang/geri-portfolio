import {
  ACTIVITY_METHOD_NOT_ALLOWED_BODY,
  ACTIVITY_NOT_FOUND_BODY,
  ACTIVITY_PATH,
  ACTIVITY_RATE_LIMITED_BODY,
  ALLOW_HEADER_VALUE,
  CORS_MAX_AGE_SECONDS,
  ENV_ALLOWED_ORIGINS,
  ENV_RATE_LIMIT_PER_MINUTE,
  RATE_LIMIT_MAX_REQUESTS_PER_MINUTE,
  RATE_LIMIT_WINDOW_MS,
  parseAllowedOrigins,
  resolveRateLimitMax,
} from '../src/hardening/activityHardening';
import { legacyCorsGuard } from '../src/hardening/activitySurface';
import cors from 'cors';
import express from 'express';
import request from 'supertest';
import {
  ALLOWED_ORIGINS_ENV_VALUE,
  ORIGIN_ALLOWED_A,
  ORIGIN_ALLOWED_B,
} from './fixtures/publicSurfaceFixtures';

/**
 * Unit (pure policy) half of AC-2 and AC-4: the allowlist parser and the
 * limiter-limit resolver, plus the frozen constants every contract test
 * leans on. Env save/restore convention from tests/activityDb.test.ts.
 */

const originalRateLimit = process.env[ENV_RATE_LIMIT_PER_MINUTE];

function setRateLimitEnv(value: string | undefined): void {
  if (value === undefined) delete process.env[ENV_RATE_LIMIT_PER_MINUTE];
  else process.env[ENV_RATE_LIMIT_PER_MINUTE] = value;
}

afterEach(() => {
  setRateLimitEnv(originalRateLimit);
});

describe('activityHardening: env-name and policy constants (AC-2, AC-4)', () => {
  it('pins the documented env-var names (names only — values never hardcoded)', () => {
    expect(ENV_ALLOWED_ORIGINS).toBe('ACTIVITY_ALLOWED_ORIGINS');
    expect(ENV_RATE_LIMIT_PER_MINUTE).toBe('ACTIVITY_RATE_LIMIT_PER_MINUTE');
    expect(ACTIVITY_PATH).toBe('/activity');
  });

  it('pins the backlog figures: 60 requests, 60 s window, max-age 600, Allow value', () => {
    expect(RATE_LIMIT_MAX_REQUESTS_PER_MINUTE).toBe(60);
    expect(RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(CORS_MAX_AGE_SECONDS).toBe(600);
    expect(ALLOW_HEADER_VALUE).toBe('GET, OPTIONS');
  });
});

describe('parseAllowedOrigins (AC-2)', () => {
  it('is the empty set for missing input — deny by default', () => {
    for (const raw of [undefined, null, '', ' , , ']) {
      expect(parseAllowedOrigins(raw).size).toBe(0);
    }
  });

  it('trims entries, drops empties and dedupes a comma list', () => {
    const raw = ` ${ORIGIN_ALLOWED_A} , ${ORIGIN_ALLOWED_B} ,${ORIGIN_ALLOWED_A},`;
    const parsed = parseAllowedOrigins(raw);
    expect(parsed.size).toBe(2);
    expect(parsed.has(ORIGIN_ALLOWED_A)).toBe(true);
    expect(parsed.has(ORIGIN_ALLOWED_B)).toBe(true);
  });

  it('matches exactly — no case folding (uppercase variant is denied)', () => {
    const parsed = parseAllowedOrigins(ALLOWED_ORIGINS_ENV_VALUE);
    expect(parsed.has(ORIGIN_ALLOWED_A)).toBe(true);
    const caseVariant = ORIGIN_ALLOWED_A.replace('portfolio', 'PORTFOLIO');
    expect(parsed.has(caseVariant)).toBe(false);
  });
});

describe('resolveRateLimitMax (AC-4)', () => {
  it('an explicit valid override wins over env', () => {
    setRateLimitEnv('90');
    expect(resolveRateLimitMax(5)).toBe(5);
  });

  it('reads the env value when it is a trimmed integer >= 1', () => {
    setRateLimitEnv(' 90 ');
    expect(resolveRateLimitMax()).toBe(90);
  });

  it("falls back to 60 for '0', '-5', 'abc', '1e3', '60.5' and unset env", () => {
    for (const raw of ['0', '-5', 'abc', '1e3', '60.5']) {
      setRateLimitEnv(raw);
      expect(resolveRateLimitMax()).toBe(60);
    }
    setRateLimitEnv(undefined);
    expect(resolveRateLimitMax()).toBe(60);
  });

  it('ignores an invalid override and still consults env', () => {
    setRateLimitEnv('90');
    expect(resolveRateLimitMax(0)).toBe(90);
    expect(resolveRateLimitMax(2.5)).toBe(90);
    setRateLimitEnv(undefined);
    expect(resolveRateLimitMax(0)).toBe(60);
  });
});

describe('frozen error bodies (AC-1, AC-2, AC-4)', () => {
  it('are frozen singletons with the exact US-4 error shapes', () => {
    expect(Object.isFrozen(ACTIVITY_METHOD_NOT_ALLOWED_BODY)).toBe(true);
    expect(Object.isFrozen(ACTIVITY_RATE_LIMITED_BODY)).toBe(true);
    expect(Object.isFrozen(ACTIVITY_NOT_FOUND_BODY)).toBe(true);
    expect(ACTIVITY_METHOD_NOT_ALLOWED_BODY.error.code).toBe('ACTIVITY_METHOD_NOT_ALLOWED');
    expect(ACTIVITY_METHOD_NOT_ALLOWED_BODY.error.message).toBe('this endpoint only supports GET');
    expect(ACTIVITY_RATE_LIMITED_BODY.error.code).toBe('ACTIVITY_RATE_LIMITED');
    expect(ACTIVITY_RATE_LIMITED_BODY.error.message).toBe('too many requests, try again shortly');
    expect(ACTIVITY_NOT_FOUND_BODY.error.code).toBe('ACTIVITY_NOT_FOUND');
    expect(ACTIVITY_NOT_FOUND_BODY.error.message).toBe('no such activity endpoint');
  });

  it('are the identical object on every access (no per-request construction)', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const again = require('../src/hardening/activityHardening');
    expect(again.ACTIVITY_METHOD_NOT_ALLOWED_BODY).toBe(ACTIVITY_METHOD_NOT_ALLOWED_BODY);
    expect(again.ACTIVITY_RATE_LIMITED_BODY).toBe(ACTIVITY_RATE_LIMITED_BODY);
    expect(again.ACTIVITY_NOT_FOUND_BODY).toBe(ACTIVITY_NOT_FOUND_BODY);
  });
});

describe('legacyCorsGuard (AC-7 legacy half, AC-2 hermeticity)', () => {
  // The same wildcard cors() instance index.ts mounts, behind a spy.
  const wildcard = cors();
  const wildcardSpy = jest.fn((req, res, next) => wildcard(req, res, next));
  const app = express();
  app.use(legacyCorsGuard(wildcardSpy));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/entity', (_req, res) => res.json({ ok: true }));
  app.get('/activityfoo', (_req, res) => res.json({ ok: true }));

  async function hit(path: string) {
    wildcardSpy.mockClear();
    const res = await request(app).get(path);
    return { res, called: wildcardSpy.mock.calls.length > 0 };
  }

  it.each(['/health', '/entity'])(
    'delegates %s untouched to the wildcard (ACAO: * survives)',
    async (path) => {
      const { res, called } = await hit(path);
      expect(called).toBe(true);
      expect(res.headers['access-control-allow-origin']).toBe('*');
    },
  );

  it.each(['/activity', '/activity/x'])(
    'skips the wildcard entirely for %s (never wildcarded there)',
    async (path) => {
      const { res, called } = await hit(path);
      expect(called).toBe(false);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    },
  );

  it('does not skip the wildcard for /activityfoo (probe fact (g): different segment)', async () => {
    const { res, called } = await hit('/activityfoo');
    expect(called).toBe(true);
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
