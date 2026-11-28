import fs from 'fs';
import os from 'os';
import path from 'path';
import type Database from 'better-sqlite3';
import {
  GROUPED_ROWS_SQL,
  LAST_SUCCESS_RUN_SQL,
  openActivityView,
  selectGroupedRows,
  selectLastSuccessfulRun,
  selectMaxDayLocal,
} from '../src/activity/activityRepository';
import { SEED_FINISHED_AT, SEED_TO_DAY, seedActivityDb } from './fixtures/activitySeed';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us4-repo-'));
let dbCounter = 0;
function freshDbPath(): string {
  return path.join(tmpRoot, `activity-${dbCounter++}.db`);
}

function withView<T>(dbPath: string, fn: (db: Database.Database) => T): T {
  const db = openActivityView(dbPath);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

describe('activityRepository freshness query', () => {
  it('returns the seeded successful finished_at and ignores failed rows', () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 10 }); // default runs:'success' + failed marker bait
    const fact = withView(dbPath, (db) => selectLastSuccessfulRun(db));
    expect(fact).toEqual({ finished_at: SEED_FINISHED_AT });
  });

  it('ignores running rows (newest started_at with finished_at NULL)', () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 5, runs: 'running-only' });
    expect(withView(dbPath, (db) => selectLastSuccessfulRun(db))).toBeNull();
  });

  it('ignores failed-only runs', () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 5, runs: 'failed-only' });
    expect(withView(dbPath, (db) => selectLastSuccessfulRun(db))).toBeNull();
  });

  it('falls back to the newest day present when no run succeeded (AC-3 anchor)', () => {
    const dbPath = freshDbPath();
    const facts = seedActivityDb({ dbPath, days: 7, runs: 'none', withMarker: false });
    expect(withView(dbPath, (db) => selectMaxDayLocal(db))).toBe(SEED_TO_DAY);
    expect(facts.rows[0].day_local).toBe(SEED_TO_DAY);
  });

  it('has no rows at all on a schema-only database', () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 0, runs: 'none', withMarker: false });
    expect(withView(dbPath, (db) => selectMaxDayLocal(db))).toBeNull();
  });
});

describe('activityRepository grouped rows query', () => {
  const dbPath = freshDbPath();
  const facts = seedActivityDb({ dbPath, days: 60 });

  it('a 7-day window deep-equals the fixture totals, including order', () => {
    const from = '2026-11-21';
    const to = '2026-11-27';
    const rows = withView(dbPath, (db) => selectGroupedRows(db, { from, to }));
    expect(rows).toEqual(facts.expectedRows(from, to));
    expect(rows.length).toBeGreaterThan(0);
  });

  it('a range with no data returns an empty array', () => {
    const rows = withView(dbPath, (db) =>
      selectGroupedRows(db, { from: '2000-01-01', to: '2000-12-31' }),
    );
    expect(rows).toEqual([]);
  });

  it('exposes the two statements verbatim for the SELECT-only source scan', () => {
    expect(LAST_SUCCESS_RUN_SQL).toContain("status = 'success'");
    expect(GROUPED_ROWS_SQL).toContain('BETWEEN ? AND ?');
    expect(GROUPED_ROWS_SQL).toContain('GROUP BY day_local, tool, model, task_type');
  });
});
