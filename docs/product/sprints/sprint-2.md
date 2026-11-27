# sprint-2

Status: draft

## Goal
Put the activity data on the wire safely: model names are normalised, `GET /activity` serves the grouped dataset with metadata from a read-only `activity.db`, and the public surface is locked to that one endpoint.

## Stories
1. US-23 Normalise the opencode model descriptor
2. US-4 Read-only `GET /activity` API
3. US-5 Public surface hardening

## Exit condition
All three stories are merged into main and the review confirms each of the following:

- `npm test` in `backend/` is green, including:
  - US-23: descriptor tests — plain strings unchanged, `<providerID>/<id>` normalisation, safe fallback with type-and-length-only error text, and AC-4's re-import correcting existing raw-JSON rows through the existing upsert with row count and totals changing by 0 and only `model` changing;
  - US-4: contract tests — metadata block with `Asia/Singapore`, `asOfDate`, `lastUpdated`, `taskTypes`, `models`, `tools`; grouped rows within the requested range; 12-month default; `400` on invalid ranges; read-only open with a rejected write attempt; marker-text absent from responses, logs and errors;
  - US-5: hardening tests — `405` on non-`GET`/`OPTIONS` with the database unchanged, CORS allowlist with deny-by-default and no wildcard, helmet headers, `429` past 60/min keyed on the proxied client IP, the committed tunnel configuration artifact carrying placeholder hostnames and env-var names (never values), and all pre-existing tests unchanged.
- The US-4 timing test passes twice; the owner has confirmed the NFR-2 target against the requirements wording (the confirmation, not the number, is the gate).
- A review of each merged diff finds no real model names, hostnames, account names, tokens or prompt/response marker text in code, tests, fixtures or commits.
- The owner has performed the Manual (user) checks: US-23/AC-6 (a fresh real scratch import with 0 `model` values containing braces, counts only), US-4/AC-9 (API totals match importer summary numbers) and US-5/AC-5 (tunnel answers `200` for `/activity` and `404`/`403` for non-activity paths).

## Out of scope
- Any frontend work: the activity section, heatmap, day details, totals (US-6 onward) — sprint-3 candidates built against the merged API.
- Docker packaging (US-13), daily schedule (US-14) and backups (US-21) — these gate on ADR-6 acceptance, which is still `proposed`.
- Agent-tool and Chat-tool adapters (US-17, US-18) and backfill/reclassify (US-15).
- Production hostname and real CORS origins (US-16) — blocked on the owner's tunnel domain.
- Changes to the legacy portfolio routes beyond keeping them passing (US-5/AC-7).

## Risks
- The tunnel rule (US-5/AC-5) cannot be exercised inside the container; until the owner runs it, only the inner locks are proven. The exit condition makes the owner check explicit.
- A rate limiter keyed on the proxied IP can throttle a whole visitor pool behind one corporate or tunnel egress IP; 60/min is a starting value and the limiter settings are a design decision (US-5 Notes).
- NFR-2 has no in-repo wording (the requirements file is not tracked here), so US-4/AC-8 carries a planning stand-in (300 ms p95); a wrong target surfaces only at the owner's exit confirmation.
- US-23's fallback constant becomes a visible `models` value through US-4; if it is not agreed between the two stories the metadata list may show an odd entry. The stories' Notes pin the expectation.
- Legacy `backend/src/index.ts` uses a wildcard `cors()`; hardening it wrongly could break the legacy portfolio routes — US-5/AC-7 is the guard, and the coexistence approach is a design decision.
- US-23 was planned from a shape report, not a committed sample; further real-data surprises (token counts, source ids) could surface at US-4/AC-9, the owner's first end-to-end check.

## Carried-over stories
none (sprint-1 stories US-1, US-2 and US-3 are merged into main).

## Retrospective notes
Left empty until the sprint review.
