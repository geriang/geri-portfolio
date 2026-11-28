import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import {
  SEED_FINISHED_AT,
  SEED_FROM_DAY,
  SEED_MARKER,
  SEED_MODELS,
  SEED_TASK_TYPES,
  SEED_TO_DAY,
  SEED_TOOLS,
  createEmptyActivityDb,
  seedActivityDb,
} from './fixtures/activitySeed';
import { NORMALISED_DESCRIPTOR_A } from './fixtures/opencodeDb';
import { MODEL_FALLBACK } from '../src/import/modelNormalise';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us4-seed-'));
let dbCounter = 0;
function freshDbPath(): string {
  return path.join(tmpRoot, `activity-${dbCounter++}.db`);
}

function openReadOnly(dbPath: string): Database.Database {
  return new Database(dbPath, { readonly: true });
}

describe('seedActivityDb facts', () => {
  const dbPath = freshDbPath();
  const facts = seedActivityDb({ dbPath, days: 300 });

  it('meets the AC-8 floor: >= 300 rows across >= 300 days, 3 models, 3 task types, 2 tools', () => {
    expect(facts.rows.length).toBeGreaterThanOrEqual(300);
    expect(facts.distinctDays).toBeGreaterThanOrEqual(300);
    expect(facts.distinctTools).toEqual([...SEED_TOOLS]);
    expect(facts.distinctModels).toEqual([...SEED_MODELS].sort());
    expect(facts.distinctTaskTypes).toEqual([...SEED_TASK_TYPES].sort());
  });

  it('writes every day_local as YYYY-MM-DD and every model brace-free (US-23 guard)', () => {
    for (const row of facts.rows) {
      expect(row.day_local).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.model).not.toContain('{');
      expect(row.model).not.toContain('}');
    }
  });

  it('single-sources the US-23 normalised and fallback model values', () => {
    expect(SEED_MODELS).toContain(NORMALISED_DESCRIPTOR_A);
    expect(SEED_MODELS).toContain(MODEL_FALLBACK);
  });

  it('anchors on the published seed constants', () => {
    expect(facts.asOfDate).toBe(SEED_TO_DAY);
    expect(facts.lastUpdated).toBe(SEED_FINISHED_AT);
    expect(facts.rows[0].day_local).toBe(SEED_TO_DAY);
    // 300 distinct days back from SEED_TO_DAY reaches before SEED_FROM_DAY.
    expect(SEED_FROM_DAY < SEED_TO_DAY).toBe(true);
  });

  it('writes rows through the importer schema (usage_event queryable)', () => {
    const db = openReadOnly(dbPath);
    try {
      const { count } = db.prepare('SELECT COUNT(*) AS count FROM usage_event').get() as {
        count: number;
      };
      expect(count).toBe(facts.rows.length);
    } finally {
      db.close();
    }
  });

  it('runs:"success" writes exactly one successful import_run with the seeded finished_at', () => {
    const db = openReadOnly(dbPath);
    try {
      const runs = db
        .prepare("SELECT status, COUNT(*) AS count FROM import_run GROUP BY status")
        .all() as Array<{ status: string; count: number }>;
      const byStatus = Object.fromEntries(runs.map((r) => [r.status, r.count]));
      expect(byStatus.success).toBe(1);
      expect(byStatus.failed).toBe(1); // withMarker default adds the bait run
      const { finished_at } = db
        .prepare("SELECT finished_at FROM import_run WHERE status = 'success'")
        .get() as { finished_at: string };
      expect(finished_at).toBe(SEED_FINISHED_AT);
    } finally {
      db.close();
    }
  });

  it('withMarker puts the marker in source_id and in a failed run error (AC-7 bait)', () => {
    const db = openReadOnly(dbPath);
    try {
      const { count } = db
        .prepare('SELECT COUNT(*) AS count FROM usage_event WHERE source_id LIKE ?')
        .get(`%${SEED_MARKER}`) as { count: number };
      expect(count).toBe(facts.rows.length);
      const { count: runCount } = db
        .prepare('SELECT COUNT(*) AS count FROM import_run WHERE error LIKE ?')
        .get(`%${SEED_MARKER}`) as { count: number };
      expect(runCount).toBe(1);
    } finally {
      db.close();
    }
  });

  it('expectedRows groups, sums, sorts and honours the inclusive range', () => {
    const inRange = facts.expectedRows(SEED_FROM_DAY, SEED_TO_DAY);
    expect(inRange.length).toBeGreaterThan(0);
    for (const row of inRange) {
      expect(row.day_local >= SEED_FROM_DAY).toBe(true);
      expect(row.day_local <= SEED_TO_DAY).toBe(true);
    }
    // deterministic order
    const keys = inRange.map((r) => `${r.day_local}|${r.tool}|${r.model}|${r.task_type}`);
    expect(keys).toEqual([...keys].sort());
    // sums: the 7-day window totals equal totalsForDays over the same days
    const week = facts
      .expectedRows('2026-11-21', '2026-11-27')
      .reduce(
        (acc, r) => ({
          input_tokens: acc.input_tokens + r.input_tokens,
          output_tokens: acc.output_tokens + r.output_tokens,
          prompt_count: acc.prompt_count + r.prompt_count,
        }),
        { input_tokens: 0, output_tokens: 0, prompt_count: 0 },
      );
    const days = [...new Set(inRange.map((r) => r.day_local))].filter(
      (d) => d >= '2026-11-21' && d <= '2026-11-27',
    );
    expect(days.length).toBe(7);
    expect(week).toEqual(facts.totalsForDays(days));
    // a range with no data is empty
    expect(facts.expectedRows('2000-01-01', '2000-12-31')).toEqual([]);
  });

  it('deterministic: seeding twice yields identical facts', () => {
    const again = seedActivityDb({ dbPath: freshDbPath(), days: 300 });
    expect(again.rows).toEqual(facts.rows);
  });
});

describe('non-default run modes', () => {
  it('failed-only / running-only / none leave no successful run', () => {
    for (const runs of ['failed-only', 'running-only', 'none'] as const) {
      const dbPath = freshDbPath();
      const facts = seedActivityDb({ dbPath, days: 5, runs });
      expect(facts.lastUpdated).toBeNull();
      const db = openReadOnly(dbPath);
      try {
        const { count } = db
          .prepare("SELECT COUNT(*) AS count FROM import_run WHERE status = 'success'")
          .get() as { count: number };
        expect(count).toBe(0);
      } finally {
        db.close();
      }
    }
  });

  it('running-only with marker keeps a newer running row with finished_at NULL', () => {
    const dbPath = freshDbPath();
    seedActivityDb({ dbPath, days: 3, runs: 'running-only' });
    const db = openReadOnly(dbPath);
    try {
      const running = db
        .prepare("SELECT started_at, finished_at FROM import_run WHERE status = 'running' ORDER BY started_at")
        .all() as Array<{ started_at: string; finished_at: string | null }>;
      expect(running.length).toBe(2);
      expect(running.every((r) => r.finished_at === null)).toBe(true);
      expect(running[1].started_at > running[0].started_at).toBe(true);
    } finally {
      db.close();
    }
  });
});

describe('createEmptyActivityDb', () => {
  it('creates both tables with 0 rows', () => {
    const dbPath = freshDbPath();
    createEmptyActivityDb(dbPath);
    const db = openReadOnly(dbPath);
    try {
      const usage = db.prepare('SELECT COUNT(*) AS count FROM usage_event').get() as { count: number };
      const runs = db.prepare('SELECT COUNT(*) AS count FROM import_run').get() as { count: number };
      expect(usage.count).toBe(0);
      expect(runs.count).toBe(0);
    } finally {
      db.close();
    }
  });
});
