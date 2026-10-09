import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProductDetail from "./detail";
import type { Product, Store } from "@/types";

export const dynamic = "force-dynamic";

type Params = { slug: string; handle: string };

/**
 * Product detail page.
 *
 * This is what the SEO fields were written for. Until now a store had
 * seo_title, seo_description, slug and tags on every product and no page that
 * rendered any of them — the AI SEO tool was writing into a void.
 *
 * Products resolve by their per-tenant slug, falling back to the uuid so a
 * product without a slug is still reachable. Both lookups are scoped to the
 * store, because slugs are unique per tenant: two stores may legitimately both
 * have /p/blue-mug.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(slug: string, handle: string) {
  const db = createClient();
  const { data: store } = await db.from("stores").select("*").eq("slug", slug).maybeSingle();
  if (!store) return null;

  const base = db.from("products").select("*").eq("store_id", (store as Store).id);
  const { data: product } = UUID.test(handle)
    ? await base.eq("id", handle).maybeSingle()
    : await base.eq("slug", handle).maybeSingle();

  if (!product) return { store: store as Store, product: null };
  return { store: store as Store, product: product as Product & Record<string, unknown> };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await load(params.slug, params.handle);
  if (!r?.product) return { title: "Product not found" };
  const { store, product } = r;

  const title = (product.seo_title as string) || `${product.title} — ${store.name}`;
  const description =
    (product.seo_description as string) ||
    (product.description || "").replace(/\s+/g, " ").trim().slice(0, 155);
  const price = (product.price_cents / 100).toFixed(2);

  return {
    title,
    description,
    keywords: (product.tags as string[]) ?? undefined,
    alternates: { canonical: `/s/${store.slug}/p/${(product.slug as string) || product.id}` },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: store.name,
      images: product.image ? [{ url: product.image }] : undefined,
    },
    other: {
      // price metadata search engines and social cards actually read
      "product:price:amount": price,
      "product:price:currency": store.currency || "ZAR",
      "product:availability": product.stock > 0 ? "in stock" : "out of stock",
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const r = await load(params.slug, params.handle);
  if (!r) notFound();
  const { store, product } = r;

  if (!product || product.active === false) {
    return (
      <main style={{ maxWidth: 680, margin: "80px auto", padding: "0 22px", textAlign: "center",
                     font: '15px/1.6 "Hanken Grotesk", system-ui, sans-serif' }}>
        <h1 style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: 32 }}>Product not available</h1>
        <p style={{ color: "#57534e" }}>It may have been removed or is no longer on sale.</p>
        <Link href={`/s/${store.slug}`} style={{ color: "#7a4e0a", fontWeight: 600 }}>← Back to {store.name}</Link>
      </main>
    );
  }

  const db = createClient();
  const { data: related } = await db
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("active", true)
    .neq("id", product.id)
    .limit(4);

  // Structured data. Search engines read this directly, and it is built from the
  // real row rather than from the AI copy, so it can never claim a price or a
  // stock state the store is not actually offering.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: (product.seo_description as string) || product.description || undefined,
    image: product.image || undefined,
    sku: (product.sku as string) || product.id,
    brand: { "@type": "Brand", name: store.name },
    offers: {
      "@type": "Offer",
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: store.currency || "ZAR",
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `/s/${store.slug}/p/${(product.slug as string) || product.id}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail
        store={store}
        product={product}
        related={(related ?? []) as Product[]}
      />
    </>
  );
}
