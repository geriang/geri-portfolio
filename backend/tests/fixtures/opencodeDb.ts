import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

/**
 * Generated opencode.db fixture builder (NFR-5: invented constants only —
 * no real prompts, paths or personal data). Implements the per-column
 * contract fixed by docs/design/US-3-opencode-adapter-import.md
 * §"opencode source schema":
 *
 *   session_v2(id TEXT, directory TEXT, agent TEXT, model TEXT, time_created TEXT|INTEGER)
 *   session_message(id TEXT NULL, session_id TEXT, type TEXT ('user'|'assistant'),
 *                   time_created TEXT|INTEGER, data TEXT (JSON))
 *
 * data JSON fields read by the adapter: agent, model, tokens.input, tokens.output.
 * data.text (and every other text field) carries the caller's marker string so
 * the AC-2 tests can prove the adapter drops prompt content.
 */

export interface OpencodeFixtureOptions {
  /** Writes <dir>/opencode.db. */
  dir: string;
  /** Bulk mode for perf sanity; default undefined = small handcrafted set only. */
  messageCount?: number;
  /** Unique marker embedded in every text field (AC-2 bait). */
  marker?: string;
  /**
   * US-23: also write the model-shape variant session + messages (descriptor
   * strings, nested object, no-provider, bad-parse and no-id descriptors,
   * session-column descriptor). Default false = writes exactly what the
   * builder wrote before US-23, so every pre-US-23 count stays valid.
   */
  modelVariants?: boolean;
}

export interface OpencodeFixtureInfo {
  dbPath: string;
  /** Total user session_message rows written (handcrafted + bulk + variants). */
  userMessages: number;
  /** Total assistant session_message rows written (pre-merge). */
  assistantMessages: number;
  /** US-23 model-shape variant messages written (0 when modelVariants is off). */
  modelVariantMessages: number;
}

/** The generated project directory handed to the classifier (never stored). */
export const FIXTURE_DIRECTORY = '/fixture/projects/alpha/src';

/** Default marker when the caller does not supply one. */
export const DEFAULT_FIXTURE_MARKER = 'MK-prompt-content-4f9d2a71';

/**
 * Canonical import window for the handcrafted rows: inclusive since,
 * exclusive until. Boundary rows sit exactly on both edges.
 */
export const CANONICAL_WINDOW = {
  sinceUtc: '2026-11-24T00:00:00Z',
  untilUtc: '2026-11-28T00:00:00Z',
};

/* ------------------------------------------------------------------ *
 * US-23 model-descriptor variants (invented values only — NFR-5).
 * Single source of truth: tests import these and never retype literals.
 * ------------------------------------------------------------------ */

export const EXAMPLE_PROVIDER = 'example-provider';
export const EXAMPLE_MODEL_A = 'example-model-a';
export const EXAMPLE_MODEL_B = 'example-model-b';

/** Normalised stored value for the provider+id pair (AC-1 expectation). */
export const NORMALISED_DESCRIPTOR_A = `${EXAMPLE_PROVIDER}/${EXAMPLE_MODEL_A}`;
/** Normalised stored value for a descriptor without providerID (id alone). */
export const NORMALISED_B_ONLY_ID = EXAMPLE_MODEL_B;

/**
 * A well-formed descriptor for (providerID, id) = (EXAMPLE_PROVIDER,
 * EXAMPLE_MODEL_A) as a JSON string; keyOrder pins the physical key order,
 * extra adds extra fields (both must not change the normalised value).
 */
export function descriptorStringA(
  keyOrder: 'idFirst' | 'providerFirst',
  extra?: Record<string, unknown>,
): string {
  const core: Record<string, unknown> =
    keyOrder === 'idFirst'
      ? { id: EXAMPLE_MODEL_A, providerID: EXAMPLE_PROVIDER }
      : { providerID: EXAMPLE_PROVIDER, id: EXAMPLE_MODEL_A };
  return JSON.stringify({ ...core, ...extra });
}

/**
 * Starts with `{` but is unterminated → JSON.parse must throw. The marker is
 * embedded INSIDE the descriptor text (AC-3 bait): the fallback path must
 * keep it out of activity.db, import_run.error, errors and logs.
 */
export function badParseDescriptor(marker: string): string {
  return `{"id":"${EXAMPLE_MODEL_A}","providerID":"${EXAMPLE_PROVIDER}","note":"${marker}"`;
}

/** Valid JSON with an empty `id` (no usable id); the marker rides inside. */
export function badNoIdDescriptor(marker: string): string {
  return JSON.stringify({ id: '', providerID: EXAMPLE_PROVIDER, note: marker });
}

/** The variant session: session_v2.model is itself a JSON-string descriptor. */
const DESC_SESSION: HandcraftedSession = {
  id: 'ses_desc',
  directory: FIXTURE_DIRECTORY,
  agent: 'build',
  model: descriptorStringA('providerFirst'),
  timeCreated: '2026-11-27T05:59:00Z',
};

/**
 * The seven US-23 variant messages (spec fixture-plan table). Explicit ids,
 * distinct instants/tokens (no derived-id collisions), all inside
 * CANONICAL_WINDOW; data.text is composed from the marker like the base
 * rows, so every variant carries the AC-2/AC-3 marker bait.
 */
function modelVariantRows(marker: string): HandcraftedRow[] {
  return [
    {
      id: 'desc-str-a1',
      sessionId: 'ses_desc',
      type: 'assistant',
      time: '2026-11-27T06:00:00Z',
      timeKind: 'text',
      data: {
        agent: 'build',
        model: descriptorStringA('idFirst', { extra: 'x1', tier: 'free' }),
        tokens: { input: 11, output: 61 },
      },
    },
    {
      id: 'desc-str-a2',
      sessionId: 'ses_desc',
      type: 'assistant',
      time: '2026-11-27T06:01:00Z',
      timeKind: 'text',
      data: { agent: 'build', model: descriptorStringA('providerFirst'), tokens: { input: 12, output: 62 } },
    },
    {
      id: 'desc-obj-a3',
      sessionId: 'ses_desc',
      type: 'assistant',
      time: ms(2026, 10, 27, 6, 2, 0),
      timeKind: 'integer',
      data: {
        agent: 'build',
        model: { providerID: EXAMPLE_PROVIDER, id: EXAMPLE_MODEL_A },
        tokens: { input: 13, output: 63 },
      },
    },
    {
      id: 'desc-b-no-provider',
      sessionId: 'ses_desc',
      type: 'assistant',
      time: '2026-11-27T06:03:00Z',
      timeKind: 'text',
      data: { agent: 'build', model: JSON.stringify({ id: EXAMPLE_MODEL_B }), tokens: { input: 14, output: 64 } },
    },
    {
      id: 'desc-bad-parse',
      sessionId: 'ses_desc',
      type: 'assistant',
      time: ms(2026, 10, 27, 6, 4, 0),
      timeKind: 'integer',
      data: { agent: 'build', model: badParseDescriptor(marker), tokens: { input: 15, output: 65 } },
    },
    {
      id: 'desc-bad-noid',
      sessionId: 'ses_desc',
      type: 'assistant',
      time: '2026-11-27T06:05:00Z',
      timeKind: 'text',
      data: { agent: 'build', model: badNoIdDescriptor(marker), tokens: { input: 16, output: 66 } },
    },
    {
      // No data.model: falls back to ses_desc.model, the session-column descriptor.
      id: 'desc-user-1',
      sessionId: 'ses_desc',
      type: 'user',
      time: ms(2026, 10, 27, 6, 6, 0),
      timeKind: 'integer',
      data: { agent: 'build' },
    },
  ];
}

/** Row counts of the variant set (all in-window, no twins; tests assert against these). */
export const MODEL_VARIANT_COUNTS = { sessions: 1, messages: 7, events: 7 };

const BULK_SESSION_ID = 'ses_bulk';
const BULK_BASE_UTC = '2026-11-27T00:00:00Z';
/** Bulk instants step backwards one second per message from this base. */
const BULK_BASE_MS = Date.parse(BULK_BASE_UTC);
/** Bulk assistant token generator inputs: input = i % 500, output = i % 300. */
const BULK_TOKEN_INPUT = 500;
const BULK_TOKEN_OUTPUT = 300;

/** ms for an instant expressed as UTC components (pins INTEGER time_created rows). */
const ms = (...utcArgs: Parameters<typeof Date.UTC>) => Date.UTC(...utcArgs);

/**
 * One row of the handcrafted set. `time` is either an ISO-8601 UTC string or
 * integer epoch millis, exactly as the contract allows; `timeKind` records
 * which was physically written so tests can pin both storage formats.
 */
interface HandcraftedRow {
  id: string | null;
  sessionId: string;
  type: 'user' | 'assistant';
  /** Value physically written to session_message.time_created. */
  time: string | number;
  timeKind: 'text' | 'integer';
  /**
   * data JSON payload (without text, which the builder composes from the
   * marker). US-23 widens model to cover the parsed-object descriptor shape.
   */
  data: { agent?: string; model?: string | Record<string, unknown>; tokens?: { input: number; output: number } };
}

interface HandcraftedSession {
  id: string;
  directory: string;
  agent: string;
  /** null = no session model, forcing data.model to be consulted. */
  model: string | null;
  timeCreated: string;
}

/**
 * The handcrafted sessions. Agents are chosen so the appended agent-only
 * task rules produce a spread of task types: `build` → Coding/implementation,
 * `ask` → Research/questions, `general` → Uncategorised (contains no rule
 * keyword at all).
 */
const SESSIONS: HandcraftedSession[] = [
  { id: 'ses_mid', directory: FIXTURE_DIRECTORY, agent: 'build', model: 'glm-4.6', timeCreated: '2026-11-26T15:59:00Z' },
  { id: 'ses_ask', directory: FIXTURE_DIRECTORY, agent: 'ask', model: 'research-model-x', timeCreated: '2026-11-27T01:29:00Z' },
  { id: 'ses_gen', directory: FIXTURE_DIRECTORY, agent: 'general', model: 'chat-model-y', timeCreated: '2026-11-27T04:59:00Z' },
  { id: 'ses_twin', directory: FIXTURE_DIRECTORY, agent: 'build', model: 'glm-4.6', timeCreated: '2026-11-27T02:59:00Z' },
  { id: 'ses_edges', directory: FIXTURE_DIRECTORY, agent: 'build', model: 'glm-4.6', timeCreated: '2026-11-23T23:59:00Z' },
  { id: 'ses_old', directory: FIXTURE_DIRECTORY, agent: 'build', model: 'glm-4.6', timeCreated: '2026-11-01T00:59:00Z' },
];

/**
 * The handcrafted messages. Covers: the midnight-crossing session (ses_mid),
 * the task-type variety sessions, the id-less twin rows (ADR-3 merge limit),
 * the window boundary rows (ses_edges: exactly `since` in, exactly `until`
 * out) and older-than-window rows (ses_old).
 */
const ROWS: HandcraftedRow[] = [
  // ses_mid — crosses SG midnight: user 23:59:59 SG (2026-11-26), assistant 00:00:05 SG (2026-11-27).
  {
    id: 'mid-user',
    sessionId: 'ses_mid',
    type: 'user',
    time: '2026-11-26T15:59:59Z',
    timeKind: 'text',
    data: { agent: 'build' },
  },
  {
    id: 'mid-assistant',
    sessionId: 'ses_mid',
    type: 'assistant',
    time: ms(2026, 10, 26, 16, 0, 5),
    timeKind: 'integer',
    data: { model: 'glm-4.6', tokens: { input: 120, output: 340 } },
  },
  // ses_ask — Research/questions; two user rows pin per-session prompt counts = 2.
  {
    id: 'ask-user-1',
    sessionId: 'ses_ask',
    type: 'user',
    time: '2026-11-27T01:30:00Z',
    timeKind: 'text',
    data: { agent: 'ask' },
  },
  {
    id: 'ask-assistant-1',
    sessionId: 'ses_ask',
    type: 'assistant',
    time: '2026-11-27T01:30:40Z',
    timeKind: 'text',
    data: { model: 'research-model-x', tokens: { input: 40, output: 200 } },
  },
  {
    id: 'ask-user-2',
    sessionId: 'ses_ask',
    type: 'user',
    time: ms(2026, 10, 27, 2, 0, 0),
    timeKind: 'integer',
    data: { agent: 'ask' },
  },
  // ses_gen — agent `general` contains no rule keyword → Uncategorised.
  {
    id: 'gen-user',
    sessionId: 'ses_gen',
    type: 'user',
    time: '2026-11-27T05:00:00Z',
    timeKind: 'text',
    data: { agent: 'general' },
  },
  {
    id: 'gen-assistant',
    sessionId: 'ses_gen',
    type: 'assistant',
    time: '2026-11-27T05:00:30Z',
    timeKind: 'text',
    data: { model: 'chat-model-y', tokens: { input: 10, output: 50 } },
  },
  // ses_twin — two genuinely distinct id-less assistant rows (different text)
  // with identical session/type/instant/tokens: the ADR-3 derived-id merge
  // limit collapses them into one usage_event row. INTEGER instants.
  {
    id: null,
    sessionId: 'ses_twin',
    type: 'assistant',
    time: ms(2026, 10, 27, 3, 0, 0),
    timeKind: 'integer',
    data: { model: 'glm-4.6', tokens: { input: 500, output: 999 } },
  },
  {
    id: null,
    sessionId: 'ses_twin',
    type: 'assistant',
    time: ms(2026, 10, 27, 3, 0, 0),
    timeKind: 'integer',
    data: { model: 'glm-4.6', tokens: { input: 500, output: 999 } },
  },
  // ses_edges — boundary rows: exactly `since` (included), exactly `until` (excluded).
  {
    id: 'edge-since',
    sessionId: 'ses_edges',
    type: 'user',
    time: CANONICAL_WINDOW.sinceUtc,
    timeKind: 'text',
    data: { agent: 'build' },
  },
  {
    id: 'edge-until',
    sessionId: 'ses_edges',
    type: 'assistant',
    time: CANONICAL_WINDOW.untilUtc,
    timeKind: 'text',
    data: { model: 'glm-4.6', tokens: { input: 15, output: 70 } },
  },
  // ses_old — older than the 7-day window: excluded by every canonical run.
  {
    id: 'old-user',
    sessionId: 'ses_old',
    type: 'user',
    time: '2026-11-01T01:00:00Z',
    timeKind: 'text',
    data: { agent: 'build' },
  },
  {
    id: 'old-assistant',
    sessionId: 'ses_old',
    type: 'assistant',
    time: '2026-11-01T01:00:30Z',
    timeKind: 'text',
    data: { model: 'glm-4.6', tokens: { input: 5, output: 25 } },
  },
];

/** Storage-format-agnostic instant (ms) of a handcrafted row. */
function rowInstantMs(row: HandcraftedRow): number {
  return row.timeKind === 'integer' ? (row.time as number) : Date.parse(row.time as string);
}

/** Row counts of the handcrafted set (tests import these instead of magic numbers). */
export const HANDCRAFTED_COUNTS = {
  sessions: SESSIONS.length,
  userMessages: ROWS.filter((r) => r.type === 'user').length,
  assistantMessages: ROWS.filter((r) => r.type === 'assistant').length,
};

const inWindow = (r: HandcraftedRow) =>
  rowInstantMs(r) >= Date.parse(CANONICAL_WINDOW.sinceUtc) &&
  rowInstantMs(r) < Date.parse(CANONICAL_WINDOW.untilUtc);

/**
 * Handcrafted rows the canonical window lets through (assistant twins still
 * physically present — the adapter collapses them).
 */
export const IN_WINDOW_COUNTS = {
  /** Raw session_message rows inside [since, until). */
  messages: ROWS.filter(inWindow).length,
  /** usage_event rows after the twin collapse (two twins → one derived row). */
  events: ROWS.filter(inWindow).length - 1,
};

function composeText(marker: string, variant: string): string {
  return `[${marker}] generated prompt content ${variant} — never leave the adapter`;
}

/**
 * Build a generated opencode.db at <dir>/opencode.db implementing the design's
 * source-schema contract. Returns the row counts actually written (bulk
 * messages included) so tests assert against facts, not guesses.
 */
export function writeOpencodeFixture(options: OpencodeFixtureOptions): OpencodeFixtureInfo {
  const marker = options.marker ?? DEFAULT_FIXTURE_MARKER;
  const variantsOn = options.modelVariants === true;
  const variantRows = variantsOn ? modelVariantRows(marker) : [];
  fs.mkdirSync(options.dir, { recursive: true });
  const dbPath = path.join(options.dir, 'opencode.db');
  fs.rmSync(dbPath, { force: true });

  const db = new Database(dbPath);
  try {
    db.exec(`
      CREATE TABLE session_v2 (
        id TEXT PRIMARY KEY,
        directory TEXT,
        agent TEXT,
        model TEXT,
        time_created
      );
      CREATE TABLE session_message (
        id TEXT,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('user', 'assistant')),
        time_created,
        data TEXT NOT NULL
      );
    `);

    const insertSession = db.prepare(
      'INSERT INTO session_v2 (id, directory, agent, model, time_created) VALUES (?, ?, ?, ?, ?)',
    );
    const insertMessage = db.prepare(
      'INSERT INTO session_message (id, session_id, type, time_created, data) VALUES (?, ?, ?, ?, ?)',
    );

    const writeAll = db.transaction(() => {
      for (const session of SESSIONS) {
        insertSession.run(session.id, session.directory, session.agent, session.model, session.timeCreated);
      }
      insertSession.run(BULK_SESSION_ID, FIXTURE_DIRECTORY, 'build', 'glm-4.6', BULK_BASE_UTC);
      if (variantsOn) {
        insertSession.run(DESC_SESSION.id, DESC_SESSION.directory, DESC_SESSION.agent, DESC_SESSION.model, DESC_SESSION.timeCreated);
      }

      let variant = 0;
      for (const row of ROWS) {
        const data = { ...row.data, text: composeText(marker, `hc-${variant++}`) };
        // BigInt binds as SQLite INTEGER; a JS number would bind as REAL.
        const timeBinding = typeof row.time === 'number' ? BigInt(row.time) : row.time;
        insertMessage.run(row.id, row.sessionId, row.type, timeBinding, JSON.stringify(data));
      }

      // US-23 model-shape variants (only when opted in): composed from the
      // same marker so every variant data JSON carries the AC-2/AC-3 bait.
      for (const row of variantRows) {
        const data = { ...row.data, text: composeText(marker, `desc-${row.id}`) };
        const timeBinding = typeof row.time === 'number' ? BigInt(row.time) : row.time;
        insertMessage.run(row.id, row.sessionId, row.type, timeBinding, JSON.stringify(data));
      }

      for (let i = 0; i < (options.messageCount ?? 0); i += 1) {
        const isUser = i % 2 === 0;
        const type = isUser ? 'user' : 'assistant';
        const instant = new Date(BULK_BASE_MS - i * 1000).toISOString();
        const data: Record<string, unknown> = {
          agent: 'build',
          text: composeText(marker, `bulk-${i}`),
        };
        if (!isUser) {
          data.model = 'glm-4.6';
          data.tokens = { input: i % BULK_TOKEN_INPUT, output: i % BULK_TOKEN_OUTPUT };
        }
        insertMessage.run(`bulk-${type}-${i}`, BULK_SESSION_ID, type, instant, JSON.stringify(data));
      }
    });
    writeAll();

    const bulk = options.messageCount ?? 0;
    const variantUsers = variantRows.filter((r) => r.type === 'user').length;
    const variantAssistants = variantRows.filter((r) => r.type === 'assistant').length;
    return {
      dbPath,
      userMessages: HANDCRAFTED_COUNTS.userMessages + Math.ceil(bulk / 2) + variantUsers,
      assistantMessages: HANDCRAFTED_COUNTS.assistantMessages + Math.floor(bulk / 2) + variantAssistants,
      modelVariantMessages: variantRows.length,
    };
  } finally {
    db.close();
  }
}
