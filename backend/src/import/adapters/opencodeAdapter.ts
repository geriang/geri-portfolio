import crypto from 'crypto';
import Database from 'better-sqlite3';
import { RawUsageRecord } from '../types';
import { ToolAdapter } from '../adapter';
import { copySourceDatabase } from '../sourceCopy';

/**
 * The first real ToolAdapter: reads opencode's message-level session_message
 * rows (type user/assistant) from a read-only copy of opencode.db, drops all
 * prompt/response text inside the adapter (BR-1, AC-2) and emits
 * RawUsageRecords. Adding a tool = one file like this (NFR-10).
 *
 * Column contract (fixed by docs/design/US-3-opencode-adapter-import.md
 * §"opencode source schema"); drift against a real opencode.db fails loudly
 * with an OpenCodeAdapterError naming the id/column, never source text:
 *
 *   session_v2(id, directory, agent, model, time_created TEXT|INTEGER)
 *   session_message(id NULL, session_id, type ('user'|'assistant'),
 *                   time_created TEXT|INTEGER, data TEXT(JSON))
 */

export const OPENCODE_TOOL = 'opencode';

/** Error whose message carries ids/timestamps/column names only — never source text (NFR-5). */
export class OpenCodeAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenCodeAdapterError';
  }
}

export interface OpenCodeAdapterOptions {
  /** The operator-supplied --db value (the live source file; only ever fs-copied). */
  sourceDbPath: string;
  /** Passed through to copySourceDatabase (test seam for the temp dir location). */
  tempRootHint?: string;
}

/** A joined row as returned by SOURCE_QUERY. */
export interface JoinRow {
  id: string | null;
  sessionId: string;
  type: string;
  /** TEXT ISO string or INTEGER epoch millis (mixed formats are why windowing is in JS). */
  timeCreated: unknown;
  /** JSON string; fields read: agent, model, tokens.input, tokens.output. `text` is DROPPED. */
  data: string | null;
  directory: string | null;
  sessionAgent: string | null;
  sessionModel: string | null;
}

const SOURCE_QUERY = `
SELECT m.id AS id, m.session_id AS sessionId, m.type AS type,
       m.time_created AS timeCreated, m.data AS data,
       s.directory AS directory, s.agent AS sessionAgent, s.model AS sessionModel
FROM session_message m
LEFT JOIN session_v2 s ON s.id = m.session_id
WHERE m.type IN ('user','assistant')
`;

/** An ISO-8601 instant with an explicit UTC designator (Z or +/-HH:MM) after a time. */
const UTC_DESIGNATOR = /\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Normalise a source instant to an ISO-8601 UTC string.
 *   number (epoch millis)  -> new Date(ms).toISOString()
 *   string with Z / ±HH:MM -> returned as-is
 *   anything else          -> OpenCodeAdapterError (fail fast on data drift)
 */
export function toInstantIso(value: unknown): string {
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new OpenCodeAdapterError(`time_created: expected integer epoch millis, got ${String(value)}`);
    }
    let iso: string;
    try {
      iso = new Date(value).toISOString();
    } catch {
      throw new OpenCodeAdapterError(`time_created: epoch millis out of range: ${String(value)}`);
    }
    return iso;
  }
  if (typeof value === 'string') {
    if (!UTC_DESIGNATOR.test(value) || Number.isNaN(Date.parse(value))) {
      throw new OpenCodeAdapterError(
        `time_created: expected an ISO-8601 instant with a UTC designator (Z or ±HH:MM), got "${value}"`,
      );
    }
    return value;
  }
  throw new OpenCodeAdapterError(
    `time_created: expected ISO-8601 string or integer epoch millis, got ${typeof value}`,
  );
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

/** Parse the data JSON; a non-JSON or non-object value throws (message names the id only). */
function parseData(row: JoinRow): Record<string, unknown> {
  if (row.data === null || row.data === undefined) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.data);
  } catch {
    throw new OpenCodeAdapterError(`message ${describeRow(row)}: data is not valid JSON`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new OpenCodeAdapterError(`message ${describeRow(row)}: data is not a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

/** A safe row descriptor for error text: id (or session/type stand-in) — never content. */
function describeRow(row: JoinRow): string {
  return nonEmpty(row.id) ?? `session ${row.sessionId} type ${row.type}`;
}

/** Read one token value (>= 0 integer). Missing -> 0; negative/non-numeric -> throw. */
function readToken(raw: unknown, row: JoinRow, field: string): number {
  if (raw === undefined || raw === null) {
    return 0;
  }
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0) {
    throw new OpenCodeAdapterError(
      `message ${describeRow(row)}: tokens.${field} must be an integer >= 0, got ${String(raw)}`,
    );
  }
  return raw;
}

function assistantTokens(row: JoinRow, data: Record<string, unknown>): { input: number; output: number } {
  const tokens = data.tokens;
  const obj = typeof tokens === 'object' && tokens !== null ? (tokens as Record<string, unknown>) : {};
  return {
    input: readToken(obj.input, row, 'input'),
    output: readToken(obj.output, row, 'output'),
  };
}

/**
 * Derive a source id for an id-less row: "derived:" + the first 32 hex chars of
 * sha256("opencode|sessionId|type|isoTime|inputTokens|outputTokens") (ADR-3).
 *
 * MERGE LIMIT (ADR-3, accepted trade-off): the hash omits message `text`, so
 * two genuinely distinct id-less messages that share the same session, type,
 * instant and token counts collapse into ONE derived row on
 * UNIQUE(tool, source_id). The fixture pins this with two id-less twins whose
 * differing text is discarded and which therefore merge.
 */
export function deriveSourceId(row: JoinRow): string {
  const isoTime = toInstantIso(row.timeCreated);
  const isAssistant = row.type === 'assistant';
  const data = parseData(row);
  const tokens = isAssistant ? assistantTokens(row, data) : { input: 0, output: 0 };
  const basis = [
    OPENCODE_TOOL,
    row.sessionId,
    row.type,
    isoTime,
    String(tokens.input),
    String(tokens.output),
  ].join('|');
  const hex = crypto.createHash('sha256').update(basis, 'utf8').digest('hex').slice(0, 32);
  return `derived:${hex}`;
}

/**
 * Map a joined source row to a RawUsageRecord. Prompt/response `text` is read
 * only to be discarded — it is never assigned to any field (BR-1, AC-2).
 * metadata is exactly { agent, directory } (classifier input; never stored).
 */
export function mapRow(row: JoinRow): RawUsageRecord {
  const data = parseData(row);
  const isAssistant = row.type === 'assistant';

  let occurredAtUtc: string;
  try {
    occurredAtUtc = toInstantIso(row.timeCreated);
  } catch (err) {
    throw new OpenCodeAdapterError(`message ${describeRow(row)}: ${(err as Error).message}`);
  }

  const sourceId = nonEmpty(row.id) ?? deriveSourceId(row);

  const tokens = isAssistant ? assistantTokens(row, data) : { input: 0, output: 0 };

  // data.model ?? session_v2.model — first non-empty wins (BR-5); empty
  // everywhere fails fast (a silent 'unknown' model would hide source drift).
  const model = nonEmpty(data.model) ?? nonEmpty(row.sessionModel);
  if (!model) {
    throw new OpenCodeAdapterError(
      `message ${describeRow(row)}: no model on the message or its session_v2 row`,
    );
  }

  const agent = nonEmpty(data.agent) ?? nonEmpty(row.sessionAgent) ?? '';
  const directory = nonEmpty(row.directory) ?? '';

  return {
    sourceId,
    occurredAtUtc,
    inputTokens: tokens.input,
    outputTokens: tokens.output,
    promptCount: isAssistant ? 0 : 1,
    model,
    metadata: { agent, directory },
  };
}

export class OpenCodeAdapter implements ToolAdapter {
  readonly tool = OPENCODE_TOOL;

  private readonly options: OpenCodeAdapterOptions;

  constructor(options: OpenCodeAdapterOptions) {
    this.options = options;
  }

  /**
   * Copy-before-read (ADR-6): copy the live source, open ONLY the copy
   * {readonly:true}, run the query, map rows (dropping text), then close and
   * clean up the temp dir in `finally`. The live source is never opened by
   * SQLite. Window is inclusive-since / exclusive-until, filtered in JS after
   * instant normalization (mixed TEXT/INTEGER time formats rule out a portable
   * SQL BETWEEN).
   */
  readEvents(sinceUtc: string, untilUtc: string): RawUsageRecord[] {
    const copy = copySourceDatabase(this.options.sourceDbPath, {
      tempRootHint: this.options.tempRootHint,
    });
    const since = Date.parse(sinceUtc);
    const until = Date.parse(untilUtc);
    let db: Database.Database | undefined;
    try {
      db = new Database(copy.copyPath, { readonly: true });
      const rows = db.prepare(SOURCE_QUERY).all() as unknown[];
      // Dedup by sourceId so id-less twins that hash identically collapse to
      // one record, mirroring UNIQUE(tool, source_id) downstream.
      const bySourceId = new Map<string, RawUsageRecord>();
      for (const raw of rows) {
        const row = raw as JoinRow;
        const record = mapRow(row);
        const at = Date.parse(record.occurredAtUtc);
        if (at >= since && at < until && !bySourceId.has(record.sourceId)) {
          bySourceId.set(record.sourceId, record);
        }
      }
      return [...bySourceId.values()];
    } finally {
      if (db) {
        db.close();
      }
      copy.cleanup();
    }
  }
}
