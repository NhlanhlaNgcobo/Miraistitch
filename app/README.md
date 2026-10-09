# MiraiStitch — application

The production foundation for MiraiStitch: a multi-tenant commerce app built on
**Next.js (App Router, TypeScript) + Supabase (Postgres + Auth + RLS) + PayFast**, ready to run
locally and deploy to Vercel. This is Phase 0–1 of the plan in
[`../miraistitch/research/MiraiStitch-Research.md`](../miraistitch/research/MiraiStitch-Research.md):
multi-tenant data + auth + products/orders + a real PayFast checkout.

> The static demo and marketing landing live in the sibling `miraistitch/` folder. This app is
> the backend/logic. The polished motion UI (landing + drag-and-drop builder) is ported on top later.

## What works
- **Multi-tenant** data model, isolated by `store_id` with Postgres **Row-Level Security** (`supabase/migrations/0001_init.sql`).
- **Auth** — passwordless magic-link (Supabase Auth).
- **Merchant admin** (`/admin`) — create a store, add products, see orders, mark fulfilled.
- **Storefront** (`/s/[slug]`) — renders active products from the DB; cart → checkout.
- **PayFast checkout** — server validates prices from the DB, creates a pending order, redirects to PayFast; the **ITN webhook** (`/api/payfast/notify`) verifies the payment, marks the order paid, and decrements stock.

## Architecture
```
Browser ──/s/[slug]──▶ Next server component (anon, RLS) ── reads active products/layout
   │ add to cart (client)
   └─ POST /api/checkout ─▶ service-role: price-check, create pending order ─▶ PayFast redirect
PayFast ── ITN POST ─▶ /api/payfast/notify ─▶ verify (sig + server validate + amount) ─▶ mark paid, decrement stock
Merchant ──/admin (authed, RLS)──▶ own stores/products/orders only
```
RLS: storefront data is public-read (active products, published layouts); **orders are owner-read only** and are written server-side by the service role after payment, never by the browser.

## Prerequisites
- Node 18+
- A free [Supabase](https://supabase.com) project
- A [PayFast](https://www.payfast.co.za) account (sandbox works out of the box)

## Setup
1. **Install**
   ```bash
   npm install
   ```
2. **Database** — in the Supabase dashboard → SQL editor, run `supabase/migrations/0001_init.sql`.
   (Or use the Supabase CLI: `supabase db push`.)
3. **Auth** — Supabase → Authentication → Providers → enable **Email**. Add your dev URL
   `http://localhost:3000` and your prod URL to **Redirect URLs**.
4. **Env** — copy `.env.example` → `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API)
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
   - PayFast sandbox creds are pre-filled (merchant `10000100`).
5. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 → **Sign in** (magic link) → **/admin** → create a store + products.
   Then visit `/s/<your-slug>`.
6. **(Optional) seed a demo store** — after signing up at least one user, run `supabase/seed.sql`.

## Testing PayFast locally
PayFast must reach your `notify_url` from the internet, so expose localhost:
```bash
npx localtunnel --port 3000     # or ngrok http 3000
```
Set `NEXT_PUBLIC_SITE_URL` to the tunnel URL, restart `npm run dev`, and pay with the sandbox
card. Watch the order flip `pending → paid` in `/admin` once the ITN lands. Sandbox buyer:
use the test details at https://developers.payfast.co.za/docs#testing.

## Deploy (Vercel)
1. Push this folder to a Git repo and **Import** it in Vercel.
2. Add the same env vars in Vercel → Settings → Environment Variables. Set
   `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://app.miraistitch.co.za`) and
   `PAYFAST_MODE=live` with your live PayFast merchant id/key + a passphrase (set the same
   passphrase in the PayFast dashboard).
3. In Supabase, add your production domain to Auth redirect URLs.
4. Add your production `notify_url` (`/api/payfast/notify`) — it's built from `NEXT_PUBLIC_SITE_URL`, so no extra config.

## Go-live checklist
- [ ] Switch PayFast to **live** creds + passphrase; confirm the ITN `VALID` postback works.
- [ ] RLS isolation test in CI (attempt a cross-store read as user B → must return nothing).
- [ ] Order-confirmation email (Resend) from the webhook.
- [ ] Refunds / partial captures / reconciliation.
- [ ] Subdomain routing (`store.miraistitch.co.za` → `/s/[slug]`) in `middleware.ts`.
- [ ] Port the drag-and-drop builder to write `layouts.blocks`, and render storefront blocks from it.
- [ ] Rate limits + usage metering per store; POPIA export/delete.

## Project map
```
supabase/migrations/0001_init.sql   schema + RLS + helper functions
supabase/seed.sql                   demo store + products
src/lib/supabase/{server,client,admin}.ts   RLS clients + service-role client
src/lib/payfast.ts                  signature, checkout fields, ITN verify + validate
src/lib/tenant? (resolved inline)   store looked up by slug
src/middleware.ts                   session refresh (subdomain routing TODO)
src/app/api/checkout/route.ts       price-check + create order + PayFast redirect
src/app/api/payfast/notify/route.ts ITN webhook (verify → paid → stock)
src/app/s/[slug]/                   storefront (server) + cart/checkout (client) + thank-you
src/app/admin/page.tsx              merchant admin (RLS-scoped) + server actions
src/app/login + auth/callback       magic-link auth
```
