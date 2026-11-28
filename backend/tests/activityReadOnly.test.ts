import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import express from 'express';
import request from 'supertest';
import { initActivitySchema } from '../src/import/activityDb';
import {
  ACTIVITY_READ_OPTIONS,
  openActivityView,
} from '../src/activity/activityRepository';
import { createActivityRouter } from '../src/activity/activityRouter';
import { SEED_TO_DAY, SeedFacts, seedActivityDb } from './fixtures/activitySeed';

/**
 * AC-5 enforcement: the API's connection is opened read-only through the
 * reused importer helper, issues read statements only and can neither write
 * rows nor create, migrate or otherwise touch the schema.
 */

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us4-ro-'));
let dbCounter = 0;
function freshDbPath(): string {
  return path.join(tmpRoot, `activity-${dbCounter++}.db`);
}

function composedApp(dbPath: string) {
  const app = express();
  app.use('/activity', createActivityRouter({ dbPath }));
  return app;
}

function usageEventRowCount(dbPath: string): number {
  const db = openActivityView(dbPath);
  try {
    return (db.prepare('SELECT COUNT(*) AS count FROM usage_event').get() as { count: number })
      .count;
  } finally {
    db.close();
  }
}

describe('AC-5(a): the single open-mode constant', () => {
  it('is exactly { readonly: true }', () => {
    expect(ACTIVITY_READ_OPTIONS).toEqual({ readonly: true });
    expect(Object.isFrozen(ACTIVITY_READ_OPTIONS)).toBe(true);
  });
});

describe('AC-5(b)-(c): the route connection cannot write', () => {
  const dbPath = freshDbPath();
  const facts = seedActivityDb({ dbPath, days: 10 });
  const before = usageEventRowCount(dbPath);

  it('opens the view with readonly === true', () => {
    const db = openActivityView(dbPath);
    try {
      expect(db.readonly).toBe(true);
    } finally {
      db.close();
    }
  });

  it('rejects INSERT, UPDATE, DELETE and CREATE TABLE through the view', () => {
    const db = openActivityView(dbPath);
    try {
      expect(() =>
        db
          .prepare(
            'INSERT INTO usage_event (tool, source_id, occurred_at_utc, day_local, ' +
              'input_tokens, output_tokens, prompt_count, model, task_type) ' +
              "VALUES ('fixture-tool-a', 'zz-attempt', '2026-11-27T04:00:00Z', " +
              "'2026-11-27', 1, 1, 1, 'fixture-model-a', 'Uncategorised')",
          )
          .run(),
      ).toThrow(/readonly/i);
      expect(() =>
        db.prepare('UPDATE usage_event SET input_tokens = 0 WHERE id > 0').run(),
      ).toThrow(/readonly/i);
      expect(() => db.prepare('DELETE FROM usage_event WHERE id > 0').run()).toThrow(/readonly/i);
      expect(() => db.prepare('CREATE TABLE zz (x)').run()).toThrow(/readonly/i);
    } finally {
      db.close();
    }
    expect(usageEventRowCount(dbPath)).toBe(before);
    expect(facts.rows.length).toBeGreaterThan(0);
  });

  it('leaves the file byte-identical when the importer schema setup runs through the view', () => {
    // Probe-verified: every schema statement is IF NOT EXISTS on objects that
    // already exist, so SQLite attempts no write and the file cannot change.
    // "Never creates or migrates schema" is proven here for the file and by
    // the source scan (g) for the code.
    const bytesBefore = fs.readFileSync(dbPath);
    const db = openActivityView(dbPath);
    try {
      initActivitySchema(db);
    } finally {
      db.close();
    }
    expect(fs.readFileSync(dbPath)).toEqual(bytesBefore);
  });
});

describe('AC-5(d): the route opens through the reused helper, read-only', () => {
  it('calls openActivityDb with readonly: true for every GET /activity', async () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 10 });
    // ts-jest compiles named imports to property access, so the spy intercepts.
    const spy = jest.spyOn(require('../src/import/activityDb'), 'openActivityDb');
    try {
      const res = await request(composedApp(dbPath)).get('/activity');
      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ readonly: true }));
      expect(spy).toHaveBeenCalled();
      for (const call of spy.mock.calls) {
        const arg = call[0] as { readonly?: unknown } | undefined;
        expect(arg?.readonly).toBe(true);
      }
    } finally {
      spy.mockRestore();
    }
  });
});

describe('AC-5(e): a reader beside an open writer', () => {
  it('serves the last committed snapshot while a writer holds a transaction', async () => {
    const dbPath = freshDbPath();
    const facts = seedActivityDb({ dbPath, days: 20 });
    const writer = new Database(dbPath);
    // The writer opens (and creates -shm) BEFORE the reader — the normal
    // state, since runImport checkpoints and closes at the end of every run.
    writer.exec('BEGIN IMMEDIATE');
    writer
      .prepare(
        'INSERT INTO usage_event (tool, source_id, occurred_at_utc, day_local, ' +
          'input_tokens, output_tokens, prompt_count, model, task_type) ' +
          "VALUES ('fixture-tool-z', 'uncommitted-sentinel', ? , " +
          "'2026-11-27', 999, 999, 9, 'fixture-model-a', 'Uncategorised')",
      )
      .run(`${SEED_TO_DAY}T04:00:00Z`);
    try {
      const res = await request(composedApp(dbPath)).get(
        '/activity?from=2026-11-08&to=2026-11-27',
      );
      expect(res.status).toBe(200);
      // pre-transaction rows only: the uncommitted sentinel is invisible.
      expect(res.body.rows).toEqual(facts.expectedRows('2026-11-08', '2026-11-27'));
    } finally {
      writer.exec('ROLLBACK');
      writer.close();
    }
  });
});

describe('AC-5(f): the file is untouched by serving (numbers only)', () => {
  /** Absent passes; a present sidecar must have exactly this size (spec 5(f)). */
  function sizeIsAbsentOr(dbPath: string, suffix: '-wal' | '-shm', size: number): void {
    const sidecar = `${dbPath}${suffix}`;
    if (!fs.existsSync(sidecar)) {
      return;
    }
    expect({ suffix, size: fs.statSync(sidecar).size }).toEqual({ suffix, size });
  }

  it('is byte-identical after 20 requests; -wal absent-or-0 bytes, -shm absent-or-32768 bytes', async () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 10 });
    sizeIsAbsentOr(dbPath, '-wal', 0);
    sizeIsAbsentOr(dbPath, '-shm', 32768);
    const bytesBefore = fs.readFileSync(dbPath);
    const app = composedApp(dbPath);
    for (let i = 0; i < 20; i += 1) {
      const res = await request(app).get('/activity');
      expect(res.status).toBe(200);
    }
    // (i) the main db file is byte-identical; (ii) no WAL growth; (iii) the
    // wal-index is only ever the fixed 32 KiB page SQLite maps in.
    expect(fs.readFileSync(dbPath)).toEqual(bytesBefore);
    sizeIsAbsentOr(dbPath, '-wal', 0);
    sizeIsAbsentOr(dbPath, '-shm', 32768);
  });
});

describe('AC-5(g): source scan of src/activity/*.ts', () => {
  const srcDir = path.join(__dirname, '../src/activity');
  const files = fs.readdirSync(srcDir).filter((name) => name.endsWith('.ts'));

  const FORBIDDEN: Array<[string, RegExp]> = [
    ['INSERT', /\bINSERT\b/i],
    ['UPDATE', /\bUPDATE\b/i],
    ['DELETE', /\bDELETE\b/i],
    ['CREATE TABLE', /\bCREATE TABLE\b/i],
    ['DROP', /\bDROP\s/i],
    ['ALTER', /\bALTER\b/i],
    ['PRAGMA', /\bPRAGMA\b/i],
    ['initActivitySchema', /initActivitySchema/],
    ['__dirname', /__dirname/],
  ];

  it('covers the expected modules', () => {
    expect(files.sort()).toEqual([
      'activityErrors.ts',
      'activityRepository.ts',
      'activityRouter.ts',
      'activityService.ts',
      'timeRange.ts',
    ]);
  });

  it.each(files)('%s contains no write, schema or legacy-path statement', (name) => {
    const text = fs.readFileSync(path.join(srcDir, name), 'utf8');
    for (const [label, pattern] of FORBIDDEN) {
      expect({ name, label, hit: pattern.test(text) }).toEqual({ name, label, hit: false });
    }
  });

  it.each(files)('%s imports better-sqlite3 type-only at most', (name) => {
    const text = fs.readFileSync(path.join(srcDir, name), 'utf8');
    const valueImport = /\bimport\s+(?!type\b)[\s\S]{0,120}?\bfrom\s+['"]better-sqlite3['"]/.test(
      text,
    );
    expect(valueImport).toBe(false);
  });

  it.each(files)('%s keeps SELECT inside the two exported SQL constants only', (name) => {
    const text = fs.readFileSync(path.join(srcDir, name), 'utf8');
    const withoutSqlConstants = text.replace(
      /export const (LAST_SUCCESS_RUN_SQL|GROUPED_ROWS_SQL)\s*=\s*`[\s\S]*?`;/g,
      '',
    );
    expect(/\bSELECT\b/i.test(withoutSqlConstants)).toBe(false);
  });
});
