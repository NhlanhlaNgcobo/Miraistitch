import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { rand } from "@/lib/format";
import type { Store, Product, Order } from "@/types";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const db = createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  // RLS limits these to the signed-in owner's rows.
  const { data: stores } = await db.from("stores").select("*").order("created_at");
  const store = (stores?.[0] as Store) ?? null;

  let products: Product[] = [];
  let orders: Order[] = [];
  if (store) {
    const [{ data: p }, { data: o }] = await Promise.all([
      db.from("products").select("*").eq("store_id", store.id).order("position"),
      db.from("orders").select("*").eq("store_id", store.id).order("created_at", { ascending: false }).limit(25),
    ]);
    products = (p ?? []) as Product[];
    orders = (o ?? []) as Order[];
  }

  // ── server actions ──
  async function createStore(formData: FormData) {
    "use server";
    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!name || !slug) return;
    await db.from("stores").insert({ owner_id: user.id, name, slug });
    revalidatePath("/admin");
  }

  async function addProduct(formData: FormData) {
    "use server";
    const db = createClient();
    const sid = String(formData.get("store_id"));
    const title = String(formData.get("title") || "").trim();
    const price = Math.round(parseFloat(String(formData.get("price") || "0")) * 100);
    const stock = parseInt(String(formData.get("stock") || "0"), 10);
    const image = String(formData.get("image") || "🛍️");
    if (!title || price < 0) return;
    await db.from("products").insert({ store_id: sid, title, price_cents: price, stock, image });
    revalidatePath("/admin");
  }

  async function fulfil(formData: FormData) {
    "use server";
    const db = createClient();
    await db.from("orders").update({ fulfilment: "fulfilled" }).eq("id", String(formData.get("id")));
    revalidatePath("/admin");
  }

  async function signOut() {
    "use server";
    const db = createClient();
    await db.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="wrap" style={{ paddingBlock: 40, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Admin</h1>
        <form action={signOut}><button className="btn ghost" type="submit">Sign out</button></form>
      </div>

      {!store ? (
        <section className="card" style={{ padding: 24, marginTop: 24 }}>
          <h2 style={{ fontFamily: "var(--f-serif)", fontSize: "1.3rem" }}>Create your store</h2>
          <form action={createStore} style={{ marginTop: 16 }}>
            <label>Store name</label><input name="name" required />
            <div style={{ marginTop: 12 }}><label>URL slug</label><input name="slug" placeholder="my-store" required /></div>
            <button className="btn gold" type="submit" style={{ marginTop: 14 }}>Create store</button>
          </form>
        </section>
      ) : (
        <>
          <p style={{ color: "var(--stone)", marginTop: 6, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span>{store.name} · <Link href={`/s/${store.slug}`} style={{ color: "var(--gold-deep)" }}>/s/{store.slug}</Link></span>
            <Link className="btn ghost" href="/admin/design" style={{ padding: "6px 14px" }}>✎ Design store</Link>
          </p>

          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontFamily: "var(--f-serif)", fontSize: "1.3rem" }}>Orders</h2>
            <div className="card" style={{ marginTop: 12 }}>
              {orders.length === 0 && <div style={{ padding: 18, color: "var(--muted)" }}>No orders yet.</div>}
              {orders.map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                  <strong>{o.number}</strong>
                  <span style={{ flex: 1, color: "var(--stone)" }}>{o.customer?.name} · {o.email}</span>
                  <span className="money">{rand(o.total_cents)}</span>
                  <span style={{ fontSize: ".78rem", fontWeight: 700, color: o.status === "paid" ? "#0b4b36" : "var(--muted)" }}>{o.status}</span>
                  {o.status === "paid" && o.fulfilment !== "fulfilled" && (
                    <form action={fulfil}><input type="hidden" name="id" value={o.id} /><button className="btn ghost" type="submit" style={{ padding: "6px 12px" }}>Fulfil</button></form>
                  )}
                  {o.fulfilment === "fulfilled" && <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>✓ fulfilled</span>}
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontFamily: "var(--f-serif)", fontSize: "1.3rem" }}>Products</h2>
            <div className="card" style={{ marginTop: 12 }}>
              {products.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 22 }}>{p.image}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{p.title}</span>
                  <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>{p.stock} in stock</span>
                  <span className="money" style={{ fontWeight: 700 }}>{rand(p.price_cents)}</span>
                </div>
              ))}
              <form action={addProduct} style={{ padding: 16, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 60px auto", gap: 10, alignItems: "end" }}>
                <input type="hidden" name="store_id" value={store.id} />
                <div><label>New product</label><input name="title" placeholder="Title" required /></div>
                <div><label>Price (R)</label><input name="price" type="number" step="0.01" placeholder="0.00" required /></div>
                <div><label>Stock</label><input name="stock" type="number" placeholder="0" /></div>
                <div><label>Icon</label><input name="image" placeholder="🛍️" /></div>
                <button className="btn gold" type="submit">Add</button>
              </form>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
