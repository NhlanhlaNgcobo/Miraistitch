import Link from "next/link";

// Rendered by any page that needs the database before a backend is connected.
// Keeps the app usable and self-explanatory instead of throwing a 500.
export default function SetupNotice({ where = "This page" }: { where?: string }) {
  return (
    <main className="wrap" style={{ paddingBlock: 90, maxWidth: 680 }}>
      <span className="lp-eyebrow">Backend not connected</span>
      <h1 style={{ fontSize: "2.4rem", marginTop: 18 }}>Connect your backend to go live</h1>
      <p style={{ color: "var(--stone)", fontSize: "1.05rem", marginTop: 14 }}>
        {where} needs the database. The whole MiraiStitch app is built and ready — it just needs a
        Supabase project and a few environment variables.
      </p>
      <ol style={{ color: "var(--stone)", lineHeight: 1.9, marginTop: 18, paddingLeft: 20 }}>
        <li>Create a free project at <b>supabase.com</b>.</li>
        <li>Run the SQL in <code>supabase/migrations/</code> (SQL editor or <code>supabase db push</code>).</li>
        <li>Copy <code>.env.example</code> → <code>.env.local</code> and fill in the Supabase URL + keys.</li>
        <li>Enable Email auth, then restart <code>npm run dev</code>.</li>
      </ol>
      <p style={{ color: "var(--muted)", fontSize: ".9rem", marginTop: 16 }}>
        Full steps are in <code>BACKEND.md</code>.
      </p>
      <div style={{ marginTop: 24 }}>
        <Link className="btn ghost" href="/">← Back to home</Link>
      </div>
    </main>
  );
}
