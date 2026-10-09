import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = createClient();
  const { data: stores } = await db.from("stores").select("name,slug").limit(12);

  return (
    <main className="wrap" style={{ paddingBlock: 80, maxWidth: 760 }}>
      <h1 style={{ fontSize: "3rem" }}>MiraiStitch</h1>
      <p style={{ color: "var(--stone)", fontSize: "1.1rem", marginTop: 12 }}>
        Commerce for South African makers — an AI store builder, local payments with no platform
        sales fee, and local delivery. This is the application backend (Next.js + Supabase +
        PayFast). The marketing landing lives in the static <code>miraistitch/</code> site.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <Link className="btn gold" href="/admin">Merchant admin</Link>
        <Link className="btn ghost" href="/login">Sign in</Link>
      </div>

      <h2 style={{ marginTop: 48, fontSize: "1.4rem" }}>Live stores</h2>
      <ul style={{ marginTop: 12 }}>
        {(stores ?? []).map((s) => (
          <li key={s.slug} style={{ padding: "6px 0" }}>
            <Link href={`/s/${s.slug}`} style={{ color: "var(--gold-deep)", fontWeight: 600 }}>
              {s.name} → /s/{s.slug}
            </Link>
          </li>
        ))}
        {(!stores || stores.length === 0) && (
          <li style={{ color: "var(--muted)" }}>No stores yet — sign in, then run the seed or create one.</li>
        )}
      </ul>
    </main>
  );
}
