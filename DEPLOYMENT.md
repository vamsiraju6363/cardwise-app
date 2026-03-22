# CardWise Deployment Guide

Deploy CardWise to **Vercel** (frontend + API) with **Supabase** (PostgreSQL).

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose your organization and fill in:
   - **Name**: `cardwise` (or your preferred name)
   - **Database password**: Generate and save securely
   - **Region**: Choose closest to your users
4. Click **Create new project** and wait for provisioning (~2 minutes).
5. In the Supabase dashboard, go to **Project Settings** → **Database**.
6. Copy these URLs:
   - **Connection pooling — Transaction mode** (port **6543**) → use as `DATABASE_URL`
   - **Direct connection** (port **5432**) → use as `DIRECT_URL`

   **Important:** Use the **Transaction** pooler for `DATABASE_URL`, not the Session pooler. Prisma with serverless Vercel functions needs transaction mode, not session mode. It's easy to grab the wrong one from the Supabase dashboard.

   Format (note: DIRECT_URL uses a **different host** — `db.xxx.supabase.co`, not pooler):
   ```
   DATABASE_URL = postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL   = postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

   Copy each from Supabase → Project Settings → Database → **Connection string** tab (URI for Transaction mode, and **Direct connection** for DIRECT_URL).

---

## 2. Environment Variables

Create `.env.local` locally (or set in Vercel) with:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase **Transaction** pooler URL (port 6543) — required for Prisma + serverless | From Supabase → Database → Connection string (Transaction mode) |
| `DIRECT_URL` | Supabase direct connection URL (port 5432) | From Supabase → Database → Connection string (Direct) |
| `NEXTAUTH_SECRET` | Random secret, min 32 chars | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | `https://your-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth (optional) | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (optional) | From Google Cloud Console |

See `.env.example` for the full template.

---

## 3. Production Deployment Checklist

- [ ] **Supabase project created** — New project at supabase.com with database provisioned
- [ ] **DATABASE_URL set in Vercel** — Supabase pooling URL (port 6543)
- [ ] **DIRECT_URL set in Vercel** — Supabase direct URL (port 5432)
- [ ] **NEXTAUTH_SECRET set** — Min 32 chars, e.g. `openssl rand -base64 32`
- [ ] **NEXTAUTH_URL set** — Production domain, e.g. `https://cardwise.vercel.app`
- [ ] **Google OAuth redirect URLs updated** — Add `https://yourdomain.com/api/auth/callback/google` in Google Cloud Console → OAuth credentials → Authorized redirect URIs (common first-deploy gotcha)
- [ ] **Prisma migrate deploy** — Run against production DB (uses DIRECT_URL for migrations):
  ```bash
  DATABASE_URL="<pooled-url>" DIRECT_URL="<direct-url>" npx prisma migrate deploy
  ```
- [ ] **Prisma db seed** — Run once after first production migration for the initial card catalog (8 cards, stores, offers):
  ```bash
  # Run once after first production migration
  DATABASE_URL="<direct-url>" DIRECT_URL="<direct-url>" npx prisma db seed
  ```
- [ ] **Test auth flow end-to-end** — Register/login, Google OAuth
- [ ] **Test add card → search store → see recommendations** — Full user journey

---

## 4. Deploy to Vercel

1. Push your repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
3. Import your GitHub repo.
4. Add environment variables (see checklist above).
5. Vercel will use the `vercel.json` build command: `prisma generate && next build`.
6. Deploy.

---

## 5. Run Migrations (First Deploy)

Before or after the first deploy, run migrations against the production database. Use your Supabase URLs:

```bash
# DATABASE_URL = Transaction pooler (6543). DIRECT_URL = Direct connection (db.xxx.supabase.co)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" \
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" \
npx prisma migrate deploy
```

---

## 6. Seed Production Data (Run Once After First Migration)

After `prisma migrate deploy`, run the seed script to populate the card catalog (8 cards, stores, offers):

```bash
# Run once after first production migration
DATABASE_URL="<DIRECT_URL>" DIRECT_URL="<DIRECT_URL>" npx prisma db seed
```

---

## 7. Troubleshooting Connection Errors

### P1001: Can't reach database server

- **Project paused** — Supabase free tier pauses projects after inactivity. Go to [supabase.com](https://supabase.com) → your project → click **Restore** if it shows "Paused".
- **Wrong DIRECT_URL** — The direct connection uses `db.[project-ref].supabase.co`, **not** `pooler.supabase.com`. Get it from Project Settings → Database → Connection string → **Direct connection**.
- **Wrong port** — Transaction pooler = 6543. Direct = 5432 (on `db.xxx.supabase.co`).

### P1000: Authentication failed

- **Wrong password** — Use the database password from Project Settings → Database (or reset it).
- **URL-encode special characters** — If your password has `@`, `#`, `%`, etc., encode them (e.g. `%40` for `@`).

### Connection works locally but fails on Vercel

- Ensure `DATABASE_URL` uses **Transaction** pooler (port 6543), not Session.
- Add `?pgbouncer=true` to `DATABASE_URL` when using the pooler with Prisma.

---

## 8. Google OAuth (When Ready)

When enabling Google login:

1. Go to [Google Cloud Console](https://console.cloud.google.com) → OAuth credentials.
2. Add your production domain to **Authorized redirect URIs**:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
3. This is the most common OAuth gotcha on first deploy — the redirect URI must match exactly.
