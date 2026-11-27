import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import {
  initActivitySchema,
  openActivityDb,
  upsertUsageEvents,
} from '../src/import/activityDb';
import { UsageEvent } from '../src/import/types';

/** Generated fixture constants only (NFR-5) — no real logs or personal data. */
function makeEvent(overrides: Partial<UsageEvent> = {}): UsageEvent {
  return {
    tool: 'sample-tool',
    sourceId: 'src-001',
    occurredAtUtc: '2026-11-26T15:59:59Z',
    dayLocal: '2026-11-26',
    inputTokens: 120,
    outputTokens: 340,
    promptCount: 1,
    model: 'sample-model-1',
    taskType: 'Coding/implementation',
    ...overrides,
  };
}

interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'us2-'));
const originalDbPath = process.env.ACTIVITY_DB_PATH;
let dbPath: string;
let db: Database.Database;

beforeAll(() => {
  dbPath = path.join(tmpDir, 'activity.db');
  process.env.ACTIVITY_DB_PATH = dbPath;
  db = openActivityDb(); // path from ACTIVITY_DB_PATH only
  initActivitySchema(db);
});

afterAll(() => {
  db.close();
  if (originalDbPath !== undefined) process.env.ACTIVITY_DB_PATH = originalDbPath;
  else delete process.env.ACTIVITY_DB_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const tableInfo = (table: string): ColumnInfo[] =>
  db.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfo[];

describe('activity.db schema (AC-1)', () => {
  test('usage_event columns and types match the data model, in order', () => {
    expect(tableInfo('usage_event').map((c) => [c.name, c.type])).toEqual([
      ['id', 'INTEGER'],
      ['tool', 'TEXT'],
      ['source_id', 'TEXT'],
      ['occurred_at_utc', 'TEXT'],
      ['day_local', 'TEXT'],
      ['input_tokens', 'INTEGER'],
      ['output_tokens', 'INTEGER'],
      ['prompt_count', 'INTEGER'],
      ['model', 'TEXT'],
      ['task_type', 'TEXT'],
    ]);
  });

  test('import_run columns and types match the data model, in order', () => {
    expect(tableInfo('import_run').map((c) => [c.name, c.type])).toEqual([
      ['id', 'INTEGER'],
      ['started_at', 'TEXT'],
      ['finished_at', 'TEXT'],
      ['status', 'TEXT'],
      ['events_seen', 'INTEGER'],
      ['events_written', 'INTEGER'],
      ['error', 'TEXT'],
    ]);
  });

  test('unique key exists on (tool, source_id)', () => {
    const indexes = db.prepare('PRAGMA index_list(usage_event)').all() as Array<{
      name: string;
      unique: number;
      origin: string;
    }>;
    const uniqueOnKey = indexes.filter((i) => i.unique === 1);
    expect(uniqueOnKey.length).toBeGreaterThan(0);
    const coversKey = uniqueOnKey.some((index) => {
      const cols = db
        .prepare(`PRAGMA index_info(${index.name})`)
        .all() as Array<{ name: string }>;
      return cols.map((c) => c.name).join(',') === 'tool,source_id';
    });
    expect(coversKey).toBe(true);
  });

  test('database is in WAL mode', () => {
    expect((db.pragma('journal_mode', { simple: true }) as string).toLowerCase()).toBe('wal');
  });

  test('import_run status CHECK only allows running/success/failed', () => {
    const insert = db.prepare(
      "INSERT INTO import_run (started_at, status) VALUES ('2026-11-26T15:59:59Z', ?)",
    );
    expect(() => insert.run('unknown-status')).toThrow();
    for (const ok of ['running', 'success', 'failed']) {
      expect(() => insert.run(ok)).not.toThrow();
    }
  });

  test('initActivitySchema is idempotent (re-run is a no-op)', () => {
    const before = tableInfo('usage_event');
    initActivitySchema(db);
    initActivitySchema(db);
    expect(tableInfo('usage_event')).toEqual(before);
  });

  test('duplicate raw (tool, source_id) row throws', () => {
    const insert = db.prepare(`
      INSERT INTO usage_event (tool, source_id, occurred_at_utc, day_local, model, task_type)
      VALUES ('sample-tool', 'dup-001', '2026-11-26T15:59:59Z', '2026-11-26', 'sample-model-1', 'Uncategorised')
    `);
    expect(() => insert.run()).not.toThrow();
    expect(() => insert.run()).toThrow(/UNIQUE/);
  });
});

describe('upsertUsageEvents (FR-17 primitive)', () => {
  test('same event upserted twice leaves one row with updated values', () => {
    const first = makeEvent({ sourceId: 'upsert-001', inputTokens: 10, taskType: 'Uncategorised' });
    expect(upsertUsageEvents(db, [first])).toEqual({ seen: 1, written: 1 });

    const second = makeEvent({ sourceId: 'upsert-001', inputTokens: 99, taskType: 'Debugging/fixing' });
    expect(upsertUsageEvents(db, [second])).toEqual({ seen: 1, written: 1 });

    const rows = db
      .prepare("SELECT * FROM usage_event WHERE tool = 'sample-tool' AND source_id = 'upsert-001'")
      .all() as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0].input_tokens).toBe(99);
    expect(rows[0].task_type).toBe('Debugging/fixing');
  });

  test('negative token count throws and rolls back the whole call', () => {
    // Baseline row from a prior committed call stays put.
    upsertUsageEvents(db, [makeEvent({ sourceId: 'rollback-base' })]);
    const before = (db.prepare('SELECT COUNT(*) AS n FROM usage_event').get() as { n: number }).n;

    const batch = [
      makeEvent({ sourceId: 'rollback-sibling' }),
      makeEvent({ sourceId: 'rollback-bad', outputTokens: -5 }),
    ];
    expect(() => upsertUsageEvents(db, batch)).toThrow();

    const after = (db.prepare('SELECT COUNT(*) AS n FROM usage_event').get() as { n: number }).n;
    expect(after).toBe(before); // sibling of the failing row rolled back too
    const find = (id: string) =>
      db.prepare("SELECT 1 FROM usage_event WHERE source_id = ?").get(id);
    expect(find('rollback-sibling')).toBeUndefined();
    expect(find('rollback-bad')).toBeUndefined();
  });
});

describe('openActivityDb path precedence', () => {
  test('options.path wins over ACTIVITY_DB_PATH', () => {
    const other = path.join(tmpDir, 'explicit.db');
    const explicit = openActivityDb({ path: other });
    initActivitySchema(explicit);
    expect(fs.existsSync(other)).toBe(true);
    explicit.close();
  });

  test('no option and unset ACTIVITY_DB_PATH throws without touching any file', () => {
    delete process.env.ACTIVITY_DB_PATH;
    const cwdBefore = fs.readdirSync(process.cwd());
    expect(() => openActivityDb()).toThrow(/ACTIVITY_DB_PATH is not set/);
    expect(fs.readdirSync(process.cwd())).toEqual(cwdBefore);
  });
});
