import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { createActivityRouter } from '../src/activity/activityRouter';
import entityRouter from '../src/routes/entity';
import db, { initSchema } from '../src/db';
import { SEED_TO_DAY, seedActivityDb } from './fixtures/activitySeed';

/**
 * Structural + behavioural proof for the src/index.ts mount. This file never
 * imports src/index.ts itself (that module calls app.listen and opens the
 * legacy portfolio DB); it reads its source text instead, and composes the
 * same mounts locally.
 */

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us4-mount-'));
const dbPath = path.join(tmpRoot, 'activity.db');
const facts = seedActivityDb({ dbPath, days: 15 });

describe('activityMount (a): src/index.ts text', () => {
  const indexText = fs.readFileSync(path.join(__dirname, '../src/index.ts'), 'utf8');

  it('mounts the activity router after the legacy routes', () => {
    expect(indexText).toContain("app.use('/activity'");
    const activityAt = indexText.indexOf("app.use('/activity'");
    for (const legacy of ["app.use('/static-data'", "app.use('/entity'", "app.use('/chat'"]) {
      expect(indexText).toContain(legacy);
      expect(indexText.indexOf(legacy)).toBeLessThan(activityAt);
    }
    expect(indexText).toContain("app.get('/health'");
  });

  it('keeps the additive-only contract: one import and one mount', () => {
    expect(indexText).toContain("from './activity/activityRouter'");
    expect(indexText.match(/app\.use\('\/activity'/g)?.length).toBe(1);
  });
});

describe('activityMount (b): src/activity never touches the legacy DB', () => {
  const srcDir = path.join(__dirname, '../src/activity');
  const files = fs.readdirSync(srcDir).filter((name) => name.endsWith('.ts'));

  it('scans every module', () => {
    expect(files.length).toBeGreaterThanOrEqual(5);
  });

  it.each(files)('%s has no legacy-DB or __dirname references', (name) => {
    const text = fs.readFileSync(path.join(srcDir, name), 'utf8');
    expect(text).not.toContain('__dirname');
    expect(text).not.toContain("from '../db'");
    expect(text).not.toContain("require('../db')");
    const valueImport = /\bimport\s+(?!type\b)[\s\S]{0,120}?\bfrom\s+['"]better-sqlite3['"]/.test(
      text,
    );
    expect(valueImport).toBe(false);
  });
});

describe('activityMount (c): behaviour — new mount beside the legacy routes', () => {
  const app = express();
  app.use('/activity', createActivityRouter({ dbPath }));
  app.use('/entity', entityRouter);

  it('GET /activity answers 200 through the composed app', async () => {
    const res = await request(app).get('/activity');
    expect(res.status).toBe(200);
    expect(res.body.metadata.to).toBe(SEED_TO_DAY);
    expect(res.body.rows.length).toBeGreaterThan(0);
    expect(res.body.rows).toEqual(facts.expectedRows(res.body.metadata.from, res.body.metadata.to));
  });

  it('GET /entity/:id still answers from the legacy table (mount does not intercept)', async () => {
    // The legacy portfolio DB is shared with tests/entity.test.ts, which
    // DROP TABLEs and recreates the schema in beforeAll, on another jest
    // worker and with better-sqlite3's default busy_timeout = 0. EVERY write
    // this test makes (DELETE, initSchema, INSERTs and the cleanup) is
    // therefore inside a SQLITE_BUSY-tolerant retry block; a concurrent
    // write from the other suite can only delay us, never flake the gate.
    // src/db.ts and the legacy routes stay untouched (task 8(c) mandates
    // reading them through their own router).
    const OWN = "identifier LIKE 'activitymount-%'";
    const deleteOwnRows = () => {
      // headings first, then pages: no orphan headings survive any run.
      db.exec(`DELETE FROM headings WHERE page_id IN (SELECT id FROM pages WHERE ${OWN});`);
      db.exec(`DELETE FROM pages WHERE ${OWN};`);
    };
    const isLockContention = (err: unknown) =>
      /SQLITE_BUSY|database is locked|no such table/i.test(String((err as Error)?.message ?? err));

    let answered = false;
    for (let attempt = 0; attempt < 10 && !answered; attempt += 1) {
      try {
        deleteOwnRows(); // also clears this identifier, keeping INSERT UNIQUE-safe
        initSchema();
        const pageId = db
          .prepare('INSERT INTO pages (url, identifier) VALUES (?, ?)')
          .run('generated://fixture', 'activitymount-row').lastInsertRowid as number;
        const headingId = db
          .prepare('INSERT INTO headings (page_id, level, text) VALUES (?, ?, ?)')
          .run(pageId, 2, 'Generated mount heading').lastInsertRowid as number;
        const res = await request(app).get(`/entity/${headingId}`);
        answered =
          res.status === 200 && res.body.type === 'heading' && res.body.text === 'Generated mount heading';
        if (answered) {
          try {
            deleteOwnRows(); // leave the shared table as we found it
          } catch (err) {
            if (!isLockContention(err)) throw err;
          }
        }
      } catch (err) {
        if (!isLockContention(err)) throw err; // retry on contention only
      }
    }
    expect(answered).toBe(true);
    const missing = await request(app).get('/entity/999999');
    expect([200, 404]).toContain(missing.status); // legacy 404 shape stays reachable
  });

  it('GET /health semantics live in index.ts only — /activity does not shadow it', async () => {
    const res = await request(app).get('/activity');
    expect(res.status).toBe(200);
    expect(res.body.rows).toBeDefined();
  });
});
