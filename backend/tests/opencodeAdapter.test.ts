import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import {
  OPENCODE_TOOL,
  OpenCodeAdapter,
  OpenCodeAdapterError,
  deriveSourceId,
  mapRow,
  toInstantIso,
  type JoinRow,
} from '../src/import/adapters/opencodeAdapter';
import {
  CANONICAL_WINDOW,
  HANDCRAFTED_COUNTS,
  IN_WINDOW_COUNTS,
  writeOpencodeFixture,
  type OpencodeFixtureInfo,
} from './fixtures/opencodeDb';

/**
 * AC-1 / AC-2 unit tests over the generated fixture (real better-sqlite3,
 * nothing mocked). All data generated; the marker baits every text field.
 */

const MARKER = 'MK-opencode-unit-9a51c3de';
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'us3-'));
let fixture: OpencodeFixtureInfo;
let adapter: OpenCodeAdapter;

beforeAll(() => {
  fixture = writeOpencodeFixture({ dir: path.join(tmpRoot, 'fixture'), marker: MARKER });
  adapter = new OpenCodeAdapter({ sourceDbPath: fixture.dbPath });
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

/** Minimal valid in-window row for mapRow/deriveSourceId unit calls. */
function joinRow(overrides: Partial<JoinRow> = {}): JoinRow {
  return {
    id: 'unit-row-1',
    sessionId: 'ses_unit',
    type: 'assistant',
    timeCreated: '2026-11-27T03:00:00Z',
    data: JSON.stringify({ model: 'unit-model', tokens: { input: 1, output: 2 } }),
    directory: '/fixture/projects/alpha/src',
    sessionAgent: 'build',
    sessionModel: 'unit-model',
    ...overrides,
  };
}

const byId = (sourceId: string) => {
  const found = adapter
    .readEvents(CANONICAL_WINDOW.sinceUtc, CANONICAL_WINDOW.untilUtc)
    .find((r) => r.sourceId === sourceId);
  if (!found) throw new Error(`no record with sourceId ${sourceId}`);
  return found;
};

describe('fixture smoke (task 2)', () => {
  it('builds the fixture with exactly the expected handcrafted row counts', () => {
    const db = new Database(fixture.dbPath, { readonly: true });
    try {
      const total = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
      expect(total('SELECT COUNT(*) AS n FROM session_message')).toBe(
        HANDCRAFTED_COUNTS.userMessages + HANDCRAFTED_COUNTS.assistantMessages,
      );
      expect(total(`SELECT COUNT(*) AS n FROM session_message WHERE type = 'user'`)).toBe(
        HANDCRAFTED_COUNTS.userMessages,
      );
      expect(total(`SELECT COUNT(*) AS n FROM session_message WHERE type = 'assistant'`)).toBe(
        HANDCRAFTED_COUNTS.assistantMessages,
      );
      // 6 handcrafted sessions + the bulk session (empty in non-bulk mode).
      expect(total('SELECT COUNT(*) AS n FROM session_v2')).toBe(HANDCRAFTED_COUNTS.sessions + 1);
      // Both storage formats are physically present for time_created (fixture contract).
      expect(total(`SELECT COUNT(*) AS n FROM session_message WHERE typeof(time_created) = 'integer'`)).toBeGreaterThan(0);
      expect(total(`SELECT COUNT(*) AS n FROM session_message WHERE typeof(time_created) = 'text'`)).toBeGreaterThan(0);
      // The marker baits every text field of every data JSON.
      expect(total(`SELECT COUNT(*) AS n FROM session_message WHERE data NOT LIKE '%${MARKER}%'`)).toBe(0);
    } finally {
      db.close();
    }
  });

  it('bulk messageCount mode writes the requested generated messages', () => {
    const bulk = writeOpencodeFixture({ dir: path.join(tmpRoot, 'bulk'), messageCount: 10, marker: MARKER });
    expect(bulk.userMessages).toBe(HANDCRAFTED_COUNTS.userMessages + 5);
    expect(bulk.assistantMessages).toBe(HANDCRAFTED_COUNTS.assistantMessages + 5);
    const db = new Database(bulk.dbPath, { readonly: true });
    try {
      expect((db.prepare('SELECT COUNT(*) AS n FROM session_message').get() as { n: number }).n).toBe(
        bulk.userMessages + bulk.assistantMessages,
      );
    } finally {
      db.close();
    }
  });
});

describe('OpenCodeAdapter.readEvents over the fixture (AC-1, AC-2)', () => {
  test('tool is opencode', () => {
    expect(adapter.tool).toBe('opencode');
    expect(OPENCODE_TOOL).toBe('opencode');
  });

  test('window edges: row at exactly `since` in, row at exactly `until` out; older rows absent', () => {
    const records = adapter.readEvents(CANONICAL_WINDOW.sinceUtc, CANONICAL_WINDOW.untilUtc);
    const ids = records.map((r) => r.sourceId);
    expect(records).toHaveLength(IN_WINDOW_COUNTS.events); // twin collapse included
    expect(ids).toContain('edge-since');
    expect(ids).not.toContain('edge-until');
    expect(ids).not.toContain('old-user');
    expect(ids).not.toContain('old-assistant');
  });

  test('user rows are prompts with 0/0 tokens; assistant rows carry data.tokens and data.model', () => {
    const user = byId('mid-user');
    expect(user.promptCount).toBe(1);
    expect(user.inputTokens).toBe(0);
    expect(user.outputTokens).toBe(0);
    expect(user.model).toBe('glm-4.6'); // no data.model → session_v2.model fallback (BR-5)

    const assistant = byId('mid-assistant');
    expect(assistant.promptCount).toBe(0);
    expect(assistant.inputTokens).toBe(120);
    expect(assistant.outputTokens).toBe(340);
    expect(assistant.model).toBe('glm-4.6');
  });

  test('instants from TEXT-ISO and INTEGER epoch-millis sources both normalize to ISO-Z', () => {
    expect(byId('mid-user').occurredAtUtc).toBe('2026-11-26T15:59:59Z'); // written as TEXT, as-is
    expect(byId('mid-assistant').occurredAtUtc).toBe('2026-11-26T16:00:05.000Z'); // written as INTEGER
    expect(byId('mid-assistant').occurredAtUtc).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
  });

  test('metadata keys are exactly {agent, directory} and no yielded field contains the marker', () => {
    const records = adapter.readEvents(CANONICAL_WINDOW.sinceUtc, CANONICAL_WINDOW.untilUtc);
    expect(records.length).toBeGreaterThan(0);
    for (const record of records) {
      expect(Object.keys(record.metadata).sort()).toEqual(['agent', 'directory']);
      // AC-2 (adapter-output half): not one yielded field carries the fixture text marker.
      expect(JSON.stringify(record)).not.toContain(MARKER);
    }
    expect(byId('ask-user-1').metadata.agent).toBe('ask');
    expect(byId('mid-user').metadata.directory).toBe('/fixture/projects/alpha/src');
  });

  test('id-less rows get derived:<32 hex> ids and the twin rows collapse to ONE record (ADR-3)', () => {
    const records = adapter.readEvents(CANONICAL_WINDOW.sinceUtc, CANONICAL_WINDOW.untilUtc);
    const twinRecords = records.filter((r) => r.sourceId.startsWith('derived:'));
    expect(twinRecords).toHaveLength(1);
    expect(twinRecords[0].sourceId).toMatch(/^derived:[0-9a-f]{32}$/);
    expect(twinRecords[0].inputTokens).toBe(500);
    expect(twinRecords[0].outputTokens).toBe(999);
    // The doc comment on deriveSourceId must state the merge limit (ADR-3).
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'import', 'adapters', 'opencodeAdapter.ts'),
      'utf8',
    );
    const deriveIndex = source.indexOf('export function deriveSourceId');
    const docComment = source.slice(source.lastIndexOf('/**', deriveIndex), deriveIndex);
    expect(docComment).toMatch(/merge limit/i);
    expect(docComment).toMatch(/ADR-3/);
  });

  test('the copy is cleaned up after every read (no temp litter)', () => {
    const before = fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('usage-src-'));
    adapter.readEvents(CANONICAL_WINDOW.sinceUtc, CANONICAL_WINDOW.untilUtc);
    const after = fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('usage-src-'));
    expect(after).toEqual(before);
  });
});

describe('toInstantIso (AC-1 foundations)', () => {
  test('integer epoch millis → ISO-Z string', () => {
    expect(toInstantIso(Date.UTC(2026, 10, 26, 16, 0, 5))).toBe('2026-11-26T16:00:05.000Z');
  });

  test('ISO strings with Z or ±HH:MM designators pass through as-is', () => {
    expect(toInstantIso('2026-11-26T15:59:59Z')).toBe('2026-11-26T15:59:59Z');
    expect(toInstantIso('2026-11-26T23:59:59+08:00')).toBe('2026-11-26T23:59:59+08:00');
  });

  test('anything else throws OpenCodeAdapterError', () => {
    expect(() => toInstantIso('2026-11-26 15:59:59')).toThrow(OpenCodeAdapterError); // no designator
    expect(() => toInstantIso('2026-11-26')).toThrow(OpenCodeAdapterError); // date-only
    expect(() => toInstantIso('1798387199000')).toThrow(OpenCodeAdapterError); // numeric text
    expect(() => toInstantIso(1.5)).toThrow(OpenCodeAdapterError); // non-integer number
    expect(() => toInstantIso(1e18)).toThrow(OpenCodeAdapterError); // out of Date range
    expect(() => toInstantIso(null)).toThrow(OpenCodeAdapterError);
    expect(() => toInstantIso(undefined)).toThrow(OpenCodeAdapterError);
    expect(() => toInstantIso({})).toThrow(OpenCodeAdapterError);
  });
});

describe('mapRow / deriveSourceId failure fast-paths (fail fast, ids only)', () => {
  test('bad JSON in data → OpenCodeAdapterError naming the message id, never content', () => {
    const row = joinRow({ id: 'bad-json-1', data: `{not json ${MARKER}` });
    expect(() => mapRow(row)).toThrow(OpenCodeAdapterError);
    let message = '';
    try {
      mapRow(row);
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain('bad-json-1');
    expect(message).toContain('data is not valid JSON');
    expect(message).not.toContain(MARKER);
  });

  test('non-ISO / non-integer time → OpenCodeAdapterError naming the message id', () => {
    let message = '';
    try {
      mapRow(joinRow({ id: 'bad-time-1', timeCreated: 'yesterday' }));
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain('bad-time-1');
    expect(message).toContain('time_created');
  });

  test('model absent on message and session → OpenCodeAdapterError naming the id (no silent unknown)', () => {
    let message = '';
    try {
      mapRow(
        joinRow({
          id: 'no-model-1',
          data: JSON.stringify({ tokens: { input: 1, output: 1 }, text: MARKER }),
          sessionModel: null,
        }),
      ).model;
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain('no-model-1');
    expect(message).toContain('model');
    expect(message).not.toContain(MARKER);
  });

  test('negative or non-numeric tokens → OpenCodeAdapterError naming the id', () => {
    expect(() =>
      mapRow(joinRow({ id: 'neg-1', data: JSON.stringify({ model: 'm', tokens: { input: -3, output: 1 } }) })),
    ).toThrow(OpenCodeAdapterError);
    expect(() =>
      mapRow(joinRow({ id: 'nan-1', data: JSON.stringify({ model: 'm', tokens: { input: 'many', output: 1 } }) })),
    ).toThrow(/nan-1/);
  });

  test('bad values are described by type/length only, never echoed (NFR-5)', () => {
    const messageOf = (fn: () => unknown): string => {
      try {
        fn();
      } catch (err) {
        return (err as Error).message;
      }
      return '';
    };
    const badTime = messageOf(() => toInstantIso(`${MARKER} not a time`));
    expect(badTime).toContain('time_created');
    expect(badTime).toContain('string(len ');
    expect(badTime).not.toContain(MARKER);

    const badToken = messageOf(() =>
      mapRow(joinRow({ id: 'nan-2', data: JSON.stringify({ model: 'm', tokens: { input: MARKER, output: 1 } }) })),
    );
    expect(badToken).toContain('nan-2');
    expect(badToken).toContain('tokens.input');
    expect(badToken).toContain('string(len ');
    expect(badToken).not.toContain(MARKER);
    expect(badToken).not.toContain('many');
  });

  test('deriveSourceId: twins hash equal, token/time/type differences differ, ADR-3 basis pinned', () => {
    const twin = (text: string) =>
      joinRow({
        id: null,
        sessionId: 'ses_twin',
        type: 'assistant',
        timeCreated: Date.UTC(2026, 10, 27, 3, 0, 0),
        data: JSON.stringify({ model: 'glm-4.6', tokens: { input: 500, output: 999 }, text }),
      });
    const derivedA = deriveSourceId(twin(`first ${MARKER}`));
    const derivedB = deriveSourceId(twin(`second ${MARKER}`));
    expect(derivedA).toBe(derivedB);
    expect(derivedA).toMatch(/^derived:[0-9a-f]{32}$/);

    // The pinned ADR-3 basis: sha256("opencode|sessionId|type|isoTime|in|out")[0..32].
    const expectedHex = crypto
      .createHash('sha256')
      .update('opencode|ses_twin|assistant|2026-11-27T03:00:00.000Z|500|999', 'utf8')
      .digest('hex')
      .slice(0, 32);
    expect(derivedA).toBe(`derived:${expectedHex}`);

    // Different tokens / session / type / instant → different derived ids.
    const rowLike = (o: Partial<JoinRow>) =>
      joinRow({
        id: null,
        sessionId: 'ses_twin',
        type: 'assistant',
        timeCreated: Date.UTC(2026, 10, 27, 3, 0, 0),
        data: JSON.stringify({ model: 'glm-4.6', tokens: { input: 500, output: 999 }, text: 'z' }),
        ...o,
      });
    expect(deriveSourceId(rowLike({}))).not.toBe(
      deriveSourceId(rowLike({ data: JSON.stringify({ model: 'glm-4.6', tokens: { input: 501, output: 999 } }) })),
    );
    expect(deriveSourceId(rowLike({}))).not.toBe(deriveSourceId(rowLike({ sessionId: 'ses_other' })));
    expect(deriveSourceId(rowLike({}))).not.toBe(deriveSourceId(rowLike({ type: 'user' })));
    expect(deriveSourceId(rowLike({}))).not.toBe(
      deriveSourceId(rowLike({ timeCreated: Date.UTC(2026, 10, 27, 3, 0, 1) })),
    );
  });

  test('mapRow drops data.text entirely (BR-1)', () => {
    const record = mapRow(
      joinRow({ id: 'drop-text-1', data: JSON.stringify({ model: 'm', text: `prompt ${MARKER} here` }) }),
    );
    expect(JSON.stringify(record)).not.toContain(MARKER);
    expect(record.promptCount).toBe(0);
  });
});

describe('OpenCodeAdapter.readEvents window-before-map (R3)', () => {
  const buildDb = (name: string, rows: Array<{ id: string; time: string; data: string }>) => {
    const dir = path.join(tmpRoot, name);
    fs.mkdirSync(dir, { recursive: true });
    const dbPath = path.join(dir, 'opencode.db');
    const db = new Database(dbPath);
    try {
      db.exec(`
        CREATE TABLE session_v2 (id TEXT PRIMARY KEY, directory TEXT, agent TEXT, model TEXT, time_created);
        CREATE TABLE session_message (id TEXT, session_id TEXT NOT NULL, type TEXT NOT NULL, time_created, data TEXT NOT NULL);
      `);
      db.prepare('INSERT INTO session_v2 VALUES (?,?,?,?,?)').run('ses_w', '/d', 'build', 'm', '2026-11-01T00:00:00Z');
      const insert = db.prepare('INSERT INTO session_message VALUES (?,?,?,?,?)');
      for (const row of rows) {
        insert.run(row.id, 'ses_w', 'user', row.time, row.data);
      }
    } finally {
      db.close();
    }
    return dbPath;
  };
  const good = JSON.stringify({ model: 'm' });
  const OLD = '2026-11-01T00:00:00Z'; // before CANONICAL_WINDOW
  const MID = '2026-11-26T16:30:00Z'; // inside CANONICAL_WINDOW

  test('an out-of-window row with invalid data JSON does not fail the import', () => {
    const dbPath = buildDb('window-old-bad', [
      { id: 'old-bad', time: OLD, data: `{not json ${MARKER}` },
      { id: 'mid-ok', time: MID, data: good },
    ]);
    const records = new OpenCodeAdapter({ sourceDbPath: dbPath }).readEvents(
      CANONICAL_WINDOW.sinceUtc,
      CANONICAL_WINDOW.untilUtc,
    );
    expect(records.map((r) => r.sourceId)).toEqual(['mid-ok']);
  });

  test('the same defect in an in-window row still fails, naming the id', () => {
    const dbPath = buildDb('window-mid-bad', [{ id: 'mid-bad', time: MID, data: `{not json ${MARKER}` }]);
    const run = () =>
      new OpenCodeAdapter({ sourceDbPath: dbPath }).readEvents(CANONICAL_WINDOW.sinceUtc, CANONICAL_WINDOW.untilUtc);
    expect(run).toThrow(OpenCodeAdapterError);
    expect(run).toThrow(/mid-bad/);
  });
});
