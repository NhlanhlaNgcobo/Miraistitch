import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCheckoutFields, PAYFAST_PROCESS_URL } from "@/lib/payfast";

export const runtime = "nodejs";

type Body = {
  slug: string;
  items: { productId: string; qty: number }[];
  customer: { firstName: string; lastName: string; email: string; phone?: string; address?: string };
  shipMethod: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { slug, items, customer, shipMethod } = body;
  if (!slug || !Array.isArray(items) || items.length === 0 || !customer?.email || !customer?.firstName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createAdminClient();

  // 1. resolve store
  const { data: store } = await db.from("stores").select("*").eq("slug", slug).single();
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // 2. fetch the real products — NEVER trust prices from the client
  const ids = items.map((i) => i.productId);
  const { data: products } = await db
    .from("products")
    .select("id,title,price_cents,stock,active")
    .eq("store_id", store.id)
    .in("id", ids);
  if (!products || products.length === 0) return NextResponse.json({ error: "No valid items" }, { status: 400 });

  // 3. compute totals from DB prices; check stock
  let subtotal = 0;
  const lineItems: { product_id: string; title: string; qty: number; price_cents: number }[] = [];
  for (const it of items) {
    const p = products.find((x) => x.id === it.productId);
    const qty = Math.max(1, Math.floor(it.qty || 1));
    if (!p || !p.active) continue;
    if (p.stock < qty) return NextResponse.json({ error: `Not enough stock for ${p.title}` }, { status: 409 });
    subtotal += p.price_cents * qty;
    lineItems.push({ product_id: p.id, title: p.title, qty, price_cents: p.price_cents });
  }
  if (lineItems.length === 0) return NextResponse.json({ error: "No valid items" }, { status: 400 });

  const shipping = (store.shipping as { name: string; cents: number }[]).find((s) => s.name === shipMethod);
  const shippingCents = shipping ? shipping.cents : 0;
  const totalCents = subtotal + shippingCents;

  // 4. create a pending order (+ items)
  const { data: seq } = await db.rpc("next_order_number", { sid: store.id });
  const number = "#" + (seq ?? Date.now());
  const { data: order, error: orderErr } = await db
    .from("orders")
    .insert({
      store_id: store.id,
      number,
      customer: {
        name: `${customer.firstName} ${customer.lastName ?? ""}`.trim(),
        email: customer.email,
        phone: customer.phone ?? "",
        address: customer.address ?? "",
      },
      email: customer.email,
      status: "pending",
      subtotal_cents: subtotal,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      ship_method: shipMethod,
      provider: "payfast",
    })
    .select("id")
    .single();
  if (orderErr || !order) return NextResponse.json({ error: "Could not create order" }, { status: 500 });

  await db.from("orders").update({ payment_ref: order.id }).eq("id", order.id);
  await db.from("order_items").insert(
    lineItems.map((li) => ({ order_id: order.id, store_id: store.id, ...li }))
  );

  // 5. build the PayFast redirect
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const fields = buildCheckoutFields({
    orderId: order.id,
    amountCents: totalCents,
    itemName: `${store.name} order ${number}`,
    firstName: customer.firstName,
    email: customer.email,
    returnUrl: `${site}/s/${slug}/thank-you?order=${order.id}`,
    cancelUrl: `${site}/s/${slug}?cancelled=1`,
    notifyUrl: `${site}/api/payfast/notify`,
  });

  return NextResponse.json({ action: PAYFAST_PROCESS_URL, fields, orderId: order.id });
}
