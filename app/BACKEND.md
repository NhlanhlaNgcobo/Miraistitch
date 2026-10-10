# Add the backend

MiraiStitch runs **without a backend** — the landing, login screen, and a "connect your
backend" state all render, so you can develop and demo the UI immediately. The moment these
env vars point at a real Supabase project, the whole SaaS lights up: auth, admin, the AI
builder, storefronts, and PayFast checkout.

Detection lives in `src/lib/config.ts` (`supabaseConfigured`). Middleware skips the auth
refresh and every DB-backed page shows `SetupNotice` until it's true.

## 1. Supabase (database + auth + storage) — ~5 min
1. Create a free project at [supabase.com](https://supabase.com).
2. **Run the migrations** in order (SQL editor, or `supabase db push`):
   - `supabase/migrations/0001_init.sql` — stores, products, layouts, orders + RLS
   - `supabase/migrations/0002_ai_credits.sql` — AI credit metering
   - `supabase/migrations/0003_marketing.sql` — marketing/pixels
3. **Auth** → enable the **Email** provider. Add `http://localhost:3000` and your prod URL to
   **Redirect URLs**.
4. (Optional) seed a demo store: sign up once, then run `supabase/seed.sql`.

## 2. Environment — copy `.env.example` → `.env.local`
| Var | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | same page — **server only**, used by checkout + the PayFast webhook |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` in dev; your domain in prod |
| `PAYFAST_*` | PayFast sandbox is pre-filled; swap for live creds + a passphrase at launch |
| `ANTHROPIC_API_KEY` (opt.) | enables the live AI store builder / product tools |
| `RESEND_API_KEY` (opt.) | order-confirmation emails |
| `NEXT_PUBLIC_ROOT_DOMAIN` (opt.) | for subdomain storefronts (`store.yourdomain`) |

```bash
npm install
npm run dev        # http://localhost:3000
```

## 3. The flow, once connected (how it stitches together, like Shopify)
```
/  (landing)  →  /login (magic link)  →  /admin  ─ Design ─▶ AI builder + drag-drop → Publish
                                          │                       │ writes layouts.blocks
                                          │                       ▼
                                   Orders ◀── PayFast ITN ── /s/<slug>  (published storefront)
                                                              cart → /api/checkout → PayFast
```
- **Admin** (`/admin`): Home, Orders, Products, Design, Marketing, Credits, Settings.
- **Storefront** (`/s/<slug>` or `store.<domain>` via subdomain routing) renders the published
  builder layout; product pages, cart, and PayFast checkout are live.
- **Payments**: `/api/checkout` validates prices server-side and redirects to PayFast;
  `/api/payfast/notify` verifies the ITN, marks paid, decrements stock, emails the receipt.

## 4. Deploy (Vercel)
Import the repo, set the same env vars (set `NEXT_PUBLIC_SITE_URL` to the prod URL,
`PAYFAST_MODE=live`), add the prod URL to Supabase Auth redirect URLs. Done.

## 5. Before real customers
- `node scripts/rls-isolation.test.mjs` — proves a tenant can't read another's data.
- Switch PayFast to live creds + passphrase; confirm the ITN `VALID` postback.
- Review POPIA data export/delete.
