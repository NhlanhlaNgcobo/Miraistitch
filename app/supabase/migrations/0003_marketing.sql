-- MiraiStitch — marketing: ad platform connections and conversion tracking
--
-- Store owners run Meta and Google ads against their storefront. Three things
-- have to exist for that to work at all:
--
--   1. client-side pixels, so audiences and basic events build up
--   2. SERVER-side conversions, because iOS tracking prevention and ad blockers
--      lose a large share of browser-fired purchase events — the server event is
--      what makes reported ROAS resemble reality
--   3. a product feed, because Shopping campaigns and dynamic product ads cannot
--      run without one
--
-- Tokens live here, so the table is owner-read-only for the secret columns and
-- everything is scoped by store_id like the rest of the schema.

create extension if not exists pgcrypto;

-- ── per-store marketing connections ────────────────────────────
create table if not exists public.store_marketing (
  store_id              uuid primary key references public.stores(id) on delete cascade,

  -- Meta (Facebook / Instagram)
  meta_pixel_id         text,
  meta_dataset_id       text,          -- Conversions API dataset (often = pixel id)
  meta_access_token     text,          -- SECRET: server-side CAPI token
  meta_test_code        text,          -- for Events Manager "Test events"
  meta_catalog_id       text,

  -- Google (Ads / Analytics / Merchant Center)
  ga4_measurement_id    text,          -- G-XXXXXXXXXX
  google_ads_id         text,          -- AW-XXXXXXXXX
  google_ads_label      text,          -- purchase conversion label
  google_merchant_id    text,
  google_site_verification text,

  -- TikTok, kept because it is the third channel SA merchants ask for
  tiktok_pixel_id       text,

  -- behaviour
  track_enabled         boolean not null default true,
  consent_mode          boolean not null default true,  -- respect a consent banner
  feed_enabled          boolean not null default true,

  updated_at            timestamptz not null default now()
);

create or replace function public.touch_marketing()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists store_marketing_touch on public.store_marketing;
create trigger store_marketing_touch before update on public.store_marketing
  for each row execute function public.touch_marketing();

-- ── conversion event log ───────────────────────────────────────
-- Why keep this: when a merchant says "Meta reports 4 sales, I had 7", the only
-- way to answer is a record of what we sent, when, and what came back. Also
-- gives idempotency — a replayed PayFast ITN must not fire a second Purchase.
create table if not exists public.ad_events (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  order_id    uuid references public.orders(id) on delete set null,
  channel     text not null check (channel in ('meta','google','tiktok')),
  event       text not null,                 -- Purchase | Lead | …
  status      text not null default 'queued' check (status in ('queued','sent','error','skipped')),
  value_cents int,
  request     jsonb,
  response    jsonb,
  error       text,
  created_at  timestamptz not null default now()
);
create index if not exists ad_events_store_idx on public.ad_events(store_id, created_at desc);
-- one event per (order, channel, event): replay-safe
create unique index if not exists ad_events_once_idx
  on public.ad_events(order_id, channel, event) where order_id is not null;

-- ── RLS ────────────────────────────────────────────────────────
alter table public.store_marketing enable row level security;
alter table public.ad_events       enable row level security;

-- The owner manages their own connection settings. The access token is readable
-- by the owner (they pasted it) but by nobody else, and the storefront never
-- selects it — public tracking only needs the public pixel ids, which the
-- marketing_public view below exposes.
drop policy if exists store_marketing_owner_all on public.store_marketing;
create policy store_marketing_owner_all on public.store_marketing for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));

drop policy if exists ad_events_owner_read on public.ad_events;
create policy ad_events_owner_read on public.ad_events for select
  using (public.owns_store(store_id));

-- ── what a storefront visitor may see ──────────────────────────
-- Pixel ids are public by nature (they ship in the page). Access tokens are not.
-- Selecting through this view means a storefront query cannot accidentally pull
-- meta_access_token even if someone writes `select *`.
create or replace view public.marketing_public
with (security_invoker = off) as
  select store_id, meta_pixel_id, ga4_measurement_id, google_ads_id,
         google_ads_label, tiktok_pixel_id, track_enabled, consent_mode
  from public.store_marketing;

grant select on public.marketing_public to anon, authenticated;

-- ── feeds need a stable identifier per product ─────────────────
-- Google Merchant Center and Meta both key on an id that must not change
-- between feed pulls, or they treat it as a new product and lose history.
alter table public.products add column if not exists gtin  text;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists condition text default 'new'
  check (condition in ('new','refurbished','used'));
alter table public.products add column if not exists google_category text;
