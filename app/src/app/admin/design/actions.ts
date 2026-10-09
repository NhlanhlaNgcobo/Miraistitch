"use server";

import { createClient } from "@/lib/supabase/server";
import type { Block } from "@/types";

const ALLOWED = new Set([
  "hero", "products", "banner", "collection", "testimonial", "newsletter", "richtext", "spacer",
]);

function sanitize(blocks: unknown): Block[] {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b): b is Block => !!b && typeof b === "object" && ALLOWED.has((b as Block).type))
    .map((b) => ({ type: b.type, props: b.props && typeof b.props === "object" ? b.props : {} }));
}

// Publish the layout. RLS (layouts_owner_all → owns_store) guarantees the signed-in
// user can only write their own store's layout.
export async function publishLayout(
  storeId: string,
  blocks: Block[]
): Promise<{ ok: boolean; error?: string }> {
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const clean = sanitize(blocks);
  const { error } = await db
    .from("layouts")
    .upsert({ store_id: storeId, blocks: clean, published_at: new Date().toISOString() });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
