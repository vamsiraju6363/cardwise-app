# CardWise

This directory contains the CardWise Next.js application.

**Full documentation** — including setup, environment variables, scripts, and API reference — is in the [root README](../README.md).

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
