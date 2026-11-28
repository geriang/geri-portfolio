# Spec: US-4 — Read-only GET /activity API

Status: draft

## Goal

US-4: serve the owner's pre-aggregated usage dataset for a date range from `activity.db` opened
read-only, as `GET /activity` — a metadata block (time zone, as-of date, last updated, task types,
models, tools, applied range) plus rows grouped by `(day_local, tool, model, task_type)` — without the
browser ever touching the owner's tool databases and without disturbing the legacy portfolio routes.

## Design

[docs/design/US-4-activity-api.md](../design/US-4-activity-api.md) — read it before coding: module
 responsibilities, interfaces, SQL, patterns, error table and diagrams are normative there. This spec adds
the fixture plan, the ordered task list and the AC-to-test mapping.

## Context a fresh implementer needs

- Repo: this project. All commands run from `backend/` unless stated. `npm test` = `jest`.
- Story: `docs/product/stories/US-4-activity-api.md` (Status: approved). Sprint: `docs/product/sprints/sprint-2.md`.
- **Dependencies already merged into `main`**: US-2 (`backend/src/import/activityDb.ts` with
  `openActivityDb({path?, readonly?})`, `ACTIVITY_SCHEMA_DDL`, `initActivitySchema`, `upsertUsageEvents`)
  and US-23 (`backend/src/import/modelNormalise.ts`; `usage_event.model` therefore holds normalised
  `provider/id` or plain names). Start from the **latest `origin/main`**, not from an agent branch.
- **Never modify** `backend/src/db.ts` (the legacy portfolio DB with its `__dirname` path — the story Notes
  forbid reusing that pattern), `backend/src/routes/{chat,entity,staticData}.ts`, anything under
  `backend/src/import/`, `package.json` dependencies, or any pre-existing test file's assertions. The
  sprint-2 exit gate includes "all pre-existing tests unchanged": after your work, `git diff origin/main
  -- backend/tests` must show **zero removed lines** in files you did not create.
- `requirements.md`, `architecture.md` and the ADRs are **not tracked** in this repo (backlog Assumptions);
  the approved backlog is the working source of truth. Do not go hunting for them and do not invent CMP IDs.
- Data privacy rules that bind every committed line: generated fixtures only; third-party tools other
  than opencode are called **Agent-tool / Chat-tool**; never commit a real model name, provider name,
  hostname, account name, path, token or prompt/response text. Use the invented constants listed below.
- If a served `models` value ever contains `{` or `}`, that is a **US-23 defect**: report it, do not
  filter, sanitise or paper over it in this story (story Notes).
- Environment prep used for this spec's design work (verified): `backend/node_modules` may be absent in a
  fresh worktree → `npm install --no-audit --no-fund`. `git switch main` can fail in an agent worktree
  (main checked out elsewhere); use `git fetch --prune && git switch -c agent/us-4-activity-api origin/main`.
- Probe-verified runtime facts (design basis, do not re-litigate): a read-only `better-sqlite3` open of a
  checkpointed WAL DB works; `db.readonly === true`; `INSERT`/`CREATE TABLE` through it throw
  `SQLITE_READONLY` ("attempt to write a readonly database"); a missing file throws `SQLITE_CANTOPEN`;
  the grouped query over 620 rows costs ~0.27 ms and ~100 read-only opens cost ~1.8 ms total; and a
  read-only open of a WAL database leaves `<db>-wal` (0 bytes) plus a 32768-byte `<db>-shm` behind after
  `close()` — it cannot checkpoint or delete them (this is what task 5(f) asserts instead of absence).

## Scope

- New read-model query layer + fixed error/response shapes + the `GET /activity` route, mounted by the
  existing express app in `backend/src/index.ts` (one import + one `app.use` line).
- Deterministic generated `activity.db` seeder for tests.
- Contract, unit, read-only, structural and timing tests for AC-1 … AC-8; AC-9 handoff note.

## Out of scope

(from the story) Public-surface hardening — method lock-down, CORS allowlist, helmet, rate limit, trust
proxy, tunnel rule (US-5); any frontend rendering/fetching/caching (US-6, US-11); filtering by model,
task type or tool via query parameters (US-10 filters client-side over the full dataset); earlier-period
picker semantics beyond the fixed 12-month default (US-19); compression, pagination or cache-header tuning.
Also out of scope here: any schema change or migration, any change to the importer, and any new dependency.

## Acceptance criteria

(verbatim from `docs/product/stories/US-4-activity-api.md`)

- AC-1: Given `activity.db` seeded from the generated fixture, when a client sends `GET /activity` with no parameters, then the response is `200` with `application/json` and a metadata block containing at least: `timeZone` (the literal `Asia/Singapore`, BR-4), `asOfDate`, `lastUpdated` (the `finished_at` of the most recent successful `import_run`, FR-18), `taskTypes`, `models` and `tools` (distinct values present in the served range), plus a `rows` array. (Verified by: Jest + supertest contract test against the composed route; FR-2, FR-18, FR-20, BR-4, ADR-5.)
- AC-2: Given `?from=YYYY-MM-DD&to=YYYY-MM-DD` (inclusive, `Asia/Singapore` calendar days), when the request is served, then `rows` contains only `day_local` values inside the range, and each row is one group of `(day_local, tool, model, task_type)` with summed `input_tokens`, `output_tokens` and `prompt_count`, matching the seeded fixture values exactly. (Verified by: Jest + supertest test comparing against fixture totals computed in the test; FR-2, FR-20, ADR-3.)
- AC-3: Given a range with no usage at all, or an `activity.db` with no successful import yet, when the request is served, then the response is still `200` with the full metadata block and an empty `rows` array — never a 500 and never a missing metadata key. (Verified by: Jest + supertest test over an empty and an unimported database; FR-18, FR-20.)
- AC-4: Given `from` or `to` that is not a `YYYY-MM-DD` date, or `from` later than `to`, when the request is served, then the response is `400` with a fixed machine-readable error shape (a constant code and message), and no SQLite or driver error text, file path or source value appears in the body, captured logs or stdout. (Verified by: Jest + supertest tests for each invalid input, plus a marker-text check inside the invalid value; FR-2, NFR-5, BR-1.)
- AC-5: Given the API serves requests while a writer would hold the database, when the route queries `activity.db`, then it opens the database read-only via the existing `activityDb` open helper (`readonly: true`), issues only `SELECT` statements and never creates, migrates or writes schema — a test that attempts any write through the route's connection fails with a read-only error. (Verified by: Jest test asserting the open mode and a rejected write attempt; FR-18, ADR-1, ADR-3.)
- AC-6: Given the default range (no parameters), when the request is served, then `to` is the `asOfDate` and `from` is 12 months before it, so the payload covers a 12-month window, and the metadata echoes the applied range (`from` and `to` as actually served). (Verified by: Jest + supertest test seeding rows inside and outside the 12-month window; FR-2, FR-20.)
- AC-7: Given the seeded fixture contains marker strings standing in for prompt and response text, when any `GET /activity` request is served, then neither the response body nor any server-captured log or error text contains a marker, and the schema of the response contains no field carrying free text beyond the agreed `model`, `task_type`, `tool` and metadata values. (Verified by: Jest + supertest marker scan of response, logs and errors; NFR-5, BR-1.)
- AC-8: Given a seeded 12-month payload (at least 300 rows across at least 300 days, 3 models, 3 task types, 2 tools), when the test issues 20 sequential `GET /activity?` full-range requests in-process, then 20 return `200` and the 95th-percentile wall-clock latency is below 300 ms. (Verified by: Jest timing test run twice, both passing; NFR-2. The 300 ms figure is a planning stand-in — the requirements file is not in the repository, so the owner must confirm it against the NFR-2 wording; see Notes.)
- AC-9: Manual (user): Given the story is merged, when the owner runs the real importer into a scratch `activity.db` on their host and then starts the API against it, then `GET /activity` returns `200`, and the `rows` totals for the last 7 days equal the importer summary counts (numbers only). Report counts only, never values. (FR-2, FR-18, NFR-2.)

## Normative shapes (implement exactly; the tests assert these)

```ts
// 200 — GET /activity?from=&to=      (content-type: application/json; charset=utf-8)
{
  "metadata": {
    "timeZone": "Asia/Singapore",              // literal, always (BR-4)
    "asOfDate": "2026-11-27" | null,           // Singapore day of lastUpdated's finished_at
    "lastUpdated": "2026-11-27T15:30:00.000Z" | null, // verbatim import_run.finished_at (FR-18)
    "from": "2025-11-27" | null,               // applied range echo (AC-6)
    "to": "2026-11-27" | null,
    "taskTypes": ["Coding/implementation", "Debugging/fixing", "Uncategorised"],
    "models": ["example-provider/example-model-a", "unknown"],
    "tools": ["fixture-tool-a", "fixture-tool-b"]
  },
  "rows": [ { "day_local": "2026-11-27", "tool": "fixture-tool-a", "model": "example-provider/example-model-a",
              "task_type": "Uncategorised", "input_tokens": 100, "output_tokens": 50, "prompt_count": 1 } ]
}
// Key allow-list (AC-7 proves it): top level = metadata, rows; metadata = the 8 keys above;
// row = the 7 columns above. Nothing else, ever.

// 400 — every invalid range, byte-identical body, no interpolation (AC-4)
{ "error": { "code": "INVALID_ACTIVITY_RANGE",
             "message": "from and to must be YYYY-MM-DD calendar dates and from must not be later than to" } }

// 500 — unexpected read failure (design decision, keeps AC-3's "never a 500" for data-empty cases)
{ "error": { "code": "ACTIVITY_UNAVAILABLE", "message": "the activity data is temporarily unavailable" } }
```

Rules that the design decided (implement as written; each has a test):

1. **Blank ≠ invalid.** The published contract is `?from=&to=`, so a value that is absent **or whose
   `trim()` is empty** counts as absent and takes its default. Any other non-`YYYY-MM-DD` value (including
   an array from `?from=a&from=b`) → 400.
2. **Defaults:** `to := asOfDate`, then `from := addMonths(to, -12)` (calendar-month arithmetic, same
   day-of-month, **clamped to the last day of the target month**: `2028-02-29 → 2027-02-28`,
   `2026-03-31 → 2025-03-31`). Single-sided ranges: `?from=` only → `to = asOfDate`; `?to=` only →
   `from = addMonths(to, -12)`. The window is **inclusive on both ends**, `from` may equal `to`.
3. **No clock, no mutation.** `asOfDate`/`lastUpdated` come only from `import_run` (`status='success'`,
   newest `finished_at`, tie-break `id DESC`); `asOfDate = toDayLocal(finished_at, 'Asia/Singapore')`
   reusing `backend/src/import/dayLocal.ts`. Repeated requests over an unchanged DB are byte-identical.
4. **Empty is 200, not 500:** no rows in range, no successful run, unparseable `finished_at`, missing
   `ACTIVITY_DB_PATH`, missing DB file or a failed open all return the full metadata block with `null`s /
   `[]` and `rows: []`, plus **one** `console.warn` of a frozen constant line (no interpolation). When no
   successful run exists but rows do, the default range anchors on `MAX(day_local)` and `lastUpdated`
   stays `null`.
5. **Unknown extra query params are ignored** (no server-side filtering in this story).
6. **Read-only, SELECT-only:** the API's only connection comes from
   `openActivityDb({ path: dbPath, readonly: true })` (`ACTIVITY_READ_OPTIONS = { readonly: true }`),
   opened per request and closed in `finally`. No `PRAGMA`, no `initActivitySchema`, no `__dirname`, no
   `better-sqlite3` import in `src/activity/**`.

## Fixture plan (`backend/tests/fixtures/activitySeed.ts` — new)

Generated values only; single source of truth (tests import these and never retype literals). It creates
the schema with the importer's own `initActivitySchema` and writes rows through the importer's own
`upsertUsageEvents`, so tests exercise the real write path.

```ts
export const SEED_TO_DAY = '2026-11-27';                       // asOfDate / default `to`
export const SEED_STARTED_AT = '2026-11-27T15:00:00.000Z';     // 23:00 SGT on SEED_TO_DAY
export const SEED_FINISHED_AT = '2026-11-27T15:30:00.000Z';    // 23:30 SGT on SEED_TO_DAY (see UTC rule)
export const SEED_FROM_DAY = '2025-11-27';                     // addMonths(SEED_TO_DAY, -12)
export const SEED_TOOLS = ['fixture-tool-a', 'fixture-tool-b'] as const;
export const SEED_MODELS = ['fixture-model-a',                  // plain US-23-style names, NO braces
                            'example-provider/example-model-a', // normalised descriptor shape
                            'unknown'] as const;                // US-23 fallback constant
export const SEED_TASK_TYPES = ['Coding/implementation',        // real values from config/task-rules.json
                                'Debugging/fixing', 'Uncategorised'] as const;
export const SEED_MARKER = 'MK-activity-content-7c41d9e3';      // bait for AC-7
export interface SeedOptions {
  dbPath: string;
  days?: number;                 // default 300 (>= AC-8's 300-day floor); day N = SEED_TO_DAY - N
  rowsPerDay?: number;           // default 2 (one per tool)
  runs?: 'success' | 'failed-only' | 'running-only' | 'none';   // default 'success'
  withMarker?: boolean;          // default true
}
export interface SeedFacts {
  rows: Array<{ day_local: string; tool: string; model: string; task_type: string;
                input_tokens: number; output_tokens: number; prompt_count: number }>;
  distinctDays: number; distinctModels: string[]; distinctTaskTypes: string[]; distinctTools: string[];
  asOfDate: string; lastUpdated: string | null;
  expectedRows(from: string, to: string): SeedFacts['rows']; // grouped + summed + sorted, computed in JS
  totalsForDays(days: string[]): { input_tokens: number; output_tokens: number; prompt_count: number };
}
export function seedActivityDb(options: SeedOptions): SeedFacts;
export function createEmptyActivityDb(dbPath: string): void;  // schema only, no rows, no import_run rows
```

Deterministic (no `Math.random`, no wall clock). For day index `i` (0 = `SEED_TO_DAY`, counting backwards
by one calendar day) and row index `j` in `0 .. rowsPerDay-1`:
`tool = SEED_TOOLS[j % 2]`, `model = SEED_MODELS[(i + j) % 3]`,
`task_type = SEED_TASK_TYPES[(i * 2 + j) % 3]`, `input_tokens = 100 + i`,
`output_tokens = 40 + ((i * 7) % 60)`, `prompt_count = 1 + (i % 3)`,
`source_id = "seed-" + tool + "-" + i + "-" + j` (unique per `UNIQUE(tool, source_id)`), and
`occurred_at_utc = day_local + "T04:00:00Z"` — local noon in `Asia/Singapore`, so the seeded `day_local`
is unambiguous against the importer's conversion.

**UTC-instant rule for the seeded `import_run` (amended 2026-11-28 — do not regress):** `asOfDate` comes
from rule 3, `toDayLocal(finished_at, 'Asia/Singapore')` = fixed UTC+8 with no DST, so any `finished_at` at
or after `16:00Z` lands on the **next** Singapore day and breaks every `asOfDate`/default-range pin. Both
`SEED_STARTED_AT` and `SEED_FINISHED_AT` therefore sit late on `SEED_TO_DAY` in UTC (23:00 / 23:30 SGT, i.e.
`15:00Z` / `15:30Z`), `started_at < finished_at`, and both convert to `2026-11-27`. Any new seeded instant
must satisfy `toDayLocal(instant) === SEED_TO_DAY` — assert that in `tests/activitySeed.test.ts` rather
than trusting the literal.

Notes for the implementer: rows go in through `upsertUsageEvents(db, events)` with camelCase `UsageEvent`
objects (import `UsageEvent` from `../../src/import/types`); `import_run` rows are **not** written by that
helper, so the seeder inserts them with its own `INSERT INTO import_run (started_at, finished_at, status,
events_seen, events_written, error)` statement. `runs: 'success'` writes the success row described above;
`'failed-only'` / `'running-only'` / `'none'` write no successful run. `withMarker` (default true) adds the
`-MK-activity-content-7c41d9e3` suffix to every `source_id`, **plus** one `status='failed'` `import_run`
row whose `error` column contains the marker (it must never surface — AC-7), and for `'running-only'` also
one `status='running'` row with a `started_at` **newer than `SEED_STARTED_AT`** and `finished_at = NULL` (must be ignored by the
freshness query). Reuse `NORMALISED_DESCRIPTOR_A` and `MODEL_FALLBACK` from the existing
`fixtures/opencodeDb.ts` / `src/import/modelNormalise.ts` instead of retyping their strings, so the
normalised-name and fallback values stay single-sourced.

## Files likely touched

New (source):
- `backend/src/activity/timeRange.ts` — pure validation + calendar-month arithmetic + range resolution
- `backend/src/activity/activityErrors.ts` — frozen 400/500 bodies and constant log lines
- `backend/src/activity/activityRepository.ts` — the only DB connection + the two SELECTs
- `backend/src/activity/activityService.ts` — orchestration, metadata/rows assembly, empty/500 mapping
- `backend/src/activity/activityRouter.ts` — express router (`createActivityRouter(options)`, default export)

Changed (source, additive only):
- `backend/src/index.ts` — `import activityRouter from './activity/activityRouter';` and
  `app.use('/activity', activityRouter);` placed **after** the three legacy mounts; nothing else changes
- `backend/jest.config.js` — extend `collectCoverageFrom` with `'src/activity/**/*.ts'` and add
  `./src/activity/timeRange.ts` / `./src/activity/activityService.ts` thresholds (lines: 80)

New (tests):
- `backend/tests/fixtures/activitySeed.ts`
- `backend/tests/activityTimeRange.test.ts`
- `backend/tests/activitySeed.test.ts`
- `backend/tests/activityRepository.test.ts`
- `backend/tests/activityService.test.ts`
- `backend/tests/activityApi.test.ts`
- `backend/tests/activityReadOnly.test.ts`
- `backend/tests/activityMount.test.ts`
- `backend/tests/activityApi.timing.test.ts`

Never touched: `backend/src/db.ts`, `backend/src/routes/*`, `backend/src/import/**`,
`backend/tests/fixtures/{opencodeDb,events,DummyAdapter}.ts`, every pre-existing `*.test.ts`,
`package.json`, `tsconfig.json`.

## Tasks

Ordered; every task ends green before the next starts. Commands run from `backend/`.

1. [x] **Baseline.** `git fetch --prune && git switch -c agent/us-4-activity-api origin/main`
   (main may be checked out elsewhere — plain `git switch main` can fail in a worktree);
   `npm install --no-audit --no-fund` if `node_modules` is missing; `npm test` and `npx tsc --noEmit`.
   Record the pass counts in the Progress log. Verify: suite green at baseline, `git status --short` empty.
   → (setup for all ACs)
2. [x] `backend/src/activity/timeRange.ts` — `ACTIVITY_TIME_ZONE`, `DEFAULT_RANGE_MONTHS = 12`, `Ymd`,
   `isValidYmd`, `addMonths` (month-end clamping, `RangeError` on bad input), `resolveRange` per
   design §Design (blank-vs-invalid, defaults, `from > to`, `asOfDate: null`). Imports nothing; no clock.
   Then `backend/tests/activityTimeRange.test.ts`: `isValidYmd` table (valid pair, `2026-02-30`,
   `2026-13-01`, `2026-1-5`, `''`, `' 2026-11-05'`, `'2026-11-05T00:00:00Z'`, `'20260101'`, `null`,
   `undefined`, `20261105`, `[]`, `['a','b']`, `{}`); `addMonths` (`-12` over a leap day, over
   month-ends, `+12` round trip, `RangeError` cases); `resolveRange` truth table (both, neither, each
   single-sided, both empty strings, arrays, `from > to`, `asOfDate: null`), asserting the echoed
   `range` object. Verify: `npx jest activityTimeRange` green; `npx tsc --noEmit` exit 0.
   → AC-4, AC-6 (unit half)
3. [x] `backend/tests/fixtures/activitySeed.ts` exactly as the Fixture plan, plus
   `backend/tests/activitySeed.test.ts` asserting the facts themselves: `days: 300` yields
   `distinctDays >= 300`, `>= 300` rows, `distinctTools.length === 2`, `distinctModels.length === 3`,
   `distinctTaskTypes.length === 3`, every `day_local` matches `^\d{4}-\d{2}-\d{2}$`, no `model` value
   contains `{` or `}` (US-23 guard), `runs:'success'` writes one `import_run` success row with
   `finished_at = SEED_FINISHED_AT`, `withMarker` puts the marker in `source_id` and in a failed run's
   `error`, `createEmptyActivityDb` creates both tables with 0 rows. Verify:
   `npx jest activitySeed` green. → AC-2, AC-3, AC-7, AC-8 (fixture foundation)
4. [x] `backend/src/activity/activityRepository.ts`: `ACTIVITY_READ_OPTIONS`, `LAST_SUCCESS_RUN_SQL`,
   `GROUPED_ROWS_SQL`, `openActivityView(dbPath?)` (a thin call of the reused
   `openActivityDb({ path, ...ACTIVITY_READ_OPTIONS })`, no `try/catch`, no `PRAGMA`),
   `selectLastSuccessfulRun(db)`, `selectGroupedRows(db, range)`. Then
   `backend/tests/activityRepository.test.ts` over `seedActivityDb`: the freshness query returns
   `SEED_FINISHED_AT` and ignores `running`/`failed` rows; grouped rows for a 7-day window equal
   `facts.expectedRows(...)` deep-equal **including order** (`day_local, tool, model, task_type`
   ascending); a range with no data returns `[]`. Verify: `npx jest activityRepository` green;
   `npx tsc --noEmit` exit 0. → AC-2 (query half)
5. [x] AC-5 enforcement — `backend/tests/activityReadOnly.test.ts`:
   (a) `ACTIVITY_READ_OPTIONS` deep-equals `{ readonly: true }`;
   (b) `const db = openActivityView(path)` → `expect(db.readonly).toBe(true)`;
   (c) through that same connection `INSERT INTO usage_event ...`, `UPDATE usage_event ...`,
       `DELETE FROM usage_event` and `CREATE TABLE zz (x)` each throw matching `/readonly/i`
       (`SQLITE_READONLY` — "attempt to write a readonly database"), and `usage_event`'s row count is
       unchanged afterwards. **Do NOT assert that `initActivitySchema(db)` or `PRAGMA journal_mode`
       throws**: probe-verified that both silently **no-op** on a read-only connection, because every
       statement in `ACTIVITY_SCHEMA_DDL` is `IF NOT EXISTS` on objects that already exist, so SQLite
       attempts no write. AC-5's "never creates, migrates or writes schema" is therefore proven by (c) for
       real DDL **and** by the source scan in (g) for `initActivitySchema`. Assert the useful half: calling
       `initActivitySchema(db)` through the route's connection leaves the file byte-identical.
   (d) `jest.spyOn(require('../src/import/activityDb'), 'openActivityDb')` (ts-jest compiles named
       imports to property access, so the spy intercepts) around a supertest `GET /activity` →
       called with `expect.objectContaining({ readonly: true })` and never with `readonly: false`/absent;
   (e) **writer coexistence**: open a writable connection, `BEGIN IMMEDIATE` + insert a row (leave it
       uncommitted, then `ROLLBACK`), and while it is open serve `GET /activity` → `200` with the
       pre-transaction rows (open the read-only view *after* the writer, so SQLite has already created
       `-shm`);
   (f) file bytes, **numbers only**: `fs.readFileSync(dbPath)` byte-identical before and after the 20
       served requests; `activity.db-wal` **absent or 0 bytes**; `activity.db-shm` **absent or exactly
       32768 bytes**. Do **not** assert that a read-only open creates no `-wal`/`-shm`: probe-confirmed on
       better-sqlite3 13.1.1 / SQLite 3.54.1 that a `{ readonly: true }` open of a WAL database in a
       writable directory creates `<db>-wal` (0 bytes) and `<db>-shm` (32 KiB wal-index) and leaves them
       there after `close()`, because a read-only connection can neither checkpoint nor delete them — and
       every seeded/production `activity.db` is WAL, since the importer's writable `openActivityDb` always
       sets `journal_mode = WAL` (a side effect the API must not undo, and must not "fix" by opening
       read-write). The load-bearing assertions are therefore (i) the main db file is byte-identical,
       (ii) `-wal` is absent-or-zero-bytes (no WAL growth), (iii) `-shm` is absent-or-exactly-32768 bytes,
       and (iv) every write attempt in (c) is rejected. Assert sizes with `fs.statSync(...).size` and skip
       the check for a file that does not exist.
   (g) source scan (US-23's pattern-grep precedent): every `backend/src/activity/*.ts` contains no
       `INSERT|UPDATE|DELETE|CREATE TABLE|DROP |ALTER |PRAGMA|initActivitySchema|__dirname` and no
       `from 'better-sqlite3'` value import (type-only import allowed), and `SELECT` appears only inside
       the two exported SQL constants.
   Verify: `npx jest activityReadOnly` green. → AC-5 (all of it), AC-3 (no-writes half)
6. [x] `backend/src/activity/activityService.ts` + `backend/src/activity/activityService.test.ts`:
   `getActivity(query, {dbPath})` returns `{status:200}` with the eight metadata keys and sorted
   `taskTypes`/`models`/`tools` derived from the served rows only; `{status:400,
   body: INVALID_ACTIVITY_RANGE_BODY}` (same object identity, `toBe`) for each invalid input;
   `{status:200, rows: []}` for a range with no usage and for `createEmptyActivityDb`; `lastUpdated`
   `null` + `asOfDate` from `MAX(day_local)` when only `failed`/`running` runs exist; `200` empty dataset
   + exactly one `console.warn` of the frozen constant when `dbPath` points at a missing file; two
   identical calls deep-equal byte-for-byte (`JSON.stringify` equality).
   Verify: `npx jest activityService` green. → AC-1, AC-2, AC-3, AC-4, AC-6 (service half)
7. [x] `backend/src/activity/activityRouter.ts` (`createActivityRouter(options)`, `router.get('/', ...)`,
   default export `createActivityRouter()`) + `backend/tests/activityApi.test.ts` — the contract suite,
   composed the way `index.ts` composes it (`const app = express(); app.use('/activity',
   createActivityRouter({ dbPath }))`), one `it` per criterion:
   - **AC-1**: `GET /activity` (no params) → `200`,
     `res.headers['content-type']` matches `/application\/json/`, `metadata.timeZone === 'Asia/Singapore'`,
     `typeof asOfDate === 'string'` + `^\d{4}-\d{2}-\d{2}$`, `lastUpdated === SEED_FINISHED_AT`,
     `taskTypes`/`models`/`tools` are arrays equal to the seeded distinct sets, `Array.isArray(rows)`.
   - **AC-2**: `GET /activity?from=<d-6>&to=<d>` → `rows` deep-equals `facts.expectedRows(from, to)`
     (computed in the test from the seed facts, not hand-copied); every `day_local` inside the range; no
     duplicate `(day_local, tool, model, task_type)` key; the three sums equal the fixture totals.
   - **AC-3**: (i) a range with no usage → `200`, metadata key set complete (`Object.keys` equal to the
     allow-list), `rows: []`, `from`/`to` echo the request; (ii) `createEmptyActivityDb` → `200`, all keys
     present, `asOfDate`/`lastUpdated` `null`, `rows: []`; (iii) `ACTIVITY_DB_PATH` unset and a missing
     file → `200` (never 500) with the complete key set.
   - **AC-4**: one request per invalid input — `?from=not-a-date`, `?from=2026-1-5`, `?to=2026-02-30`,
     `?to=2026-13-01`, `?from=20261105`, `?from=2026-11-05T00:00:00Z`, `?to=2026-11-28&from=2026-11-01`
     reversed pair (`?from=2026-11-28&to=2026-11-01`), `?from=a&from=b` (express gives an **array** —
     probe-verified) — each → `400` deep-equal to `INVALID_ACTIVITY_RANGE_BODY` (assert `toEqual` **and**
     that the JSON text equals the frozen constant's `JSON.stringify`, byte-identical across all cases).
     Marker check: request `?from=${SEED_MARKER}-invalid&to=${SEED_MARKER}-also-invalid` and assert the
     marker is absent from the body text, from a `jest.spyOn` capture over `console.log|warn|error|info`
     and from a `process.stdout.write` spy, and that `usage_event`'s row count is unchanged.
     Do **not** assert `400` for `?from[0]=x`: express 5's default `simple` query parser keeps the key as
     the literal `from[0]`, so `req.query.from` is `undefined` → unknown-param → ignored → `200`
     (probe-verified). Add it as one `200`-with-defaults case instead.
   - **AC-6**: seed 400 days (so some rows sit outside the window) → default request's
     `metadata.to === facts.asOfDate`, `metadata.from === addMonths(asOfDate, -12)`
     (== `SEED_FROM_DAY` for the seed), a row **exactly on** `from` is present and a row one day earlier
     is absent, and no `day_local` is outside `[from, to]`.
   - **AC-7**: end-to-end marker scan — `writeOpencodeFixture({ dir, marker: SEED_MARKER })` +
     `runImport({adapters:[new OpenCodeAdapter({sourceDbPath})], activityDbPath, window})` (real import,
     marker-bearing prompt text dropped by the adapter), then `GET /activity` full range → the marker is
     absent from `JSON.stringify(res.body)`, from the console/stdout captures and from `res.text`;
     plus the key allow-list: `Object.keys(body)` = `['metadata','rows']` (order-insensitive), metadata
     keys = the 8, every row's keys = the 7, and `JSON.stringify` contains none of
     `source_id`, `occurred_at_utc`, `events_seen`, `events_written`, `"error"`.
   Verify: `npx jest activityApi` green; then `npm test` (everything green, no pre-existing assertion
   removed — `git diff origin/main -- backend/tests | grep -c '^-[^-]'` is 0). → AC-1, AC-2, AC-3, AC-4, AC-6, AC-7
 8. [ ] Wire the app: add the `activityRouter` import + `app.use('/activity', activityRouter)` to
    `backend/src/index.ts` after the legacy mounts (keep `/health`, `cors()`, `express.json()`, the three
    legacy mounts and `app.listen` byte-identical). Then `backend/tests/activityMount.test.ts`
    (structural: it reads source text and never imports `src/index.ts`, which would call `listen` and open
    the legacy portfolio DB): (a) `src/index.ts` contains `app.use('/activity'` and still contains
    `'/static-data'`, `'/entity'`, `'/chat'` and `'/health'`; (b) no file under `src/activity/` contains
    `__dirname`, `from '../db'`, `require('../db')`, or a value import from `better-sqlite3` (a
    type-only import is allowed); (c) behavioural half: an app that mounts `createActivityRouter({ dbPath })`
    at `/activity` **and** a legacy router at `/entity` answers `GET /activity` with `200` and still answers
    `GET /entity/<id>` from the legacy table, i.e. the new mount neither intercepts nor breaks the legacy
    routes.
    Verify: `npx jest activityMount activityApi` green; `npx tsc --noEmit` exit 0. → AC-1 (composed route
    half), AC-5 (never disturbs legacy routes)
9. [ ] `backend/tests/activityApi.timing.test.ts` (AC-8), with `jest.setTimeout(120_000)`:
   `seedActivityDb({ dbPath, days: 320, rowsPerDay: 2 })` (assert facts first: `>= 300` rows,
   `>= 300` days, 3 models, 3 task types, 2 tools — the gate must not pass on a thin DB); build the
   composed app once; warm up with 5 discarded full-range requests; then
   (a) `AC8_REQUESTS = 20` sequential awaited full-range `GET /activity?from=..&to=..` requests, each
   asserted `200` (AC-8's literal requirement);
   (b) `P95_REQUESTS = 100` further sequential requests, each `200`, timed with `process.hrtime.bigint()`
   around the awaited request; assert `samples[94] < 300` ms (p95 over 100 — 20 outliers tolerated, so the
   assertion is not flaky; probe baseline is ~0.3 ms of work per request);
   (c) `expect(rows.length).toBeGreaterThanOrEqual(300)` from the same response body;
   (d) print ONE `console.log('activity:timing rows=N requests=120 median_ms=.. p95_ms=.. max_ms=..')`
   line containing **numbers only**. Median/max are reported, not asserted (a max-based gate is the flake
   source the story Notes warn about). Then run the file **twice**: `npx jest activityApi.timing` twice,
   both runs green; paste both outputs into the Progress log (sprint-2 exit gate).
   Verify: two consecutive green runs of `npx jest activityApi.timing`, then `npm test` green. → AC-8
10. [ ] `backend/jest.config.js`: add `'src/activity/**/*.ts'` to `collectCoverageFrom` and thresholds
    `{ lines: 80 }` for `./src/activity/timeRange.ts` and `./src/activity/activityService.ts`.
    Verify: `npm test` green (thresholds only bite under `npm test -- --coverage`; run that once and paste
    the two percentages into the Progress log). → supporting (NFR-2 guard coverage)
11. [ ] Payload/resource measurement (numbers only) inside the timing test or a sibling check: assert the
    full-range response JSON is < 512 KiB for the 640-row seed
    (`Buffer.byteLength(res.text)`) and log `rows` + `bytes`. Then the **host-side** measurement the
    container cannot make — **Manual (user)**, owner runs on the host after merge:
    `ACTIVITY_DB_PATH=$HOME/scratch-activity.db PORT=3101 npm --prefix backend run start` then
    `curl -s -o /dev/null -w '%{http_code} %{time_total}s %{size_download}B\n' "http://127.0.0.1:3101/activity"`
    (report status, seconds and bytes only). No architecture NFR budget is tracked in this repo (backlog
    Assumptions), so nothing is asserted against a numeric budget beyond AC-8's stand-in.
    Verify: automated byte assertion green; host command listed verbatim in the PR body → AC-8 (support),
    AC-9 (support)
12. [ ] Privacy/safety sweep before PR: `git diff --name-only origin/main...HEAD` lists exactly the files
    in "Files likely touched"; for each added line grep the vendor/model vocabulary
    (`anthropic|openai|claude|gpt|gemini|llama|deepseek|kimi|moonshot|qwen|mistral`) and any brace-bearing
    model string, and grep every test/fixture/source file for the markers to confirm they appear only as
    `MK-activity-*` bait and never in a served value. Paste counts into the Progress log. Manual (review):
    read the diff against the alias note at the top of `docs/product/backlog.md`.
    Verify: command output pasted; no matches on added lines. → AC-7 (committed-data half)
13. [ ] AC-9 handoff (owner's host — the container cannot see the host's tool DBs). Put this recipe
    verbatim in the PR body and tick only when the owner reports the numbers back at the sprint exit:
    ```sh
    # 1) real import into a scratch activity.db (host paths)
    ACTIVITY_DB_PATH=$HOME/scratch-activity.db npm --prefix backend run --silent import:usage -- \
      --tool opencode --db <host path to opencode.db> --window-days 7 --now <YYYY-MM-DDTHH:MM:SSZ>
    # keep the printed line: events_seen=.. events_written=.. days=..
    # 2) start the API against that scratch db (npm start runs dist/, so build once first)
    npm --prefix backend run build
    ACTIVITY_DB_PATH=$HOME/scratch-activity.db PORT=3101 npm --prefix backend run start
    # 3) ask for the last 7 days and sum the numbers (replace the dates with the 7 Singapore days printed)
    curl -s "http://127.0.0.1:3101/activity?from=<YYYY-MM-DD>&to=<YYYY-MM-DD>" | node -e \
      'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const b=JSON.parse(s);
       const t=b.rows.reduce((a,r)=>({i:a.i+r.input_tokens,o:a.o+r.output_tokens,p:a.p+r.prompt_count}),
       {i:0,o:0,p:0});console.log("http=200 rows="+b.rows.length,"input="+t.i,"output="+t.o,"prompts="+t.p)})'
    # 4) also check the no-parameter call
    curl -s -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:3101/activity"
    ```
    Compare **numbers only**: `GET` must return `200`; the summed `input`/`output`/`prompts` over the 7
    days must equal the importer summary run taken over the same 7-day window (`events_written` equal to
    the seeded event count, and the API's prompt/token sums matching a fresh `sqlite3 -readonly` sum of
    the same columns); `metadata.lastUpdated` equals the newest run's `finished_at`. Report counts, never
    values, and never paste the owner's DB path into a file.
    Verify: **Manual (user)** — owner reports the numbers at the sprint-2 exit. → AC-9

## Test plan

| Level | File | Mocked | Serves |
|---|---|---|---|
| Unit (pure) | `tests/activityTimeRange.test.ts` | nothing | AC-4, AC-6 |
| Fixture self-test | `tests/activitySeed.test.ts` | nothing | AC-2, AC-3, AC-7, AC-8 foundations |
| Component (real SQLite) | `tests/activityRepository.test.ts` | nothing | AC-2 |
| Service (real SQLite, no express) | `tests/activityService.test.ts` | `console` spies | AC-1, AC-2, AC-3, AC-4, AC-6 |
| Contract (supertest over the composed router) | `tests/activityApi.test.ts` | `console` + `process.stdout.write` spies | AC-1, AC-2, AC-3, AC-4, AC-6, AC-7 |
| Read-only enforcement | `tests/activityReadOnly.test.ts` | `jest.spyOn` on `openActivityDb` | AC-5 |
| Structural | `tests/activityMount.test.ts` + scans inside `activityReadOnly.test.ts` | reads source text | AC-1, AC-5, AC-7 |
| Timing | `tests/activityApi.timing.test.ts` (run twice) | nothing | AC-8 |
| Manual (user) | task 13 recipe, owner's host | n/a | AC-9 |

AC → tasks: AC-1 → 5, 6, 7, 8 · AC-2 → 3, 4, 6, 7 · AC-3 → 3, 5, 6, 7 · AC-4 → 2, 6, 7 ·
AC-5 → 5 (+ scans in 8) · AC-6 → 2, 6, 7 · AC-7 → 3, 7, 12 · AC-8 → 3, 9, 11 · AC-9 → 13
(**Manual (user)**). Every criterion is served by at least one task.

Exit-gate extras (sprint-2): `npm test` green including this story's contract tests; the timing test green
in **two** consecutive runs; the owner's NFR-2 confirmation (their gate, not a test); no real names,
hostnames, accounts, tokens or marker text in code/tests/fixtures/commits.

## Assumptions

- The requirements/architecture/ADR files are untracked by owner direction (backlog Assumptions), so no CMP
  ID or ADR text is linked; the story's modules live inside the existing API component (`backend/src/`) and
  add no component, data store or dependency. Precedent: the US-23 spec.
- The published contract is `?from=&to=`, so empty-string bounds are treated as absent, not invalid.
- AC-6's "12 months before" means calendar-month arithmetic with month-end clamping, inclusive on both
  ends (365–367 days), per design §Design; AC-6's test pins inclusivity with a boundary row on `from` and
  one absent row one day earlier.
- `asOfDate` = the `Asia/Singapore` day of the newest successful `import_run.finished_at`;
  `lastUpdated` = that string verbatim. Chosen by the tech lead within AC-1/AC-3 per the story Notes
  ("derive from `import_run`, not wall-clock time").
- Freshness lists (`taskTypes`, `models`, `tools`) are the distinct values **present in the served range**,
  derived from the returned rows and sorted ascending (JS default string order) — not the
  `config/task-rules.json` catalogue.
- A missing/unopenable `activity.db` is served as the empty dataset (`200`), never a 500, per AC-3's
  "never a 500" and the launch state (logs go back ~1 month, the DB may not exist yet). A 500 exists only
  for an unexpected failure during a query.
- `SEED_MARKER`, `fixture-tool-*`, `fixture-model-*`, `example-provider/example-model-a`, `unknown` and the
  `config/task-rules.json` task-type names are all invented/generated — no real data anywhere.
- AC-9's "equal the importer summary counts" is operationalised as the task-13 numeric recipe (sums of
  `input_tokens`, `output_tokens`, `prompt_count` over the same 7 Singapore days, plus `lastUpdated`).
- Node 22 + better-sqlite3 13 are already installed; no new dependency is added.

## Risks

- **Silent empty heatmap**: mapping an unopenable DB to a `200` empty payload can mask a mis-set
  `ACTIVITY_DB_PATH`. Mitigation: the frozen `console.warn` line per request, AC-3's test asserting
  `lastUpdated === null`, and AC-9's owner check. Alternative (500) was rejected because AC-3 forbids it.
- **WAL `-shm`**: a read-only open can fail with `SQLITE_READONLY_CANTINIT` if a hot `-wal` exists and the
  process may not create `-shm`. Tests open the read-only view after the writer opened the DB (the normal
  state — `runImport` checkpoints and closes). If the owner's run hits it, that is a US-13/`openActivityDb`
  defect to report, **not** something to work around by opening read-write.
- **Timing flakiness** on a shared container: mitigated by warm-up, p95 over 100 samples (~100× headroom
  vs the 0.3 ms measured work), numbers-only reporting, and the two-run requirement. If a run fails on
  contention, re-run and record both outputs — do not lower the 300 ms constant (the owner owns that
  number).
- **AC-4 over-looseness**: a single fixed 400 message gives clients no field detail. Accepted because
  AC-4 pins "a constant code and message" and any per-field echo would need its own NFR-5 proof.
- **US-5 collision**: hardening will wrap this router. Keep `createActivityRouter(options)` as the only
  public entry; do not inline middleware into `src/index.ts` beyond the single mount.
- **Schema drift**: adding a covering index later means editing `ACTIVITY_SCHEMA_DDL` (US-2's file) and its
  allow-list test — out of scope here, tracked as a design risk.

## Deviations from architecture

none observable (see Assumptions: the architecture file is untracked). No new component, inter-component
dependency, data store or deployment change; the schema is unchanged. Two items are recorded for the
architect/owner instead: the untracked-architecture citation gap, and the WAL `-shm` guarantee, which
belongs to US-13's volume/run-ordering decision.

## Branch name

`agent/us-4-activity-api`

## Progress log

- 2026-11-28 **Task 1 (Baseline)**: `git fetch --prune && git switch -c agent/us-4-activity-api
  origin/main` (from 157b9d9, US-23 merge). `backend/node_modules` present — no install needed.
  `npm test` → **18 suites passed, 175 tests passed**; `npx tsc --noEmit` → exit 0.
  `git status --short` shows only the untracked spec + design files, which are committed with this task.
- 2026-11-28 **Task 2 (timeRange)**: created `src/activity/timeRange.ts` (pure: `ACTIVITY_TIME_ZONE`,
  `DEFAULT_RANGE_MONTHS`, `isValidYmd`, `isBlankActivityParam`, `addMonths`, `resolveRange`) +
  `tests/activityTimeRange.test.ts`. `npx jest activityTimeRange` → **44 passed**;
  `npx tsc --noEmit` → exit 0. Note: `{to}` only with `asOfDate: null` resolves via
  `addMonths(to, -12)` (per design "no explicit pair **usable**"), pinned as an `ok` case.
- 2026-11-28 **Task 3 (fixture seeder)**: created `tests/fixtures/activitySeed.ts` (deterministic,
  writes via `initActivitySchema` + `upsertUsageEvents`, marker bait in `source_id` and a failed
  `import_run.error`, `createEmptyActivityDb`) + `tests/activitySeed.test.ts`.
  `npx jest activitySeed` → **12 passed**.
- 2026-11-28 **Task 4 (repository)**: created `src/activity/activityRepository.ts`
  (`ACTIVITY_READ_OPTIONS`, `LAST_SUCCESS_RUN_SQL`, `GROUPED_ROWS_SQL`,
  `openActivityView`, `selectLastSuccessfulRun`, `selectGroupedRows`, plus
  `selectMaxDayLocal` which derives the AC-3 anchor through `GROUPED_ROWS_SQL`
  over a full-domain range — the module keeps exactly two statements, per the
  task-5(g) SELECT-only scan) + `tests/activityRepository.test.ts`.
  `npx jest activityRepository` → **8 passed**; `npx tsc --noEmit` → exit 0.
- 2026-11-28 **Task 5 (read-only enforcement) — BLOCKED on a factual error in the spec.**
  `src/activity/activityErrors.ts`, `activityService.ts`, `activityRouter.ts` and
  `tests/activityReadOnly.test.ts` are written; `npx jest activityReadOnly` → **22 passed,
  1 failed**. The only failing assertion is the parenthetical in task 5(f): "no `-wal`/`-shm`
  created by the reader". Reproduced without the app: with better-sqlite3 13.1.1 (SQLite 3.54.1),
  a `{readonly: true}` open of a **checkpointed WAL** database *creates* `<db>-wal` (0 bytes) and
  `<db>-shm` (32 KiB wal-index) in a writable directory, and they persist after close because a
  read-only connection cannot checkpoint or remove them. (The design's probe-verified claim holds
  only for a non-WAL database; the importer — and the mandated seeder path through
  `openActivityDb` writable — always sets WAL, so every seeded/production `activity.db` is WAL.)
  The main db file is byte-identical before/after 20 served requests, and WAL growth is zero
  (`-wal` is 0 bytes) — the spec's own Postconditions wording "no writes, no schema change, no
  WAL growth" does hold. Task 5(f) as literally written is unsatisfiable by any implementation
  that keeps the mandated `openActivityDb({readonly: true})` open. **Not deviating**: task 5 file
  left uncommitted; tasks 6-13 not started. Proposed fix for the tech lead: assert (i) main-db
  bytes identical, (ii) `-wal` absent-or-zero-bytes and (iii) `-shm` absent-or-exactly-32-KiB
  wal-index (numbers only), plus keep the task-5(g) source scan as the no-schema-touch proof.
  Branch-state note: task 2's two files were initially left out of the tasks-3-4 commit and were
  added in a follow-up commit; the pushed branch is verified green without the task-5 file:
  `npx jest --testPathIgnorePatterns activityReadOnly` → **21 suites / 239 tests passed**.
- 2026-11-28 **RULING on the task 5(f) block (tech lead): finding ACCEPTED, assertion amended.**
  Independently reproduced on better-sqlite3 13.1.1 / SQLite 3.54.1 with `-wal`/`-shm` removed first: a
  `{ readonly: true }` open plus `close()` leaves `<db>-wal` = 0 bytes and `<db>-shm` = 32768 bytes behind,
  because a read-only connection can neither checkpoint nor delete the WAL sidecar files, and the importer's
  writable `openActivityDb` always sets WAL — so "no `-wal`/`-shm` created by the reader" is unsatisfiable by
  any compliant implementation. Task 5(f) now asserts numbers only: main db bytes byte-identical, `-wal`
  absent-or-0-bytes (no WAL growth), `-shm` absent-or-exactly-32768 bytes; the load-bearing no-write proof
  stays task 5(c)'s rejected write/DDL attempts plus the 5(g) source scan. The spec's own
  "Probe-verified runtime facts" bullet and the design's Security bullet (which claimed a read-only open
  leaves no `-wal`/`-shm`) are corrected to match; the Use-case Postconditions wording ("byte-identical …
  no WAL growth") already held and is unchanged. No requirement, ADR, NFR or architecture item is affected
  and nothing else in the spec changes. Resume from task 5 with the amended assertion.
- 2026-11-28 **Task 5 (read-only enforcement) — resumed under the ruling**: committed
  `src/activity/activityErrors.ts`, `activityService.ts`, `activityRouter.ts` and
  `tests/activityReadOnly.test.ts` — (a) open-mode constant, (b) `db.readonly`, (c) rejected
  INSERT/UPDATE/DELETE/CREATE + `initActivitySchema` byte-identity, (d) `openActivityDb` spy
  called with `readonly: true` on every request, (e) writer coexistence via `BEGIN IMMEDIATE` +
  ROLLBACK, (f) amended numbers-only sidecar assertions, (g) source scan of `src/activity/*.ts`.
  `npx jest activityReadOnly` → **23 passed**.
- 2026-11-28 **Task 6 (service tests) — BLOCKED on a second spec-internal contradiction.**
  The Fixture plan pins `SEED_FINISHED_AT = '2026-11-27T16:30:00.000Z'`, but rule 3 (and AC-1's
  own wording) derive `asOfDate = toDayLocal(finished_at, 'Asia/Singapore')` via
  `src/import/dayLocal.ts`, and 16:30Z is **2026-11-28 00:30** in Singapore (verified with
  Node's Intl, and by `npx jest activityService` → 17 passed / 2 failed: `asOfDate` served as
  `2026-11-28`). The spec's Normative-shape example pairs `asOfDate: "2026-11-27"` with
  `lastUpdated: "2026-11-27T16:30:00.000Z"` — unsatisfiable together. It cascades into task 7:
  AC-6 asserts `metadata.to === facts.asOfDate` (`SEED_TO_DAY = 2026-11-27`) and
  `metadata.from === SEED_FROM_DAY` with a boundary row exactly on `from`, but under 16:30Z the
  applied default range becomes `[2025-11-28, 2026-11-28]` and every one of those assertions
  fails. No compliant implementation can pass both the freshness rule and these constants.
  **Not deviating.** Proposed fix (one line in the Fixture plan):
  `SEED_FINISHED_AT = '2026-11-27T15:30:00.000Z'` (= 23:30 SGT on `SEED_TO_DAY`;
  `toDayLocal` verified → `2026-11-27`), plus the seeder's success-run `started_at` moved to
  `'2026-11-27T15:00:00.000Z'` (currently 16:00Z, which would post-date the finished_at).
  `tests/activityService.test.ts` is written to the spec's stated expectations and left
  uncommitted (red) pending the ruling.

- 2026-11-28 **RULING on the task 6 / Fixture-plan block (tech lead): finding ACCEPTED, constant amended.**
  Independently verified with `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' })` — the same
  formatter `src/import/dayLocal.ts` uses: `2026-11-27T16:30:00.000Z` → **`2026-11-28`** (00:30 SGT), while
  `2026-11-27T15:30:00.000Z` → **`2026-11-27`** (23:30 SGT). The pinned constant contradicted rule 3 / AC-1 and
  the Normative-shape example, and cascaded into task 7's AC-6 pins (`to`, `from`, the boundary row).
  `SEED_FINISHED_AT` is now `'2026-11-27T15:30:00.000Z'`; the implementer's chosen success-run `started_at` is
  pinned as `SEED_STARTED_AT = '2026-11-27T15:00:00.000Z'` (precedes `finished_at`, same Singapore day; the
  `'running-only'` row's `started_at` is now specified as newer than it), and a **UTC-instant rule** plus an
  `activitySeed.test.ts` assertion stop the drift returning. **Sweep of the other pinned constants: clean** —
  `SEED_TO_DAY`/`SEED_FROM_DAY` (`addMonths('2026-11-27', -12)` = `2025-11-27` ✓), the seeded
  `occurred_at_utc = day_local + "T04:00:00Z"` (= 12:00 SGT the same day ✓), tasks 3/4/7 which reference the
  constants rather than literals, the AC-4 invalid value `'2026-11-05T00:00:00Z'` (rejected as a string, never
  converted), and the design document, which pairs no literal instant with an `asOfDate`. No requirement, ADR,
  NFR or architecture item is affected; nothing else in either file changed. Resume from task 6.
- 2026-11-28 **RULING #2 applied + Task 6 (service tests) complete**: seeder now uses the
  spec-pinned `SEED_STARTED_AT = '2026-11-27T15:00:00.000Z'` /
  `SEED_FINISHED_AT = '2026-11-27T15:30:00.000Z'`; the marker failed-run and the extra
  `running-only` row were pulled onto the same Singapore day (`15:10Z` finished, extra running
  `started_at` = `SEED_RUNNING_STARTED_AT` = `2026-11-27T15:45:00.000Z`, newer than
  `SEED_STARTED_AT`); `tests/activitySeed.test.ts` asserts the UTC-instant rule via the real
  `toDayLocal` for every seeded `import_run` instant in all four run modes.
  `npx jest activitySeed` → 13 passed; `activityRepository` → 8 passed;
  `npx jest activityService` → **19 passed**; `activityReadOnly` → 23 passed;
  `npx tsc --noEmit` → exit 0.
