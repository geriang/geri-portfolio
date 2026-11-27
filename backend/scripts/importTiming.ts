import fs from 'fs';
import os from 'os';
import path from 'path';
import { runImport, ImportWindow } from '../src/import/runImport';
import { OpenCodeAdapter } from '../src/import/adapters/opencodeAdapter';
import { copySourceDatabase } from '../src/import/sourceCopy';
import { writeOpencodeFixture } from '../tests/fixtures/opencodeDb';

/**
 * AC-7 (automated part): time the daily run against the largest available
 * generated fixture (default 20k messages — the real opencode.db proxy) and
 * measure temporary disk use. Prints ONE line of counts and dates only;
 * exits non-zero if the run takes >= 60 s or temp usage reaches 2 GB.
 * The owner's run against the real opencode.db stays Manual (PR body).
 *
 * Not a Jest test: `npm run import:timing [messageCount]`.
 */

const MESSAGE_COUNT = Number(process.argv[2] ?? 20_000);
if (!Number.isInteger(MESSAGE_COUNT) || MESSAGE_COUNT <= 0) {
  process.stderr.write(`import:timing bad messageCount "${process.argv[2]}"\n`);
  process.exit(1);
}

const LIMIT_MS = 60_000; // NFR-14: a daily run within 1 minute
const LIMIT_BYTES = 2 * 1024 * 1024 * 1024; // temporary disk use under 2 GB

function dirBytes(target: string): number {
  let total = 0;
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const entryPath = path.join(target, entry.name);
    total += entry.isDirectory() ? dirBytes(entryPath) : fs.statSync(entryPath).size;
  }
  return total;
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us3-timing-'));
try {
  const fixtureDir = path.join(tmpRoot, 'fixture');
  const fixture = writeOpencodeFixture({ dir: fixtureDir, messageCount: MESSAGE_COUNT });

  // Window covering every generated row (handcrafted oldest is 2026-11-01).
  const window: ImportWindow = {
    sinceUtc: '2026-10-01T00:00:00Z',
    untilUtc: '2026-11-28T00:00:00Z',
  };

  // ADR-6: the copy-before-read temp usage (fixture dir + source copy dir).
  const copy = copySourceDatabase(fixture.dbPath, { tempRootHint: tmpRoot });
  const copyBytes = dirBytes(copy.dir);
  copy.cleanup();

  const activityDbPath = path.join(tmpRoot, 'activity.db');
  const started = Date.now();
  const summary = runImport({
    adapters: [new OpenCodeAdapter({ sourceDbPath: fixture.dbPath })],
    activityDbPath,
    window,
  });
  const elapsedMs = Date.now() - started;

  // Total temporary bytes: everything this script created in its temp root
  // (fixture dir + the source copy dir it would produce + activity db).
  const tempBytes = dirBytes(tmpRoot);
  const ok = summary.status === 'success' && elapsedMs < LIMIT_MS && tempBytes < LIMIT_BYTES;

  process.stdout.write(
    `import:timing tool=opencode window=${window.sinceUtc}/${window.untilUtc} ` +
      `messages=${fixture.userMessages + fixture.assistantMessages} ` +
      `events_seen=${summary.eventsSeen} events_written=${summary.eventsWritten} ` +
      `elapsed_ms=${elapsedMs} temp_bytes=${tempBytes} status=${ok ? 'ok' : 'fail'}\n`,
  );
  if (!ok) {
    process.stderr.write(
      `import:timing failed: status=${summary.status} elapsed_ms=${elapsedMs} (limit ${LIMIT_MS}) ` +
        `temp_bytes=${tempBytes} (limit ${LIMIT_BYTES}) error=${summary.error ?? 'none'}\n`,
    );
  }
  process.exit(ok ? 0 : 1);
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}
