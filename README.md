# CardWise

A credit-card-aware shopping helper. Add the cards you carry, search for a store or browse by category, and CardWise tells you which card gives you the best deal there right now.

I got tired of mentally rotating through three cards at checkout. This solves that.

<p>
  <a href="https://github.com/vamsiraju6363/cardwise-app/actions/workflows/ci.yml">
    <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/vamsiraju6363/cardwise-app/ci.yml?branch=main&logo=github&label=CI&style=flat-square">
  </a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white&style=flat-square">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white&style=flat-square">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white&style=flat-square">
  <img alt="NextAuth" src="https://img.shields.io/badge/NextAuth-5-1ABC9C?style=flat-square">
</p>

---

## The two screens that matter

### Wallet
Your cards. A sheet of current offers per card. From any card you can deep-link into Discover to see the stores where that card is the best choice.

### Discover
Search a store or pick a category. Optionally filter by a specific card. You get a ranked list of merchants for that category, plus which card wins at each one.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** | Server components + RSC streaming keep pages snappy. |
| Styling | **Tailwind + shadcn/ui** | Fast iteration without design debt. |
| Auth | **NextAuth v5** | Provider-agnostic. Email + OAuth supported out of the box. |
| DB | **PostgreSQL + Prisma** | Typed queries, easy migrations, Postgres is boring in the best way. |
| Tests | **Vitest** | Fast, zero-config. |
| CI | **GitHub Actions** | Runs tests + build on every push. Postgres service container for integration tests. |

## Getting started

```bash
git clone https://github.com/vamsiraju6363/cardwise-app.git
cd cardwise-app

npm install
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, provider creds

docker compose up -d          # Postgres 16 locally
npm run db:generate
npm run db:migrate
npm run db:seed               # re-run is safe; offers dedupe

npm run dev                   # http://localhost:3000
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the production checklist.

## Project structure

```
app/                 App Router pages, layouts, server actions
components/          UI components (shadcn-based)
prisma/              schema.prisma, seeds, migrations
lib/                 server utilities (auth, db, offer matching)
middleware.ts        NextAuth edge middleware
public/              static assets
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Prisma client generation |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Load categories, stores, offers |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run (CI) |

## Notes on the data model

- Offers are keyed by `(card_id, store_id, valid_from, valid_to)`. Duplicates are rejected by a unique index.
- Categories map to stores many-to-many — a grocery store can also count as household essentials.
- A card's "best store" ranking is computed by composing active offers with the user's category preferences.

## Roadmap

- [ ] Offer expiry reminders (push + email).
- [ ] Quarterly bonus-category cycling for cards that rotate.
- [ ] Apple Wallet / Google Pay integration to surface the winning card at tap time.
- [ ] Community-submitted offers with moderation.

## License

MIT.

---

Built by [Vamshi](https://www.linkedin.com/in/vamsi-raju/).
