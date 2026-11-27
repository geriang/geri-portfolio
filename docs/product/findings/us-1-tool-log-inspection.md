# US-1 findings: Hermes agent and Open WebUI log inspection

> **INCOMPLETE — PENDING owner input: the container and database findings below were not inspected from the development container (the tools live on the owner's machine). Do not treat PENDING rows as findings.**

## 1. Traceability

- Story: `docs/product/stories/US-1-tool-log-inspection.md` (Status: approved) — enabler for the US-17 (Hermes agent) and US-18 (Open WebUI) adapters and the final BR-6 task type list.
- Requirements (`docs/requirements/requirements.md`): FR-13 (fixed owner-defined task type list, Functional requirements); FR-14 ("Uncategorised" fallback for undeterminable task types, Functional requirements); BR-1 (never display or expose prompt text or response content — only counts, dates, model names, task types and tool names may be shown, Business rules and constraints); BR-6 (candidate task type list, limited to what the source logs let the owner tell apart, Business rules and constraints).
- ADRs: ADR-4 (`docs/architecture/adr/ADR-4-task-classification-by-metadata-rules.md`, Status: accepted — rules match source metadata only; "Uncategorised" is always part of the list); ADR-6 (`docs/architecture/adr/ADR-6-docker-deployment-of-api-and-importer.md`, **Status: proposed** — the two access routes recorded below are per ADR-6 and must be re-checked if ADR-6 is rejected).
- Architecture open questions (`docs/architecture/architecture.md`, Open questions): whether the Hermes agent and Open WebUI data directories are volumes/bind mounts or in the containers' writable layer; whether their databases record tokens, model names and task-distinguishing metadata.
- Sprint context: `docs/product/sprints/sprint-1.md` (exit condition names this file; Risks record that US-1 may find writable-layer storage and/or missing tokens or task metadata).

## 2. Provenance and citation rule

- Every transcribed (non-PENDING) statement in this file carries an inline citation naming the repository document and section it came from. No other source is permitted.
- Every `PENDING` row names the exact command the owner must run on their own machine to fill it, in the form `PENDING — owner to run: <command>`. Filling PENDING cells is the owner's later action; container names and database paths are recorded in no repository document, so they stay `<...>` placeholders for the owner to substitute.
- Nothing has been inspected from this development container: the Hermes agent and Open WebUI containers and their databases live on the owner's machine and are not reachable from here (story Notes; `docs/architecture/architecture.md`, First tools table — "not on this machine, so not inspected").
- **No value, prompt or response text may ever be pasted into this file or any committed sample — structure only** (table names, field names, presence flags, mount metadata), per AC-4, NFR-5 (`docs/architecture/architecture.md`, Non-functional requirements) and BR-1 (`docs/requirements/requirements.md`, Business rules and constraints).

## 3. Per-tool sections

### 3.1 Hermes agent

> Per `docs/architecture/architecture.md` (First tools and what their logs offer, Hermes agent row): "SQLite inside the Hermes agent's Docker container (owner's answer); not on this machine, so not inspected ... Needs a log format check before its adapter is designed. Access depends on whether the data is on a volume (ADR-6)." Nothing below is inspected; all cells are PENDING.

#### 3a. Container mount findings (AC-1)

Owner to run: `docker inspect <hermes-agent-container-name>`.

| Name | Type | Source | Destination |
|---|---|---|---|
| Mount row 1 (mount count unknown — owner adds or removes rows as needed) | PENDING — owner to run: docker inspect <hermes-agent-container-name> | PENDING — owner to run: docker inspect <hermes-agent-container-name> | PENDING — owner to run: docker inspect <hermes-agent-container-name> |
| Mount row 2 (mount count unknown — owner adds or removes rows as needed) | PENDING — owner to run: docker inspect <hermes-agent-container-name> | PENDING — owner to run: docker inspect <hermes-agent-container-name> | PENDING — owner to run: docker inspect <hermes-agent-container-name> |
| **Mount type conclusion** (named volume / bind mount / container writable layer) | PENDING — owner to run: docker inspect <hermes-agent-container-name>, inspect the Mounts section | — | — |

Note (AC-4): when filling `Source`, the owner should redact any account name it embeds (for example write `/home/<owner>/...`) — see §7.

#### 3b. Database schema findings (AC-2)

Owner to run: `sqlite3 <hermes-database-file> .schema`.

Schema inventory (all rows PENDING — the owner adds one row per table found):

| Table | Field names |
|---|---|
| PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema |

Availability of the concepts FR-12/AC-2 requires (the "not recorded" literal is chosen by the owner when a concept is absent — it is never pre-filled here, per AC-2):

| Concept | Present? (yes / not recorded) | Field names | Notes |
|---|---|---|---|
| timestamps | PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema |
| input token counts | PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema |
| output token counts | PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema |
| model names | PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema |
| task-distinguishing metadata | PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — owner to run: sqlite3 <hermes-database-file> .schema |

#### 3c. BR-6 candidate support (AC-3)

Candidate list from BR-6 (`docs/requirements/requirements.md`, Business rules and constraints): Coding/implementation, Debugging/fixing, Planning/design, Research/questions, Writing/documentation, Review/testing. Uncategorised is the final row and is always in the list (FR-14, `docs/requirements/requirements.md`, Functional requirements; ADR-4 Decision: "no match gives 'Uncategorised', which is always part of the list").

| Candidate type | Can this tool's metadata support this type? | Supporting metadata fields |
|---|---|---|
| Coding/implementation | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema |
| Debugging/fixing | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema |
| Planning/design | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema |
| Research/questions | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema |
| Writing/documentation | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema |
| Review/testing | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema |
| **Uncategorised** | yes — always in the list (FR-14) | — (fallback assigned when no rule matches, per FR-14 and ADR-4) |

#### 3d. Adapter feasibility conclusion (AC-5)

Access routes per ADR-6, "Where the tool data lives" (`docs/architecture/adr/ADR-6-docker-deployment-of-api-and-importer.md`, Status: proposed): option 1 shared volume mounted read-only into the importer (preferred); option 2 Docker socket with `docker cp` (fallback, only acceptable behind a narrow wrapper script, and ADR-6 prefers first moving the data onto a volume).

| Conclusion | Value |
|---|---|
| Feasibility (feasible now / feasible with a volume change / blocked) | PENDING — decided once AC-1 and AC-2 are filled; ADR-6 prefers the shared read-only volume mount and treats Docker socket access as the fallback behind a narrow wrapper script — owner to run: docker inspect <container-name> and sqlite3 <database-file> .schema (see the tool's §3a and §3b) |
| Access route (read-only volume mount per ADR-6 option 1 / Docker socket docker cp per ADR-6 option 2 / none) | PENDING — decided once AC-1 and AC-2 are filled; ADR-6 prefers the shared read-only volume mount and treats Docker socket access as the fallback behind a narrow wrapper script — owner to run: docker inspect <container-name> and sqlite3 <database-file> .schema (see the tool's §3a and §3b) |

### 3.2 Open WebUI

> Per `docs/architecture/architecture.md` (First tools and what their logs offer, Open WebUI row): "SQLite inside the Open WebUI Docker container (owner's answer); not on this machine, so not inspected ... Needs a log format check, in particular whether token counts are recorded at all. Access depends on whether the data is on a volume (ADR-6)." Nothing below is inspected; all cells are PENDING.

#### 3a. Container mount findings (AC-1)

Owner to run: `docker inspect <open-webui-container-name>`.

| Name | Type | Source | Destination |
|---|---|---|---|
| Mount row 1 (mount count unknown — owner adds or removes rows as needed) | PENDING — owner to run: docker inspect <open-webui-container-name> | PENDING — owner to run: docker inspect <open-webui-container-name> | PENDING — owner to run: docker inspect <open-webui-container-name> |
| Mount row 2 (mount count unknown — owner adds or removes rows as needed) | PENDING — owner to run: docker inspect <open-webui-container-name> | PENDING — owner to run: docker inspect <open-webui-container-name> | PENDING — owner to run: docker inspect <open-webui-container-name> |
| **Mount type conclusion** (named volume / bind mount / container writable layer) | PENDING — owner to run: docker inspect <open-webui-container-name>, inspect the Mounts section | — | — |

Note (AC-4): when filling `Source`, the owner should redact any account name it embeds (for example write `/home/<owner>/...`) — see §7.

#### 3b. Database schema findings (AC-2)

Owner to run: `sqlite3 <open-webui-database-file> .schema`.

Schema inventory (all rows PENDING — the owner adds one row per table found):

| Table | Field names |
|---|---|
| PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema |

Availability of the concepts FR-12/AC-2 requires (the "not recorded" literal is chosen by the owner when a concept is absent — it is never pre-filled here, per AC-2). The architecture flags token recording as the key unknown for this tool (`docs/architecture/architecture.md`, First tools table, Open WebUI row: "in particular whether token counts are recorded at all"):

| Concept | Present? (yes / not recorded) | Field names | Notes |
|---|---|---|---|
| timestamps | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema |
| input token counts | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema |
| output token counts | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema |
| model names | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema |
| task-distinguishing metadata | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — owner to run: sqlite3 <open-webui-database-file> .schema |

#### 3c. BR-6 candidate support (AC-3)

Same candidate list as §3.1.3c (BR-6, `docs/requirements/requirements.md`, Business rules and constraints), with Uncategorised last (FR-14, ADR-4).

| Candidate type | Can this tool's metadata support this type? | Supporting metadata fields |
|---|---|---|
| Coding/implementation | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| Debugging/fixing | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| Planning/design | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| Research/questions | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| Writing/documentation | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| Review/testing | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| **Uncategorised** | yes — always in the list (FR-14) | — (fallback assigned when no rule matches, per FR-14 and ADR-4) |

#### 3d. Adapter feasibility conclusion (AC-5)

Access routes per ADR-6, "Where the tool data lives" (`docs/architecture/adr/ADR-6-docker-deployment-of-api-and-importer.md`, Status: proposed), identical options as §3.1.3d.

| Conclusion | Value |
|---|---|
| Feasibility (feasible now / feasible with a volume change / blocked) | PENDING — decided once AC-1 and AC-2 are filled; ADR-6 prefers the shared read-only volume mount and treats Docker socket access as the fallback behind a narrow wrapper script — owner to run: docker inspect <container-name> and sqlite3 <database-file> .schema (see the tool's §3a and §3b) |
| Access route (read-only volume mount per ADR-6 option 1 / Docker socket docker cp per ADR-6 option 2 / none) | PENDING — decided once AC-1 and AC-2 are filled; ADR-6 prefers the shared read-only volume mount and treats Docker socket access as the fallback behind a narrow wrapper script — owner to run: docker inspect <container-name> and sqlite3 <database-file> .schema (see the tool's §3a and §3b) |

## 4. Architecture open questions answered

Restated from `docs/architecture/architecture.md` (Open questions). Both remain open until the owner runs the commands on their machine.

1. "Are the Hermes agent and Open WebUI data directories mounted as Docker volumes or bind mounts, or do they sit in the containers' own writable layer? (Check with `docker inspect <container>` and look at `Mounts`.) This decides whether the importer can mount them read-only or needs Docker socket access (ADR-6)."
   - Answer: PENDING — owner to run: docker inspect <hermes-agent-container-name> and docker inspect <open-webui-container-name>, then fill the Mounts tables and Mount type conclusion rows in §3.1.3a and §3.2.3a.
2. "Do the Hermes agent and Open WebUI databases record tokens, model names and enough metadata to tell task types apart? This decides their adapters and the final task type list."
   - Answer: PENDING — owner to run: sqlite3 <hermes-database-file> .schema and sqlite3 <open-webui-database-file> .schema, then fill the schema inventories and availability tables in §3.1.3b and §3.2.3b.

## 5. opencode baseline (transcribed, no new inspection)

opencode's structure was already inspected and documented by the architect; this section **transcribes** that documentation only. US-1 performs no new inspection of opencode (spec Out of scope; `docs/product/stories/US-1-tool-log-inspection.md`, Out of scope).

Transcribed from `docs/architecture/architecture.md`, "First tools and what their logs offer", opencode row:

| Source | What was checked | Implication |
|---|---|---|
| SQLite file `opencode.db`; `session_message` rows of type assistant and user, `session_v2` per session (docs/architecture/architecture.md, First tools table, opencode row) | Table and field names only, on this machine's database. Assistant rows carry model, timestamps, tokens and cost. User rows carry the agent and model in metadata. Sessions carry directory, agent, model and token totals. (docs/architecture/architecture.md, First tools table, opencode row) | Use message-level rows, not session totals, so a session that crosses midnight is split across the right days. Prompt count = user messages. Rules can use the agent name and project directory as metadata. The user and assistant `text` fields hold prompt content and must be dropped inside the adapter. (docs/architecture/architecture.md, First tools table, opencode row) |

BR-6 support table for all three tools (same layout as §3a–3c). Hermes agent and Open WebUI columns stay PENDING; the opencode columns are filled **only** from the architecture's documented statements above.

| Candidate type | opencode: support (per architecture) | opencode: supporting metadata fields (per architecture) | Hermes agent: support | Hermes agent: fields | Open WebUI: support | Open WebUI: fields |
|---|---|---|---|---|---|---|
| Coding/implementation | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row: "Rules can use the agent name and project directory as metadata") | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| Debugging/fixing | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| Planning/design | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| Research/questions | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| Writing/documentation | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| Review/testing | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING — requires AC-2 evidence — owner to run: sqlite3 <open-webui-database-file> .schema |
| **Uncategorised** | yes — always in the list (FR-14) | — (fallback assigned when no rule matches, per FR-14 and ADR-4) | yes — always in the list (FR-14) | — (fallback assigned when no rule matches, per FR-14 and ADR-4) | yes — always in the list (FR-14) | — (fallback assigned when no rule matches, per FR-14 and ADR-4) |

Table note (opencode): the architecture documents that classification rules may use the agent name and the project directory as metadata (`docs/architecture/architecture.md`, First tools table, opencode row; ADR-4 Decision), but records no per-candidate-type support determination for opencode, and US-1 performs no new inspection of opencode (story Out of scope). Per-type calls for opencode are therefore for the owner to make when finalising the BR-6 list.

## 6. Proposed final BR-6 task type list (AC-3)

Candidates from BR-6 (`docs/requirements/requirements.md`, Business rules and constraints); Uncategorised last (FR-14; ADR-4: always part of the list).

| Candidate type | Supported by opencode (per architecture) | Supported by Hermes agent | Supported by Open WebUI | Propose keep / drop |
|---|---|---|---|---|
| Coding/implementation | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema and sqlite3 <open-webui-database-file> .schema |
| Debugging/fixing | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema and sqlite3 <open-webui-database-file> .schema |
| Planning/design | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema and sqlite3 <open-webui-database-file> .schema |
| Research/questions | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema and sqlite3 <open-webui-database-file> .schema |
| Writing/documentation | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema and sqlite3 <open-webui-database-file> .schema |
| Review/testing | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema and sqlite3 <open-webui-database-file> .schema |
| **Uncategorised** | yes — always in the list (FR-14) | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <open-webui-database-file> .schema | PENDING (AC-2) — owner to run: sqlite3 <hermes-database-file> .schema and sqlite3 <open-webui-database-file> .schema |

Footer: the final task type list stays **provisional** until the owner fills the PENDING cells with AC-2 evidence from their machine. This mirrors the BR-6 feedback row in `docs/architecture/architecture.md` (Requirement feedback, row "BR-6, FR-13"): "The final task type list is not known until the logs are inspected ... the design keeps the list in config (ADR-4)." BR-6 itself limits the list to "what the source logs let the owner tell apart" (`docs/requirements/requirements.md`, Business rules and constraints). Only the owner sets the final list; the list lives in the versioned classification config (ADR-4).

## 7. Privacy statement (AC-4)

- This file records **structure only**: table names, field names, presence flags (yes / not recorded) and mount metadata (mount name, type, source, destination). No prompt or response text, no personal data and no real user content from the tool logs may appear in this file or any committed file (AC-4; BR-1, `docs/requirements/requirements.md`, Business rules and constraints; NFR-5, `docs/architecture/architecture.md`, Non-functional requirements).
- No sample files containing values are committed. When the owner fills the PENDING cells, they transcribe table and field names and presence flags only — never query output values, rows or free text.
- Note for the owner: a mount `Source` path may embed the owner's account name — redact it when filling §3a (for example write `/home/<owner>/...`).
- Where a concept is absent, the owner records the explicit literal "not recorded" (AC-2) rather than leaving the cell blank; that is still a presence flag, not a value.
