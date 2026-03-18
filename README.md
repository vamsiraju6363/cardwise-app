# CardWise

A full-stack web app that helps you figure out which credit card to use at any store. Add your cards, search for a store, and CardWise ranks them by best reward — with a clear explanation for each recommendation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL (Docker locally, Supabase in production) |
| Auth | NextAuth.js (email/password + Google OAuth) |
| State | Zustand (wallet + search stores) |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel + Supabase |

## Prerequisites

- Node.js 18+
- Docker Desktop (for local PostgreSQL)
- A Google OAuth app (optional, for Google sign-in)

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd cardwise
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cardwise"
NEXTAUTH_SECRET="your-random-secret-here"   # generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""                          # optional
GOOGLE_CLIENT_SECRET=""                      # optional
```

### 3. Start the database

```bash
docker compose up -d
```

### 4. Run database migrations and seed

```bash
npm run db:generate   # generate Prisma client
npm run db:migrate    # run migrations (creates tables)
npm run db:seed       # seed with 8 cards, 6 categories, 10 stores, 25+ offers
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Management

```bash
npm run db:studio     # open Prisma Studio (visual DB browser)
npm run db:generate   # regenerate Prisma client after schema changes
npm run db:migrate    # run pending migrations
```

## Running Tests

```bash
npm run test:run      # run all tests once
npm run test          # run in watch mode
```

The test suite includes:
- **Unit tests** for the ranking algorithm (`src/test/ranking.service.test.ts`)
- **Unit tests** for utility functions (`src/test/utils.test.ts`)
- **RTL tests** for `StoreSearch` component (`src/test/StoreSearch.test.tsx`)
- **RTL tests** for `AddCardModal` component (`src/test/AddCardModal.test.tsx`)
- **RTL tests** for `OfferBadge` component (`src/test/OfferBadge.test.tsx`)

## Project Structure

```
cardwise/
├── prisma/
│   ├── schema.prisma          # Data models
│   └── seed.ts                # Seed data (8 cards, 10 stores, 25+ offers)
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & register pages
│   │   ├── (dashboard)/       # Main app pages
│   │   └── api/               # API route handlers
│   ├── components/
│   │   ├── cards/             # Wallet management UI
│   │   ├── store/             # Store search & recommendations
│   │   ├── tracker/           # Spending cap tracker
│   │   ├── layout/            # Navbar, sidebar, mobile nav
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── validations/       # Zod schemas
│   ├── services/              # Database query layer
│   ├── stores/                # Zustand client stores
│   ├── hooks/                 # TanStack Query hooks
│   ├── test/                  # Test files
│   └── types/                 # TypeScript type definitions
├── docker-compose.yml
├── vitest.config.mts
└── .env.example
```

## Data Model

CardWise uses a **global card catalog** model:

- **Card** — the global catalog of credit cards (Chase Freedom Flex, Amex Gold, etc.)
- **UserCard** — a user's specific instance of a card (with optional nickname and last-four digits)
- **Category** — spending categories (groceries, dining, gas, travel, etc.)
- **Store** — individual merchants (Target, Amazon, Starbucks, etc.)
- **Offer** — the reward offers linking cards to stores/categories (with optional spending caps)
- **SpendTracking** — tracks how much a user has spent toward an offer's cap in a given period

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/catalog` | List all cards in the global catalog |
| GET | `/api/cards` | List the authenticated user's wallet |
| POST | `/api/cards` | Add a card to the wallet |
| GET | `/api/cards/[id]` | Get a specific user card |
| PUT | `/api/cards/[id]` | Update a user card (nickname, last-four) |
| DELETE | `/api/cards/[id]` | Remove a card from the wallet |
| GET | `/api/stores?q=` | Search stores by name |
| GET | `/api/recommend?storeId=` | Get ranked card recommendations for a store |
| GET | `/api/offers` | Get spend tracking data |
| POST | `/api/offers` | Upsert spend tracking |
| GET | `/api/tracker` | Get cap progress for all active offers |

## Deployment

### Vercel (frontend + API)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables in the Vercel dashboard
4. Deploy

### Supabase (database)

1. Create a new project at [Supabase](https://supabase.com)
2. Copy the connection string to `DATABASE_URL`
3. Run `npm run db:migrate` with the production `DATABASE_URL`
4. Run `npm run db:seed` to populate initial data
