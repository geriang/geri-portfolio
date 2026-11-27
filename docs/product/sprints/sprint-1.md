# sprint-1

Status: approved

## Goal
Stand up the ingestion pipeline: the two unchecked tools' log formats are documented, and opencode usage is imported on demand into `activity.db` with idempotent, prompt-free runs — automatically daily once US-14's schedule lands.

## Stories
1. US-1 Inspect Agent-tool and Chat-tool logs
2. US-2 Usage database and importer core
3. US-3 opencode adapter and import run

## Exit condition
All three stories are merged into main and: `docs/product/findings/us-1-tool-log-inspection.md` exists and states per tool the mount route, field availability and the proposed BR-6 task type list; `npm test` in `backend/` is green including the schema allow-list test (NFR-5), classifier first-match and Uncategorised tests, `Asia/Singapore` midnight boundary tests (NFR-11), the double/overlapping-import test showing 0 changed rows (NFR-7), and the injected-failure test leaving 0 partial rows with a `failed` `import_run` row (NFR-12); coverage of the modules built by this sprint — the classifier, day-conversion, importer and opencode adapter modules — is at least 80% (NFR-10, split across US-2/AC-7 and US-3/AC-9); and the review confirms no prompt/response marker text from fixtures appears in `activity.db`, code, tests or commits. The AC-7 timing on the owner's real database and the US-1 `docker inspect` checks are Manual (user) items the review must confirm the owner has performed.

## Out of scope
- The `GET /activity` API (US-4) and hardening (US-5) — sprint-2 candidates.
- Any front-end/heatmap work (US-6 onward).
- Docker packaging (US-13), cron schedule (US-14) — these gate on ADR-6 acceptance.
- Agent-tool and Chat-tool adapters (US-17/US-18) and backfill/reclassify (US-15).

## Risks
- US-1 may find Agent-tool or Chat-tool data lives in the containers' writable layers with no tokens or task metadata; US-17/US-18 sizing and the BR-6 list may then change — the findings file must record this explicitly.
- Adapter id could be unstable for opencode rows without a natural key; duplicated or merged records are possible (ADR-3) — AC-3 is the guard.
- ADR-6 is still `proposed`; US-3's copy-before-read follows it. If ADR-6 is rejected, US-3's CLI stays valid but US-13/US-14 replan.
- Marker-text tests only cover fixture content; a real-log leak stays possible until the owner runs a first import and checks (NFR-5 residual risk).

## Carried-over stories
none.

## Retrospective notes
Left empty until the sprint review.
