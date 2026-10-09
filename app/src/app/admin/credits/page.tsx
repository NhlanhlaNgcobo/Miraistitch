import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PACKS } from "@/lib/credits";
import Buy from "./buy";
import type { Store } from "@/types";

export const dynamic = "force-dynamic";

const rand = (c: number) => "R" + (c / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 });
const when = (s: string) => new Date(s).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });

const REASONS: Record<string, string> = {
  signup_grant: "Welcome credits",
  purchase: "Credit pack purchased",
  image_enhance: "Product shot generated",
  refund: "Refunded — generation failed",
  adjustment: "Manual adjustment",
};

/**
 * Credits: balance, packs, and the full ledger.
 *
 * The ledger is shown in full and unedited on purpose. Owners are spending real
 * money on generations, so every movement — including automatic refunds when a
 * generation fails — should be something they can see and audit themselves.
 */
export default async function Credits() {
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: stores } = await db.from("stores").select("*").order("created_at");
  const store = (stores?.[0] as Store) ?? null;
  if (!store) {
    return (
      <main className="wrap">
        <h1>Credits</h1>
        <p>Create your store first on the <Link href="/admin">dashboard</Link>.</p>
      </main>
    );
  }

  const [{ data: bal }, { data: ledger }, { data: jobs }] = await Promise.all([
    db.from("store_credits").select("balance,updated_at").eq("store_id", store.id).maybeSingle(),
    db.from("credit_ledger").select("*").eq("store_id", store.id).order("created_at", { ascending: false }).limit(50),
    db.from("ai_jobs").select("kind,status,created_at").eq("store_id", store.id)
      .eq("kind", "image_enhance").order("created_at", { ascending: false }).limit(1),
  ]);

  const balance = bal?.balance ?? 0;
  const rows = ledger ?? [];
  const spent = rows.filter((r) => r.delta < 0).reduce((a, r) => a - r.delta, 0);

  return (
    <main className="wrap">
      <nav className="crumbs"><Link href="/admin">Dashboard</Link> · Credits</nav>
      <header className="pagehead">
        <div>
          <h1>Image credits</h1>
          <p className="sub">
            One credit turns one photo into a studio product shot on white.
            Text tools — descriptions and SEO — are free and unlimited.
          </p>
        </div>
        <div className="balance">
          <span className="n">{balance}</span>
          <span className="l">credit{balance === 1 ? "" : "s"} left</span>
        </div>
      </header>

      <section className="packs">
        {Object.entries(PACKS).map(([id, p]) => (
          <Buy key={id} storeId={store.id} pack={id} credits={p.credits}
               label={p.label} price={rand(p.cents)}
               each={rand(Math.round(p.cents / p.credits))} />
        ))}
      </section>
      <p className="muted">
        Paid securely through PayFast. Credits never expire and are tied to this store.
        {jobs?.length ? ` Last generation ${when(jobs[0].created_at)}.` : ""}
      </p>

      <h2 className="h2">Activity</h2>
      <p className="sub">{spent} credit{spent === 1 ? "" : "s"} used in the last 50 movements.</p>
      {rows.length === 0 ? (
        <div className="empty"><p>Nothing yet.</p></div>
      ) : (
        <table className="tbl">
          <thead><tr><th>When</th><th>What</th><th className="right">Change</th><th className="right">Balance</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="muted">{when(r.created_at)}</td>
                <td>{REASONS[r.reason] ?? r.reason}</td>
                <td className={r.delta < 0 ? "num bad" : "num good"}>{r.delta > 0 ? `+${r.delta}` : r.delta}</td>
                <td className="num">{r.balance_after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
