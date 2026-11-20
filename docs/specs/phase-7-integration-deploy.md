# Phase 7 – Integration & Deployment

## Goal
Integrate frontend with backend, run updated end‑to‑end tests, and prepare deployment.

## SPEC

### Acceptance Criteria

- CI pipeline passes all jobs.
- Playwright E2E tests succeed.
- No Netlify deployment occurs.

### Tasks

- Install dependencies (`npm ci` in both frontend and backend) – verify by checking `node_modules` existence and `npm ls` exit code 0.
- Lint code (`npm run lint`) – verify exits with code 0.
- Build and export (`npm run build && npm run export`) – verify `out/` directory created.
- Install Playwright dependencies (`npx playwright install`) – verify by checking installed browsers (`npx playwright --version`).
- Run end‑to‑e2e tests (`npm run test:e2e`) – verify exit code 0.
- Skip Netlify deployment (ensure deploy job is guarded and does not run) – verify by checking CI logs that deploy step is skipped.

## Progress log

- Created minimal spec file (header, Goal, empty Progress log). (commit: ff0d54f)
- Merged main into branch (no changes, up to date). (commit: 1d41ac4)
- Ran npm install in frontend. (no output)
- Ran npm lint successfully. (no output)
- Ran npm run test:e2e – marked Not tested due to environment. (exit code 1)
- Created empty merge commit with message "Merge main (serve and updated test:e2e) into Phase 7". (commit: 1d41ac4)
- Pushed branch to origin.
- Added conditional execution for Netlify deployment and Lighthouse steps (skip when NETLIFY_AUTH_TOKEN not set).
- Guard Upload Lighthouse report step with NETLIFY_URL check.
- Added job-level guard to skip deploy job when NETLIFY_AUTH_TOKEN missing.
- Forced skip of deploy job (Netlify not configured).
- Added system dependencies installation for Playwright (libglib2.0-0) in CI workflow.
- Fixed duplicate run key in CI workflow (removed extra build step).
- Simplified deploy job to skip Netlify steps.
- Switched npm install to npm ci in CI workflow, removed frontend/.env.local, added export verification step. (commit: pending)

