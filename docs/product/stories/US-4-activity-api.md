# US-4: Read-only GET /activity API

Status: draft

## Story
As a visitor to the portfolio, I want a public read-only endpoint that serves the owner's usage dataset for a date range, so that the activity section on the home page can draw the heatmap without the browser ever touching the owner's databases.

## Requirements
FR: FR-2, FR-18, FR-20. BR: BR-1, BR-4. NFR: NFR-2, NFR-5. ADR: ADR-1, ADR-3, ADR-5.

## Acceptance criteria
- AC-1: Given `activity.db` seeded from the generated fixture, when a client sends `GET /activity` with no parameters, then the response is `200` with `application/json` and a metadata block containing at least: `timeZone` (the literal `Asia/Singapore`, BR-4), `asOfDate`, `lastUpdated` (the `finished_at` of the most recent successful `import_run`, FR-18), `taskTypes`, `models` and `tools` (distinct values present in the served range), plus a `rows` array. (Verified by: Jest + supertest contract test against the composed route; FR-2, FR-18, FR-20, BR-4.)
- AC-2: Given `?from=YYYY-MM-DD&to=YYYY-MM-DD` (inclusive, `Asia/Singapore` calendar days), when the request is served, then `rows` contains only `day_local` values inside the range, and each row is one group of `(day_local, tool, model, task_type)` with summed `input_tokens`, `output_tokens` and `prompt_count`, matching the seeded fixture values exactly. (Verified by: Jest + supertest test comparing against fixture totals computed in the test; FR-2, FR-20, ADR-3.)
- AC-3: Given a range with no usage at all, or an `activity.db` with no successful import yet, when the request is served, then the response is still `200` with the full metadata block and an empty `rows` array — never a 500 and never a missing metadata key. (Verified by: Jest + supertest test over an empty and an unimported database; FR-18, FR-20.)
- AC-4: Given `from` or `to` that is not a `YYYY-MM-DD` date, or `from` later than `to`, when the request is served, then the response is `400` with a fixed machine-readable error shape (a constant code and message), and no SQLite or driver error text, file path or source value appears in the body, captured logs or stdout. (Verified by: Jest + supertest tests for each invalid input, plus a marker-text check inside the invalid value; FR-2, NFR-5, BR-1.)
- AC-5: Given the API serves requests while a writer would hold the database, when the route queries `activity.db`, then it opens the database read-only via the existing `activityDb` open helper (`readonly: true`), issues only `SELECT` statements and never creates, migrates or writes schema — a test that attempts any write through the route's connection fails with a read-only error. (Verified by: Jest test asserting the open mode and a rejected write attempt; FR-18, ADR-1, ADR-3.)
- AC-6: Given the default range (no parameters), when the request is served, then `to` is the `asOfDate` and `from` is 12 months before it, so the payload covers a 12-month window, and the metadata echoes the applied range (`from` and `to` as actually served). (Verified by: Jest + supertest test seeding rows inside and outside the 12-month window; FR-2, FR-20.)
- AC-7: Given the seeded fixture contains marker strings standing in for prompt and response text, when any `GET /activity` request is served, then neither the response body nor any server-captured log or error text contains a marker, and the schema of the response contains no field carrying free text beyond the agreed `model`, `task_type`, `tool` and metadata values. (Verified by: Jest + supertest marker scan of response, logs and errors; NFR-5, BR-1.)
- AC-8: Given a seeded 12-month payload (at least 300 rows across at least 300 days, 3 models, 3 task types, 2 tools), when the test issues 20 sequential `GET /activity?` full-range requests in-process, then 20 return `200` and the 95th-percentile wall-clock latency is below 300 ms. (Verified by: Jest timing test run twice, both passing; NFR-2. The 300 ms figure is a planning stand-in — the requirements file is not in the repository, so the owner must confirm it against the NFR-2 wording; see Notes.)
- AC-9: Manual (user): Given the story is merged, when the owner runs the real importer into a scratch `activity.db` on their host and then starts the API against it, then `GET /activity` returns `200`, and the `rows` totals for the last 7 days equal the importer summary counts (numbers only). Report counts only, never values. (FR-2, FR-18, NFR-2.)

## Out of scope
- Public-surface hardening — method lock-down, CORS allowlist, helmet, rate limit, trust proxy, tunnel rule (US-5).
- Any frontend rendering, fetching or caching (US-6, US-11).
- Filtering by model, task type or tool via query parameters (US-10 provides client-side filters; the API serves the full grouped dataset).
- Earlier-period picker semantics beyond the fixed 12-month default (US-19).
- Compression, pagination or caching headers tuning.

## Dependencies
US-2 and US-23, both merged into main. US-6, US-5 and US-13 depend on this story.

## Design needed
yes: new API component — the read-model query layer, response shapes and route composition do not exist yet and must follow ADR-1 and ADR-5 without disturbing the legacy portfolio routes.

## Branch name
agent/us-4-activity-api

## Notes
- API contract is fixed by the backlog Assumptions (ADR-1, ADR-5): `GET {NEXT_PUBLIC_API_URL}/activity?from=&to=` returns the metadata block (time zone, as-of date, last-updated, task type list, models, tools) plus rows grouped by day, model, task type and tool with `input_tokens`, `output_tokens`, `prompt_count`; days without rows are absent and the client fills them (FR-3, US-6).
- Where it lives: new route module under `backend/src/` served by the express app in `backend/src/index.ts`; query code reads `activity.db` through the existing open helper in `backend/src/import/activityDb.ts` (`readonly: true` option already exists). The implementer must not reuse the legacy portfolio-database `__dirname` pattern from `backend/src/db.ts`.
- `models` in the metadata must contain the US-23-normalised names; if any value contains `{` or `}`, treat that as a defect of US-23 and report it, do not paper over it here.
- `asOfDate` and `lastUpdated` derive from `import_run` (most recent successful run), not wall-clock time, so repeat responses are stable; exact derivation is the tech lead's call within AC-1 and AC-3.
- NFR-2 numeric target: the requirements document is not tracked in this repository (see backlog Assumptions), so AC-8's 300 ms p95 is a planning stand-in chosen for the exit gate. The owner must confirm or replace it against the NFR-2 wording; the sprint exit condition treats confirmation, not the number, as the gate.
- Test data: generated fixtures only (`backend/tests/fixtures/` pattern); no real names, paths or content in fixtures, tests, logs or commits.

## Type
backend

## UX needed
no: no screens are added or changed; this story serves data only.
