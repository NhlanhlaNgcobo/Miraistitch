# MiraiStitch — Research & Plan of Action

**A South African commerce platform: how Shopify works, how to re-engineer it for multi-tenant scale, how to add an AI store builder, and where to beat Shopify.**

- **Prepared for:** Mirai Stack founding team (product + engineering)
- **As of:** 8 October 2026
- **Status:** Research draft → feeds the build roadmap in §6
- **Scope:** Architecture research, a multi-tenant design, an AI-builder design, the competitive wedge, and a phased plan of action.

---

## 0. Executive summary

Shopify is a **modular monolith** (Ruby on Rails) that isolates each store by `shop_id` and scales by splitting tenants across self-contained **pods**. Its newest edge is an **AI store builder** that turns a brand prompt into an editable, block-structured storefront.

MiraiStitch does not need to match Shopify's scale to win — it needs to **house its first 100+ merchants on a clean multi-tenant foundation that scales to thousands**, add an **AI builder** on top of the typed-block layout model it already has, and attack the one place Shopify is structurally weak in South Africa: **payments and localisation.**

Three decisions anchor everything:
1. **Tenancy:** one Postgres database, shared tables, **Row-Level Security (RLS)** keyed by `store_id`. Cheap, simple, scales to thousands; adopt Shopify-style "pods" only when volume forces it.
2. **AI builder:** the LLM's only job is to emit **validated layout JSON** against a fixed block schema — the same JSON the drag-and-drop builder already edits. Logic (products, stock, checkout) stays in fixed components, never in the model.
3. **Wedge:** **native local payments (PayFast/Yoco/Ozow/SnapScan) with no platform transaction fee, ZAR billing, local logistics, WhatsApp commerce, POPIA.** This is the durable moat — Shopify can't close it in SA without launching Shopify Payments here, which it has said isn't imminent.

---

## 1. How Shopify works

### 1.1 Modular monolith, not microservices
Shopify's core is one large Rails codebase deployed as a single unit, internally divided into strict **domains** (Orders, Products, Checkout, Customers). Domains communicate through public interfaces, never by reaching into each other's database tables. The stated rationale is to avoid microservice overhead — network latency, distributed tracing, orchestration — while keeping internal modularity.

**Lesson for us:** start as a well-structured monolith (a single Next.js app with clear module boundaries). Don't split into services prematurely.

### 1.2 Tenancy: `shop_id` sharding → pods
- Every store is a tenant identified by `shop_id`, used as the **sharding key**.
- Data is split across **independent MySQL clusters**; Shopify grouped a full stack (MySQL + Redis + Memcached) into a self-contained **pod** that can run in any region. There are 100+ pods.
- Large merchants can get dedicated pods for full resource isolation.
- **"Redismageddon":** a single shared Redis once took down all of Shopify. The resulting principle — **never share a resource across all tenants** — is the single most important architectural idea to copy. Today an outage affects one pod/region, not the platform.

### 1.3 Stack
Rails on Puma; **MySQL** as the primary scaling focus (some **Vitess** for horizontal sharding); Memcached (ephemeral); Elasticsearch (search); **Kubernetes on Google Cloud**, multi-region.

### 1.4 Theming & storefronts
Storefronts render from themes (Liquid templating, "Online Store 2.0" sections). The **Horizon** theme introduced **Theme Blocks** — composable building blocks merchants rearrange without code. This block model is exactly the abstraction an AI builder targets.

### 1.5 AI (Summer '25 Edition and later)
- **AI store builder:** describe the brand ("tennis gear and stylish athleisure") → a ready-to-edit storefront, typically ~3 variations (hero, featured products, value props, default copy).
- **AI block generator:** writes section code from a plain description.
- **Sidekick:** the admin assistant (voice + screen-share).
- **Key insight:** Shopify's AI **fills a typed block/section structure** — it does not freestyle arbitrary HTML. Constrained, schema-shaped output is the industry pattern.

### 1.6 What this tells us
- A monolith with hard module boundaries is the right starting shape.
- Tenant isolation by a single key (`store_id`) from day one makes the pod path possible later.
- Themes-as-data (block JSON) is both the builder model and the AI target.

---

## 2. Re-engineering for 100+ (really: thousands of) merchants

### 2.1 Reframe the number
100 tenants is trivial — a single Postgres instance serves that comfortably. The engineering goal is a **foundation that reaches thousands without a rewrite.** Build the discipline (one tenant key, strict isolation, metering) that *lets* you add pods at 10,000; don't build pods for 100.

### 2.2 Tenancy model — shared schema + RLS (the default)
Industry consensus for B2B SaaS, and native to Supabase/Postgres:

- Every table carries **`store_id`**, with **`store_id`-leading indexes**.
- **Postgres Row-Level Security** policies guarantee a query only ever sees its own store's rows — this is `shop_id` isolation at small scale.
- **Pros:** cheapest to operate, one migration path, easy cross-tenant analytics, scales further than founders expect.
- **Risks & mitigations:**
  - *Policy misconfiguration is the #1 leak risk* → **test RLS in CI**: an automated test attempts cross-tenant reads/writes and asserts they fail.
  - *Per-row helper calls can silently slow endpoints* → wrap helpers so they evaluate **once per query**, not per row.
  - *Noisy neighbours share the DB* → add per-store rate limits + usage metering now; move heavy tenants out later.
- **Why not schema-per-tenant / DB-per-tenant:** both give stronger isolation but hit a wall at thousands of tenants (migration sprawl, catalog/planner pressure, `pg_dump`/autovacuum load). Keep per-tenant *customisation as data* (layout JSON), not as schemas, and the wall never arrives.

### 2.3 Core data model (first cut)
```sql
-- tenants
stores(
  id uuid pk, owner_id uuid, name text, slug text unique,
  subdomain text unique, custom_domain text,
  plan text default 'starter', status text default 'active',
  currency text default 'ZAR', vat_rate numeric default 15,
  created_at timestamptz default now()
)
store_members(store_id uuid, user_id uuid, role text)      -- staff access
products(id uuid pk, store_id uuid, title, description, price_cents int,
         stock int, images jsonb, active bool, created_at timestamptz)
layouts(store_id uuid pk, blocks jsonb, published_at timestamptz)  -- the storefront design
orders(id uuid pk, store_id uuid, number text, customer jsonb,
       status text, fulfil text, total_cents int, ship_cents int,
       ship_method text, payment_ref text, created_at timestamptz)
order_items(id uuid pk, order_id uuid, store_id uuid, product_id uuid,
            qty int, price_cents int)
payments(id uuid pk, store_id uuid, order_id uuid, provider text,
         status text, amount_cents int, raw jsonb)
usage_counters(store_id uuid, period date, orders int, api_calls int, storage_bytes bigint)
```
Every business table has `store_id`; every one gets an RLS policy:
```sql
alter table products enable row level security;
create policy tenant_isolation on products
  using (store_id = current_setting('app.store_id')::uuid);
-- set app.store_id per request from the resolved tenant (never from client input)
```

### 2.4 Routing & storefront rendering
- **Tenant resolution by host:** `store.miraistitch.co.za` (wildcard DNS) or a merchant's custom domain → **Next.js middleware reads the Host header → resolves `store_id`** → sets the request's tenant context.
- **Storefront = published `layouts.blocks` + live product data.** Render with **SSR + ISR / edge caching** on Vercel: cache the layout aggressively (it changes rarely), fetch price/stock fresh. This is what makes many stores cheap to serve.
- **Admin & builder** are authenticated app routes scoped to the member's stores.
- **Assets** (product images) in Supabase Storage / object storage behind a CDN.

### 2.5 Background work & integrations
- A job queue for: payment webhooks (PayFast ITN), order emails (Resend), courier rate lookups, AI generations, usage rollups. Keep these **off the request path**.
- **Never a single shared Redis as a hard dependency** for all tenants (the Redismageddon lesson) — isolate or make it degrade gracefully.

### 2.6 Scaling path (build only when forced)
1. **Now → low thousands:** one Supabase Postgres + RLS, Vercel edge, a queue. First 100 merchants fit the entry tier.
2. **Tens of thousands:** read replicas; partition hot tables (`products`, `orders`) by `store_id`; dedicated media buckets for heavy tenants.
3. **Platform scale:** Shopify-style **pods** — shard tenants across independent DB clusters by `store_id`, isolate noisy neighbours, regionalise.

### 2.7 Security & compliance
- RLS + CI policy tests; tenant context derived server-side from the resolved host/session, **never** from a client-supplied `store_id`.
- **POPIA:** explicit consent capture, data-subject export/delete per store, SA data-residency option for regulated tenants (move them to a silo later).
- Secrets (payment keys, `ANTHROPIC_API_KEY`) in server env only.

---

## 3. Integrating an AI store builder

### 3.1 We're already most of the way there
MiraiStitch's builder stores a page as a **typed block tree in JSON** (`miraistitch_layout`: `hero`, `products`, `collection`, `testimonial`, `newsletter`, …). That is the exact contract AI builders use (e.g. Puck). **The AI's only job is to produce that JSON**, validated against the block schema.

### 3.2 Architecture (the pattern the research converges on)
1. **The block schema is the contract.** An **allowlist** of block types, each with a strict props schema. *Schema design, not prompting, is the hard part.*
2. **Constrain the output.** Call the LLM with a **strict JSON schema / structured output**; **validate every response** and reject invented fields or retry. Never render raw model output.
3. **Stage the generation** (small prompts, tight guardrails):
   - **Planner** → brand prompt yields the ordered list of blocks (the section outline).
   - **Copywriter** → fills each block's text under length/CTA constraints, in brand voice (optionally **English + isiZulu / Afrikaans**).
   - **Theme** → selects palette/font tokens constrained to validated options (reuse the dataviz palette-validation idea).
4. **Keep logic out of the LLM.** The product grid renders from the database (filter, stock, pagination) in a fixed component; the AI decides *that a product block belongs here*, not the product data.
5. **One format for AI and humans.** The AI writes the same JSON the editor consumes, so "generate → tweak by hand" and **"edit by chat"** ("make the hero bolder, add a sale banner") both just mutate the layout JSON.

### 3.3 Flow
```
brand prompt ─▶ /api/ai/generate (serverless, holds ANTHROPIC_API_KEY)
  1. planner  → {blocks:[{type, intent}...]}        (validate: types ∈ allowlist)
  2. copy     → fill props per block                (validate: props schema)
  3. theme    → {palette, fonts} from allowed tokens
  ─▶ assemble layout JSON ─▶ validate whole doc ─▶ save to layouts.blocks
  ─▶ open in the drag-and-drop builder for edits
```

### 3.4 Infra & cost
- A **Vercel serverless function** holds the API key (never client-side).
- **Model tiering:** a fast/cheap model for copy, a stronger one for the plan; cache by prompt where safe.
- Optional: product-image generation or a curated stock library for empty stores.

### 3.5 Why it's also a wedge
Shopify's AI builder is English-first and generic. An AI builder that writes **SA-market copy, ZAR pricing, and local section patterns** (a WhatsApp-order block, a Pudo/Courier Guy shipping block) out of the box is genuinely differentiated — not a clone.

---

## 4. Where Shopify falls short — and MiraiStitch's play

| Shopify gap (sourced) | MiraiStitch play |
|---|---|
| **Shopify Payments unavailable in SA**, yet Shopify still charges a **third-party-gateway transaction fee** (Starter ~5%, Basic 2%, down to ~0.5%) **on top of** the gateway's 3–5% | **Native local payments with ZERO platform transaction fee.** The headline: "Keep 100% of your sale — we don't tax it." |
| Fee charged **even on failed/declined payments**; seen as paying "for nothing" | Sale-only or flat pricing; **no fee on failed payments** |
| **Billed in USD** — costs swing with USD/ZAR | **Billed in ZAR**, fixed local pricing, no forex exposure |
| Native high-converting checkout lost when using a 3rd-party gateway | **First-class local checkout** built around PayFast/Yoco as the default |
| Cost stacking ("double or more"); merchants churn to WooCommerce to escape fees | Position explicitly as **the anti-fee platform for African merchants** |
| Generic, global, English; app-dependent; theme code is complex | **AI builder + drag-drop in local context**, WhatsApp commerce, Pudo/PAXI/Courier Guy, POPIA, low-data mobile-first storefronts, local support |

**The moat is not "cheaper Shopify" — it is "built for how South Africa actually sells":** local rails, local logistics, local currency, local compliance, WhatsApp as a channel, and an AI builder that speaks the market.

---

## 5. Positioning

- **One-liner:** *The commerce platform built for South African makers — local payments with no sales tax from us, an AI that builds your store, and delivery your customers already trust.*
- **ICP:** SA makers, fashion labels, craft/food/home brands; solo-to-small teams; mobile-first; frustrated by Shopify's USD fees or by informal WhatsApp-only selling.
- **Primary wedge:** payments + no platform fee. **Secondary:** AI builder + WhatsApp + local logistics.

---

## 6. Plan of action

Phased so each stage ships something usable and de-risks the next. Effort is indicative for a small team.

### Phase 0 — Foundations (1–2 weeks)
- **Goal:** one multi-tenant skeleton that can create a store and serve it by subdomain.
- **Work:** Next.js app on Vercel; Supabase (Postgres + Auth + Storage); the §2.3 schema; **RLS policies + a CI test** that proves cross-tenant isolation; host-based tenant middleware; path-based routing first (`/s/[slug]`), subdomains next.
- **Done when:** two stores exist, each sees only its own data (verified by the CI test), and each renders at its own route.

### Phase 1 — The money loop (2–3 weeks) ← highest risk, do early
- **Goal:** a real sale end-to-end with a local gateway.
- **Work:** storefront from `layouts.blocks` + live products; cart; **PayFast** checkout (redirect + **ITN webhook** → order creation); order emails (Resend); merchant admin (products CRUD, orders, fulfil). **No platform transaction fee** baked into pricing.
- **Done when:** a pilot merchant takes a real PayFast sandbox → live payment and sees the order in admin.

### Phase 2 — Builder + AI (2–3 weeks)
- **Goal:** merchants design visually and can generate a store from a prompt.
- **Work:** port the existing drag-and-drop **builder** onto `layouts.blocks`; `/api/ai/generate` (planner → copy → theme, schema-validated); "edit by chat" that mutates the layout JSON; SA-aware blocks (WhatsApp order, local shipping).
- **Done when:** a brand prompt yields a valid, editable storefront in under a minute, and hand-edits persist.

### Phase 3 — Local logistics & channels (1–2 weeks)
- **Work:** Pudo / Courier Guy / PAXI rates at checkout; WhatsApp order block + checkout link; discounts.
- **Done when:** a shopper picks a real courier rate and a merchant can share a WhatsApp checkout link.

### Phase 4 — Harden & onboard (ongoing)
- **Work:** per-store rate limits + usage metering; billing (ZAR, fixed plans); POPIA export/delete; observability; onboard the first **100 merchants**.
- **Scale levers (only when metrics demand):** read replicas → `store_id` partitioning → pods.

### Success metrics
- Activation: % of sign-ups that publish a store and add ≥1 product.
- **Time-to-first-sale** per merchant.
- Merchants onboarded (target: 100 pilot).
- GMV and **take-rate vs. Shopify-equivalent cost** (the fee-savings story, quantified).
- AI-builder usage and edit-retention (do people keep the generated layout?).

---

## 7. Risks & open questions
- **PayFast/Yoco integration depth** — refunds, partial captures, reconciliation, payout timing. Validate in Phase 1.
- **RLS discipline** — one bad policy leaks data; CI tests are mandatory, not optional.
- **AI cost & quality** — cap spend per generation; measure how often output is kept vs. discarded.
- **Unit economics of "no platform fee"** — model revenue from subscriptions + optional value-adds (domains, AI credits, courier markup) so the no-fee promise is sustainable.
- **Trust & support** — SA merchants need responsive local support; factor it into pricing and staffing.
- **Verify before pitching:** exact Shopify fee percentages and current SA payment availability against Shopify's official pages (the fee figures here come largely from community forums).

---

## 8. Sources
- [Inside Shopify's Modular Monolith (kovyrin.net)](https://kovyrin.net/2024/06/16/interview-inside-shopify-monolith/)
- [Shopify tech stack (ByteByteGo)](https://blog.bytebytego.com/p/shopify-tech-stack)
- [Shopify's secret to handling billions in sales (HackerNoon)](https://hackernoon.com/shopifys-secret-to-handling-billions-in-sales)
- [Shopify launches an AI-powered store builder (TechCrunch)](https://techcrunch.com/2025/05/21/shopify-launches-an-ai-powered-store-builder-as-part-of-its-latest-update)
- [Shopify Editions Summer '25 AI update (Website Planet)](https://www.websiteplanet.com/news/shopify-editions-summer-25-ai-update)
- [South Africans charged transaction fees without Shopify Payments (Shopify Community)](https://community.shopify.com/t/why-are-south-africans-being-charged-transaction-fees-without-access-to-shopify-payments/197956)
- [Best Shopify payment gateways in South Africa (Netcash)](https://netcash.co.za/blog/the-best-shopify-payment-gateways-in-south-africa/)
- [Shopify lock-in / third-party processor fees (terms.law)](https://terms.law/ToS-Watchdog/payment-processors/shopify/)
- [How to architect multi-tenant SaaS on Postgres (ClickHouse)](https://clickhouse.com/resources/engineering/multi-tenant-saas-postgres-architecture)
- [Shipping multi-tenant SaaS using Postgres RLS (Nile)](https://thenile.dev/blog/multi-tenant-rls)
- [Multi-tenant SaaS architecture with Postgres RLS (MakerKit)](https://makerkit.dev/blog/md/tutorials/multi-tenant-saas-architecture)
- [How I built a multi-page AI website generator for SMBs (DEV)](https://dev.to/innocodes/how-i-built-a-multi-page-ai-website-generator-for-nigerian-smbs-architecture-llm-prompting-and-4pb5)
- [AI agent website building (n8nlab)](https://n8nlab.io/blog/ai-agent-website-building)

*Caveat: Shopify-internal details come largely from secondary engineering write-ups; the SA fee complaints are community-forum anecdotes; multi-tenancy and AI-builder sources skew to vendor content. Architecture conclusions are robust; verify specific Shopify fees and SA payment availability against official pages before external use.*
