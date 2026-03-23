# CardWise

This directory contains the CardWise Next.js application (Next.js App Router, Prisma, NextAuth).

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
