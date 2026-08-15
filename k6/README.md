# k6 load tests — IMC API

Stress/concurrency scripts against the **Express API** (not the Next BFF).

## Prerequisites

1. Install [k6](https://grafana.com/docs/k6/about/) (`winget install k6` / `choco install k6` / [releases](https://github.com/grafana/k6/releases)).
2. API running (`npm run dev:api`) with migrations applied and demo admin:

```bash
npm run seed:admin -w @imc/api
# creates admin / admin123 only if missing
```

If you changed the admin password later, pass it to k6 (do **not** use `USERNAME` — Windows owns that env var):

```bash
k6 run -e IMC_LOGIN_USER=admin -e IMC_LOGIN_PASSWORD=password k6/smoke.js
```

## Env

| Variable             | Default                 | Notes |
|----------------------|-------------------------|--------|
| `API_URL`            | `http://localhost:3333` | |
| `IMC_LOGIN_USER`     | `admin`                 | **Not** `USERNAME` — Windows already defines `USERNAME` as the OS account |
| `IMC_LOGIN_PASSWORD` | `admin123`              | Avoid `PASSWORD` for the same reason |
| `SESSION_VUS`        | `20`                    | Only `load-multi-session.js` — how many concurrent logged-in VUs |

```bash
k6 run -e IMC_LOGIN_USER=admin -e IMC_LOGIN_PASSWORD=admin123 k6/smoke.js
```

## Scripts

| File                    | Purpose |
|-------------------------|---------|
| `smoke.js`              | 5 VUs / 30s — lists + refresh sanity |
| `load.js`               | Ramp to 50 VUs — concurrent lists with **one shared** token |
| `load-multi-session.js` | Ramp to N VUs (default 20) — **each VU logs in** (own tokens) |
| `login-burst.js`        | Light concurrent `POST /login` (watch rate limit) |

`load.js` / `smoke.js` log in **once** in `setup()` and reuse the access token so they do not burn `LOGIN_RATE_LIMIT`.

`load-multi-session.js` is the “N sessions” case: each VU calls `/login` on first iteration, then reuses its own token.

## Run

```bash
# from repo root
k6 run k6/smoke.js
k6 run k6/load.js
```

Or via npm:

```bash
npm run test:load:smoke
npm run test:load
npm run test:load:sessions
npm run test:load:login
```

### Multi-session + login rate limit

Default API limit is **10 logins / 15 minutes / IP**. For `load-multi-session.js` or a heavier login burst, raise it on the API process:

```bash
LOGIN_RATE_LIMIT_MAX=200 npm run dev -w @imc/api

# then (optional VU count)
k6 run -e SESSION_VUS=30 k6/load-multi-session.js
# or
npm run test:load:sessions
```