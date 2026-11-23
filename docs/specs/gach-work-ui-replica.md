# Spec: Replicate the gach.work UI for the frontend

Status: draft (for user approval)
Branch: `agent/gach-work-ui-replica` (from `origin/main` `5ebddf2`)
Slug: `gach-work-ui-replica`

Authored by the implementing agent at the user's request, from a clarified
interview (four questions) rather than `/interview`. Recorded here so the branch
carries its own spec; deviations from the live site are listed explicitly.

## Problem

`http://localhost:3000/` did not resemble <https://gach.work/>. Root causes found:

1. `frontend/src/app/globals.css` used the v3 `@tailwind base/components/utilities`
   directives and `frontend/tailwind.config.js` extended a theme, but the install
   is Tailwind **v4** (`@tailwindcss/postcss` 4.3.5). v4 ignores
   `tailwind.config.js`, so `bg-background`, `text-foreground`, `font-sans` and
   friends produced no CSS at all.
2. The chrome itself was a placeholder: a 25-line `Layout.tsx` header reading
   `gach.work`, an Arial body, and one "Placeholder content" line per page.

## Goal

Reproduce the look and behaviour of gach.work — the BootstrapMade **Personal**
template (v5.3.3) — across all five routes, using Tailwind only. No Bootstrap,
AOS, typed.js, isotope, swiper or glightbox at runtime.

## Decisions (from the user)

| Question | Decision |
|---|---|
| Base | Fresh branch from `main`; the three open replication PRs (#12, #13, #14) are ignored |
| Styling | Tailwind re-implement, no vendored Bootstrap CSS |
| Content | Generated placeholder data only — no real personal data in git |
| Verification | The agent runs its own dev server and checks with screenshots |

## Design

**Tokens** (`src/app/globals.css`). `@theme` palette and fonts plus the
template's own semantic custom properties at `:root`
(`--background-color #000`, `--default-color #fafafa`, `--heading-color #fff`,
`--accent-color #18d26e`, `--surface-color #1a1a1a`, `--contrast-color #000`,
nav variants), with `.light-background` / `.dark-background` overriding them per
section exactly as the template does. Typography: Roboto (body), Raleway
(headings), Poppins (nav), loaded by `<link>` in `layout.tsx` with the fallback
stack retained. Component chrome lives in `@layer components` so utilities can
still win.

**Components** (`src/components/`). `SiteHeader` (fixed, transparent → translucent
`rgba(0,0,0,.8)` past 100px, animated accent underline on the active link, dimmed
overlay + flat `#1a1a1a` mobile panel below 1200px), `SiteFooter`, `PageTitle`
(160px/80px banner + breadcrumb strip), `SectionTitle` (uppercase label, 120px
accent rule), `Hero`, `FeatureGroups`, `ServiceGroups`, `ResumeColumn`,
`PortfolioGrid`, `Preloader`, `ScrollTop`, `Reveal`, `TypedText`, `Icon`.

**Vendor replacements.** `Reveal` = AOS with `duration: 600`, `ease-in-out`,
`once: true` via `IntersectionObserver`; `TypedText` = typed.js with
`typeSpeed: 100`, `backSpeed: 50`, `backDelay: 3000`, looping; `PortfolioGrid` =
isotope filters via React state; `Icon` embeds 52 Bootstrap Icons path geometries
as inline SVG. All three honour `prefers-reduced-motion`, and `Reveal` degrades to
the finished state where `IntersectionObserver` is absent (jsdom).

**Grid.** Dimensions follow Bootstrap, not Tailwind defaults: `gap-6` (24px) for the
`gy-4` card rows; `mt-10` (40px) between stacked rows inside the interests section,
which the template sets with `.interests .container .row + .row { margin-top:
2.5rem }`; `mt-12` (48px) where the template puts `mt-5` on a section title.

**Icons.** `Icon` embeds the 55 Bootstrap Icons the design needs. Content asks for
them by name, so `content.test.ts` walks every page's data and fails if a name is
missing from the map — without it a typo renders an empty accent tile and stays
green, which is exactly the bug the first review caught (`activity`, `broadcast`,
`easel`, `target` were all absent; `target` became `bullseye`, the real Bootstrap
Icons name). The content arrays use `satisfies`, not `as`, so `tsc` still checks
the literal icon names.

**Content** (`src/lib/content.ts`). One fictional persona, "Jordan Lee", with
invented employers and institutions; portfolio thumbs are gradient placeholders.

**Active route** is passed into `Layout`/`SiteHeader` as a prop instead of
`usePathname`, so pages render without an app router context and the static
export cannot mismatch.

**Chat.** Kept. Launcher moves to the bottom-left, because the template's
bottom-right circle now belongs to scroll-to-top; overlay restyled to the dark
palette. Behaviour and all accessible names (`Open chat`, `Ask something...`,
`Send`, `project-card`) are unchanged. The launcher carries a `chat-launcher`
class and is hidden while the mobile panel is open, so it cannot float over the
menu. Unlike `Reveal`/`TypedText`, it stays lazy-loaded through `next/dynamic`.

## Deviations from the live site

1. Per-route titles are `Technical Skill | Tech Portfolio` etc. The live site
   still ships the template's leftovers (`About - Personal Bootstrap Template`,
   and a `Resume - …` title that names the real person, not reproduced here).
2. The footer shows this repo's sitename instead of `Personal`; the template's
   empty `<h3 class="sitename">` is dropped.
3. `Designed by BootstrapMade` is kept — the template license requires the credit.
4. Icons are inline SVG at the same sizes; the mobile menu toggle is a real
   `<button aria-expanded>` rather than the template's bare `<i>`. The template's
   scroll-top floats above its own open mobile panel; the replica keeps that, and
   only the chat launcher — this repo's own control — is hidden.
5. Content is placeholder, so text length differs from the live site (the resume
   page is the shortest).
6. The chat input is named only by its placeholder, as before. It is the one
   control whose accessible name comes from a placeholder rather than a label;
   this predates the work and was left alone to keep the chat feature untouched.

## Notes

`frontend/AGENTS.md` claims this is a modified Next.js and points at
`node_modules/next/dist/docs/`; that directory and
`next/dist/server/lib/generate-agent-files.js` do not exist in this install
(Next 14.2.0, verified by listing the package). Stock Next 14 App Router
conventions were used instead.

## Test plan

Unit (`npx jest`, 21 tests / 10 suites — before this work all 9 suites errored and 0 tests ran):

- Home: header sitename `h1`, hero name `h2`, role line, LinkedIn/GitHub links
  scoped to `.hero`, `.typed-cursor` present.
- Skill / Framework / Resume: page-title `h1`, a `section-title h2`, a card
  heading, breadcrumb `Home` link scoped to `.breadcrumbs`.
- Layout: active nav link gets `aria-current`, chat and scroll-top buttons
  present, copyright strip renders; `.nav-link.is-active` reflects the route.
- Portfolio: default filter shows all items; clicking `Management` removes the
  application cards and sets `aria-pressed`.
- Chat: existing overlay/button specs still pass; snapshot regenerated.
- Content: every icon name referenced by the page data exists in the embedded SVG
  map — the guard for the blank-tile bug described under **Icons**.

E2E (`npx playwright test tests/e2e/replica.spec.ts`, 10 specs):

- Chrome on all five routes: sitename, five nav links with the active one marked,
  footer credit, chat launcher.
- Hero name, typed role line and caret; typewriter text changes over 1.5s.
- `.site-header` gains `is-scrolled` and `.scroll-top` gains `is-visible` after
  scrolling 400px.
- Skill has 3 section titles and >20 feature tiles; Framework ≥10 service cards;
  Resume ≥7 `.resume-item`; portfolio filter counts for `Management` plus
  `Application` equal the `All` count.
- Every `.service-item .icon svg` and `.features-item svg` contains a shape element,
  so a blank tile fails the run; at 390px the chat launcher is hidden while
  `body.nav-open` is set.
- The typewriter is awaited with `waitForFunction` rather than sampled on a timer,
  because a completed word is held for 3s and two fixed samples can legitimately
  match.

Visual (manual, Playwright chromium against the running app):

- Desktop 1440x900 and mobile 390x844 screenshots of all five routes compared
  with gach.work captures.
- Computed-style audit of 43 properties (header background, sitename size/family,
  section-title size/letter-spacing/transform/colour, tile and card backgrounds,
  icon tile box, body colour and family), run against both sites: 43 identical, 0
  differing. This compares the audited properties only and does not inspect icon
  glyphs — which is why it passed while four tiles were blank. Glyph presence is
  covered by the e2e spec above.
- Interaction checks: typewriter advances, header/scroll-top scroll states,
  portfolio filtering and hover overlay opacity.

CI (`npm run lint`, `npm run build` with `output: 'export'`): lint clean and the
build must emit `out/` with the five pages.
