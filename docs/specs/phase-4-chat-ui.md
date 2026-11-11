# Goal

Add a chat UI to the Next.js frontend that provides a floating **ChatButton** visible on every page and opens a lazily‑loaded **ChatOverlay** modal with placeholder demo messages.

# Scope
- Implement a global `ChatButton` component injected into the existing `Layout` so it appears on all pages.
- Create a `ChatOverlay` component that is loaded via Next.js `dynamic()` only when the button is clicked.
- The overlay is a custom modal built with Tailwind CSS (no external UI library) displaying:
  * A short welcome greeting.
  * A sample AI response (static text).
- Use a lightweight React context (`ChatContext`) to hold the static messages and a mock queue position (hard‑coded for now).
- Add unit tests for the button and overlay components, plus a Jest snapshot test for the overlay UI.
- Ensure the modal can be closed via the UI button; keyboard accessibility is deferred to a later phase.

# Out of scope
- Integration with the backend `/chat` endpoint (Phase 5 will handle it).
- Full ARIA compliance and focus‑trap implementation (deferred).
- Dynamic fetching of real chat messages.
- Styling beyond the minimal Tailwind design; no theming or dark‑mode support.

# Acceptance Criteria
1. **Global visibility** – The `ChatButton` appears in the UI of every page (Home, Skill, Framework, Resume, Portfolio) without manual addition to each page.
2. **Lazy loading** – The overlay bundle is not included in the initial page load; network panel shows a separate request only after the button is clicked.
3. **Modal display** – Clicking the button opens a centered modal with a welcome greeting and a sample AI response.
4. **Placeholder content** – The modal shows the static messages defined in `ChatContext` and a mock queue label (e.g., "Position: 1").
5. **No console errors** – Opening and closing the modal does not produce warnings or errors.
6. **Unit tests** – Jest tests verify that:
   - The `ChatButton` renders and triggers the overlay.
   - The overlay renders the expected static messages.
   - Snapshot test of the overlay UI matches the expected markup.
7. **CI passes** – The GitHub Actions CI workflow runs lint, tests, and build successfully with the new components.

# Approach
1. Add `ChatButton.tsx` as a simple button component.
2. Update `frontend/src/app/layout.tsx` (or the shared `Layout` component) to include `<ChatButton />`.
3. Create `ChatContext.tsx` exposing static messages and a mock position.
4. Implement `ChatOverlay.tsx` using Tailwind modal markup (fixed overlay, centered dialog, background dim).
5. Export `ChatOverlay` via `next/dynamic` with `{ ssr: false }`.
6. Wire the button to toggle a local state (`showOverlay`) that triggers the dynamic import.
7. Write unit tests in `__tests__/ChatButton.test.tsx` and `__tests__/ChatOverlay.test.tsx`.
8. Add a snapshot file `ChatOverlay.snap`.
9. Run CI locally to confirm passing.

# Files likely touched / added
- `frontend/src/components/ChatButton.tsx`
- `frontend/src/components/ChatOverlay.tsx`
- `frontend/src/context/ChatContext.tsx`
- `frontend/src/app/layout.tsx` (or wherever the global layout lives)
- Test files under `frontend/src/components/__tests__/` for button and overlay.
- Update `frontend/jest.config.js` if needed to handle dynamic imports.

# Tasks (ordered checklist)

| # | Task | Verification | AC Covered |
|---|------|--------------|------------|
| 1 | Create `ChatContext` with static messages and mock position. | Import and log `useContext(ChatContext)` in a test – values match expected. | 4 |
| 2 | Add `ChatButton` component with click handler to toggle overlay state. | Render test shows button; simulate click sets `showOverlay` true. | 1,5 |
| 3 | Update global `Layout` to include `<ChatButton />`. | Run `npm run build` and inspect built pages – button present in HTML of all pages. | 1 |
| 4 | Implement `ChatOverlay` as a Tailwind modal (HTML & CSS only). | Snapshot test matches expected markup; manual run shows correct UI. | 3,4 |
| 5 | Export `ChatOverlay` via `next/dynamic` with `ssr:false`. | Network tab shows separate JS chunk only after click. | 2 |
| 6 | Wire button click to lazy‑load and display the overlay. | Click button → overlay appears; close button hides it. | 3,5 |
| 7 | Write unit tests for `ChatButton` (render, click) and `ChatOverlay` (render static messages). | `npm test` passes all new tests. | 6 |
| 8 | Add Jest snapshot test for `ChatOverlay` UI. | Snapshot file generated and matches on subsequent runs. | 6 |
| 9 | Run full CI (`git push` triggers workflow) and confirm all checks pass. | GitHub Actions shows passing jobs; `git diff origin/main...HEAD` shows only intended files. | 7 |
|10| Commit changes with clear message and open PR. | PR diff matches task list; branch name follows convention. | – |

# Test Plan
- **Unit tests**: `npm test` runs Jest suites for button and overlay, asserts DOM presence of static messages.
- **Snapshot test**: Ensures UI does not unintentionally change.
- **Manual verification**: Run `npm run dev`, open each page, verify button visibility, click to open overlay, check placeholder messages, ensure no console errors, and confirm lazy‑loaded chunk appears.
- **CI verification**: Push branch, ensure GitHub Actions passes lint, test, and build steps.

# Assumptions
- The project already uses Tailwind CSS (configured in Phase 2).
- A global `Layout` component exists and is used by all pages (as per Phase 3).
- Node 20 and required dev dependencies are installed.
- The placeholder queue label can be a hard‑coded string; real queue logic will be added in Phase 5.

# Risks
- If the global `Layout` does not wrap all pages, the button may miss some routes. Mitigation: verify page tree during manual test.
- Lazy‑loading may cause a flash of unstyled content if Tailwind classes are not included in the dynamic chunk. Mitigation: ensure Tailwind scanning includes the overlay file.
- Over‑reliance on manual visual checks; snapshot testing mitigates regression.

# Proposed branch name
`agent/phase-4-chat-ui`

---

## Progress log
- (To be filled during implementation)

---

## Depends on
- Phase 2 (**Frontend foundation**) – Tailwind configuration and basic Next.js setup.
- Phase 3 (**Frontend page migration**) – Global `Layout` component in place and pages ready for button injection.
