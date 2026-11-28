/**
 * US-4 pure date logic for the read-only activity API: strict YYYY-MM-DD
 * validation, calendar-month arithmetic with month-end clamping, and
 * inclusive-range resolution.
 *
 * Imports nothing and reads no clock: every value is either validated input
 * or deterministic calendar arithmetic on it, so repeated resolutions over
 * the same inputs are identical (NFR-5, stability requirement).
 */

/**
 * BR-4 literal. Matches DEFAULT_TIMEZONE in src/import/dayLocal.ts; kept as a
 * local literal so this module stays import-free (design §Interfaces).
 */
export const ACTIVITY_TIME_ZONE = 'Asia/Singapore';

/** AC-6: the default window is 12 months wide. */
export const DEFAULT_RANGE_MONTHS = 12;

/** A VALIDATED 'YYYY-MM-DD' calendar date (only isValidYmd produces these). */
export type Ymd = string;

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * true iff `value` is a string matching YYYY-MM-DD whose y/m/d round-trip
 * through Date.UTC reproduces exactly (so 2026-02-30, 2026-13-01, '2026-1-5',
 * '', ' 2026-11-05', '2026-11-05T00:00:00Z' and every non-string are false).
 */
export function isValidYmd(value: unknown): value is Ymd {
  if (typeof value !== 'string' || !YMD_PATTERN.test(value)) {
    return false;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const instant = new Date(Date.UTC(year, month - 1, day));
  return (
    instant.getUTCFullYear() === year &&
    instant.getUTCMonth() === month - 1 &&
    instant.getUTCDate() === day
  );
}

/**
 * AC-4 rule 1: a value that is absent, or a string whose trim() is empty,
 * counts as ABSENT and takes its default (the published contract is
 * `?from=&to=`). Exported so the service distinguishes "absent" from
 * "invalid" for the AC-3 flow-B empty dataset without duplicating the rule.
 */
export function isBlankActivityParam(value: unknown): boolean {
  return value === undefined || (typeof value === 'string' && value.trim() === '');
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

/**
 * Calendar arithmetic on (y, m, d): moves the month by `months` keeping the
 * day-of-month, clamped to the last day of the target month
 * (2028-02-29 -12 -> 2027-02-28, 2026-03-31 -12 -> 2025-03-31).
 * Throws RangeError when `value` is not a validated date or `months` is not
 * an integer.
 */
export function addMonths(value: Ymd, months: number): Ymd {
  if (!isValidYmd(value)) {
    throw new RangeError('addMonths requires a validated YYYY-MM-DD date');
  }
  if (!Number.isInteger(months)) {
    throw new RangeError('addMonths requires an integer month offset');
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const total = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(total / 12);
  const targetMonth = total - targetYear * 12; // 0-based, always in 0..11
  const lastDayOfMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return `${pad(targetYear, 4)}-${pad(targetMonth + 1, 2)}-${pad(Math.min(day, lastDayOfMonth), 2)}`;
}

export interface ActivityRange {
  readonly from: Ymd;
  readonly to: Ymd;
}

/** Raw (untrusted) query-parameter pair as it arrives from the router. */
export interface ActivityRangeRequest {
  readonly from?: unknown;
  readonly to?: unknown;
}

export type RangeResolution =
  | { readonly ok: true; readonly range: ActivityRange }
  | { readonly ok: false; readonly code: 'INVALID_ACTIVITY_RANGE' };

const INVALID: RangeResolution = Object.freeze({
  ok: false as const,
  code: 'INVALID_ACTIVITY_RANGE' as const,
});

/**
 * Resolves the inclusive [from, to] window (both ends included, `from` may
 * equal `to`):
 *   to   := explicit to   ?? asOfDate
 *   from := explicit from ?? addMonths(to, -DEFAULT_RANGE_MONTHS)
 * Any present-but-blank value counts as absent (rule 1); any other
 * non-YYYY-MM-DD value (arrays, numbers, malformed dates) is invalid;
 * `from > to` is invalid; a side that must fall back on a null `asOfDate`
 * makes the pair unresolvable (the service turns that into the AC-3 empty
 * dataset). This function never touches the database and never invents a
 * default of its own.
 */
export function resolveRange(
  request: ActivityRangeRequest,
  asOfDate: Ymd | null,
): RangeResolution {
  const fromGiven = isBlankActivityParam(request.from) ? undefined : request.from;
  const toGiven = isBlankActivityParam(request.to) ? undefined : request.to;

  if (fromGiven !== undefined && !isValidYmd(fromGiven)) {
    return INVALID;
  }
  if (toGiven !== undefined && !isValidYmd(toGiven)) {
    return INVALID;
  }

  let to: Ymd;
  if (toGiven !== undefined) {
    to = toGiven;
  } else if (asOfDate !== null) {
    to = asOfDate;
  } else {
    return INVALID;
  }

  let from: Ymd;
  if (fromGiven !== undefined) {
    from = fromGiven;
  } else {
    try {
      from = addMonths(to, -DEFAULT_RANGE_MONTHS);
    } catch {
      return INVALID;
    }
  }

  if (from > to) {
    return INVALID;
  }
  return { ok: true, range: { from, to } };
}
