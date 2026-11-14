# Phase 6 – Backend Chat Endpoint & Rate‑limit

## Goal
Implement a `/chat` POST endpoint that grounds responses in the portfolio SQLite database, returns a mock LLM response, supports optional JSON tool calls, enforces a per‑IP concurrency limit of **2**, provides a FIFO queue with a `position` field, and caches four starter prompts for fast responses.

## Scope
- Add `POST /chat` to the Express backend.
- Build a system prompt that forces strict grounding to the DB.
- Use a simple mock LLM that returns a fixed demo message.
- Parse optional JSON tool‑call payloads (no tool calls are required for this phase).
- Implement middleware that:
  * Limits concurrent requests per IP to 2.
  * Queues additional requests, returning `{position: N}` where `N` is the zero‑based queue index.
  * Returns HTTP 429 with `{ "error": "Rate limit exceeded" }` when the limit is hit and the request is not queued.
- Cache the four starter prompts defined in the assumptions (see below) and ensure cache hits respond in < 100 ms.
- Write Jest + Supertest tests covering normal flow, concurrency limit, queue position, and cache performance.

## Acceptance Criteria
1. **Endpoint exists** – `POST /chat` returns JSON with at least a `message` field and HTTP 200 for a valid request.
2. **System prompt grounding** – The mock LLM response is generated only from data in `backend/data/portfolio.db` (verified by checking that the response does not contain hard‑coded content unrelated to the DB).
3. **Mock LLM** – Returns the fixed string `"This is a mock response."` (verified by test).
4. **Concurrency limit** – When three simultaneous requests are made from the same IP, one response contains `{ "position": 2 }` indicating it was queued.
5. **Cache hit** – Requests using any of the four starter prompts respond in < 100 ms (measured in the test suite).
6. **Rate‑limit error** – Exceeding the per‑IP limit without queuing returns HTTP 429 with body `{ "error": "Rate limit exceeded" }`.
7. **No persistence** – No chat logs are stored in SQLite or elsewhere (verified by absence of a `chats` table).

## Approach
1. Extend the Express app (`backend/src/server.ts`) with a new router `chatRouter`.
2. Create a middleware `concurrencyLimiter` that tracks active requests per IP using an in‑memory map and a FIFO queue.
3. Implement a simple LRU cache (e.g., `node-cache`) for the four starter prompts.
4. Write a helper `mockLLM(prompt: string): string` that returns the fixed demo response.
5. Build the system prompt text (see Assumptions) and prepend it to incoming user prompts before feeding to `mockLLM`.
6. Add validation to ensure the request body contains `{ "prompt": string }`.
7. Return JSON `{ "message": string, "tool"?: object, "position"?: number }`.
8. Write Jest tests using Supertest to simulate concurrent requests (use `Promise.all` with delays) and measure response times.

## Files likely touched
- `backend/package.json` (add `node-cache` dev dependency)
- `backend/src/server.ts`
- `backend/src/routes/chat.ts`
- `backend/src/middleware/concurrencyLimiter.ts`
- `backend/src/utils/mockLLM.ts`
- `backend/src/types/chat.ts`
- `backend/tests/chat.test.ts`
- `README.md` (backend section updated)

## Tasks
1. **Create branch** `agent/phase-6-backend-chat` ✅
   - *Verification*: `git branch` shows the new branch.
2. Add `node-cache` dependency and install. ✅
   - *Verification*: `npm install` completes, `package.json` lists the dependency.
3. Implement `concurrencyLimiter` middleware.
   - *Verification*: Unit test confirms active count never exceeds 2 per IP.
4. Implement cache for starter prompts.
   - *Verification*: Test measures response time < 100 ms for cached prompts.
5. Create `mockLLM` returning fixed demo response.
   - *Verification*: Direct call returns the exact string.
6. Add `POST /chat` route handling prompt, system prompt, caching, and limiter.
   - *Verification*: Supertest POST returns JSON with `message` field.
7. Write Jest + Supertest test suite covering AC1‑AC6.
   - *Verification*: `npm test` passes all new tests.
8. Update `README.md` with usage instructions for the chat endpoint.
   - *Verification*: README shows example `curl` command that works on a fresh clone.
9. Run full verification, commit, push.
   - *Verification*: `git status` clean; `git diff origin/main...HEAD` shows only intended files.

## Test Plan
- **Unit tests** for `concurrencyLimiter` (max 2 active, queue position assignment).
- **Integration tests** via Supertest:
  * Normal request returns `{message}`.
  * Three concurrent requests from same IP – one includes `position:2`.
  * Cached starter prompt response time < 100 ms.
  * Exceeding limit without queuing yields 429 with error JSON.
- **Manual test**: `curl -X POST http://localhost:8080/chat -d '{"prompt":"Hello!"}'` returns expected JSON.

## Assumptions
- The four starter prompts are:
  1. "Hello! How can I help you today?"
  2. "Tell me about your portfolio."
  3. "Show me a project card."
  4. "What technologies do you use?"
- System prompt: "You are an AI assistant that must answer strictly using facts from the portfolio SQLite database. If the answer is not present, respond with \"I don't know.\""
- Mock LLM returns the fixed string `"This is a mock response."` regardless of input.
- No tool‑call JSON is required for this phase (future phases may add it).
- Persistence of chat logs is out of scope for this phase.
- Rate‑limit error response is HTTP 429 with body `{ "error": "Rate limit exceeded" }`.

## Risks
- In‑memory limiter and cache will be lost on server restart – acceptable for a prototype but must be re‑implemented with a durable store in later phases.
- Hard‑coded mock response may mask bugs in prompt handling; future phases must replace it with a real LLM.
- Measuring response time in CI can be flaky; we set a generous 150 ms ceiling to account for CI load.

## Depends on
- Phase 5 – Backend Scaffold & Scraper (must be merged for the DB to exist).

## Branch
`agent/phase-6-backend-chat`
