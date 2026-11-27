import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { main } from '../src/import/cli';
import { writeOpencodeFixture, type OpencodeFixtureInfo } from './fixtures/opencodeDb';

/**
 * CLI tests (AC-1 literal command, AC-6): in-process main(argv, io) asserts
 * the exact one-line stdout and exit codes; a spawned `npm run --silent
 * import:usage` (AC-1's literal command) verifies the real process exit code
 * and the summary line shape. --silent keeps npm's banner off stdout.
 * Generated fixture data only; marker baits every text field.
 */

const MARKER = 'MK-cli-5c07e9b2';
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us3-'));
const backendRoot = path.join(__dirname, '..');
let fixture: OpencodeFixtureInfo;

/** Fixed run instant so window/dates are deterministic everywhere. */
const NOW_ISO = '2026-11-27T16:00:00Z';
const WINDOW_TEXT = '2026-11-20T16:00:00.000Z/2026-11-27T16:00:00.000Z';
const SUCCESS_LINE = `import:success tools=opencode window=${WINDOW_TEXT} events_seen=9 events_written=9 days=2026-11-24,2026-11-26,2026-11-27`;

const envBackup: Record<string, string | undefined> = {
  ACTIVITY_DB_PATH: process.env.ACTIVITY_DB_PATH,
};

interface IoCapture {
  outLines: string[];
  errLines: string[];
  io: { out: (line: string) => void; err: (line: string) => void };
}

function capture(): IoCapture {
  const outLines: string[] = [];
  const errLines: string[] = [];
  return {
    outLines,
    errLines,
    io: { out: (line) => outLines.push(line), err: (line) => errLines.push(line) },
  };
}

let dbCounter = 0;
function freshActivityPath(): string {
  return path.join(tmpRoot, `cli-activity-${dbCounter++}.db`);
}

function withActivityDb(dbPath: string, body: () => void): void {
  process.env.ACTIVITY_DB_PATH = dbPath;
  try {
    body();
  } finally {
    if (envBackup.ACTIVITY_DB_PATH === undefined) delete process.env.ACTIVITY_DB_PATH;
    else process.env.ACTIVITY_DB_PATH = envBackup.ACTIVITY_DB_PATH;
  }
}

beforeAll(() => {
  fixture = writeOpencodeFixture({ dir: path.join(tmpRoot, 'fixture'), marker: MARKER });
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('main(argv, io) in-process (AC-6 one-line stdout)', () => {
  test('success prints exactly ONE stdout line of counts and dates, returns 0', () => {
    withActivityDb(freshActivityPath(), () => {
      const cap = capture();
      const code = main(
        ['--tool', 'opencode', '--db', fixture.dbPath, '--now', NOW_ISO],
        cap.io,
      );
      expect(code).toBe(0);
      expect(cap.outLines).toEqual([SUCCESS_LINE]); // out called exactly once
      expect(cap.errLines).toEqual([]);
      expect(cap.outLines[0]).not.toContain(MARKER);
    });
  });

  test('--fail-after prints one import:failed stdout line, error to stderr only, returns 1', () => {
    withActivityDb(freshActivityPath(), () => {
      const cap = capture();
      const code = main(
        ['--tool', 'opencode', '--db', fixture.dbPath, '--now', NOW_ISO, '--fail-after', '3'],
        cap.io,
      );
      expect(code).toBe(1);
      expect(cap.outLines).toHaveLength(1); // exactly one line, even on failure
      expect(cap.outLines[0]).toMatch(/^import:failed tools=opencode /);
      expect(cap.outLines[0]).toContain(`window=${WINDOW_TEXT} events_seen=3 events_written=0 days=`);
      // the sanitized error line lands on stderr, not stdout (AC-6); no source content
      expect(cap.errLines.length).toBeGreaterThan(0);
      expect(cap.errLines.join('\n')).toContain('ImportFailureInjectedError');
      expect(cap.outLines[0]).not.toContain(MARKER);
      expect(cap.errLines.join('\n')).not.toContain(MARKER);
    });
  });

  test('--window-days widens the window; bad values exit 1', () => {
    withActivityDb(freshActivityPath(), () => {
      const cap = capture();
      const code = main(
        ['--tool', 'opencode', '--db', fixture.dbPath, '--now', NOW_ISO, '--window-days', '30'],
        cap.io,
      );
      expect(code).toBe(0);
      // 30-day window also swallows the ses_old rows (and nothing else changes).
      expect(cap.outLines[0]).toMatch(/^import:success .* events_seen=11 events_written=11 /);
    });
    for (const bad of ['abc', '0', '-2']) {
      const cap = capture();
      expect(main(['--tool', 'opencode', '--db', fixture.dbPath, '--window-days', bad], cap.io)).toBe(1);
    }
    const badNow = capture();
    expect(main(['--tool', 'opencode', '--db', fixture.dbPath, '--now', 'not-a-date'], badNow.io)).toBe(1);
    const badFailAfter = capture();
    expect(
      main(['--tool', 'opencode', '--db', fixture.dbPath, '--fail-after', 'many'], badFailAfter.io),
    ).toBe(1);
  });

  test('--tool nosuch exits 2 with usage on stderr and writes nothing to activity.db', () => {
    const dbPath = freshActivityPath();
    withActivityDb(dbPath, () => {
      const cap = capture();
      expect(main(['--tool', 'nosuch', '--db', fixture.dbPath], cap.io)).toBe(2);
      expect(cap.outLines).toEqual([]);
      expect(cap.errLines.some((line) => line.includes('usage: import:usage'))).toBe(true);
      expect(cap.errLines.some((line) => line.includes('unknown tool'))).toBe(true);
    });
    expect(fs.existsSync(dbPath)).toBe(false); // no activity.db writes
  });

  test('missing --tool, missing --db and unknown flags exit 2 with usage', () => {
    withActivityDb(freshActivityPath(), () => {
      for (const argv of [
        ['--db', fixture.dbPath], // no --tool
        ['--tool', 'opencode'], // no --db
        ['--tool', 'opencode', '--db', path.join(tmpRoot, 'vanished.db')], // --db file missing
        ['--frobnicate'], // unknown flag
      ]) {
        const cap = capture();
        expect(main(argv, cap.io)).toBe(2);
        expect(cap.outLines).toEqual([]);
        expect(cap.errLines.some((line) => line.includes('usage: import:usage'))).toBe(true);
      }
    });
  });

  test('unset ACTIVITY_DB_PATH exits 1 (config error before any run row)', () => {
    const cap = capture();
    const saved = process.env.ACTIVITY_DB_PATH;
    delete process.env.ACTIVITY_DB_PATH;
    try {
      expect(main(['--tool', 'opencode', '--db', fixture.dbPath, '--now', NOW_ISO], cap.io)).toBe(1);
      expect(cap.outLines).toEqual([]); // nothing on stdout
      expect(cap.errLines.join('')).toContain('ACTIVITY_DB_PATH');
    } finally {
      if (saved === undefined) delete process.env.ACTIVITY_DB_PATH;
      else process.env.ACTIVITY_DB_PATH = saved;
    }
  });

  test('main is re-entrant: registry is cleared and refilled each call', () => {
    withActivityDb(freshActivityPath(), () => {
      const cap = capture();
      expect(main(['--tool', 'opencode', '--db', fixture.dbPath, '--now', NOW_ISO], cap.io)).toBe(0);
      expect(main(['--tool', 'opencode', '--db', fixture.dbPath, '--now', NOW_ISO], cap.io)).toBe(0);
      expect(cap.outLines).toHaveLength(2);
    });
  });
});

describe('spawned npm run --silent import:usage (AC-1 literal command, AC-6)', () => {
  const npmRun = (extraArgs: string[], env: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = { ...process.env, ...env };
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined) delete merged[key];
    }
    return spawnSync(
      'npm',
      ['run', '--silent', 'import:usage', '--', '--tool', 'opencode', '--db', fixture.dbPath, ...extraArgs],
      { cwd: backendRoot, encoding: 'utf8', env: merged, timeout: 90_000 },
    );
  };

  test(
    'exits 0, prints exactly one summary line matching the contract, no marker',
    () => {
      const dbPath = freshActivityPath();
      const result = npmRun(['--now', NOW_ISO], { ACTIVITY_DB_PATH: dbPath });
      expect(result.status).toBe(0);
      expect(result.stdout.trim()).toMatch(
        /^import:success tools=opencode window=\d{4}-\d{2}-\d{2}T[\d:.]+Z\/\d{4}-\d{2}-\d{2}T[\d:.]+Z events_seen=\d+ events_written=\d+ days=[\d,.-]*$/,
      );
      expect(result.stdout.trim()).toBe(SUCCESS_LINE);
      expect(result.stdout.trim()).not.toContain(MARKER);
      expect(result.stdout.split('\n').filter((line) => line.trim() !== '')).toHaveLength(1);
    },
    120_000,
  );

  test('--fail-after 3 run exits non-zero', () => {
    const dbPath = freshActivityPath();
    const result = npmRun(['--now', NOW_ISO, '--fail-after', '3'], { ACTIVITY_DB_PATH: dbPath });
    expect(result.status).not.toBe(0);
    expect(result.stdout.trim()).toMatch(/^import:failed tools=opencode /);
    expect(result.stdout.split('\n').filter((line) => line.trim() !== '')).toHaveLength(1);
    expect(result.stderr).toContain('ImportFailureInjectedError');
    expect(result.stderr).not.toContain(MARKER);
  }, 120_000);

  test('--tool nosuch exits 2 with usage on stderr and no activity.db writes', () => {
    const dbPath = freshActivityPath();
    const result = spawnSync(
      'npm',
      ['run', '--silent', 'import:usage', '--', '--tool', 'nosuch', '--db', fixture.dbPath],
      { cwd: backendRoot, encoding: 'utf8', env: { ...process.env, ACTIVITY_DB_PATH: dbPath }, timeout: 90_000 },
    );
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('usage: import:usage');
    expect(fs.existsSync(dbPath)).toBe(false);
  }, 120_000);

  test('unset ACTIVITY_DB_PATH exits 1', () => {
    const result = npmRun(['--now', NOW_ISO], { ACTIVITY_DB_PATH: undefined });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('ACTIVITY_DB_PATH');
  }, 120_000);
});
