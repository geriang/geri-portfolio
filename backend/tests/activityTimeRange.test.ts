import {
  ACTIVITY_TIME_ZONE,
  DEFAULT_RANGE_MONTHS,
  addMonths,
  isValidYmd,
  resolveRange,
} from '../src/activity/timeRange';

describe('timeRange constants', () => {
  it('pins the BR-4 time zone and the AC-6 default window', () => {
    expect(ACTIVITY_TIME_ZONE).toBe('Asia/Singapore');
    expect(DEFAULT_RANGE_MONTHS).toBe(12);
  });
});

describe('isValidYmd', () => {
  it.each([
    ['2026-11-27', true],
    ['2028-02-29', true], // leap day
    ['2026-02-30', false],
    ['2026-13-01', false],
    ['2026-1-5', false],
    ['', false],
    [' 2026-11-05', false],
    ['2026-11-05T00:00:00Z', false],
    ['20260101', false],
    [null, false],
    [undefined, false],
    [20261105, false],
    [[], false],
    [['a', 'b'], false],
    [{}, false],
  ])('classifies %p as %p', (value, expected) => {
    expect(isValidYmd(value)).toBe(expected);
  });
});

describe('addMonths', () => {
  it('steps back 12 months over a leap day with month-end clamping', () => {
    expect(addMonths('2028-02-29', -12)).toBe('2027-02-28');
    expect(addMonths('2028-02-29', -24)).toBe('2026-02-28');
  });

  it('clamps month-ends', () => {
    expect(addMonths('2026-03-31', -12)).toBe('2025-03-31');
    expect(addMonths('2026-05-31', -12)).toBe('2025-05-31');
    expect(addMonths('2026-12-31', -12)).toBe('2025-12-31');
    expect(addMonths('2026-05-31', -1)).toBe('2026-04-30');
    expect(addMonths('2026-11-30', +1)).toBe('2026-12-30');
    expect(addMonths('2026-08-31', -6)).toBe('2026-02-28');
  });

  it('round-trips +12 after -12 where the day is stable', () => {
    expect(addMonths(addMonths('2026-11-27', -12), 12)).toBe('2026-11-27');
    expect(addMonths(addMonths('2026-02-15', -12), 12)).toBe('2026-02-15');
  });

  it('crosses the year boundary both ways', () => {
    expect(addMonths('2026-01-31', -1)).toBe('2025-12-31');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
  });

  it('throws RangeError on bad input', () => {
    expect(() => addMonths('2026-02-30' as never, -12)).toThrow(RangeError);
    expect(() => addMonths('not-a-date' as never, -12)).toThrow(RangeError);
    expect(() => addMonths('2026-11-27', 1.5)).toThrow(RangeError);
    expect(() => addMonths('2026-11-27', Number.NaN)).toThrow(RangeError);
  });
});

describe('resolveRange', () => {
  const AS_OF = '2026-11-27';
  const DEFAULT_FROM = '2025-11-27';

  it('uses both explicit dates, inclusive', () => {
    expect(resolveRange({ from: '2026-11-01', to: '2026-11-05' }, AS_OF)).toEqual({
      ok: true,
      range: { from: '2026-11-01', to: '2026-11-05' },
    });
  });

  it('defaults both sides from asOfDate when neither is given', () => {
    expect(resolveRange({}, AS_OF)).toEqual({
      ok: true,
      range: { from: DEFAULT_FROM, to: AS_OF },
    });
  });

  it('treats empty strings (the published ?from=&to= contract) as absent', () => {
    expect(resolveRange({ from: '', to: '' }, AS_OF)).toEqual({
      ok: true,
      range: { from: DEFAULT_FROM, to: AS_OF },
    });
    expect(resolveRange({ from: '   ', to: '\t' }, AS_OF)).toEqual({
      ok: true,
      range: { from: DEFAULT_FROM, to: AS_OF },
    });
  });

  it('fills a missing `to` from asOfDate (from-only)', () => {
    expect(resolveRange({ from: '2026-06-01' }, AS_OF)).toEqual({
      ok: true,
      range: { from: '2026-06-01', to: AS_OF },
    });
  });

  it('fills a missing `from` with addMonths(to, -12) (to-only)', () => {
    expect(resolveRange({ to: '2026-05-15' }, AS_OF)).toEqual({
      ok: true,
      range: { from: '2025-05-15', to: '2026-05-15' },
    });
  });

  it('allows from === to', () => {
    expect(resolveRange({ from: AS_OF, to: AS_OF }, AS_OF)).toEqual({
      ok: true,
      range: { from: AS_OF, to: AS_OF },
    });
  });

  it('rejects from later than to', () => {
    expect(resolveRange({ from: '2026-11-28', to: '2026-11-01' }, AS_OF)).toEqual({
      ok: false,
      code: 'INVALID_ACTIVITY_RANGE',
    });
  });

  it.each([
    [{ from: 'not-a-date' }, AS_OF],
    [{ to: 'not-a-date' }, AS_OF],
    [{ from: '2026-1-5' }, AS_OF],
    [{ to: '2026-02-30' }, AS_OF],
    [{ to: '2026-13-01' }, AS_OF],
    [{ from: '20261105' }, AS_OF],
    [{ from: '2026-11-05T00:00:00Z' }, AS_OF],
    // express gives an array for ?from=a&from=b
    [{ from: ['a', 'b'] }, AS_OF],
    [{ to: ['2026-11-01', '2026-11-02'] }, AS_OF],
    [{ from: 20261105 }, AS_OF],
    [{ from: null }, AS_OF],
    // no asOfDate to anchor the default `to`
    [{}, null],
    [{ from: '' }, null],
    [{ to: '' }, null],
    [{ from: '2026-01-01' }, null],
  ])('rejects %p (asOfDate %p)', (request, asOfDate) => {
    expect(resolveRange(request, asOfDate)).toEqual({
      ok: false,
      code: 'INVALID_ACTIVITY_RANGE',
    });
  });

  it('resolves explicit pairs without any asOfDate (defaults need no clock)', () => {
    expect(resolveRange({ from: '2026-01-01', to: '2026-01-02' }, null)).toEqual({
      ok: true,
      range: { from: '2026-01-01', to: '2026-01-02' },
    });
    // `to` given, `from` derivable by calendar arithmetic: still resolvable.
    expect(resolveRange({ to: '2026-11-05' }, null)).toEqual({
      ok: true,
      range: { from: '2025-11-05', to: '2026-11-05' },
    });
  });
});
