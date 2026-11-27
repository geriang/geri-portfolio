# US-5: Public surface hardening

Status: draft

## Story
As a site owner, I want the public side of the API locked to exactly the activity endpoint and nothing else, so that exposing the heatmap data to the internet never exposes write access, other routes, my origin or an unthrottled endpoint.

## Requirements
BR: BR-2, BR-7. NFR: NFR-6. ADR: ADR-2.

## Acceptance criteria
- AC-1: Given the API is running, when a client sends `POST`, `PUT`, `PATCH` or `DELETE` to `/activity`, then the response status is `405` and no handler for those methods runs (a probe write to the database through such a request changes nothing), while `GET /activity` keeps answering `200` and `OPTIONS /activity` answers within the CORS policy. (Verified by: Jest + supertest test per method plus a database-unchanged assertion; BR-2.)
- AC-2: Given an allowlist configured through environment (origins as a comma-separated value, never hardcoded), when `GET /activity` arrives with an `Origin` on the allowlist, then the response carries `Access-Control-Allow-Origin` set to exactly that origin; when the `Origin` is not on the allowlist, then no `Access-Control-Allow-Origin` header is present; the wildcard `*` never appears on any `/activity` response; with no allowlist configured, the default is deny (no ACAO header). (Verified by: Jest + supertest tests over three origins — allowed, denied, absent; BR-2, ADR-2.)
- AC-3: Given any response from `/activity`, when the response headers are inspected, then the helmet-provided security headers are present (at minimum `X-Content-Type-Options: nosniff`), the response does not advertise an `X-Powered-By` value, and no header or body carries a filesystem path or database file name. (Verified by: Jest + supertest header assertions; NFR-6, ADR-2.)
- AC-4: Given a single client IP, when it sends more than 60 `/activity` requests within one rolling minute, then the 61st and later requests receive `429` until the window passes, and earlier successful responses are unaffected; the limiter keys on the client IP behind a proxy (`trust proxy` enabled), so a tunneled request is not collapsed onto the proxy's own address. (Verified by: Jest + supertest burst test with a spoofed `X-Forwarded-For`; NFR-6, ADR-2.)
- AC-5: Given the hardening is deployed on the owner's host, when the owner checks from outside the container through the tunnel hostname, then `GET /activity` answers `200` and at least three non-activity paths (for example `/entity`, `/chat`, `/health` on the tunnel host) are not forwarded and answer `404` or `403` from the tunnel rule, and `/activity` is the only public route. (Manual (user): run on the owner's host with the real tunnel; report status codes per path only, never headers carrying tokens or cookies. BR-2, BR-7, ADR-2.)
- AC-6: Given the repository contains the tunnel configuration artifact (or a documented recipe committed as a config file with placeholders instead of secrets), when a reviewer inspects it, then it names `/activity` as the only forwarded path, contains no account names, tokens or real hostnames, and the hardening settings (allowlist, rate limit) come from environment variables whose names — not values — are documented. (Verified by: review of the committed artifact plus a secrets-pattern scan of the diff; BR-7, NFR-6.)
- AC-7: Given the whole backend test suite, when `npm test` runs in `backend/` after the hardening lands, then all pre-existing US-4 contract tests and legacy portfolio route tests still pass unchanged, and the hardening is scoped to the activity surface: legacy portfolio routes keep their current behavior for methods and CORS as tested before this story. (Verified by: `npm test` in `backend/` green on the branch; BR-2, BR-7.)

## Out of scope
- Authentication, sessions or any write endpoints (none are added anywhere in this project).
- Hardening or changing the legacy portfolio routes themselves beyond keeping them reachable behind the same app (their exposure is handled by the tunnel rule, AC-5).
- The production hostname and CORS allowlist values themselves (US-16 fills the real origins once the owner owns a domain).
- TLS configuration at the tunnel (provided by the tunnel service, not this code).
- Compression, caching or CDN headers.

## Dependencies
US-4 (merged). US-16 depends on this story.

## Design needed
yes: new middleware composition and a new tunnel configuration artifact; the tech lead must decide how the hardened activity surface coexists with the legacy wildcard `cors()` in `backend/src/index.ts` (per-route middleware vs a separate app or port).

## Branch name
agent/us-5-public-surface-hardening

## Notes
- Current state to change: `backend/src/index.ts` mounts a wildcard `app.use(cors())` and no helmet or limiter, and there is no tunnel configuration in the repository. `helmet` and `cors` are already dependencies; the rate limiter library choice is the tech lead's call (record it in the design).
- Per ADR-2 the public surface is exactly `GET /activity`; the tunnel rule (AC-5) is the outer lock and the method/CORS/rate-limit middleware is the inner lock — both are required (defence in depth), and AC-1 to AC-4 prove the inner lock even without the tunnel.
- The rate-limit figure (60/min) and the helmet/trust-proxy requirements come from the backlog line for this story; the exact limiter library, window rounding and 429 body shape are design decisions, as is where the allowlist environment variable is named.
- The tunnel artifact may be a cloudflared-style config file with placeholder hostnames or a documented recipe; no real hostnames, account names, tokens or cookies in any committed file (repository alias note and AC-6).
- US-16 later sets the real allowlist origins and the production hostname; do not hardcode anything here that US-16 would have to undo.
- Test data: generated origins and IPs only (RFC 5737 documentation ranges, `api.example.com` style).

## Type
backend

## UX needed
no: no screens are added or changed; this story hardens the server surface only.
