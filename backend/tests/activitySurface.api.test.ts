import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import express from 'express';
import request from 'supertest';
import { createActivityRouter } from '../src/activity/activityRouter';
import { buildHardenedRouter } from '../src/hardening/activitySurface';
import {
  ACTIVITY_METHOD_NOT_ALLOWED_BODY,
  ACTIVITY_NOT_FOUND_BODY,
  ALLOW_HEADER_VALUE,
  ENV_ALLOWED_ORIGINS,
  ENV_RATE_LIMIT_PER_MINUTE,
} from '../src/hardening/activityHardening';
import { createHardenedActivityApp } from '../src/hardening/publicActivityApp';
import { SEED_TO_DAY, seedActivityDb } from './fixtures/activitySeed';
import {
  ALLOWED_ORIGINS_ENV_VALUE,
  ORIGIN_ALLOWED_A,
  ORIGIN_ALLOWED_B,
  ORIGIN_DENIED,
} from './fixtures/publicSurfaceFixtures';

/**
 * US-5 contract suite (AC-1, AC-2, AC-3) over createHardenedActivityApp —
 * the supertest vehicle that replicates the src/index.ts composition — on a
 * real seeded SQLite file written through the US-4 seeder's real write path.
 * Env save/restore convention from tests/activityDb.test.ts.
 */

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us5-api-'));
let dbCounter = 0;
function freshDbPath(): string {
  return path.join(tmpRoot, `activity-${dbCounter++}.db`);
}

const originalOrigins = process.env[ENV_ALLOWED_ORIGINS];
const originalRateLimit = process.env[ENV_RATE_LIMIT_PER_MINUTE];

function setEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  setEnv(ENV_ALLOWED_ORIGINS, originalOrigins);
  setEnv(ENV_RATE_LIMIT_PER_MINUTE, originalRateLimit);
});

/** Inert generated probe body — never read by any activity handler. */
function junkBody(): Record<string, unknown> {
  return { rows: [{ day_local: '2026-11-27', prompt_count: 999 }] };
}

function usageEventCount(dbPath: string): number {
  const db = new Database(dbPath, { readonly: true });
  try {
    return (db.prepare('SELECT COUNT(*) AS count FROM usage_event').get() as { count: number })
      .count;
  } finally {
    db.close();
  }
}

/** US-4-honest sidecar postconditions (activityReadOnly.test.ts pattern). */
function assertSidecarsQuiet(dbPath: string): void {
  for (const [suffix, size] of [
    ['-wal', 0],
    ['-shm', 32768],
  ] as const) {
    const sidecar = `${dbPath}${suffix}`;
    if (!fs.existsSync(sidecar)) {
      continue;
    }
    expect({ suffix, size: fs.statSync(sidecar).size }).toEqual({ suffix, size });
  }
}

function assertNoCorsWildcard(res: request.Response, label: string): void {
  const offenders = Object.entries(res.headers)
    .filter(([name]) => name.startsWith('access-control-'))
    .flatMap(([name, value]) =>
      (Array.isArray(value) ? value : [value]).map((v) => ({
        label,
        name,
        value: String(v),
      })),
    )
    .filter((entry) => entry.value.includes('*'));
  expect(offenders).toEqual([]);
}

describe('AC-1: method lock — POST/PUT/PATCH/DELETE /activity are 405, nothing runs', () => {
  const dbPath = freshDbPath();
  const facts = seedActivityDb({ dbPath, days: 15 });
  const seededCount = usageEventCount(dbPath);
  const bytesBefore = fs.readFileSync(dbPath);
  beforeEach(() => {
    setEnv(ENV_ALLOWED_ORIGINS, ALLOWED_ORIGINS_ENV_VALUE);
  });
  const app = createHardenedActivityApp({ dbPath });

  const probes = ['post', 'put', 'patch', 'delete'] as const;

  it.each(probes)('%s /activity → 405 + Allow + frozen body, byte-identical', async (method) => {
    const res = await request(app)
      [method]('/activity')
      .set('Origin', ORIGIN_ALLOWED_A)
      .send(junkBody());
    expect(res.status).toBe(405);
    expect(res.headers.allow).toBe(ALLOW_HEADER_VALUE);
    expect(res.body).toEqual(ACTIVITY_METHOD_NOT_ALLOWED_BODY);
    expect(res.text).toBe(JSON.stringify(ACTIVITY_METHOD_NOT_ALLOWED_BODY));
  });

  it('leaves the database unchanged after all four write probes', () => {
    expect(usageEventCount(dbPath)).toBe(seededCount);
    expect(fs.readFileSync(dbPath).equals(bytesBefore)).toBe(true);
    assertSidecarsQuiet(dbPath);
    // the seed really did put rows in, so "unchanged" is not vacuous
    expect(seededCount).toBe(facts.rows.length);
  });

  it('GET /activity keeps answering 200 with rows present', async () => {
    const res = await request(app).get('/activity');
    expect(res.status).toBe(200);
    expect(res.body.metadata.to).toBe(SEED_TO_DAY);
    expect(res.body.rows.length).toBeGreaterThan(0);
  });

  it('OPTIONS /activity answers within the CORS policy (204, ACAO = allowed origin)', async () => {
    const res = await request(app).options('/activity').set('Origin', ORIGIN_ALLOWED_A);
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN_ALLOWED_A);
  });
});

describe('AC-2: CORS allowlist from env, deny by default, wildcard never on /activity', () => {
  const dbPath = freshDbPath();
  seedActivityDb({ dbPath, days: 15 });

  const captured: Array<{ label: string; res: request.Response }> = [];
  function capture(label: string, res: request.Response): request.Response {
    captured.push({ label, res });
    return res;
  }

  it('allowed origins get ACAO set to exactly that origin', async () => {
    setEnv(ENV_ALLOWED_ORIGINS, ALLOWED_ORIGINS_ENV_VALUE);
    const app = createHardenedActivityApp({ dbPath });
    const a = await request(app).get('/activity').set('Origin', ORIGIN_ALLOWED_A);
    expect(a.status).toBe(200);
    expect(a.headers['access-control-allow-origin']).toBe('https://portfolio.example.com');
    capture('full:200:allowed-a', a);
    const b = await request(app).get('/activity').set('Origin', ORIGIN_ALLOWED_B);
    expect(b.headers['access-control-allow-origin']).toBe('https://api.example.com');
  });

  it('a denied origin, no Origin header, a case-variant and an unset allowlist all get no ACAO', async () => {
    setEnv(ENV_ALLOWED_ORIGINS, ALLOWED_ORIGINS_ENV_VALUE);
    const app = createHardenedActivityApp({ dbPath });
    const denied = await request(app).get('/activity').set('Origin', ORIGIN_DENIED);
    expect(denied.status).toBe(200);
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
    const noOrigin = await request(app).get('/activity');
    expect(noOrigin.headers['access-control-allow-origin']).toBeUndefined();
    const caseVariant = await request(app)
      .get('/activity')
      .set('Origin', ORIGIN_ALLOWED_A.replace('portfolio', 'PORTFOLIO'));
    expect(caseVariant.headers['access-control-allow-origin']).toBeUndefined();
    // deny-by-default: with the allowlist env deleted even a known origin gets nothing
    setEnv(ENV_ALLOWED_ORIGINS, undefined);
    const noAllowlist = await request(app).get('/activity').set('Origin', ORIGIN_ALLOWED_A);
    expect(noAllowlist.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('every captured /activity response class carries no wildcard on any access-control-* header', async () => {
    // full composition (guarded wildcard cors present, like index.ts)
    setEnv(ENV_ALLOWED_ORIGINS, ALLOWED_ORIGINS_ENV_VALUE);
    const full = createHardenedActivityApp({ dbPath });
    capture('full:200', await request(full).get('/activity').set('Origin', ORIGIN_ALLOWED_A));
    capture('full:405', await request(full).post('/activity').set('Origin', ORIGIN_ALLOWED_A).send(junkBody()));
    capture('full:204-preflight', await request(full).options('/activity').set('Origin', ORIGIN_ALLOWED_A));
    capture('full:204-bare-options', await request(full).options('/activity'));
    capture('full:404', await request(full).get('/activity/entity').set('Origin', ORIGIN_ALLOWED_A));

    // bare hardened composition (no legacy wildcard middleware at all)
    const bare = express();
    bare.use('/activity', buildHardenedRouter(() => createActivityRouter({ dbPath })));
    capture('bare:200', await request(bare).get('/activity').set('Origin', ORIGIN_ALLOWED_A));
    capture('bare:405', await request(bare).put('/activity').send(junkBody()));
    capture('bare:404', await request(bare).get('/activity/chat'));

    // a tiny-window app supplies the 429 class on both compositions
    for (const [kind, make] of [
      ['full', (d: string, r: { max: number }) => createHardenedActivityApp({ dbPath: d, rateLimit: r })],
      ['bare', (d: string, r: { max: number }) => {
        const app = express();
        app.use('/activity', buildHardenedRouter(() => createActivityRouter({ dbPath: d }), { rateLimit: r }));
        return app;
      }],
    ] as const) {
      const tinyDb = freshDbPath();
      seedActivityDb({ dbPath: tinyDb, days: 15 });
      const app = make(tinyDb, { max: 2 });
      capture(`${kind}:429:a`, await request(app).get('/activity').set('Origin', ORIGIN_ALLOWED_A));
      capture(`${kind}:429:b`, await request(app).get('/activity').set('Origin', ORIGIN_ALLOWED_A));
      capture(`${kind}:429:limited`, await request(app).get('/activity').set('Origin', ORIGIN_ALLOWED_A));
    }

    expect(captured.length).toBeGreaterThanOrEqual(13);
    const classes = new Set(captured.map((c) => c.res.status));
    for (const status of [200, 204, 404, 405, 429]) {
      expect(classes).toContain(status);
    }
    for (const { label, res } of captured) {
      assertNoCorsWildcard(res, label);
    }
  });
});

describe('AC-3: helmet headers on every /activity response; no path or db name anywhere', () => {
  const dbPath = freshDbPath();
  seedActivityDb({ dbPath, days: 15 });
  beforeEach(() => {
    setEnv(ENV_ALLOWED_ORIGINS, ALLOWED_ORIGINS_ENV_VALUE);
  });
  const app = createHardenedActivityApp({ dbPath, rateLimit: { max: 3 } });

  const helmetHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
    'strict-transport-security',
    'x-dns-prefetch-control',
    'x-download-options',
  ];

  /** forbidden: the scratch path and generic filesystem/DB-name fragments */
  const forbidden = [dbPath, 'activity.db', 'node_modules', '/root', '/home', '/workspace', '/tmp'];

  function assertClean(res: request.Response): void {
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    for (const name of helmetHeaders) {
      expect(res.headers[name]).toBeDefined();
    }
    // CSP off by design decision 5 (JSON-only surface)
    expect(res.headers['content-security-policy']).toBeUndefined();
    for (const value of Object.values(res.headers).flatMap((v) =>
      Array.isArray(v) ? v.map(String) : [String(v)],
    )) {
      for (const needle of forbidden) {
        expect(value).not.toContain(needle);
      }
    }
    for (const needle of forbidden) {
      expect(res.text ?? '').not.toContain(needle);
    }
  }

  it('GET /activity (200) answers with the helmet set and no paths', async () => {
    assertClean(await request(app).get('/activity').set('Origin', ORIGIN_ALLOWED_A));
  });

  it('the 405 answers with the helmet set and no paths', async () => {
    const res = await request(app)
      .delete('/activity')
      .set('Origin', ORIGIN_ALLOWED_A)
      .send(junkBody());
    expect(res.status).toBe(405);
    assertClean(res);
  });

  it('the terminal 404 answers with the helmet set and no paths', async () => {
    const res = await request(app).get('/activity/entity');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(ACTIVITY_NOT_FOUND_BODY);
    assertClean(res);
  });

  it('the 429 answers with the helmet set and no paths', async () => {
    // tiny-window app (max 3): the 4th request is the throttled one
    const res = await request(app).get('/activity');
    expect(res.status).toBe(429);
    assertClean(res);
  });
});
