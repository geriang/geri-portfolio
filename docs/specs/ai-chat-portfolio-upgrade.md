# Goal

Upgrade the existing **gach.work** portfolio from a static Bootstrap template to a modern **React (Next.js) + TypeScript** site while preserving the current sleek visual identity (dark header, light body, same fonts, layout, and subtle animations). Add a site‑wide AI‑driven chat overlay that is grounded to factual data scraped from the live site.

---

# Scope

- **Front‑end**: Separate `frontend/` repository (Next.js static export) using Tailwind CSS, Heroicons, and the same colour palette, fonts, layout, and animations as the current site. Include a persistent "Ask about my work" button that opens a React modal chat overlay on every page.
- **Back‑end**: Separate `backend/` repository (Node + Express, TypeScript, Docker) that:
  - Scrapes the live site **once** and stores content in an SQLite DB (`backend/data/portfolio.db`).
  - Exposes `GET /static-data/:page`, `GET /entity/:id`, `POST /chat` (rate‑limited, FIFO queue, starter‑prompt cache), `GET /health`, and a protected `POST /admin/scrape`.
- **Chat overlay**: React component (`ChatOverlay`) that handles queue UI, streams responses, and renders tool calls (project cards, skill badges, etc.).
- **Testing**: Manual QA checklist, Jest + Supertest for API, Playwright end‑to‑end test for the deployed Netlify site.
- **Documentation**: README, `HOW_IT_WAS_BUILT.md` and the spec file.
- **CI/CD**: GitHub Actions workflow that lints, tests, builds the front‑end static export, builds the backend Docker image, and optionally triggers a Netlify deploy.

---

# Out of Scope

- Periodic re‑scraping (only manual trigger).
- Full security hardening beyond basic CORS, rate‑limiting, and a secret token for the admin route.
- Adding new UI sections that do not already exist on the current site.
- Internationalisation / theming beyond the existing colour palette.

---

# Approach

## 1. Repository Layout
```
repo-root/
│
├─ frontend/          # Next.js React app (static export)
├─ backend/           # Express API (Dockerised)
├─ scripts/           # Scraper and helper utilities
├─ .github/workflows/ # CI/CD
├─ docs/specs/        # Spec files (this file lives here)
└─ README.md
```

## 2. Front‑end Implementation
1. Initialise a Next.js TypeScript project (`npx create-next-app@latest --ts`).
2. Install Tailwind CSS, Heroicons, and optionally `framer-motion` for animations.
3. Copy the exact colour values, font families (Google Fonts), and spacing from the live site into `tailwind.config.js`.
4. Recreate each page (`index.tsx`, `skill.tsx`, `framework.tsx`, `resume.tsx`, `portfolio.tsx`) using Tailwind utilities, preserving the hero, two‑column sections, and project‑card grid.
5. Implement reusable components:
   - `Layout`, `NavBar`, `Hero`, `Section`, `ProjectCard` (hover overlay), `SkillBadge`, `Timeline`, `ChatButton`, `ChatOverlay`, `ToolRenderer`.
6. Add subtle fade/slide animations with Tailwind transitions (or `framer-motion`).
7. Configure `next.config.js` for static export (`output: 'export'`).
8. Add a build script that fetches static data from the backend (`GET /static-data/:page`) at build time.
9. Deploy the built `out/` folder to Netlify.

## 3. Back‑end Implementation
1. Initialise a Node + Express TypeScript project.
2. Add dependencies: `express`, `better-sqlite3`, `axios`, `dotenv`, `cors`, `helmet` (basic security), `node-cache`.
3. Create `scripts/scrape.ts`:
   - Fetch the five public URLs.
   - Parse with `cheerio` to extract headings, paragraphs, lists, and image URLs.
   - Normalise into entities (`type`, `id`, `title`, `content`, `imageUrl`, `link`).
   - Insert/replace into SQLite (`backend/data/portfolio.db`).
4. Implement API routes:
   - `GET /static-data/:page` – returns JSON slice for Next.js build.
   - `GET /entity/:id` – returns full entity for tool rendering.
   - `POST /chat` – builds a system prompt that forces the model to answer only from DB, calls the self‑hosted LLM (`LLM_URL` env var), parses optional JSON tool calls, returns `{message, tool?, position?}`.
   - `GET /health` – simple health check.
   - `POST /admin/scrape` – protected by `X‑Admin‑Token` header, triggers `scripts/scrape.ts`.
5. Add middleware:
   - Rate‑limit per IP (`MAX_CONCURRENCY=2`).
   - FIFO queue for excess requests, returning queue position.
   - In‑memory LRU cache for the four starter prompts.
6. Dockerfile (multi‑stage) that copies source, runs `npm ci`, and starts the server.
7. Expose port 8080 and set environment variables via `.env`.

## 4. Chat Overlay
1. `ChatButton` – fixed‑position floating button on every page.
2. `ChatOverlay` – lazy‑loaded modal containing:
   - Message list.
   - Input field.
   - Queue label (`You are N in line`).
   - Loading spinner.
3. On send, POST to `/chat`; handle response:
   - If `tool` present, call `GET /entity/:id` and render via `ToolRenderer`.
   - If plain text, append to chat.
4. Graceful fallback UI when the backend is offline.

## 5. Testing
- **Manual QA** checklist (layout, colours, fonts, responsive breakpoints, animations, chat flow).
- **API unit tests** with Jest + Supertest for each endpoint, rate‑limit, queue, cache.
- **End‑to‑end** Playwright script that:
  1. Visits the Netlify URL.
  2. Opens the chat on each page.
  3. Sends a starter prompt.
  4. Asserts the correct project card appears.
  5. Checks that the queue label disappears after processing.
- **Failure fallback** test – stop Docker container and verify the chat UI shows the offline message.

## 6. CI/CD (GitHub Actions)
1. Lint (`eslint`, `prettier`).
2. Run back‑end tests.
3. Build front‑end (`npm run build && npm run export`).
4. Build Docker image for back‑end.
5. (Optional) Deploy static folder to Netlify via Netlify CLI.
6. Post a status summary comment on the PR.

---

# Files Likely Touched / Added
```
frontend/
├─ package.json
├─ next.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ tsconfig.json
├─ public/               # favicons, static images
└─ src/
    ├─ pages/
    │   ├─ index.tsx
    │   ├─ skill.tsx
    │   ├─ framework.tsx
    │   ├─ resume.tsx
    │   └─ portfolio.tsx
    ├─ components/
    │   ├─ Layout.tsx
    │   ├─ NavBar.tsx
    │   ├─ Hero.tsx
    │   ├─ Section.tsx
    │   ├─ ProjectCard.tsx
    │   ├─ SkillBadge.tsx
    │   ├─ Timeline.tsx
    │   ├─ ChatButton.tsx
    │   ├─ ChatOverlay.tsx
    │   └─ ToolRenderer.tsx
    └─ styles/globals.css

backend/
├─ Dockerfile
├─ package.json
├─ tsconfig.json
├─ src/
│   ├─ index.ts
│   ├─ routes/
│   │   ├─ chat.ts
│   │   ├─ staticData.ts
│   │   ├─ entity.ts
│   │   └─ admin.ts
│   ├─ middleware/
│   │   ├─ rateLimit.ts
│   │   └─ cache.ts
│   └─ db/sqlite.ts
└─ data/portfolio.db      # generated by scraper

scripts/
├─ scrape.ts               # one‑time scraper
└─ generateStaticData.ts   # optional preview tool

.github/workflows/ci.yml   # CI/CD pipeline

docs/specs/ai-chat-portfolio-upgrade.md   # **this spec**
README.md
```

---

# Tasks (ordered checklist)
1. **Create repository structure** – run `git switch main && git pull --ff-only`, create `frontend/`, `backend/`, `scripts/`, `.github/workflows/` directories.  *(verify `tree` shows new dirs)*
2. **Initialize front‑end** – `npx create-next-app@latest frontend --ts`; install Tailwind, Heroicons.  *(verify `frontend/package.json` exists and `npm run dev` starts without errors)*
3. **Configure Tailwind** – add colour palette, fonts to `tailwind.config.js`.  *(run `npm run build` and ensure no CSS errors)*
4. **Port existing HTML** – copy hero, sections, project listings into Next.js pages using Tailwind classes.  *(verify Netlify preview (`npm run export`) matches visual snapshot of the original site)*
5. **Add reusable components** (`Layout`, `NavBar`, `ProjectCard`, etc.).  *(run `npm run lint` – no errors)*
6. **Implement animations** with Tailwind transitions or `framer-motion`.  *(check animations trigger on scroll in the browser)*
7. **Add ChatButton & ChatOverlay** – lazy load modal, connect to `/api/chat`.  *(verify clicking the button opens modal, shows queue label when needed)*
8. **Initialize back‑end** – `npm init -y` in `backend/`, install dependencies, set up Express server.  *(run `npm run dev` and hit `/health` – returns `{status:"ok"}`)*
9. **Write scraper (`scripts/scrape.ts`)** – fetch pages, parse with `cheerio`, store in SQLite.  *(run script locally, inspect `backend/data/portfolio.db` for rows)*
10. **Create API routes** (`/static-data/:page`, `/entity/:id`, `/chat`, `/admin/scrape`).  *(use `curl` to test each endpoint, verify JSON shape)*
11. **Add rate‑limit & queue middleware** (max 2 concurrent per IP).  *(simulate 3 concurrent `curl` requests, confirm one receives `{position:2}`)*
12. **Implement starter‑prompt cache** – verify repeated call returns cached response instantly.  *(measure response time < 100 ms on second call)*
13. **Dockerise back‑end** – write `Dockerfile`, build image, run container, test `/health`.  *(run `docker run --rm -p 8080:8080 <image>` and `curl http://localhost:8080/health`)*
14. **Write CI workflow** (`.github/workflows/ci.yml`).  *(push a branch and ensure GitHub Actions passes lint, tests, builds)*
15. **Deploy front‑end to Netlify** (manual first deployment).  *(access Netlify URL, verify all pages render and chat button works)*
16. **Run automated tests** – Jest for API, Playwright end‑to‑end.  *(`npm test` passes, Playwright script reports success)*
17. **Write documentation** (`README.md`, `HOW_IT_WAS_BUILT.md`).  *(files exist and contain the described sections)*
18. **Open PR** on `agent/ai-chat-portfolio-upgrade` branch, run @reviewer subagent, incorporate feedback.  *(verify `git diff origin/main...HEAD` only shows intended files)*

---

# Test Plan (summary)
- **Manual UI checks** for colour, font, layout, responsiveness, animations.
- **API unit tests** for each route, rate‑limit, queue, cache behavior.
- **E2E Playwright** validates full user flow: load site → open chat → send prompt → see correct project card.
- **Failure fallback** test by stopping the back‑end container.

---

# Assumptions
- The live site’s colour values, fonts, and layout are the design baseline.
- You will provide the self‑hosted LLM endpoint URL (`LLM_URL`).
- Netlify will proxy `/api/*` to your Mac Studio (via public IP or tunnel).
- Scraper runs only on demand; content rarely changes.
- Tailwind’s default breakpoints are acceptable (chosen by you).
- Heroicons are a satisfactory replacement for Bootstrap icons.

---

# Risks
- **Design drift**: slight differences in spacing or colour. Mitigated by visual diff checks.
- **Animation mismatch**: timing differences; replicate original CSS transition durations.
- **Scraper failures**: missing entities → inaccurate chat answers. Mitigated by local verification of the SQLite DB after each scrape.
- **Queue overload**: users waiting too long. Mitigated by strict per‑IP limit and clear queue messaging.
- **CI/CD breakage**: broken builds. Mitigated by step‑wise pipeline with lint and build verification before deployment.

---

# Proposed branch name
`agent/ai-chat-portfolio-upgrade`
