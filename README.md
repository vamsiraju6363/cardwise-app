# CardWise

[![CI](https://img.shields.io/github/actions/workflow/status/vamsiraju6363/cardwise-app/ci.yml?branch=main&logo=github&label=CI)](https://github.com/vamsiraju6363/cardwise-app/actions/workflows/ci.yml)

This directory contains the CardWise Next.js application (Next.js App Router, Prisma, NextAuth).

**GitHub Actions:** workflow [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) (`name: CI`) — runs on push and pull request to `main`; job `test-and-build` (Postgres 15 service, `prisma migrate deploy`, `npm run test:run`, `npm run build` with Node 20).

**Full documentation** — setup, environment variables, scripts, API surface, and deployment — is in the [root README](../README.md). Production checklist: [DEPLOYMENT.md](./DEPLOYMENT.md).

## Highlights (app behavior)

- **Wallet** — Catalog + custom add; offers sheet per card; deep link to Discover for “best stores” for one card.
- **Discover** — Store search + category browse; optional card filter for ranked merchants in that category.
- **Data** — Run `npm run db:seed` so categories/stores/offers exist (re-run is safe; duplicate offers are skipped).

## Quick start

```bash
npm install
cp .env.example .env.local
# Edit .env.local (see root README for variable definitions)

docker compose up -d
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
