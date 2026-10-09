import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Block, Product, Store } from "@/types";
import Builder from "./builder";
import { publishLayout } from "./actions";

export const dynamic = "force-dynamic";

export default async function Design() {
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: stores } = await db.from("stores").select("*").order("created_at");
  const store = stores?.[0] as Store | undefined;
  if (!store) redirect("/admin");

  const [{ data: layout }, { data: products }] = await Promise.all([
    db.from("layouts").select("blocks").eq("store_id", store.id).maybeSingle(),
    db.from("products").select("id,title,image,price_cents").eq("store_id", store.id).eq("active", true).order("position"),
  ]);

  const blocks = Array.isArray(layout?.blocks) && layout!.blocks.length ? (layout!.blocks as Block[]) : [];

  return (
    <Builder
      store={store}
      initialBlocks={blocks}
      productCount={(products ?? []).length}
      publish={publishLayout}
      aiEnabled={Boolean(process.env.ANTHROPIC_API_KEY)}
    />
  );
}
