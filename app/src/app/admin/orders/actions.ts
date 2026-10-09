"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Order actions.
 *
 * Through the RLS client, so orders_owner_update is what enforces isolation —
 * a forged order id simply matches no rows. Note what is deliberately NOT here:
 * nothing can change money. Totals and payment status are written only by the
 * PayFast webhook with the service role, after the payment is verified. A
 * merchant can say an order shipped; they cannot say it was paid.
 */

type Result = { ok: true } | { ok: false; error: string };

export async function setFulfilment(orderId: string, fulfilled: boolean): Promise<Result> {
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const { error, count } = await db
    .from("orders")
    .update({ fulfilment: fulfilled ? "fulfilled" : "unfulfilled" }, { count: "exact" })
    .eq("id", orderId);

  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "That order is not in your store." };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}
