# US-3: opencode adapter and import run

Status: draft

## Story
As a site owner, I want an importer that reads opencode's message-level rows and upserts them into the usage database, so that my real AI activity is recorded on demand today — and daily once US-14's schedule lands — without ever storing prompt content.

## Requirements
FR: FR-12, FR-15, FR-17. NFR: NFR-3, NFR-5, NFR-7, NFR-10, NFR-11, NFR-12, NFR-14. ADR: ADR-3, ADR-6 (proposed). BR: BR-1, BR-4.

## Acceptance criteria
- AC-1: Given a generated fixture `opencode.db` with assistant and user `session_message` rows and a session crossing local midnight, when `npm run import:usage -- --tool opencode --db <fixture>` runs, then message-level `usage_event` rows are written with correct tool, source_id, timestamps, `day_local`, tokens, model and task type, the midnight-crossing session is split across the two correct days, and prompt count equals the number of user messages. (Verified by: Jest/Supertest-style importer tests over generated fixtures.)
- AC-2: Given fixture logs whose `text` fields contain unique marker strings, when an import completes, then no marker string appears anywhere in `activity.db` or in the events the adapter yields. (Verified by: Jest test scanning the database file bytes and adapter output for the markers, per NFR-5.)
- AC-3: Given a completed import, when the same import is run twice, or a second run's window overlaps the first, then the row count and all totals change by 0. (Verified by: Jest test running the import twice and with overlapping windows, per NFR-7/FR-17.)
- AC-4: Given any run, when it finishes, then an `import_run` row records started_at, finished_at, status, events_seen and events_written, and a run with an injected failure mid-way leaves 0 partial rows, status `failed` and non-empty error text containing no source content. (Verified by: Jest test injecting a failure after N events, per NFR-12.)
- AC-5: Given a failed run, when the next daily run starts, then its sliding window (last 7 days) re-reads and recovers the missed events. (Verified by: Jest test: fail, then succeed, totals equal the full fixture, per NFR-12.)
- AC-6: Given the CLI, when it exits, then the exit code is 0 on success and non-zero on failure, stdout is a one-line summary of counts and dates only, and reading a live source database happens only through a copy (or SQLite backup API) — the source file is never opened read-write. (Verified by: Jest test capturing exit code and stdout; review that the adapter opens only a copied file, per ADR-3/ADR-6.)
- AC-7: Given a daily run against a fixture the size of the owner's real opencode database, when it is timed, then it finishes within 1 minute and temporary disk use stays under 2 GB. (Verified by: timing script on the largest available fixture; on the owner's real database: Manual (user).)
- AC-8: Given a fixture in which a second sample tool's events are present alongside opencode's, when both adapters run in one import, then rows from both tools coexist in `usage_event`, share one schema, and the per-day figures combine across tools without interference. (Verified by: Jest test running the opencode adapter plus US-2's dummy adapter over the same fixture, per FR-15.)
- AC-9: Given the new importer and adapter modules, when `npm test -- --coverage` runs in `backend/`, then line coverage of the importer and opencode adapter modules is at least 80%. (Verified by: Jest coverage report in CI, per NFR-10.)

## Out of scope
- The `GET /activity` API (US-4), Docker packaging (US-13) and the cron schedule (US-14).
- Hermes agent and Open WebUI adapters (US-17/US-18).
- Backfill beyond the sliding window and the explicit reclassify command (US-15).
- Real imports from the owner's live `opencode.db` (owner runs the command after merge; verified via AC-7 manual step).

## Dependencies
US-2 must be merged first (schema, adapter interface, classifier).

## Design needed
yes: first real adapter plus the import CLI and windowing/upsert logic — new pattern the other adapters will copy.

## Branch name
agent/us-3-opencode-adapter-import

## Notes
Follows the architecture's inspected opencode structure: message-level `session_message` rows of type assistant/user (not session totals, so midnight-crossing sessions split correctly), user messages carry agent and model metadata, sessions carry directory/agent/model; the `text` fields hold prompt content and must be dropped inside the adapter (AC-2). Where no stable source id exists, the adapter derives one (e.g. hash of tool, timestamp, token counts) and documents the merge limit (ADR-3). Classification uses agent name and project directory as metadata only; raw project names are never stored. Copy the source database with its `-wal` file before reading (ADR-6). Add the `import:usage` npm script in `backend/`. Tests use generated fixtures with marker text, never real logs.

## Type
backend

## UX needed
no: no screens are added or changed.
