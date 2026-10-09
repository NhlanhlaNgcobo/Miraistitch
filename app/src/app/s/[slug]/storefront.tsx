"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Block, Product, Store } from "@/types";
import { rand, vatPortion } from "@/lib/format";

type Line = { product: Product; qty: number };

export default function Storefront({
  store,
  products,
  blocks,
}: {
  store: Store;
  products: Product[];
  blocks: Block[];
}) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [drawer, setDrawer] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [ship, setShip] = useState(store.shipping[0]?.name ?? "Local pickup");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [bump, setBump] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const lines: Line[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: products.find((p) => p.id === id)!, qty }))
        .filter((l) => l.product),
    [cart, products]
  );
  const subtotal = lines.reduce((a, l) => a + l.product.price_cents * l.qty, 0);
  const shipCents = store.shipping.find((s) => s.name === ship)?.cents ?? 0;
  const total = subtotal + shipCents;
  const count = lines.reduce((a, l) => a + l.qty, 0);

  // scroll-reveal + sticky header (SSR-safe: only hide below-fold items, honour reduced motion)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onScroll = () => root.querySelector(".sf-head")?.classList.toggle("solid", window.scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true });

    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    let io: IntersectionObserver | undefined;
    if (!reduce && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove("pre"); e.target.classList.add("in"); io!.unobserve(e.target); } }),
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      root.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
        if (el.getBoundingClientRect().top > window.innerHeight * 0.9) el.classList.add("pre");
        io!.observe(el);
      });
    }
    return () => { removeEventListener("scroll", onScroll); io?.disconnect(); };
  }, []);

  function add(p: Product) {
    setCart((c) => ({ ...c, [p.id]: Math.min((c[p.id] ?? 0) + 1, p.stock) }));
    setBump(true);
    setTimeout(() => setBump(false), 260);
  }
  const setQty = (id: string, q: number) =>
    setCart((c) => { const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = q; return n; });

  async function pay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: store.slug,
          items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
          customer: { firstName: f.get("firstName"), lastName: f.get("lastName"), email: f.get("email"), phone: f.get("phone"), address: f.get("address") },
          shipMethod: ship,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Checkout failed"); setBusy(false); return; }
      const form = document.createElement("form");
      form.method = "POST"; form.action = data.action;
      Object.entries(data.fields as Record<string, string>).forEach(([k, v]) => {
        const i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = v; form.appendChild(i);
      });
      document.body.appendChild(form); form.submit();
    } catch { setErr("Network error — please try again."); setBusy(false); }
  }

  const toProducts = () => document.getElementById("sf-products")?.scrollIntoView({ behavior: "smooth" });

  function renderBlock(b: Block, i: number) {
    const p = b.props as Record<string, string>;
    switch (b.type) {
      case "hero":
        return (
          <section className={`sf-hero ${p.align === "left" ? "left" : ""}`} key={i}>
            <div className="wrap">
              <h2 className="rise">{p.heading}</h2>
              <div className="seam rise d1" />
              {p.sub && <p className="rise d2">{p.sub}</p>}
              {p.btn && <button className="sf-btn rise d3" onClick={toProducts}>{p.btn}</button>}
            </div>
          </section>
        );
      case "products":
        return (
          <section className="sf-sec" id="sf-products" key={i}>
            <div className="wrap">
              {p.title && <h2 className="reveal">{p.title}</h2>}
              <div className="pgrid">
                {products.map((prod) => (
                  <div className="pcard reveal" key={prod.id}>
                    <div className="im"><span>{prod.image}</span></div>
                    <div className="bd">
                      <div className="nm">{prod.title}</div>
                      {prod.description && <div className="ds">{prod.description}</div>}
                      <div className="pr money">{rand(prod.price_cents)}</div>
                      <button className="btn gold add" disabled={prod.stock <= 0 || (cart[prod.id] ?? 0) >= prod.stock} onClick={() => add(prod)}>
                        {prod.stock <= 0 ? "Sold out" : cart[prod.id] ? `In cart · ${cart[prod.id]}` : "Add to cart"}
                      </button>
                    </div>
                  </div>
                ))}
                {products.length === 0 && <p style={{ color: "var(--muted)" }}>No products yet.</p>}
              </div>
            </div>
          </section>
        );
      case "banner":
        return (
          <section className="sf-sec" key={i}><div className="wrap"><div className="b-banner reveal">
            <div className="em">{p.emoji || "🎁"}</div>
            <div><h3>{p.heading}</h3>{p.sub && <p>{p.sub}</p>}</div>
            {p.btn && <button className="sf-btn" onClick={toProducts}>{p.btn}</button>}
          </div></div></section>
        );
      case "collection": {
        const cats = [["👗", "Fashion"], ["💠", "Beadwork"], ["🌶️", "Food & spice"], ["🕯️", "Home"]];
        return (
          <section className="sf-sec" key={i}><div className="wrap">
            {p.title && <h2 className="reveal">{p.title}</h2>}
            <div className="cr">{cats.map((c) => (<div className="cc reveal" key={c[1]}><div className="bg" /><span className="em">{c[0]}</span><b>{c[1]}</b></div>))}</div>
          </div></section>
        );
      }
      case "testimonial":
        return (
          <section className="sf-sec" key={i}><div className="wrap"><div className="b-quote reveal">
            <blockquote>&ldquo;{p.quote}&rdquo;</blockquote><div className="who">— {p.author}</div>
          </div></div></section>
        );
      case "newsletter":
        return (
          <section className="sf-sec" key={i}><div className="wrap"><div className="b-news reveal">
            <h3>{p.heading}</h3>
            <div className="nf"><input placeholder="you@example.co.za" aria-label="Email" /><button className="sf-btn" type="button" onClick={(e) => ((e.target as HTMLButtonElement).textContent = "Subscribed ✓")}>{p.btn || "Subscribe"}</button></div>
          </div></div></section>
        );
      case "richtext":
        return (
          <section className="sf-sec" key={i}><div className="wrap"><div className="b-rich reveal">
            {p.heading && <h3>{p.heading}</h3>}{p.body && <p>{p.body}</p>}
          </div></div></section>
        );
      case "spacer":
        return <div key={i} style={{ height: Number(p.h) || 48 }} />;
      default:
        return null;
    }
  }

  return (
    <main ref={rootRef}>
      <header className="sf-head">
        <div className="wrap in">
          <span className="sf-brand">{store.name}</span>
          <button className="cartbtn" onClick={() => setDrawer(true)}>
            Cart <span className={`n${bump ? " bump" : ""}`}>{count}</span>
          </button>
        </div>
      </header>

      {checkout ? (
        <section className="wrap" style={{ paddingBlock: 48, maxWidth: 640 }}>
          <button className="btn ghost" onClick={() => setCheckout(false)} style={{ marginBottom: 24 }}>← Back to shop</button>
          <h2 style={{ fontSize: "2rem", marginBottom: 24 }}>Checkout</h2>
          {lines.map((l) => (
            <div key={l.product.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: 26 }}>{l.product.image}</span>
              <span style={{ flex: 1 }}>{l.product.title}</span>
              <input type="number" min={0} max={l.product.stock} value={l.qty} onChange={(e) => setQty(l.product.id, parseInt(e.target.value || "0", 10))} style={{ width: 64 }} />
              <span className="money" style={{ fontWeight: 700, minWidth: 90, textAlign: "right" }}>{rand(l.product.price_cents * l.qty)}</span>
            </div>
          ))}
          <form onSubmit={pay} style={{ marginTop: 24 }}>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div><label>First name</label><input name="firstName" required /></div>
              <div><label>Last name</label><input name="lastName" /></div>
            </div>
            <div style={{ marginTop: 12 }}><label>Email</label><input name="email" type="email" required /></div>
            <div style={{ marginTop: 12 }}><label>Phone</label><input name="phone" /></div>
            <div style={{ marginTop: 12 }}><label>Delivery address</label><input name="address" /></div>
            <div style={{ marginTop: 12 }}><label>Shipping</label>
              <select value={ship} onChange={(e) => setShip(e.target.value)}>
                {store.shipping.map((s) => (<option key={s.name} value={s.name}>{s.name} — {s.cents ? rand(s.cents) : "Free"}</option>))}
              </select>
            </div>
            <div className="card" style={{ marginTop: 20, padding: 16 }}>
              <Row label="Subtotal" value={rand(subtotal)} />
              <Row label="Shipping" value={shipCents ? rand(shipCents) : "Free"} />
              <Row label={`of which VAT (${store.vat_rate}%)`} value={rand(vatPortion(total, store.vat_rate))} muted />
              <Row label="Total" value={rand(total)} bold />
            </div>
            {err && <p style={{ color: "#b42318", marginTop: 12 }}>{err}</p>}
            <button className="btn gold" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
              {busy ? "Redirecting to PayFast…" : `Pay ${rand(total)} with PayFast`}
            </button>
            <p style={{ color: "var(--muted)", fontSize: ".78rem", textAlign: "center", marginTop: 10 }}>Secure PayFast checkout · incl. {store.vat_rate}% VAT</p>
          </form>
        </section>
      ) : (
        <>
          {blocks.map(renderBlock)}
          <div style={{ height: 40 }} />
        </>
      )}

      {/* cart drawer */}
      <div className={`sf-ov${drawer ? " open" : ""}`} onClick={() => setDrawer(false)} />
      <aside className={`sf-drawer${drawer ? " open" : ""}`} aria-hidden={!drawer}>
        <div className="sf-dh"><h3>Your cart</h3><button className="sf-x" onClick={() => setDrawer(false)} aria-label="Close">✕</button></div>
        {lines.length === 0 ? (
          <div className="sf-items"><div className="sf-empty">Your cart is empty.</div></div>
        ) : (
          <>
            <div className="sf-items">
              {lines.map((l) => (
                <div className="ci" key={l.product.id}>
                  <div className="cim">{l.product.image}</div>
                  <div style={{ flex: 1 }}>
                    <div className="cit">{l.product.title}</div>
                    <div className="money" style={{ color: "var(--gold-deep)", fontSize: ".82rem" }}>{rand(l.product.price_cents)}</div>
                    <div className="qty">
                      <button onClick={() => setQty(l.product.id, l.qty - 1)}>−</button>
                      <span>{l.qty}</span>
                      <button onClick={() => setQty(l.product.id, Math.min(l.qty + 1, l.product.stock))}>+</button>
                    </div>
                  </div>
                  <span className="money" style={{ fontWeight: 700 }}>{rand(l.product.price_cents * l.qty)}</span>
                </div>
              ))}
            </div>
            <div className="sf-df">
              <Row label="Subtotal (incl. VAT)" value={rand(subtotal)} />
              <button className="btn gold" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={() => { setDrawer(false); setCheckout(true); }}>
                Checkout · {rand(subtotal)}
              </button>
            </div>
          </>
        )}
      </aside>
    </main>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontWeight: bold ? 800 : 400, fontSize: bold ? "1.1rem" : ".92rem", color: muted ? "var(--muted)" : "inherit" }}>
      <span>{label}</span><span className="money">{value}</span>
    </div>
  );
}
