/**
 * US-4 fixed public error shapes and operational log lines (AC-4, AC-7,
 * NFR-5, BR-1). Every value below is a frozen constant: no client value,
 * driver message or file path can ever be interpolated into a response or
 * a log line, which is the structural guarantee the contract tests assert.
 */

export interface ActivityErrorBody {
  readonly error: { readonly code: string; readonly message: string };
}

/** AC-4: the one byte-identical body for every invalid range. */
export const INVALID_ACTIVITY_RANGE_BODY: ActivityErrorBody = Object.freeze({
  error: Object.freeze({
    code: 'INVALID_ACTIVITY_RANGE',
    message: 'from and to must be YYYY-MM-DD calendar dates and from must not be later than to',
  }),
});

/** Unexpected read failure: the frozen 500 body (data-empty cases stay 200). */
export const ACTIVITY_UNAVAILABLE_BODY: ActivityErrorBody = Object.freeze({
  error: Object.freeze({
    code: 'ACTIVITY_UNAVAILABLE',
    message: 'the activity data is temporarily unavailable',
  }),
});

/** Constant line logged once when an empty dataset is served (AC-3). */
export const ACTIVITY_EMPTY_LOG_LINE = 'activity: read model unavailable, serving empty dataset';

/** Constant line logged once when a read failed unexpectedly (500 path). */
export const ACTIVITY_FAILURE_LOG_LINE = 'activity: read model failed';

/** Returns the same frozen constant it was given — never a copy. */
export function errorBody(body: ActivityErrorBody): ActivityErrorBody {
  return body;
}
