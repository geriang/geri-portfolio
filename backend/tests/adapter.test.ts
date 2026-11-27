import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import {
  AdapterRegistryError,
  ToolAdapter,
  clearToolAdapters,
  getToolAdapter,
  listToolNames,
  registerToolAdapter,
} from '../src/import/adapter';
import { initActivitySchema, openActivityDb, upsertUsageEvents } from '../src/import/activityDb';
import { toUsageEvent } from '../src/import/normalize';
import { loadTaskRulesConfig } from '../src/import/taskRules';
import { dummyAdapter, sampleToolAdapter } from './fixtures/DummyAdapter';
import { DUMMY_TOOL_NAME, SAMPLE_TOOL_NAME } from './fixtures/events';

interface ColumnInfo {
  name: string;
  type: string;
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'us2-'));
const dbPath = path.join(tmpDir, 'activity.db');
let db: Database.Database;
let schemaBefore: { usageEvent: ColumnInfo[]; importRun: ColumnInfo[] };
const config = loadTaskRulesConfig();

const tableInfo = (table: string): ColumnInfo[] =>
  db.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfo[];

const FULL_WINDOW: [string, string] = ['2026-01-01T00:00:00Z', '2028-01-01T00:00:00Z'];

function importTool(adapter: ToolAdapter) {
  const events = [...adapter.readEvents(...FULL_WINDOW)].map((record) =>
    toUsageEvent(record, adapter.tool, config),
  );
  return upsertUsageEvents(db, events);
}

beforeAll(() => {
  db = openActivityDb({ path: dbPath });
  initActivitySchema(db);
  schemaBefore = { usageEvent: tableInfo('usage_event'), importRun: tableInfo('import_run') };

  clearToolAdapters();
  registerToolAdapter(sampleToolAdapter); // first sample tool
  registerToolAdapter(dummyAdapter); // the "second adapter file" added per AC-6
});

afterAll(() => {
  clearToolAdapters();
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('tool adapter registry + dummy second adapter (AC-6)', () => {
  test('both tools are registered and discoverable via the registry', () => {
    expect(listToolNames().sort()).toEqual([DUMMY_TOOL_NAME, SAMPLE_TOOL_NAME].sort());
    expect(getToolAdapter(SAMPLE_TOOL_NAME)?.tool).toBe(SAMPLE_TOOL_NAME);
    expect(getToolAdapter(DUMMY_TOOL_NAME)?.tool).toBe(DUMMY_TOOL_NAME);
    expect(getToolAdapter('no-such-tool')).toBeUndefined();
  });

  test('duplicate registration of the same tool throws AdapterRegistryError', () => {
    expect(() => registerToolAdapter(sampleToolAdapter)).toThrow(AdapterRegistryError);
  });

  test('end-to-end readEvents → toUsageEvent → upsertUsageEvents for both tools', () => {
    const sample = importTool(sampleToolAdapter);
    const dummy = importTool(dummyAdapter);
    expect(sample.seen).toBe(3);
    expect(sample.written).toBe(3);
    expect(dummy.seen).toBe(3);
    expect(dummy.written).toBe(3);

    const rows = db
      .prepare('SELECT tool, source_id, day_local, task_type FROM usage_event ORDER BY tool, source_id')
      .all() as Array<{ tool: string; source_id: string; day_local: string; task_type: string }>;

    // Rows from both tools coexist.
    expect([...new Set(rows.map((r) => r.tool))].sort()).toEqual(
      [DUMMY_TOOL_NAME, SAMPLE_TOOL_NAME].sort(),
    );
    // task_type and day_local are filled on every row.
    for (const row of rows) {
      expect(row.task_type).toBeTruthy();
      expect(row.day_local).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    // Classifier and SG day conversion produced expected fixture values.
    const find = (tool: string, sourceId: string) =>
      rows.find((r) => r.tool === tool && r.source_id === sourceId);
    expect(find(SAMPLE_TOOL_NAME, 'sample-001')?.task_type).toBe('Debugging/fixing');
    expect(find(SAMPLE_TOOL_NAME, 'sample-001')?.day_local).toBe('2026-11-26'); // 23:59:59 SG
    expect(find(SAMPLE_TOOL_NAME, 'sample-002')?.day_local).toBe('2026-11-27'); // 00:00:00 SG
    expect(find(SAMPLE_TOOL_NAME, 'sample-003')?.task_type).toBe('Uncategorised');
    expect(find(DUMMY_TOOL_NAME, 'dummy-001')?.task_type).toBe('Review/testing');
    expect(find(DUMMY_TOOL_NAME, 'dummy-001')?.day_local).toBe('2026-11-27'); // UTC date differs
    expect(find(DUMMY_TOOL_NAME, 'dummy-002')?.task_type).toBe('Coding/implementation');
    expect(find(DUMMY_TOOL_NAME, 'dummy-003')?.day_local).toBe('2027-01-01'); // SG year rollover
  });

  test('adding the second adapter changed the schema not at all', () => {
    expect(tableInfo('usage_event')).toEqual(schemaBefore.usageEvent);
    expect(tableInfo('import_run')).toEqual(schemaBefore.importRun);
  });

  test('readEvents honours the inclusive-since/exclusive-until window', () => {
    const [one] = [...dummyAdapter.readEvents('2026-11-26T23:30:00Z', '2026-11-28T02:15:00Z')];
    expect(one.sourceId).toBe('dummy-001'); // boundary record at `until` excluded
  });

  test('clearToolAdapters empties the registry (test isolation)', () => {
    clearToolAdapters();
    expect(listToolNames()).toEqual([]);
    registerToolAdapter(sampleToolAdapter);
    registerToolAdapter(dummyAdapter); // restore for the schema test above ordering-independence
  });
});
