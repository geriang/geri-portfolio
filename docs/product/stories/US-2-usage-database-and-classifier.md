# US-2: Usage database and importer core

Status: approved

## Story
As a site owner, I want a dedicated usage database with a shared adapter interface and a rules-based task classifier, so that every AI tool's usage is recorded the same way and a new tool needs only an adapter.

## Requirements
FR: FR-12, FR-13, FR-14. NFR: NFR-5, NFR-10, NFR-11. ADR: ADR-3, ADR-4. BR: BR-1, BR-4, BR-5, BR-6.

## Acceptance criteria
- AC-1: Given the backend package, when the schema is created, then `activity.db` contains `usage_event` (id, tool, source_id, occurred_at_utc, day_local, input_tokens, output_tokens, prompt_count, model, task_type) with a unique key on (tool, source_id), and `import_run` (id, started_at, finished_at, status in running/success/failed, events_seen, events_written, error), matching the architecture's data model. (Verified by: Jest schema test against the created file via `PRAGMA table_info` / `sqlite_master`.)
- AC-2: Given the created schema, when the column allow-list test runs, then no column other than `import_run.error` can hold free text and every column name is on the allow-list of dates, token counts, prompt counts, model names, task types and tool names. (Verified by: Jest test comparing the schema against the allow-list, per NFR-5.)
- AC-3: Given a task type rules config (versioned file with the BR-6 candidate list plus "Uncategorised") and fixture event metadata, when the classifier runs, then the first matching rule assigns the task type and an event matching no rule is assigned "Uncategorised". (Verified by: Jest classifier tests covering match, first-match-wins and fallback.)
- AC-4: Given a config edit that renames a task type or reorders rules, when the classifier runs with no code change, then classifications follow the edited config. (Verified by: Jest test loading a second fixture config; per NFR-10.)
- AC-5: Given events timestamped 23:59:59 and 00:00:00 `Asia/Singapore`, including one whose UTC date differs from the local date, when the day conversion runs, then each event's `day_local` is the correct `Asia/Singapore` calendar day. (Verified by: Jest boundary tests, per NFR-11.)
- AC-6: Given the adapter interface, when a second sample adapter is added in tests, then a new tool is supported with one new adapter file and no schema change. (Verified by: Jest test using a dummy second adapter; per NFR-10.)
- AC-7: Given the new modules, when `npm test -- --coverage` runs in `backend/`, then line coverage of the classifier and day-conversion modules built by this story is at least 80% (the importer and adapter modules are gated by US-3/AC-9; the client-side aggregation module arrives with US-6). (Verified by: Jest coverage report in CI, per NFR-10.)

## Out of scope
- Reading any real tool's data (US-3, US-17, US-18).
- The `GET /activity` endpoint (US-4) and the import CLI wiring (US-3).
- One-off reclassify command (US-15) and backups (US-21).

## Dependencies
none.

## Design needed
yes: introduces the database schema, the adapter interface and the classifier config format — new components per ADR-3/ADR-4 that US-3 and US-17/US-18 will build against.

## Branch name
agent/us-2-usage-database-and-classifier

## Notes
Lives in `backend/` alongside the existing Express code; new `activity.db` path from `ACTIVITY_DB_PATH` (do not reuse the `portfolio.db` `__dirname` path logic — the architecture flags it). WAL mode; the API will open read-only later. The rules config is a versioned file in the backend package with the BR-6 candidate list: Coding/implementation, Debugging/fixing, Planning/design, Research/questions, Writing/documentation, Review/testing, plus "Uncategorised" always last. Tests use generated fixture data only.

## Type
backend

## UX needed
no: no screens are added or changed.
