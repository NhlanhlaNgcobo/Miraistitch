import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Store } from "@/types";

export const dynamic = "force-dynamic";

const when = (s: string) => new Date(s).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });

/**
 * Marketing: connect Meta and Google, get the feed URLs, see what we actually
 * sent to each platform.
 *
 * The event log is shown unedited on purpose. When a merchant says "Meta
 * reports 4 sales but I had 7", the only honest answer is a record of what was
 * sent, when, and what came back — including the ones we skipped and why.
 */
export default async function Marketing() {
  const db = createClient();
  const { data: stores } = await db.from("stores").select("*").order("created_at");
  const store = (stores?.[0] as Store) ?? null;
  if (!store) {
    return (
      <main className="wrap">
        <h1>Marketing</h1>
        <div className="empty"><p>Create your store first.</p><Link className="btn-primary" href="/admin">Go to Home</Link></div>
      </main>
    );
  }

  const [{ data: mk }, { data: events }, { count: liveProducts }] = await Promise.all([
    db.from("store_marketing").select("*").eq("store_id", store.id).maybeSingle(),
    db.from("ad_events").select("*").eq("store_id", store.id).order("created_at", { ascending: false }).limit(25),
    db.from("products").select("id", { count: "exact", head: true }).eq("store_id", store.id).eq("active", true),
  ]);

  const m = (mk ?? {}) as Record<string, string | boolean | null>;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const feedXml = `${site}/s/${store.slug}/feed.xml`;
  const feedCsv = `${site}/s/${store.slug}/feed.csv`;

  async function save(form: FormData) {
    "use server";
    const db = createClient();
    const sid = String(form.get("store_id"));
    const s = (k: string, max = 200) => {
      const v = String(form.get(k) ?? "").trim().slice(0, max);
      return v || null;
    };
    // Upsert via RLS: store_marketing_owner_all is what scopes this to the owner.
    await db.from("store_marketing").upsert({
      store_id: sid,
      meta_pixel_id: s("meta_pixel_id", 40),
      meta_dataset_id: s("meta_dataset_id", 40),
      meta_access_token: s("meta_access_token", 500),
      meta_test_code: s("meta_test_code", 40),
      meta_catalog_id: s("meta_catalog_id", 40),
      ga4_measurement_id: s("ga4_measurement_id", 40),
      google_ads_id: s("google_ads_id", 40),
      google_ads_label: s("google_ads_label", 60),
      google_merchant_id: s("google_merchant_id", 40),
      tiktok_pixel_id: s("tiktok_pixel_id", 40),
      track_enabled: form.get("track_enabled") === "on",
      consent_mode: form.get("consent_mode") === "on",
      feed_enabled: form.get("feed_enabled") === "on",
    });
    revalidatePath("/admin/marketing");
  }

  const connected = (k: string) => Boolean(m[k]);
  const Status = ({ on, label }: { on: boolean; label: string }) => (
    <span className={"pill " + (on ? "ok" : "")}>{on ? "Connected" : label}</span>
  );

  return (
    <main className="wrap">
      <div className="pagehead">
        <div>
          <h1>Marketing</h1>
          <p className="sub">Connect Meta and Google so your ads can find buyers and report what they earned.</p>
        </div>
      </div>

      <section className="card card-pad" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>Product feeds</h3>
        <p className="sub" style={{ marginBottom: 14 }}>
          Shopping campaigns and dynamic product ads cannot run without a feed. Paste these URLs into
          Google Merchant Center and Meta Commerce Manager — they refresh automatically.
          {" "}Currently listing <strong>{liveProducts ?? 0}</strong> active product{liveProducts === 1 ? "" : "s"}.
        </p>
        <div className="kv">
          <b>Google Merchant Center (XML)</b>
          <a href={feedXml} target="_blank" rel="noreferrer">{feedXml} ↗</a>
          <b>Meta catalogue (CSV)</b>
          <a href={feedCsv} target="_blank" rel="noreferrer">{feedCsv} ↗</a>
        </div>
        {(liveProducts ?? 0) === 0 && (
          <p className="pe-err" style={{ marginTop: 12 }}>
            No active products, so both feeds are empty. Merchant Center will reject an empty feed —
            <Link href="/admin/products"> add a product</Link> first.
          </p>
        )}
      </section>

      <form action={save}>
        <input type="hidden" name="store_id" value={store.id} />

        <section className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="pagehead" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Meta — Facebook &amp; Instagram</h3>
            <Status on={connected("meta_pixel_id")} label="Not connected" />
          </div>
          <div className="two">
            <label>Pixel ID <span className="hint">Events Manager → Data sources</span>
              <input name="meta_pixel_id" defaultValue={(m.meta_pixel_id as string) ?? ""} placeholder="1234567890123456" /></label>
            <label>Dataset ID <span className="hint">usually the same as the pixel</span>
              <input name="meta_dataset_id" defaultValue={(m.meta_dataset_id as string) ?? ""} /></label>
          </div>
          <label>Conversions API token <span className="hint">server-side; kept secret</span>
            <input name="meta_access_token" type="password" defaultValue={(m.meta_access_token as string) ?? ""}
              placeholder={m.meta_access_token ? "•••••••• saved" : "EAAG…"} /></label>
          <p className="sub" style={{ margin: "-6px 0 14px" }}>
            This is the one that matters. Browser pixels lose a large share of purchases to ad blockers and
            iOS tracking prevention; with a token we also report each confirmed sale from our server, so
            your reported ROAS resembles reality. Events are deduplicated, never double-counted.
          </p>
          <div className="two">
            <label>Catalogue ID <span className="hint">optional</span>
              <input name="meta_catalog_id" defaultValue={(m.meta_catalog_id as string) ?? ""} /></label>
            <label>Test event code <span className="hint">only while testing</span>
              <input name="meta_test_code" defaultValue={(m.meta_test_code as string) ?? ""} placeholder="TEST12345" /></label>
          </div>
        </section>

        <section className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="pagehead" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Google — Ads, Analytics &amp; Merchant Center</h3>
            <Status on={connected("google_ads_id") || connected("ga4_measurement_id")} label="Not connected" />
          </div>
          <div className="two">
            <label>GA4 measurement ID<input name="ga4_measurement_id" defaultValue={(m.ga4_measurement_id as string) ?? ""} placeholder="G-XXXXXXXXXX" /></label>
            <label>Google Ads ID<input name="google_ads_id" defaultValue={(m.google_ads_id as string) ?? ""} placeholder="AW-123456789" /></label>
          </div>
          <div className="two">
            <label>Purchase conversion label <span className="hint">Ads → Conversions</span>
              <input name="google_ads_label" defaultValue={(m.google_ads_label as string) ?? ""} placeholder="AbC-D_efG…" /></label>
            <label>Merchant Center ID <span className="hint">optional</span>
              <input name="google_merchant_id" defaultValue={(m.google_merchant_id as string) ?? ""} /></label>
          </div>
          <p className="sub" style={{ margin: "-6px 0 0" }}>
            Google purchases are reported from the browser on the thank-you page. Server-side upload needs
            Google Ads API OAuth, which is not built yet — the event log below says so plainly rather than
            implying it was sent.
          </p>
        </section>

        <section className="card card-pad" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14 }}>TikTok</h3>
          <label>Pixel ID<input name="tiktok_pixel_id" defaultValue={(m.tiktok_pixel_id as string) ?? ""} /></label>
        </section>

        <section className="card card-pad" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14 }}>Behaviour</h3>
          <label className="pe-check"><input type="checkbox" name="track_enabled" defaultChecked={m.track_enabled !== false} /> Tracking enabled</label>
          <label className="pe-check"><input type="checkbox" name="consent_mode" defaultChecked={m.consent_mode !== false} /> Google consent mode — start denied until the shopper agrees</label>
          <label className="pe-check"><input type="checkbox" name="feed_enabled" defaultChecked={m.feed_enabled !== false} /> Product feeds public</label>
          <p className="sub" style={{ marginTop: 10 }}>
            Consent mode on is the right default under POPIA: tags load but hold events until a shopper
            agrees. Turning it off makes tracking unconditional, which is your call and your liability.
          </p>
        </section>

        <button className="btn-primary" type="submit">Save connections</button>
      </form>

      <h2 className="h2">Conversion events</h2>
      <p className="sub">What we sent to each platform, and what came back.</p>
      {!events?.length ? (
        <div className="empty"><p>Nothing yet. Events appear here after a paid order.</p></div>
      ) : (
        <table className="tbl">
          <thead><tr><th>When</th><th>Channel</th><th>Event</th><th>Status</th><th className="right">Value</th><th>Detail</th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td className="muted">{when(e.created_at)}</td>
                <td style={{ textTransform: "capitalize" }}>{e.channel}</td>
                <td>{e.event}</td>
                <td><span className={"pill " + (e.status === "sent" ? "ok" : e.status === "error" ? "bad" : "warn")}>{e.status}</span></td>
                <td className="num">{e.value_cents != null ? "R" + (e.value_cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 }) : "—"}</td>
                <td className="muted" style={{ fontSize: 12 }}>{e.error ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
