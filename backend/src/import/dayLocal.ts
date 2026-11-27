/**
 * Instant → `Asia/Singapore` calendar day via the built-in Intl API.
 * No new dependency: Node's full-icu build ships the tz database, and
 * `Asia/Singapore` is fixed UTC+8 with no DST, so Intl conversion is
 * exactly equivalent to a fixed-offset conversion.
 */

export const DEFAULT_TIMEZONE = 'Asia/Singapore';

/**
 * Thrown on unparseable input, strings without an explicit UTC designator
 * ("Z" or +/-HH:MM), or unsupported IANA zone names. The offending input is
 * echoed: it is a timestamp, not source content (NFR-5 safe).
 */
export class DayConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DayConversionError';
  }
}

/** ISO-8601 instant with an explicit UTC designator: trailing Z or +/-HH:MM (+/-HH, +/-HHMM accepted). */
const UTC_DESIGNATOR = /(?:Z|[+-]\d{2}(?::?[0-5]\d)?)$/;

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (err) {
    throw new DayConversionError(
      `Unsupported time zone "${timeZone}": ${(err as Error).message}`,
    );
  }
}

/**
 * Convert an ISO-8601 UTC instant to the calendar day (`YYYY-MM-DD`) in
 * `timeZone` (default: env `ACTIVITY_TIMEZONE` ?? `DEFAULT_TIMEZONE`).
 */
export function toDayLocal(occurredAtUtc: string, timeZone?: string): string {
  if (typeof occurredAtUtc !== 'string' || occurredAtUtc.trim() === '') {
    throw new DayConversionError(
      `Invalid timestamp ${JSON.stringify(occurredAtUtc)}: expected a non-empty string`,
    );
  }
  if (!UTC_DESIGNATOR.test(occurredAtUtc)) {
    throw new DayConversionError(
      `Invalid timestamp "${occurredAtUtc}": an explicit UTC designator ("Z" or "+/-HH:MM") is required`,
    );
  }
  const instant = new Date(occurredAtUtc);
  if (Number.isNaN(instant.getTime())) {
    throw new DayConversionError(`Invalid timestamp "${occurredAtUtc}": unparseable date`);
  }
  const zone = timeZone ?? process.env.ACTIVITY_TIMEZONE ?? DEFAULT_TIMEZONE;
  return formatterFor(zone).format(instant);
}
