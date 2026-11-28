import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Express } from 'express';
import request from 'supertest';
import {
  ACTIVITY_RATE_LIMITED_BODY,
  ENV_RATE_LIMIT_PER_MINUTE,
  RATE_LIMIT_MAX_REQUESTS_PER_MINUTE,
  RATE_LIMIT_WINDOW_MS,
} from '../src/hardening/activityHardening';
import { createHardenedActivityApp } from '../src/hardening/publicActivityApp';
import { seedActivityDb } from './fixtures/activitySeed';
import { CLIENT_IP_A, CLIENT_IP_B, PROXY_IP } from './fixtures/publicSurfaceFixtures';

/**
 * AC-4: 60 requests per rolling minute per client IP, keyed through trust
 * proxy (spoofed X-Forwarded-For burst). Sequential awaited supertest
 * requests, statuses captured in order. Window recovery uses the probe-stable
 * sleep-past-Retry-After recipe — never a wall-clock assumption.
 */

jest.setTimeout(120_000);

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us5-rate-'));
let dbCounter = 0;
function freshDbPath(): string {
  return path.join(tmpRoot, `activity-${dbCounter++}.db`);
}

const originalRateLimit = process.env[ENV_RATE_LIMIT_PER_MINUTE];

afterEach(() => {
  if (originalRateLimit === undefined) delete process.env[ENV_RATE_LIMIT_PER_MINUTE];
  else process.env[ENV_RATE_LIMIT_PER_MINUTE] = originalRateLimit;
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function get(app: Express, xff?: string) {
  const call = request(app).get('/activity');
  return xff === undefined ? call : call.set('X-Forwarded-For', xff);
}

describe('AC-4: fixed-window limiter per client IP behind trust proxy', () => {
  it('pins the backlog figures on the policy constants', () => {
    expect(RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(RATE_LIMIT_MAX_REQUESTS_PER_MINUTE).toBe(60);
  });

  it('62 sequential spoofed-XFF requests: first 60 are 200s, #61/#62 are frozen 429s', async () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 15 });
    const app = createHardenedActivityApp({ dbPath });

    const statuses: number[] = [];
    const successes: number[] = [];
    for (let i = 0; i < 60; i += 1) {
      const res = await get(app, CLIENT_IP_A);
      statuses.push(res.status);
      if (res.status === 200 && Array.isArray(res.body.rows)) {
        successes.push(i);
      }
    }
    expect(statuses).toEqual(Array(60).fill(200));
    expect(successes.length).toBe(60); // earlier successful responses unaffected

    const limited: request.Response[] = [];
    for (let i = 60; i < 62; i += 1) {
      const res = await get(app, CLIENT_IP_A);
      statuses.push(res.status);
      limited.push(res);
    }
    expect(statuses.slice(60)).toEqual([429, 429]);

    for (const res of limited) {
      expect(res.body).toEqual(ACTIVITY_RATE_LIMITED_BODY);
      expect(res.text).toBe(JSON.stringify(ACTIVITY_RATE_LIMITED_BODY));
      const retryAfter = Number(res.headers['retry-after']);
      expect(Number.isInteger(retryAfter)).toBe(true);
      expect(retryAfter).toBeGreaterThanOrEqual(1);
      expect(retryAfter).toBeLessThanOrEqual(60);
      // draft-7 standard headers on, legacy X-RateLimit-* off
      expect(res.headers.ratelimit).toBeDefined();
      expect(String(res.headers.ratelimit)).toContain('limit=60');
      expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    }
  });

  it('other client keys keep 200s during exhaustion; a two-hop XFF chain keys on the leftmost IP', async () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 15 });
    const app = createHardenedActivityApp({ dbPath });

    for (let i = 0; i < 60; i += 1) {
      expect((await get(app, CLIENT_IP_A)).status).toBe(200);
    }
    expect((await get(app, CLIENT_IP_A)).status).toBe(429); // definitely exhausted

    // second documentation IP: independent window
    expect((await get(app, CLIENT_IP_B)).status).toBe(200);
    // the no-XFF peer (direct connection): its own key, not the proxy's
    expect((await get(app)).status).toBe(200);
    // two-hop chain ending at the proxy: keys on the leftmost client IP,
    // i.e. the exhausted CLIENT_IP_A — proving it never collapses onto the
    // proxy's own address
    expect((await get(app, `${CLIENT_IP_A}, ${PROXY_IP}`)).status).toBe(429);
    // and the same shape behind the proxy's own leftmost address still works
    expect((await get(app, `${CLIENT_IP_B}, ${PROXY_IP}`)).status).toBe(200);
  });

  it('the window passes: burst a tiny window, sleep Retry-After + 200 ms, get 200 again', async () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 15 });
    const app = createHardenedActivityApp({ dbPath, rateLimit: { windowMs: 1000, max: 5 } });

    let limited: request.Response | undefined;
    for (let i = 0; i < 6; i += 1) {
      const res = await get(app, CLIENT_IP_A);
      if (res.status === 429) {
        limited = res;
        break;
      }
      expect(res.status).toBe(200);
    }
    expect(limited).toBeDefined();
    const retryAfter = Number(limited!.headers['retry-after']);
    expect(Number.isInteger(retryAfter)).toBe(true);
    await sleep(retryAfter * 1000 + 200);
    expect((await get(app, CLIENT_IP_A)).status).toBe(200);
  });

  it('ACTIVITY_RATE_LIMIT_PER_MINUTE=3 overrides the default on a fresh app', async () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 15 });
    process.env[ENV_RATE_LIMIT_PER_MINUTE] = '3';
    const app = createHardenedActivityApp({ dbPath });

    for (let i = 0; i < 3; i += 1) {
      expect((await get(app, CLIENT_IP_A)).status).toBe(200);
    }
    const res = await get(app, CLIENT_IP_A);
    expect(res.status).toBe(429);
    expect(res.body).toEqual(ACTIVITY_RATE_LIMITED_BODY);
  });
});
