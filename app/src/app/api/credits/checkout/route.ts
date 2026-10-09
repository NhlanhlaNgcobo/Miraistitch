import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { buildCheckoutFields, PAYFAST_PROCESS_URL } from "@/lib/payfast";

export const runtime = "nodejs";

/**
 * Buy a credit pack.
 *
 * Packs are defined server-side and the price is taken from here, never from the
 * request — the same rule the product checkout follows. A client that posts
 * {pack:"large", amount: 1} gets the server's price for "large" or a 400.
 *
 * Credits are NOT granted here. They are granted by the PayFast ITN webhook once
 * the payment is verified, which is the only place that can be trusted.
 */

export const PACKS = {
  starter: { credits: 25, cents: 9900, label: "25 product shots" },
  studio: { credits: 100, cents: 34900, label: "100 product shots" },
  scale: { credits: 500, cents: 149900, label: "500 product shots" },
} as const;

export type PackId = keyof typeof PACKS;

export async function POST(req: Request) {
  let body: { store_id?: string; pack?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const packId = String(body.pack ?? "") as PackId;
  const pack = PACKS[packId];
  if (!pack) return NextResponse.json({ error: "unknown credit pack" }, { status: 400 });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const { data: store } = await supabase
    .from("stores")
    .select("id,name,owner_id")
    .eq("id", String(body.store_id ?? ""))
    .maybeSingle();
  if (!store || store.owner_id !== user.id) {
    return NextResponse.json({ error: "that store is not yours" }, { status: 403 });
  }

  const ref = `cr_${crypto.randomUUID()}`;
  const { error } = await admin().from("credit_purchases").insert({
    store_id: store.id,
    pack: packId,
    credits: pack.credits,
    amount_cents: pack.cents,
    status: "pending",
    payment_ref: ref,
  });
  if (error) return NextResponse.json({ error: "could not start the purchase" }, { status: 500 });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const fields = buildCheckoutFields({
    orderId: ref,
    amountCents: pack.cents,
    itemName: `MiraiStitch — ${pack.label}`,
    firstName: (user.email ?? "store").split("@")[0],
    email: user.email ?? "",
    returnUrl: `${site}/admin/credits?bought=${packId}`,
    cancelUrl: `${site}/admin/credits?cancelled=1`,
    notifyUrl: `${site}/api/payfast/notify`,
  });

  return NextResponse.json({ action: PAYFAST_PROCESS_URL, fields });
}

export async function GET() {
  return NextResponse.json({
    packs: Object.entries(PACKS).map(([id, p]) => ({ id, ...p })),
  });
}
