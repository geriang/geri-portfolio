import Database from 'better-sqlite3';
import { initActivitySchema, openActivityDb, upsertUsageEvents } from '../../src/import/activityDb';
import { MODEL_FALLBACK } from '../../src/import/modelNormalise';
import { UsageEvent } from '../../src/import/types';
import { NORMALISED_DESCRIPTOR_A } from './opencodeDb';

/**
 * Deterministic generated activity.db seeder for the US-4 API tests
 * (NFR-5: every value below is invented — no real names, hostnames,
 * accounts, paths or prompt/response text anywhere).
 *
 * Rows go in through the importer's own write path (initActivitySchema +
 * upsertUsageEvents) so the tests exercise the real schema and upsert;
 * import_run rows are not written by that helper, so this file inserts them
 * itself. No Math.random, no wall clock: day N is SEED_TO_DAY minus N
 * calendar days and every value is a pure function of (day index, row index).
 */

/** asOfDate / default `to` for every seeded database. */
export const SEED_TO_DAY = '2026-11-27';
/**
 * Spec-pinned import_run instants (UTC-instant rule): both sit late on
 * SEED_TO_DAY in UTC (23:00 / 23:30 SGT) and satisfy
 * toDayLocal(instant, 'Asia/Singapore') === SEED_TO_DAY — any import_run
 * instant at or after 16:00Z would land on the NEXT Singapore day and
 * break every asOfDate / default-range pin. Asserted in
 * activitySeed.test.ts, never trusted from the literal.
 */
export const SEED_STARTED_AT = '2026-11-27T15:00:00.000Z';
/** importer-shaped ISO Z finished_at of the seeded successful run. */
export const SEED_FINISHED_AT = '2026-11-27T15:30:00.000Z';
/** started_at for the extra 'running-only' row: newer than SEED_STARTED_AT. */
export const SEED_RUNNING_STARTED_AT = '2026-11-27T15:45:00.000Z';
/** addMonths(SEED_TO_DAY, -12): the default-range `from`. */
export const SEED_FROM_DAY = '2025-11-27';

/** AC-7 bait marker: stands in for prompt/response text, must never surface. */
export const SEED_MARKER = 'MK-activity-content-7c41d9e3';

export const SEED_TOOLS = ['fixture-tool-a', 'fixture-tool-b'] as const;

/**
 * Plain US-23-style names — NO braces ever (a brace-bearing value is a
 * US-23 defect). The descriptor and fallback values are single-sourced from
 * the existing fixture and normaliser, never retyped.
 */
export const SEED_MODELS = ['fixture-model-a', NORMALISED_DESCRIPTOR_A, MODEL_FALLBACK] as const;

/** Real values from config/task-rules.json (a rules catalogue subset). */
export const SEED_TASK_TYPES = ['Coding/implementation', 'Debugging/fixing', 'Uncategorised'] as const;

export type SeedRuns = 'success' | 'failed-only' | 'running-only' | 'none';

export interface SeedOptions {
  dbPath: string;
  /** default 300 (>= AC-8's 300-day floor); day N = SEED_TO_DAY - N. */
  days?: number;
  /** default 2 (one per tool). */
  rowsPerDay?: number;
  /** default 'success'. */
  runs?: SeedRuns;
  /** default true. */
  withMarker?: boolean;
}

export interface SeedRow {
  day_local: string;
  tool: string;
  model: string;
  task_type: string;
  input_tokens: number;
  output_tokens: number;
  prompt_count: number;
}

export interface SeedFacts {
  rows: SeedRow[];
  distinctDays: number;
  distinctModels: string[];
  distinctTaskTypes: string[];
  distinctTools: string[];
  asOfDate: string;
  lastUpdated: string | null;
  /** grouped + summed + sorted rows for the inclusive range, computed in JS. */
  expectedRows(from: string, to: string): SeedRow[];
  totalsForDays(days: string[]): { input_tokens: number; output_tokens: number; prompt_count: number };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SEED_TO_UTC_MS = Date.parse(`${SEED_TO_DAY}T00:00:00Z`);

/** Day index 0 = SEED_TO_DAY, counting backwards one calendar day per step. */
function dayForIndex(i: number): string {
  return new Date(SEED_TO_UTC_MS - i * DAY_MS).toISOString().slice(0, 10);
}

function sortedDistinct(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

/**
 * Write a fully generated activity.db at options.dbPath and return the facts
 * the tests compare the API against.
 */
export function seedActivityDb(options: SeedOptions): SeedFacts {
  const days = options.days ?? 300;
  const rowsPerDay = options.rowsPerDay ?? 2;
  const runs: SeedRuns = options.runs ?? 'success';
  const withMarker = options.withMarker !== false;

  const events: UsageEvent[] = [];
  const rows: SeedRow[] = [];
  for (let i = 0; i < days; i += 1) {
    const dayLocal = dayForIndex(i);
    for (let j = 0; j < rowsPerDay; j += 1) {
      const tool = SEED_TOOLS[j % 2];
      const model = SEED_MODELS[(i + j) % 3];
      const taskType = SEED_TASK_TYPES[(i * 2 + j) % 3];
      const inputTokens = 100 + i;
      const outputTokens = 40 + ((i * 7) % 60);
      const promptCount = 1 + (i % 3);
      const sourceId =
        `seed-${tool}-${i}-${j}` + (withMarker ? `-${SEED_MARKER}` : '');
      const event: UsageEvent = {
        tool,
        sourceId,
        occurredAtUtc: `${dayLocal}T04:00:00Z`, // local noon in Asia/Singapore
        dayLocal,
        inputTokens,
        outputTokens,
        promptCount,
        model,
        taskType,
      };
      events.push(event);
      rows.push({
        day_local: dayLocal,
        tool,
        model,
        task_type: taskType,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        prompt_count: promptCount,
      });
    }
  }

  const db: Database.Database = openActivityDb({ path: options.dbPath });
  try {
    initActivitySchema(db);
    upsertUsageEvents(db, events);

    const insertRun = db.prepare(
      'INSERT INTO import_run (started_at, finished_at, status, events_seen, events_written, error) ' +
        'VALUES (?, ?, ?, ?, ?, ?)',
    );
    if (runs === 'success') {
      insertRun.run(SEED_STARTED_AT, SEED_FINISHED_AT, 'success', events.length, events.length, null);
    } else if (runs === 'failed-only') {
      insertRun.run(SEED_STARTED_AT, '2026-11-27T15:05:00.000Z', 'failed', 0, 0, 'generated failure');
    } else if (runs === 'running-only') {
      insertRun.run(SEED_STARTED_AT, null, 'running', 0, 0, null);
    }
    if (withMarker) {
      // Bait for AC-7: the marker sits in import_run.error (and in every
      // source_id) — neither column is ever read by the API. Kept late on
      // SEED_TO_DAY in UTC like every other seeded import_run instant.
      insertRun.run(SEED_STARTED_AT, '2026-11-27T15:10:00.000Z', 'failed', 0, 0, `import failed: ${SEED_MARKER}`);
      if (runs === 'running-only') {
        // A running row with started_at newer than SEED_STARTED_AT and
        // finished_at NULL: must be ignored by the freshness query.
        insertRun.run(SEED_RUNNING_STARTED_AT, null, 'running', 0, 0, null);
      }
    }
    db.pragma('wal_checkpoint(TRUNCATE)');
  } finally {
    db.close();
  }

  const facts: SeedFacts = {
    rows,
    distinctDays: new Set(rows.map((row) => row.day_local)).size,
    distinctModels: sortedDistinct(rows.map((row) => row.model)),
    distinctTaskTypes: sortedDistinct(rows.map((row) => row.task_type)),
    distinctTools: sortedDistinct(rows.map((row) => row.tool)),
    asOfDate: SEED_TO_DAY,
    lastUpdated: runs === 'success' ? SEED_FINISHED_AT : null,
    expectedRows(from: string, to: string): SeedRow[] {
      const grouped = new Map<string, SeedRow>();
      for (const row of rows) {
        if (row.day_local < from || row.day_local > to) {
          continue;
        }
        const key = `${row.day_local}\u0000${row.tool}\u0000${row.model}\u0000${row.task_type}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.input_tokens += row.input_tokens;
          existing.output_tokens += row.output_tokens;
          existing.prompt_count += row.prompt_count;
        } else {
          grouped.set(key, { ...row });
        }
      }
      return [...grouped.values()].sort(
        (a, b) =>
          a.day_local.localeCompare(b.day_local) ||
          a.tool.localeCompare(b.tool) ||
          a.model.localeCompare(b.model) ||
          a.task_type.localeCompare(b.task_type),
      );
    },
    totalsForDays(selectedDays: string[]) {
      const wanted = new Set(selectedDays);
      const totals = { input_tokens: 0, output_tokens: 0, prompt_count: 0 };
      for (const row of rows) {
        if (wanted.has(row.day_local)) {
          totals.input_tokens += row.input_tokens;
          totals.output_tokens += row.output_tokens;
          totals.prompt_count += row.prompt_count;
        }
      }
      return totals;
    },
  };
  return facts;
}

/** Schema only, no rows, no import_run rows: the AC-3 "never imported yet" DB. */
export function createEmptyActivityDb(dbPath: string): void {
  const db: Database.Database = openActivityDb({ path: dbPath });
  try {
    initActivitySchema(db);
  } finally {
    db.close();
  }
}
