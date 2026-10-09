import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace).
 *
 * Shopping campaigns and Performance Max cannot run without a feed, so this is
 * the single highest-leverage marketing endpoint on the platform. Merchant
 * Center pulls it on a schedule; the merchant just pastes the URL.
 *
 * Only ACTIVE products appear, and `id` is the product uuid rather than the
 * slug — Merchant Center keys on id, and a merchant renaming a product would
 * otherwise orphan its entire performance history.
 *
 * Reads with the anon client, so RLS (products_public_read) is what guarantees
 * a feed can only ever contain one tenant's active catalogue.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const db = createClient();

  const { data: store } = await db
    .from("stores").select("id,name,slug,tagline,currency").eq("slug", params.slug).maybeSingle();
  if (!store) return new Response("Not found", { status: 404 });

  const { data: mk } = await db
    .from("store_marketing").select("feed_enabled").eq("store_id", store.id).maybeSingle();
  if (mk && mk.feed_enabled === false) return new Response("Feed disabled", { status: 404 });

  const { data: rows } = await db
    .from("products").select("*").eq("store_id", store.id).eq("active", true).order("position");

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const base = `${site}/s/${store.slug}`;
  const currency = store.currency || "ZAR";

  const items = (rows ?? []).map((p) => {
    const r = p as Record<string, unknown>;
    const handle = (r.slug as string) || p.id;
    const price = `${(p.price_cents / 100).toFixed(2)} ${currency}`;
    const compare = r.compare_at_cents as number | null;
    const desc = strip(String(r.seo_description || p.description || p.title));

    return [
      "    <item>",
      `      <g:id>${esc(p.id)}</g:id>`,
      `      <title>${esc(String(p.title).slice(0, 150))}</title>`,
      `      <description>${esc(desc.slice(0, 5000) || String(p.title))}</description>`,
      `      <link>${esc(`${base}/p/${handle}`)}</link>`,
      p.image ? `      <g:image_link>${esc(String(p.image))}</g:image_link>` : "",
      `      <g:availability>${p.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>`,
      `      <g:price>${compare && compare > p.price_cents ? `${(compare / 100).toFixed(2)} ${currency}` : price}</g:price>`,
      compare && compare > p.price_cents ? `      <g:sale_price>${price}</g:sale_price>` : "",
      `      <g:condition>${esc(String(r.condition || "new"))}</g:condition>`,
      `      <g:brand>${esc(String(r.brand || store.name))}</g:brand>`,
      r.gtin ? `      <g:gtin>${esc(String(r.gtin))}</g:gtin>` : `      <g:identifier_exists>no</g:identifier_exists>`,
      r.sku ? `      <g:mpn>${esc(String(r.sku))}</g:mpn>` : "",
      r.google_category ? `      <g:google_product_category>${esc(String(r.google_category))}</g:google_product_category>` : "",
      `      <g:shipping><g:country>ZA</g:country></g:shipping>`,
      "    </item>",
    ].filter(Boolean).join("\n");
  });

  const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(store.name)}</title>
    <link>${esc(base)}</link>
    <description>${esc(store.tagline || `${store.name} product feed`)}</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Merchant Center pulls on a schedule; an hour of CDN cache is plenty and
      // keeps a large catalogue from re-querying on every crawler hit.
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
