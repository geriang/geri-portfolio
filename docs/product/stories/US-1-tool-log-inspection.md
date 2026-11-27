# US-1: Inspect Hermes agent and Open WebUI logs

Status: draft

## Story
As a product owner, I want the real log formats of the Hermes agent and Open WebUI documented, so that the adapters (US-17/US-18) and the final task type list can be planned without guessing.

## Requirements
FR: FR-13, FR-14, BR-1, BR-6. ADR: ADR-4, ADR-6 (proposed). Also answers the architecture's open questions on tool log mounts and token/model availability.

## Acceptance criteria
- AC-1: Given the Hermes agent and Open WebUI containers on the owner's machine, when `docker inspect` is run on each, then the findings file records each container's `Mounts` and states per tool whether the data sits on a named volume/bind mount or in the container's writable layer. (Manual (user): run `docker inspect <container>` on the owner's machine and check the Mounts section is reflected in the findings file.)
- AC-2: Given each tool's database, when its schema is read, then the findings file records, per tool, table and field names and whether timestamps, input/output token counts, model names and task-distinguishing metadata are present, with an explicit "not recorded" where absent. (Manual (user): open each database with `sqlite3 <file> .schema` and check the findings match.)
- AC-3: Given the metadata found, when the findings are written, then the file proposes a final task type list per BR-6 (from the candidate list plus "Uncategorised"), stating which candidate types each tool's metadata can support. (Verified by: review of the findings file against BR-6 and AC-2 evidence.)
- AC-4: Given the findings file and any committed sample, when the repository is searched, then no prompt or response text, personal data or real user content from the tool logs appears in any committed file — structure only. (Verified by: `git grep -I` over the new files for any copied free-text values; review of the commit diff.)
- AC-5: Given the findings file exists at `docs/product/findings/us-1-tool-log-inspection.md`, when US-17/US-18 are scheduled, then it states per tool whether an adapter is feasible now, feasible with a volume change, or blocked, and names the access route (read-only volume mount vs Docker socket) per ADR-6. (Verified by: review of the file's conclusion table.)

## Out of scope
- Writing or designing any adapter code (US-17/US-18).
- Changing the Hermes agent or Open WebUI containers or moving their data to volumes (owner action, recorded by US-1, executed later).
- The opencode adapter (US-3); opencode is already inspected in the architecture.

## Dependencies
none.

## Design needed
no: the deliverable is a findings document that feeds the US-17/US-18 designs, not a component to build.

## Branch name
agent/us-1-tool-log-inspection

## Notes
Findings file goes in the PO-owned area: `docs/product/findings/us-1-tool-log-inspection.md`. The work happens on the owner's machine (the two tools live in their own Docker containers there), so AC-1 to AC-3 are Manual (user) checks in this container. Record structure (table/field names, presence flags) only — never values. This story unblocks the task-type list decision (BR-6) and the ADR-6 mount strategy.

## Type
enabler

## UX needed
no: no screens are added or changed.
