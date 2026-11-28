import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { createActivityRouter } from '../src/activity/activityRouter';
import { ACTIVITY_METADATA_KEYS, ACTIVITY_ROW_KEYS, ACTIVITY_TOP_LEVEL_KEYS } from '../src/activity/activityService';
import { INVALID_ACTIVITY_RANGE_BODY } from '../src/activity/activityErrors';
import { addMonths } from '../src/activity/timeRange';
import { runImport } from '../src/import/runImport';
import { OpenCodeAdapter } from '../src/import/adapters/opencodeAdapter';
import {
  SEED_FROM_DAY,
  SEED_MARKER,
  SEED_TO_DAY,
  createEmptyActivityDb,
  seedActivityDb,
} from './fixtures/activitySeed';
import { CANONICAL_WINDOW, writeOpencodeFixture } from './fixtures/opencodeDb';

/**
 * AC-1 … AC-7 contract suite over supertest, composed exactly the way
 * src/index.ts composes it: app.use('/activity', createActivityRouter({dbPath})).
 * One `it` per acceptance criterion (plus the per-invalid-input sweep).
 */

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us4-api-'));
let dbCounter = 0;
function freshDbPath(): string {
  return path.join(tmpRoot, `activity-${dbCounter++}.db`);
}

function composedApp(dbPath?: string) {
  const app = express();
  app.use('/activity', createActivityRouter({ dbPath }));
  return app;
}

const savedEnv = process.env.ACTIVITY_DB_PATH;
let consoleSpies: jest.SpyInstance[] = [];
let stdoutSpy: jest.SpyInstance;

/** Everything the server printed since the spy was installed. */
function capturedOutput(): string {
  const lines: string[] = [];
  for (const spy of consoleSpies) {
    for (const call of spy.mock.calls) lines.push(call.map(String).join(' '));
  }
  for (const call of stdoutSpy.mock.calls) lines.push(String(call[0]));
  return lines.join('\n');
}

beforeEach(() => {
  consoleSpies = (['log', 'warn', 'error', 'info'] as const).map((level) =>
    jest.spyOn(console, level).mockImplementation(() => undefined),
  );
  stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});
afterEach(() => {
  for (const spy of consoleSpies) spy.mockRestore();
  stdoutSpy.mockRestore();
});
afterAll(() => {
  if (savedEnv === undefined) delete process.env.ACTIVITY_DB_PATH;
  else process.env.ACTIVITY_DB_PATH = savedEnv;
});

const mainDbPath = freshDbPath();
const mainFacts = seedActivityDb({ dbPath: mainDbPath, days: 300 });

describe('AC-1: no-parameter GET /activity serves the full contract shape', () => {
  it('200 application/json with the metadata block and a rows array', async () => {
    const res = await request(composedApp(mainDbPath)).get('/activity');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.metadata.timeZone).toBe('Asia/Singapore');
    expect(typeof res.body.metadata.asOfDate).toBe('string');
    expect(res.body.metadata.asOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.metadata.lastUpdated).toBe(mainFacts.lastUpdated);
    expect(res.body.metadata.taskTypes).toEqual(mainFacts.distinctTaskTypes);
    expect(res.body.metadata.models).toEqual(mainFacts.distinctModels);
    expect(res.body.metadata.tools).toEqual(mainFacts.distinctTools);
    expect(Array.isArray(res.body.rows)).toBe(true);
    expect(res.body.rows.length).toBeGreaterThan(0);
  });
});

describe('AC-2: explicit inclusive range serves exact grouped totals', () => {
  it('rows deep-equal the fixture-computed groups, sums and order', async () => {
    const from = '2026-11-21';
    const to = '2026-11-27';
    const res = await request(composedApp(mainDbPath)).get(`/activity?from=${from}&to=${to}`);
    expect(res.status).toBe(200);
    const expected = mainFacts.expectedRows(from, to);
    expect(expected.length).toBeGreaterThan(0);
    expect(res.body.rows).toEqual(expected);
    for (const row of res.body.rows) {
      expect(row.day_local >= from).toBe(true);
      expect(row.day_local <= to).toBe(true);
    }
    const keys = res.body.rows.map((r: Record<string, string>) =>
      `${r.day_local}|${r.tool}|${r.model}|${r.task_type}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
    const days = [...new Set(expected.map((r) => r.day_local))];
    expect(days).toEqual(['2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27']);
    const sums = res.body.rows.reduce(
      (acc: Record<string, number>, r: Record<string, number>) => ({
        input_tokens: acc.input_tokens + r.input_tokens,
        output_tokens: acc.output_tokens + r.output_tokens,
        prompt_count: acc.prompt_count + r.prompt_count,
      }),
      { input_tokens: 0, output_tokens: 0, prompt_count: 0 },
    );
    expect(sums).toEqual(mainFacts.totalsForDays(days));
  });
});

describe('AC-3: empty states are 200 with the complete metadata block', () => {
  it('a range with no usage echoes the request with rows []', async () => {
    const res = await request(composedApp(mainDbPath)).get(
      '/activity?from=2000-01-01&to=2000-12-31',
    );
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.metadata).sort()).toEqual([...ACTIVITY_METADATA_KEYS].sort());
    expect(res.body.rows).toEqual([]);
    expect(res.body.metadata.from).toBe('2000-01-01');
    expect(res.body.metadata.to).toBe('2000-12-31');
  });

  it('a database with no successful import yet is 200 with nulls and rows []', async () => {
    const dbPath = freshDbPath();
    createEmptyActivityDb(dbPath);
    const res = await request(composedApp(dbPath)).get('/activity');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.metadata).sort()).toEqual([...ACTIVITY_METADATA_KEYS].sort());
    expect(res.body.metadata.asOfDate).toBeNull();
    expect(res.body.metadata.lastUpdated).toBeNull();
    expect(res.body.rows).toEqual([]);
  });

  it('ACTIVITY_DB_PATH unset, or a missing file, is still 200 (never 500)', async () => {
    delete process.env.ACTIVITY_DB_PATH;
    const noPath = await request(creatActivityRouterNoPath()).get('/activity');
    expect(noPath.status).toBe(200);
    expect(Object.keys(noPath.body.metadata).sort()).toEqual([...ACTIVITY_METADATA_KEYS].sort());
    expect(noPath.body.rows).toEqual([]);

    const missing = await request(composedApp(path.join(tmpRoot, 'not-here.db'))).get('/activity');
    expect(missing.status).toBe(200);
    expect(Object.keys(missing.body.metadata).sort()).toEqual([...ACTIVITY_METADATA_KEYS].sort());
    expect(missing.body.rows).toEqual([]);
  });
});

function creatActivityRouterNoPath() {
  const app = express();
  app.use('/activity', createActivityRouter());
  return app;
}

describe('AC-4: every invalid range is the same frozen 400, nothing echoed', () => {
  const invalidRequests: Array<[string, string]> = [
    ['garbage from', '/activity?from=not-a-date'],
    ['unpadded from', '/activity?from=2026-1-5'],
    ['impossible to', '/activity?to=2026-02-30'],
    ['month 13 to', '/activity?to=2026-13-01'],
    ['compact from', '/activity?from=20261105'],
    ['timestamp from', '/activity?from=2026-11-05T00:00:00Z'],
    ['reversed pair', '/activity?from=2026-11-28&to=2026-11-01'],
    ['array from (?from=a&from=b)', '/activity?from=a&from=b'],
  ];

  it.each(invalidRequests)('%s → 400 with the frozen body', async (_label, url) => {
    const res = await request(composedApp(mainDbPath)).get(url);
    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID_ACTIVITY_RANGE_BODY);
    expect(res.text).toBe(JSON.stringify(INVALID_ACTIVITY_RANGE_BODY));
  });

  it('is byte-identical across every invalid input', async () => {
    const texts: string[] = [];
    for (const [, url] of invalidRequests) {
      const res = await request(composedApp(mainDbPath)).get(url);
      texts.push(res.text);
    }
    expect(new Set(texts).size).toBe(1);
    expect(texts[0]).toBe(JSON.stringify(INVALID_ACTIVITY_RANGE_BODY));
  });

  it('a marker inside an invalid value appears in no body, log or stdout', async () => {
    const before = usageEventCount(mainDbPath);
    const res = await request(composedApp(mainDbPath)).get(
      `/activity?from=${SEED_MARKER}-invalid&to=${SEED_MARKER}-also-invalid`,
    );
    expect(res.status).toBe(400);
    expect(res.text).not.toContain(SEED_MARKER);
    expect(capturedOutput()).not.toContain(SEED_MARKER);
    expect(usageEventCount(mainDbPath)).toBe(before);
  });

  it('bracket keys (?from[0]=x) are unknown params under the simple parser → 200 defaults', async () => {
    const res = await request(composedApp(mainDbPath)).get('/activity?from%5B0%5D=x');
    expect(res.status).toBe(200);
    expect(res.body.metadata.from).toBe(SEED_FROM_DAY);
    expect(res.body.metadata.to).toBe(SEED_TO_DAY);
  });
});

function usageEventCount(dbPath: string): number {
  const res = { current: 0 };
  // count through the API itself (rows grouped) plus a direct read-only check
  const Database = require('better-sqlite3');
  const db = new Database(dbPath, { readonly: true });
  try {
    res.current = (db.prepare('SELECT COUNT(*) AS count FROM usage_event').get() as { count: number })
      .count;
  } finally {
    db.close();
  }
  return res.current;
}

describe('AC-6: the default request covers the 12-month window with boundary rows', () => {
  const wideDbPath = freshDbPath();
  const wideFacts = seedActivityDb({ dbPath: wideDbPath, days: 400 });

  it('to = asOfDate, from = addMonths(to, -12), boundary row in, day before out', async () => {
    const res = await request(composedApp(wideDbPath)).get('/activity');
    expect(res.status).toBe(200);
    expect(wideFacts.distinctDays).toBeGreaterThanOrEqual(400 - 1);
    expect(res.body.metadata.to).toBe(wideFacts.asOfDate);
    expect(res.body.metadata.from).toBe(addMonths(wideFacts.asOfDate, -12));
    expect(res.body.metadata.from).toBe(SEED_FROM_DAY);
    const days = new Set(res.body.rows.map((r: { day_local: string }) => r.day_local));
    expect(days.has(SEED_FROM_DAY)).toBe(true); // a row exactly on `from`
    expect(days.has('2025-11-26')).toBe(false); // and one day earlier: absent
    for (const day of days) {
      expect(day >= SEED_FROM_DAY).toBe(true);
      expect(day <= SEED_TO_DAY).toBe(true);
    }
    // and the window really excluded seeded data (rows exist before `from`)
    const beforeRange = wideFacts
      .expectedRows('2025-10-01', '2025-11-26')
      .map((r) => r.day_local);
    expect(beforeRange.length).toBeGreaterThan(0);
    expect(beforeRange).toContain('2025-11-26');
  });
});

describe('AC-7: end-to-end marker scan over a real import', () => {
  it('prompt-text marker dropped at import never surfaces from the API', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'us4-e2e-'));
    const fixture = writeOpencodeFixture({ dir, marker: SEED_MARKER });
    const activityDbPath = path.join(dir, 'activity.db');
    const summary = runImport({
      adapters: [new OpenCodeAdapter({ sourceDbPath: fixture.dbPath })],
      activityDbPath,
      window: CANONICAL_WINDOW,
    });
    expect(summary.status).toBe('success');
    expect(summary.eventsWritten).toBeGreaterThan(0);

    const res = await request(composedApp(activityDbPath)).get(
      '/activity?from=2026-11-01&to=2026-12-31',
    );
    expect(res.status).toBe(200);
    expect(res.body.rows.length).toBeGreaterThan(0);
    expect(res.text).not.toContain(SEED_MARKER);
    expect(JSON.stringify(res.body)).not.toContain(SEED_MARKER);
    expect(capturedOutput()).not.toContain(SEED_MARKER);

    // key allow-list: nothing beyond metadata (8 keys) / rows (7 keys)
    expect(Object.keys(res.body).sort()).toEqual([...ACTIVITY_TOP_LEVEL_KEYS].sort());
    expect(Object.keys(res.body.metadata).sort()).toEqual([...ACTIVITY_METADATA_KEYS].sort());
    for (const row of res.body.rows) {
      expect(Object.keys(row).sort()).toEqual([...ACTIVITY_ROW_KEYS].sort());
    }
    const body = JSON.stringify(res.body);
    for (const leak of [
      'source_id',
      'occurred_at_utc',
      'events_seen',
      'events_written',
      '"error"',
    ]) {
      expect(body).not.toContain(leak);
    }
  });
});
