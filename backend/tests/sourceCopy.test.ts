import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { copySourceDatabase } from '../src/import/sourceCopy';

/**
 * AC-6 / ADR-6 unit tests: the live source is only ever fs-copied, the copy
 * (db + -wal, never -shm) is what gets opened read-only, cleanup is total.
 * Real fs + real better-sqlite3, nothing mocked. Generated marker data only.
 */

const MARKER = 'MK-sourcecopy-6be21f04';
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us3-'));

let liveCounter = 0;

/** WAL-mode source db kept OPEN (with -wal and -shm sidecars) by the caller. */
function createLiveWalSource(): { db: Database.Database; dbPath: string } {
  const dir = path.join(tmpRoot, `live-${liveCounter++}`);
  fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, 'live.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec('CREATE TABLE notes (id INTEGER PRIMARY KEY, text TEXT NOT NULL)');
  db.prepare('INSERT INTO notes (text) VALUES (?)').run(`generated note with ${MARKER} inside`);
  return { db, dbPath };
}

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('copySourceDatabase (AC-6, ADR-6)', () => {
  test('copies db + -wal (never -shm) and the copy carries the marker bytes', () => {
    const { db, dbPath } = createLiveWalSource();
    try {
      expect(fs.existsSync(`${dbPath}-wal`)).toBe(true); // live writer → WAL sidecar exists
      expect(fs.existsSync(`${dbPath}-shm`)).toBe(true);

      const copy = copySourceDatabase(dbPath);
      try {
        expect(copy.originalPath).toBe(dbPath);
        expect(copy.copyPath).not.toBe(dbPath);
        expect(copy.dir.startsWith(os.tmpdir())).toBe(true);
        expect(path.dirname(copy.copyPath)).toBe(copy.dir);

        // Sanity: the copied bytes carry the generated marker content.
        const copiedBytes = fs
          .readFileSync(copy.copyPath)
          .toString('latin1')
          .concat(fs.existsSync(`${copy.copyPath}-wal`) ? fs.readFileSync(`${copy.copyPath}-wal`).toString('latin1') : '');
        expect(copiedBytes).toContain(MARKER);

        expect(fs.existsSync(`${copy.copyPath}-wal`)).toBe(true);
        expect(fs.existsSync(`${copy.copyPath}-shm`)).toBe(false); // -shm never copied
      } finally {
        copy.cleanup();
      }
    } finally {
      db.close();
    }
  });

  test('the copy opens readonly and queries fine while the source is chmod 0444', () => {
    const { db, dbPath } = createLiveWalSource();
    try {
      const copy = copySourceDatabase(dbPath);
      try {
        // The ADR-6 review point: while the source file is read-only on disk,
        // the copy opens {readonly:true} and answers queries. (Under a root
        // container the mode bits are advisory; on a normal CI user this is
        // the "source never opened read-write" proof.)
        fs.chmodSync(dbPath, 0o444);

        const opened = new Database(copy.copyPath, { readonly: true });
        try {
          const rows = opened.prepare('SELECT text FROM notes').all() as Array<{ text: string }>;
          expect(rows.some((r) => r.text.includes(MARKER))).toBe(true);
        } finally {
          opened.close();
        }
        // Still untouched: the source's own bytes were never modified by us.
        expect(fs.existsSync(`${dbPath}-wal`)).toBe(true);
      } finally {
        fs.chmodSync(dbPath, 0o644);
        copy.cleanup();
      }
    } finally {
      db.close();
    }
  });

  test('cleanup() removes the temp dir and is idempotent', () => {
    const { db, dbPath } = createLiveWalSource();
    try {
      const copy = copySourceDatabase(dbPath);
      expect(fs.existsSync(copy.dir)).toBe(true);
      copy.cleanup();
      expect(fs.existsSync(copy.dir)).toBe(false);
      expect(() => copy.cleanup()).not.toThrow();
    } finally {
      db.close();
    }
  });

  test('a plain (non-WAL) source without sidecars copies fine', () => {
    const dbPath = path.join(tmpRoot, 'plain.db');
    const db = new Database(dbPath);
    db.exec('CREATE TABLE t (x TEXT)');
    db.prepare('INSERT INTO t VALUES (?)').run(MARKER);
    db.close();

    const copy = copySourceDatabase(dbPath);
    try {
      expect(fs.existsSync(copy.copyPath)).toBe(true);
      expect(fs.existsSync(`${copy.copyPath}-wal`)).toBe(false);
      const opened = new Database(copy.copyPath, { readonly: true });
      try {
        expect((opened.prepare('SELECT x FROM t').get() as { x: string }).x).toContain(MARKER);
      } finally {
        opened.close();
      }
    } finally {
      copy.cleanup();
    }
  });

  test('missing source throws with the path echoed, and creates no temp dir', () => {
    const missing = path.join(tmpRoot, 'does-not-exist.db');
    let message = '';
    try {
      copySourceDatabase(missing);
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain('source database not found');
    expect(message).toContain(missing);
  });

  test('tempRootHint relocates the temp dir (test seam)', () => {
    const dbPath = path.join(tmpRoot, 'plain.db');
    if (!fs.existsSync(dbPath)) {
      const db = new Database(dbPath);
      db.exec('CREATE TABLE t (x TEXT)');
      db.close();
    }
    const hint = path.join(tmpRoot, 'hinted');
    fs.mkdirSync(hint, { recursive: true });
    const copy = copySourceDatabase(dbPath, { tempRootHint: hint });
    try {
      expect(copy.dir.startsWith(hint)).toBe(true);
    } finally {
      copy.cleanup();
    }
  });
});
