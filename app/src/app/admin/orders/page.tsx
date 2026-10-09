import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FulfilButton from "./fulfil";
import type { Store, Order } from "@/types";

export const dynamic = "force-dynamic";

const rand = (c: number) => "R" + (c / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 });
const day = (s: string) => new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
const time = (s: string) => new Date(s).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });

type Item = { id: string; title: string; qty: number; price_cents: number; product_id: string | null };

/** Orders: list, and the detail view behind ?id=<uuid>. */
export default async function Orders({
  searchParams: sp,
}: {
  searchParams: { id?: string; filter?: string };
}) {
  const db = createClient();

  const { data: stores } = await db.from("stores").select("*").order("created_at");
  const store = (stores?.[0] as Store) ?? null;
  if (!store) {
    return (
      <main className="wrap">
        <h1>Orders</h1>
        <div className="empty"><p>Create your store first.</p><Link className="btn-primary" href="/admin">Go to Home</Link></div>
      </main>
    );
  }

  // ── detail ──
  if (sp.id) {
    const { data: order } = await db.from("orders").select("*").eq("id", sp.id).maybeSingle();
    if (!order) {
      return (
        <main className="wrap">
          <nav className="crumbs"><Link href="/admin/orders">Orders</Link> · Not found</nav>
          <div className="empty"><p>That order does not exist, or is not in your store.</p></div>
        </main>
      );
    }
    const o = order as Order;
    const { data: itemRows } = await db.from("order_items").select("*").eq("order_id", o.id);
    const items = (itemRows ?? []) as Item[];
    const c = o.customer ?? {};

    return (
      <main className="wrap">
        <nav className="crumbs"><Link href="/admin/orders">Orders</Link> · {o.number}</nav>
        <div className="pagehead">
          <div>
            <h1>{o.number}</h1>
            <p className="sub">
              {time(o.created_at)} ·{" "}
              <span className={"pill " + (o.status === "paid" ? "ok" : o.status === "cancelled" ? "bad" : "warn")}>{o.status}</span>{" "}
              <span className={"pill " + (o.fulfilment === "fulfilled" ? "ok" : "")}>{o.fulfilment}</span>
            </p>
          </div>
          {o.status === "paid" && <FulfilButton orderId={o.id} fulfilled={o.fulfilment === "fulfilled"} />}
        </div>

        <div className="od">
          <section className="card card-pad">
            <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>Items</h3>
            {items.length === 0 && <p className="muted">No line items recorded.</p>}
            {items.map((i) => (
              <div className="od-line" key={i.id}>
                <div className="im" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{i.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{rand(i.price_cents)} × {i.qty}</div>
                </div>
                <div className="num" style={{ fontWeight: 700 }}>{rand(i.price_cents * i.qty)}</div>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <div className="dl"><span>Subtotal</span><span className="num">{rand(o.subtotal_cents)}</span></div>
              <div className="dl"><span>Delivery{o.ship_method ? ` · ${o.ship_method}` : ""}</span><span className="num">{o.shipping_cents ? rand(o.shipping_cents) : "Free"}</span></div>
              <div className="dl muted"><span>of which VAT ({store.vat_rate}%)</span>
                <span className="num">{rand(Math.round(o.total_cents * (store.vat_rate / 100) / (1 + store.vat_rate / 100)))}</span></div>
              <div className="dt"><span>Total</span><span className="num">{rand(o.total_cents)}</span></div>
            </div>
          </section>

          <aside className="card card-pad">
            <div className="kv">
              <b>Customer</b>
              {c.name || "—"}<br />
              {o.email && <a href={`mailto:${o.email}`}>{o.email}</a>}
              {c.phone && <><br />{c.phone}</>}

              <b>Delivery address</b>
              {c.address || "—"}

              <b>Payment</b>
              {o.provider ?? "payfast"}
              {o.pf_payment_id && <><br /><span className="muted" style={{ fontSize: 12 }}>PayFast {o.pf_payment_id}</span></>}
              {o.payment_ref && <><br /><span className="muted" style={{ fontSize: 12 }}>ref {o.payment_ref}</span></>}
            </div>
          </aside>
        </div>
      </main>
    );
  }

  // ── list ──
  const filter = sp.filter ?? "all";
  let q = db.from("orders").select("*").eq("store_id", store.id).order("created_at", { ascending: false }).limit(100);
  if (filter === "unfulfilled") q = q.eq("status", "paid").eq("fulfilment", "unfulfilled");
  else if (filter === "paid") q = q.eq("status", "paid");
  else if (filter === "pending") q = q.eq("status", "pending");

  const { data: rows } = await q;
  const orders = (rows ?? []) as Order[];

  const paid = orders.filter((o) => o.status === "paid");
  const revenue = paid.reduce((a, o) => a + o.total_cents, 0);
  const awaiting = paid.filter((o) => o.fulfilment === "unfulfilled").length;

  const Tab = ({ id, label }: { id: string; label: string }) => (
    <Link href={`/admin/orders${id === "all" ? "" : `?filter=${id}`}`}
          className={"pill" + (filter === id ? " ok" : "")} style={{ padding: "5px 12px" }}>
      {label}
    </Link>
  );

  return (
    <main className="wrap">
      <div className="pagehead">
        <div>
          <h1>Orders</h1>
          <p className="sub">{orders.length} shown · {rand(revenue)} paid · {awaiting} awaiting fulfilment</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Tab id="all" label="All" />
        <Tab id="unfulfilled" label="Unfulfilled" />
        <Tab id="paid" label="Paid" />
        <Tab id="pending" label="Pending" />
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          <p>{filter === "all" ? "No orders yet. They appear here the moment PayFast confirms a payment." : "Nothing matches that filter."}</p>
          {filter !== "all" && <Link className="btn" href="/admin/orders">Show all</Link>}
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr><th>Order</th><th>Date</th><th>Customer</th><th>Payment</th><th>Fulfilment</th><th className="right">Total</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders?id=${o.id}`}><strong>{o.number}</strong></Link></td>
                <td className="muted">{day(o.created_at)}</td>
                <td>{o.customer?.name || o.email || "—"}</td>
                <td><span className={"pill " + (o.status === "paid" ? "ok" : o.status === "cancelled" ? "bad" : "warn")}>{o.status}</span></td>
                <td><span className={"pill " + (o.fulfilment === "fulfilled" ? "ok" : "")}>{o.fulfilment}</span></td>
                <td className="num">{rand(o.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
