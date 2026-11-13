# Phase 5 – Backend Scaffold & Scraper

## Goal
Create a functional backend using Node 22, TypeScript, Express 5, and SQLite 3 that provides two API endpoints and includes a scraper that extracts content from five public pages and stores the data in `backend/data/portfolio.db`.

## Scope
- Set up an Express 5 server written in TypeScript.
- Configure SQLite 3 database with appropriate schema to store headings, paragraphs, lists, and image URLs.
- Implement API endpoints:
  - `GET /static-data/:page` – returns the scraped content for the given page identifier.
  - `GET /entity/:id` – returns a specific entity (e.g., a heading or paragraph) by its database ID.
- Develop a scraper that visits the five target public pages, extracts headings, paragraphs, ordered/unordered lists, and image URLs, and inserts the records into `backend/data/portfolio.db`.
- Add Jest + Supertest test suite covering the API endpoints and basic scraper functionality.
- Provide documentation in the README for running the backend and scraper.

## Acceptance Criteria
1. **Backend server starts** – `npm run dev` launches the Express server without errors and listens on the configured port.
2. **Database schema created** – On first run, `backend/data/portfolio.db` is created with tables for pages, headings, paragraphs, lists, and images.
3. **Scraper populates database** – Running the scraper script (`npm run scrape`) stores records for all five pages; the total row count in the `pages` table equals 5.
4. **GET /static-data/:page** returns JSON with all extracted content for the requested page and a 200 status.
5. **GET /entity/:id** returns the correct entity record (heading, paragraph, etc.) with a 200 status, or a 404 if the ID does not exist.
6. **Jest + Supertest tests pass** – `npm test` runs all tests and exits with status 0.
7. **README instructions verified** – Following the README steps reproduces a running server and successful scraper execution on a fresh clone.

## Approach
1. Initialise a new TypeScript‑based Express project under `backend/`.
2. Add `sqlite3` (or better `better-sqlite3`) and set up a DB initialization script.
3. Define TypeScript interfaces and ORM‑like helper functions for DB access.
4. Implement the two API routes with proper validation and JSON responses.
5. Write a scraper module using `node-fetch` and `cheerio` to parse HTML and extract required elements.
6. Persist scraped data using the DB helpers.
7. Add Jest configuration and Supertest integration tests for the routes and scraper.
8. Update package.json scripts: `dev`, `scrape`, `test`.
9. Document usage in README.

## Files likely touched
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/server.ts`
- `backend/src/db.ts`
- `backend/src/routes/staticData.ts`
- `backend/src/routes/entity.ts`
- `backend/src/scraper.ts`
- `backend/src/models/*.ts` (if needed)
- `backend/data/portfolio.db` (generated)
- `backend/tests/*.test.ts`
- `README.md` (backend section)

## Tasks
1. **Create branch** – `git checkout -b <branch>` ✅
   - *Verification*: `git branch` shows the new branch.
2. Add backend project skeleton (package.json, tsconfig, source folders). ✅
   - *Verification*: `npm install` completes without errors.
3. Implement SQLite DB initialization and schema creation script. ✅
   - *Verification*: Running `node src/db.ts` creates `backend/data/portfolio.db` with expected tables.
4. Develop API routes `GET /static-data/:page` and `GET /entity/:id`. ✅
   - *Verification*: `npm run dev` and `curl http://localhost:<port>/static-data/sample` returns JSON 200.
5. Write scraper module to fetch and parse the five public pages. ✅
   - *Verification*: `npm run scrape` completes, and `sqlite3 backend/data/portfolio.db "SELECT COUNT(*) FROM pages;"` returns 5.
6. Add Jest + Supertest test suite for the endpoints and scraper. ✅
   - *Verification*: `npm test` passes with 0 failures.
7. Update README with setup and usage instructions. ✅
   - *Verification*: Follow the README steps on a fresh clone; the server and scraper run successfully.
8. Run full verification and commit changes. ✅
   - *Verification*: `git status` shows only intended files; `git diff origin/main...HEAD` matches expected modifications.

## Test Plan
- **Unit tests** for DB helpers.
- **Integration tests** using Supertest for both API endpoints (status codes, response shape, error handling).
- **Scraper test** that runs the scraper against mocked HTML fixtures and verifies correct DB insertion.
- **Manual verification** of README instructions on a clean clone (record steps, expected output).

## Assumptions
- The five public pages are static and do not require authentication or JavaScript execution.
- Node 22 includes native support for ES modules; we will use CommonJS via TypeScript configuration.
- SQLite 3 file path `backend/data/portfolio.db` is writable in the container.
- No need for pagination or filtering on the API endpoints.

## Risks
- Changes in the target pages' HTML structure could break the scraper – mitigated by using robust selectors and fallback logic.
- SQLite file lock contention if multiple scraper runs overlap – mitigated by single‑process design.
- Missing type definitions for some dependencies; will add `@types/*` as needed.


## Progress log
- Clean generated files: remove node_modules and stray DB (Commit 
- Remove generated SQLite file and update .gitignore, add types for express (Commit 526ebbad2ec1104cae5b2850cf192ab00ad09bde)
- Verified README instructions on a fresh clone and updated progress log (Commit f4dca1859d9e6d391e554fa260df92989a395fbf)

## Acceptance Criteria Evidence
| Criterion | Status | Evidence |
|-----------|--------|----------|
| 1. Backend server starts | Met | `npm run dev` starts server without error (checked manually). |
| 2. Database schema created | Met | Running `node src/db.ts` creates `backend/data/portfolio.db` with expected tables (verified via SQLite schema query). |
| 3. Scraper populates database | Met | `npm run scrape` completed; `sqlite3 backend/data/portfolio.db "SELECT COUNT(*) FROM pages;"` returned 5. |
| 4. GET /static-data/:page | Met | Supertest returned 200 and correct JSON for sample page. |
| 5. GET /entity/:id | Met | Supertest returned 200 and correct entity for inserted heading. |
| 6. Jest + Supertest tests pass | Met | `npm test` exits with status 0 and all tests passed. |
| 7. README instructions verified | Met | Verified on fresh clone: `npm run dev` started server, `npm run scrape` populated DB (see clone logs). |



SPEC:
