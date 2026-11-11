# Goal

Re‑implement the five portfolio pages (Home, Skill, Framework, Resume, Portfolio) in the Next.js frontend using Tailwind CSS, removing all Bootstrap markup while preserving the exact visual appearance of the live site.

# Scope
- Recreate the HTML structure, text, images, and interactive elements of each page using Tailwind utility classes.
- Ensure full responsive behavior (mobile, tablet, desktop) matches the current site.
- Use **all** design tokens (colours, fonts, spacing, shadows, etc.) from the original design.
- Provide static placeholder content (no live data fetching).
- Add a basic smoke test for each page that renders without runtime errors.

# Out of scope
- Backend data integration (Phase 5 will handle that).
- New features or redesign beyond visual fidelity.
- Internationalisation or accessibility audits beyond what is already covered by existing Tailwind config.

# Acceptance Criteria
1. **Visual fidelity** – For each page, a side‑by‑side visual comparison with the live Bootstrap page shows no noticeable differences (colour, typography, spacing, component layout).
2. **No Bootstrap** – After migration, a grep for `bootstrap` or any `class="... col-` patterns returns no matches in the `frontend/` source.
3. **Full responsiveness** – Using Chrome dev tools (or `npm run test:responsive`), each page renders correctly at breakpoints 320 px, 768 px, and 1024 px with no overflow or layout breakage.
4. **All design tokens used** – The Tailwind config contains the full colour palette, font families, and spacing scale from the original site; `npm ls tailwindcss` confirms the config is applied without overrides.
5. **Static placeholders** – All pages display placeholder headings and dummy text/images; no network requests to the backend are made (verify with browser dev tools → Network).
6. **Per‑page smoke tests** – `npm test` runs a Jest/RTL test for each page that mounts the component and asserts the heading is in the document. All tests pass.
7. **CI passes** – The existing `.github/workflows/ci.yml` runs lint, test, and build for the frontend and reports a passing status.

# Approach
1. Create a new branch `agent/phase-3-frontend-pages`.
2. For each page:
   - Copy the HTML from the live site (via `curl` or manual inspection).
   - Translate Bootstrap classes to Tailwind utilities, referencing the design‑token list in `tailwind.config.js`.
   - Replace any inline styles with Tailwind equivalents.
   - Move images to `public/` and reference them via Next.js `Image` component where appropriate.
3. Remove any remaining Bootstrap imports or CSS files.
4. Add a simple React component for each page under `src/app/<page>/page.tsx` that uses the shared `Layout`.
5. Write a Jest + React‑Testing‑Library test file `src/app/<page>/__tests__/page.test.tsx` that renders the page and checks for the main heading.
6. Run Lighthouse on each page to verify visual parity (manual check).
7. Update CI workflow to include `npm test` for the new pages (already present).

# Files likely touched / added
- `frontend/tailwind.config.js` (verify token usage)
- `frontend/src/app/home/page.tsx`, `frontend/src/app/skill/page.tsx`, `frontend/src/app/framework/page.tsx`, `frontend/src/app/resume/page.tsx`, `frontend/src/app/portfolio/page.tsx`
- `frontend/src/app/home/__tests__/page.test.tsx` (and equivalents for other pages)
- `frontend/public/` (add any copied images)
- Possible removal of `frontend/src/styles/bootstrap.css` or similar import lines

# Tasks (ordered checklist)

| # | Task | Verification | AC Covered |
|---|------|--------------|------------|
| 1 | `git switch -c agent/phase-3-frontend-pages` | `git branch` shows new branch | – |
| 2 | Create placeholder Tailwind pages for Home, Skill, Framework, Resume, Portfolio | `ls src/app/<page>/page.tsx` exists for each | 5 |
| 3 | Translate Bootstrap markup to Tailwind utilities (use design tokens) | Run `npm run lint` – no `bootstrap` class warnings | 1,2,4 |
| 4 | Add images to `public/` and reference via `next/image` | `npm run dev` – pages load images without 404 | 5 |
| 5 | Ensure responsive Tailwind breakpoints are used (`sm:`, `md:`, `lg:`) | Open each page at 320 px, 768 px, 1024 px – layout unchanged | 3 |
| 6 | Write per‑page smoke test (`__tests__/page.test.tsx`) | `npm test` passes all new tests | 6 |
| 7 | Run a visual diff script (manual) – open live site vs dev site side‑by‑side | Confirm AC 1 by visual inspection | 1 |
| 8 | Grep for any remaining Bootstrap references | `grep -R "bootstrap" frontend/` returns nothing | 2 |
| 9 | Commit changes with clear message | `git status` clean, `git diff origin/main...HEAD` shows only intended files | – |
|10| Push branch & open PR | `git push -u origin HEAD`; PR shows passing CI | 7 |

# Test Plan
- Run `npm run lint` (both sub‑projects).
- Execute `npm test` – all new page tests must pass.
- Manually open each dev page at the three breakpoints and verify layout.
- Perform a visual side‑by‑side comparison with the live site (e.g., Chrome “Compare” extension or manual screenshot).
- Run `grep -R "bootstrap" frontend/` to ensure no leftover Bootstrap code.

# Assumptions
- The live site’s HTML is accessible for copying (e.g., via `curl https://gach.work/<page>`).
- Design token values are already defined in the Tailwind config from Phase 2.
- No custom JavaScript from the old Bootstrap pages is required for visual fidelity (e.g., modals, carousels).
- Developers have Node 20 and required global tools installed.

# Risks
- Mis‑translation of complex Bootstrap grid layouts could lead to subtle spacing differences. Mitigation: iterative visual diff and use of Tailwind’s `gap`, `grid-cols`, `flex` utilities.
- Missing image assets may cause 404s; mitigation: verify all image URLs and copy missing files into `public/`.
- Over‑reliance on manual visual checks; mitigation: keep a checklist of key UI elements per page.

# Proposed branch name
`agent/phase-3-frontend-pages`

---

*If any of the above assumptions or acceptance criteria need adjustment, please let me know before I finalize the spec.*