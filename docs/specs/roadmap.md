# Goal

Upgrade the **gach.work** portfolio to a modern **React (Next.js) + TypeScript** static site while preserving the existing visual design (dark header, light body, same fonts, layout, and subtle animations) and adding a site‑wide AI‑driven chat overlay that is grounded to factual data scraped from the live site. The front‑end will be deployed to Netlify and the back‑end (Express API, SQLite store, Docker container) will run on the developer’s own server.

---

# Phases

| # | Name | Deliverable | Verification (what can be checked) | Dependencies | Branch (for PR) |
|---|------|-------------|-----------------------------------|--------------|-------------------|
| 1 | **Scaffold & CI** | Create the monolithic folder layout (`frontend/`, `backend/`, `scripts/`, `.github/workflows/`), add a minimal `.gitignore`, and a basic GitHub Actions workflow that runs `npm ci` for both sub‑projects. | `git status` shows a clean repo; CI pipeline passes lint on empty projects. | None (initial state) | `agent/phase-1-scaffold-ci` |
| 2 | **Frontend foundation** | Initialise a Next.js TypeScript app in `frontend/`, install Tailwind CSS & Heroicons, configure `tailwind.config.js` with the exact colour palette and fonts from the existing site, and add placeholder pages (`index.tsx`, `skill.tsx`, …) that use the new layout components. | `npm run dev` starts without errors; `npm run build && npm run export` produces an `out/` folder; Lighthouse on the placeholder site scores ≥ 80. | Phase 1 | `agent/phase-2-frontend-foundation` |
| 3 | **Frontend page migration** | Re‑create each portfolio page (Home, Skill, Framework, Resume, Portfolio) using Tailwind utilities and the design tokens, preserving the visual hierarchy and responsive breakpoints. | Visual comparison with the live Bootstrap site shows no noticeable differences; Lighthouse scores ≥ 90 for performance, accessibility, and SEO; no Bootstrap classes remain. | Phase 2 | `agent/phase-3-frontend-pages` |
| 4 | **Chat UI (frontend only)** | Add a floating **ChatButton** component that opens a lazy‑loaded **ChatOverlay** modal on every page. The overlay shows a queue label placeholder and can display static demo messages. | Clicking the button opens the modal; queue label appears when a mock “position” is supplied; no console errors. | Phase 3 | `agent/phase-4-chat-ui` |
| 5 | **Backend scaffold & scraper** | Initialise an Express TypeScript project in `backend/`, add SQLite support, and implement `scripts/scrape.ts` that fetches the five public pages of gach.work, extracts headings, paragraphs, lists, and image URLs, and writes them to `backend/data/portfolio.db`. Provide `GET /static-data/:page` and `GET /entity/:id` endpoints that read from this DB. | Running `npm run dev` starts the server; `curl http://localhost:8080/static-data/home` returns JSON with the expected structure; the SQLite file contains rows for each extracted entity. | Phase 1 | `agent/phase-5-backend-scraper` |
| 6 | **Backend chat endpoint & rate‑limit** | Implement `POST /chat` that builds a system prompt (strict grounding to the DB), calls the self‑hosted LLM (placeholder mock for now), parses optional JSON tool calls, and returns `{message, tool?, position?}`. Add middleware for a per‑IP concurrency limit of **2** and a FIFO queue that returns a `position` field. Cache the four starter prompts. | Unit tests (Jest + Supertest) verify: <br>• A normal request returns a message. <br>• Three concurrent requests from the same IP result in one response containing `{position:2}`. <br>• Re‑sending a starter prompt hits the cache (response < 100 ms). | Phase 5 | `agent/phase-6-backend-chat` |
| 7 | **Full integration & deployment** | Wire the frontend **ChatOverlay** to the real `/chat` endpoint, ensure tool‑call rendering works, run end‑to‑end Playwright tests, and deploy the frontend static export to Netlify (manual first deployment). The backend runs in a Docker container on the developer’s server. | Playwright script passes (chat opens, prompt answered, project card rendered, queue label disappears). <br>Live Netlify URL passes Lighthouse > 90 on all metrics. <br>Docker container serves `/health` and `/chat` correctly. | Phases 3, 4, 5, 6 | `agent/phase-7-integration-deploy` |

---

# Status

- **Phase 1**: merged
- **Phase 2**: merged
- **Phase 3**: merged
- **Phase 4**: merged
- **Phase 5**: merged
- **Phase 6**: not started
- **Phase 7**: not started

Each phase is sized to fit inside a single PR that can be reviewed and merged without breaking `main`. The roadmap respects the overall goal (modern React site with AI chat), the constraint to keep the existing visual design, and the “done” definition (live Netlify site + working chat overlay with Lighthouse > 90).
