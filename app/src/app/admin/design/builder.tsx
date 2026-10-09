"use client";

import { useState } from "react";
import Link from "next/link";
import type { Block, Store } from "@/types";

type Field = [key: string, label: string, kind: string];
type Cat = { label: string; def: Record<string, string>; fields: Field[] };

const CAT: Record<string, Cat> = {
  hero: { label: "Hero", def: { heading: "Welcome", sub: "Shop our latest collection.", btn: "Shop now", align: "center" }, fields: [["heading", "Heading", "text"], ["sub", "Subtext", "textarea"], ["btn", "Button", "text"], ["align", "Align", "select:center,left"]] },
  products: { label: "Product grid", def: { title: "Products", cols: "3" }, fields: [["title", "Title", "text"], ["cols", "Columns", "select:2,3,4"]] },
  banner: { label: "Promo banner", def: { emoji: "🎁", heading: "Free delivery over R500", sub: "This week only.", btn: "Shop" }, fields: [["emoji", "Emoji", "text"], ["heading", "Heading", "text"], ["sub", "Subtext", "text"], ["btn", "Button", "text"]] },
  collection: { label: "Collections", def: { title: "Shop by category" }, fields: [["title", "Title", "text"]] },
  testimonial: { label: "Testimonial", def: { quote: "Great quality, fast delivery.", author: "A happy customer" }, fields: [["quote", "Quote", "textarea"], ["author", "Author", "text"]] },
  newsletter: { label: "Newsletter", def: { heading: "Join the list", btn: "Subscribe" }, fields: [["heading", "Heading", "text"], ["btn", "Button", "text"]] },
  richtext: { label: "Rich text", def: { heading: "Our story", body: "We started our brand to…" }, fields: [["heading", "Heading", "text"], ["body", "Body", "textarea"]] },
  spacer: { label: "Spacer", def: { h: "48" }, fields: [["h", "Height (px)", "text"]] },
};

function preview(b: Block): string {
  const p = b.props as Record<string, string>;
  if (b.type === "hero") return p.heading || "Hero";
  if (b.type === "products") return p.title || "Product grid";
  if (b.type === "banner") return `${p.emoji ?? ""} ${p.heading ?? "Banner"}`;
  if (b.type === "collection") return p.title || "Collections";
  if (b.type === "testimonial") return `“${p.quote ?? ""}”`;
  if (b.type === "newsletter") return p.heading || "Newsletter";
  if (b.type === "richtext") return p.heading || "Rich text";
  if (b.type === "spacer") return `Spacer · ${p.h ?? 48}px`;
  return b.type;
}

export default function Builder({
  store,
  initialBlocks,
  productCount,
  publish,
  aiEnabled,
}: {
  store: Store;
  initialBlocks: Block[];
  productCount: number;
  publish: (storeId: string, blocks: Block[]) => Promise<{ ok: boolean; error?: string }>;
  aiEnabled: boolean;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [sel, setSel] = useState<number | null>(initialBlocks.length ? 0 : null);
  const [drag, setDrag] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  function addBlock(type: string) {
    const b: Block = { type, props: { ...CAT[type].def } };
    setBlocks((v) => {
      const n = [...v, b];
      setSel(n.length - 1);
      return n;
    });
  }
  function update(key: string, value: string) {
    if (sel === null) return;
    setBlocks((v) => v.map((b, i) => (i === sel ? { ...b, props: { ...b.props, [key]: value } } : b)));
  }
  function remove(i: number) {
    setBlocks((v) => v.filter((_, x) => x !== i));
    setSel(null);
  }
  function move(i: number, dir: -1 | 1) {
    setBlocks((v) => {
      const j = i + dir;
      if (j < 0 || j >= v.length) return v;
      const n = [...v];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
    setSel(i + dir);
  }
  function onDrop(i: number) {
    if (drag === null || drag === i) return setDrag(null);
    setBlocks((v) => {
      const n = [...v];
      const [m] = n.splice(drag, 1);
      n.splice(i, 0, m);
      return n;
    });
    setSel(i);
    setDrag(null);
  }

  async function onPublish() {
    setStatus("Publishing…");
    const r = await publish(store.id, blocks);
    setStatus(r.ok ? "Published ✓" : `Error: ${r.error}`);
    setTimeout(() => setStatus(""), 2500);
  }

  async function onGenerate() {
    if (!prompt.trim()) return;
    setAiBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) setStatus(`AI: ${data.error}`);
      else {
        setBlocks(data.blocks as Block[]);
        setSel(0);
        setStatus("AI draft loaded — review, then Publish.");
      }
    } catch {
      setStatus("AI: network error");
    }
    setAiBusy(false);
  }

  const selected = sel !== null ? blocks[sel] : null;

  return (
    <main className="wrap" style={{ paddingBlock: 30, maxWidth: 1040 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem" }}>Design your store</h1>
          <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>{store.name} · {productCount} products</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {status && <span style={{ fontSize: ".85rem", color: "var(--stone)" }}>{status}</span>}
          <Link className="btn ghost" href={`/s/${store.slug}`} target="_blank">View store</Link>
          <Link className="btn ghost" href="/admin">Admin</Link>
          <button className="btn gold" onClick={onPublish}>Publish</button>
        </div>
      </div>

      {/* AI generate */}
      <div className="card" style={{ padding: 16, marginTop: 18, display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <label>Generate with AI {aiEnabled ? "" : "(set ANTHROPIC_API_KEY to enable)"}</label>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. beaded jewellery, earthy, premium" disabled={!aiEnabled} />
        </div>
        <button className="btn" onClick={onGenerate} disabled={!aiEnabled || aiBusy}>{aiBusy ? "Generating…" : "Generate"}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 280px", gap: 16, marginTop: 18, alignItems: "start" }}>
        {/* palette */}
        <aside className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".06em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 10 }}>Add block</div>
          {Object.entries(CAT).map(([type, c]) => (
            <button key={type} className="btn ghost" style={{ width: "100%", justifyContent: "flex-start", marginBottom: 7, padding: "9px 12px" }} onClick={() => addBlock(type)}>+ {c.label}</button>
          ))}
        </aside>

        {/* canvas (drag to reorder) */}
        <section className="card" style={{ padding: 14, minHeight: 300 }}>
          {blocks.length === 0 && <div style={{ color: "var(--muted)", textAlign: "center", padding: "40px 10px" }}>Add blocks from the left, or generate a draft with AI.</div>}
          {blocks.map((b, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              onClick={() => setSel(i)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 8,
                border: `1px solid ${sel === i ? "var(--gold)" : "var(--line)"}`, borderRadius: 10,
                background: sel === i ? "var(--gold-tint)" : "var(--paper-2)", cursor: "grab",
                opacity: drag === i ? 0.5 : 1,
              }}
            >
              <span style={{ color: "var(--muted)", cursor: "grab" }}>⠿</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: ".72rem", color: "var(--gold-deep)", fontWeight: 700, textTransform: "uppercase" }}>{CAT[b.type]?.label ?? b.type}</div>
                <div style={{ fontSize: ".9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview(b)}</div>
              </div>
              <button className="btn ghost" style={{ padding: "4px 9px" }} onClick={(e) => { e.stopPropagation(); move(i, -1); }}>↑</button>
              <button className="btn ghost" style={{ padding: "4px 9px" }} onClick={(e) => { e.stopPropagation(); move(i, 1); }}>↓</button>
              <button className="btn ghost" style={{ padding: "4px 9px", color: "#b42318" }} onClick={(e) => { e.stopPropagation(); remove(i); }}>✕</button>
            </div>
          ))}
        </section>

        {/* inspector */}
        <aside className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".06em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 12 }}>Edit</div>
          {!selected ? (
            <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>Select a block to edit its content.</p>
          ) : (
            <>
              <div style={{ fontFamily: "var(--f-serif)", fontSize: "1.2rem", marginBottom: 12 }}>{CAT[selected.type]?.label}</div>
              {(CAT[selected.type]?.fields ?? []).map(([key, label, kind]) => {
                const val = String((selected.props as Record<string, unknown>)[key] ?? "");
                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <label>{label}</label>
                    {kind === "textarea" ? (
                      <textarea value={val} onChange={(e) => update(key, e.target.value)} rows={3} />
                    ) : kind.startsWith("select:") ? (
                      <select value={val} onChange={(e) => update(key, e.target.value)}>
                        {kind.slice(7).split(",").map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input value={val} onChange={(e) => update(key, e.target.value)} />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
