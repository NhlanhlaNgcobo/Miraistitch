import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Store } from "@/types";

export const dynamic = "force-dynamic";

const rand = (c: number) => "R" + (c / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 });

/**
 * Store settings: profile, delivery rates, and the read-only facts a merchant
 * needs to confirm (domain, VAT, payment providers).
 *
 * Delivery rates live on stores.shipping as JSONB and are the same list the
 * checkout offers, so editing them here changes what buyers see immediately.
 */
export default async function Settings() {
  const db = createClient();
  const { data: stores } = await db.from("stores").select("*").order("created_at");
  const store = (stores?.[0] as Store) ?? null;

  if (!store) {
    return (
      <main className="wrap">
        <h1>Settings</h1>
        <div className="empty"><p>Create your store first.</p><Link className="btn-primary" href="/admin">Go to Home</Link></div>
      </main>
    );
  }

  async function saveProfile(form: FormData) {
    "use server";
    const db = createClient();
    const id = String(form.get("id"));
    const name = String(form.get("name") ?? "").trim().slice(0, 80);
    const tagline = String(form.get("tagline") ?? "").trim().slice(0, 160);
    const slug = String(form.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 60);
    const vat = Math.min(100, Math.max(0, parseFloat(String(form.get("vat") ?? "15")) || 0));
    if (!name || !slug) return;
    // RLS (stores_update) is what restricts this to the owner's row.
    await db.from("stores").update({ name, tagline, slug, vat_rate: vat }).eq("id", id);
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
  }

  async function saveShipping(form: FormData) {
    "use server";
    const db = createClient();
    const id = String(form.get("id"));
    const rates: { name: string; cents: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const n = String(form.get(`n${i}`) ?? "").trim().slice(0, 60);
      if (!n) continue;
      const r = parseFloat(String(form.get(`p${i}`) ?? "0").replace(/[^0-9.]/g, ""));
      rates.push({ name: n, cents: Math.max(0, Math.round((Number.isFinite(r) ? r : 0) * 100)) });
    }
    if (!rates.length) return; // never leave a store with no way to deliver
    await db.from("stores").update({ shipping: rates }).eq("id", id);
    revalidatePath("/admin/settings");
  }

  const rates = Array.isArray(store.shipping) ? store.shipping : [];
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "miraistitch.co.za";

  return (
    <main className="wrap">
      <div className="pagehead"><div><h1>Settings</h1><p className="sub">Store profile, delivery and the details buyers see.</p></div></div>

      <form action={saveProfile} className="card card-pad" style={{ marginBottom: 16 }}>
        <input type="hidden" name="id" value={store.id} />
        <h3 style={{ margin: "0 0 14px", fontSize: 14 }}>Store profile</h3>
        <div className="two">
          <label>Store name<input name="name" defaultValue={store.name} required /></label>
          <label>URL slug <span className="hint">buyers see this</span>
            <input name="slug" defaultValue={store.slug} required /></label>
        </div>
        <label>Tagline<input name="tagline" defaultValue={store.tagline} placeholder="Tech, home & everything between" /></label>
        <div className="two">
          <label>VAT rate (%)<input name="vat" inputMode="decimal" defaultValue={String(store.vat_rate)} /></label>
          <label>Currency <span className="hint">ZAR only for now</span>
            <input value={store.currency} disabled /></label>
        </div>
        <button className="btn-primary" type="submit">Save profile</button>
      </form>

      <form action={saveShipping} className="card card-pad" style={{ marginBottom: 16 }}>
        <input type="hidden" name="id" value={store.id} />
        <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>Delivery rates</h3>
        <p className="sub" style={{ marginBottom: 14 }}>
          These are the options at checkout. Leave a name blank to remove that row; set the price to 0 for free.
        </p>
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="two" key={i}>
            <label>{i === 0 ? "Method" : <span className="hint">Method</span>}
              <input name={`n${i}`} defaultValue={rates[i]?.name ?? ""} placeholder={i < 3 ? "The Courier Guy" : ""} /></label>
            <label>{i === 0 ? "Price (R)" : <span className="hint">Price (R)</span>}
              <input name={`p${i}`} inputMode="decimal" defaultValue={rates[i] ? (rates[i].cents / 100).toFixed(2) : ""} /></label>
          </div>
        ))}
        <button className="btn-primary" type="submit">Save delivery rates</button>
      </form>

      <section className="card card-pad">
        <h3 style={{ margin: "0 0 14px", fontSize: 14 }}>Domain &amp; payments</h3>
        <div className="kv">
          <b>Storefront</b>
          <a href={`/s/${store.slug}`} target="_blank" rel="noreferrer">{site}/s/{store.slug} ↗</a><br />
          <span className="muted">Once DNS points at the platform, <code>{store.slug}.{root}</code> serves this store directly.</span>

          <b>Payments</b>
          PayFast — {process.env.PAYFAST_MODE === "live" ? "live" : "sandbox"} mode.
          {process.env.PAYFAST_MODE !== "live" && <span className="muted"> No real money moves until PAYFAST_MODE=live.</span>}

          <b>Order numbering</b>
          Next order will be #{store.order_seq + 1}

          <b>Data</b>
          <span className="muted">POPIA export and delete are not built yet — on the go-live checklist in <code>app/README.md</code>.</span>
        </div>
      </section>
    </main>
  );
}
