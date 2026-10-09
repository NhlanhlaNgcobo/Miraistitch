"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product, Store } from "@/types";

const rand = (c: number) => "R" + (c / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 });

/**
 * Product detail. Adds to the same localStorage cart the storefront already
 * uses, so arriving here from a search result and adding to the basket lands a
 * shopper in exactly the same checkout as browsing the store normally.
 */
export default function ProductDetail({
  store, product, related,
}: {
  store: Store;
  product: Product & Record<string, unknown>;
  related: Product[];
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const vat = Math.round(product.price_cents * (store.vat_rate / 100) / (1 + store.vat_rate / 100));
  const compare = product.compare_at_cents as number | null;
  const soldOut = product.stock <= 0;

  function add() {
    try {
      const key = `miraistitch_cart_${store.id}`;
      const cart: { id: string; qty: number }[] = JSON.parse(localStorage.getItem(key) || "[]");
      const line = cart.find((c) => c.id === product.id);
      if (line) line.qty += qty;
      else cart.push({ id: product.id, qty });
      localStorage.setItem(key, JSON.stringify(cart));
      setAdded(true);
      setTimeout(() => setAdded(false), 2600);
    } catch {
      setAdded(false);
    }
  }

  return (
    <main className="pdp-page">
      <style>{CSS}</style>

      <header className="pdp-head">
        <Link href={`/s/${store.slug}`} className="pdp-brand">{store.name}</Link>
        <Link href={`/s/${store.slug}`} className="pdp-back">← All products</Link>
      </header>

      <nav className="pdp-crumb">
        <Link href={`/s/${store.slug}`}>Store</Link> <span>·</span> {product.title}
      </nav>

      <div className="pdp">
        <div className="pdp-media">
          {product.image
            ? <img src={product.image} alt={product.title} />
            : <div className="pdp-noimg">No photo yet</div>}
        </div>

        <div className="pdp-info">
          {(product.tags as string[])?.length ? (
            <div className="pdp-eyebrow">{(product.tags as string[])[0]}</div>
          ) : null}

          <h1>{product.title}</h1>

          <div className="pdp-price">
            {rand(product.price_cents)}
            {compare && compare > product.price_cents && (
              <span className="pdp-was">{rand(compare)}</span>
            )}
          </div>
          <div className="pdp-vat">Incl. VAT {rand(vat)} · delivery calculated at checkout</div>

          <div className={"pdp-stock" + (soldOut ? " out" : product.stock <= 10 ? " low" : "")}>
            {soldOut ? "Sold out" : product.stock <= 10 ? `Only ${product.stock} left` : "In stock"}
          </div>

          {product.description && <p className="pdp-desc">{product.description}</p>}

          <div className="pdp-buy">
            <div className="pdp-qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} aria-label="Increase">+</button>
            </div>
            <button className="pdp-add" onClick={add} disabled={soldOut}>
              {soldOut ? "Sold out" : added ? "Added ✓" : "Add to cart"}
            </button>
          </div>
          {added && (
            <p className="pdp-added">
              In your basket. <Link href={`/s/${store.slug}`}>Keep shopping</Link> or go to checkout from the store.
            </p>
          )}

          <dl className="pdp-specs">
            <div><dt>Delivery</dt><dd>Pudo · The Courier Guy · PAXI</dd></div>
            <div><dt>Payment</dt><dd>PayFast, Yoco, Ozow, SnapScan</dd></div>
            {(product.sku as string) && <div><dt>SKU</dt><dd>{product.sku as string}</dd></div>}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pdp-rel">
          <h2>More from {store.name}</h2>
          <div className="pdp-grid">
            {related.map((p) => (
              <Link key={p.id} href={`/s/${store.slug}/p/${(p as Record<string, unknown>).slug as string || p.id}`} className="pdp-card">
                <div className="pdp-card-im">{p.image ? <img src={p.image} alt="" /> : <span />}</div>
                <div className="pdp-card-nm">{p.title}</div>
                <div className="pdp-card-pr">{rand(p.price_cents)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

const CSS = `
.pdp-page{--ink:#1c1917;--stone:#57534e;--muted:#8a827a;--gold:#a16207;--gold-deep:#7a4e0a;
  --gold-tint:#f3ead6;--line:#e7e2db;--paper:#f7f5f2;
  max-width:1040px;margin:0 auto;padding:0 22px 70px;color:var(--ink);
  font:15px/1.6 "Hanken Grotesk",system-ui,-apple-system,sans-serif}
.pdp-head{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--line)}
.pdp-brand{font-family:Cormorant,Georgia,serif;font-weight:700;font-size:1.4rem;color:inherit;text-decoration:none}
.pdp-back{font-size:.9rem;color:var(--stone);text-decoration:none;font-weight:600}
.pdp-back:hover{color:var(--gold-deep)}
.pdp-crumb{font-size:.82rem;color:var(--muted);padding:16px 0}
.pdp-crumb a{color:var(--stone);text-decoration:none;font-weight:600}
.pdp-crumb a:hover{color:var(--gold-deep)}
.pdp{display:grid;grid-template-columns:1.05fr .95fr;gap:44px;align-items:start}
.pdp-media{border-radius:16px;overflow:hidden;background:var(--gold-tint);aspect-ratio:1/1;border:1px solid var(--line)}
.pdp-media img{width:100%;height:100%;object-fit:cover;display:block}
.pdp-noimg{display:grid;place-items:center;height:100%;color:var(--muted);font-size:.9rem}
.pdp-eyebrow{font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;color:var(--gold-deep);font-weight:700}
.pdp-info h1{font-family:Cormorant,Georgia,serif;font-size:clamp(2rem,4vw,2.9rem);font-weight:600;margin:6px 0 10px;line-height:1.08}
.pdp-price{font-size:1.7rem;font-weight:800;color:var(--gold-deep);font-variant-numeric:tabular-nums}
.pdp-was{font-size:1rem;font-weight:600;color:var(--muted);text-decoration:line-through;margin-left:10px}
.pdp-vat{font-size:.82rem;color:var(--muted);margin-top:2px}
.pdp-stock{display:inline-block;margin-top:14px;font-size:.84rem;font-weight:600;border-radius:999px;padding:5px 13px;background:#eaf5ef;color:#1d6b4f}
.pdp-stock.low{background:var(--gold-tint);color:var(--gold-deep)}
.pdp-stock.out{background:#fdeceb;color:#b42318}
.pdp-desc{color:var(--stone);margin:18px 0;white-space:pre-line}
.pdp-buy{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}
.pdp-qty{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}
.pdp-qty button{width:40px;height:46px;border:0;background:#fff;font-size:17px;cursor:pointer;color:var(--ink)}
.pdp-qty button:hover{background:var(--gold-tint)}
.pdp-qty span{min-width:44px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
.pdp-add{flex:1;min-width:180px;background:var(--ink);color:#fff;border:0;border-radius:10px;padding:14px 22px;font-weight:600;font-size:.95rem;cursor:pointer;transition:background .2s}
.pdp-add:hover:not(:disabled){background:var(--gold-deep)}
.pdp-add:disabled{background:#cfc8bf;cursor:not-allowed}
.pdp-added{font-size:.86rem;color:#1d6b4f;margin-top:10px}
.pdp-added a{color:var(--gold-deep);font-weight:600}
.pdp-specs{margin-top:26px;border-top:1px solid var(--line);padding-top:6px}
.pdp-specs div{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid #f0ece6;font-size:.88rem}
.pdp-specs dt{color:var(--muted)}
.pdp-specs dd{margin:0;text-align:right}
.pdp-rel{margin-top:60px}
.pdp-rel h2{font-family:Cormorant,Georgia,serif;font-size:1.7rem;font-weight:600;margin:0 0 20px}
.pdp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.pdp-card{text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff;transition:transform .18s,box-shadow .18s;display:block}
.pdp-card:hover{transform:translateY(-3px);box-shadow:0 14px 28px -18px rgba(28,25,23,.35)}
.pdp-card-im{aspect-ratio:1/1;background:var(--gold-tint)}
.pdp-card-im img{width:100%;height:100%;object-fit:cover;display:block}
.pdp-card-nm{font-weight:600;font-size:.88rem;padding:11px 12px 0}
.pdp-card-pr{color:var(--gold-deep);font-weight:700;font-size:.88rem;padding:2px 12px 12px}
@media(max-width:860px){.pdp{grid-template-columns:1fr;gap:24px}.pdp-grid{grid-template-columns:repeat(2,1fr)}}
`;
