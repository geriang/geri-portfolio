# US-1 findings: Agent-tool and Chat-tool log inspection

> **Inspection complete 2026-11-27 — owner-directed fill-in pass on the owner's host.** The findings were filled from live structural evidence: `docker inspect` on the two containers and `sqlite3 .schema` run read-only on `docker cp` copies of each live database, per ADR-6 ("Reading live tool databases": copy, with `-wal`, into a temporary directory and read the copy). Structure only was recorded (mount metadata, presence flags). The former open question — whether token-count keys exist inside the Chat-tool's JSON usage column — was resolved the same day under an **owner-approved key-names-only exception**: a key-name extraction on the copy that never selected or printed any value. **No PENDING cells remain.**
>
> This tracked file holds conclusions only. Tool names are aliased (see the "Placeholder key"); the full structural inventory (table and field lists, real names, paths) is kept in a git-ignored local findings file.

## 1. Traceability

- Story: `docs/product/stories/US-1-tool-log-inspection.md` (Status: approved) — enabler for the US-17 (Agent-tool) and US-18 (Chat-tool) adapters and the final BR-6 task type list.
- Requirements (`docs/requirements/requirements.md`): FR-13 (fixed owner-defined task type list); FR-14 ("Uncategorised" fallback for undeterminable task types); BR-1 (never display or expose prompt text or response content); BR-6 (candidate task type list, limited to what the source logs let the owner tell apart).
- ADRs: ADR-4 (`docs/architecture/adr/ADR-4-task-classification-by-metadata-rules.md`, Status: accepted — rules match source metadata only; "Uncategorised" is always part of the list); ADR-6 (`docs/architecture/adr/ADR-6-docker-deployment-of-api-and-importer.md`, **Status: proposed** — the access routes recorded below are per ADR-6 and must be re-checked if ADR-6 is rejected).
- Architecture open questions (`docs/architecture/architecture.md`, Open questions): whether the Agent-tool and Chat-tool data directories are volumes/bind mounts or in the containers' writable layer; whether their databases record tokens, model names and task-distinguishing metadata — both answered in §4.
- Sprint context: `docs/product/sprints/sprint-1.md`.

## 2. Provenance and citation rule

- Statements about requirements, ADRs and the opencode baseline carry a citation naming the repository document and section.
- Structural findings were gathered on 2026-11-27 with `docker inspect <container>` (mount metadata) and `sqlite3 .schema` equivalents run read-only on `docker cp` copies of each database. No `SELECT` was run on any data table, apart from the owner-approved key-names-only exception below. No row value, prompt, response or personal data was read or recorded.
- Owner-approved exception: for the Chat-tool, the key names of a JSON usage column were extracted on the copy (key names only; the value column was never selected or printed). This is the evidence for the Chat-tool token-count rows in §3.2.
- Container names, volume names, host and container paths and database file names are replaced by the placeholders below. **No value, prompt or response text may ever be pasted into this file or any committed sample — structure only**, per AC-4, NFR-5 and BR-1.

### Placeholder key

The real values are kept in a git-ignored local file.

| Placeholder | Meaning |
|---|---|
| `<agent-container>` | Docker container name of the Agent-tool |
| `<chat-container>` | Docker container name of the Chat-tool |
| `<chat-volume>` | Named Docker volume holding the Chat-tool data |
| `<host-data-dir>` | Host directory bind-mounted into the Agent-tool container |
| `<agent-data-dir-in-container>` | Data directory inside the Agent-tool container |
| `<chat-data-dir-in-container>` | Data directory inside the Chat-tool container |
| `<docker-volume-host-path>` | Docker-managed host path of the Chat-tool volume |
| `<agent-db-file>` | SQLite database file of the Agent-tool |
| `<chat-db-file>` | SQLite database file of the Chat-tool |

## 3. Per-tool sections

### 3.1 Agent-tool

Container: `<agent-container>`. Database: `<agent-db-file>` in `<agent-data-dir-in-container>`. The journal mode on the copy is not WAL, and no `-wal` file was present.

#### 3a. Mount findings (AC-1)

- One mount found: a **bind mount** of `<host-data-dir>` at `<agent-data-dir-in-container>`, read-write.
- **Mount type conclusion: bind mount.** The tool data, including `<agent-db-file>`, sits on a bind-mounted host directory — not a named volume and not the container's writable layer.
- The real host path embeds an account name, so it is not recorded in this tracked file (AC-4).

#### 3b. Availability of the concepts FR-12/AC-2 requires

| Concept | Present? | Conclusion |
|---|---|---|
| timestamps | yes | Session-level and message-level timestamps, plus first/last seen per session and model |
| input token counts | yes | Per session and per session per model, with cache and reasoning breakdowns |
| output token counts | yes | Per session and per session per model |
| model names | yes | Per session and per session per model, with the billing provider |
| task-distinguishing metadata | yes (conditional) | No column is explicitly a BR-6 task-type label. A task column on the per-model usage table is the closest field, but its value space was not read (structure only), so per-type rules are conditional on that value space. Session-level metadata (working directory, repository, source, profile, tool names) and message-level tool names are also usable for rules |

Full structural inventory is kept in a git-ignored local findings file.

#### 3c. BR-6 candidate support (AC-3)

Candidate list from BR-6 (`docs/requirements/requirements.md`, Business rules and constraints). "Uncategorised" is always in the list (FR-14; ADR-4).

Every "yes (conditional)" means: ADR-4 metadata rules can be built on the available fields, conditional on the value space of the task column (unread) and on the owner's rule config actually telling the types apart. BR-6 limits the list to what the source logs let the owner tell apart.

| Candidate type | Can this tool's metadata support this type? |
|---|---|
| Coding/implementation | yes (conditional) |
| Debugging/fixing | yes (conditional) |
| Planning/design | yes (conditional) |
| Research/questions | yes (conditional) |
| Writing/documentation | yes (conditional) |
| Review/testing | yes (conditional) |
| **Uncategorised** | yes — always in the list (FR-14) |

#### 3d. Adapter feasibility conclusion (AC-5)

Access routes per ADR-6, "Where the tool data lives" (Status: proposed): option 1 shared volume mounted read-only into the importer (preferred); option 2 Docker socket with `docker cp` (fallback, only behind a narrow wrapper script).

| Conclusion | Value |
|---|---|
| Feasibility | **feasible now** — a bind-mounted host data directory (§3.1 3a) and a schema carrying timestamps, token counts, model names and metadata usable for ADR-4 rules (§3.1 3b–3c) |
| Access route | **read-only volume mount per ADR-6 option 1** — the importer bind-mounts the same host data directory read-only; no Docker socket access needed. The copy-before-read rule of ADR-6 still applies |

### 3.2 Chat-tool

Container: `<chat-container>`. Database: `<chat-db-file>` in `<chat-data-dir-in-container>`. The journal mode on the copy is WAL, so the `-wal` and `-shm` files were copied with the database, per ADR-6.

#### 3a. Mount findings (AC-1)

- One mount found: a **named volume** `<chat-volume>` (local driver; host path `<docker-volume-host-path>`) at `<chat-data-dir-in-container>`, read-write.
- **Mount type conclusion: named volume.** The tool data, including `<chat-db-file>`, sits on the named volume — not on a bind mount and not in the container's writable layer.
- A separate vector-store directory in the data directory is not a SQLite tool-log store and is out of scope.

#### 3b. Availability of the concepts FR-12/AC-2 requires

The architecture flagged token recording as the key unknown for this tool (`docs/architecture/architecture.md`, First tools table: "in particular whether token counts are recorded at all").

| Concept | Present? | Conclusion |
|---|---|---|
| timestamps | yes | Per-message and per-chat timestamps |
| input token counts | yes | Recorded inside a JSON usage column; key names confirmed by the owner-approved key-names-only extraction. Key sets vary by provider (OpenAI-style versus Ollama-style names), so the adapter must map the variants |
| output token counts | yes | Same JSON usage column and the same extraction; a combined total is also recorded |
| model names | yes | A per-message model reference plus a model registry table |
| task-distinguishing metadata | no — not recorded | No tool-, agent- or task-distinguishing columns exist. Folders and tags are applied by the owner, not recorded by the tool |

Full structural inventory is kept in a git-ignored local findings file.

#### 3c. BR-6 candidate support (AC-3)

The Chat-tool's logs record no tool, agent or task metadata of their own, so every candidate below is "no — not recorded" as tool-recorded evidence. Its sessions are therefore **Uncategorised** unless the owner applies folders or tags to chats; those would then be possible ADR-4 rule inputs, but that is owner-curated classification, not log evidence (BR-6).

| Candidate type | Can this tool's metadata support this type? |
|---|---|
| Coding/implementation | no — not recorded |
| Debugging/fixing | no — not recorded |
| Planning/design | no — not recorded |
| Research/questions | no — not recorded |
| Writing/documentation | no — not recorded |
| Review/testing | no — not recorded |
| **Uncategorised** | yes — always in the list (FR-14) |

#### 3d. Adapter feasibility conclusion (AC-5)

| Conclusion | Value |
|---|---|
| Feasibility | **feasible now** for usage counting (timestamps, model names, per-message rows and token counts). **Not feasible** as a task-type source without owner-applied folder/tag metadata (§3.2 3c); this does not block the adapter, because undeterminable sessions land in Uncategorised (FR-14) |
| Access route | **read-only volume mount per ADR-6 option 1** — the importer mounts the named volume read-only; no Docker socket access needed. The database is in WAL mode, so ADR-6's copy-before-read rule applies: copy the database with its `-wal` to a temporary directory and read the copy (a plain read-only mount of a WAL database can fail on the `-shm` requirement, per ADR-6 Context) |

ADR-6 is still `proposed`; both access routes must be re-checked if it is rejected.

## 4. Architecture open questions answered

Restated from `docs/architecture/architecture.md` (Open questions).

1. Are the Agent-tool and Chat-tool data directories mounted as Docker volumes or bind mounts, or do they sit in the containers' own writable layer?
   - Answer: neither is in the writable layer. The Agent-tool's data directory is a **bind mount** and the Chat-tool's is a **named volume**. The importer can mount both read-only (ADR-6 option 1); no Docker socket access is needed. Evidence: §3.1 3a and §3.2 3a.
2. Do the Agent-tool and Chat-tool databases record tokens, model names and enough metadata to tell task types apart?
   - Answer: the Agent-tool records timestamps, input and output token counts (with cache and reasoning breakdowns), model names, and metadata usable for task-type rules, conditional on the value space of its task column. The Chat-tool records timestamps, per-message model names and token counts (in a JSON usage column), and has **no tool-recorded task-distinguishing metadata** — only owner-applied folder and tag fields. Evidence: §3.1 3b and §3.2 3b.

## 5. opencode baseline (transcribed, no new inspection)

US-1 performs no new inspection of opencode (story Out of scope). Transcribed from `docs/architecture/architecture.md`, "First tools and what their logs offer", opencode row:

| Source | What was checked | Implication |
|---|---|---|
| SQLite file `opencode.db`; `session_message` rows of type assistant and user, `session_v2` per session | Table and field names only. Assistant rows carry model, timestamps, tokens and cost. User rows carry the agent and model in metadata. Sessions carry directory, agent, model and token totals | Use message-level rows, not session totals, so a session that crosses midnight is split across the right days. Prompt count = user messages. Rules can use the agent name and project directory as metadata. The `text` fields hold prompt content and must be dropped inside the adapter |

BR-6 support per tool (conclusion level):

| Candidate type | opencode (per architecture) | Agent-tool | Chat-tool |
|---|---|---|---|
| Coding/implementation | Not documented per type | yes (conditional) | no — not recorded |
| Debugging/fixing | Not documented per type | yes (conditional) | no — not recorded |
| Planning/design | Not documented per type | yes (conditional) | no — not recorded |
| Research/questions | Not documented per type | yes (conditional) | no — not recorded |
| Writing/documentation | Not documented per type | yes (conditional) | no — not recorded |
| Review/testing | Not documented per type | yes (conditional) | no — not recorded |
| **Uncategorised** | yes — always in the list (FR-14) | yes — always in the list (FR-14) | yes — always in the list (FR-14) |

Table note (opencode): the architecture documents that rules may use the agent name and the project directory as metadata (`docs/architecture/architecture.md`, First tools table; ADR-4 Decision), but records no per-type support determination for opencode. Per-type calls for opencode are for the owner to make when finalising the BR-6 list.

## 6. Proposed final BR-6 task type list (AC-3)

| Candidate type | opencode (per architecture) | Agent-tool | Chat-tool | Propose keep / drop |
|---|---|---|---|---|
| Coding/implementation | Metadata available for rules; per-type call not documented | yes (conditional) | no — not recorded; owner-applied folder/tag only | propose keep — Agent-tool metadata can carry ADR-4 rules; Chat-tool sessions fall to Uncategorised unless the owner applies folders/tags |
| Debugging/fixing | Metadata available for rules; per-type call not documented | yes (conditional) | no — not recorded; owner-applied folder/tag only | propose keep — same note as above |
| Planning/design | Metadata available for rules; per-type call not documented | yes (conditional) | no — not recorded; owner-applied folder/tag only | propose keep — same note as above |
| Research/questions | Metadata available for rules; per-type call not documented | yes (conditional) | no — not recorded; owner-applied folder/tag only | propose keep — same note as above |
| Writing/documentation | Metadata available for rules; per-type call not documented | yes (conditional) | no — not recorded; owner-applied folder/tag only | propose keep — same note as above |
| Review/testing | Metadata available for rules; per-type call not documented | yes (conditional) | no — not recorded; owner-applied folder/tag only | propose keep — same note as above |
| **Uncategorised** | yes — always in the list (FR-14) | yes — always in the list (FR-14) | yes — always in the list (FR-14) | keep — always part of the list (FR-14, ADR-4) |

Footer: the final task type list stays **provisional** until the owner reviews this evidence; setting the final list remains the owner's call. The Agent-tool verdicts are "yes (conditional)" because the value space of its task column was not read. This mirrors the BR-6 feedback row in `docs/architecture/architecture.md` (Requirement feedback). BR-6 limits the list to what the source logs let the owner tell apart; the list lives in the versioned classification config (ADR-4).

## 7. Privacy statement (AC-4)

- This file records **conclusions only**, using aliases and placeholders. No prompt or response text, no personal data and no real user content from the tool logs appears in this file or any committed file (AC-4; BR-1; NFR-5).
- No sample files containing values are committed. No `SELECT` was run on any data table, apart from the owner-approved key-names-only exception for the Chat-tool's JSON usage column; no query values, rows or free text were copied.
- Account names embedded in mount paths are not recorded in this tracked file.
- Where a concept is absent, the file records the explicit literal "not recorded" (AC-2); that is a presence flag, not a value.
