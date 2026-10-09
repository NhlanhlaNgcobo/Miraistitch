"use client";

import { useState } from "react";

/**
 * One credit pack. Asks the server for the PayFast field set, then POSTs a real
 * form to PayFast — the price and signature are built server-side from the pack
 * id, so nothing here can change what is charged.
 */
export default function Buy({
  storeId, pack, credits, label, price, each,
}: { storeId: string; pack: string; credits: number; label: string; price: string; each: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ store_id: storeId, pack }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not start the purchase");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = d.action;
      for (const [k, v] of Object.entries(d.fields as Record<string, string>)) {
        const i = document.createElement("input");
        i.type = "hidden"; i.name = k; i.value = v;
        form.appendChild(i);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="pack">
      <div className="pack-n">{credits}</div>
      <div className="pack-l">{label}</div>
      <div className="pack-p">{price}</div>
      <div className="pack-e">{each} each</div>
      <button onClick={go} disabled={busy} className="btn-primary">
        {busy ? "Opening PayFast…" : "Buy"}
      </button>
      {err && <p className="pe-err">{err}</p>}
    </div>
  );
}
