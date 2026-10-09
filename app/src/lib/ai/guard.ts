import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";

/**
 * Every AI route goes through this.
 *
 * The original /api/ai/generate route had no auth at all, which in a multi-tenant
 * app means any visitor can spend the platform's model budget, and — once credits
 * exist — operate against a store that isn't theirs. The guard proves three things
 * before a single token is bought:
 *
 *   1. there is a signed-in user
 *   2. the store they named actually belongs to them  (tenant isolation)
 *   3. they are inside their per-store rate limit      (abuse + cost control)
 *
 * Ownership is re-checked server-side from the session rather than trusted from the
 * request body. A client that posts someone else's store_id gets a 403.
 */

export type Guarded = {
  userId: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
};

export type GuardFail = { response: NextResponse };

export function isFail(x: Guarded | GuardFail): x is GuardFail {
  return (x as GuardFail).response !== undefined;
}

const fail = (msg: string, status: number): GuardFail => ({
  response: NextResponse.json({ error: msg }, { status }),
});

/** Per-store sliding window, counted from the ai_jobs audit trail. */
const WINDOW_MINUTES = 10;
const MAX_JOBS_PER_WINDOW = 40;

export async function guard(storeId: unknown): Promise<Guarded | GuardFail> {
  if (typeof storeId !== "string" || !storeId) return fail("store_id is required", 400);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("sign in to use AI features", 401);

  // RLS would already scope this, but checking owner_id explicitly means the
  // failure is a clear 403 rather than an empty result we might misread.
  const { data: store, error } = await supabase
    .from("stores")
    .select("id,name,slug,owner_id")
    .eq("id", storeId)
    .maybeSingle();

  if (error) return fail("could not verify the store", 500);
  if (!store || store.owner_id !== user.id) return fail("that store is not yours", 403);

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await admin()
    .from("ai_jobs")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_JOBS_PER_WINDOW) {
    return fail(`too many AI requests — try again in a few minutes`, 429);
  }

  return { userId: user.id, storeId: store.id, storeName: store.name, storeSlug: store.slug };
}

/** Opens a job row so every AI call is auditable and attributable to a tenant. */
export async function startJob(
  g: Guarded,
  kind: "describe" | "seo" | "layout" | "image_enhance",
  input: Record<string, unknown>,
  costCredits = 0,
) {
  const { data } = await admin()
    .from("ai_jobs")
    .insert({
      store_id: g.storeId,
      user_id: g.userId,
      kind,
      status: "running",
      cost_credits: costCredits,
      input,
    })
    .select("id")
    .single();
  return data?.id as string | undefined;
}

export async function finishJob(id: string | undefined, output: unknown) {
  if (!id) return;
  await admin()
    .from("ai_jobs")
    .update({ status: "done", output: output as never, finished_at: new Date().toISOString() })
    .eq("id", id);
}

export async function failJob(id: string | undefined, error: string) {
  if (!id) return;
  await admin()
    .from("ai_jobs")
    .update({ status: "error", error, finished_at: new Date().toISOString() })
    .eq("id", id);
}
