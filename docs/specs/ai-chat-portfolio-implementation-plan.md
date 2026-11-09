# Implementation Plan for AI‑Chat Portfolio Upgrade (Agent Execution Guide)

**Purpose** – This document breaks the high‑level spec (`docs/specs/ai-chat-portfolio-upgrade.md`) into concrete, bite‑size stages that an autonomous agent can execute sequentially. Each stage contains:

1. **Goal** – what the agent should achieve.
2. **Tasks** – ordered checklist of commands, file edits, or tool invocations.
3. **Verification** – how the agent knows the step succeeded (CLI commands, observable output, test results).
4. **Dependencies** – files or artefacts required from previous stages.

---

## Stage 0 – Repository Preparation

**Goal**: Ensure we are on a clean `main` branch and have a dedicated worktree for the feature.

**Tasks**
1. `git switch main && git pull --ff-only`
2. `git fetch --prune`
3. Delete any stale `agent/*` branches: `git branch -d $(git branch --list 'agent/*' | grep -v main)`
4. Create a new worktree:
   ```bash
   opencode.worktree_create { name: "ai-chat-upgrade" }
   ```
5. `opencode.session_move { directory: "../ai-chat-upgrade" }` (make the new worktree the active session directory).

**Verification**
- `git status` shows we are on a new branch `agent/ai-chat-portfolio-upgrade`.
- `tree -L 2` shows `frontend/`, `backend/`, `scripts/` directories exist (empty at this point).

---

## Stage 1 – Front‑End Foundations

**Goal**: Scaffold a TypeScript Next.js app with Tailwind and Heroicons, and configure CI.

**Tasks**
1. `npx create-next-app@latest frontend --ts --eslint --src-dir`
2. `cd frontend && npm install -D tailwindcss@latest postcss@latest autoprefixer@latest @heroicons/react`.
3. Initialise Tailwind:
   ```bash
   npx tailwindcss init -p
   ```
4. Edit `tailwind.config.js` to add custom colour palette and font families (copy hex values from the live site). Use `edit` tool to replace the `content` array with:
   ```js
   content: ["./src/**/*.{js,ts,jsx,tsx}"]
   ```
   and extend `theme.colors` and `theme.fontFamily` accordingly.
5. Add `src/styles/globals.css` with Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities`).
6. Commit the scaffold:
   ```bash
   git add frontend && git commit -m "Scaffold Next.js with Tailwind & Heroicons"
   ```

**Verification**
- `npm run dev` inside `frontend` starts without errors.
- Opening `http://localhost:3000` shows the default Next.js page styled with Tailwind (no Bootstrap classes).
- `git diff origin/main...HEAD` shows only files under `frontend/`.

---

## Stage 2 – Design Token Extraction

**Goal**: Capture the exact colour values, fonts, and spacing from `https://gach.work/` and store them in Tailwind config.

**Tasks**
1. Use `webfetch` to retrieve the homepage HTML.
2. Manually extract colour hex codes (header background, link colour, button background) and font families (`Poppins`, `Open Sans`).
3. Update `frontend/tailwind.config.js` `theme.extend.colors` and `theme.fontFamily` with those values via the `edit` tool.
4. Run `npm run build` to verify Tailwind compiles the custom palette (search the generated CSS for one of the custom hex values).
5. Commit the design token updates.

**Verification**
- `grep -i "#…" frontend/.next/static/css/*.css` finds the custom colours.
- The site renders with the same visual colours when inspected in the browser.

---

## Stage 3 – Component Library

**Goal**: Build reusable UI primitives that replicate the Bootstrap‑based look using Tailwind.

**Tasks**
1. Create `frontend/src/components/ui/Button.tsx` – accepts `variant` prop (`primary`, `secondary`). Apply Tailwind classes that match the original button colours and hover states.
2. Create `Card.tsx`, `Badge.tsx`, `Container.tsx` with appropriate spacing utilities.
3. Add a simple Storybook (optional) or a temporary page (`/dev`) that renders each component for visual inspection.
4. Commit the `ui/` folder.

**Verification**
- Run `npm run dev` and visit `/dev`; each component matches the design snapshot from the Bootstrap site.
- Lint passes (`npm run lint`).

---

## Stage 4 – Page Migration – Home

**Goal**: Re‑create the Home page (`/`) preserving hero, headline, call‑to‑action buttons.

**Tasks**
1. Create `frontend/src/pages/index.tsx`.
2. Import `Hero` component (to be added) and build the hero section using Tailwind utilities and the colour tokens.
3. Replace Bootstrap grid (`row`, `col`) with Tailwind `grid` / `flex` utilities (`grid-cols-1 md:grid-cols-2`).
4. Use Heroicons for any icons that were previously Bootstrap icons.
5. Add `getStaticProps` that fetches `/static-data/home` from the back‑end (placeholder URL for now).
6. Commit the page.

**Verification**
- `npm run build && npm run export` produces `out/index.html` that visually matches the original home page (compare screenshots).
- Lighthouse audit on the static export shows SEO score ≥ 90.

---

## Stage 5 – Remaining Pages (Skill, Framework, Resume, Portfolio)

**Goal**: Migrate each remaining page using the same component patterns.

**Tasks** (repeat for each page)
1. Create a dedicated page file (`skill.tsx`, `framework.tsx`, `resume.tsx`, `portfolio.tsx`).
2. Build sections with `Section` component (wrapper with bottom margin) and reuse `Card` / `Badge` components.
3. For the Portfolio page, implement a responsive `ProjectGrid` using Tailwind `grid` with `gap-6` and `md:grid-cols-3`.
4. Add hover overlay on `ProjectCard` using Tailwind `group-hover` utilities.
5. Wire `getStaticProps` to fetch the page‑specific JSON slice from the back‑end.
6. Commit each page after it passes local visual inspection.

**Verification**
- After each page is added, run `npm run export` and confirm the generated HTML contains the expected headings and layout.
- Run `npm run lint` across the whole `frontend` folder – no errors.

---

## Stage 6 – Chat UI Integration

**Goal**: Add the floating “Ask about my work” button and the lazy‑loaded chat overlay.

**Tasks**
1. Create `frontend/src/components/ChatButton.tsx` – fixed at bottom‑right, styled with Tailwind, accessible `aria-label`.
2. Create `ChatOverlay.tsx` – a modal using `Dialog` from `@headlessui/react` (or custom). Include:
   - Message list area.
   - Input field.
   - Queue position banner (`You are N in line`).
   - Loading spinner.
3. Implement `useChat` hook that POSTs to the back‑end `/chat` endpoint, handles the `position` field, and parses possible JSON tool calls.
4. Add `ToolRenderer.tsx` that receives a tool payload, calls `GET /entity/:id`, and renders a `ProjectCard` or `SkillBadge` accordingly.
5. Insert `<ChatButton />` into the global `Layout` component so it appears on every page.
6. Commit the chat UI folder.

**Verification**
- Run the dev server, click the button → modal opens.
- Send a test message (you can mock the back‑end with a simple JSON response) and see the reply appear.
- If the response includes `position`, the banner displays correctly.

---

## Stage 7 – Back‑End Setup (Dockerised API)

**Goal**: Provide the API that powers static data, chat, and tool calls.

**Tasks**
1. Initialise `backend/` (`npm init -y`), install `express`, `better-sqlite3`, `axios`, `dotenv`, `cors`, `helmet`, `node-cache`.
2. Create `src/index.ts` – Express server with CORS, JSON body parser, health route.
3. Implement `src/routes/staticData.ts`, `entity.ts`, `chat.ts`, `admin.ts` as described in the high‑level spec.
4. Add middleware `rateLimit.ts` (max 2 concurrent per IP) and `cache.ts` (LRU for starter prompts).
5. Write `scripts/scrape.ts` that uses `node-fetch` + `cheerio` to pull the five public pages, parse headings, paragraphs, lists, and image URLs, then store them in `backend/data/portfolio.db`.
6. Add a Dockerfile (multi‑stage) that copies source, runs `npm ci`, and starts `node dist/index.js`.
7. Build the image locally to verify:
   ```bash
   docker build -t gach-backend .
   docker run -p 8080:8080 gach-backend
   ```
   then `curl http://localhost:8080/health` should return `{"status":"ok"}`.
8. Commit all backend files.

**Verification**
- Unit tests (`npm test`) pass (we will add them in the next stage).
- `docker run` container responds to all defined endpoints with correct JSON shapes.

---

## Stage 8 – Automated Tests (API + E2E)

**Goal**: Ensure regression safety.

**Tasks**
1. Add Jest + Supertest to `backend/` (`npm i -D jest supertest ts-jest @types/jest`). Configure `jest.config.js`.
2. Write test suites for each route (`staticData.test.ts`, `chat.test.ts`, `rateLimit.test.ts`). Include a test that sends three concurrent `/chat` requests and asserts one receives a `position` field.
3. In `frontend/`, add Playwright (or Cypress) scripts that:
   - Load the Netlify URL.
   - Open the chat overlay.
   - Send a starter prompt and verify a `ProjectCard` appears.
4. Add a npm script `test:e2e` that runs the Playwright suite against the deployed Netlify preview URL.
5. Run `npm test` (backend) and `npm run test:e2e` (frontend) locally; ensure all pass.
6. Commit the `tests/` directories.

**Verification**
- CI pipeline reports **All tests passed**.
- Locally, `npm test` exits with code 0 and Playwright reports success.

---

## Stage 9 – CI/CD Pipeline

**Goal**: Automate lint, test, build, and deployment.

**Tasks**
1. Create `.github/workflows/ci.yml` with jobs:
   - **lint**: `npm run lint` for both `frontend` and `backend`.
   - **test**: run backend Jest tests and frontend Playwright E2E against a Netlify preview.
   - **build**: `npm run build && npm run export` (frontend) and `docker build` (backend).
   - **deploy**: if all previous steps pass, use Netlify CLI (`netlify deploy --prod`) to push the `frontend/out` folder.
2. Add a secret `LLM_URL` and `ADMIN_TOKEN` in the repository settings for the back‑end.
3. Push the branch and verify the GitHub Actions run to completion.

**Verification**
- GitHub Actions workflow shows **All checks passed** on the PR.
- Netlify site updates automatically and displays the latest static pages.

---

## Stage 10 – Final QA & Release

**Goal**: Perform a last round of manual verification and merge.

**Tasks**
1. Open the live Netlify URL.
2. Confirm colour palette, fonts, layout, and responsive breakpoints match the original site.
3. Test the chat overlay on desktop and mobile; ensure queue messages appear correctly and tool‑call cards render.
4. Run Lighthouse on the live URL – target > 90 for Performance, Accessibility, SEO.
5. Run `gh pr create` with a descriptive title and body linking back to the spec file.
6. Invoke the `@reviewer` subagent on the PR and incorporate any findings.
7. Merge the PR (if approved) – the branch will be automatically deleted by the repo policy.

**Verification**
- All manual checks pass, Lighthouse scores meet targets.
- PR shows **Reviewed** and **Approved** status.
- Main branch now contains the upgraded portfolio and the AI chat overlay.

---

## Summary Checklist (for the agent)
- [ ] Stage 0 – repo & worktree ready
- [ ] Stage 1 – Next.js scaffold with Tailwind
- [ ] Stage 2 – design tokens imported
- [ ] Stage 3 – UI component library
- [ ] Stage 4 – Home page rebuilt
- [ ] Stage 5 – Skill, Framework, Resume, Portfolio pages rebuilt
- [ ] Stage 6 – Chat button & overlay integrated
- [ ] Stage 7 – Backend API Dockerised
- [ ] Stage 8 – Automated unit & end‑to‑end tests
- [ ] Stage 9 – CI/CD workflow configured
- [ ] Stage 10 – Final QA, PR, review, merge

Each bullet corresponds to a concrete stage described above; the agent should only progress to the next stage after the **Verification** step for the current stage succeeds.

---

*End of implementation plan.*