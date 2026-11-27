import fs from 'fs';
import { ToolAdapter, clearToolAdapters, registerToolAdapter } from './adapter';
import { OPENCODE_TOOL, OpenCodeAdapter } from './adapters/opencodeAdapter';
import {
  DEFAULT_WINDOW_DAYS,
  ImportWindow,
  computeWindow,
  runImport,
  sanitizeRunError,
} from './runImport';

/**
 * Import CLI (Composition Root): the ONLY file that wires adapter factories
 * to CLI flags. Parses argv, registers factory-built adapter instances,
 * calls runImport and prints EXACTLY one stdout summary line of counts and
 * dates (AC-6). The sanitized error line goes to stderr, never stdout.
 *
 * Exit codes: 0 success | 1 run failed / bad flag value | 2 unknown tool /
 * missing required flag / unreadable source.
 */

export interface CliIo {
  out?: (line: string) => void;
  err?: (line: string) => void;
}

export interface AdapterFactoryOptions {
  sourceDbPath: string;
}

export type AdapterFactory = (options: AdapterFactoryOptions) => ToolAdapter;

/**
 * Composition Root: one factory entry per tool (US-17/US-18 add one line
 * each). `--db` interpretation lives here, never in runImport.
 */
export const ADAPTER_FACTORIES: Record<string, AdapterFactory> = {
  [OPENCODE_TOOL]: (options) => new OpenCodeAdapter(options),
};

const USAGE =
  'usage: import:usage --tool <name> --db <path> [--tool <name> --db <path> ...] ' +
  '[--window-days <n>] [--now <iso>] [--fail-after <n>]' +
  ` | known tools: ${Object.keys(ADAPTER_FACTORIES).join(', ')}` +
  ' | ACTIVITY_DB_PATH locates activity.db';

interface FlagState {
  tools: string[];
  dbs: Array<string | undefined>;
  windowDays: number;
  nowIso?: string;
  failAfter?: number;
}

/** argv parse result: flags, or an exit code once usage/error was printed. */
type Parsed = { ok: true; flags: FlagState } | { ok: false; exitCode: number };

function parseFlags(argv: readonly string[], err: (line: string) => void): Parsed {
  const flags: FlagState = { tools: [], dbs: [], windowDays: DEFAULT_WINDOW_DAYS };
  const missingValue = (flag: string): Parsed => {
    err(`import:error ${flag} requires a value`);
    err(USAGE);
    return { ok: false, exitCode: 2 };
  };
  const badValue = (flag: string, value: string | undefined): Parsed => {
    err(`import:error ${flag} expects ${JSON.stringify(value)}`);
    return { ok: false, exitCode: 1 };
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    const valueMissing = value === undefined || value.startsWith('--');
    switch (flag) {
      case '--tool': {
        if (valueMissing) return missingValue(flag);
        flags.tools.push(value);
        flags.dbs.push(undefined);
        index += 1;
        break;
      }
      case '--db': {
        if (valueMissing) return missingValue(flag);
        if (flags.tools.length === 0) {
          err('import:error --db must follow a --tool');
          err(USAGE);
          return { ok: false, exitCode: 2 };
        }
        flags.dbs[flags.dbs.length - 1] = value;
        index += 1;
        break;
      }
      case '--window-days': {
        const parsed = value === undefined ? Number.NaN : Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) return badValue(flag, value);
        flags.windowDays = parsed;
        index += 1;
        break;
      }
      case '--now': {
        if (valueMissing) return missingValue(flag);
        if (Number.isNaN(Date.parse(value))) return badValue(flag, value);
        flags.nowIso = value;
        index += 1;
        break;
      }
      case '--fail-after': {
        // Test seam (documented as such in the design): injects a run failure.
        const parsed = value === undefined ? Number.NaN : Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) return badValue(flag, value);
        flags.failAfter = parsed;
        index += 1;
        break;
      }
      default: {
        err(`import:error unknown flag ${flag}`);
        err(USAGE);
        return { ok: false, exitCode: 2 };
      }
    }
  }

  if (flags.tools.length === 0) {
    err('import:error at least one --tool is required');
    err(USAGE);
    return { ok: false, exitCode: 2 };
  }
  return { ok: true, flags };
}

/** The single stdout summary line: counts and dates only (AC-6). */
function summaryLine(summary: {
  status: 'success' | 'failed';
  tools: string[];
  sinceUtc: string;
  untilUtc: string;
  eventsSeen: number;
  eventsWritten: number;
  days: string[];
  modelFallbacks?: number;
}): string {
  const line =
    `import:${summary.status} tools=${summary.tools.join(',')} ` +
    `window=${summary.sinceUtc}/${summary.untilUtc} ` +
    `events_seen=${summary.eventsSeen} events_written=${summary.eventsWritten} ` +
    `days=${summary.days.join(',')}`;
  // US-23: optional numeric suffix, only when a SUCCESSFUL run had fallback
  // rows; with none the line stays byte-identical to the pre-US-23 contract.
  return summary.status === 'success' && (summary.modelFallbacks ?? 0) > 0
    ? `${line} model_fallbacks=${summary.modelFallbacks}`
    : line;
}

/**
 * Run one import. Side-effect-free except the io out/err calls and the
 * import run itself; returns the process exit code. `main()` is re-entrant:
 * the adapter registry is cleared and refilled on every call.
 */
export function main(argv: readonly string[], io: CliIo = {}): number {
  const out = io.out ?? ((line: string) => process.stdout.write(`${line}\n`));
  const err = io.err ?? ((line: string) => process.stderr.write(`${line}\n`));

  const parsed = parseFlags(argv, err);
  if (!parsed.ok) return parsed.exitCode;
  const { tools, dbs, windowDays, nowIso, failAfter } = parsed.flags;

  for (const tool of tools) {
    if (!(tool in ADAPTER_FACTORIES)) {
      err(`import:error unknown tool "${tool}"`);
      err(USAGE);
      return 2;
    }
  }
  for (const [index, tool] of tools.entries()) {
    const dbPath = dbs[index];
    if (dbPath === undefined) {
      err(`import:error --db <path> is required for --tool ${tool}`);
      err(USAGE);
      return 2;
    }
    if (!fs.existsSync(dbPath)) {
      err(`import:error --db path not found for --tool ${tool}: ${dbPath}`);
      err(USAGE);
      return 2;
    }
  }

  let window: ImportWindow;
  try {
    window = computeWindow(nowIso === undefined ? new Date() : new Date(nowIso), windowDays);
  } catch (flagErr) {
    err(`import:error ${(flagErr as Error).message}`);
    return 1;
  }

  // Composition Root wiring: clear then register the factory-built adapters
  // (the registry documents what a run covers; runImport itself takes instances).
  clearToolAdapters();
  const adapters = tools.map((tool, index) =>
    ADAPTER_FACTORIES[tool]({ sourceDbPath: dbs[index] as string }),
  );
  for (const adapter of adapters) registerToolAdapter(adapter);

  let summary;
  try {
    summary = runImport({ adapters, window, failAfter });
  } catch (runErr) {
    // Config-level failure before any run row (e.g. ACTIVITY_DB_PATH unset).
    err(`import:failed ${sanitizeRunError(runErr)}`);
    return 1;
  }

  out(summaryLine(summary));
  if (summary.status === 'failed') {
    // The sanitized error line goes to stderr, never stdout (AC-6).
    err(`import:failed run_id=${summary.runId} ${summary.error ?? 'see import_run.error'}`);
    return 1;
  }
  return 0;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
