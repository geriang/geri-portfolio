import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Copy-before-read per ADR-6: a live tool database is never opened by SQLite.
 * We copy the database file — and its `-wal` sidecar when present — into an
 * OS temp dir and hand back the copy for a read-only open. The `-shm` sidecar
 * is deliberately never copied: a shared-memory file from a live process is
 * invalid out of context, and SQLite recovers the WAL without it.
 */
export interface SourceCopy {
  /** What we were given (never opened by SQLite — only fs reads). */
  readonly originalPath: string;
  /** Inside `dir`; open this read-only. */
  readonly copyPath: string;
  /** The temp directory holding the copy; remove it with cleanup(). */
  readonly dir: string;
  /** Remove the temp dir and everything in it (idempotent). */
  cleanup(): void;
}

export interface CopySourceDatabaseOptions {
  /** Where to create the temp dir (default os.tmpdir()); test seam. */
  tempRootHint?: string;
}

/**
 * Copy `srcPath` (+ `-wal` if present, never `-shm`) into a fresh temp dir.
 * Throws when `srcPath` does not exist. The source file is only ever touched
 * through fs copy reads, so a concurrent tool process keeps full access and
 * we can never write to it (AC-6, ADR-6).
 */
export function copySourceDatabase(
  srcPath: string,
  opts: CopySourceDatabaseOptions = {},
): SourceCopy {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`source database not found: ${srcPath}`);
  }
  const dir = fs.mkdtempSync(path.join(opts.tempRootHint ?? os.tmpdir(), 'usage-src-'));
  const copyPath = path.join(dir, path.basename(srcPath));
  fs.copyFileSync(srcPath, copyPath);

  const walPath = `${srcPath}-wal`;
  if (fs.existsSync(walPath)) {
    fs.copyFileSync(walPath, `${copyPath}-wal`);
  }
  // The -shm sidecar is intentionally never copied (stale shm is invalid;
  // SQLite rebuilds what it needs from the WAL).

  return {
    originalPath: srcPath,
    copyPath,
    dir,
    cleanup(): void {
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
