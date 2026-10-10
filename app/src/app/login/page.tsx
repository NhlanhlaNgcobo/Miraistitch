"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/config";
import SetupNotice from "@/components/SetupNotice";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  if (!supabaseConfigured) return <SetupNotice where="Sign-in" />;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <main className="wrap" style={{ paddingBlock: 100, maxWidth: 420 }}>
      <h1 style={{ fontSize: "2rem" }}>Sign in</h1>
      <p style={{ color: "var(--stone)", marginTop: 8 }}>We'll email you a magic link — no password.</p>
      {sent ? (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>Check your inbox for a sign-in link.</div>
      ) : (
        <form onSubmit={send} style={{ marginTop: 20 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.co.za" />
          {err && <p style={{ color: "#b42318", marginTop: 10 }}>{err}</p>}
          <button className="btn gold" type="submit" style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>Send magic link</button>
        </form>
      )}
    </main>
  );
}
