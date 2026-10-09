"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Product writes.
 *
 * Every action goes through the RLS client, never the service role: the
 * products_owner_all policy is what enforces tenant isolation, so a forged
 * store_id or product_id simply matches no rows instead of touching another
 * tenant's data. Ownership is also checked explicitly so the UI can say why.
 */

type Result = { ok: true; id?: string } | { ok: false; error: string };

const cents = (v: FormDataEntryValue | null) => {
  const n = parseFloat(String(v ?? "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0;
};

const str = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

async function ownedStore(db: ReturnType<typeof createClient>, storeId: string) {
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from("stores").select("id,owner_id").eq("id", storeId).maybeSingle();
  return data && data.owner_id === user.id ? data.id : null;
}

export async function saveProduct(form: FormData): Promise<Result> {
  const db = createClient();
  const storeId = str(form.get("store_id"), 60);
  if (!(await ownedStore(db, storeId))) return { ok: false, error: "That store is not yours." };

  const title = str(form.get("title"), 140);
  if (!title) return { ok: false, error: "A title is required." };

  const price = cents(form.get("price"));
  const compareAt = cents(form.get("compare_at"));

  const row = {
    store_id: storeId,
    title,
    description: str(form.get("description"), 4000),
    price_cents: price,
    compare_at_cents: compareAt > price ? compareAt : null,
    stock: Math.max(0, parseInt(String(form.get("stock") ?? "0"), 10) || 0),
    image: str(form.get("image"), 600),
    sku: str(form.get("sku"), 60) || null,
    slug: str(form.get("slug"), 70).toLowerCase().replace(/[^a-z0-9-]/g, "-") || null,
    seo_title: str(form.get("seo_title"), 70) || null,
    seo_description: str(form.get("seo_description"), 200) || null,
    tags: str(form.get("tags"), 300)
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12),
    active: form.get("active") === "on",
  };

  const id = str(form.get("id"), 60);
  if (id) {
    const { error } = await db.from("products").update(row).eq("id", id).eq("store_id", storeId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/products");
    return { ok: true, id };
  }

  const { data, error } = await db.from("products").insert(row).select("id").single();
  if (error) {
    // the per-tenant unique index on (store_id, slug) is the usual culprit
    if (error.code === "23505") return { ok: false, error: "That URL slug is already used in your store." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin/products");
  return { ok: true, id: data.id };
}

export async function deleteProduct(storeId: string, id: string): Promise<Result> {
  const db = createClient();
  if (!(await ownedStore(db, storeId))) return { ok: false, error: "That store is not yours." };
  const { error } = await db.from("products").delete().eq("id", id).eq("store_id", storeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function toggleActive(storeId: string, id: string, active: boolean): Promise<Result> {
  const db = createClient();
  if (!(await ownedStore(db, storeId))) return { ok: false, error: "That store is not yours." };
  const { error } = await db.from("products").update({ active }).eq("id", id).eq("store_id", storeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/products");
  return { ok: true };
}
