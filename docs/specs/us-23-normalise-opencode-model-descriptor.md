# Spec: US-23 — Normalise the opencode model descriptor

Status: draft

## Goal

US-23: store a short, stable normalised model name (never a raw JSON descriptor) in `usage_event.model` for every opencode message, keeping plain strings unchanged, falling back safely on unusable descriptors, and correcting already-imported raw-JSON rows through the existing upsert.

## Design

none (story "Design needed: no"). The normalisation algorithm, interfaces and test strategy are specified inline below. The story explicitly permits a small shared helper module; this spec adds one — `backend/src/import/modelNormalise.ts` — a pure, dependency-free function module inside the existing importer module, reusable by the future US-17/US-18 adapters. It is not a new component and changes no architecture item (the architecture/requirements files are not tracked in this repository; per the approved backlog Assumptions of 2026-11-26/27 the backlog is the working source of truth, and it carries no Components/CMP table to cite).

## Problem analysis

- `backend/src/import/adapters/opencodeAdapter.ts` `mapRow` picks the model as
  `nonEmpty(data.model) ?? nonEmpty(row.sessionModel)` and stores the string verbatim.
- The real opencode database stores `session_message.data.model` (and `session_v2.model`) as a **raw JSON descriptor** — an object with `id` and `providerID`, delivered inside the `data` JSON either as a JSON *string* or as a nested parsed *object*. The first real US-3 import produced 13 distinct raw-JSON `usage_event.model` values (up to 78 chars) for a much smaller set of models (shape report only — no real values recorded, none committed).
- Consequences today: nothing reads `model` yet, but US-4 must group by model (ADR-3/FR-8); grouping raw JSON would multiply the `models` metadata and break FR-8/BR-5.
- Two latent defects in the current pick:
  1. `nonEmpty` accepts only strings, so a **parsed-object** `data.model` is silently skipped in favour of the session column — wrong precedence for the real shape.
  2. Any descriptor string passes through unnormalised.
- Re-import correction is safe: derived source ids hash tool|session|type|instant|tokens (model excluded), so the existing `ON CONFLICT(tool, source_id) DO UPDATE SET ... model = excluded.model` in `activityDb.upsertUsageEvents` rewrites `model` with 0 change to row counts and totals (FR-17, ADR-3).
- Fail-fast on a **missing/empty** model (US-3) is kept unchanged; a descriptor is *present but unusable* → fallback instead, so one bad row cannot stop an import. Fallback rows are counted and the count (a number only) may appear in the CLI summary line — the only allowed signal.

## Normalisation algorithm (precise rules)

New module `backend/src/import/modelNormalise.ts` — pure, imports nothing, never throws, never logs:

```ts
export const MODEL_FALLBACK = 'unknown';

export type ModelSource = 'plain' | 'descriptor' | 'fallback';

export interface ModelNormalisation {
  /** Value stored in usage_event.model. */
  model: string;
  source: ModelSource;
}

export function normaliseModel(value: unknown): ModelNormalisation;
```

Rules, evaluated in order:

- **R1 — parsed object**: `typeof value === 'object' && value !== null && !Array.isArray(value)` → apply **D** to it.
- **R2 — string**: `t = value.trim()`.
  - **R2a**: `t` starts with `{` → `JSON.parse(t)` inside `try/catch`:
    - parse throws → **fallback**;
    - parses to a non-null, non-array object → apply **D** to the parse result;
    - parses to any other value (null, array, number, boolean, string) → **fallback** — defensive branch: by the JSON grammar a text whose trimmed form starts with `{` can only parse to an object or throw, so this sub-case is unreachable through `mapRow`; it keeps `normaliseModel` total and licenses no change to R2b's plain-string rule.
  - **R2b**: `t` does not start with `{` → `{ model: value, source: 'plain' }` — the **original string, not trimmed** (AC-2 "that string unchanged").
- **R3 — any other value** (number, boolean, array, null, undefined) → **fallback**. (`mapRow` cannot pass these — see candidate rule C1 — but the function is total for its future users.)
- **D — descriptor handling** of a parse-result/object `o`:
  - `id = o['id']`; if `id` is not a string or `id.trim() === ''` → **fallback**.
  - `providerID = o['providerID']`; it counts as present iff it is a string with non-empty `trim()`.
  - providerID present → `{ model: providerID.trim() + '/' + id.trim(), source: 'descriptor' }`;
    providerID absent **or present-but-not-a-string** (number/object/null/bool — treated as absent, documented) → `{ model: id.trim(), source: 'descriptor' }`.
  - Extra fields are ignored; key order is irrelevant (property lookup, plain `JSON.parse`, no reviver) → AC-1's "differ only in key order or extra fields produce the same stored value".
- **fallback** := `{ model: MODEL_FALLBACK, source: 'fallback' }`. `MODEL_FALLBACK = 'unknown'` is the chosen fixed safe constant (the story Notes' suggested example; US-4 does not pin a different one; it becomes a visible `models` value in US-4's metadata, accepted per the sprint-2 risk note).

`mapRow` candidate selection (replaces the current `nonEmpty(data.model) ?? nonEmpty(row.sessionModel)`):

- **C1**: `present(v)` := `v` is a non-null object (not an array) **or** a string with `v.trim() !== ''`.
  `candidate = present(data.model) ? data.model : (present(row.sessionModel) ? row.sessionModel : undefined)`.
- **C2**: `candidate === undefined` → throw the **existing, unchanged** `OpenCodeAdapterError('message <id>: no model on the message or its session_v2 row')` — the US-3 fail-fast on missing/empty model is not changed.
- **C3**: `model = normaliseModel(candidate).model`.
- String behaviour is identical to the old `nonEmpty` chain; the only behavioural changes are: objects now count as present (fixes latent defect 1) and descriptor strings are normalised.

Fallback counting (the story Notes' "count fallback rows"; number-only signal):

- `OpenCodeAdapter` gains `modelFallbackCount: number` (also declare `implements`-compatible optional property), **reset to 0 at the start of each `readEvents` call**, incremented once per yielded record whose `model === MODEL_FALLBACK`.
- `ImportRunSummary` gains `modelFallbacks?: number` — after the pull loop, `runImport` sums `(adapter as { modelFallbackCount?: number }).modelFallbackCount ?? 0` over its adapters (success runs only).
- `cli.ts summaryLine` appends ` model_fallbacks=N` **only when the run succeeded and N > 0**. With the base fixture (no fallback rows) the stdout line stays byte-identical to the current `SUCCESS_LINE`, so every existing CLI assertion is untouched.

## Safety constraints (hard requirements on this implementation)

1. **Invented values only** in every committed file, test and commit message: descriptor constants are provider `example-provider` and ids `example-model-a` / `example-model-b`; nothing resembling a real model name, provider name, account, path or prompt text is added. Third-party tool names other than opencode are aliased as Agent-tool / Chat-tool (backlog header rule).
2. **No marker/descriptor leakage**: descriptor text (raw string, `id`, `providerID`, extra-field values, and the AC-3 marker embedded in the bad-descriptor fixtures) must never appear in `activity.db` (byte scan includes `-wal`/`-shm`), in `import_run.error`, in thrown error messages, or in captured log / stdout / stderr output.
3. **Diagnostic discipline**: no logging is added for model handling. `modelNormalise.ts` and the adapter's model path contain no `console.*`/`process.stdout` writes (a test greps the source). If any diagnostic text about a model value is ever produced it must carry only the value's type and string length (`string(len N)` / `object` / `null`, the existing `describeValue` shape) — never the value.
4. `normaliseModel` never throws (all parsing in `try/catch`) and never interpolates a source value into any message.
5. The fail-fast error for missing/empty model keeps its existing message (names the row id only).

## Scope

- Model normalisation in the opencode adapter's `mapRow` (message `data.model` and session `model` column), the shared `modelNormalise` helper, the fixture's model variants, tests, and the numeric fallback-count signal (adapter counter → `ImportRunSummary.modelFallbacks` → CLI suffix).

## Out of scope

- Task rules / `task_type` coverage, the classifier, rules config (story Out of scope).
- The Agent-tool / Chat-tool adapters (US-17/US-18) — they may reuse `normaliseModel` later; no change here.
- Any change to the API, to the `usage_event`/`import_run` **schema** (columns stay identical), or to `RawUsageRecord`/`UsageEvent` types.
- A one-off clean-up migration script (owner-confirmed resolved: re-import with a larger `--window-days` or rebuild the scratch db).
- Reading or opening the owner's real database inside the container.

## Acceptance criteria

(verbatim from `docs/product/stories/US-23-normalise-opencode-model-descriptor.md`)

- AC-1: Given a generated fixture message whose model is the JSON descriptor shape (an object with `id` and `providerID`, invented values, delivered as a JSON string), when it is imported, then `usage_event.model` is a short stable name of the form `<providerID>/<id>` with no JSON braces or quotes, and two descriptors for the same id and providerID that differ only in key order or extra fields produce the same stored value. The same holds when the model comes from the session's `model` column instead of the message data. (Verified by: Jest adapter and import tests over the generated fixture; FR-8, FR-12, BR-5.)
- AC-2: Given a message whose model is a plain string (the old shape), when it is imported, then `usage_event.model` is that string unchanged. (Verified by: Jest test; FR-12, BR-5.)
- AC-3: Given a descriptor that cannot be parsed, or parses but has no usable `id`, when it is imported, then the import still succeeds, `usage_event.model` holds a fixed safe fallback value, and any error or log text produced carries only the value's type and length, never the value itself. (Verified by: Jest test with a marker string inside the bad descriptor; the marker must not appear in `activity.db`, in `import_run.error`, in thrown error messages or in captured log or stdout output; NFR-5, FR-12.)
- AC-4: Given rows already imported with the raw JSON in `model`, when the import runs again over a window that includes their source messages, then each such row is updated to the normalised name through the existing upsert on (tool, source_id), the row count and all token and prompt totals change by 0, and only `model` changes. (Verified by: Jest test that seeds `activity.db` with raw-JSON rows, re-runs the import, and compares counts, totals and model values; FR-17, ADR-3.)
- AC-5: Given the generated test fixture, when the tests run, then the fixture includes the real descriptor shape with invented values (for example provider `example-provider`, id `example-model-a`) next to the existing plain-string case, and a repository scan of the changed files finds no real model name, provider name, prompt text or path. (Verified by: Jest tests using the updated fixture; review of the diff against the alias note at the top of the backlog; NFR-5, BR-5.)
- AC-6: Manual (user): Given the fix is merged and a fresh scratch import of the owner's real opencode database has been run, when a read-only query counts `usage_event` rows whose `model` contains `{` or `}`, then the count is 0. Report counts only (rows checked, distinct `model` values before and after, rows with braces), never the values. (FR-8, NFR-5.)

## Fixture plan (`backend/tests/fixtures/opencodeDb.ts`)

Existing tests hardcode exact counts (`events_seen=9`, `events_written=20_009`, the `$`-anchored CLI line regex, per-day totals). To keep **every existing test file byte-for-byte passing**, new model-shape rows live behind a new fixture option, mirroring the existing `messageCount` opt-in pattern:

- Option: `modelVariants?: boolean` (default `false`). When false, the builder writes exactly what it writes today.
- `HandcraftedRow['data']['model']` type widens to `string | Record<string, unknown>`.
- New exported invented constants (single source of truth — tests never retype literals):
  - `EXAMPLE_PROVIDER = 'example-provider'`, `EXAMPLE_MODEL_A = 'example-model-a'`, `EXAMPLE_MODEL_B = 'example-model-b'`
  - `NORMALISED_DESCRIPTOR_A = 'example-provider/example-model-a'`, `NORMALISED_B_ONLY_ID = 'example-model-b'`
  - builder helpers `descriptorStringA(keyOrder: 'idFirst' | 'providerFirst', extra?: Record<string, unknown>): string` and `badParseDescriptor(marker: string): string` / `badNoIdDescriptor(marker: string): string` (the marker is embedded inside the descriptor text, AC-3 bait).
- Variant session `ses_desc` (agent `build`, `directory: FIXTURE_DIRECTORY`) with `session_v2.model` = a JSON **string** descriptor `{"providerID":"example-provider","id":"example-model-a"}`.
- Variant messages (explicit ids, distinct instants/tokens so no derived-id collision; all inside `CANONICAL_WINDOW`; text composed from `marker` as today):
  | id | type | data.model | expected stored model |
  |---|---|---|---|
  | `desc-str-a1` | assistant | string `{"id":"example-model-a","providerID":"example-provider","extra":"x1","tier":"free"}` | `NORMALISED_DESCRIPTOR_A` |
  | `desc-str-a2` | assistant | string `{"providerID":"example-provider","id":"example-model-a"}` (same pair, key order differs, no extra fields) | `NORMALISED_DESCRIPTOR_A` (== a1) |
  | `desc-obj-a3` | assistant | nested parsed object `{ providerID: 'example-provider', id: 'example-model-a' }` | `NORMALISED_DESCRIPTOR_A` |
  | `desc-b-no-provider` | assistant | string `{"id":"example-model-b"}` | `NORMALISED_B_ONLY_ID` |
  | `desc-bad-parse` | assistant | `badParseDescriptor(marker)` — starts with `{`, unparseable | `MODEL_FALLBACK` |
  | `desc-bad-noid` | assistant | `badNoIdDescriptor(marker)` — valid JSON, empty `id` | `MODEL_FALLBACK` |
  | `desc-user-1` | user | none (model falls back to `ses_desc.model`, the session-column descriptor) | `NORMALISED_DESCRIPTOR_A` |
- Exported `MODEL_VARIANT_COUNTS = { sessions: 1, messages: 7, events: 7 }` (all in-window, no twins) and `OpencodeFixtureInfo.modelVariantMessages: number` so tests assert against facts.

## Files likely touched

- `backend/src/import/modelNormalise.ts` — **new** (pure helper)
- `backend/src/import/adapters/opencodeAdapter.ts` — `mapRow` model path, `modelFallbackCount`
- `backend/src/import/runImport.ts` — `ImportRunSummary.modelFallbacks`
- `backend/src/import/cli.ts` — conditional ` model_fallbacks=N` suffix
- `backend/tests/modelNormalise.test.ts` — **new**
- `backend/tests/opencodeAdapter.test.ts` — new descriptor describe (existing describes unchanged)
- `backend/tests/runImport.test.ts` — new US-23 describe (existing describes unchanged)
- `backend/tests/cli.test.ts` — new fallback-suffix test (existing lines unchanged)
- `backend/tests/fixtures/opencodeDb.ts` — `modelVariants` option + variant rows/constants

No changes to: `activityDb.ts` schema/DDL, `types.ts`, `adapter.ts` (`ToolAdapter` stays structurally unchanged — the counter is an optional structural property), `normalize.ts`, classifier, API, frontend.

## Tasks

Ordered; run from `backend/` (`npm test` = `jest`). Every task keeps the whole suite green before the next starts.

1. [x] Create `backend/src/import/modelNormalise.ts` exactly as specified above (rules R1–R3, D, `MODEL_FALLBACK = 'unknown'`), and `backend/tests/modelNormalise.test.ts` with a unit table: descriptor string (both key orders + extra fields → same value), nested object, `providerID` missing → id alone, `providerID` non-string → id alone, id empty/missing/non-string → fallback, unparseable `{...` → fallback (incl. exactly the string `'{'`), non-object JSON **values** passed directly (array `[1,2]`, number, boolean, `null`, `undefined`) → fallback (that is the R3 row), the strings `'[1,2]'` and `'null'` → **plain, stored unchanged** (R2b — only `{`-leading trimmed text is descriptor-gated, per the approved story Notes), plain string (incl. leading/trailing spaces and a string *containing* `{` not at trimmed position 0) → unchanged. Assert the function never throws and the module source contains no `console.`/`process.stdout`.
   Verify: `npx jest modelNormalise` green; `npx tsc --noEmit`. → AC-1, AC-2, AC-3 (unit half)
2. [x] Update `mapRow` in `opencodeAdapter.ts`: candidate rules C1–C3 via `normaliseModel`; keep the missing-model error message unchanged; add `modelFallbackCount` (reset per `readEvents`, counts `model === MODEL_FALLBACK`); update the module doc comment (descriptor vs plain vs fallback, why fallback-not-fail-fast, the reserved-`unknown` conflation note). In `backend/tests/opencodeAdapter.test.ts` add a describe calling `mapRow` directly for: descriptor string → `example-provider/example-model-a`; nested object → same; key-order/extra-field equality pair; session-column path (`data` without model + `sessionModel` = descriptor string) → normalised; object `data.model` **not shadowed** by a plain `sessionModel` (defect 1 regression test); plain string unchanged; bad descriptor → `unknown` and **no throw** with the marker absent from any still-thrown sibling errors (e.g. bad tokens + marker-bearing model → message has `string(len` only). Fixture stays OFF here (pure `mapRow` units).
   Verify: `npx jest opencodeAdapter` green, all pre-existing tests in the file unchanged. → AC-1, AC-2, AC-3 (adapter half)
3. [x] Extend `backend/tests/fixtures/opencodeDb.ts` per the Fixture plan (option default off; variant rows written only when `modelVariants: true`; new exports).
   Verify: full `npm test` green with **no edit to any existing test assertion** (the flag default preserves every count), plus a new inclusion test: `writeOpencodeFixture({ modelVariants: true })` adds exactly `MODEL_VARIANT_COUNTS` sessions/messages, every variant `data` contains the marker bait, and the raw descriptor strings are physically present (`data LIKE '%example-provider%'`). → AC-5 (fixture half), AC-1 (fixture)
4. [x] In `backend/tests/opencodeAdapter.test.ts` add `readEvents` tests over the **variant** fixture: `byId('desc-str-a1'/'desc-str-a2'/'desc-obj-a3')` all `=== NORMALISED_DESCRIPTOR_A` (two distinct records), `desc-b-no-provider` → `NORMALISED_B_ONLY_ID`, `desc-user-1` (session-column descriptor) → `NORMALISED_DESCRIPTOR_A`, `desc-bad-parse`/`desc-bad-noid` → `MODEL_FALLBACK`, no record's `model` contains `{`/`}` or `"`, `adapter.modelFallbackCount === 2` after a run (and resets on re-run), and `adapter.readEvents(...)` does not throw.
   Verify: `npx jest opencodeAdapter` green. → AC-1, AC-3 (adapter half), AC-5
5. [x] In `backend/tests/runImport.test.ts` add the import-database describe over the variant fixture:
   - **AC-1 db half**: after `runImport`, each variant row's `model` equals the table above (via `row(sourceId)`), and `SELECT COUNT(*) FROM usage_event WHERE model LIKE '%{%' OR model LIKE '%}%' OR model LIKE '%"%'` is 0.
   - **AC-2**: `row('mid-assistant').model === 'glm-4.6'` and `row('mid-user').model === 'glm-4.6'` (plain strings unchanged in the same variant run).
   - **AC-3**: run completes `success`; the two bad rows exist with `model = MODEL_FALLBACK`; `runImport` throws nothing; the AC-3 marker is absent from the raw bytes of `activity.db`, `-wal`, `-shm`, from every `import_run.error` (whose value is `null` on the successful run), and from a `jest.spyOn(console, ...)` capture; `adapter.modelFallbackCount === 2`.
   - **AC-4**: import once (variant fixture); `UPDATE usage_event SET model = ?` with the raw descriptor text for `desc-str-a1` (raw string form) and with a raw JSON bait for two plain rows (`mid-assistant`, `ask-assistant-1` — proving the plain-string path also self-corrects back to the unchanged plain name); snapshot **all rows with their `id` PK** + count + per-day `SUM(input_tokens)/SUM(output_tokens)/SUM(prompt_count)`; re-run `runImport` over the same `CANONICAL_WINDOW`; assert the snapshot is deep-equal except `model` (row `id`s unchanged → in-place `ON CONFLICT(tool, source_id) DO UPDATE`, no delete/insert), the corrected models equal `NORMALISED_DESCRIPTOR_A` / `glm-4.6` / `research-model-x`, count and all totals changed by 0, and the brace-count query is 0.
   - **AC-5 guard**: `SELECT DISTINCT model FROM usage_event WHERE tool = 'opencode'` over the variant run ⊆ the explicit invented allow-list `[glm-4.6, research-model-x, chat-model-y, NORMALISED_DESCRIPTOR_A, NORMALISED_B_ONLY_ID, MODEL_FALLBACK]`.
   Verify: `npx jest runImport` green, existing describes unchanged; then full `npm test`. → AC-1, AC-2, AC-3, AC-4, AC-5 (db halves)
6. [x] Wire the count signal: `ImportRunSummary.modelFallbacks` in `runImport.ts` (sum of adapters' `modelFallbackCount`, success runs only) and the conditional ` model_fallbacks=N` suffix in `cli.ts summaryLine` (success && N > 0). In `backend/tests/cli.test.ts` add: base-fixture in-process run still equals `SUCCESS_LINE` exactly (proves no regression); variant-fixture run's single stdout line ends ` model_fallbacks=2` and contains no marker (out **and** err); `adapter.modelFallbackCount`-based expected value is taken from the fixture facts, not a magic number.
   Verify: `npx jest cli runImport` green — including the pre-existing spawned-process test whose `$`-anchored line regex runs on the base fixture (fallback 0 → suffix absent); full `npm test`. → AC-3 (stdout half), Notes "count fallback rows"
7. [ ] Safety sweep (before PR): `git diff --name-only main...HEAD`; for each changed/added file grep for real vendor/model vocabulary (`anthropic|openai|claude|gpt|gemini|llama|deepseek|kimi|moonshot|qwen|mistral` and brace-bearing model strings) — expect no matches on lines this PR adds (pre-existing invented base-fixture names `glm-4.6` etc. are outside this PR's added lines and are not touched). Manual (review): read the diff against the alias note at the top of `docs/product/backlog.md`.
   Verify: command output pasted into the Progress log; review sign-off noted. → AC-5 (scan half)
8. [ ] AC-6 handoff note in the PR description (owner runs on the **host** — the container cannot see the host's opencode.db; no automated check):
   ```
   ACTIVITY_DB_PATH=$HOME/scratch-activity.db \
     npm --prefix backend run --silent import:usage -- \
     --tool opencode --db <host path to opencode.db> --window-days 400
   sqlite3 -readonly $HOME/scratch-activity.db "SELECT COUNT(*) FROM usage_event;"
   sqlite3 -readonly $HOME/scratch-activity.db "SELECT COUNT(DISTINCT model) FROM usage_event;"
   sqlite3 -readonly $HOME/scratch-activity.db \
     "SELECT COUNT(*) FROM usage_event WHERE model LIKE '%{%' OR model LIKE '%}%';"
   ```
   Report counts only (rows checked, distinct models before/after, rows with braces) — never values.
   Verify: **Manual (user)** — the owner's counts reported at the sprint exit (sprint-2 exit condition). → AC-6

## Test strategy summary

- **Unit**: `modelNormalise.test.ts` — pure functions, nothing mocked.
- **Adapter**: real `better-sqlite3` over the generated fixture (existing convention: nothing mocked), `mapRow`/`deriveSourceId` direct calls plus `readEvents` over `modelVariants: true`.
- **Import integration**: `runImport` over the variant fixture into scratch activity dbs (existing `freshActivityDbPath()` helper), raw-byte scans (existing AC-2 pattern).
- **CLI**: in-process `main(argv, io)` capture + one spawned `npm run --silent import:usage` (existing pattern).
- **AC mapping**: AC-1 → tasks 1, 2, 4, 5; AC-2 → 1, 2, 5; AC-3 → 1, 2, 4, 5, 6; AC-4 → 5; AC-5 → 3, 4, 5, 7; AC-6 → 8 (Manual (user)). Every criterion is served by ≥ 1 task; AC-6 is Manual (user) by story definition.
- **Resource check**: the story loads no models and adds 8 fixture rows + one JSON.parse per row; the existing 20k bulk perf test remains the guard. The architecture's NFR budget/Resource feasibility table is not tracked in this repo (backlog Assumption), and no budget applies to this delta; the only host-resource verification is AC-6, run by the owner with the commands named in task 8 (Manual (user)).

## Assumptions

- The requirements/architecture/ADR files are untracked by owner direction; the approved backlog (Assumptions row, 2026-11-26/27) is the working source of truth for FR/NFR/ADR content, so no CMP ID can be cited — the story lives in the existing importer module's opencode adapter.
- `MODEL_FALLBACK = 'unknown'` is agreed as the fixed constant (story Notes example; US-4 does not pin another; it becomes a visible US-4 `models` entry — accepted per the sprint-2 risk note).
- The real descriptor shape is `{"id": ..., "providerID": ...}` from the US-3 defect shape report (counts/shapes only, no committed sample). If the real nesting differs, AC-6's owner check catches it; a new story would then follow.
- AC-4's "seed rows with raw JSON" is simulated by `UPDATE ... SET model = <raw>` after a clean import — byte-equivalent to what pre-fix US-3 stored (raw pass-through of `nonEmpty` strings), since the old code cannot be re-run.
- A source model literally named `unknown` would be stored unchanged (AC-2) and counted as a fallback by the counter — an informational conflation only, documented in the adapter doc comment; no such value was observed.
- Descriptor rows are opt-in (`modelVariants: false` by default) so no existing test constant changes; US-4's own seeding can opt in later (that is US-4's design decision).

## Risks

- **Shape drift beyond the report** (e.g. id nested deeper): caught only by AC-6 on real data → follow-up story.
- **CLI line format**: the suffix changes stdout only when fallbacks occur; any downstream parser of the summary line (US-14's wrapper, not yet built) must treat the suffix as optional — noted for US-14.
- **Counter conflation** (see Assumptions) — informational signal only.
- If a future adapter passes a non-string candidate the fallback silently absorbs it; the numeric count is the only signal by design (story Notes forbid richer signals).

## Deviations from architecture

none observable (the architecture document is not tracked in this repository; the change adds no component, no data store, no component dependency and no schema change — only a helper module and one in-memory summary field inside the existing importer module).

## Branch name

`agent/us-23-normalise-opencode-model-descriptor`

## Deviations

- **BLOCKED (task 1, 2026-11-27): the task-1 unit table contradicts the spec's own normative algorithm and the approved story Notes.** Task 1 requires the unit table to contain non-object JSON `"[1,2]"`, `"null"` → fallback, but per rules R2a/R2b (and `docs/product/stories/US-23` Notes: "a string whose trimmed text starts with `{`" is the only JSON-handled form; "Anything else that is a non-empty string is a plain name and is stored unchanged (AC-2)") the strings `[1,2]` and `null` do not start with `{` and are therefore stored **plain, unchanged**. Empirical proof: implementing R1–R3/D exactly, `npx jest modelNormalise` fails with `expect(received).toEqual(expected)` → expected `{model:'unknown',source:'fallback'}`, received `{model:'[1,2]',source:'plain'}`. (The R2a parenthetical "parses to anything else (null, array, number, boolean, string) → fallback" is unreachable dead code under the `{`-gate — the same loose phrasing seems to be the source of the error.) Only `'"{'` in that group is a genuine fallback. Proposed resolution A (recommended): fix the task-1 table to test the real JSON non-object **values** `[1,2]` and `null` (already covered by the R3 row) plus the string `'{'`, and additionally pin the two string forms as plain-unchanged per R2b; the normative algorithm and implementation stay byte-identical. Proposed resolution B (rejected): widen the descriptor gate to any parseable JSON string — this contradicts the approved story Notes and AC-2 and would need story re-approval. **RULING (2026-11-27): Resolution A adopted by the tech lead — task 1's table was amended in place (R2a's non-object parse branch annotated as a defensive totality branch); `modelNormalise.ts` and the normative algorithm are unchanged. Resumed and task 1 completed.**

## Progress log

- 2026-11-27 (setup): environment prepared — `npm install --no-audit --no-fund` in `backend/` (node_modules was absent in the worktree), 573 packages, exit 0. Branch `agent/us-23-normalise-opencode-model-descriptor` created from origin/main (61c2b3a) via `git switch -c ... origin/main` (plain `git switch main` is impossible here: main is checked out at /workspace/gach).
- 2026-11-27 (task 1): implementation `backend/src/import/modelNormalise.ts` written exactly to the normative rules (R1–R3, D, `MODEL_FALLBACK = 'unknown'`, pure, never throws, never logs). Unit table test added; **14/15 pass; 1 fails on the spec's own contradiction** (see Deviations): `expect(normaliseModel('[1,2]')).toEqual({ model: MODEL_FALLBACK, source: 'fallback' })` → received `{ model: '[1,2]', source: 'plain' }` (`npx jest modelNormalise`, backend/). Task left unticked — BLOCKED, awaiting ruling; nothing committed yet.
- 2026-11-27 (task 1, resumed after ruling): ruling adopted Resolution A (tech lead amended task 1's table). Unit table updated per the amendment: fallback covers non-object JSON VALUES passed directly (array `[1,2]`, number, boolean, `null`, `undefined` — the R3 row) plus unparseable `{`-leading strings incl. exactly `'{'` (R2a); strings `'[1,2]'` and `'null'` pinned **plain, stored unchanged** (R2b). `modelNormalise.ts` untouched by the amendment (matches the normative rules byte-identically). Verify: `npx jest modelNormalise` → **15/15 passed**; `npx tsc --noEmit` → **exit 0**. Task ticked. Committed with the spec file (first commit).
- Baseline re-check before task 2: `npm test` excluding the new file → 17 suites / 136 tests passed (no pre-existing failure).
- 2026-11-27 (task 2): `mapRow` now picks the candidate via C1 (`presentModelValue`: non-null non-array object OR non-blank string), throws the existing unchanged missing-model error on `undefined` (C2), and stores `normaliseModel(candidate).model` (C3). `OpenCodeAdapter` gains `modelFallbackCount` (reset at each `readEvents` start, incremented once per deduped record with `model === MODEL_FALLBACK`); module doc comment extended (descriptor vs plain vs fallback, fallback-not-fail-fast rationale, reserved-`unknown` conflation note). New `mapRow` describe in `opencodeAdapter.test.ts` (9 tests, pure units, fixture OFF; uses local constants matching the task-3 fixture exports). Verify: `npx jest opencodeAdapter` → **30/30 passed**; `git diff` of the test file shows **no removed lines** (pre-existing assertions byte-for-byte unchanged); `npx tsc --noEmit` → exit 0; `npm test` → 18 suites / 160 passed. Task ticked.
- 2026-11-27 (task 3): `fixtures/opencodeDb.ts` extended per the Fixture plan — `modelVariants?: boolean` (default false: builder writes exactly what it wrote before), `HandcraftedRow['data']['model']` widened to `string | Record<string, unknown>`, exported invented constants (`EXAMPLE_PROVIDER`, `EXAMPLE_MODEL_A/B`, `NORMALISED_DESCRIPTOR_A`, `NORMALISED_B_ONLY_ID`), builder helpers (`descriptorStringA`, `badParseDescriptor`, `badNoIdDescriptor` — marker embedded inside the descriptor text), variant session `ses_desc` (session-column JSON-string descriptor) + the 7 variant messages of the fixture-plan table (all in-window, distinct instants/tokens), `MODEL_VARIANT_COUNTS = {sessions:1, messages:7, events:7}` and `OpencodeFixtureInfo.modelVariantMessages`. The task-2 mapRow describe now imports the fixture constants (single source of truth; only my own task-2 lines changed). New inclusion describe (2 tests: default-off adds nothing incl. zero `example-provider` text; opt-in adds exactly `MODEL_VARIANT_COUNTS`, every variant `data` carries the marker, raw descriptor strings physically present: 5 message rows + the session column). Verify: `npm test` → **18 suites / 162 passed**, `git diff origin/main` on the three pre-existing test files → **zero deleted lines** (assertions byte-for-byte unchanged), `npx tsc --noEmit` → exit 0. Task ticked. Commit b039132.
- 2026-11-27 (task 4): new `OpenCodeAdapter.readEvents model variants` describe in `opencodeAdapter.test.ts` over `writeOpencodeFixture({modelVariants:true})` (6 tests): desc-str-a1/a2/obj-a3 are three distinct records all === NORMALISED_DESCRIPTOR_A; desc-b-no-provider -> NORMALISED_B_ONLY_ID; desc-user-1 (session-column descriptor) -> NORMALISED_DESCRIPTOR_A; desc-bad-parse/desc-bad-noid -> MODEL_FALLBACK without stopping the read; no record's model contains `{`/`}`/`"` and no yielded field carries the marker; readEvents does not throw; `adapter.modelFallbackCount === 2` after a run and still 2 after a re-run (reset, not accumulate). Verify: `npx jest opencodeAdapter` -> **38 passed / 38** (21 pre-existing + 9 task-2 + 2 task-3 + 6 task-4; the 21 pre-existing assertions byte-for-byte unchanged — diff of the file has zero removed lines). Task ticked.
- 2026-11-27 (task 5): new US-23 describe in `runImport.test.ts` over the variant fixture (5 tests): AC-1 db half (every variant row's model equals the fixture-plan table via `rowModel`; brace/quote-count query 0); AC-2 db half (`mid-assistant`/`mid-user` keep `glm-4.6` unchanged in the variant run); AC-3 db half (run completes `success`, `runImport` throws nothing, the two bad rows store `MODEL_FALLBACK`, every `import_run.error` is `null`, the AC-3 marker is absent from the raw bytes of activity.db/-wal/-shm and from a `jest.spyOn` capture over console log/warn/error/info/debug, `adapter.modelFallbackCount === 2`); AC-4 (import once; `UPDATE usage_event SET model = ?` seeds raw descriptor text on `desc-str-a1` + raw JSON bait on `mid-assistant`/`ask-assistant-1` (bait present: brace-count 3); snapshot all rows with `id` PK + count + per-day `SUM(input_tokens)/SUM(output_tokens)/SUM(prompt_count)`; re-run over the same `CANONICAL_WINDOW`; snapshot deep-equal except `model`, `id` list identical -> in-place `ON CONFLICT(tool, source_id) DO UPDATE`, no delete/insert; corrected models = `NORMALISED_DESCRIPTOR_A`/`glm-4.6`/`research-model-x`; count and all totals changed by 0; brace-count 0); AC-5 guard (`SELECT DISTINCT model ... WHERE tool='opencode'` subset of the invented allow-list [glm-4.6, research-model-x, chat-model-y, NORMALISED_DESCRIPTOR_A, NORMALISED_B_ONLY_ID, MODEL_FALLBACK], with the three US-23 values present). Note: the raw-byte scan uses the AC-3 marker only (per AC-3's wording) — the invented provider string legitimately occurs in the *normalised* stored value and would be wrong to ban. Verify: `npx jest runImport` -> **19 passed / 19** (14 pre-existing describes byte-for-byte unchanged: `git diff origin/main` on the file shows zero removed lines); `npm test` -> 18 suites / **173 passed**; `npx tsc --noEmit` -> exit 0. Task ticked.
- 2026-11-27 (task 6): `ImportRunSummary.modelFallbacks?: number` added to `runImport.ts` — after the pull loop, sum of `(adapter as {modelFallbackCount?: number}).modelFallbackCount ?? 0` over the run's adapters, returned on success runs only; `cli.ts summaryLine` gained the optional param and appends ` model_fallbacks=N` only when `status==='success' && N>0` (base-fixture line stays byte-identical to `SUCCESS_LINE`). New `cli.test.ts` describe (2 tests): base-fixture in-process run still prints exactly `[SUCCESS_LINE]` with no `model_fallbacks` text; variant-fixture run prints ONE stdout line ending ` model_fallbacks=N` with N taken from a reference `OpenCodeAdapter`'s `modelFallbackCount` over `computeWindow(new Date(NOW_ISO))` (fixture facts, not a magic number; asserted > 0), and the marker is absent from out **and** err. Verify: `npx jest cli runImport` -> **32 passed / 32** (2 suites; includes the pre-existing spawned-process test whose `$`-anchored regex runs on the base fixture: fallback 0 -> suffix absent, unchanged); `git diff origin/main` on both test files -> zero removed lines; `npm test` -> 18 suites / **175 passed**; `npx tsc --noEmit` -> exit 0. Task ticked.
