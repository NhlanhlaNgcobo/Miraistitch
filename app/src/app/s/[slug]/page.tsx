import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/config";
import SetupNotice from "@/components/SetupNotice";
import type { Block, Product, Store } from "@/types";
import Storefront from "./storefront";

export const dynamic = "force-dynamic";

// Shown when a store hasn't published a layout from the builder yet.
const DEFAULT_BLOCKS: Block[] = [
  { type: "hero", props: { heading: "Welcome", sub: "Shop our latest collection.", btn: "Shop now", align: "center" } },
  { type: "products", props: { title: "Products", cols: "3" } },
];

export default async function StorePage({ params }: { params: { slug: string } }) {
  if (!supabaseConfigured) return <SetupNotice where="The storefront" />;
  const db = createClient();

  const { data: store } = await db.from("stores").select("*").eq("slug", params.slug).single();
  if (!store) notFound();

  const [{ data: products }, { data: layout }] = await Promise.all([
    db.from("products").select("*").eq("store_id", (store as Store).id).eq("active", true).order("position"),
    db.from("layouts").select("blocks,published_at").eq("store_id", (store as Store).id).maybeSingle(),
  ]);

  const published = layout?.published_at && Array.isArray(layout.blocks) && layout.blocks.length > 0;
  const blocks = (published ? (layout!.blocks as Block[]) : DEFAULT_BLOCKS);

  return <Storefront store={store as Store} products={(products ?? []) as Product[]} blocks={blocks} />;
}
