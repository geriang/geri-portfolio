# Phase 7 – Full Integration & Deployment

## Goal

Wire the frontend chat UI to the real backend `/chat` endpoint, ensure tool‑call rendering works, run end‑to‑end Playwright tests, and deploy the site. The frontend static export should be automatically deployed to Netlify via CI, and the backend should be containerised in a Docker image and run on the developer’s server.

## Scope

- Connect `frontend/src/components/ChatOverlay` to the live `POST /chat` endpoint.
- Render any tool‑call responses (e.g., project cards) returned by the backend.
- Add a Dockerfile for the backend that builds a minimal Node 22 image and starts the server (`npm start`).
- Create a GitHub Actions workflow that builds the Next.js site, runs Playwright tests, and on success pushes the `out/` folder to Netlify.
- Provide environment variable configuration for the Docker container (`LLM_URL`, `PORT`, `NODE_ENV`).
- Write Playwright end‑to‑end tests covering the full chat flow: open chat, send a prompt, receive a response, verify a tool‑rendered project card appears, and the queue label disappears.
- Verify the Docker container health via a `curl http://localhost:<PORT>/health` returning HTTP 200.

## Out of scope

- Design changes to the UI, performance optimisations beyond the required Lighthouse > 90 score, and adding new backend endpoints.

## Acceptance Criteria

1. **Frontend‑backend integration** – The chat overlay sends a POST to `/chat` and correctly displays the returned `message`. Tool calls are rendered as interactive UI elements (e.g., a project card). *Verification*: Open the site locally, trigger a chat, and inspect the DOM for the rendered tool output.
2. **Playwright E2E** – A Playwright script executes the full user flow (open chat, send prompt, receive response, verify tool‑rendered card, queue label disappears) and passes on CI. *Verification*: GitHub Actions run the script and report success.
3. **Netlify deployment** – The GitHub Actions workflow builds the static export and automatically deploys it to Netlify. *Verification*: After CI passes, the Netlify URL shows the updated site and Lighthouse scores > 90.
4. **Docker image** – The Dockerfile produces a container that starts the backend on the configured `PORT` and serves a `/health` endpoint returning HTTP 200. *Verification*: `docker build -t gach-backend . && docker run -p 8080:8080 gach-backend` then `curl -s http://localhost:8080/health` returns `{"status":"ok"}`.
5. **Environment variables** – The container reads `LLM_URL`, `PORT`, and `NODE_ENV`. *Verification*: Run the container with `-e LLM_URL=http://mock-llm -e PORT=8080 -e NODE_ENV=production` and confirm the server uses them (log output or request to `/chat`).
6. **Lighthouse score** – The deployed Netlify site scores ≥ 90 on performance, accessibility, best practices, and SEO. *Verification*: `npx lighthouse <netlify-url> --quiet --chrome-flags="--headless"` and check the JSON/report for scores.
7. **Health verification** – The Docker container health check (`curl /health`) succeeds before the PR is merged. *Verification*: CI step runs the curl command and fails if the response is not 200.

## Approach

1. **Backend** – Add `Dockerfile` (multi‑stage: builder with Node 22, runtime with `node:22-slim`). Update `backend/package.json` with a `start` script (`node dist/src/server.js`). Ensure the existing Express app reads the env vars.
2. **Frontend** – Modify `ChatOverlay` to POST to `${process.env.NEXT_PUBLIC_API_URL}/chat` (configurable via `.env.local`). Add handling of the `tool` field to render a `ProjectCard` component.
3. **CI workflow** – Extend `.github/workflows/ci.yml`:
   - Build Next.js (`npm run build && npm run export`).
   - Run Playwright tests (`npm run test:e2e`).
   - On success, use Netlify CLI to deploy the `out/` folder.
   - Build Docker image, run container, execute health check.
4. **Playwright tests** – Add `tests/e2e/chat.spec.ts` implementing the flow described in AC 2.
5. **Documentation** – Update `README.md` with deployment instructions, env var list, and how to run the Docker container locally.

## Files likely touched / added

- `frontend/src/components/ChatOverlay.tsx`
- `frontend/src/components/ProjectCard.tsx` (new UI component)
- `frontend/.env.local` (API URL)
- `frontend/tests/e2e/chat.spec.ts`
- `backend/Dockerfile`
- `backend/package.json` (add `start` script)
- `.github/workflows/ci.yml` (add Netlify deploy, Docker build, health check)
- `README.md` (deployment section)

## Depends on

- Phase 3 – Frontend page migration (global layout in place).
- Phase 4 – Chat UI components exist.
- Phase 5 – Backend scraper and data endpoints.
- Phase 6 – Backend `/chat` endpoint, rate‑limit middleware, and caching.

## Tasks (ordered checklist)

| # | Task | Verification | AC Covered |
|---|------|--------------|------------|
| 1 | Create `Dockerfile` (multi‑stage) and add `start` script. | `docker build` succeeds; container starts and `/health` returns 200. | 4,5,7 |
| 2 | Update backend to read `LLM_URL`, `PORT`, `NODE_ENV`. | Logs show correct env values; `/chat` works with provided LLM URL. | 5 |
| 3 | Add `ProjectCard` component for tool rendering. | Component renders when `tool` field present. | 1 |
| 4 | Wire `ChatOverlay` POST to backend `/chat` and display `message` and `tool` UI. | Manual test: chat shows backend response and project card. | 1 |
| 5 | Add `.env.local` with `NEXT_PUBLIC_API_URL` and update config. | `npm run dev` picks up env var; API calls succeed. | 1 |
| 6 | Write Playwright e2e test covering full chat flow. | CI runs `npm run test:e2e` and passes. | 2 |
| 7 | Extend CI workflow: build Next.js, run Playwright, deploy to Netlify, build Docker, run health check. | GitHub Actions shows all steps passing; Netlify URL updated. | 2,3,6,7 |
| 8 | Update `README.md` with Docker run instructions and deployment notes. | README matches actual steps; `make docs` (manual) succeeds. | – |
| 9 | Push branch, open PR, verify CI passes and all acceptance criteria met. | PR shows green checks; manual review confirms UI behavior. | All |

## Test Plan

- **Unit** – Existing backend unit tests remain unchanged.
- **Integration** – Supertest requests to `/chat` inside Docker container.
- **E2E** – Playwright script as described in AC 2.
- **Performance** – Lighthouse report on Netlify URL.
- **Health** – CI step `curl -f http://localhost:${PORT}/health`.

## Assumptions

- The Netlify site can be deployed via the Netlify CLI token stored as a secret in GitHub Actions.
- The developer’s server has Docker installed and can expose the configured `PORT`.
- The mock LLM service is reachable at the `LLM_URL` provided.
- No additional database migrations are needed beyond Phase 5.

## Risks

- **Docker image size** – If the build includes unnecessary dev dependencies, the image may be large. Mitigation: multi‑stage build with only production deps.
- **Netlify rate limits** – Frequent CI deployments could hit Netlify API limits. Mitigation: limit deployments to PR merges only.
- **Tool‑call UI mismatch** – Rendering of tool responses may differ from design expectations. Mitigation: snapshot testing of `ProjectCard` and manual visual check.
- **Environment variable leakage** – Accidentally committing secrets. Mitigation: use GitHub Actions secrets and `.env.example`.

## Proposed branch name


## Progress log

- Task 1: Created Dockerfile and added start script. Commit pending.
- Task 2: Backend already reads env vars (LLM_URL, PORT, NODE_ENV). Verified usage in code. Commit pending.
- Task 3: Added ProjectCard component. Commit pending.
- Task 4: Updated ChatOverlay to POST to backend and render messages and tool UI. Commit pending.
- Task 5: Added .env.local with NEXT_PUBLIC_API_URL. Commit pending.
- Task 6: Added Playwright dev dependency, test script, and e2e test. Commit pending.
- Task 7: Extended CI workflow with Playwright, Docker build, health check, Netlify deploy steps. Commit pending.

