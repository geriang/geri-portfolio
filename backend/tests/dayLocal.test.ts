import os from 'os';
import fs from 'fs';
import path from 'path';
import { DEFAULT_TIMEZONE, DayConversionError, toDayLocal } from '../src/import/dayLocal';

describe('toDayLocal — Asia/Singapore boundary table (AC-5)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'us2-'));
  const originalTz = process.env.ACTIVITY_TIMEZONE;

  beforeAll(() => {
    delete process.env.ACTIVITY_TIMEZONE; // exercise the SG default explicitly
  });
  afterAll(() => {
    if (originalTz !== undefined) process.env.ACTIVITY_TIMEZONE = originalTz;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test.each([
    // SG 23:59:59 — same UTC date
    ['2026-11-26T15:59:59Z', '2026-11-26'],
    // SG 00:00:00 — local date rolls forward
    ['2026-11-26T16:00:00Z', '2026-11-27'],
    // UTC date differs from (is behind) the local date
    ['2026-11-26T23:30:00Z', '2026-11-27'],
    // UTC date is ahead of the local date
    ['2026-11-27T01:00:00Z', '2026-11-27'],
    // month rollover (SG midnight into the next year)
    ['2026-12-31T16:00:00Z', '2027-01-01'],
    // year rollover
    ['2027-12-31T16:30:00Z', '2028-01-01'],
  ])('%s → %s', (input, expected) => {
    expect(toDayLocal(input)).toBe(expected);
  });

  test('offset-style instant without Z is accepted (explicit UTC designator)', () => {
    // 20:00+08:00 == 12:00Z == 20:00 SG → local date 2026-11-26
    expect(toDayLocal('2026-11-26T20:00:00+08:00')).toBe('2026-11-26');
  });

  test.each([
    ['garbage string', () => toDayLocal('not a timestamp')],
    ['no UTC designator', () => toDayLocal('2026-11-26 23:59:59')],
    ['bare local datetime', () => toDayLocal('2026-11-26T23:59:59')],
    // A trailing "-26" must not pass as a UTC offset: date-only has no time
    // component, so it is not an instant and must throw.
    ['date-only ISO string', () => toDayLocal('2026-11-26')],
    ['date-only month precision', () => toDayLocal('2026-11')],
    ['offset without minutes (+08)', () => toDayLocal('2026-11-26T20:00:00+08')],
    ['offset without colon (+0800)', () => toDayLocal('2026-11-26T20:00:00+0800')],
    ['lowercase designator (z)', () => toDayLocal('2026-11-26T20:00:00z')],
    ['empty string', () => toDayLocal('')],
    ['unsupported zone name', () => toDayLocal('2026-11-26T15:59:59Z', 'Mars/Phobos')],
  ])('throws DayConversionError on %s', (_name, fn) => {
    expect(fn).toThrow(DayConversionError);
  });

  test('error message echoes the offending input (timestamp, not source content)', () => {
    expect(() => toDayLocal('2026-11-26 23:59:59')).toThrow(/2026-11-26 23:59:59/);
  });

  test('ACTIVITY_TIMEZONE env overrides the default zone', () => {
    process.env.ACTIVITY_TIMEZONE = 'UTC';
    try {
      expect(toDayLocal('2026-11-26T23:30:00Z')).toBe('2026-11-26');
    } finally {
      if (originalTz !== undefined) process.env.ACTIVITY_TIMEZONE = originalTz;
      else delete process.env.ACTIVITY_TIMEZONE;
    }
  });

  test('DEFAULT_TIMEZONE is Asia/Singapore', () => {
    expect(DEFAULT_TIMEZONE).toBe('Asia/Singapore');
  });
});
