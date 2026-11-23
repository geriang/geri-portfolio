# Goal

Replicate the UI of https://gach.work/ for the Next.js frontend, replacing the current placeholder pages with faithful Tailwind CSS reproductions of all five pages (Home, Technical Skill, Framework, Resume, Portfolio), matching the visual appearance of the live Bootstrap-based site.

# Scope

- Replicate the Home page hero section: site name, typed text ("AI/GenAI Product Strategist, Manager, Owner, Builder"), hero note, and social links (LinkedIn, GitHub)
- Replicate the Technical Skill page: page title, breadcrumbs, and categorized skill sections (Frontend, Backend, Database, Cloud, Machine Learning, Tools, Certifications & Languages) with colored icons
- Replicate the Framework page: page title, breadcrumbs, and framework categories (Business Framework, Product Management Framework, Product Development Framework) with icon cards
- Replicate the Resume page: page title, breadcrumbs, two-column layout with Summary/Education (left) and Professional Experience (right)
- Replicate the Portfolio page: page title, breadcrumbs, filter tabs (All/Application/Management), and masonry-style portfolio grid with images, info overlays, and detail links
- Replicate the shared header (fixed top nav with site name and menu links) and footer (social links, copyright, credits)
- Use Tailwind CSS only — no Bootstrap classes in frontend source
- Keep existing Layout, ChatButton, ChatOverlay, and ChatContext components intact
- Add per-page Jest + React Testing Library smoke tests
- All content is static placeholder content (no live data fetching)

# Out of Scope

- Backend data integration
- Animated effects (AOS, typed.js, Swiper, GLightbox, Isotope filtering interactivity) — static markup only
- Internationalisation
- Accessibility audits beyond standard Tailwind/semantic HTML

# Acceptance Criteria

1. **Visual fidelity** – Each page matches the corresponding gach.work page in layout, typography, spacing, and colour (manual side-by-side comparison)
2. **No Bootstrap** – `grep -R "bootstrap" frontend/src` returns no matches; no `col-` Bootstrap grid classes
3. **All five pages render** – `npm run dev` loads /, /skill, /framework, /resume, /portfolio without 404s
4. **Responsive** – Pages render correctly at 320px, 768px, and 1024px breakpoints
5. **Per-page smoke tests** – `npm test` passes a Jest/RTL test for each page asserting the main heading is present
6. **Lint passes** – `npm run lint` exits 0
7. **Build succeeds** – `npm run build` succeeds with no type errors
8. **CI passes** – GitHub Actions workflow runs lint, test, and build successfully

# Files Likely Touched / Added

- `frontend/src/app/layout.tsx` — update header and footer to match gach.work design
- `frontend/src/app/page.tsx` — Home hero section
- `frontend/src/app/skill/page.tsx` — Technical Skill page
- `frontend/src/app/framework/page.tsx` — Framework page
- `frontend/src/app/resume/page.tsx` — Resume page
- `frontend/src/app/portfolio/page.tsx` — Portfolio page
- `frontend/src/app/<page>/__tests__/page.test.tsx` — per-page smoke tests (5 files)
- `frontend/tailwind.config.js` — add any missing colour/font tokens
- `frontend/public/` — portfolio images (placeholder or copied)

# Branch

`agent/replicate-gach-work-ui`

# Depends on

- Phase 2 (Frontend foundation) – Tailwind config and Next.js setup
- Phase 3 (Frontend pages) – placeholder pages exist; this replaces them with real content
