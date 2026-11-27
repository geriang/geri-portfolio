# US-1 findings: Hermes agent and Open WebUI log inspection

> **Inspection complete 2026-11-27 — owner-directed fill-in pass on the owner's host.** The PENDING cells were filled from live structural evidence: `docker inspect` on the two containers (`<hermes-container>`, `<open-webui-container>`) and `sqlite3 .schema` run read-only on `docker cp` copies of each live database, per ADR-6 ("Reading live tool databases": copy, with `-wal`, into a temporary directory and read the copy). Structure only was recorded (mount metadata, table and field names, presence flags). The former residual PENDING — whether token-count keys exist inside Open WebUI's `chat_message.usage` JSON column — was resolved the same day with the owner's explicit approval of a **key-names-only** `json_each` extraction on the copy (the query selected `DISTINCT key` and never the `value` column; no row value was printed). **No PENDING cells remain.**

## 1. Traceability

- Story: `docs/product/stories/US-1-tool-log-inspection.md` (Status: approved) — enabler for the US-17 (Hermes agent) and US-18 (Open WebUI) adapters and the final BR-6 task type list.
- Requirements (`docs/requirements/requirements.md`): FR-13 (fixed owner-defined task type list, Functional requirements); FR-14 ("Uncategorised" fallback for undeterminable task types, Functional requirements); BR-1 (never display or expose prompt text or response content — only counts, dates, model names, task types and tool names may be shown, Business rules and constraints); BR-6 (candidate task type list, limited to what the source logs let the owner tell apart, Business rules and constraints).
- ADRs: ADR-4 (`docs/architecture/adr/ADR-4-task-classification-by-metadata-rules.md`, Status: accepted — rules match source metadata only; "Uncategorised" is always part of the list); ADR-6 (`docs/architecture/adr/ADR-6-docker-deployment-of-api-and-importer.md`, **Status: proposed** — the two access routes recorded below are per ADR-6 and must be re-checked if ADR-6 is rejected).
- Architecture open questions (`docs/architecture/architecture.md`, Open questions): whether the Hermes agent and Open WebUI data directories are volumes/bind mounts or in the containers' writable layer; whether their databases record tokens, model names and task-distinguishing metadata — both answered in §4 below.
- Sprint context: `docs/product/sprints/sprint-1.md` (exit condition names this file; Risks record that US-1 may find writable-layer storage and/or missing tokens or task metadata).

## 2. Provenance and citation rule

- Transcribed statements about requirements, ADRs and the opencode baseline carry an inline citation naming the repository document and section they came from.
- Structural findings added by the 2026-11-27 fill-in pass (per the story's Manual (user) owner items) are marked `live inspection 2026-11-27` and name the exact command behind each: `docker ps --format '{{.Names}}'`, `docker inspect <container> --format '{{json .Mounts}}'` (containers `<hermes-container>`, `<open-webui-container>`), and `sqlite3 .schema` equivalents run read-only on `docker cp` copies of `<hermes-data-dir-in-container>/<hermes-db-file>` (Hermes agent) and `<openwebui-data-dir-in-container>/<openwebui-db-file>` + `-wal` + `-shm` (Open WebUI). No `SELECT` was run on any data table; no row value, prompt, response or personal data was read or recorded.
- Container names, volume names, host and in-container paths and database file names were deliberately replaced by generic placeholders because this repository is public; see the "Placeholder key" in §2a. The real mapping is kept only in a git-ignored local file outside version control. Mount `Source` values are placeholders per AC-4 (see §7).
- The Open WebUI `chat_message.usage` JSON key names were filled after the owner approved a deviation from the "never SELECT on data tables" rule, scoped to key-name extraction only (`SELECT DISTINCT j.key FROM chat_message AS m, json_each(m.usage) AS j` and the guarded nested variant for the `*_tokens_details` objects; the `value` column was never selected or printed). This is the citation for the two availability rows in §3.2.3b.
- **No value, prompt or response text may ever be pasted into this file or any committed sample — structure only** (table names, field names, presence flags, mount metadata), per AC-4, NFR-5 (`docs/architecture/architecture.md`, Non-functional requirements) and BR-1 (`docs/requirements/requirements.md`, Business rules and constraints).

## 2a. Placeholder key

The repository is public, so no real container, volume, path or file names appear in this file. Each placeholder below stands for one real value that the owner keeps outside version control.

| Placeholder | Meaning |
|---|---|
| `<hermes-container>` | Name of the Hermes agent's Docker container |
| `<open-webui-container>` | Name of the Open WebUI Docker container |
| `<open-webui-volume>` | Name of the Docker named volume that holds Open WebUI's data |
| `<host-data-dir>` | Host directory that is bind-mounted into the Hermes agent container (source of the bind mount) |
| `<hermes-data-dir-in-container>` | Hermes agent data directory inside its container (mount destination) |
| `<openwebui-data-dir-in-container>` | Open WebUI data directory inside its container (mount destination) |
| `<docker-volume-host-path>` | Docker-managed host storage path of the Open WebUI named volume |
| `<hermes-db-file>` | Hermes agent SQLite database file inside its data directory |
| `<openwebui-db-file>` | Open WebUI SQLite database file inside its data directory (`-wal` / `-shm` companions carry the same name plus that suffix) |
| `<vector-store-dir>` | A non-SQLite vector store subdirectory inside the Open WebUI data directory (out of scope) |

## 3. Per-tool sections

### 3.1 Hermes agent

> Per `docs/architecture/architecture.md` (First tools and what their logs offer, Hermes agent row): "SQLite inside the Hermes agent's Docker container (owner's answer); not on this machine, so not inspected ... Needs a log format check before its adapter is designed. Access depends on whether the data is on a volume (ADR-6)." Status update 2026-11-27: inspected from the owner's host; the cells below are filled from that inspection.

Container: `<hermes-container>` (identified via `docker ps --format '{{.Names}}'`, live inspection 2026-11-27). Database inspected: `<hermes-data-dir-in-container>/<hermes-db-file>` (2,424,832 bytes; no `-wal` present; `PRAGMA journal_mode` on the copy reports `delete`), copied out with `docker cp` and opened read-only.

#### 3a. Container mount findings (AC-1)

Evidence: `docker inspect <hermes-container> --format '{{json .Mounts}}'` (live inspection 2026-11-27). One mount found (row 2 of the original skeleton removed).

| Name | Type | Source | Destination | Mode / RW |
|---|---|---|---|---|
| <host-data-dir> (host directory; bind mounts carry no volume name) | bind | <host-data-dir> | <hermes-data-dir-in-container> | rw / RW=true (propagation rprivate) |
| **Mount type conclusion** (named volume / bind mount / container writable layer) | **bind mount** — the tool data (including <hermes-db-file>) sits on a bind-mounted host directory, not a named volume and not the container's writable layer | — | — | — |

Note (AC-4): the host `Source` path is replaced by the placeholder `<host-data-dir>` because the repository is public (see §7).

#### 3b. Database schema findings (AC-2)

Evidence: `sqlite3 .schema` (via Python sqlite3, `mode=ro` URI) run on the `docker cp` copy of `<hermes-data-dir-in-container>/<hermes-db-file>` — structure only, no `SELECT` on data tables (live inspection 2026-11-27).

Schema inventory — 44 tables in <hermes-db-file> (FTS5 auxiliary tables marked; the `messages.content`-derived FTS indexes carry message text and must be dropped inside any adapter):

| Table | Field names |
|---|---|
| async_delegations | delegation_id TEXT, origin_session TEXT, origin_ui_session_id TEXT, parent_session_id TEXT, state TEXT, dispatched_at REAL, completed_at REAL, updated_at REAL, event_json TEXT, result_json TEXT, delivery_state TEXT, delivery_attempts INTEGER, delivered_at REAL, owner_pid INTEGER, owner_started_at INTEGER, task_json TEXT, owner_execution_id TEXT, delivery_claim TEXT, delivery_claimed_at REAL, origin_session_id TEXT |
| compression_locks | session_id TEXT, holder TEXT, acquired_at REAL, expires_at REAL |
| conversation_generations | source TEXT, session_key TEXT, generation INTEGER |
| delivery_obligations | obligation_id TEXT, session_key TEXT, platform TEXT, chat_id TEXT, thread_id TEXT, content TEXT, state TEXT, attempts INTEGER, created_at REAL, updated_at REAL, owner_pid INTEGER, owner_started_at INTEGER, last_error TEXT, adapter_profile TEXT |
| gateway_heartbeats | backend_id TEXT, pid INTEGER, started_at REAL, last_heartbeat REAL, profile TEXT, host TEXT |
| gateway_hygiene_state | session_key TEXT, failure_streak INTEGER |
| gateway_routing | scope TEXT, session_key TEXT, entry_json TEXT, updated_at REAL |
| hosted_room_events | room_id TEXT, seq INTEGER, event_id TEXT, kind TEXT, actor_json TEXT, authority_epoch INTEGER, payload_json TEXT, created_at REAL |
| hosted_room_links | room_id TEXT, member_id TEXT, target_url TEXT, target_profile TEXT, grant TEXT, catalog_json TEXT, cancellation_scope_id TEXT, trace_id TEXT, transport_security TEXT, status TEXT, updated_at REAL |
| hosted_room_owed_revokes | room_id TEXT, member_id TEXT, grant_digest TEXT, target_url TEXT, grant TEXT, expires_at REAL, attempts INTEGER, next_attempt_at REAL, created_at REAL, held INTEGER |
| hosted_room_peer_reservations | room_id TEXT, member_id TEXT, target_profile TEXT, authority_gateway_id TEXT, authority_epoch INTEGER, expires_at REAL, revoked_at REAL, created_at REAL, updated_at REAL |
| hosted_room_policy_capacity | singleton INTEGER, max_active_events INTEGER |
| hosted_room_policy_cursors | room_id TEXT, through_seq INTEGER, stopped_through_seq INTEGER, updated_at REAL |
| hosted_room_policy_events | room_id TEXT, thread_id TEXT, discussion_event_id TEXT, seq INTEGER, event_json TEXT |
| hosted_room_policy_publications | room_id TEXT, task_id TEXT, kind TEXT, execution_generation INTEGER, seq INTEGER |
| hosted_room_policy_threads | room_id TEXT, thread_id TEXT, discussion_event_id TEXT, latest_user_seq INTEGER, completed INTEGER |
| hosted_room_policy_transcript | room_id TEXT, thread_id TEXT, seq INTEGER, kind TEXT, settled_seq INTEGER |
| hosted_room_policy_transcript_state | room_id TEXT, schema_version INTEGER |
| hosted_room_policy_watermarks | room_id TEXT, thread_id TEXT, member_id TEXT, seen_through_seq INTEGER |
| hosted_room_remote_runs | room_id TEXT, home_install_id TEXT, authority_gateway_id TEXT, authority_epoch INTEGER, member_id TEXT, task_id TEXT, execution_generation INTEGER, target_install_id TEXT, target_profile TEXT, run_id TEXT, session_id TEXT, created_at REAL, updated_at REAL |
| hosted_room_retired_ids | room_id TEXT, retired_at REAL |
| hosted_room_revoked_grants | scope_key TEXT, expires_at REAL, revoked_before REAL |
| hosted_rooms | room_id TEXT, name TEXT, members_json TEXT, authority_gateway_id TEXT, authority_epoch INTEGER, next_seq INTEGER, event_bytes INTEGER, revision INTEGER, created_at REAL, updated_at REAL, disbanded_at REAL |
| messages | id INTEGER, session_id TEXT, role TEXT, content TEXT, tool_call_id TEXT, tool_calls TEXT, tool_name TEXT, effect_disposition TEXT, timestamp REAL, token_count INTEGER, finish_reason TEXT, reasoning TEXT, reasoning_content TEXT, reasoning_details TEXT, codex_reasoning_items TEXT, codex_message_items TEXT, platform_message_id TEXT, observed INTEGER, _compressed_summary INTEGER, active INTEGER, compacted INTEGER, api_content TEXT, display_kind TEXT, display_metadata TEXT, display_identity BLOB, display_order INTEGER, message_uid TEXT, absorbed_message_uids TEXT, tool_call_uids TEXT, tool_call_uid TEXT |
| messages_fts (FTS5 virtual table over messages) | content, tool_name, tool_calls |
| messages_fts_config (FTS5 auxiliary index over messages) | k, v |
| messages_fts_data (FTS5 auxiliary index over messages) | id INTEGER, block BLOB |
| messages_fts_docsize (FTS5 auxiliary index over messages) | id INTEGER, sz BLOB |
| messages_fts_idx (FTS5 auxiliary index over messages) | segid, term, pgno |
| messages_fts_trigram (FTS5 auxiliary index over messages) | content, tool_name |
| messages_fts_trigram_config (FTS5 auxiliary index over messages) | k, v |
| messages_fts_trigram_data (FTS5 auxiliary index over messages) | id INTEGER, block BLOB |
| messages_fts_trigram_docsize (FTS5 auxiliary index over messages) | id INTEGER, sz BLOB |
| messages_fts_trigram_idx (FTS5 auxiliary index over messages) | segid, term, pgno |
| runtime_epoch | singleton INTEGER, epoch INTEGER, instance_id TEXT |
| schema_version | version INTEGER |
| session_admissions | seq INTEGER, admission_id TEXT, request_id TEXT, principal_id TEXT, target_session_id TEXT, lineage_json TEXT, payload_json TEXT, payload_digest TEXT, intent TEXT, status TEXT, outcome TEXT, owner_epoch INTEGER, generation INTEGER |
| session_model_usage | session_id TEXT, model TEXT, billing_provider TEXT, billing_base_url TEXT, billing_mode TEXT, task TEXT, api_call_count INTEGER, input_tokens INTEGER, output_tokens INTEGER, cache_read_tokens INTEGER, cache_write_tokens INTEGER, reasoning_tokens INTEGER, estimated_cost_usd REAL, actual_cost_usd REAL, cost_status TEXT, cost_source TEXT, first_seen REAL, last_seen REAL |
| session_turn_leases | conversation_id TEXT, holder TEXT, acquired_at REAL, expires_at REAL |
| sessions | id TEXT, runtime_revision INTEGER, runtime_generation INTEGER, source TEXT, created_source TEXT, user_id TEXT, session_key TEXT, chat_id TEXT, chat_type TEXT, thread_id TEXT, display_name TEXT, origin_json TEXT, expiry_finalized INTEGER, model TEXT, model_config TEXT, system_prompt TEXT, system_prompt_hash TEXT, parent_session_id TEXT, started_at REAL, ended_at REAL, end_reason TEXT, message_count INTEGER, tool_call_count INTEGER, input_tokens INTEGER, output_tokens INTEGER, cache_read_tokens INTEGER, cache_write_tokens INTEGER, reasoning_tokens INTEGER, cwd TEXT, git_branch TEXT, git_repo_root TEXT, git_metadata_generation INTEGER, billing_provider TEXT, billing_base_url TEXT, billing_mode TEXT, estimated_cost_usd REAL, actual_cost_usd REAL, cost_status TEXT, cost_source TEXT, pricing_version TEXT, title TEXT, title_source TEXT, last_activity_at REAL, last_activity_description TEXT, last_activity_provenance TEXT, api_call_count INTEGER, handoff_state TEXT, handoff_platform TEXT, handoff_error TEXT, compression_failure_cooldown_until REAL, compression_failure_error TEXT, compression_fallback_streak INTEGER, compression_ineffective_count INTEGER, compression_recovery_deadline REAL, compression_overload_streak INTEGER, profile_name TEXT, transport_profile TEXT, rewind_count INTEGER, archived INTEGER, auto_archived INTEGER, pinned INTEGER, hidden INTEGER, last_read_at REAL, tool_names TEXT, transcript_revision INTEGER |
| state_meta | key TEXT, value TEXT |
| system_prompts | hash TEXT, prompt TEXT |
| worker_executions | execution_id TEXT, session_id TEXT, kind TEXT, owner_epoch INTEGER, generation INTEGER, status TEXT, adoption_digest TEXT, last_sequence INTEGER |
| worker_receipts | execution_id TEXT, sequence INTEGER, payload_digest TEXT, result_json TEXT |

Availability of the concepts FR-12/AC-2 requires:

| Concept | Present? (yes / not recorded) | Field names | Notes |
|---|---|---|---|
| timestamps | yes | sessions.started_at, sessions.ended_at, sessions.last_activity_at (REAL epoch); messages.timestamp (REAL epoch); session_model_usage.first_seen, session_model_usage.last_seen | live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read) |
| input token counts | yes | sessions.input_tokens (INTEGER), plus cache_read_tokens, cache_write_tokens, reasoning_tokens; session_model_usage.input_tokens with the same breakdown | per-session and per-session-per-model granularity (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) |
| output token counts | yes | sessions.output_tokens (INTEGER); session_model_usage.output_tokens (INTEGER) | live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read) |
| model names | yes | sessions.model, sessions.model_config; session_model_usage.model, session_model_usage.billing_provider | live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read) |
| task-distinguishing metadata | yes | session_model_usage.task (TEXT); sessions.cwd, sessions.git_branch, sessions.git_repo_root, sessions.source, sessions.profile_name, sessions.tool_names, sessions.chat_type; messages.role, messages.tool_name, messages.tool_calls, messages.finish_reason | No column is explicitly a BR-6 task-type label; `session_model_usage.task` is the closest named field and its value space was not read (structure only), so per-type rules are conditional on that value space (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) |

#### 3c. BR-6 candidate support (AC-3)

Candidate list from BR-6 (`docs/requirements/requirements.md`, Business rules and constraints): Coding/implementation, Debugging/fixing, Planning/design, Research/questions, Writing/documentation, Review/testing. Uncategorised is the final row and is always in the list (FR-14, `docs/requirements/requirements.md`, Functional requirements; ADR-4 Decision: "no match gives 'Uncategorised', which is always part of the list").

Every "yes (conditional)" below means: ADR-4 metadata rules can be built on the named fields, conditional on the `session_model_usage.task` value space (unread, structure-only) and the owner's rule config actually telling the types apart — BR-6 limits the list to "what the source logs let the owner tell apart" (`docs/requirements/requirements.md`, Business rules and constraints).

| Candidate type | Can this tool's metadata support this type? | Supporting metadata fields |
|---|---|---|
| Coding/implementation | yes (conditional) | session_model_usage.task; sessions.cwd; sessions.git_repo_root; sessions.git_branch; sessions.tool_names; messages.tool_name (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) |
| Debugging/fixing | yes (conditional) | session_model_usage.task; messages.tool_name; messages.finish_reason; sessions.tool_names (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) |
| Planning/design | yes (conditional) | session_model_usage.task; sessions.tool_names; messages.role (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) |
| Research/questions | yes (conditional) | session_model_usage.task; messages.tool_name; sessions.tool_names (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) |
| Writing/documentation | yes (conditional) | session_model_usage.task; sessions.cwd; sessions.git_repo_root; sessions.tool_names (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) |
| Review/testing | yes (conditional) | session_model_usage.task; messages.tool_name; messages.finish_reason (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) |
| **Uncategorised** | yes — always in the list (FR-14) | — (fallback assigned when no rule matches, per FR-14 and ADR-4) |

#### 3d. Adapter feasibility conclusion (AC-5)

Access routes per ADR-6, "Where the tool data lives" (`docs/architecture/adr/ADR-6-docker-deployment-of-api-and-importer.md`, Status: proposed): option 1 shared volume mounted read-only into the importer (preferred); option 2 Docker socket with `docker cp` (fallback, only acceptable behind a narrow wrapper script, and ADR-6 prefers first moving the data onto a volume).

| Conclusion | Value |
|---|---|
| Feasibility (feasible now / feasible with a volume change / blocked) | **feasible now** — AC-1 shows a bind-mounted host data directory and AC-2 shows the schema carries timestamps, input/output token counts, model names and metadata fields usable for ADR-4 rules (§3.1.3a–3c) |
| Access route (read-only volume mount per ADR-6 option 1 / Docker socket docker cp per ADR-6 option 2 / none) | **read-only volume mount per ADR-6 option 1** — the importer bind-mounts the same host data directory (Source of §3.1.3a) read-only; no Docker socket access needed. Copy-before-read still applies per ADR-6 (journal_mode on the copy reports `delete`, so the WAL `-shm` pitfall does not apply, but ADR-6's copy-to-temp-dir rule was followed and proven by this pass) |

### 3.2 Open WebUI

> Per `docs/architecture/architecture.md` (First tools and what their logs offer, Open WebUI row): "SQLite inside the Open WebUI Docker container (owner's answer); not on this machine, so not inspected ... Needs a log format check, in particular whether token counts are recorded at all. Access depends on whether the data is on a volume (ADR-6)." Status update 2026-11-27: inspected from the owner's host; the cells below are filled from that inspection.

Container: `<open-webui-container>` (identified via `docker ps --format '{{.Names}}'`, live inspection 2026-11-27). Database inspected: `<openwebui-data-dir-in-container>/<openwebui-db-file>` (2,637,824 bytes; `PRAGMA journal_mode` on the copy reports `wal`; the `-wal` copy was 4,935,792 bytes), copied out with its `-wal`/`-shm` files per ADR-6 and opened read-only. (A `<vector-store-dir>` directory also lives in the data directory — not a SQLite tool-log store, out of scope.)

#### 3a. Container mount findings (AC-1)

Evidence: `docker inspect <open-webui-container> --format '{{json .Mounts}}'` (live inspection 2026-11-27). One mount found (row 2 of the original skeleton removed).

| Name | Type | Source | Destination | Mode / RW |
|---|---|---|---|---|
| <open-webui-volume> (named volume) | volume (driver local) | <docker-volume-host-path> (Docker-managed host storage path of the volume) | <openwebui-data-dir-in-container> | z / RW=true |
| **Mount type conclusion** (named volume / bind mount / container writable layer) | **named volume** — the tool data (including <openwebui-db-file>) sits on the named volume `<open-webui-volume>`, not the container's writable layer | — | — | — |

Note (AC-4): the `Source` value is the Docker-managed volume path on the host, shown as the placeholder `<docker-volume-host-path>`.

#### 3b. Database schema findings (AC-2)

Evidence: `sqlite3 .schema` (via Python sqlite3, `mode=ro` URI) run on the `docker cp` copy of `<openwebui-data-dir-in-container>/<openwebui-db-file>` (with its `-wal`) — structure only, no `SELECT` on data tables (live inspection 2026-11-27).

Schema inventory — 48 tables in <openwebui-db-file> (conversation-relevant tables: `chat`, `chat_message`, `chatidtag`, `folder`, `tag`, `model`, `feedback`; account tables such as `user` and `auth` exist and must never be read by an adapter):

| Table | Field names |
|---|---|
| access_grant | id TEXT, resource_type TEXT, resource_id TEXT, principal_type TEXT, principal_id TEXT, permission TEXT, created_at BIGINT |
| alembic_version | version_num VARCHAR(32) |
| api_key | id TEXT, user_id TEXT, key TEXT, data JSON, expires_at BIGINT, last_used_at BIGINT, created_at BIGINT, updated_at BIGINT |
| app | id TEXT, slug TEXT, name TEXT, user_id TEXT, is_active BOOLEAN, data JSON, api_key TEXT, created_at BIGINT, updated_at BIGINT |
| auth | id VARCHAR, email VARCHAR, password TEXT, active BOOLEAN, mfa JSON, session_stamp TEXT |
| automation | id TEXT, user_id TEXT, name TEXT, data JSON, meta JSON, is_active BOOLEAN, last_run_at BIGINT, next_run_at BIGINT, created_at BIGINT, updated_at BIGINT, folder_id TEXT |
| automation_run | id TEXT, automation_id TEXT, chat_id TEXT, status TEXT, error TEXT, created_at BIGINT |
| calendar | id TEXT, user_id TEXT, name TEXT, color TEXT, is_default BOOLEAN, data JSON, meta JSON, created_at BIGINT, updated_at BIGINT |
| calendar_event | id TEXT, calendar_id TEXT, user_id TEXT, title TEXT, description TEXT, start_at BIGINT, end_at BIGINT, all_day BOOLEAN, rrule TEXT, color TEXT, location TEXT, data JSON, meta JSON, is_cancelled BOOLEAN, created_at BIGINT, updated_at BIGINT |
| calendar_event_attendee | id TEXT, event_id TEXT, user_id TEXT, status TEXT, meta JSON, created_at BIGINT, updated_at BIGINT |
| channel | id TEXT, user_id TEXT, name TEXT, description TEXT, data JSON, meta JSON, created_at BIGINT, updated_at BIGINT, type TEXT, is_private BOOLEAN, archived_at BIGINT, archived_by TEXT, deleted_at BIGINT, deleted_by TEXT, updated_by TEXT |
| channel_file | id TEXT, user_id TEXT, channel_id TEXT, file_id TEXT, created_at BIGINT, updated_at BIGINT, message_id TEXT |
| channel_member | id TEXT, channel_id TEXT, user_id TEXT, created_at BIGINT, status TEXT, is_active BOOLEAN, is_channel_muted BOOLEAN, is_channel_pinned BOOLEAN, data JSON, meta JSON, joined_at BIGINT, left_at BIGINT, last_read_at BIGINT, updated_at BIGINT, role TEXT, invited_by TEXT, invited_at BIGINT, app_id TEXT |
| channel_webhook | id TEXT, user_id TEXT, channel_id TEXT, name TEXT, profile_image_url TEXT, token TEXT, last_used_at BIGINT, created_at BIGINT, updated_at BIGINT |
| chat | id VARCHAR, user_id VARCHAR, title TEXT, created_at BIGINT, updated_at BIGINT, share_id TEXT, archived BOOLEAN, chat JSON, pinned BOOLEAN, meta JSON, folder_id TEXT, tasks JSON, summary TEXT, last_read_at BIGINT, current_message_id TEXT, variables JSON, timer_at BIGINT |
| chat_file | id TEXT, user_id TEXT, chat_id TEXT, file_id TEXT, message_id TEXT, created_at BIGINT, updated_at BIGINT |
| chat_message | id TEXT, chat_id TEXT, user_id TEXT, role TEXT, parent_id TEXT, content JSON, output JSON, model_id TEXT, files JSON, sources JSON, embeds JSON, done BOOLEAN, status_history JSON, error JSON, usage JSON, created_at BIGINT, updated_at BIGINT, context_summary TEXT, meta JSON |
| chatidtag | id VARCHAR, tag_name VARCHAR, chat_id VARCHAR, user_id VARCHAR, timestamp BIGINT |
| config | key TEXT, value JSON, updated_at BIGINT |
| config_old | id INTEGER, data JSON, version INTEGER, created_at DATETIME, updated_at DATETIME |
| document | collection_name VARCHAR, name VARCHAR, title TEXT, filename TEXT, content TEXT, user_id VARCHAR, timestamp BIGINT |
| feedback | id TEXT, user_id TEXT, version BIGINT, type TEXT, data JSON, meta JSON, snapshot JSON, created_at BIGINT, updated_at BIGINT |
| file | id VARCHAR, user_id VARCHAR, filename TEXT, meta JSON, created_at BIGINT, hash TEXT, data JSON, updated_at BIGINT, path TEXT |
| folder | id TEXT, parent_id TEXT, user_id TEXT, name TEXT, items JSON, meta JSON, is_expanded BOOLEAN, created_at BIGINT, updated_at BIGINT, data JSON |
| function | id VARCHAR, user_id VARCHAR, name TEXT, type TEXT, content TEXT, meta TEXT, valves TEXT, is_active BOOLEAN, is_global BOOLEAN, updated_at BIGINT, created_at BIGINT, version_id TEXT |
| function_history | id TEXT, function_id TEXT, parent_id TEXT, snapshot JSON, user_id TEXT, commit_message TEXT, created_at BIGINT |
| group | id TEXT, user_id TEXT, name TEXT, description TEXT, data JSON, meta JSON, permissions JSON, created_at BIGINT, updated_at BIGINT, parent_group_id TEXT |
| group_member | id TEXT, group_id TEXT, user_id TEXT, created_at BIGINT, updated_at BIGINT |
| knowledge | id TEXT, user_id TEXT, name TEXT, description TEXT, meta JSON, created_at BIGINT, updated_at BIGINT, data JSON |
| knowledge_directory | id TEXT, knowledge_id TEXT, parent_id TEXT, name TEXT, user_id TEXT, created_at BIGINT, updated_at BIGINT |
| knowledge_file | id TEXT, user_id TEXT, knowledge_id TEXT, file_id TEXT, created_at BIGINT, updated_at BIGINT, directory_id TEXT |
| memory | id VARCHAR, user_id VARCHAR, content TEXT, updated_at BIGINT, created_at BIGINT, type VARCHAR, path TEXT, meta JSON |
| message | id TEXT, user_id TEXT, channel_id TEXT, content TEXT, data JSON, meta JSON, created_at BIGINT, updated_at BIGINT, parent_id TEXT, reply_to_id TEXT, is_pinned BOOLEAN, pinned_at BIGINT, pinned_by TEXT, app_id TEXT |
| message_reaction | id TEXT, user_id TEXT, message_id TEXT, name TEXT, created_at BIGINT |
| model | id TEXT, user_id TEXT, base_model_id TEXT, name TEXT, params TEXT, meta TEXT, updated_at BIGINT, created_at BIGINT, is_active BOOLEAN, version_id TEXT |
| model_history | id TEXT, model_id TEXT, parent_id TEXT, snapshot JSON, user_id TEXT, commit_message TEXT, created_at BIGINT |
| note | id TEXT, user_id TEXT, title TEXT, data JSON, meta JSON, created_at BIGINT, updated_at BIGINT |
| oauth_session | id TEXT, user_id TEXT, provider TEXT, token TEXT, expires_at BIGINT, created_at BIGINT, updated_at BIGINT |
| pinned_note | id TEXT, user_id TEXT, note_id TEXT, created_at BIGINT |
| prompt | id TEXT, command VARCHAR, user_id VARCHAR, name TEXT, content TEXT, data JSON, meta JSON, is_active BOOLEAN, version_id TEXT, tags JSON, created_at BIGINT, updated_at BIGINT |
| prompt_history | id TEXT, prompt_id TEXT, parent_id TEXT, snapshot JSON, user_id TEXT, commit_message TEXT, created_at BIGINT |
| shared_chat | id TEXT, chat_id TEXT, user_id TEXT, title TEXT, chat JSON, created_at BIGINT, updated_at BIGINT |
| skill | id VARCHAR, user_id VARCHAR, name TEXT, description TEXT, content TEXT, meta JSON, is_active BOOLEAN, updated_at BIGINT, created_at BIGINT, version_id TEXT, data JSON |
| skill_history | id TEXT, skill_id TEXT, parent_id TEXT, snapshot JSON, user_id TEXT, commit_message TEXT, created_at BIGINT |
| tag | id VARCHAR, name VARCHAR, user_id VARCHAR, meta JSON |
| tool | id VARCHAR, user_id VARCHAR, name TEXT, content TEXT, specs TEXT, meta TEXT, valves TEXT, updated_at BIGINT, created_at BIGINT, version_id TEXT |
| tool_history | id TEXT, tool_id TEXT, parent_id TEXT, snapshot JSON, user_id TEXT, commit_message TEXT, created_at BIGINT |
| user | id VARCHAR, name VARCHAR, email VARCHAR, role VARCHAR, profile_image_url TEXT, last_active_at BIGINT, updated_at BIGINT, created_at BIGINT, username VARCHAR(50), bio TEXT, gender TEXT, date_of_birth DATE, profile_banner_image_url TEXT, timezone VARCHAR, presence_state VARCHAR, status_emoji VARCHAR, status_message TEXT, status_expires_at BIGINT, oauth JSON, info JSON, settings JSON, scim JSON, variables JSON |

Availability of the concepts FR-12/AC-2 requires. The architecture flagged token recording as the key unknown for this tool (`docs/architecture/architecture.md`, First tools table, Open WebUI row: "in particular whether token counts are recorded at all"):

| Concept | Present? (yes / not recorded) | Field names | Notes |
|---|---|---|---|
| timestamps | yes | chat_message.created_at, chat_message.updated_at (BIGINT epoch); chat.created_at, chat.updated_at; chatidtag.timestamp | live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read) |
| input token counts | yes | chat_message.usage JSON keys: prompt_tokens, input_tokens, prompt_eval_count, prompt_cache_hit_tokens, prompt_cache_miss_tokens, prompt_token/s | Key names extracted 2026-11-27 by owner-approved key-names-only `json_each` query on the copy (§2 provenance); values never read. Key sets vary by provider (OpenAI-style prompt_tokens vs Ollama-style prompt_eval_count) — the adapter must map variants |
| output token counts | yes | chat_message.usage JSON keys: completion_tokens, output_tokens, eval_count, response_token/s; plus total_tokens (combined) and approximate_total | Same owner-approved key-names-only extraction as the row above. `prompt_tokens_details` and `completion_tokens_details` objects exist with scalar children only (no deeper nesting) |
| model names | yes | chat_message.model_id; model table (model.id, model.name, model.base_model_id, model.user_id) | per-message model reference plus a model registry table (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| task-distinguishing metadata | no — not recorded | — (candidate owner-applied fields: chat.folder_id with folder.name/folder.parent_id; tag.name with chatidtag.tag_name; chat.meta JSON keys unread) | No tool-, agent- or task-distinguishing columns exist; folders and tags are applied by the owner, not recorded by the tool (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |

#### 3c. BR-6 candidate support (AC-3)

Same candidate list as §3.1.3c (BR-6, `docs/requirements/requirements.md`, Business rules and constraints), with Uncategorised last (FR-14, ADR-4).

Open WebUI's logs record no tool/agent/task metadata of their own; every candidate below is "no — not recorded" as tool-recorded evidence. If the owner applies folders/tags to chats themselves, `chat.folder_id`, `folder.name`, `tag.name` and `chatidtag.tag_name` become possible ADR-4 rule inputs, but that is owner-curated classification, not log evidence — BR-6 limits the list to what the source logs let the owner tell apart (`docs/requirements/requirements.md`, Business rules and constraints).

| Candidate type | Can this tool's metadata support this type? | Supporting metadata fields |
|---|---|---|
| Coding/implementation | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| Debugging/fixing | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| Planning/design | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| Research/questions | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| Writing/documentation | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| Review/testing | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| **Uncategorised** | yes — always in the list (FR-14) | — (fallback assigned when no rule matches, per FR-14 and ADR-4) |

#### 3d. Adapter feasibility conclusion (AC-5)

Access routes per ADR-6, "Where the tool data lives" (`docs/architecture/adr/ADR-6-docker-deployment-of-api-and-importer.md`, Status: proposed), identical options as §3.1.3d.

| Conclusion | Value |
|---|---|
| Feasibility (feasible now / feasible with a volume change / blocked) | **feasible now** for usage counting (timestamps, model names, per-message rows and token counts — `usage` JSON keys confirmed, §3.2.3b); **not feasible** as a task-type source without owner-applied folder/tag metadata (§3.2.3c), which does not block the adapter — undeterminable sessions land in Uncategorised (FR-14) |
| Access route (read-only volume mount per ADR-6 option 1 / Docker socket docker cp per ADR-6 option 2 / none) | **read-only volume mount per ADR-6 option 1** — the importer mounts the named volume `<open-webui-volume>` (§3.2.3a) read-only; no Docker socket access needed. WAL mode means ADR-6's copy-before-read rule applies: copy `<openwebui-db-file>` with its `-wal` to a temp directory and read the copy (proven by this pass; a plain read-only mount of a WAL database can fail on the `-shm` requirement per ADR-6 Context) |

## 4. Architecture open questions answered

Restated from `docs/architecture/architecture.md` (Open questions). Both answered by the 2026-11-27 fill-in pass.

1. "Are the Hermes agent and Open WebUI data directories mounted as Docker volumes or bind mounts, or do they sit in the containers' own writable layer? (Check with `docker inspect <container>` and look at `Mounts`.) This decides whether the importer can mount them read-only or needs Docker socket access (ADR-6)."
   - Answer: neither is in the writable layer — the Hermes agent's data directory is a **bind mount** (host directory mounted at `<hermes-data-dir-in-container>`) and Open WebUI's is a **named volume** (`<open-webui-volume>` mounted at `<openwebui-data-dir-in-container>`). The importer can mount both read-only (ADR-6 option 1); no Docker socket access is needed. Evidence: §3.1.3a and §3.2.3a (live inspection 2026-11-27, `docker inspect` on each container).
2. "Do the Hermes agent and Open WebUI databases record tokens, model names and enough metadata to tell task types apart? This decides their adapters and the final task type list."
   - Answer: the Hermes agent records timestamps, input/output token counts (with cache and reasoning breakdowns, per-session and per-session-per-model), model names, and metadata fields usable for task-type rules (`session_model_usage.task`; `sessions.cwd`/`git_branch`/`git_repo_root`/`source`/`profile_name`/`tool_names`; `messages.tool_name`/`finish_reason`). Open WebUI records timestamps and per-message `model_id`, records token counts in `chat_message.usage` (input side: prompt_tokens / input_tokens / prompt_eval_count and cache-hit/miss variants; output side: completion_tokens / output_tokens / eval_count — key names confirmed by owner-approved key-names-only extraction, §3.2.3b) and has **no tool-recorded task-distinguishing metadata** — only owner-applied folder/tag fields. Evidence: §3.1.3b and §3.2.3b (live inspection 2026-11-27, `.schema` on copies).

## 5. opencode baseline (transcribed, no new inspection)

opencode's structure was already inspected and documented by the architect; this section **transcribes** that documentation only. US-1 performs no new inspection of opencode (spec Out of scope; `docs/product/stories/US-1-tool-log-inspection.md`, Out of scope).

Transcribed from `docs/architecture/architecture.md`, "First tools and what their logs offer", opencode row:

| Source | What was checked | Implication |
|---|---|---|
| SQLite file `opencode.db`; `session_message` rows of type assistant and user, `session_v2` per session (docs/architecture/architecture.md, First tools table, opencode row) | Table and field names only, on this machine's database. Assistant rows carry model, timestamps, tokens and cost. User rows carry the agent and model in metadata. Sessions carry directory, agent, model and token totals. (docs/architecture/architecture.md, First tools table, opencode row) | Use message-level rows, not session totals, so a session that crosses midnight is split across the right days. Prompt count = user messages. Rules can use the agent name and project directory as metadata. The user and assistant `text` fields hold prompt content and must be dropped inside the adapter. (docs/architecture/architecture.md, First tools table, opencode row) |

BR-6 support table for all three tools (same layout as §3a–3c). The opencode columns are filled **only** from the architecture's documented statements above; the Hermes agent and Open WebUI columns were filled from the AC-2 evidence in §3.1.3b/§3.2.3b (live inspection 2026-11-27).

| Candidate type | opencode: support (per architecture) | opencode: supporting metadata fields (per architecture) | Hermes agent: support | Hermes agent: fields | Open WebUI: support | Open WebUI: fields |
|---|---|---|---|---|---|---|
| Coding/implementation | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | yes (conditional) | session_model_usage.task; sessions.cwd; sessions.git_repo_root; sessions.git_branch; sessions.tool_names; messages.tool_name (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| Debugging/fixing | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | yes (conditional) | session_model_usage.task; messages.tool_name; messages.finish_reason; sessions.tool_names (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| Planning/design | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | yes (conditional) | session_model_usage.task; sessions.tool_names; messages.role (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| Research/questions | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | yes (conditional) | session_model_usage.task; messages.tool_name; sessions.tool_names (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| Writing/documentation | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | yes (conditional) | session_model_usage.task; sessions.cwd; sessions.git_repo_root; sessions.tool_names (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| Review/testing | Not documented per type — see table note | Agent name; project directory (docs/architecture/architecture.md, First tools table, opencode row) | yes (conditional) | session_model_usage.task; messages.tool_name; messages.finish_reason (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded | — (no task-, agent- or tool-distinguishing columns; the only possible rule inputs are owner-applied metadata: chat.folder_id, folder.name, tag.name, chatidtag.tag_name) (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) |
| **Uncategorised** | yes — always in the list (FR-14) | — (fallback assigned when no rule matches, per FR-14 and ADR-4) | yes — always in the list (FR-14) | — (fallback assigned when no rule matches, per FR-14 and ADR-4) | yes — always in the list (FR-14) | — (fallback assigned when no rule matches, per FR-14 and ADR-4) |

Table note (opencode): the architecture documents that classification rules may use the agent name and the project directory as metadata (`docs/architecture/architecture.md`, First tools table, opencode row; ADR-4 Decision), but records no per-candidate-type support determination for opencode, and US-1 performs no new inspection of opencode (story Out of scope). Per-type calls for opencode are therefore for the owner to make when finalising the BR-6 list.

## 6. Proposed final BR-6 task type list (AC-3)

Candidates from BR-6 (`docs/requirements/requirements.md`, Business rules and constraints); Uncategorised last (FR-14; ADR-4: always part of the list).

| Candidate type | Supported by opencode (per architecture) | Supported by Hermes agent | Supported by Open WebUI | Propose keep / drop |
|---|---|---|---|---|
| Coding/implementation | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | yes (conditional) — see §3.1.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded; owner-applied folder/tag metadata only — see §3.2.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) | propose keep — Hermes metadata can carry ADR-4 rules for this type; Open WebUI sessions fall to Uncategorised unless the owner applies folder/tag metadata |
| Debugging/fixing | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | yes (conditional) — see §3.1.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded; owner-applied folder/tag metadata only — see §3.2.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) | propose keep — Hermes metadata can carry ADR-4 rules for this type; Open WebUI sessions fall to Uncategorised unless the owner applies folder/tag metadata |
| Planning/design | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | yes (conditional) — see §3.1.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded; owner-applied folder/tag metadata only — see §3.2.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) | propose keep — Hermes metadata can carry ADR-4 rules for this type; Open WebUI sessions fall to Uncategorised unless the owner applies folder/tag metadata |
| Research/questions | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | yes (conditional) — see §3.1.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded; owner-applied folder/tag metadata only — see §3.2.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) | propose keep — Hermes metadata can carry ADR-4 rules for this type; Open WebUI sessions fall to Uncategorised unless the owner applies folder/tag metadata |
| Writing/documentation | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | yes (conditional) — see §3.1.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded; owner-applied folder/tag metadata only — see §3.2.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) | propose keep — Hermes metadata can carry ADR-4 rules for this type; Open WebUI sessions fall to Uncategorised unless the owner applies folder/tag metadata |
| Review/testing | Metadata available for rules — agent name, project directory (docs/architecture/architecture.md, First tools table, opencode row); per-type call not documented — see §5 table note | yes (conditional) — see §3.1.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <hermes-data-dir-in-container>/<hermes-db-file> from <hermes-container> (structure only; no rows read)) | no — not recorded; owner-applied folder/tag metadata only — see §3.2.3c (live inspection 2026-11-27: sqlite3 .schema run read-only on a docker cp copy of <openwebui-data-dir-in-container>/<openwebui-db-file> (with its -wal and -shm files) from <open-webui-container> (structure only; no rows read)) | propose keep — Hermes metadata can carry ADR-4 rules for this type; Open WebUI sessions fall to Uncategorised unless the owner applies folder/tag metadata |
| **Uncategorised** | yes — always in the list (FR-14) | yes — always in the list (FR-14) | yes — always in the list (FR-14) | keep — always part of the list (FR-14, ADR-4) |

Footer: the final task type list stays **provisional** until the owner reviews the AC-2 evidence recorded above (all inspection cells are filled; setting the final list remains the owner's call). This mirrors the BR-6 feedback row in `docs/architecture/architecture.md` (Requirement feedback, row "BR-6, FR-13"): "The final task type list is not known until the logs are inspected ... the design keeps the list in config (ADR-4)." BR-6 itself limits the list to "what the source logs let the owner tell apart" (`docs/requirements/requirements.md`, Business rules and constraints). Only the owner sets the final list; the list lives in the versioned classification config (ADR-4).

## 7. Privacy statement (AC-4)

- This file records **structure only**: table names, field names, presence flags (yes / not recorded) and mount metadata (mount name, type, source, destination, mode). No prompt or response text, no personal data and no real user content from the tool logs appears in this file or any committed file (AC-4; BR-1, `docs/requirements/requirements.md`, Business rules and constraints; NFR-5, `docs/architecture/architecture.md`, Non-functional requirements).
- No sample files containing values are committed. The 2026-11-27 fill-in pass transcribed table and field names and presence flags only — no `SELECT` was run on any data table and no query values, rows or free text were copied. The schema copies were read from a temporary scratch directory that is not part of the repository.
- Container names and paths: all container names, volume names, host paths, in-container data paths and database file names in this file are deliberately generic placeholders (see the "Placeholder key" in §2a) because the repository is public. The real values are not stored in any committed file.
- Where a concept is absent, the file records the explicit literal "not recorded" (AC-2) rather than leaving the cell blank; that is still a presence flag, not a value.
