-- MiraiStitch — AI features, credits and per-tenant metering
--
-- Adds: product SEO + media, an append-only credit ledger with a cached balance,
-- an AI job audit trail, and credit-pack purchases.
--
-- The security property that matters here: a store owner can READ their balance and
-- ledger but can never WRITE to either. There is deliberately no insert/update RLS
-- policy on the credit tables, so the only way credits move is through the
-- security-definer functions below, called by the server with the service role.
-- Otherwise a tenant could grant themselves unlimited paid image generations.

create extension if not exists pgcrypto;

-- ── products: SEO + merchandising fields ───────────────────
alter table public.products add column if not exists slug            text;
alter table public.products add column if not exists seo_title       text;
alter table public.products add column if not exists seo_description text;
alter table public.products add column if not exists tags            text[] not null default '{}';
alter table public.products add column if not exists compare_at_cents int;
alter table public.products add column if not exists sku             text;
alter table public.products add column if not exists updated_at      timestamptz not null default now();

-- slugs are unique per tenant, not globally: two stores may both sell a "blue-mug"
create unique index if not exists products_store_slug_idx
  on public.products(store_id, slug) where slug is not null;
create index if not exists products_store_active_idx on public.products(store_id, active, position);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ── product images ─────────────────────────────────────────
-- store_id is denormalised onto the row so RLS can be checked without a join.
create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  kind        text not null default 'original'  check (kind in ('original','enhanced')),
  source_id   uuid references public.product_images(id) on delete set null,
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id, position);

-- ── credits: cached balance ────────────────────────────────
create table if not exists public.store_credits (
  store_id   uuid primary key references public.stores(id) on delete cascade,
  balance    int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

-- ── credits: append-only ledger (the source of truth) ──────
-- delta > 0 granted/purchased, delta < 0 spent. Never updated, never deleted:
-- the balance above is a cache that must always equal sum(delta).
create table if not exists public.credit_ledger (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  delta       int  not null,
  reason      text not null,                 -- signup_grant | purchase | image_enhance | refund | adjustment
  ref         text,                          -- payment ref, ai job id, admin note
  balance_after int not null,
  created_at  timestamptz not null default now()
);
create index if not exists credit_ledger_store_idx on public.credit_ledger(store_id, created_at desc);
-- one ledger row per external reference: makes webhook retries harmless
create unique index if not exists credit_ledger_ref_idx on public.credit_ledger(reason, ref) where ref is not null;

-- ── AI jobs: audit, cost and idempotency ───────────────────
create table if not exists public.ai_jobs (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  kind         text not null check (kind in ('describe','seo','layout','image_enhance')),
  status       text not null default 'queued' check (status in ('queued','running','done','error')),
  cost_credits int  not null default 0,
  input        jsonb not null default '{}'::jsonb,
  output       jsonb,
  error        text,
  created_at   timestamptz not null default now(),
  finished_at  timestamptz
);
create index if not exists ai_jobs_store_idx on public.ai_jobs(store_id, created_at desc);

-- ── credit pack purchases (PayFast) ────────────────────────
create table if not exists public.credit_purchases (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  pack         text not null,
  credits      int  not null check (credits > 0),
  amount_cents int  not null check (amount_cents >= 0),
  status       text not null default 'pending' check (status in ('pending','paid','failed')),
  payment_ref  text not null,
  pf_payment_id text,
  created_at   timestamptz not null default now()
);
create unique index if not exists credit_purchases_ref_idx on public.credit_purchases(payment_ref);

-- ── RLS ────────────────────────────────────────────────────
alter table public.product_images   enable row level security;
alter table public.store_credits    enable row level security;
alter table public.credit_ledger    enable row level security;
alter table public.ai_jobs          enable row level security;
alter table public.credit_purchases enable row level security;

-- product images follow the product: public sees images of ACTIVE products, owner sees all
drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and p.active = true));
drop policy if exists product_images_owner_all on public.product_images;
create policy product_images_owner_all on public.product_images for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));

-- credits: READ ONLY for the owner. No write policy on purpose — see the header.
drop policy if exists store_credits_owner_read on public.store_credits;
create policy store_credits_owner_read on public.store_credits for select using (public.owns_store(store_id));
drop policy if exists credit_ledger_owner_read on public.credit_ledger;
create policy credit_ledger_owner_read on public.credit_ledger for select using (public.owns_store(store_id));
drop policy if exists credit_purchases_owner_read on public.credit_purchases;
create policy credit_purchases_owner_read on public.credit_purchases for select using (public.owns_store(store_id));

-- ai jobs: owner reads their own history; writes are server-side only
drop policy if exists ai_jobs_owner_read on public.ai_jobs;
create policy ai_jobs_owner_read on public.ai_jobs for select using (public.owns_store(store_id));

-- ── credit movement (service role only, via security definer) ──

-- Grant credits. Idempotent per (reason, ref): a replayed PayFast ITN cannot double-credit.
create or replace function public.grant_credits(sid uuid, n int, why text, r text default null)
returns int language plpgsql security definer set search_path = public as $$
declare bal int;
begin
  if n <= 0 then raise exception 'grant_credits: n must be positive'; end if;

  insert into public.store_credits(store_id, balance) values (sid, 0)
    on conflict (store_id) do nothing;

  -- lock this tenant's balance row so concurrent grants/spends serialise
  select balance into bal from public.store_credits where store_id = sid for update;

  if r is not null and exists (
    select 1 from public.credit_ledger l where l.reason = why and l.ref = r
  ) then
    return bal;  -- already applied; replay is a no-op
  end if;

  bal := bal + n;
  update public.store_credits set balance = bal, updated_at = now() where store_id = sid;
  insert into public.credit_ledger(store_id, delta, reason, ref, balance_after)
    values (sid, n, why, r, bal);
  return bal;
end; $$;

-- Spend credits. Returns the new balance, or -1 if there were not enough.
-- The row lock is what makes this safe: two concurrent enhance requests with one
-- credit left cannot both succeed.
create or replace function public.spend_credits(sid uuid, n int, why text, r text default null)
returns int language plpgsql security definer set search_path = public as $$
declare bal int;
begin
  if n <= 0 then raise exception 'spend_credits: n must be positive'; end if;

  insert into public.store_credits(store_id, balance) values (sid, 0)
    on conflict (store_id) do nothing;

  select balance into bal from public.store_credits where store_id = sid for update;
  if bal < n then return -1; end if;

  bal := bal - n;
  update public.store_credits set balance = bal, updated_at = now() where store_id = sid;
  insert into public.credit_ledger(store_id, delta, reason, ref, balance_after)
    values (sid, -n, why, r, bal);
  return bal;
end; $$;

-- Every new store starts with a few free image credits so the feature can be tried.
create or replace function public.handle_new_store()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.store_credits(store_id, balance) values (new.id, 0)
    on conflict (store_id) do nothing;
  perform public.grant_credits(new.id, 5, 'signup_grant', new.id::text);
  return new;
end; $$;

drop trigger if exists stores_grant_credits on public.stores;
create trigger stores_grant_credits after insert on public.stores
  for each row execute function public.handle_new_store();

-- Reconciliation check: the cached balance must always equal the ledger sum.
-- Run this in CI or a cron; it should always return zero rows.
create or replace view public.credit_drift as
  select c.store_id, c.balance, coalesce(sum(l.delta), 0)::int as ledger_total
  from public.store_credits c
  left join public.credit_ledger l on l.store_id = c.store_id
  group by c.store_id, c.balance
  having c.balance <> coalesce(sum(l.delta), 0)::int;
