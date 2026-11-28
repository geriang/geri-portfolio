import type Database from 'better-sqlite3';
import { openActivityDb } from '../import/activityDb';
import { ActivityRange, Ymd } from './timeRange';

/**
 * US-4 read-model query layer: the API's only database connection. It opens
 * activity.db through the importer's own open helper in read-only mode
 * (AC-5: the API writes nothing, creates no schema, migrates nothing and
 * issues no connection-tuning statements) and issues exactly the two
 * statements below. The open helper keeps the
 * path/precedence/env rules: options path > ACTIVITY_DB_PATH > throw — the
 * API never invents a default location and never uses the legacy
 * portfolio-database file-location pattern.
 */

/** AC-5: the single open-mode constant; deep-equals { readonly: true }. */
export const ACTIVITY_READ_OPTIONS = Object.freeze({ readonly: true });

/** Newest successful run (import_run is tiny: roughly one row per day). */
export const LAST_SUCCESS_RUN_SQL = `
SELECT finished_at FROM import_run
 WHERE status = 'success' AND finished_at IS NOT NULL
 ORDER BY finished_at DESC, id DESC
 LIMIT 1;
`;

/** The contract rows: inclusive range on the ISO day_local text, stable order. */
export const GROUPED_ROWS_SQL = `
SELECT day_local, tool, model, task_type,
       SUM(input_tokens) AS input_tokens,
       SUM(output_tokens) AS output_tokens,
       SUM(prompt_count)  AS prompt_count
  FROM usage_event
 WHERE day_local BETWEEN ? AND ?
 GROUP BY day_local, tool, model, task_type
 ORDER BY day_local, tool, model, task_type;
`;

export interface ImportRunFact {
  readonly finished_at: string | null;
}

export interface ActivityGroupRow {
  readonly day_local: string;
  readonly tool: string;
  readonly model: string;
  readonly task_type: string;
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly prompt_count: number;
}

/**
 * Open the read-only view of activity.db. Deliberately no try/catch and no
 * connection-tuning statements here: whatever the reused helper throws
 * (missing path configuration, SQLITE_CANTOPEN, ...) is handled by the
 * SERVICE (AC-3: empty dataset, never a 500).
 */
export function openActivityView(dbPath?: string): Database.Database {
  return openActivityDb({ path: dbPath, ...ACTIVITY_READ_OPTIONS });
}

export function selectLastSuccessfulRun(db: Database.Database): ImportRunFact | null {
  const row = db.prepare(LAST_SUCCESS_RUN_SQL).get() as ImportRunFact | undefined;
  return row === undefined ? null : row;
}

export function selectGroupedRows(db: Database.Database, range: ActivityRange): ActivityGroupRow[] {
  return db.prepare(GROUPED_ROWS_SQL).all(range.from, range.to) as ActivityGroupRow[];
}

/**
 * Bounds that include every CHECK-legal day_local value, used only to derive
 * the newest day present when no successful import_run exists (AC-3 flow B).
 * It reuses GROUPED_ROWS_SQL — this module holds exactly two statements.
 */
const EVERY_DAY: ActivityRange = { from: '0000-01-01', to: '9999-12-31' };

/**
 * Newest day_local present in usage_event, or null when the table is empty.
 * Used by the service as the default-range anchor when import_run has no
 * successful row (a run interrupted between the committed upsert and the
 * success write still leaves rows).
 */
export function selectMaxDayLocal(db: Database.Database): Ymd | null {
  const rows = selectGroupedRows(db, EVERY_DAY);
  return rows.length === 0 ? null : rows[rows.length - 1].day_local;
}
