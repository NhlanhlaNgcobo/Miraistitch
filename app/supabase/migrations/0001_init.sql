-- MiraiStitch — initial schema + Row-Level Security
-- Multi-tenant by store_id. Owners manage their own stores; storefronts are public-read;
-- orders are private to the owner and written server-side (service role) after payment.

create extension if not exists pgcrypto;

-- ── stores (tenants) ───────────────────────────────────────
create table if not exists public.stores (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  tagline     text default '',
  currency    text not null default 'ZAR',
  vat_rate    numeric not null default 15,
  shipping    jsonb not null default '[{"name":"The Courier Guy","cents":9900},{"name":"Pudo Locker","cents":6000},{"name":"Local pickup","cents":0}]'::jsonb,
  status      text not null default 'active',
  order_seq   int not null default 1000,
  created_at  timestamptz not null default now()
);
create index if not exists stores_owner_idx on public.stores(owner_id);

-- ── products ───────────────────────────────────────────────
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  title       text not null,
  description text default '',
  price_cents int  not null check (price_cents >= 0),
  stock       int  not null default 0 check (stock >= 0),
  image       text default '🛍️',
  active      boolean not null default true,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists products_store_idx on public.products(store_id);

-- ── layouts (the published storefront design — builder output) ──
create table if not exists public.layouts (
  store_id     uuid primary key references public.stores(id) on delete cascade,
  blocks       jsonb not null default '[]'::jsonb,
  published_at timestamptz
);

-- ── orders ─────────────────────────────────────────────────
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  number         text not null,
  customer       jsonb not null default '{}'::jsonb,   -- {name,email,phone,address}
  email          text,
  status         text not null default 'pending',       -- pending | paid | cancelled
  fulfilment     text not null default 'unfulfilled',   -- unfulfilled | fulfilled
  subtotal_cents int not null default 0,
  shipping_cents int not null default 0,
  total_cents    int not null default 0,
  ship_method    text,
  provider       text default 'payfast',
  payment_ref    text,                                   -- our m_payment_id
  pf_payment_id  text,                                   -- PayFast's id from the ITN
  created_at     timestamptz not null default now()
);
create index if not exists orders_store_idx on public.orders(store_id, created_at desc);
create unique index if not exists orders_ref_idx on public.orders(payment_ref);

-- ── order items ────────────────────────────────────────────
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  store_id    uuid not null references public.stores(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  title       text not null,
  qty         int not null check (qty > 0),
  price_cents int not null check (price_cents >= 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ── helper: does the current user own this store? (once-per-query) ──
create or replace function public.owns_store(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.stores s where s.id = sid and s.owner_id = auth.uid());
$$;

-- ── RLS ────────────────────────────────────────────────────
alter table public.stores      enable row level security;
alter table public.products    enable row level security;
alter table public.layouts     enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- stores: anyone may read (names/slugs aren't secret; storefront resolves by slug); owner writes.
drop policy if exists stores_read on public.stores;
create policy stores_read on public.stores for select using (true);
drop policy if exists stores_insert on public.stores;
create policy stores_insert on public.stores for insert with check (owner_id = auth.uid());
drop policy if exists stores_update on public.stores;
create policy stores_update on public.stores for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists stores_delete on public.stores;
create policy stores_delete on public.stores for delete using (owner_id = auth.uid());

-- products: public reads ACTIVE only; owner reads/writes all of their own.
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select using (active = true);
drop policy if exists products_owner_all on public.products;
create policy products_owner_all on public.products for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));

-- layouts: public reads PUBLISHED; owner reads/writes own.
drop policy if exists layouts_public_read on public.layouts;
create policy layouts_public_read on public.layouts for select using (published_at is not null);
drop policy if exists layouts_owner_all on public.layouts;
create policy layouts_owner_all on public.layouts for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));

-- orders & items: OWNER read only. No anon access. Writes happen via the service role
-- (PayFast webhook / checkout route), which bypasses RLS.
drop policy if exists orders_owner_read on public.orders;
create policy orders_owner_read on public.orders for select using (public.owns_store(store_id));
drop policy if exists orders_owner_update on public.orders;
create policy orders_owner_update on public.orders for update using (public.owns_store(store_id)) with check (public.owns_store(store_id));
drop policy if exists order_items_owner_read on public.order_items;
create policy order_items_owner_read on public.order_items for select using (public.owns_store(store_id));

-- ── atomic helpers used by the server (service role) ──
-- next order number per store (concurrency-safe)
create or replace function public.next_order_number(sid uuid)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.stores set order_seq = order_seq + 1 where id = sid returning order_seq into n;
  return n;
end; $$;

-- decrement stock safely on payment
create or replace function public.decrement_stock(pid uuid, q int)
returns void language sql security definer set search_path = public as $$
  update public.products set stock = greatest(0, stock - q) where id = pid;
$$;
