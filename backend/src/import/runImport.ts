import Database from 'better-sqlite3';
import { ToolAdapter } from './adapter';
import { initActivitySchema, openActivityDb, upsertUsageEvents } from './activityDb';
import { toUsageEvent } from './normalize';
import { TaskRulesConfig, loadTaskRulesConfig } from './taskRules';
import { UsageEvent } from './types';

/**
 * One import run, one Unit of Work: insert the import_run row (running) →
 * pull records from the given adapters over the window → normalize via US-2
 * toUsageEvent → upsert ALL events in ONE transaction → finalize the run row
 * (success/failed, counts, sanitized error) → WAL checkpoint. A failure
 * anywhere before the upsert leaves 0 partial rows (NFR-12); the next run's
 * sliding window re-reads and recovers (AC-5).
 */

/** Story default: the daily run re-reads the last 7 days (NFR-12 recovery). */
export const DEFAULT_WINDOW_DAYS = 7;

/** Import window: inclusive `sinceUtc`, exclusive `untilUtc`, ISO UTC. */
export interface ImportWindow {
  sinceUtc: string;
  untilUtc: string;
}

/**
 * Sliding window ending at `now` (injectable for deterministic tests),
 * `days` days wide.
 */
export function computeWindow(now: Date = new Date(), days: number = DEFAULT_WINDOW_DAYS): ImportWindow {
  if (!Number.isInteger(days) || days <= 0) {
    throw new RangeError(`window days must be a positive integer, got ${String(days)}`);
  }
  const untilMs = now.getTime();
  const since = new Date(untilMs - days * 24 * 60 * 60 * 1000);
  if (Number.isNaN(untilMs)) {
    throw new RangeError(`invalid window end date: ${String(now)}`);
  }
  return { sinceUtc: since.toISOString(), untilUtc: now.toISOString() };
}

/** Thrown by the `failAfter` test seam right before the upsert (AC-4). */
export class ImportFailureInjectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportFailureInjectedError';
  }
}

export interface ImportRunOptions {
  /** Adapter INSTANCES — runImport knows no tool names (registry-agnostic). */
  adapters: readonly ToolAdapter[];
  /** Precedence into openActivityDb: option > env ACTIVITY_DB_PATH. */
  activityDbPath?: string;
  /** The CLI passes computeWindow(...). */
  window: ImportWindow;
  /** Default: loadTaskRulesConfig(). */
  rulesConfig?: TaskRulesConfig;
  /** Test seam: throw after N records pulled (pre-upsert, post-count). */
  failAfter?: number;
  /** Default: () => new Date() — started/finished stamps. */
  now?: () => Date;
}

export interface ImportRunSummary {
  /** import_run.id */
  runId: number;
  tools: string[];
  status: 'success' | 'failed';
  /** ISO Z */
  startedAt: string;
  /** ISO Z */
  finishedAt: string;
  sinceUtc: string;
  untilUtc: string;
  eventsSeen: number;
  eventsWritten: number;
  /** Distinct day_local values touched by this run, ascending. */
  days: string[];
  /**
   * US-23: total fallback rows across the run's adapters (sum of each
   * adapter's modelFallbackCount) — a number-only signal, present on
   * success runs only. Never carries any source value (NFR-5).
   */
  modelFallbacks?: number;
  /**
   * Sanitized error text (sanitizeRunError), present only on failed runs —
   * the CLI's stderr line needs it because runImport never throws for
   * run-level errors. Never contains source content (NFR-5).
   */
  error?: string;
}

/**
 * `name: first line of message` truncated to 500 chars. Errors constructed
 * by US-3 carry ids/timestamps/column names only; an unexpected throw is
 * reduced to one sanitized line so `import_run.error` never echoes rows.
 */
export function sanitizeRunError(err: unknown): string {
  const name = err instanceof Error && err.name ? err.name : 'Error';
  const message = err instanceof Error ? err.message : String(err);
  const firstLine = message.split('\n', 1)[0].trim();
  const text = firstLine === '' ? name : `${name}: ${firstLine}`;
  return text.slice(0, 500);
}

/**
 * Sweep import_run rows left `running` by a killed process: status → failed,
 * error → 'abandoned run'. Returns the number of rows swept.
 */
export function markAbandonedRuns(db: Database.Database, now: () => Date = () => new Date()): number {
  const info = db
    .prepare(
      "UPDATE import_run SET status = 'failed', finished_at = ?, error = 'abandoned run' WHERE status = 'running'",
    )
    .run(now().toISOString());
  return info.changes;
}

/**
 * Run one import over `options.window`. Returns an ImportRunSummary and
 * NEVER throws for run-level errors (adapter/upsert failures mark the run
 * failed). Config errors (e.g. missing ACTIVITY_DB_PATH) propagate from
 * openActivityDb before any run row exists.
 */
export function runImport(options: ImportRunOptions): ImportRunSummary {
  const stamp = options.now ?? (() => new Date());
  const db = openActivityDb({ path: options.activityDbPath });
  try {
    initActivitySchema(db);
    markAbandonedRuns(db, stamp);

    const startedAt = stamp().toISOString();
    const runInfo = db
      .prepare("INSERT INTO import_run (started_at, status) VALUES (?, 'running')")
      .run(startedAt);
    const runId = Number(runInfo.lastInsertRowid);

    const tools = options.adapters.map((adapter) => adapter.tool);
    const base = {
      runId,
      tools,
      sinceUtc: options.window.sinceUtc,
      untilUtc: options.window.untilUtc,
      startedAt,
    };

    const rulesConfig = options.rulesConfig ?? loadTaskRulesConfig();
    let eventsSeen = 0;
    try {
      const events: UsageEvent[] = [];
      for (const adapter of options.adapters) {
        for (const record of adapter.readEvents(options.window.sinceUtc, options.window.untilUtc)) {
          eventsSeen += 1;
          if (options.failAfter !== undefined && eventsSeen === options.failAfter) {
            throw new ImportFailureInjectedError(
              `import failure injected after ${options.failAfter} events`,
            );
          }
          events.push(toUsageEvent(record, adapter.tool, rulesConfig));
        }
      }
      // ONE transaction (US-2): an error above means nothing was inserted.
      const result = upsertUsageEvents(db, events);
      // US-23: numeric-only fallback signal, read after the pull loop, on
      // success runs only. Adapters without a counter contribute 0.
      const modelFallbacks = options.adapters.reduce(
        (total, adapter) =>
          total + ((adapter as { modelFallbackCount?: number }).modelFallbackCount ?? 0),
        0,
      );
      const finishedAt = stamp().toISOString();
      db.prepare(
        'UPDATE import_run SET finished_at = ?, status = ?, events_seen = ?, events_written = ? WHERE id = ?',
      ).run(finishedAt, 'success', eventsSeen, result.written, runId);
      // ADR-6 end-of-run checkpoint.
      db.pragma('wal_checkpoint(TRUNCATE)');
      return {
        ...base,
        finishedAt,
        status: 'success',
        eventsSeen,
        eventsWritten: result.written,
        days: [...new Set(events.map((event) => event.dayLocal))].sort(),
        modelFallbacks,
      };
    } catch (err) {
      const finishedAt = stamp().toISOString();
      const error = sanitizeRunError(err);
      db.prepare(
        'UPDATE import_run SET finished_at = ?, status = ?, events_seen = ?, events_written = 0, error = ? WHERE id = ?',
      ).run(finishedAt, 'failed', eventsSeen, error, runId);
      return {
        ...base,
        finishedAt,
        status: 'failed',
        eventsSeen,
        eventsWritten: 0,
        days: [],
        error,
      };
    }
  } finally {
    db.close();
  }
}
