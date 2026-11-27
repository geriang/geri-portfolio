import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { initActivitySchema, openActivityDb, upsertUsageEvents } from '../src/import/activityDb';
import { UsageEvent } from '../src/import/types';

/** Generated fixture constants only (NFR-5) — no real logs or personal data. */
const FIXTURE_EVENT: UsageEvent = {
  tool: 'sample-tool',
  sourceId: 'allowlist-001',
  occurredAtUtc: '2026-11-26T15:59:59Z',
  dayLocal: '2026-11-26',
  inputTokens: 10,
  outputTokens: 20,
  promptCount: 1,
  model: 'sample-model-1',
  taskType: 'Uncategorised',
};

/** The NFR-5 allow-list: exact table.column set from the design's data model. */
const ALLOWED_COLUMNS = new Set([
  'usage_event.id',
  'usage_event.tool',
  'usage_event.source_id',
  'usage_event.occurred_at_utc',
  'usage_event.day_local',
  'usage_event.input_tokens',
  'usage_event.output_tokens',
  'usage_event.prompt_count',
  'usage_event.model',
  'usage_event.task_type',
  'import_run.id',
  'import_run.started_at',
  'import_run.finished_at',
  'import_run.status',
  'import_run.events_seen',
  'import_run.events_written',
  'import_run.error',
]);

/**
 * Enumerated-name and date columns: everything a TEXT column may be besides
 * the single free-text column import_run.error.
 */
const ENUMERATED_TEXT_COLUMNS = new Set([
  'tool',
  'source_id',
  'occurred_at_utc',
  'day_local',
  'model',
  'task_type',
  'started_at',
  'finished_at',
  'status',
]);

interface ColumnInfo {
  name: string;
  type: string;
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'us2-'));
const dbPath = path.join(tmpDir, 'activity.db');
let db: Database.Database;

beforeAll(() => {
  db = openActivityDb({ path: dbPath });
  initActivitySchema(db);
  // Write fixture values first so the inspection runs against a used database.
  upsertUsageEvents(db, [FIXTURE_EVENT]);
  db.prepare(
    "INSERT INTO import_run (started_at, status, events_seen, events_written, error) VALUES (?, 'success', 1, 1, ?)",
  ).run('2026-11-26T15:59:59Z', 'sample diagnostic with no source content');
});

afterAll(() => {
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function columns(table: string): ColumnInfo[] {
  return db.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfo[];
}

describe('schema column allow-list (AC-2, NFR-5)', () => {
  test('the set of table.column names equals the allow-list — no extra, none missing', () => {
    const actual = new Set([
      ...columns('usage_event').map((c) => `usage_event.${c.name}`),
      ...columns('import_run').map((c) => `import_run.${c.name}`),
    ]);
    expect([...actual].sort()).toEqual([...ALLOWED_COLUMNS].sort());
  });

  test('no user table beyond usage_event and import_run exists', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all() as Array<{ name: string }>;
    expect(tables.map((t) => t.name).sort()).toEqual(['import_run', 'usage_event']);
  });

  test('every TEXT column is an enumerated/date column; only import_run.error can hold free text', () => {
    const textColumns = [
      ...columns('usage_event').filter((c) => c.type === 'TEXT').map((c) => c.name),
      ...columns('import_run').filter((c) => c.type === 'TEXT').map((c) => c.name),
    ];
    const unexpected = textColumns.filter((name) => !ENUMERATED_TEXT_COLUMNS.has(name) && name !== 'error');
    expect(unexpected).toEqual([]);
    // The single free-text-capable column exists and is TEXT...
    expect(columns('import_run').find((c) => c.name === 'error')?.type).toBe('TEXT');
    // ...and removing it leaves only enumerated/date TEXT columns in the whole schema.
    const freeTextCapable = [
      ...columns('usage_event')
        .filter((c) => c.type === 'TEXT' && !ENUMERATED_TEXT_COLUMNS.has(c.name))
        .map((c) => `usage_event.${c.name}`),
      ...columns('import_run')
        .filter((c) => c.type === 'TEXT' && !ENUMERATED_TEXT_COLUMNS.has(c.name))
        .map((c) => `import_run.${c.name}`),
    ];
    expect(freeTextCapable).toEqual(['import_run.error']);
  });

  test('metadata has no column — a leaking adapter cannot store prompt text', () => {
    const names = [
      ...columns('usage_event'),
      ...columns('import_run'),
    ].map((c) => c.name);
    for (const forbidden of ['metadata', 'prompt', 'response', 'prompt_text', 'response_text']) {
      expect(names).not.toContain(forbidden);
    }
  });

  test('the status CHECK rejects unknown values', () => {
    const insert = db.prepare(
      "INSERT INTO import_run (started_at, status) VALUES ('2026-11-26T15:59:59Z', 'unknown')",
    );
    expect(() => insert.run()).toThrow(/CHECK constraint failed/);
  });
});
