import Database from 'better-sqlite3';
import { UsageEvent } from './types';

/**
 * Own activity.db: file lifecycle (path from ACTIVITY_DB_PATH only — the
 * portfolio.db __dirname pattern is deliberately not reused), WAL, schema
 * DDL and the idempotent upsert on the unique key (FR-17 primitive).
 */
export interface ActivityDbOptions {
  path?: string;
  readonly?: boolean;
}

export interface UpsertResult {
  seen: number;
  written: number;
}

/** Schema DDL — matches the architecture data model column-for-column. */
export const ACTIVITY_SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS usage_event (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tool            TEXT    NOT NULL,
  source_id       TEXT    NOT NULL,
  occurred_at_utc TEXT    NOT NULL,
  day_local       TEXT    NOT NULL CHECK (day_local GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  input_tokens    INTEGER NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens   INTEGER NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  prompt_count    INTEGER NOT NULL DEFAULT 0 CHECK (prompt_count >= 0),
  model           TEXT    NOT NULL,
  task_type       TEXT    NOT NULL,
  UNIQUE (tool, source_id)
);
CREATE INDEX IF NOT EXISTS idx_usage_event_day_local ON usage_event (day_local);
CREATE INDEX IF NOT EXISTS idx_usage_event_tool_day  ON usage_event (tool, day_local);

CREATE TABLE IF NOT EXISTS import_run (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at     TEXT    NOT NULL,
  finished_at    TEXT,
  status         TEXT    NOT NULL CHECK (status IN ('running','success','failed')),
  events_seen    INTEGER NOT NULL DEFAULT 0,
  events_written INTEGER NOT NULL DEFAULT 0,
  error          TEXT
);
CREATE INDEX IF NOT EXISTS idx_import_run_status_started ON import_run (status, started_at);
`;

/**
 * Open activity.db. Path precedence: options.path > env ACTIVITY_DB_PATH;
 * neither => throw (no silent default, no __dirname fallback).
 */
export function openActivityDb(options: ActivityDbOptions = {}): Database.Database {
  const dbPath = options.path ?? process.env.ACTIVITY_DB_PATH;
  if (!dbPath) {
    throw new Error(
      'ACTIVITY_DB_PATH is not set and no path option was given; ' +
        'activity.db has no default location (the portfolio.db __dirname pattern is not reused)',
    );
  }
  const db = new Database(dbPath, options.readonly ? { readonly: true } : {});
  if (!options.readonly) {
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
  }
  return db;
}

/** Create the schema. Idempotent (IF NOT EXISTS), so callers may run it every time. */
export function initActivitySchema(db: Database.Database): void {
  db.exec(ACTIVITY_SCHEMA_DDL);
}

/**
 * Insert or update events in a single transaction on UNIQUE(tool, source_id).
 * written counts inserted + updated rows (US-3's import_run counters).
 * Any error rolls the whole call's transaction back.
 */
export function upsertUsageEvents(
  db: Database.Database,
  events: readonly UsageEvent[],
): UpsertResult {
  const insert = db.prepare(`
    INSERT INTO usage_event (
      tool, source_id, occurred_at_utc, day_local,
      input_tokens, output_tokens, prompt_count, model, task_type
    ) VALUES (
      @tool, @sourceId, @occurredAtUtc, @dayLocal,
      @inputTokens, @outputTokens, @promptCount, @model, @taskType
    )
    ON CONFLICT(tool, source_id) DO UPDATE SET
      occurred_at_utc = excluded.occurred_at_utc,
      day_local       = excluded.day_local,
      input_tokens    = excluded.input_tokens,
      output_tokens   = excluded.output_tokens,
      prompt_count    = excluded.prompt_count,
      model           = excluded.model,
      task_type       = excluded.task_type
  `);
  const run = db.transaction((rows: readonly UsageEvent[]) => {
    let written = 0;
    for (const event of rows) {
      const info = insert.run(event);
      written += info.changes;
    }
    return written;
  });
  const written = run(events);
  return { seen: events.length, written };
}
