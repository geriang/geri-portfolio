# Backlog: AI Usage Activity Heatmap

Status: approved

Note: third-party tool names other than opencode are aliased as Agent-tool and Chat-tool in this repository; the real names are kept in a git-ignored local file.

## Release goal
Deliver a public activity section on the portfolio home page that shows the site owner's AI usage as a GitHub-style heatmap — daily cells shaded by tokens or prompts, per-day details, totals, streaks, model and task-type splits — fed automatically once a day from the owner's tools, starting with opencode end to end, with no prompt or response content ever stored or shown.

## Backlog
| ID | Title | Description (one line) | Priority | Size | Requirements | NFR / ADR | Depends on | Design needed | Type | UX needed | Sprint | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| US-1 | Inspect Agent-tool and Chat-tool logs | Run `docker inspect` and read the schema of both tools' databases to learn what tokens, models and metadata they record, and settle the task type list. | Must | S | BR-1, BR-6, FR-13, FR-14 | ADR-4, ADR-6 | none | no | enabler | no | sprint-1 | ready |
| US-2 | Usage database and importer core | Create `activity.db` (`usage_event`, `import_run`), the adapter interface and the rule-based classifier with an "Uncategorised" fallback. | Must | M | FR-12, FR-13, FR-14 | BR-1, BR-4, BR-5, BR-6; NFR-5, NFR-10, NFR-11; ADR-3, ADR-4 | none | yes | backend | no | sprint-1 | ready |
| US-3 | opencode adapter and import run | Read opencode's message rows, drop prompt text, convert to `Asia/Singapore` days and upsert them idempotently with an `import_run` record. | Must | M | FR-12, FR-15, FR-17 | BR-1, BR-4; NFR-3, NFR-5, NFR-7, NFR-10, NFR-11, NFR-12, NFR-14; ADR-3, ADR-6 | US-2 | yes | backend | no | sprint-1 | ready |
| US-4 | Read-only `GET /activity` API | Serve the pre-grouped daily dataset for a range with metadata (time zone, as-of date, last updated) from `activity.db` opened read-only. | Must | M | FR-2, FR-18, FR-20 | BR-1; NFR-2, NFR-5; ADR-1, ADR-3, ADR-5 | US-2, US-23 | yes | backend | no | — | backlog |
| US-5 | Public surface hardening | Lock the activity route to `GET`/`OPTIONS` with a CORS allowlist, `helmet`, `trust proxy`, a 60/min rate limit and a tunnel rule that forwards only `/activity`. | Must | M | BR-2, BR-7 | NFR-6; ADR-2 | US-4 | yes | backend | no | — | backlog |
| US-6 | Activity section with heatmap below the hero | Add the client-side section under the hero that fetches after render and draws one shaded cell per day, filling empty days, at a reserved height. | Must | M | FR-1, FR-2, FR-3, FR-20 | NFR-1, NFR-8, NFR-9; ADR-1, ADR-5 | US-4 | yes | frontend | yes | — | backlog |
| US-7 | Day details on hover, tap and keyboard | Show a day's input tokens, output tokens, prompt count, models and task types as a preview and a pinned panel. | Must | S | FR-5 | BR-4; NFR-8, NFR-9; ADR-5 | US-6 | no | frontend | yes | — | backlog |
| US-8 | Totals and streaks | Show total input tokens, total output tokens and total prompts for the viewed period, plus the owner's current and longest streak. | Must | S | FR-6, FR-7 | NFR-9, NFR-11; ADR-5 | US-6 | no | frontend | yes | — | backlog |
| US-9 | Measure switch and model / task splits | Let a visitor switch shading between tokens and prompts and see how the period is split across model names and task types. | Must | M | FR-4, FR-8, FR-9 | BR-5, BR-6; NFR-1, NFR-9; ADR-4, ADR-5 | US-6 | yes | frontend | yes | — | backlog |
| US-10 | Filter by model and by task type | Filter the heatmap, day details, totals, streaks and splits by a single model or a single task type, combined with AND. | Should | M | FR-10, FR-11 | NFR-1, NFR-9; ADR-5 | US-9 | no | frontend | yes | — | backlog |
| US-11 | Offline fallback and empty states | Cache the last successful payload in `localStorage`, render it with an offline notice when the API fails, and show a friendly empty state when there is no data. | Must | M | FR-18, FR-19 | NFR-4; ADR-5 | US-6 | yes | frontend | yes | — | backlog |
| US-12 | Keyboard access and table alternative | Make every day and control operable by keyboard and expose the same data as a text table, with a legend that does not rely on colour. | Must | M | FR-2, FR-3, FR-5 | NFR-9; ADR-5 | US-6 | yes | frontend | yes | — | backlog |
| US-13 | Docker packaging for api and importer | Build one image with a long-running `api` and an on-demand `importer` service sharing a data volume, tool data read-only into the importer, non-root. | Must | M | FR-15, FR-16 | BR-7; NFR-6, NFR-14; ADR-6 | US-3, US-4 | yes | enabler | no | — | backlog |
| US-14 | Daily schedule and failure reporting | Have the Agent-tool run only a wrapper script that starts the importer shortly after midnight `Asia/Singapore` and reports its exit code and one-line summary. | Must | S | FR-16, FR-18 | BR-7, BR-8; NFR-3, NFR-12; ADR-3, ADR-6 | US-13 | no | enabler | no | — | backlog |
| US-15 | Backfill and reclassify commands | Add a first-run backfill over up to 12 months of history and an explicit one-off command to reclassify older records after a rules change. | Should | S | FR-13, FR-14 | NFR-3, NFR-10; ADR-3, ADR-4 | US-3 | no | backend | no | — | backlog |
| US-16 | Production tunnel hostname and build | Point the production build at the tunnel hostname, set the CORS allowlist to the real origins and prove the section works cross-origin. | Should | M | BR-2, BR-7 | NFR-1, NFR-6; ADR-2, ADR-5 | US-5, US-6 | no | enabler | no | — | backlog |
| US-17 | Agent-tool adapter | Add an adapter that reads the Agent-tool's SQLite data (per US-1 findings) into normalised events, dropping any prompt text. | Should | M | FR-12, FR-15, FR-17 | BR-1, BR-3; NFR-5, NFR-7, NFR-10, NFR-11; ADR-3, ADR-6 | US-1, US-2, US-3 | yes | backend | no | — | backlog |
| US-18 | Chat-tool adapter | Add an adapter that reads Chat-tool's SQLite data (per US-1 findings), tolerating missing token counts, dropping any prompt text. | Should | M | FR-12, FR-15, FR-17 | BR-1, BR-3; NFR-5, NFR-7, NFR-10, NFR-11; ADR-3, ADR-6 | US-1, US-2, US-3 | yes | backend | no | — | backlog |
| US-19 | Earlier-period picker | Let a visitor pick an earlier calendar period than the default 12 months, each period fetched and cached under its own key. | Could | M | FR-21 | BR-4; NFR-1, NFR-9; ADR-1, ADR-5 | US-6 | yes | frontend | yes | — | backlog |
| US-20 | Tool split, filter and detail line | Show which AI tool each usage came from as a split, a filter and a line in the day details. | Could | S | FR-22 | NFR-9; ADR-3, ADR-5 | US-6, US-9, US-10 | no | frontend | yes | — | backlog |
| US-21 | Backup copies of activity.db | Copy activity.db after each successful import outside the live volume, keep the last 7 copies, document the restore step. | Should | S | FR-12 | NFR-13; ADR-3, ADR-6 | US-13, US-14 | no | enabler | no | — | backlog |
| US-22 | Site-wide red accent | Switch the site green accent to red so the red heatmap does not sit inside a green site, per the approved UX direction (flows A-3, OQ-2). | Could | S | Quality expectation: fit the existing site look (flows A-3) | NFR-9 contrast recheck; ADR-5 | none | no | frontend | yes | — | backlog |
| US-23 | Normalise the opencode model descriptor | Turn the raw JSON model descriptor found in real opencode data into a short stable `provider/id` name, keep plain strings unchanged, fall back safely, and correct old rows through the existing upsert. Defect found by the first real US-3 import. | Must | S | FR-8, FR-12, FR-17 | BR-5; NFR-5; ADR-3 | US-3 (merged) | no | backend | no | — | backlog |

## Requirements coverage
| Requirement ID | Stories | Notes |
|---|---|---|
| FR-1 | US-6 | |
| FR-2 | US-4, US-6, US-12 | |
| FR-3 | US-6, US-12 | Client fills empty cells |
| FR-4 | US-9 | |
| FR-5 | US-7, US-12 | |
| FR-6 | US-8 | |
| FR-7 | US-8 | |
| FR-8 | US-9, US-23 | US-23 makes the stored model name usable (real opencode data held raw JSON) |
| FR-9 | US-9 | |
| FR-10 | US-10 | |
| FR-11 | US-10 | |
| FR-12 | US-2, US-3, US-17, US-18, US-21, US-23 | |
| FR-13 | US-1, US-2, US-15 | |
| FR-14 | US-1, US-2, US-15 | |
| FR-15 | US-3, US-13, US-17, US-18 | |
| FR-16 | US-13, US-14 | US-14 provides the automatic daily trigger; US-3 provides the import run |
| FR-17 | US-3, US-17, US-18, US-23 | US-23 re-imports corrected rows without double counting |
| FR-18 | US-4, US-11, US-14 | |
| FR-19 | US-11 | |
| FR-20 | US-4, US-6 | |
| FR-21 | US-19 | Could; owner deferred it past the Must set |
| FR-22 | US-20 | Could; owner deferred it past the Must set |
| BR-1 | US-1, US-2, US-3, US-4, US-17, US-18 | Allow-list tests in US-2/US-3 |
| BR-2 | US-5, US-16 | |
| BR-3 | US-17, US-18 | Only the owner's tools are read, by construction of the adapters; US-3 likewise reads only the owner's opencode data |
| BR-4 | US-2, US-3, US-7, US-19 | `Asia/Singapore` |
| BR-5 | US-2, US-9, US-23 | |
| BR-6 | US-1, US-2, US-9 | Final list confirmed by US-1; candidate list carried in US-2 config |
| BR-7 | US-5, US-13, US-14, US-16 | |
| BR-8 | US-14 | |
| NFR-1 | US-6, US-9, US-10, US-16, US-19 | Size report and Lighthouse delta |
| NFR-2 | US-4 | |
| NFR-3 | US-3, US-14, US-15 | |
| NFR-4 | US-11 | |
| NFR-5 | US-2, US-3, US-4, US-17, US-18, US-23 | US-3 marker-text test; US-23 keeps bad model values out of errors and logs |
| NFR-6 | US-5, US-13, US-16 | |
| NFR-7 | US-3, US-17, US-18 | |
| NFR-8 | US-6, US-7 | |
| NFR-9 | US-6, US-7, US-8, US-9, US-10, US-12, US-19, US-20, US-22 | |
| NFR-10 | US-2, US-3, US-15, US-17, US-18 | US-1 informs the module design but verifies no quality target itself |
| NFR-11 | US-2, US-3, US-8, US-17, US-18 | |
| NFR-12 | US-3, US-14 | |
| NFR-13 | US-21 | Destination still open (architecture open question) |
| NFR-14 | US-3, US-13 | |

No Must requirement, business rule or NFR is uncovered.

## Assumptions
- The user chose "opencode end to end" as the MVP: the first release is complete when opencode data flows to the public heatmap; the Agent-tool and Chat-tool adapters (US-17, US-18) are Should and follow in later sprints.
- The user chose to keep FR-21 (earlier periods) and FR-22 (tool name) as Could, scheduled after the Must set. The architecture records that the owner wants both in the first release; that conflict is listed under Open questions.
- The user chose thin vertical slices with backend and frontend in separate stories; frontend stories may be built against the API contract in their Notes until the backend story merges.
- ADR-6 (Docker deployment) is still `proposed`. Per the user's answer, US-13, US-14 and US-21 are planned against it, and it must be set to `accepted` by the owner before those stories start.
- The API contract is fixed by ADR-1 and ADR-5: `GET {NEXT_PUBLIC_API_URL}/activity?from=&to=` returns metadata (time zone, as-of date, last-updated, task type list, models, tools) plus rows grouped by day, model, task type and tool with input tokens, output tokens and prompt count; absent days are empty.
- Tests and demo data use generated fixtures only; no real personal data, prompts or logs are committed.
- The `Asia/Singapore` time zone (BR-4) and the initial BR-6 candidate task type list are taken as settled for planning; US-1 may revise the list.

## Risks
- US-1 may find that the Agent-tool or Chat-tool records no token counts or no task metadata; US-17/US-18 sizes and the task type list could then change, and many days may land under "Uncategorised".
- Prompt text could leak if an adapter drops text late; mitigated by the NFR-5 allow-list tests with marker text in US-2 and US-3.
- US-16 is blocked on the owner creating a Cloudflare domain; without it there is no production URL and the section cannot go live, though every other story can complete locally.
- A wrong `NEXT_PUBLIC_API_URL` or CORS origin hides the section in production only; US-16 carries a production-like check.
- Sparse early data (logs go back about 1 month) makes the 12-month grid mostly empty at launch; US-11's empty state and the UX copy carry this.
- ADR-6 remains `proposed`; if the owner rejects it, US-13, US-14 and US-21 need re-planning.
- Real data differs from the shapes the fixtures assumed: the first real US-3 import found `model` holding a raw JSON descriptor (13 distinct values, up to 78 characters, no session text). US-23 fixes it and must land before US-4 so the API never groups by raw JSON. Other fields (token counts, agent names, source ids) may also differ on real data; the owner's manual check after each adapter story should report counts and shapes only.
- Real opencode data shows only 3 distinct `task_type` values, mostly "Uncategorised" (the architecture already flags this). The task-type split (US-9) and filter (US-10) may look thin at launch. No story covers new task rules yet; see Open questions.

## Open questions
- FR-21 and FR-22: the requirements list them as Could while the architecture records the owner wanting them in the first release. The user chose Could/later here — please confirm which stands.
- Requirements open question (FR-7 wording) and the "period being viewed" / streak-with-filters questions in the architecture's Requirement feedback are still unowned; US-8 and US-10 assume filters apply to streaks (UX flows A-7).
- Architecture open question: are the Agent-tool and Chat-tool data directories on volumes or in the containers' writable layer? US-1 answers it; the answer may change US-13's mount strategy.
- Architecture open question: how should the owner be told a daily import failed? US-14 assumes the Agent-tool reports the wrapper script's non-zero exit.
- NFR-13: where should the backup copies of `activity.db` go? US-21 cannot be verified until the owner picks a destination.
- UX flows OQ-6 (heading, intro and empty-state wording) needs the owner's approval before US-6 and US-11 ship.
- Task-type coverage on real opencode data (3 distinct values, mostly "Uncategorised"): does the owner want a Should story to tune the ADR-4 rules (FR-13, FR-14, BR-6), or is the current coverage acceptable for the first release? Not covered by US-23.
- US-23: should a one-off clean-up of already-imported rows be a separate script? The story assumes not (re-import with a larger `--window-days`, or rebuild the scratch `activity.db`). Confirm.
- UX flows OQ-2: the approved UX direction (A-3) changes the site-wide accent from green to red, which US-22 covers as a Could story. Confirm the owner still wants the site-wide switch, or scope the red accent to the activity section only.

## Change log
| Change | Reason |
|---|---|
| Initial version | Created from approved requirements, approved architecture, ADR-1 to ADR-6 and a five-question planning interview |
| Review round 1 | Doc review: raised US-12 to Must (NFR-9 carrier); split backup out of US-14 into new US-21 and raised US-14 (daily trigger, FR-16) to Must; renamed US-3 (no daily claim); added US-22 for the approved red-accent direction (flows OQ-2); fixed coverage rows FR-14, FR-16, FR-19, FR-12, FR-20, NFR-1, NFR-9, NFR-13; set US-1 design-needed to no |
| Review round 2 | Doc review: dropped FR-20 from US-15 citations, dropped US-11 from the BR-2 coverage row, anchored US-22 on flows A-3 and ADR-5 |
| Sprint-1 planning | Owner-confirmed selection: US-1, US-2 and US-3 set to sprint-1 / ready; story files and docs/product/sprints/sprint-1.md written |
| Sprint-1 review fixes | Doc review round 2 (PASS): removed untraced NFR-7/NFR-10/BR-3 citations from US-1/US-2/US-3, added US-3 AC-8 (FR-15) and AC-9 (NFR-10), aligned coverage gate with built modules, reworded daily-automation claims, completed BR-1/BR-6/NFR-5 citation rows |
| US-23 added | Defect from the first real US-3 import: `usage_event.model` held a raw JSON descriptor. Added US-23 (Must, backend, S; story file written as draft); US-4 now depends on US-2 and US-23; added coverage references for FR-8, FR-12, FR-17, BR-5, NFR-5; added two risks and two open questions. US-5 and all other stories unchanged; no ID renumbered |
