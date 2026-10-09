import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyItnSignature, validateItnWithPayfast } from "@/lib/payfast";

export const runtime = "nodejs";

// PayFast Instant Transaction Notification (ITN). PayFast POSTs here server-to-server.
// We verify, then mark the order paid and decrement stock. Always 200 so PayFast stops retrying.
export async function POST(req: Request) {
  const raw = await req.text();

  // 1. signature check
  if (!verifyItnSignature(raw)) {
    console.warn("[payfast] bad signature");
    return new NextResponse("OK"); // acknowledge but ignore
  }

  // 2. server-to-server validation (defence in depth)
  const valid = await validateItnWithPayfast(raw);
  if (!valid) {
    console.warn("[payfast] validation != VALID");
    return new NextResponse("OK");
  }

  const data = Object.fromEntries(new URLSearchParams(raw));
  const orderId = data["m_payment_id"];
  const status = data["payment_status"];
  const grossCents = Math.round(parseFloat(data["amount_gross"] || "0") * 100);
  if (!orderId) return new NextResponse("OK");

  const db = createAdminClient();

  // Credit-pack purchases use a "cr_" reference and are settled here, not in orders.
  // grant_credits is idempotent on (reason, ref), so a replayed ITN cannot double-credit.
  if (orderId.startsWith("cr_")) {
    const { data: purchase } = await db
      .from("credit_purchases")
      .select("id,store_id,credits,amount_cents,status")
      .eq("payment_ref", orderId)
      .maybeSingle();
    if (!purchase) return new NextResponse("OK");

    if (Math.abs(purchase.amount_cents - grossCents) > 1) {
      console.warn("[payfast] credit amount mismatch", purchase.amount_cents, grossCents);
      return new NextResponse("OK");
    }
    if (status === "COMPLETE" && purchase.status !== "paid") {
      await db
        .from("credit_purchases")
        .update({ status: "paid", pf_payment_id: data["pf_payment_id"] ?? null })
        .eq("id", purchase.id);
      await db.rpc("grant_credits", {
        sid: purchase.store_id,
        n: purchase.credits,
        why: "purchase",
        r: orderId,
      });
    } else if (status === "CANCELLED") {
      await db.from("credit_purchases").update({ status: "failed" }).eq("id", purchase.id);
    }
    return new NextResponse("OK");
  }

  const { data: order } = await db
    .from("orders")
    .select("id,number,email,total_cents,status,store_id")
    .eq("id", orderId)
    .single();
  if (!order) return new NextResponse("OK");

  // 3. amount must match what we recorded (within 1 cent)
  if (Math.abs(order.total_cents - grossCents) > 1) {
    console.warn("[payfast] amount mismatch", order.total_cents, grossCents);
    return new NextResponse("OK");
  }

  // 4. only act on COMPLETE, and only once (idempotent)
  if (status === "COMPLETE" && order.status !== "paid") {
    await db
      .from("orders")
      .update({ status: "paid", pf_payment_id: data["pf_payment_id"] ?? null })
      .eq("id", order.id);

    const { data: items } = await db.from("order_items").select("product_id,qty").eq("order_id", order.id);
    for (const it of items ?? []) {
      if (it.product_id) await db.rpc("decrement_stock", { pid: it.product_id, q: it.qty });
    }
    await sendReceipt(order.email, order.number, order.total_cents);
  } else if (status === "CANCELLED") {
    await db.from("orders").update({ status: "cancelled" }).eq("id", order.id);
  }

  return new NextResponse("OK");
}

// Fire-and-forget order receipt via Resend. Skipped if RESEND_API_KEY is unset.
async function sendReceipt(email: string | null, number: string, totalCents: number) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !email) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "MiraiStitch <onboarding@resend.dev>",
        to: email,
        subject: `Your order ${number} is confirmed`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
          <h2>Thank you — order ${number} is confirmed</h2>
          <p>We've received your payment of <strong>R${(totalCents / 100).toFixed(2)}</strong>. The store is preparing your order and will be in touch about delivery.</p>
          <p style="color:#888;font-size:12px">Powered by MiraiStitch</p></div>`,
      }),
    });
  } catch {
    // never fail the webhook because of email
  }
}
