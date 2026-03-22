<!-- Project-specific Copilot instructions for CardWise -->

# Copilot / AI Agent Instructions — CardWise

**Purpose**: Give an AI coding agent the minimal, high-value context to be productive in this repository.

- **Primary stack**: Next.js (App Router) + TypeScript frontend and Next.js API routes, Prisma ORM, PostgreSQL. See [README.md](README.md).
- **Dev tools**: Node 18+, Prisma, Tailwind, Vitest. Local DB via `docker compose`.

**Quick start (what to run first)**
- Install: `npm install`
- Start DB: `docker compose up -d`
- Generate Prisma client: `npm run db:generate`
- Run migrations: `npm run db:migrate`
- Seed data: `npm run db:seed`
- Start dev server: `npm run dev`
- Run tests: `npm run test:run` (CI-friendly) or `npm run test` (watch)

**Big picture / architecture**
- Frontend and backend live in the same Next.js app (App Router). UI pages and API routes coexist under [src/app](src/app).
- Server-side DB access and business logic is implemented via Prisma in [prisma/schema.prisma](prisma/schema.prisma) and the query layer in [src/services](src/services).
- Auth is configured in [src/lib/auth.ts](/src/lib/auth.ts) using NextAuth; Prisma client singleton in [src/lib/prisma.ts](src/lib/prisma.ts).
- Recommendation/ranking logic lives in [src/services/ranking.service.ts](src/services/ranking.service.ts) and is covered by unit tests in [src/test/ranking.service.test.ts](src/test/ranking.service.test.ts).

**Project-specific conventions & patterns**
- API routes: Prefer small handler files in `src/app/api/*` that return JSON; search for `GET`/`POST` handlers under [src/app/api](src/app/api).
- DB migrations & seeding: Use the `prisma` scripts in `package.json` (`db:generate`, `db:migrate`, `db:seed`). `postinstall` runs `prisma generate`.
- State management: client-only state in `src/stores` uses Zustand (wallet and store search are relevant patterns to follow).
- UI primitives: `src/components/ui` holds shadcn-style components — prefer using these for consistent styling.

**Testing & CI**
- Tests run with Vitest. Config is at [vitest.config.mts](vitest.config.mts). Use `npm run test:run` in CI and `npm run test` locally for watch mode.
- Important tests to inspect when changing ranking or utils: [src/test/ranking.service.test.ts](src/test/ranking.service.test.ts) and [src/test/utils.test.ts](src/test/utils.test.ts).

**Integration points / external deps**
- Database: PostgreSQL (local via Docker, production via Supabase). Connection string is `DATABASE_URL` in `.env.local`.
- OAuth: Google credentials are optional; NextAuth config expects `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in env.
- Deployment: Vercel hosts the app (frontend + API routes). DB migrations/seeding expected during deployment steps.

**What to edit and how to validate changes**
- Small UI/logic changes: run `npm run dev` and exercise the UI at `http://localhost:3000`.
- Backend/DB changes: run migrations (`npm run db:migrate`) and then `npm run db:seed` if needed. Use `npm run db:studio` to inspect data.
- When changing ranking or offer logic, run the related unit tests and update `src/test/*` accordingly.

**Files to inspect first when investigating a change**
- App entry / routes: [src/app/page.tsx](src/app/page.tsx) and [src/app/api](src/app/api)
- Prisma schema + seed: [prisma/schema.prisma](prisma/schema.prisma), [prisma/seed.ts](prisma/seed.ts)
- Recommendation logic: [src/services/ranking.service.ts](src/services/ranking.service.ts)
- DB client / auth: [src/lib/prisma.ts](src/lib/prisma.ts), [src/lib/auth.ts](src/lib/auth.ts)
- Tests: [src/test](src/test)

**Merging note**
- If an existing `.github/copilot-instructions.md` is present elsewhere (worktrees/backups), preserve examples and these repo-specific commands. This file is intentionally short — prefer adding concrete, discoverable examples rather than generic engineering guidance.

If anything in this summary is unclear or you want more detail for a specific area (CI, DB workflow, or ranking logic), tell me which part and I'll expand the instruction with concrete examples or troubleshooting steps.
