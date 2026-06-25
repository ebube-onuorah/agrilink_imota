# FarmLink

A web-based farmer-to-buyer market linkage platform for the Imota and Ikorodu farming communities of Lagos State, Nigeria. Connects smallholder farmers directly with agricultural buyers to reduce post-harvest loss and middleman dependency.

This is the **Vercel-native rebuild** of the platform described in the final-year project *"Optimizing the Agricultural Supply Chain in Nigeria"* (originally specified on a Laravel/MySQL LAMP stack).

## Stack

| Concern | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Hosting | Vercel (serverless + edge) |
| Database | **Production:** Neon Postgres · **Local:** PGlite (embedded, zero-config) |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 (Credentials, JWT sessions, role-based) |
| Styling | Tailwind CSS v4 |
| Validation | Zod |
| Email | Resend (degrades to console logging locally) |
| Image upload | Vercel Blob (degrades to data URLs locally) |
| Charts | Recharts |
| Scheduled jobs | Vercel Cron (listing expiry) |
| Tests | Vitest (unit) · Playwright (E2E) |

## Local development

No external services or credentials required. The app uses an embedded PGlite database locally.

```bash
pnpm install
cp .env.example .env.local        # defaults work as-is for local dev
pnpm db:generate                  # generate SQL migration from the schema
pnpm db:migrate                   # apply to the local PGlite database
pnpm db:seed                      # load demo data
pnpm dev                          # http://localhost:3000
```

**Demo accounts** (password `Password123!`):
- `admin@farmlink.ng` — administrator
- `adaeze@imota.ng` — farmer
- `buyer@mile12.ng` — buyer

## Tests

```bash
pnpm test                         # Vitest unit tests
pnpm exec playwright install      # one-time, for E2E
pnpm db:reset && pnpm test:e2e    # Playwright E2E
```

## Deploying to Vercel

1. Create a **Neon** Postgres database and copy its pooled connection string.
2. Import this repo into **Vercel**.
3. Set environment variables (Project > Settings > Environment Variables):
   - `DATABASE_URL` — Neon connection string (enables the Neon driver automatically)
   - `AUTH_SECRET` — `npx auth secret`
   - `RESEND_API_KEY`, `EMAIL_FROM` — for transactional email (optional)
   - `BLOB_READ_WRITE_TOKEN` — Vercel Blob (auto-set when you add Blob storage)
   - `CRON_SECRET` — protects the expiry cron endpoint
4. Run migrations against Neon: `DATABASE_URL=... pnpm db:migrate` (optionally `pnpm db:seed`).
5. Deploy. The `vercel.json` cron runs `/api/cron/expire-listings` daily.

Set the Vercel project's function region close to your Neon region to keep latency low.

## Requirements coverage

All 12 functional requirements (FR-01 to FR-12) and 7 non-functional requirements (NFR-01 to NFR-07) from Chapter 3 of the project are implemented. See `src/app` for routes and `src/server` for the data, auth, validation, email, and action layers.
