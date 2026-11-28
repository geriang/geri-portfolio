import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  ACTIVITY_METADATA_KEYS,
  ACTIVITY_ROW_KEYS,
  ACTIVITY_TOP_LEVEL_KEYS,
  ActivityResult,
  emptyActivityMetadata,
  getActivity,
} from '../src/activity/activityService';
import {
  ACTIVITY_EMPTY_LOG_LINE,
  ACTIVITY_UNAVAILABLE_BODY,
  INVALID_ACTIVITY_RANGE_BODY,
} from '../src/activity/activityErrors';
import {
  SEED_FROM_DAY,
  SEED_MODELS,
  SEED_TASK_TYPES,
  SEED_TO_DAY,
  SEED_TOOLS,
  createEmptyActivityDb,
  seedActivityDb,
} from './fixtures/activitySeed';

/**
 * Service-level tests over real SQLite databases (no express): metadata
 * assembly, the frozen error identities, the AC-3 empty states and the
 * byte-stability of repeated responses. console is spied — the service must
 * only ever log the two frozen constant lines.
 */

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us4-svc-'));
let dbCounter = 0;
function freshDbPath(): string {
  return path.join(tmpRoot, `activity-${dbCounter++}.db`);
}

let warnSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

function ok200(result: ActivityResult) {
  if (result.status !== 200) {
    throw new Error(`expected status 200, got ${result.status}`);
  }
  return result.body;
}

function err400(result: ActivityResult) {
  if (result.status !== 400) {
    throw new Error(`expected status 400, got ${result.status}`);
  }
  return result.body;
}

describe('getActivity happy path (AC-1, AC-2, AC-6 service half)', () => {
  const dbPath = freshDbPath();
  const facts = seedActivityDb({ dbPath, days: 40 });

  it('serves the full metadata block with the eight keys and fixture rows', () => {
    const body = ok200(getActivity({}, { dbPath }));
    expect(Object.keys(body).sort()).toEqual([...ACTIVITY_TOP_LEVEL_KEYS].sort());
    expect(Object.keys(body.metadata).sort()).toEqual([...ACTIVITY_METADATA_KEYS].sort());
    expect(body.metadata.timeZone).toBe('Asia/Singapore');
    expect(body.metadata.asOfDate).toBe(facts.asOfDate);
    expect(body.metadata.lastUpdated).toBe(facts.lastUpdated);
    expect(body.metadata.from).toBe(SEED_FROM_DAY);
    expect(body.metadata.to).toBe(SEED_TO_DAY);
    expect(body.rows).toEqual(facts.expectedRows(SEED_FROM_DAY, SEED_TO_DAY));
    for (const row of body.rows) {
      expect(Object.keys(row).sort()).toEqual([...ACTIVITY_ROW_KEYS].sort());
    }
  });

  it('derives taskTypes/models/tools from the served rows only', () => {
    // a single day exercises 2 of the 3 models and task types (seed formula)
    const body = ok200(getActivity({ from: SEED_TO_DAY, to: SEED_TO_DAY }, { dbPath }));
    const served = facts.expectedRows(SEED_TO_DAY, SEED_TO_DAY);
    expect(body.rows).toEqual(served);
    const distinct = (pick: (r: (typeof served)[number]) => string) =>
      [...new Set(served.map(pick))].sort();
    expect(body.metadata.models).toEqual(distinct((r) => r.model));
    expect(body.metadata.taskTypes).toEqual(distinct((r) => r.task_type));
    expect(body.metadata.tools).toEqual(distinct((r) => r.tool));
    expect(body.metadata.models.length).toBeLessThan(SEED_MODELS.length);
    expect(body.metadata.taskTypes.length).toBeLessThan(SEED_TASK_TYPES.length);
    expect(body.metadata.tools).toEqual([...SEED_TOOLS]);
    for (const list of [body.metadata.models, body.metadata.taskTypes, body.metadata.tools]) {
      expect(list).toEqual([...list].sort());
    }
  });

  it('is byte-stable: two identical calls stringify identically', () => {
    const a = getActivity({ from: '2026-11-01', to: '2026-11-27' }, { dbPath });
    const b = getActivity({ from: '2026-11-01', to: '2026-11-27' }, { dbPath });
    expect(JSON.stringify(a)).toStrictEqual(JSON.stringify(b));
  });

  it('single-sided ranges take their defaults (from-only, to-only)', () => {
    const fromOnly = ok200(getActivity({ from: '2026-11-20' }, { dbPath }));
    expect(fromOnly.metadata.to).toBe(SEED_TO_DAY);
    const toOnly = ok200(getActivity({ to: '2026-05-15' }, { dbPath }));
    expect(toOnly.metadata.from).toBe('2025-05-15');
    expect(toOnly.rows).toEqual(facts.expectedRows('2025-05-15', '2026-05-15'));
  });
});

describe('getActivity invalid ranges (AC-4 service half)', () => {
  const dbPath = freshDbPath();
  seedActivityDb({ dbPath, days: 10 });

  it.each([
    [{ from: 'not-a-date' }],
    [{ from: '2026-1-5' }],
    [{ to: '2026-02-30' }],
    [{ to: '2026-13-01' }],
    [{ from: '20261105' }],
    [{ from: '2026-11-05T00:00:00Z' }],
    [{ from: '2026-11-28', to: '2026-11-01' }],
    [{ from: ['a', 'b'] }],
  ])('maps %p to the frozen 400 body by object identity', (query) => {
    const result = getActivity(query, { dbPath });
    expect(result.status).toBe(400);
    expect(err400(result)).toBe(INVALID_ACTIVITY_RANGE_BODY);
  });

  it('never logs an interpolated value for invalid input', () => {
    getActivity({ from: 'MK-activity-invalid-probe', to: 'also-invalid-probe' }, { dbPath });
    const logged = [...warnSpy.mock.calls, ...errorSpy.mock.calls].flat().map(String).join('\n');
    expect(logged).not.toContain('MK-activity-invalid-probe');
    expect(logged).not.toContain('also-invalid-probe');
  });
});

describe('getActivity empty states (AC-3 service half)', () => {
  it('a range with no usage is 200 with the full key set and rows []', () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 10 });
    const body = ok200(getActivity({ from: '2000-01-01', to: '2000-12-31' }, { dbPath }));
    expect(Object.keys(body.metadata).sort()).toEqual([...ACTIVITY_METADATA_KEYS].sort());
    expect(body.rows).toEqual([]);
    expect(body.metadata.from).toBe('2000-01-01');
    expect(body.metadata.to).toBe('2000-12-31');
  });

  it('a schema-only database (never imported) is 200 with nulls and rows []', () => {
    const dbPath = freshDbPath();
    createEmptyActivityDb(dbPath);
    const body = ok200(getActivity({}, { dbPath }));
    expect(Object.keys(body.metadata).sort()).toEqual([...ACTIVITY_METADATA_KEYS].sort());
    expect(body.metadata.asOfDate).toBeNull();
    expect(body.metadata.lastUpdated).toBeNull();
    expect(body.metadata.from).toBeNull();
    expect(body.metadata.to).toBeNull();
    expect(body.rows).toEqual([]);
  });

  it('only failed/running runs still anchor the default range on MAX(day_local)', () => {
    const dbPath = freshDbPath();
    const facts = seedActivityDb({ dbPath, days: 12, runs: 'running-only' });
    const body = ok200(getActivity({}, { dbPath }));
    expect(body.metadata.lastUpdated).toBeNull();
    expect(body.metadata.asOfDate).toBe(SEED_TO_DAY);
    expect(body.metadata.from).toBe(SEED_FROM_DAY);
    expect(body.metadata.to).toBe(SEED_TO_DAY);
    expect(body.rows).toEqual(facts.expectedRows(SEED_FROM_DAY, SEED_TO_DAY));
  });

  it('a missing dbPath file is 200 empty plus exactly one constant warn line', () => {
    const dbPath = path.join(tmpRoot, 'definitely-missing.db');
    expect(fs.existsSync(dbPath)).toBe(false);
    const result = getActivity({}, { dbPath });
    expect(result.status).toBe(200);
    const body = ok200(result);
    expect(Object.keys(body.metadata).sort()).toEqual([...ACTIVITY_METADATA_KEYS].sort());
    expect(body.rows).toEqual([]);
    expect(body.metadata.asOfDate).toBeNull();
    expect(body.metadata.lastUpdated).toBeNull();
    expect(warnSpy.mock.calls).toEqual([[ACTIVITY_EMPTY_LOG_LINE]]);
    expect(errorSpy.mock.calls).toEqual([]);
  });

  it('emptyActivityMetadata carries every key with nulls/[] and echoes a given range', () => {
    const empty = emptyActivityMetadata();
    expect(Object.keys(empty).sort()).toEqual([...ACTIVITY_METADATA_KEYS].sort());
    expect(empty.from).toBeNull();
    expect(empty.to).toBeNull();
    const echoed = emptyActivityMetadata({ from: '2026-01-01', to: '2026-01-02' });
    expect(echoed.from).toBe('2026-01-01');
    expect(echoed.to).toBe('2026-01-02');
  });

  it('the 500 body is the frozen ACTIVITY_UNAVAILABLE constant', () => {
    // structural identity of the constant the failed() path returns
    expect(ACTIVITY_UNAVAILABLE_BODY.error.code).toBe('ACTIVITY_UNAVAILABLE');
    expect(Object.isFrozen(ACTIVITY_UNAVAILABLE_BODY)).toBe(true);
  });
});
