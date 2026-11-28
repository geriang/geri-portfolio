# Public activity tunnel (US-5)

This directory holds the committed, secret-free recipe for the **outer lock** of the
ADR-2 defence-in-depth pair: the tunnel rule forwards **only** `GET /activity` to the
backend and answers every other path with `404` at the tunnel, so nothing else on the
host is ever reachable from the internet. The **inner lock** — the method `405`, the
CORS allowlist, the helmet headers and the 60-per-minute rate limit — lives in
`backend/src/hardening/` and is CI-proven by the AC-1…AC-4 suites even without any
tunnel running.

The single forwarded backend path is `/activity` (see
`activity-tunnel.example.yml`). The catch-all `http_status:404` ingress rule makes sure
no other path ever reaches the backend.

## Configuration comes from environment variables — names only

The values below live **only on the owner's host** and are never committed, echoed or
logged. This repository documents the variable **names**, never their values.

- `ACTIVITY_TUNNEL_NAME` — the tunnel identifier issued by the tunnel service for this
  host.
- `ACTIVITY_TUNNEL_HOSTNAME` — the public hostname that serves the activity endpoint
  (placeholder example shape: `activity.example.com`, an RFC 2606 documentation domain).
- `ACTIVITY_TUNNEL_CREDENTIALS_FILE` — the path to the tunnel service's credential
  material on the owner's host.
- `ACTIVITY_ALLOWED_ORIGINS` — comma-separated CORS allowlist read by the backend per
  request; unset means deny (no cross-origin reads).
- `ACTIVITY_RATE_LIMIT_PER_MINUTE` — optional limiter override; the default is the
  backlog figure of 60 admitted requests per minute per client IP.

TLS comes from the tunnel service — this recipe configures no certificates.

## Running the tunnel (owner's host)

1. Copy `activity-tunnel.example.yml` to a **private** file outside the repository.
2. Fill the `${...}` placeholders in that private copy with the real values from the
   owner's environment (the ones named above). Keep the `service` port in sync with the
   backend's `PORT` (default `8080`).
3. Start it:

   ```sh
   cloudflared tunnel --config <private copy>
   ```

4. Development-only alternative: an ephemeral quick tunnel pointed at the single path,

   ```sh
   cloudflared tunnel --url http://127.0.0.1:8080/activity
   ```

   Its hostname is ephemeral — never record it in this repository.

**Policy:** the filled private copy is **never committed** (no account names, real
hostnames, credential paths or secret material in any committed file — AC-6). The
committed example file stays placeholder-only forever; US-16 later sets the real
allowlist origins and production hostname through the environment variables above.

## Verifying the public surface (AC-5)

From outside the container, against the tunnel hostname, report **status codes only**
(never headers, tokens or cookies):

```sh
for p in /activity /entity /chat /health; do
  curl -s -o /dev/null -w "$p %{http_code}\n" "https://${ACTIVITY_TUNNEL_HOSTNAME}$p"
done
```

Expect: `/activity` answers `200`; `/entity`, `/chat` and `/health` are not forwarded
and each answers `404` (or `403` if the owner adds a policy rule) from the tunnel.
`/activity` is the only public route.
