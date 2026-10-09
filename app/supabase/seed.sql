-- Seed a demo store. Run AFTER you have a user; replace the owner_id below with a real
-- auth user id (Supabase → Authentication → Users), or sign up first then run this.
-- Usage (psql / Supabase SQL editor): set :owner to a uuid, then run.

do $$
declare
  v_owner uuid := (select id from auth.users order by created_at limit 1); -- first user
  v_store uuid;
begin
  if v_owner is null then
    raise notice 'No auth users yet — sign up a user first, then re-run seed.sql';
    return;
  end if;

  insert into public.stores (owner_id, name, slug, tagline)
  values (v_owner, 'Northgate Trading', 'northgate', 'Tech, home & everything between')
  on conflict (slug) do update set name = excluded.name
  returning id into v_store;

  delete from public.products where store_id = v_store;
  insert into public.products (store_id, title, description, price_cents, stock, image, position) values
    (v_store, '27" 4K Monitor', 'IPS panel, 60Hz, HDMI + USB-C', 429900, 18, '🖥️', 1),
    (v_store, 'Oak Desk Chair', 'Ergonomic, adjustable lumbar', 245000, 12, '🪑', 2),
    (v_store, 'Wireless Earbuds', 'Active noise cancelling, 30h', 89900, 64, '🎧', 3),
    (v_store, 'Running Shoes', 'Road, sizes 6-12', 129900, 40, '👟', 4),
    (v_store, 'Cotton Towel Set', '4-piece, 550gsm', 54900, 200, '🧺', 5),
    (v_store, 'Cordless Drill 18V', '2 batteries, carry case', 189900, 9, '🔧', 6);

  insert into public.layouts (store_id, blocks, published_at)
  values (v_store,
    '[{"type":"hero","props":{"heading":"Everything you need, delivered.","sub":"Tech, furniture, home and more — shipped across South Africa.","btn":"Shop now"}},
      {"type":"products","props":{"title":"Featured products","cols":"3"}},
      {"type":"newsletter","props":{"heading":"Join the list","btn":"Subscribe"}}]'::jsonb,
    now())
  on conflict (store_id) do update set blocks = excluded.blocks, published_at = now();
end $$;

-- Real product photography for the demo storefront.
--
-- TODO: the six photos in app/public/images/products/ are the old craft catalogue
-- (rooibos, biltong, shweshwe tote, beaded earrings, braai rub, handwoven basket).
-- The seed above was broadened to a general catalogue (electronics, furniture, home,
-- sport, hardware), so those photos no longer match any product and the mapping that
-- used to live here has been removed rather than left as dead code.
--
-- Until replacement photography exists, the demo storefront falls back to the glyphs
-- set in the insert above. To restore photos, drop new PNGs into
-- app/public/images/products/ and re-add an update that maps title -> path.
