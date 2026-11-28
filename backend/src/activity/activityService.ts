import { toDayLocal } from '../import/dayLocal';
import {
  ACTIVITY_EMPTY_LOG_LINE,
  ACTIVITY_FAILURE_LOG_LINE,
  ACTIVITY_UNAVAILABLE_BODY,
  ActivityErrorBody,
  INVALID_ACTIVITY_RANGE_BODY,
  errorBody,
} from './activityErrors';
import {
  ActivityGroupRow,
  openActivityView,
  selectGroupedRows,
  selectLastSuccessfulRun,
  selectMaxDayLocal,
} from './activityRepository';
import {
  ACTIVITY_TIME_ZONE,
  ActivityRange,
  ActivityRangeRequest,
  isBlankActivityParam,
  resolveRange,
} from './timeRange';

/**
 * US-4 orchestration: freshness facts, inclusive-range resolution, metadata
 * assembly and the empty/500 mapping. Express-free on purpose (the router
 * stays an adapter), and it never throws: every outcome is a plain
 * ActivityResult the router can only serialise.
 */

export interface ActivityMetadata {
  readonly timeZone: string;
  readonly asOfDate: string | null;
  readonly lastUpdated: string | null;
  readonly from: string | null;
  readonly to: string | null;
  readonly taskTypes: string[];
  readonly models: string[];
  readonly tools: string[];
}

export interface ActivityResponse {
  readonly metadata: ActivityMetadata;
  readonly rows: ActivityGroupRow[];
}

export type ActivityResult =
  | { readonly status: 200; readonly body: ActivityResponse }
  | { readonly status: 400; readonly body: ActivityErrorBody }
  | { readonly status: 500; readonly body: ActivityErrorBody };

export interface ActivityServiceOptions {
  readonly dbPath?: string;
}

/** AC-7 key allow-list: nothing outside these keys is ever served. */
export const ACTIVITY_TOP_LEVEL_KEYS: readonly string[] = Object.freeze(['metadata', 'rows']);
export const ACTIVITY_METADATA_KEYS: readonly string[] = Object.freeze([
  'timeZone',
  'asOfDate',
  'lastUpdated',
  'from',
  'to',
  'taskTypes',
  'models',
  'tools',
]);
export const ACTIVITY_ROW_KEYS: readonly string[] = Object.freeze([
  'day_local',
  'tool',
  'model',
  'task_type',
  'input_tokens',
  'output_tokens',
  'prompt_count',
]);

/** Null Object for AC-3: every key exists with nulls/[]; the range echoes when given. */
export function emptyActivityMetadata(range?: ActivityRange): ActivityMetadata {
  return {
    timeZone: ACTIVITY_TIME_ZONE,
    asOfDate: null,
    lastUpdated: null,
    from: range === undefined ? null : range.from,
    to: range === undefined ? null : range.to,
    taskTypes: [],
    models: [],
    tools: [],
  };
}

function distinctSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function failed(): ActivityResult {
  console.error(ACTIVITY_FAILURE_LOG_LINE);
  return { status: 500, body: errorBody(ACTIVITY_UNAVAILABLE_BODY) };
}

/**
 * Serve the activity dataset for the request. never throws, logs only the
 * two constant lines, and — per request — opens the read-only view, reads
 * the freshness facts (import_run first, newest day present as the launch
 * fallback), resolves the inclusive range and reads the grouped rows. An
 * unopenable or absent database is the empty dataset (200), never a 500
 * (AC-3); only an unexpected query failure maps to the frozen 500.
 */
export function getActivity(
  request: ActivityRangeRequest = {},
  options: ActivityServiceOptions = {},
): ActivityResult {
  let warned = false;
  const warnEmpty = (): void => {
    if (!warned) {
      warned = true;
      console.warn(ACTIVITY_EMPTY_LOG_LINE);
    }
  };

  let db;
  try {
    db = openActivityView(options.dbPath);
  } catch {
    warnEmpty();
    return { status: 200, body: { metadata: emptyActivityMetadata(), rows: [] } };
  }

  try {
    let asOfDate: string | null = null;
    let lastUpdated: string | null = null;
    try {
      const run = selectLastSuccessfulRun(db);
      if (run !== null && run.finished_at !== null) {
        try {
          asOfDate = toDayLocal(run.finished_at, ACTIVITY_TIME_ZONE);
          lastUpdated = run.finished_at;
        } catch {
          // Unparseable finished_at behaves exactly like "no successful
          // run" (design error table) — never a 500.
          asOfDate = null;
          lastUpdated = null;
          warnEmpty();
        }
      }
      if (asOfDate === null) {
        asOfDate = selectMaxDayLocal(db);
      }
    } catch {
      return failed();
    }

    const resolution = resolveRange(request, asOfDate);
    if (!resolution.ok) {
      if (
        asOfDate === null &&
        isBlankActivityParam(request.from) &&
        isBlankActivityParam(request.to)
      ) {
        // AC-3 flow B: no data at all and nothing to anchor a default on —
        // serve the empty dataset without querying.
        warnEmpty();
        return { status: 200, body: { metadata: emptyActivityMetadata(), rows: [] } };
      }
      return { status: 400, body: errorBody(INVALID_ACTIVITY_RANGE_BODY) };
    }

    let rows: ActivityGroupRow[];
    try {
      rows = selectGroupedRows(db, resolution.range);
    } catch {
      return failed();
    }

    const metadata: ActivityMetadata = {
      timeZone: ACTIVITY_TIME_ZONE,
      asOfDate,
      lastUpdated,
      from: resolution.range.from,
      to: resolution.range.to,
      taskTypes: distinctSorted(rows.map((row) => row.task_type)),
      models: distinctSorted(rows.map((row) => row.model)),
      tools: distinctSorted(rows.map((row) => row.tool)),
    };
    if (rows.length === 0) {
      warnEmpty();
    }
    return { status: 200, body: { metadata, rows } };
  } catch {
    return failed();
  } finally {
    try {
      db.close();
    } catch {
      // the connection is already gone; nothing to report and nothing to leak
    }
  }
}
