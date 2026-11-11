# Goal

Create a solid Next.js (TypeScript) foundation for the portfolio site, including Tailwind CSS, Heroicons, a reusable `Layout` component, placeholder pages (`index`, `skill`, `framework`, `resume`, `portfolio`), strict TypeScript settings, a Jest + React‑Testing‑Library test setup, and a local Lighthouse script. The result should be a clean, lint‑free codebase that builds to a static `out/` directory and scores ≥ 80 on Lighthouse when run locally.

# Scope
- Initialise a Next.js 13 (app router) project in `frontend/` with the `--ts` flag.
- Enable **strict** TypeScript mode (`tsconfig.json` `"strict": true`).
- Install **Tailwind CSS v4 (latest stable)** and configure it with the colour palette & fonts used by the existing site (values copied from the design tokens in the current repository, if any, otherwise placeholders).
- Install **@heroicons/react** for icons.
- Create a top‑level `components/Layout.tsx` that provides the dark header / light body structure and applies Tailwind’s design tokens.
- Add placeholder pages (`pages/index.tsx`, `pages/skill.tsx`, `pages/framework.tsx`, `pages/resume.tsx`, `pages/portfolio.tsx`) that import `Layout` and display a simple heading.
- Add Jest + React‑Testing‑Library configuration (`jest.config.js`, `setupTests.ts`) with a basic smoke test for the `Layout` component.
- Add an npm script `lighthouse` that runs `npx lighthouse http://localhost:3000 --quiet --chrome-flags="--headless"` and fails if the performance score is < 80.
- Verify linting (`npm run lint`) and formatting (`npm run format`) pass.
- Ensure the CI workflow from Phase 1 continues to pass without modification.

# Acceptance Criteria
1. **Repository layout preserved** – `frontend/` contains a valid Next.js project with `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`.
2. **Strict TypeScript** – `frontend/tsconfig.json` includes `"strict": true` and `npm run build` succeeds with no type errors.
3. **Tailwind & Heroicons installed** – `npm ls tailwindcss @heroicons/react` lists the latest versions; `tailwind.config.js` contains the custom colour and font settings.
4. **Layout component** – `components/Layout.tsx` renders without runtime errors and applies the dark header / light body style.
5. **Placeholder pages** – All five pages render in the browser (`npm run dev`) and display a heading inside `Layout`. No 404s.
6. **Jest + RTL setup** – `npm test` runs and passes at least one test (`Layout renders`). Coverage report generated.
7. **Lighthouse script** – Running `npm run lighthouse` after `npm run dev` yields a performance score ≥ 80; the script exits with code 0 only on success.
8. **CI passes** – The existing GitHub Actions workflow (Phase 1) runs on push, executes `npm ci` and `npm run lint` for `frontend/` and `npm test` for `frontend/`, and also runs a static export verification.

# Approach
1. **Branch** – `git switch -c agent/phase-2-frontend-foundation`.
2. **Scaffold** – `npx create-next-app@latest frontend --ts --eslint --src-dir --app`.
3. **Enable strict mode** – edit `frontend/tsconfig.json` to set `"strict": true`.
4. **Add Tailwind** – `npm i -D tailwindcss@latest postcss@latest autoprefixer@latest @tailwindcss/postcss`; run `npx tailwindcss init -p`; update `tailwind.config.js` with the design tokens.
5. **Add Heroicons** – `npm i @heroicons/react`.
6. **Create Layout** – `components/Layout.tsx` with header, main, footer (static year).
7. **Add pages** – For each of the five pages, create `src/app/<name>/page.tsx` that imports `Layout` and renders a heading.
8. **Testing setup** – `npm i -D jest ts-jest @testing-library/react @testing-library/jest-dom @types/jest`; create `jest.config.js`, `setupTests.ts`, and a sample test `components/__tests__/Layout.test.tsx`.
9. **Lighthouse script** – Add script in `frontend/package.json`.
10. **Update CI** – Extend `.github/workflows/ci.yml` to run `npm run build && test -d out` and `npm test` for frontend.
11. **Run verification** – Execute each AC command locally, commit changes, push branch, ensure CI passes.

# Test Plan
- Run `npm run lint` in `frontend/` – must exit 0.
- Run `npm test` – passes layout test.
- Run `npm run build && test -d out` – out folder exists.
- Run `npm run lighthouse` – performance ≥ 80 (manual).

# Assumptions
- Design tokens are available as CSS variables; Tailwind config maps to them.
- Node 20 is installed locally and on CI runners.
- No secret values are required at this stage.

# Risks
- Tailwind configuration may miss a token, causing visual mismatch; mitigated by visual inspection after building.
- Lighthouse script depends on Chrome; currently scoped to local runs only.
- Jest setup may conflict with Next.js’s built‑in testing conventions; mitigated by using the official `ts-jest` preset.

# Depends on
- Phase 1 – Scaffold & CI (`docs/specs/phase-1-scaffold-ci.md`)

# Branch
`agent/phase-2-frontend-foundation`

## Progress log
- Added Tailwind CSS configuration and PostCSS setup.
- Created `Layout` component with **dynamic year**.
- Added placeholder pages for index, skill, framework, resume, portfolio.
- Set up Jest + React Testing Library with a Layout smoke test.
- Added Lighthouse script.
- Updated CI workflow to verify static export, run tests, and execute Lighthouse.
- Refined Tailwind config with **exact colour palette** values.
- Added `export` script and CI build+export verification.
- Updated roadmap status: Phase 2 marked as merged.
