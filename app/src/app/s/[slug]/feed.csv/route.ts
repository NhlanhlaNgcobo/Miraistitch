import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Meta (Facebook / Instagram) catalogue feed, CSV.
 *
 * Needed for dynamic product ads, Advantage+ catalogue campaigns and shopping
 * tags on Instagram. Meta's scheduled feed fetch reads this URL directly.
 *
 * Column names are Meta's required ones — id, title, description, availability,
 * condition, price, link, image_link, brand — spelled exactly, because the
 * importer matches on header text and silently drops columns it does not know.
 *
 * `id` is the product uuid, matching feed.xml, so the same product has one
 * identity across both ad platforms.
 */

/** RFC 4180: wrap in quotes, double any internal quote. */
const cell = (v: unknown) => {
  const s = String(v ?? "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
  return `"${s.replace(/"/g, '""')}"`;
};

const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const HEADERS = [
  "id", "title", "description", "availability", "condition", "price",
  "link", "image_link", "brand", "sale_price", "mpn", "google_product_category",
];

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const db = createClient();

  const { data: store } = await db
    .from("stores").select("id,name,slug,currency").eq("slug", params.slug).maybeSingle();
  if (!store) return new Response("Not found", { status: 404 });

  const { data: mk } = await db
    .from("store_marketing").select("feed_enabled").eq("store_id", store.id).maybeSingle();
  if (mk && mk.feed_enabled === false) return new Response("Feed disabled", { status: 404 });

  const { data: rows } = await db
    .from("products").select("*").eq("store_id", store.id).eq("active", true).order("position");

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const base = `${site}/s/${store.slug}`;
  const cur = store.currency || "ZAR";

  const lines = [HEADERS.join(",")];

  for (const p of rows ?? []) {
    const r = p as Record<string, unknown>;
    const handle = (r.slug as string) || p.id;
    const compare = r.compare_at_cents as number | null;
    const onSale = compare && compare > p.price_cents;

    lines.push([
      cell(p.id),
      cell(String(p.title).slice(0, 150)),
      cell(strip(String(r.seo_description || p.description || p.title)).slice(0, 5000) || String(p.title)),
      cell(p.stock > 0 ? "in stock" : "out of stock"),
      cell(r.condition || "new"),
      // Meta wants the list price here and the discounted one in sale_price
      cell(`${((onSale ? compare! : p.price_cents) / 100).toFixed(2)} ${cur}`),
      cell(`${base}/p/${handle}`),
      cell(p.image || ""),
      cell(r.brand || store.name),
      cell(onSale ? `${(p.price_cents / 100).toFixed(2)} ${cur}` : ""),
      cell(r.sku || ""),
      cell(r.google_category || ""),
    ].join(","));
  }

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `inline; filename="${store.slug}-meta-catalogue.csv"`,
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
