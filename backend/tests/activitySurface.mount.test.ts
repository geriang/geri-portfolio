import fs from 'fs';
import os from 'os';
import path from 'path';
import cors from 'cors';
import express from 'express';
import request from 'supertest';
import activityRouter, { createActivityRouter } from '../src/activity/activityRouter';
import { legacyCorsGuard } from '../src/hardening/activitySurface';
import { ENV_ALLOWED_ORIGINS } from '../src/hardening/activityHardening';
import { seedActivityDb } from './fixtures/activitySeed';
import { ALLOWED_ORIGINS_ENV_VALUE, ORIGIN_ALLOWED_A } from './fixtures/publicSurfaceFixtures';

/**
 * Structural + behavioural proof for the US-5 production wiring in
 * src/index.ts and the hardened default export of src/activity/activityRouter.
 * Like activityMount.test.ts this file never imports src/index.ts itself (it
 * would call app.listen and open the legacy portfolio DB) — it reads the
 * source text and composes the same mounts locally.
 */

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us5-mount-'));
const dbPath = path.join(tmpRoot, 'activity.db');
seedActivityDb({ dbPath, days: 15 });

const originalDbPath = process.env.ACTIVITY_DB_PATH;
const originalOrigins = process.env[ENV_ALLOWED_ORIGINS];

beforeEach(() => {
  process.env.ACTIVITY_DB_PATH = dbPath; // the unbound default export resolves it per request
  process.env[ENV_ALLOWED_ORIGINS] = ALLOWED_ORIGINS_ENV_VALUE;
});

afterEach(() => {
  if (originalDbPath === undefined) delete process.env.ACTIVITY_DB_PATH;
  else process.env.ACTIVITY_DB_PATH = originalDbPath;
  if (originalOrigins === undefined) delete process.env[ENV_ALLOWED_ORIGINS];
  else process.env[ENV_ALLOWED_ORIGINS] = originalOrigins;
});

describe('activitySurface.mount (a): src/index.ts text', () => {
  const indexText = fs.readFileSync(path.join(__dirname, '../src/index.ts'), 'utf8');

  it('turns trust proxy on and guards the legacy wildcard cors', () => {
    expect(indexText).toContain("app.set('trust proxy'");
    expect(indexText).toContain('legacyCorsGuard(cors())');
    expect(indexText).toContain("from './hardening/activitySurface'");
  });

  it('keeps exactly one /activity mount, still positioned after the legacy routes', () => {
    expect(indexText.match(/app\.use\('\/activity'/g)?.length).toBe(1);
    const activityAt = indexText.indexOf("app.use('/activity'");
    for (const legacy of ["app.use('/static-data'", "app.use('/entity'", "app.use('/chat'"]) {
      expect(indexText).toContain(legacy);
      expect(indexText.indexOf(legacy)).toBeLessThan(activityAt);
    }
    expect(indexText).toContain("app.get('/health'");
    expect(indexText.indexOf("app.get('/health'")).toBeLessThan(activityAt);
  });
});

describe('activitySurface.mount (b): hardened default export vs raw factory', () => {
  function mountedLikeIndex(router: express.Router) {
    const app = express();
    app.use('/activity', router);
    return app;
  }

  it('the hardened default export answers 200 + nosniff and 405 like the design', async () => {
    const app = mountedLikeIndex(activityRouter);
    const ok = await request(app).get('/activity');
    expect(ok.status).toBe(200);
    expect(ok.headers['x-content-type-options']).toBe('nosniff');
    const probe = await request(app).post('/activity');
    expect(probe.status).toBe(405);
    expect(probe.headers.allow).toBe('GET, OPTIONS');
  });

  it('the raw createActivityRouter factory still answers with NO helmet headers (timing-suite immunity)', async () => {
    const app = mountedLikeIndex(createActivityRouter({ dbPath }));
    const res = await request(app).get('/activity');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBeUndefined();
    expect(res.headers['x-powered-by']).toBe('Express');
  });
});

describe('activitySurface.mount (c): source scan of src/hardening/*.ts', () => {
  const srcDir = path.join(__dirname, '../src/hardening');
  const files = fs.readdirSync(srcDir).filter((name) => name.endsWith('.ts'));

  it('covers the three planned modules', () => {
    expect(files.sort()).toEqual([
      'activityHardening.ts',
      'activitySurface.ts',
      'publicActivityApp.ts',
    ]);
  });

  it.each(files)('%s stays silent, path-free and legacy-DB-free', (name) => {
    const text = fs.readFileSync(path.join(srcDir, name), 'utf8');
    expect(text).not.toContain('__dirname');
    expect(text).not.toContain("from '../db'");
    expect(text).not.toContain("require('../db')");
    expect(text).not.toContain('console.');
    const valueImport = /\bimport\s+(?!type\b)[\s\S]{0,120}?\bfrom\s+['"]better-sqlite3['"]/.test(
      text,
    );
    expect(valueImport).toBe(false);
  });
});

describe('activitySurface.mount (d): legacy behaviour pin (probe fact (h))', () => {
  const app = express();
  app.use(legacyCorsGuard(cors()));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  it('a /health-like legacy route keeps wildcard ACAO and X-Powered-By', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['x-powered-by']).toBe('Express');
  });

  it('the same legacy route with an Origin still answers wildcard, not allowlist', async () => {
    const res = await request(app).get('/health').set('Origin', ORIGIN_ALLOWED_A);
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
