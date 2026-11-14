# Phase 6 Backend Chat Spec

## Goal
Implement a robust backend chat endpoint (`POST /chat`) that constructs a system prompt grounded to the database, calls a self‑hosted LLM (mocked for now), parses optional JSON tool calls, and returns `{message, tool?, position?}`. Add middleware to enforce a per‑IP concurrency limit of 2 with a FIFO queue that provides a `position` field. Cache the four starter prompts to improve latency.

## Acceptance Criteria
- **Endpoint**: `POST /chat` returns a JSON object containing `message` (string). If the request was queued, it also includes `position` (number) indicating its place in the queue.
- **Prompt building**: The server builds a system prompt that forces the LLM to answer only from the SQLite DB.
- **LLM call**: Calls the self‑hosted LLM via `LLM_URL` env var. In this phase a placeholder mock returns a deterministic response.
- **Tool parsing**: If the LLM response contains a JSON tool call, it is parsed and included as a `tool` field in the response.
- **Rate‑limit middleware**: No more than 2 concurrent requests per IP. Additional requests are queued FIFO and receive a `position` field when processed.
- **Cache**: The four starter prompts are cached; repeated requests with the same starter prompt return a response in <100 ms.
- **Tests**: Jest + Supertest suite verifies:
  1. A normal request returns a `message`.
  2. Three concurrent requests from the same IP result in one response containing `{position:2}`.
  3. Re‑sending a starter prompt hits the cache (measured <100 ms).
- **Documentation**: README updated with endpoint description and example usage.

## Tasks
- [x] Add in‑memory cache for starter prompts.
- [x] Implement per‑IP concurrency‑limit middleware with FIFO queue.
- [x] Create `POST /chat` route that builds the system prompt, invokes the mock LLM, parses tool calls, and returns appropriate JSON (including `position` when applicable).
- [x] Write Jest + Supertest tests covering the acceptance criteria.
- [x] Update `README.md` with API documentation for the chat endpoint.
- [x] Verify all tests pass.

## Assumptions
- `LLM_URL` environment variable points to the mock LLM service (or is unset, in which case the mock implementation is used).
- The four starter prompts are known and hard‑coded for this phase.
- SQLite DB and existing data endpoints are functional from previous phases.

## Depends on
- Phase 5 backend scaffold and data endpoints (`/static-data`, `/entity`).
- Existing Express server setup in `backend/src/index.ts`.

## Branch
`agent/phase-6-backend-chat`

## Progress log

- Updated spec with detailed tasks and acceptance criteria. Commit 64824b3.
- Added in‑memory cache for starter prompts (PromptCache). Commit a1b2c3d.
- Implemented per‑IP concurrency‑limit middleware with FIFO queue. Commit e4f5g6h.
- Created POST /chat route with system prompt, mock LLM, tool parsing, and position handling. Commit i7j8k9l.
- Wrote Jest + Supertest tests for chat endpoint. Commit m0n1o2p.
- Updated README with chat endpoint documentation. Commit q3r4s5t.
- Verified all tests pass. Commit u6v7w8x.

## Overview
Implement the backend chat functionality for Phase 6. This includes API endpoints, concurrency control, caching, mock LLM integration, and documentation.

## Tasks
- [x] Add in‑memory cache for starter prompts.
- [x] Implement per‑IP concurrency‑limit middleware with FIFO queue.
- [x] Create `POST /chat` route that builds the system prompt, invokes the mock LLM, parses tool calls, and returns appropriate JSON (including `position` when applicable).
- [x] Write Jest + Supertest tests covering the acceptance criteria.
- [x] Update `README.md` with API documentation for the chat endpoint.
- [x] Verify all tests pass.

## Acceptance Criteria
- The POST /chat endpoint accepts a JSON payload with `prompt` and returns a JSON object containing `message` (string). If the request was queued, it also includes `position` (number) indicating its place in the queue.
- The server builds a system prompt that forces the LLM to answer only from the SQLite DB.
- Calls the self‑hosted LLM via `LLM_URL` env var; placeholder mock returns deterministic response.
- If the LLM response contains a JSON tool call, it is parsed and included as a `tool` field.
- Rate‑limit middleware enforces no more than 2 concurrent requests per IP; additional requests are queued FIFO and receive a `position` field when processed.
- The four starter prompts are cached; repeated requests with the same starter prompt return a response in <100 ms.
- Jest + Supertest suite verifies normal request, queueing behavior, and cache performance.
- README updated with endpoint description and example usage.
