# Docker — IMC monorepo

## What runs

| Service | Public? | Role |
|---------|---------|------|
| `web`   | yes (`localhost:3000`) | Next.js BFF + UI |
| `api`   | **no** (only Docker network) | Express + SQLite |

Browser → `web` → `http://api:3333` (internal). Port 3333 is not published.

## Prerequisites

- Docker Desktop (or Engine + Compose plugin)

## Setup

```bash
cp .env.example .env
# edit JWT_SECRET to a long random string
```

## Run

```bash
docker compose up --build
```

Open http://localhost:3000  

Demo users (when seeds are enabled):

| User | Password | Notes |
|------|----------|--------|
| `admin` | `admin123` | `SEED_ADMIN=true` |
| `professor` | `prof123` | `SEED_DEMO=true` |
| `aluno` | `aluno123` | linked to professor + 24 months of assessments |

Stop:

```bash
docker compose down
```

SQLite data lives in the `api_data` volume (survives `down`; wipe with `docker compose down -v`).

## Notes

- Local `npm run dev:*` is unchanged — Compose is the production-like path.
- k6 still targets the API directly; with Compose you would need a temporary publish of 3333 or run k6 against the BFF (not covered here).
