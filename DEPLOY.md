# Deploying GUESS MY ANYTHING to Vercel

This guide walks you through deploying the site to **Vercel** with **GitHub**
for automatic push-to-deploy. It takes about 15 minutes.

---

## Why Turso? (read this first)

This app stores data in a database. On Vercel, the filesystem is **read-only**
at runtime, so a local SQLite file won't work — game sessions and learnings
would disappear between requests.

The fix is **Turso**: a free, network-accessible SQLite database. It's
SQLite-compatible (your Prisma schema barely changes) and the free tier is
generous (500 databases, 9 GB total). The app already supports it —
`src/lib/db.ts` auto-detects whether to use local SQLite or Turso based on
the `DATABASE_URL`.

---

## Step 1 — Push your code to GitHub

1. Create a new repo on GitHub (e.g. `guess-my-anything`).
2. From the project root:
   ```bash
   git remote add origin https://github.com/<your-username>/guess-my-anything.git
   git branch -M main
   git add -A
   git commit -m "Production-ready: Vercel + Turso deploy support"
   git push -u origin main
   ```

> **Tip:** The `.env` file is gitignored (it contains your DB path). That's
> correct — you'll set env vars in Vercel instead. The `.env.example` file
> IS committed and documents all variables.

---

## Step 2 — Create a free Turso database

1. Sign up at **https://turso.tech** (free, no credit card).
2. Install the Turso CLI:
   ```bash
   # macOS / Linux
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
   (Or use the web dashboard if you prefer.)
3. Log in and create a database:
   ```bash
   turso auth login
   turso db create guess-my-anything --location iad
   ```
   (`iad` = US East; pick whichever region is closest to you.)
4. Get your database URL and auth token:
   ```bash
   turso db show guess-my-anything --url
   turso db tokens create guess-my-anything
   ```
   Save both values — you'll paste them into Vercel next.

---

## Step 3 — Import the project to Vercel

1. Go to **https://vercel.com/new**.
2. Import your GitHub repo (`guess-my-anything`).
3. Vercel auto-detects Next.js — keep the defaults.
4. **Add Environment Variables** (Settings → Environment Variables):
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `libsql://guess-my-anything-<your-handle>.turso.io` |
   | `DATABASE_AUTH_TOKEN` | `eyXXXXXXXX…` (from step 2.4) |
5. Click **Deploy**.

The first build runs `postinstall` (which runs `prisma generate`) and then
`next build`. This takes 2–4 minutes.

---

## Step 4 — Seed your Turso database (one-time)

After the first deploy, your Turso DB is empty. Populate it by running the
setup script locally against Turso:

1. Create a `.env.turso` file in the project root (gitignored):
   ```
   DATABASE_URL=libsql://guess-my-anything-<your-handle>.turso.io
   DATABASE_AUTH_TOKEN=eyXXXXXXXX…
   ```
2. Run the setup script with that env loaded:
   ```bash
   DATABASE_URL="libsql://guess-my-anything-<your-handle>.turso.io" \
   DATABASE_AUTH_TOKEN="eyXXXXXXXX…" \
   bun run db:setup
   ```
   This pushes the schema and loads all 760+ entities, 360+ questions,
   and 12 categories.
3. Visit your Vercel URL — the game should work end-to-end.

> **That's it!** From now on, every `git push` to `main` auto-deploys.

---

## Step 5 — Add a custom domain (optional)

In Vercel: **Settings → Domains → Add**. Enter your domain and follow the
DNS instructions. Then update `SITE_URL` in `src/app/layout.tsx` and
`src/app/sitemap.ts` to your domain.

---

## Local development

For local dev, just use SQLite (no Turso needed):

```bash
cp .env.example .env          # already set to file:../db/custom.db
bun install                   # runs postinstall → prisma generate
bun run db:setup              # one-time: build the local DB
bun run dev                   # http://localhost:3000
```

---

## Troubleshooting

**"Prisma can't reach the database" on Vercel**
→ Check that `DATABASE_URL` and `DATABASE_AUTH_TOKEN` are set in Vercel
  (Settings → Environment Variables) and that you redeployed after adding them.

**Build fails with "prisma generate" error**
→ The `postinstall` script handles this. If it still fails, add
  `prisma generate` to Vercel's "Build Command" field:
  `prisma generate && bun run build`.

**Game works but data is empty**
→ You forgot Step 4 (seed Turso). Run `bun run db:setup` with the Turso env vars.

**"Everything looks gone" after pulling from GitHub**
→ The SQLite DB file isn't committed (and shouldn't be). Run `bun run db:setup`
  locally to rebuild it. Your code and schema are always safe in git.

---

## What's saved vs. what regenerates

| Asset | Where it lives | Persists? |
|-------|----------------|-----------|
| Code (components, API, engine) | git | ✅ always |
| Prisma schema | `prisma/schema.prisma` (git) | ✅ always |
| Seed data (entities, questions) | `prisma/*.ts` scripts (git) | ✅ regenerable via `db:setup` |
| Game sessions / results / learnings | Turso (production) or SQLite (local) | ✅ in DB |
| Admin-added entities (not in scripts) | DB only | ⚠️ back up via admin "Export" before reseeding |

**Key takeaway:** Your work is never truly lost. Code is in git; data is
regenerable from the seed scripts. Run `bun run db:setup` any time.
