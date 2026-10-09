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
  values (v_owner, 'Indlela Craft Co.', 'indlela', 'Handmade in KwaZulu-Natal')
  on conflict (slug) do update set name = excluded.name
  returning id into v_store;

  delete from public.products where store_id = v_store;
  insert into public.products (store_id, title, description, price_cents, stock, image, position) values
    (v_store, 'Organic Rooibos Tea', '250g loose-leaf, Cederberg grown', 8900, 120, '🍵', 1),
    (v_store, 'Original Beef Biltong', '500g, air-dried the old way', 18500, 60, '🥩', 2),
    (v_store, 'Shweshwe Tote Bag', 'Handmade, three-cat print', 24900, 24, '👜', 3),
    (v_store, 'Beaded Earrings', 'Hand-strung Zulu beadwork', 16000, 40, '💠', 4),
    (v_store, 'Braai Spice Rub', '200g all-purpose smoky rub', 7500, 200, '🌶️', 5),
    (v_store, 'Handwoven Basket', 'Natural ilala palm, large', 42000, 8, '🧺', 6);

  insert into public.layouts (store_id, blocks, published_at)
  values (v_store,
    '[{"type":"hero","props":{"heading":"Beautifully handmade, delivered.","sub":"Shop our latest collection, crafted in South Africa.","btn":"Shop now"}},
      {"type":"products","props":{"title":"Featured products","cols":"3"}},
      {"type":"newsletter","props":{"heading":"Join the list","btn":"Subscribe"}}]'::jsonb,
    now())
  on conflict (store_id) do update set blocks = excluded.blocks, published_at = now();
end $$;
