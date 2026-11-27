import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import {
  DEFAULT_WINDOW_DAYS,
  ImportFailureInjectedError,
  computeWindow,
  markAbandonedRuns,
  runImport,
  sanitizeRunError,
} from '../src/import/runImport';
import { OPENCODE_TOOL, OpenCodeAdapter } from '../src/import/adapters/opencodeAdapter';
import { clearToolAdapters, getToolAdapter, registerToolAdapter } from '../src/import/adapter';
import { initActivitySchema, openActivityDb } from '../src/import/activityDb';
import { dummyAdapter } from './fixtures/DummyAdapter';
import { DUMMY_TOOL_NAME } from './fixtures/events';
import { CANONICAL_WINDOW, writeOpencodeFixture, type OpencodeFixtureInfo } from './fixtures/opencodeDb';

/**
 * Integration tests for the import run over the generated opencode fixture
 * (real better-sqlite3 end to end, nothing mocked). AC-1, AC-2 (db half),
 * AC-3, AC-4, AC-5, AC-8 + abandoned sweep + perf sanity. Generated data only.
 */

const MARKER = 'MK-runimport-2d8f77ab';
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us3-'));
let fixture: OpencodeFixtureInfo;

const W = CANONICAL_WINDOW;

interface DayTotals {
  day_local: string;
  prompts: number;
  input: number;
  output: number;
}

let dbCounter = 0;
function freshActivityDbPath(): string {
  return path.join(tmpRoot, `activity-${dbCounter++}.db`);
}

function dailyTotals(db: Database.Database): DayTotals[] {
  return db
    .prepare(
      `SELECT day_local,
              SUM(prompt_count) AS prompts,
              SUM(input_tokens) AS input,
              SUM(output_tokens) AS output
       FROM usage_event GROUP BY day_local ORDER BY day_local`,
    )
    .all() as DayTotals[];
}

function snapshot(db: Database.Database) {
  return {
    count: (db.prepare('SELECT COUNT(*) AS n FROM usage_event').get() as { n: number }).n,
    totals: dailyTotals(db),
  };
}

/** Open the activity db directly for assertions after a run (which closes it). */
function inspect(dbPath: string): Database.Database {
  return openActivityDb({ path: dbPath });
}

function newAdapter(): OpenCodeAdapter {
  return new OpenCodeAdapter({ sourceDbPath: fixture.dbPath });
}

beforeAll(() => {
  fixture = writeOpencodeFixture({ dir: path.join(tmpRoot, 'fixture'), marker: MARKER });
});

afterAll(() => {
  clearToolAdapters();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('runImport happy path (AC-1, AC-4 shape)', () => {
  test('message-level rows with correct tool/source_id/timestamps/day_local/tokens/model/task_type', () => {
    const dbPath = freshActivityDbPath();
    const summary = runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window: W });

    expect(summary.status).toBe('success');
    expect(summary.tools).toEqual([OPENCODE_TOOL]);
    expect(summary.eventsSeen).toBe(9);
    expect(summary.eventsWritten).toBe(9);
    expect(summary.days).toEqual(['2026-11-24', '2026-11-26', '2026-11-27']);

    const db = inspect(dbPath);
    try {
      const row = (sourceId: string) => {
        const found = db
          .prepare('SELECT tool, source_id, occurred_at_utc, day_local, input_tokens, output_tokens, prompt_count, model, task_type FROM usage_event WHERE source_id = ?')
          .get(sourceId) as Record<string, string | number> | undefined;
        if (!found) throw new Error(`no usage_event row for ${sourceId}`);
        return found;
      };

      // Midnight-crossing ses_mid: user lands on 2026-11-26, assistant on 2026-11-27.
      expect(row('mid-user')).toEqual({
        tool: 'opencode',
        source_id: 'mid-user',
        occurred_at_utc: '2026-11-26T15:59:59Z',
        day_local: '2026-11-26',
        input_tokens: 0,
        output_tokens: 0,
        prompt_count: 1,
        model: 'glm-4.6',
        task_type: 'Coding/implementation',
      });
      expect(row('mid-assistant')).toEqual({
        tool: 'opencode',
        source_id: 'mid-assistant',
        occurred_at_utc: '2026-11-26T16:00:05.000Z',
        day_local: '2026-11-27',
        input_tokens: 120,
        output_tokens: 340,
        prompt_count: 0,
        model: 'glm-4.6',
        task_type: 'Coding/implementation',
      });

      // Task types from the appended agent-only rules.
      expect(row('ask-user-1').task_type).toBe('Research/questions');
      expect(row('ask-assistant-1').task_type).toBe('Research/questions');
      expect(row('gen-user').task_type).toBe('Uncategorised');
      expect(row('gen-assistant').task_type).toBe('Uncategorised');

      // Window boundary: since in, until out; older-than-window rows absent.
      expect(row('edge-since').day_local).toBe('2026-11-24');
      expect(() => row('edge-until')).toThrow(/no usage_event row/);
      expect(() => row('old-user')).toThrow(/no usage_event row/);
      expect(() => row('old-assistant')).toThrow(/no usage_event row/);

      // SUM(prompt_count) per session == number of user messages (ids carry the session).
      const sumPrompts = (ids: string[]) =>
        (db
          .prepare(
            `SELECT COALESCE(SUM(prompt_count), 0) AS p FROM usage_event WHERE source_id IN (${ids
              .map(() => '?')
              .join(',')})`,
          )
          .get(...ids) as { p: number }).p;
      expect(sumPrompts(['mid-user', 'mid-assistant'])).toBe(1); // ses_mid: 1 user
      expect(sumPrompts(['ask-user-1', 'ask-user-2', 'ask-assistant-1'])).toBe(2); // ses_ask: 2 users
      expect(sumPrompts(['gen-user', 'gen-assistant'])).toBe(1); // ses_gen: 1 user
      expect((db.prepare('SELECT COALESCE(SUM(prompt_count), 0) AS p FROM usage_event').get() as { p: number }).p).toBe(5);

      // Per-day combined figures.
      expect(dailyTotals(db)).toEqual([
        { day_local: '2026-11-24', prompts: 1, input: 0, output: 0 },
        { day_local: '2026-11-26', prompts: 1, input: 0, output: 0 },
        { day_local: '2026-11-27', prompts: 3, input: 670, output: 1589 },
      ]);

      // import_run row: started_at, finished_at, status, counts (AC-4 shape).
      const run = db
        .prepare('SELECT id, started_at, finished_at, status, events_seen, events_written, error FROM import_run')
        .all() as Array<{ id: number; started_at: string; finished_at: string; status: string; events_seen: number; events_written: number; error: string | null }>;
      expect(run).toHaveLength(1);
      expect(run[0].status).toBe('success');
      expect(run[0].started_at).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
      expect(run[0].finished_at).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
      expect(run[0].events_seen).toBe(9);
      expect(run[0].events_written).toBe(9);
      expect(run[0].error).toBeNull();
      expect(run[0].id).toBe(summary.runId);
    } finally {
      db.close();
    }
  });

  test('the twin rows are stored as ONE derived-id row (ADR-3 limit, via runImport)', () => {
    const dbPath = freshActivityDbPath();
    runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window: W });
    const db = inspect(dbPath);
    try {
      const twins = db
        .prepare("SELECT source_id FROM usage_event WHERE source_id LIKE 'derived:%'")
        .all() as Array<{ source_id: string }>;
      expect(twins).toHaveLength(1);
      expect(twins[0].source_id).toMatch(/^derived:[0-9a-f]{32}$/);
    } finally {
      db.close();
    }
  });
});

describe('idempotence (AC-3)', () => {
  test('the same import run twice changes row count and all totals by 0', () => {
    const dbPath = freshActivityDbPath();
    const first = runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window: W });
    let db = inspect(dbPath);
    let before;
    try {
      before = snapshot(db);
    } finally {
      db.close();
    }

    const second = runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window: W });
    db = inspect(dbPath);
    try {
      expect(snapshot(db)).toEqual(before); // deep-equal: change 0
      // (US-2 semantics: events_written counts inserts + updates, so the
      // second run still reports 9 written — the SELECTed data is what must not change.)
      expect(second.status).toBe('success');
      expect(second.eventsWritten).toBe(9);
    } finally {
      db.close();
    }
    expect(first.status).toBe('success');
  });

  test('a second run with an overlapping shifted window changes count and totals by 0', () => {
    const dbPath = freshActivityDbPath();
    runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window: W });
    let db = inspect(dbPath);
    let before;
    try {
      before = snapshot(db);
    } finally {
      db.close();
    }

    // Shifted window overlapping the first: earlier start (still above every
    // in-window row and below ses_old), same exclusive end.
    const overlapping = { sinceUtc: '2026-11-23T00:00:00Z', untilUtc: W.untilUtc };
    const summary = runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window: overlapping });
    db = inspect(dbPath);
    try {
      expect(snapshot(db)).toEqual(before);
    } finally {
      db.close();
    }
    expect(summary.status).toBe('success');
  });
});

describe('injected failure (AC-4)', () => {
  test('a failed run leaves 0 partial rows and a failed import_run with sanitized marker-free error', () => {
    const dbPath = freshActivityDbPath();
    runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window: W }); // seeded success
    let db = inspect(dbPath);
    let before;
    let seededRuns: number;
    try {
      before = snapshot(db);
      seededRuns = (db.prepare('SELECT COUNT(*) AS n FROM import_run').get() as { n: number }).n;
    } finally {
      db.close();
    }

    const summary = runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window: W, failAfter: 3 });

    db = inspect(dbPath);
    try {
      // 0 partial rows from the failed run: data identical to the seed.
      expect(snapshot(db)).toEqual(before);
      const runs = db
        .prepare('SELECT id, status, started_at, finished_at, events_seen, events_written, error FROM import_run ORDER BY id')
        .all() as Array<{ id: number; status: string; started_at: string; finished_at: string | null; events_seen: number; events_written: number; error: string | null }>;
      expect(runs).toHaveLength(seededRuns + 1);
      const failed = runs[runs.length - 1];
      expect(summary.status).toBe('failed');
      expect(failed.status).toBe('failed');
      expect(failed.finished_at).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/); // finished_at set
      expect(failed.events_seen).toBe(3);
      expect(failed.events_written).toBe(0);
      expect(failed.error).toBeTruthy(); // non-empty
      expect(failed.error).not.toContain(MARKER); // no source content
      expect(failed.error).toContain('ImportFailureInjectedError');
      expect(summary.error).toBe(failed.error);
    } finally {
      db.close();
    }
  });

  test('sanitizeRunError keeps name + first line only, capped at 500 chars', () => {
    const err = new Error(`first line ${MARKER}\nsecond line has ${MARKER} too`);
    err.name = 'BoomError';
    expect(sanitizeRunError(err)).toBe(`BoomError: first line ${MARKER}`);
    expect(sanitizeRunError(new Error('x'.repeat(900)))).toHaveLength(500);
    expect(sanitizeRunError('bare string')).toBe('Error: bare string');
    expect(sanitizeRunError(new Error('   \n junk'))).toBe('Error');
  });

  test('failAfter seam throws ImportFailureInjectedError internally (documented seam)', () => {
    expect(new ImportFailureInjectedError('x').name).toBe('ImportFailureInjectedError');
  });
});

describe('sliding-window recovery (AC-5)', () => {
  test('fail then rerun the same computeWindow: per-day totals equal the full fixture', () => {
    const now = new Date('2026-11-27T16:00:00Z');
    const window = computeWindow(now, DEFAULT_WINDOW_DAYS);
    expect(window).toEqual({ sinceUtc: '2026-11-20T16:00:00.000Z', untilUtc: '2026-11-27T16:00:00.000Z' });

    const dbPath = freshActivityDbPath();
    const failed = runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window, failAfter: 3 });
    expect(failed.status).toBe('failed');

    let db = inspect(dbPath);
    try {
      expect(snapshot(db)).toEqual({ count: 0, totals: [] }); // nothing survived the failed run
    } finally {
      db.close();
    }

    const recovered = runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window });
    expect(recovered.status).toBe('success');

    // The full-fixture reference: the adapter's own records for this window,
    // normalized the same way runImport does it.
    db = inspect(dbPath);
    try {
      const stored = dailyTotals(db);
      expect(stored.length).toBeGreaterThan(0);
      expect(stored).toEqual([
        { day_local: '2026-11-24', prompts: 1, input: 0, output: 0 },
        { day_local: '2026-11-26', prompts: 1, input: 0, output: 0 },
        { day_local: '2026-11-27', prompts: 3, input: 670, output: 1589 },
      ]);
    } finally {
      db.close();
    }
  });

  test('computeWindow defaults to the last 7 days', () => {
    expect(DEFAULT_WINDOW_DAYS).toBe(7);
    const w = computeWindow(new Date('2026-11-27T00:00:00Z'));
    expect(w.sinceUtc).toBe('2026-11-20T00:00:00.000Z');
    expect(w.untilUtc).toBe('2026-11-27T00:00:00.000Z');
    expect(() => computeWindow(new Date('2026-11-27T00:00:00Z'), 0)).toThrow(RangeError);
    expect(() => computeWindow(new Date('nonsense'))).toThrow(RangeError);
  });
});

describe('abandoned-run sweep', () => {
  test('a stale running row flips to failed at the next run start', () => {
    const dbPath = freshActivityDbPath();
    // Create the schema and seed a stale running row directly.
    const seed = openActivityDb({ path: dbPath });
    try {
      initActivitySchema(seed);
      seed
        .prepare("INSERT INTO import_run (started_at, status) VALUES ('2026-11-26T00:00:00Z', 'running')")
        .run();
    } finally {
      seed.close();
    }

    runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window: W });

    const db = inspect(dbPath);
    try {
      const stale = db
        .prepare('SELECT status, error FROM import_run WHERE started_at = ?')
        .get('2026-11-26T00:00:00Z') as { status: string; error: string };
      expect(stale.status).toBe('failed');
      expect(stale.error).toBe('abandoned run');
    } finally {
      db.close();
    }
    expect(typeof markAbandonedRuns).toBe('function');
  });
});

describe('multi-tool run (AC-8)', () => {
  // Window wide enough for the dummy tool's records (through SG 2027-01-01)
  // and the fixture's oldest rows.
  const WIDE = { sinceUtc: '2026-11-01T00:00:00Z', untilUtc: '2027-06-01T00:00:00Z' };

  const totalsByDay = (rows: DayTotals[]): Record<string, DayTotals> =>
    Object.fromEntries(rows.map((r) => [r.day_local, r]));

  test('opencode + US-2 dummy adapter in ONE runImport: rows coexist and per-day figures combine', () => {
    clearToolAdapters();
    registerToolAdapter(newAdapter());
    registerToolAdapter(dummyAdapter); // registry use per spec; runImport takes instances anyway
    expect(getToolAdapter(OPENCODE_TOOL)?.tool).toBe(OPENCODE_TOOL);
    expect(getToolAdapter(DUMMY_TOOL_NAME)?.tool).toBe(DUMMY_TOOL_NAME);

    // Solo reference runs.
    const soloOpenDbPath = freshActivityDbPath();
    runImport({ adapters: [newAdapter()], activityDbPath: soloOpenDbPath, window: WIDE });
    const soloDummyDbPath = freshActivityDbPath();
    runImport({ adapters: [dummyAdapter], activityDbPath: soloDummyDbPath, window: WIDE });
    let soloOpen: Record<string, DayTotals>;
    let soloDummy: Record<string, DayTotals>;
    {
      const dbSoloOpen = inspect(soloOpenDbPath);
      try {
        soloOpen = totalsByDay(dailyTotals(dbSoloOpen));
      } finally {
        dbSoloOpen.close();
      }
      const dbSoloDummy = inspect(soloDummyDbPath);
      try {
        soloDummy = totalsByDay(dailyTotals(dbSoloDummy));
      } finally {
        dbSoloDummy.close();
      }
    }
    // sanity on the reference runs
    expect(Object.keys(soloOpen).length).toBeGreaterThan(0);
    expect(Object.keys(soloDummy).length).toBeGreaterThan(0);

    const dbPath = freshActivityDbPath();
    const schemaDb = openActivityDb({ path: dbPath });
    let schemaBefore;
    try {
      initActivitySchema(schemaDb);
      schemaBefore = {
        usage_event: schemaDb.prepare('PRAGMA table_info(usage_event)').all(),
        import_run: schemaDb.prepare('PRAGMA table_info(import_run)').all(),
      };
    } finally {
      schemaDb.close();
    }

    const summary = runImport({
      adapters: [newAdapter(), dummyAdapter],
      activityDbPath: dbPath,
      window: WIDE,
    });
    expect(summary.status).toBe('success');
    expect([...summary.tools].sort()).toEqual([DUMMY_TOOL_NAME, OPENCODE_TOOL].sort());

    const db = inspect(dbPath);
    try {
      const tools = (db.prepare('SELECT DISTINCT tool FROM usage_event ORDER BY tool').all() as Array<{
        tool: string;
      }>).map((r) => r.tool);
      expect(tools.sort()).toEqual([DUMMY_TOOL_NAME, OPENCODE_TOOL].sort());

      // One schema — unchanged by the second tool.
      expect(db.prepare('PRAGMA table_info(usage_event)').all()).toEqual(schemaBefore.usage_event);
      expect(db.prepare('PRAGMA table_info(import_run)').all()).toEqual(schemaBefore.import_run);

      // Combined per-day figures == sum of the two solo runs, without interference.
      const combined = totalsByDay(dailyTotals(db));
      const days = [...new Set([...Object.keys(soloOpen), ...Object.keys(soloDummy)])].sort();
      const expected = Object.fromEntries(
        days.map((day) => [
          day,
          {
            day_local: day,
            prompts: (soloOpen[day]?.prompts ?? 0) + (soloDummy[day]?.prompts ?? 0),
            input: (soloOpen[day]?.input ?? 0) + (soloDummy[day]?.input ?? 0),
            output: (soloOpen[day]?.output ?? 0) + (soloDummy[day]?.output ?? 0),
          },
        ]),
      );
      expect(combined).toEqual(expected);

      // Dummy rows really landed (their unique model values prove coexistence).
      const dummyModels = db
        .prepare('SELECT DISTINCT model FROM usage_event WHERE tool = ?')
        .all(DUMMY_TOOL_NAME) as Array<{ model: string }>;
      expect(dummyModels.map((r) => r.model).sort()).toEqual(['dummy-model-a', 'dummy-model-b']);
    } finally {
      db.close();
    }
  });

  test('one adapter throwing fails the WHOLE combined run with 0 partial rows', () => {
    const dbPath = freshActivityDbPath();
    const throwing: { tool: string; readEvents(): Iterable<never> } = {
      tool: 'sneaky-tool',
      readEvents(): Iterable<never> {
        throw new Error(`sneaky exploded\nsecond line is noise`);
      },
    };
    const summary = runImport({
      adapters: [newAdapter(), dummyAdapter, throwing],
      activityDbPath: dbPath,
      window: WIDE,
    });
    expect(summary.status).toBe('failed');
    expect(summary.error).toBe('Error: sneaky exploded'); // sanitized: name + first line only
    const db = inspect(dbPath);
    try {
      expect((db.prepare('SELECT COUNT(*) AS n FROM usage_event').get() as { n: number }).n).toBe(0);
      const run = db.prepare('SELECT status FROM import_run ORDER BY id DESC LIMIT 1').get() as { status: string };
      expect(run.status).toBe('failed');
    } finally {
      db.close();
    }
  });
});

describe('activity.db byte scan (AC-2, db half)', () => {
  test('no marker string appears in activity.db bytes (or -wal/-shm sidecars) after a completed run', () => {
    const dbPath = freshActivityDbPath();
    const summary = runImport({ adapters: [newAdapter()], activityDbPath: dbPath, window: W });
    expect(summary.status).toBe('success');
    // runImport closes its connection (finally); scan the raw files.
    const files = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`].filter((f) => fs.existsSync(f));
    expect(files.length).toBeGreaterThanOrEqual(1);
    for (const file of files) {
      const bytes = fs.readFileSync(file).toString('latin1');
      expect(bytes).not.toContain(MARKER);
    }
  });
});

describe('perf sanity (AC-7 support)', () => {
  test(
    'a 20k-message fixture imports in under 30 seconds',
    () => {
      const bulkFixture = writeOpencodeFixture({
        dir: path.join(tmpRoot, 'bulk20k'),
        messageCount: 20_000,
        marker: MARKER,
      });
      expect(bulkFixture.userMessages + bulkFixture.assistantMessages).toBe(20_013);
      const dbPath = freshActivityDbPath();
      const started = Date.now();
      const summary = runImport({
        adapters: [new OpenCodeAdapter({ sourceDbPath: bulkFixture.dbPath })],
        activityDbPath: dbPath,
        window: W,
      });
      const elapsedMs = Date.now() - started;
      expect(summary.status).toBe('success');
      expect(summary.eventsWritten).toBe(20_009); // 20k bulk + 9 handcrafted in-window
      expect(elapsedMs).toBeLessThan(30_000);
    },
    120_000,
  );
});
