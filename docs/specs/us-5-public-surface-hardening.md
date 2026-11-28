# Spec: US-5 — Public surface hardening

Status: draft

## Goal

US-5: lock the public side of the API to exactly `GET /activity` — method lock-down with `405`, a
deny-by-default CORS allowlist from env with no wildcard, helmet headers, a 60 req/min per-client-IP
rate limit behind `trust proxy`, and a committed secret-free tunnel configuration artifact that
forwards only `/activity` — while every pre-existing US-4 contract test and legacy portfolio test keeps
passing unchanged.

## Design

[docs/design/US-5-public-surface-hardening.md](../design/US-5-public-surface-hardening.md) — read it
before coding: the middleware composition, all interfaces/signatures, the request-adjudication table,
patterns, edge-case table and diagrams are normative there. This spec adds the fixture plan, the ordered
task list, the verification commands and the AC-to-test mapping.

## Context a fresh implementer needs

- Repo: this project. All commands run from `backend/` unless stated. `npm test` = `jest`.
- Story: `docs/product/stories/US-5-public-surface-hardening.md` (Status: approved). Sprint:
  `docs/product/sprints/sprint-2.md` (Status: approved). Dependency US-4 is merged (`src/activity/*`);
  start from the **latest `origin/main`**: `git fetch --prune && git switch -c
  agent/us-5-public-surface-hardening origin/main` (plain `git switch main` can fail in a worktree).
- `requirements.md`, `architecture.md` and the ADRs are **not tracked** in this repo (backlog
  Assumptions); the approved backlog is the working source of truth. Do not hunt for them and do not
  invent CMP IDs.
- **Landmines in pre-existing tests (hard constraint — AC-7 forbids touching any existing test):**
  1. `tests/activityMount.test.ts` asserts `src/index.ts` text still contains `from
     './activity/activityRouter'`, contains **exactly one** `app.use('/activity'` occurrence, and that
     it appears **after** the `/static-data`, `/entity`, `/chat` mounts and `app.get('/health'`. → The
     activity mount line in `index.ts` stays **byte-identical**; do not move or reword it. The only
     allowed `index.ts` edits are the three listed in task 6.
  2. `tests/activityReadOnly.test.ts` AC-5(g) asserts `src/activity/*.ts` is **exactly** the five files
     `activityErrors/activityRepository/activityRouter/activityService/timeRange` and scans each for
     `INSERT|UPDATE|DELETE|CREATE TABLE|DROP|ALTER|PRAGMA|initActivitySchema|__dirname` (case-insensitive,
     comments included — keep such words out of comments you add to `activityRouter.ts`) and for value
     imports of `better-sqlite3`. → New modules live under `src/hardening/`, never new files in
     `src/activity/`.
  3. US-4's contract and timing suites import the **named** `createActivityRouter` and the timing suite
     fires 120 sequential requests through it. → Hardening must be baked only into the **default
     export** of `activityRouter.ts`; `createActivityRouter` itself stays raw (task 6 has a behavioural
     test pinning this).
  4. `tests/chat.test.ts`/`env.test.ts`/`llmEnv.test.ts` compose their own apps and never import
     `src/index.ts`.
- `npm install --save express-rate-limit@^8.7.5` **is** the sanctioned dependency change (story Notes:
  "the rate limiter library choice is the tech lead's call"); `helmet` and `cors` are already
  dependencies — do not add any other dependency. Verify afterwards that `git status` lists only
  `package.json` (and the backend lockfile if one exists) for the install.
- Probe-verified runtime facts (design basis, do not re-litigate; measured on express-rate-limit 8.7.5,
  helmet 8.3.0, cors 2.8.6, express 5.3.0, Node 22):
  (a) express sets `X-Powered-By: Express` once in `app.handle`; helmet's chain (running later) removes
  it for `/activity` only — legacy routes keep advertising it;
  (b) cors 2.8.6 treats **every** OPTIONS (with or without `Access-Control-Request-Method`) as
  preflight: allowed → 204 + exact ACAO + `Access-Control-Allow-Methods: GET` + max-age 600; denied →
  `next()` (the method guard then answers 204 + `Allow`, no ACAO);
  (c) with `app.set('trust proxy', true)` a spoofed `X-Forwarded-For` keys the limiter per client IP —
  a 62-request burst from `203.0.113.7` returned 200 ×60 then 429 ×2 (`Retry-After: 60`, `RateLimit:
  limit=60, remaining=0, reset=60`) while `203.0.113.8` and the no-XFF peer still got 200;
  (d) express-rate-limit v8 **throws** the `ERR_ERL_PERMISSIVE_TRUST_PROXY` validation with trust proxy
  `true` unless `validate: { trustProxy: false }` is passed;
  (e) the window is fixed per key from that key's first request; a sleep of `Retry-After × 1000 + 200 ms`
  reliably restores 200s — never assume wall-clock/epoch window alignment;
  (f) the MemoryStore timer is unref'd (the probe process exited naturally);
  (g) `/activityfoo` is **not** matched by the `/activity` mount (legacy chain handles it);
  (h) the legacy wildcard cors behind `legacyCorsGuard` still answers `/health` with `ACAO: *` and
  `X-Powered-By: Express`, while every `/activity` response class (200/204/404/405/429) carries **no**
  wildcard.
- Data privacy rules that bind every committed line: generated values only; third-party tools other
  than opencode are called **Agent-tool / Chat-tool**; never commit a real hostname, account name,
  token, cookie, credential value or prompt/response text. Only the invented constants listed below.
- Environment prep: `backend/node_modules` may be absent in a fresh worktree →
  `npm install --no-audit --no-fund`.

## Scope

- New `backend/src/hardening/` module trio (`activityHardening.ts`, `activitySurface.ts`,
  `publicActivityApp.ts`) implementing the inner lock, per the design's interfaces.
- Two surgical edits: `src/activity/activityRouter.ts` default export (2 lines) and `src/index.ts`
  (3 lines, mount lines untouched).
- The committed tunnel configuration artifact (`deploy/cloudflared/activity-tunnel.example.yml` +
  `deploy/cloudflared/README.md`, placeholders and env-var names only).
- Contract, unit, rate-limit, structural and artifact-scan tests for AC-1 … AC-4, AC-6, AC-7; AC-5
  handoff recipe (Manual (user)).
- The `express-rate-limit` dependency addition (story-delegated tech-lead choice).

## Out of scope

(from the story) Authentication, sessions, any write endpoints; changing the legacy portfolio routes
beyond keeping them reachable and their tested behaviour identical; the production hostname and the real
allowlist values (US-16 — do not hardcode anything it must undo); TLS at the tunnel; compression,
caching, CDN headers. Also out of scope here: any schema change, any change to `src/import/**`,
`src/db.ts`, `src/routes/*`, `src/middleware/concurrency.ts`, the US-4 modules' behaviour, `tsconfig.json`,
any pre-existing test file, and any dependency other than `express-rate-limit`.

## Acceptance criteria

(verbatim from `docs/product/stories/US-5-public-surface-hardening.md`)

- AC-1: Given the API is running, when a client sends `POST`, `PUT`, `PATCH` or `DELETE` to `/activity`, then the response status is `405` and no handler for those methods runs (a probe write to the database through such a request changes nothing), while `GET /activity` keeps answering `200` and `OPTIONS /activity` answers within the CORS policy. (Verified by: Jest + supertest test per method plus a database-unchanged assertion; BR-2.)
- AC-2: Given an allowlist configured through environment (origins as a comma-separated value, never hardcoded), when `GET /activity` arrives with an `Origin` on the allowlist, then the response carries `Access-Control-Allow-Origin` set to exactly that origin; when the `Origin` is not on the allowlist, then no `Access-Control-Allow-Origin` header is present; the wildcard `*` never appears on any `/activity` response; with no allowlist configured, the default is deny (no ACAO header). (Verified by: Jest + supertest tests over three origins — allowed, denied, absent; BR-2, ADR-2.)
- AC-3: Given any response from `/activity`, when the response headers are inspected, then the helmet-provided security headers are present (at minimum `X-Content-Type-Options: nosniff`), the response does not advertise an `X-Powered-By` value, and no header or body carries a filesystem path or database file name. (Verified by: Jest + supertest header assertions; NFR-6, ADR-2.)
- AC-4: Given a single client IP, when it sends more than 60 `/activity` requests within one rolling minute, then the 61st and later requests receive `429` until the window passes, and earlier successful responses are unaffected; the limiter keys on the client IP behind a proxy (`trust proxy` enabled), so a tunneled request is not collapsed onto the proxy's own address. (Verified by: Jest + supertest burst test with a spoofed `X-Forwarded-For`; NFR-6, ADR-2.)
- AC-5: Given the hardening is deployed on the owner's host, when the owner checks from outside the container through the tunnel hostname, then `GET /activity` answers `200` and at least three non-activity paths (for example `/entity`, `/chat`, `/health` on the tunnel host) are not forwarded and answer `404` or `403` from the tunnel rule, and `/activity` is the only public route. (Manual (user): run on the owner's host with the real tunnel; report status codes per path only, never headers carrying tokens or cookies. BR-2, BR-7, ADR-2.)
- AC-6: Given the repository contains the tunnel configuration artifact (or a documented recipe committed as a config file with placeholders instead of secrets), when a reviewer inspects it, then it names `/activity` as the only forwarded path, contains no account names, tokens or real hostnames, and the hardening settings (allowlist, rate limit) come from environment variables whose names — not values — are documented. (Verified by: review of the committed artifact plus a secrets-pattern scan of the diff; BR-7, NFR-6.)
- AC-7: Given the whole backend test suite, when `npm test` runs in `backend/` after the hardening lands, then all pre-existing US-4 contract tests and legacy portfolio route tests still pass unchanged, and the hardening is scoped to the activity surface: legacy portfolio routes keep their current behavior for methods and CORS as tested before this story. (Verified by: `npm test` in `backend/` green on the branch; BR-2, BR-7.)

## Normative decisions (implement exactly; each is decided in the design and has tests)

1. **Coexistence with the legacy wildcard `cors()`** (story's explicit tech-lead decision): per-route
   middleware inside the **existing single app and port** — `app.use(legacyCorsGuard(cors()))` (same
   wildcard instance, skipped only for `/activity` and `/activity/*`) plus the hardened router as the
   **default export** of `src/activity/activityRouter.ts`, keeping the `app.use('/activity',
   activityRouter)` mount line byte-identical. A separate app/port was rejected (design Patterns
   table). The chain is hermetic: every `/activity*` request terminates with 200/204/404/405/429
   inside it, so the wildcard cors provably never answers an activity response.
2. **Rate limiter**: `express-rate-limit@^8.7.5` (the only new dependency; story Notes delegate the
   choice). `windowMs: 60_000`, `limit` resolved per request (`options.max` test override >
   `ACTIVITY_RATE_LIMIT_PER_MINUTE` env, valid iff trimmed `/^\d+$/` and ≥ 1 > `60`),
   `standardHeaders: 'draft-7'`, `legacyHeaders: false`, `validate: { trustProxy: false }` (trust proxy
   is mandated by AC-4; comment the reason at the call site), default `keyGenerator` (`req.ip`) with
   `app.set('trust proxy', true)`.
3. **Window rounding**: fixed window per client-IP key, opened by that key's first request, exactly
   `windowMs` long — no wall-clock anchoring (probe fact (e)). Worst case ~2×60 admits across a window
   edge: accepted (public read-only endpoint, outer lock is the tunnel). Tests recover by
   `Retry-After × 1000 + 200 ms` sleep, never by assuming boundaries.
4. **429 body**: `res.status(429).json(ACTIVITY_RATE_LIMITED_BODY)` with the frozen
   `{ "error": { "code": "ACTIVITY_RATE_LIMITED", "message": "too many requests, try again shortly" } }`;
   library `Retry-After`/`RateLimit` headers stay. 405 body
   `{ "error": { "code": "ACTIVITY_METHOD_NOT_ALLOWED", "message": "this endpoint only supports GET" } }`
   + `Allow: GET, OPTIONS`; terminal-404 body `{ "error": { "code": "ACTIVITY_NOT_FOUND", "message":
   "no such activity endpoint" } }`. No interpolation anywhere (NFR-5 discipline; the hardening modules
   contain no `console.*`).
5. **helmet**: `helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy:
   'cross-origin' } })`, scoped to `/activity` only (legacy keeps `X-Powered-By: Express` — that is the
   AC-7 "current behavior"; the helmet chain's `removeHeader` deletes it on activity responses, probe
   fact (a)).
6. **CORS allowlist**: env `ACTIVITY_ALLOWED_ORIGINS` — comma-separated, read **per request**, parsed by
   `parseAllowedOrigins` (trim, drop empties, dedupe, exact match, no case folding); unset/blank ⇒ empty
   set ⇒ deny (no ACAO, ever); cors options `methods: ['GET']`, `allowedHeaders: []`, `maxAge: 600`,
   default `preflightContinue: false`. Values never hardcoded; US-16 fills the real origins by env.
7. **Method guard**: `GET`/`HEAD` → next; `OPTIONS` → `Allow` + 204 (defensive; cors answers preflights
   first — probe fact (b)); anything else → `Allow` + 405 frozen body. Terminal 404 guard after the
   inner router.
8. **Env-var names (the only documented hardening config, names never values)**:
   `ACTIVITY_ALLOWED_ORIGINS`, `ACTIVITY_RATE_LIMIT_PER_MINUTE`, `ACTIVITY_TUNNEL_NAME`,
   `ACTIVITY_TUNNEL_HOSTNAME`, `ACTIVITY_TUNNEL_CREDENTIALS_FILE` (+ existing `ACTIVITY_DB_PATH`,
   `PORT`, owned by US-4/the app).

## Tunnel artifact content (committed under `deploy/cloudflared/` at repo root)

`activity-tunnel.example.yml` (placeholders only — RFC 2606 / `${ENV_NAME}`; no other route paths may
appear in this file at all):

```yaml
# US-5 public activity tunnel recipe. Fill the ${...} placeholders in a PRIVATE copy on the
# owner's host; never commit real hostnames, account names, credential paths or tokens (AC-6).
# The only forwarded backend path is /activity; the catch-all answers 404 at the tunnel.
tunnel: ${ACTIVITY_TUNNEL_NAME}
credentials-file: ${ACTIVITY_TUNNEL_CREDENTIALS_FILE}
ingress:
  - hostname: ${ACTIVITY_TUNNEL_HOSTNAME}     # placeholder example: activity.example.com
    service: http://127.0.0.1:8080/activity   # the single forwarded path
    originRequest:
      httpHostHeader: 127.0.0.1:8080
  - service: http_status:404                  # catch-all: nothing else reaches the backend
```

`README.md`: purpose (outer lock of the ADR-2 defence-in-depth pair; the inner lock is CI-proven by
AC-1…AC-4); the five env-var **names** with one-line meanings and "values live only on the owner's
host"; the fill-in-private-copy + `cloudflared tunnel --config <private copy>` steps plus a dev-only
quick-tunnel alternative `cloudflared tunnel --url http://127.0.0.1:8080/activity` (ephemeral hostname —
never recorded in this repo); the AC-5 verification recipe (status codes only); the policy that the
filled copy is never committed and TLS comes from the tunnel service.

## Fixture / test data plan (`backend/tests/fixtures/publicSurfaceFixtures.ts` — new)

Generated values only; single source of truth (tests import these, never retype literals):

```ts
export const ORIGIN_ALLOWED_A = 'https://portfolio.example.com';   // on the allowlist (AC-2)
export const ORIGIN_ALLOWED_B = 'https://api.example.com';         // on the allowlist (AC-2)
export const ORIGIN_DENIED = 'https://notallowed.example.com';     // never on the allowlist
export const CLIENT_IP_A = '203.0.113.7';                          // RFC 5737 documentation range
export const CLIENT_IP_B = '203.0.113.8';                          // RFC 5737
export const PROXY_IP = '198.51.100.9';                            // RFC 5737 (two-hop XFF chain tail)
export const TUNNEL_HOST_PLACEHOLDER = 'activity.example.com';     // RFC 2606, docs only
export const ALLOWED_ORIGINS_ENV_VALUE = `${ORIGIN_ALLOWED_A},${ORIGIN_ALLOWED_B}`;
```

DBs come from the existing US-4 `tests/fixtures/activitySeed.ts` `seedActivityDb` (its `SEED_MARKER`,
`SEED_TO_DAY` etc. are reused for privacy scans — no new marker text). Junk probe bodies use inert
generated shapes (e.g. `{ rows: [{ day_local: '2026-11-27', prompt_count: 999 }] }`), never real data.

## Files likely touched

New (source): `backend/src/hardening/activityHardening.ts`,
`backend/src/hardening/activitySurface.ts`, `backend/src/hardening/publicActivityApp.ts`.
Changed (source): `backend/src/activity/activityRouter.ts` (default export, 2 lines + the AC-5(g)
forbidden-word comment caveat), `backend/src/index.ts` (3 lines: trust-proxy line, legacyCorsGuard-wrapped
cors mount, one import), `backend/package.json` (+`deploy/` lockfile side effects of the npm install),
`backend/jest.config.js` (additive: `'src/hardening/**/*.ts'` in `collectCoverageFrom`; thresholds
`{ lines: 80 }` for `./src/hardening/activityHardening.ts` and `./src/hardening/activitySurface.ts`).
New (artifact): `deploy/cloudflared/activity-tunnel.example.yml`, `deploy/cloudflared/README.md`.
New (tests): `backend/tests/fixtures/publicSurfaceFixtures.ts`, `backend/tests/activityHardening.test.ts`,
`backend/tests/activitySurface.api.test.ts`, `backend/tests/activitySurface.rateLimit.test.ts`,
`backend/tests/activitySurface.mount.test.ts`, `backend/tests/tunnelConfig.test.ts`.
Never touched: `src/db.ts`, `src/routes/*`, `src/middleware/concurrency.ts`, `src/import/**`,
`src/activity/{activityErrors,activityRepository,activityService,timeRange}.ts`,
`tests/fixtures/{activitySeed,opencodeDb,events,DummyAdapter}.ts`, every pre-existing `*.test.ts`,
`tsconfig.json`.

## Tasks

Ordered; every task ends green before the next starts. Commands run from `backend/` unless stated.

1. [x] **Baseline.** `git fetch --prune && git switch -c agent/us-5-public-surface-hardening
   origin/main`; `npm install --no-audit --no-fund` if `node_modules` is missing; `npm test` and
   `npx tsc --noEmit`. Record pass counts in the Progress log. Then
   `npm install --save express-rate-limit@^8.7.5` and confirm `git status --short` lists only
   `backend/package.json` (plus a lockfile if the repo tracks one). Verify: suite green at baseline;
   install diff touches nothing else. → (setup for all ACs; AC-7 dependency carve-out)
2. [x] `backend/src/hardening/activityHardening.ts` — exactly the design's pure-policy interfaces
   (env-name constants, `ACTIVITY_PATH`, window/limit/max-age/`Allow` constants, the three
   `Object.freeze`d bodies, `parseAllowedOrigins`, `resolveRateLimitMax`). Imports nothing, reads only
   `process.env`, no `console.*`. Then `backend/tests/activityHardening.test.ts`: `parseAllowedOrigins`
   truth table (`undefined`, `null`, `''`, `' , , '`, `'<A> , <B> ,'` → trimmed 2-entry set, dedupe,
   case-sensitivity pin); `resolveRateLimitMax` (explicit override wins; env `'90'→90`;
   `'0'/'-5'/'abc'/'1e3'/'60.5'/unset → 60`); frozen bodies `Object.isFrozen` + `toBe` identity; the
   `60`/`60_000`/`600`/`'GET, OPTIONS'` constants. Verify: `npx jest activityHardening` green;
   `npx tsc --noEmit` exit 0. → AC-2, AC-4 (pure halves)
3. [x] `backend/src/hardening/activitySurface.ts` — the middleware factories and
   `buildHardenedRouter` per the design signatures (helmet config per decision 5, cors config per
   decision 6 read per request, limiter per decisions 2–4 including
   `validate: { trustProxy: false }` with its why-comment, method guard per decision 7, terminal 404,
   `legacyCorsGuard`). It must **not** import `activityRouter`. Extend
   `backend/tests/activityHardening.test.ts` with a `legacyCorsGuard` supertest table over a tiny app
   (wildcard spy `cors()`): `/health` and `/entity` → spy called, `ACAO: *`; `/activity` and
   `/activity/x` → spy **not** called; `/activityfoo` → spy called (probe fact (g)). Verify:
   `npx jest activityHardening` green; `npx tsc --noEmit` exit 0; `npm run lint` clean on the new file.
   → AC-2, AC-7 (legacy untouched half), AC-1 (chain half)
4. [x] `backend/tests/fixtures/publicSurfaceFixtures.ts` (constants above, nothing else) +
   `backend/src/hardening/publicActivityApp.ts` — `createHardenedActivityApp({ dbPath, rateLimit })`
   replicating the planned `index.ts` composition (trust proxy → guarded wildcard `cors()` →
   `express.json()` → `/activity` hardened mount). No `listen`, no legacy-DB import. Verify:
   `npx tsc --noEmit` exit 0; `node -e` smoke (import via ts-node not required — the next task proves
   behaviour). → AC-1 … AC-4 (test vehicle)
5. [x] `backend/tests/activitySurface.api.test.ts` — the AC-1/AC-2/AC-3 contract suite over
   `createHardenedActivityApp({ dbPath })` with `seedActivityDb({ dbPath, days: 15 })` and
   env save/restore around every test (convention from `tests/activityDb.test.ts`):
   - **AC-1**: one `it` per `post|put|patch|delete`: send junk JSON body + allowed `Origin` → `405`,
     `allow === 'GET, OPTIONS'`, `res.body` deep-equals `ACTIVITY_METHOD_NOT_ALLOWED_BODY` **and**
     `res.text === JSON.stringify(constant)` (byte-identical, no handler ran); after all four probes:
     `usage_event` count equals the seeded count (readonly better-sqlite3 open in the test), main db
     file `Buffer.equals` the pre-probe bytes, `-wal` absent-or-0 bytes, `-shm` absent-or-32768 bytes
     (the US-4-honest assertions); plus `GET /activity` → `200` (rows present) and `OPTIONS /activity`
     with allowed `Origin` → `204` with `ACAO` exactly `ORIGIN_ALLOWED_A` (within the CORS policy).
   - **AC-2**: env `ACTIVITY_ALLOWED_ORIGINS = ALLOWED_ORIGINS_ENV_VALUE`:
     `GET` with `ORIGIN_ALLOWED_A` → `access-control-allow-origin === 'https://portfolio.example.com'`
     (exact, and again for `ORIGIN_ALLOWED_B`); with `ORIGIN_DENIED` → header `undefined`; with no
     `Origin` header → `undefined`; with the allowlist env **deleted** → `undefined` even for
     `ORIGIN_ALLOWED_A` (deny-by-default); case-variant origin → `undefined`. No-wildcard sweep: from
     the responses this suite captured (200, 405s, 204 preflight, bare-OPTIONS 204, `/activity/entity`
     404, 429 from a tiny-window app) assert **no** `access-control-*` header value is `'*'` or
     contains `'*'`, on both the bare hardened app and the full `createHardenedActivityApp` (guarded
     wildcard present).
   - **AC-3**: on `GET /activity` (200) and on the 405/429/404 captures: `x-content-type-options ===
     'nosniff'`; `res.headers['x-powered-by']` is `undefined`; `x-frame-options`, `referrer-policy`,
     `strict-transport-security`, `x-dns-prefetch-control`, `x-download-options` present (helmet set,
     CSP absent by decision 5); every header value and `res.text` contain none of the scratch `dbPath`,
     `'activity.db'`, `'node_modules'`, `'/root'`, `'/home'`, `'/workspace'`, `'/tmp'`.
   Verify: `npx jest activitySurface.api` green (all `it`s incl. the database-unchanged assertion);
   `npx tsc --noEmit` exit 0. → AC-1, AC-2, AC-3
6. [x] `backend/tests/activitySurface.rateLimit.test.ts` — AC-4, `jest.setTimeout(120_000)`:
   (a) `RATE_LIMIT_WINDOW_MS === 60_000`, `RATE_LIMIT_MAX_REQUESTS_PER_MINUTE === 60`;
   (b) fresh `createHardenedActivityApp({ dbPath })` (defaults): 62 sequential awaited
   `GET /activity` with `X-Forwarded-For: CLIENT_IP_A` — capture statuses in order: the first 60 are
   `200` with parseable bodies ("earlier successful responses unaffected"), `#61` and `#62` are `429`,
   deep-equal frozen `ACTIVITY_RATE_LIMITED_BODY` byte-identically, `retry-after` parses to an integer
   1…60, `ratelimit` header present (draft-7 form);
   (c) still exhausted: `X-Forwarded-For: CLIENT_IP_B` → `200`; plain (no XFF) `GET` → `200`; two-hop
   `X-Forwarded-For: '203.0.113.7, 198.51.100.9'` → `429` (keys on the leftmost client IP, not the
   proxy's address);
   (d) window pass: a fresh app with `{ rateLimit: { windowMs: 1000, max: 5 } }` — burst 6 → `429`,
   read its `retry-after`, sleep `retryAfter * 1000 + 200` ms, next request → `200`;
   (e) env override: `ACTIVITY_RATE_LIMIT_PER_MINUTE='3'` on a fresh default app → requests 1–3 `200`,
   `#4` `429`; restore env. Verify: `npx jest activitySurface.rateLimit` green twice (flaky-run rule:
   re-run and paste both outputs, do not weaken thresholds). → AC-4
7. [x] **Wire the production surface (the only source edits):**
   - `src/activity/activityRouter.ts`: replace `export default createActivityRouter();` with
     `import { buildHardenedRouter } from '../hardening/activitySurface';` +
     `export default buildHardenedRouter(() => createActivityRouter());` and a short comment —
     **no** comment may contain the AC-5(g) forbidden words (INSERT/UPDATE/DELETE/DROP/ALTER/PRAGMA/
     `initActivitySchema`/`__dirname`, case-insensitive).
   - `src/index.ts`: add `import { legacyCorsGuard } from './hardening/activitySurface';`; add
     `app.set('trust proxy', true);` after `const app = express();`; change `app.use(cors());` to
     `app.use(legacyCorsGuard(cors()));`. **Every other line byte-identical** (health, json, the three
     legacy mounts and their positions, the activity import + mount, `listen`).
   Then `backend/tests/activitySurface.mount.test.ts`:
   (a) `src/index.ts` text contains `app.set('trust proxy'`, `legacyCorsGuard(cors())`, exactly one
   `/app\.use\('\/activity'/g` match still positioned after `/static-data`, `/entity`, `/chat` and
   `app.get('/health'` (re-pins the US-4 invariants next door);
   (b) behavioural: mount the hardened **default export** like `index.ts` does → `GET /activity` `200`
   with `nosniff` and `POST /activity` `405`; mount the **raw** `createActivityRouter()` → `GET
   /activity` `200` with `res.headers['x-content-type-options']` **undefined** (timing-suite immunity
   pin);
   (c) source scan of `src/hardening/*.ts` (pattern-grep precedent `activityReadOnly.test.ts`): no
   `__dirname`, `from '../db'`, `require('../db')`, better-sqlite3 value import, no `console.` (silent
   hardening);
   (d) legacy-behaviour pin (AC-7 support): `GET /health` on `createHardenedActivityApp`-style
   composition — a locally composed app with the guarded wildcard answers `ACAO: *` +
   `X-Powered-By: Express` on `/health`-like routes (probe fact (h)).
   Verify: `npx jest activitySurface.mount activityMount activityReadOnly activityApi` green (the four
   existing US-4 suites **unmodified**); `npx tsc --noEmit` exit 0; `npm run lint` clean. → AC-1,
   AC-2, AC-3 (production form), AC-7
8. [x] **Tunnel artifact (AC-6) + AC-5 handoff:** write `deploy/cloudflared/activity-tunnel.example.yml`
   and `deploy/cloudflared/README.md` exactly per the artifact section (placeholder hostnames /
   env-var NAMES only — no values, no account names, no tokens anywhere in either file; `/activity` is
   the only backend path named in the yml). Then `backend/tests/tunnelConfig.test.ts` reading
   `../../deploy/cloudflared/*`: yml matches `/service:\s*http:\/\/(127\.0\.0\.1|localhost):8080\/activity/`
   exactly once and contains no `'entity'`, `'chat'`, `'health'` substring; `http_status:404` catch-all
   present; every `https?://…` and `hostname:` token is a `${…}` placeholder, `127.0.0.1`/`localhost`
   or ends `example.com|example.org|example.net|.invalid`; `credentials-file` value is exactly
   `${ACTIVITY_TUNNEL_CREDENTIALS_FILE}`; no `(ACTIVITY_ALLOWED_ORIGINS|ACTIVITY_RATE_LIMIT_PER_MINUTE)
   \s*=\s*\S` assignment in either file; no credential-shaped match
   (`/\b(token|secret|passwor[dt]|api[_-]?key|bearer)\b\s*[:=]\s*[^\s$]/i`, `/BEGIN [A-Z ]*PRIVATE KEY/`,
   `/[A-Za-z0-9+/]{40,}={0,2}/`); README names all five env vars. Verify: `npx jest tunnelConfig`
   green; Manual (review): read both artifacts against AC-6's wording. → AC-6 (all), AC-5 (artifact half)
9. [x] **AC-5 handoff (owner's host — the container cannot see the tunnel).** Put this recipe verbatim
   in the PR body and tick only when the owner reports status codes back at the sprint exit:
   ```sh
   # on the owner's host (env-var names; values stay on the host, never in this repo):
   #   ACTIVITY_DB_PATH=<imported activity.db>  ACTIVITY_ALLOWED_ORIGINS=<owner origins>
   #   ACTIVITY_RATE_LIMIT_PER_MINUTE=<optional, default 60>  PORT=8080
   npm --prefix backend run build && npm --prefix backend run start
   # copy deploy/cloudflared/activity-tunnel.example.yml to a private file, fill the ${...}
   # placeholders (real hostname, account, credentials path — never committed), then:
   cloudflared tunnel --config <private copy>
   # from OUTSIDE the container, report status codes ONLY (never headers, tokens or cookies):
   for p in /activity /entity /chat /health; do
     curl -s -o /dev/null -w "$p %{http_code}\n" "https://<ACTIVITY_TUNNEL_HOSTNAME>$p"
   done
   # expect: /activity => 200; /entity, /chat, /health => each 404 or 403 from the tunnel rule
   ```
   Verify: **Manual (user)** — owner reports per-path status codes at the sprint-2 exit. → AC-5
10. [ ] **AC-6 secrets-pattern scan of the diff + privacy sweep** (repo root):
    ```sh
    git -c core.pager=cat diff origin/main...HEAD -U0 -- . \
      ':(exclude)backend/tests/tunnelConfig.test.ts' \
      | grep -inE 'gh[pousr]_|sk-[A-Za-z0-9]{10,}|eyJ[A-Za-z0-9_-]{10,}|AKIA[0-9A-Z]{16}|BEGIN [A-Z ]*PRIVATE KEY|[A-Za-z0-9+/]{40,}={0,2}|(api[_-]?key|passwd|password|access[_-]?token|auth[_-]?token|bearer)[[:space:]]*[:=][[:space:]]*[^[:space:]$<]' \
      || echo CLEAN
    ```
    Expect `CLEAN` (paste into the Progress log). `tunnelConfig.test.ts` is excluded because it *is* the
    pattern list — the reviewer reads it instead (record that in the PR body). Also sweep added lines
    for hostnames outside the allowlist {`example.com`, `example.org`, `example.net`, `invalid`,
    `localhost`, `127.0.0.1`} and IPs outside the RFC 5737 ranges, and for the vendor/model vocabulary
    (`anthropic|openai|claude|gpt|gemini|llama|deepseek|kimi|moonshot|qwen|mistral`) — US-4 task-12
    precedent. Paste counts into the Progress log. Verify: `CLEAN` + zero hostname/IP/vendor hits on
    added lines. → AC-6 (diff half), AC-3 (no-path half)
11. [ ] **AC-7 gate + jest config.** Add to `backend/jest.config.js`: `'src/hardening/**/*.ts'` in
    `collectCoverageFrom`; thresholds `{ lines: 80 }` for `./src/hardening/activityHardening.ts` and
    `./src/hardening/activitySurface.ts`. Then run from `backend/`: `npm test` — **all suites green**,
    every pre-existing US-4 contract test and legacy portfolio test (entity/chat/staticData/env/llmEnv)
    passing unchanged; `npx jest --coverage` once and paste the two hardening percentages;
    `npx tsc --noEmit` exit 0; `npm run lint` exit 0. Diff hygiene (repo root):
    `git diff --name-only origin/main...HEAD` lists exactly the "Files likely touched" set, and
    `git diff origin/main...HEAD -- backend/tests | grep -c '^-[^-]'` → `0` (zero removed lines in
    pre-existing tests). Verify: `npm test` in `backend/` green on the branch (the story's AC-7
    verification), the two `0`-count checks pasted. → AC-7 (all), AC-1…AC-4 (regression half)
12. [ ] **PR.** Single PR from `agent/us-5-public-surface-hardening` to `main`: body links the design +
    this spec, lists the dependency addition (`express-rate-limit`, story-delegated), pastes the AC-5
    recipe (task 9), the AC-6 scan output (task 10), baseline vs final pass counts, and the two timing
    percentages. State "Not tested: AC-5 (owner's host)" and anything else not run.

## Test plan

| Level | File | Mocked | Serves | Verification method (per story) |
|---|---|---|---|---|
| Unit (pure policy) | `tests/activityHardening.test.ts` | nothing | AC-2, AC-4 | Jest (+ tiny supertest probe for the guard shim) |
| Contract (supertest over `createHardenedActivityApp`, real seeded SQLite) | `tests/activitySurface.api.test.ts` | env save/restore only | AC-1 (per method + **database-unchanged assertion**), AC-2 (three origins + deny-by-default + no-wildcard sweep), AC-3 (header assertions + path/dbname scan) | Jest + supertest |
| Rate limit (supertest burst) | `tests/activitySurface.rateLimit.test.ts` | env save/restore only | AC-4 (**spoofed `X-Forwarded-For` burst test**, key independence, window pass, env override) | Jest + supertest |
| Structural + behavioural mount | `tests/activitySurface.mount.test.ts` | reads `src/index.ts` text; composes mounts locally | AC-1/2/3 production form, AC-7 legacy half | Jest + supertest + source scans |
| Artifact scan | `tests/tunnelConfig.test.ts` | reads the two committed artifacts | AC-6 automated assist | Jest (reviewer inspects the artifact too) |
| Diff secrets scan | task 10 command | n/a | AC-6 | **secrets-pattern scan of the diff** (grep, output pasted) |
| Full suite | task 11 | n/a | AC-7 | **`npm test` in `backend/` green on the branch** |
| Manual (user) | task 9 recipe, owner's host | n/a | AC-5 | **Manual (user)** — per-path status codes only (200 / 404 / 403) |

AC → tasks: AC-1 → 3, 5, 7, 11 · AC-2 → 2, 3, 5, 7, 11 · AC-3 → 5, 7, 10, 11 · AC-4 → 2, 6, 11 ·
AC-5 → 9 (**Manual (user)**) · AC-6 → 8, 10 (+ reviewer inspection) · AC-7 → 7, 11 (+ all tasks: no
pre-existing test changes). Every criterion is served by at least one task.

Sprint-2 exit extras: the owner's AC-5 confirmation is the exit gate (sprint file); the reviewer reads
the committed artifact (sprint exit condition on US-5/AC-6).

## Assumptions

- The requirements/architecture/ADR files are untracked (backlog Assumptions); no CMP ID or ADR text
  is linked — the story Notes' ADR-2 paraphrase (inner/outer lock, `GET /activity` only) is the working
  wording; the backlog is the working source of truth. Precedent: US-4 and US-23 specs.
- "60 req/min rolling" is operationalised as the design's fixed window per client-IP key (probe fact
  (e)): any 61-plus burst inside one window is 429 from the 61st; window-edge doubling (~120/60s in the
  worst case) is accepted for a public read-only endpoint whose outer lock is the tunnel. If the owner
  demands strict sliding semantics, that is a limiter-behaviour change for a follow-up story, not a
  cheat in these tests.
- `OPTIONS` "answers within the CORS policy" is satisfied by the 204 preflight/bare-OPTIONS responses
  described (probe fact (b)); `HEAD` is admitted as express does for GET routes and is not in AC-1's
  405 list.
- `405`/`429`/`404` bodies are frozen constants in the existing US-4 error-shape style (no per-request
  values); `Retry-After`/`RateLimit` (draft-7) accompany the 429.
- Legacy `/health` keeps advertising `X-Powered-By: Express` and wildcard ACAO — that **is** its
  current tested behaviour; AC-3 scopes the header rules to `/activity`.
- The tunnel forwards to `127.0.0.1:8080/activity` (the app's `PORT` default 8080); the owner may set
  `PORT` — the README says to keep the yml's service port in sync. US-16 later fills `${...}` values.
- Test data is generated only: `api.example.com`-style origins and RFC 5737 IPs (fixtures file above);
  no real hostname, account name, token, cookie or marker text is committed anywhere.
- `express-rate-limit` (only new dep) and its semver range `^8.7.5` are the tech lead's choices under
  the story Notes' explicit delegation; installing it is the one sanctioned `package.json` edit.

## Risks

- **Trust-all proxy lets direct (non-tunnel) clients spoof `X-Forwarded-For`** and dodge the limiter —
  accepted (AC-4 mandates trust proxy + the spoofed-XFF test; the tunnel rewrites the header; data is
  public read-only). If the deployment later sits on a public interface, pin trust to the tunnel CIDR
  (design Open questions; belongs to US-13's network setup).
- **One egress IP throttles a visitor pool** at 60/min (listed sprint-2 risk): mitigation is the
  documented env knob name `ACTIVITY_RATE_LIMIT_PER_MINUTE` (value at the owner's discretion).
- **Legacy `POST /chat` concurrency keys on `req.ip`**, now XFF-derived under trust proxy for clients
  that send the header (untested behaviour; chat tests never send XFF so AC-7 holds). Watch item for
  the architect — not fixed here (out of scope).
- **Comment-word landmine**: `activityReadOnly.test.ts` scans `src/activity/*.ts` case-insensitively —
  a comment containing DELETE/UPDATE etc. in `activityRouter.ts` fails a US-4 test. Task 7 warns; the
  green run of `activityReadOnly` proves it.
- **helmet CSP off**: if the router ever serves HTML, CSP absence matters; recorded in design Open
  questions; AC-3's minimum is met.
- **Limiter window-edge burst (≤ 2×60)** — accepted (Assumptions); if the owner objects, raise the
  env value or file a sliding-window follow-up; do not silently swap limiter libraries.
- **Flaky AC-4 on a loaded container**: the burst test is sequential supertest (~ms per request); the
  recovery test uses the probe-stable `Retry-After` sleep. Re-run a failed timing-sensitive assertion
  once and paste both runs; never weaken the 60/60_000 constants (backlog-owned figures).

## Deviations from architecture

none observable (architecture untracked — backlog Assumptions; same note as the US-4 spec). Recorded
for the architect/owner, none blocking: the `express-rate-limit` dependency addition (story-delegated),
process-wide `trust proxy` touching `concurrencyLimit`'s key (design Risks), and the `deploy/` config
artifact (mandated by AC-6; no component or deployment diagram is drawn or changed).

## Branch name

`agent/us-5-public-surface-hardening`

## Progress log

- **Task 1 (baseline + dependency):** `npm test` → 26 suites / 313 tests passed (green at baseline);
  `npx tsc --noEmit` exit 0. `npm install --save express-rate-limit@^8.7.5` → resolved 8.7.5;
  `git status --short` lists only `backend/package.json` + `backend/package-lock.json` (the tracked
  lockfile — sanctioned).
- **Task 2 (pure policy):** `npx jest activityHardening` green (11 tests); `npx tsc --noEmit` exit 0.
  (`tests/fixtures/publicSurfaceFixtures.ts` was created alongside this task because the unit test
  imports its constants — same file set as task 4, earlier order only.)
- **Task 3 (surface factories):** `npx jest activityHardening` green (16 tests, incl. the
  `legacyCorsGuard` supertest table: `/health`+`/entity` spy-called with `ACAO: *`; `/activity` and
  `/activity/x` spy-not-called; `/activityfoo` spy-called); `npx tsc --noEmit` exit 0;
  `npm run lint` exit 0.
- **Task 4 (test vehicle):** `createHardenedActivityApp` added; `npx tsc --noEmit` exit 0 (behaviour
  proven by the task-5 suite, per the spec).
- **Task 5 (contract suite):** `npx jest activitySurface.api` green — 14 tests (AC-1 per-method 405 +
  byte-identical frozen body + database-unchanged incl. `-wal`/`-shm` sidecars; AC-2 three origins +
  deny-by-default + case-variant + no-wildcard sweep over 200/204/404/405/429 on both compositions;
  AC-3 helmet set + no `x-powered-by` + no path/db-name in headers or body);
  `npx tsc --noEmit` exit 0; `npm run lint` exit 0.
- **Task 6 (AC-4 burst):** `npx jest activitySurface.rateLimit` green **twice** (run 1: 5/5 in 1.733 s;
  run 2: 5/5 in 1.657 s) — 62-request spoofed-XFF burst (60×200, #61/#62 frozen 429 with integer
  `Retry-After` and draft-7 `RateLimit`), key independence (IP B, no-XFF peer, two-hop chain keys on
  leftmost IP), window pass via `Retry-After × 1000 + 200 ms` sleep, env override `=3`;
  `npx tsc --noEmit` exit 0.
- **Task 7 (production wiring):** `activityRouter.ts` default export → `buildHardenedRouter(() =>
  createActivityRouter())` (comment free of AC-5(g) forbidden words); `index.ts` 3-line edit only
  (trust proxy, `legacyCorsGuard(cors())`, one import — mount lines byte-identical).
  `npx jest activitySurface.mount activityMount activityReadOnly activityApi` green — 5 suites / 64
  tests, the four existing US-4 suites **unmodified** (raw factory answers with no helmet headers;
  `/health` keeps `ACAO: *` + `X-Powered-By: Express`). `npx tsc --noEmit` exit 0;
  `npm run lint` exit 0. Interim full `npm test`: 30 suites / 358 tests green.
- **Task 8 (tunnel artifact):** `deploy/cloudflared/activity-tunnel.example.yml` + `README.md`
  committed per the artifact section (placeholders and env-var NAMES only; `/activity` the only
  forwarded path). `npx jest tunnelConfig` green — 12 tests (single forwarded service path, no
  entity/chat/health substrings in the yml, `http_status:404` catch-all, placeholder-only URL and
  hostname tokens, pure-placeholder credentials-file, no env assignments, no credential-shaped
  matches, README names the five env vars); `npx tsc --noEmit` exit 0; `npm run lint` exit 0.
  Manual (review): both artifacts read against AC-6's wording — satisfied.
- **Task 9 (AC-5 handoff):** recipe (spec wording) placed in the PR body and in the artifact README.
  **Manual (user)** — owner reports per-path status codes at the sprint-2 exit; the container cannot
  see the tunnel. **Not tested** here by design.
