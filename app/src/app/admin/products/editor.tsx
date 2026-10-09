"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveProduct } from "./actions";
import type { Product } from "@/types";

/**
 * Add / edit a product, with the three AI tools inline.
 *
 * The AI never writes to the database. Every suggestion lands in the form as a
 * normal editable value that the owner can change or ignore before saving — so a
 * bad generation is a nuisance, not a published mistake.
 */

type Props = { storeId: string; product?: Product & Record<string, unknown>; credits: number };

const rand = (c: number) => "R" + (c / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 });

export default function Editor({ storeId, product, credits }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [notes, setNotes] = useState("");
  const [tone, setTone] = useState("warm");
  const [seoTitle, setSeoTitle] = useState((product?.seo_title as string) ?? "");
  const [seoDesc, setSeoDesc] = useState((product?.seo_description as string) ?? "");
  const [slug, setSlug] = useState((product?.slug as string) ?? "");
  const [tags, setTags] = useState(((product?.tags as string[]) ?? []).join(", "));
  const [image, setImage] = useState(product?.image ?? "");

  const [busy, setBusy] = useState<"" | "describe" | "seo" | "enhance">("");
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [balance, setBalance] = useState(credits);

  const post = async (url: string, body: unknown) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
    return data;
  };

  async function writeDescription() {
    if (!title.trim()) return setMsg({ kind: "err", text: "Add a title first." });
    setBusy("describe"); setMsg(null);
    try {
      const d = await post("/api/ai/describe", { store_id: storeId, title, notes, tone });
      const bullets = (d.bullets as string[]) ?? [];
      setDescription([d.description, bullets.length ? bullets.map((b) => `• ${b}`).join("\n") : ""].filter(Boolean).join("\n\n"));
      setMsg({ kind: "ok", text: "Draft written — edit it to sound like you." });
    } catch (e) { setMsg({ kind: "err", text: (e as Error).message }); }
    finally { setBusy(""); }
  }

  async function writeSeo() {
    if (!title.trim()) return setMsg({ kind: "err", text: "Add a title first." });
    setBusy("seo"); setMsg(null);
    try {
      const d = await post("/api/ai/seo", { store_id: storeId, product_id: product?.id, title, description });
      setSeoTitle(d.seo_title ?? ""); setSeoDesc(d.seo_description ?? "");
      setSlug(d.slug ?? ""); setTags(((d.tags as string[]) ?? []).join(", "));
      setMsg({ kind: "ok", text: "SEO filled in. Check it reads like a human wrote it." });
    } catch (e) { setMsg({ kind: "err", text: (e as Error).message }); }
    finally { setBusy(""); }
  }

  async function enhance(file: File) {
    if (file.size > 8 * 1024 * 1024) return setMsg({ kind: "err", text: "Image is over 8 MB." });
    setBusy("enhance"); setMsg(null);
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result)); fr.onerror = () => rej(new Error("Could not read that file"));
        fr.readAsDataURL(file);
      });
      const d = await post("/api/ai/enhance", { store_id: storeId, product_id: product?.id, image: dataUrl });
      setImage(d.url);
      if (typeof d.credits_remaining === "number") setBalance(d.credits_remaining);
      setMsg({ kind: "ok", text: `Product shot ready. ${d.credits_remaining} credits left.` });
    } catch (e) { setMsg({ kind: "err", text: (e as Error).message }); }
    finally { setBusy(""); }
  }

  function submit(fd: FormData) {
    start(async () => {
      const r = await saveProduct(fd);
      if (r.ok) router.push("/admin/products");
      else setMsg({ kind: "err", text: r.error });
    });
  }

  return (
    <form ref={formRef} action={submit} className="pe">
      <input type="hidden" name="store_id" value={storeId} />
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      {msg && <p className={msg.kind === "err" ? "pe-err" : "pe-ok"}>{msg.text}</p>}

      <div className="pe-grid">
        <section className="pe-card">
          <h3>The product</h3>
          <label>Title
            <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={'27" 4K Monitor'} />
          </label>

          <label>Anything the AI should know <span className="hint">optional — materials, size, what makes it good</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="IPS panel, 60Hz, USB-C, 2-year warranty" />
          </label>

          <div className="pe-ai">
            <select value={tone} onChange={(e) => setTone(e.target.value)} aria-label="Tone">
              <option value="plain">Plain</option><option value="warm">Warm</option>
              <option value="premium">Premium</option><option value="playful">Playful</option>
            </select>
            <button type="button" onClick={writeDescription} disabled={!!busy} className="pe-aibtn">
              {busy === "describe" ? "Writing…" : "✨ Write description"}
            </button>
            <span className="hint">Free</span>
          </div>

          <label>Description
            <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={9} />
          </label>
        </section>

        <section className="pe-card">
          <h3>Price &amp; stock</h3>
          <div className="pe-two">
            <label>Price (R)<input name="price" inputMode="decimal" defaultValue={product ? (product.price_cents / 100).toFixed(2) : ""} required /></label>
            <label>Compare at (R) <span className="hint">optional</span>
              <input name="compare_at" inputMode="decimal" defaultValue={product?.compare_at_cents ? ((product.compare_at_cents as number) / 100).toFixed(2) : ""} /></label>
          </div>
          <div className="pe-two">
            <label>Stock<input name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} /></label>
            <label>SKU <span className="hint">optional</span><input name="sku" defaultValue={(product?.sku as string) ?? ""} /></label>
          </div>
          <label className="pe-check">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Visible in the store
          </label>
        </section>

        <section className="pe-card">
          <h3>Photo</h3>
          <div className="pe-photo">
            {image ? <img src={image} alt="" /> : <div className="pe-ph">No photo yet</div>}
          </div>
          <input type="hidden" name="image" value={image} />
          <label>Image URL
            <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://… or generate one below" />
          </label>

          <div className="pe-paid">
            <div className="pe-paidhead">
              <strong>Studio product shot</strong>
              <span className="pe-credits">{balance} credit{balance === 1 ? "" : "s"}</span>
            </div>
            <p className="hint">Upload a phone photo — we cut the background and place it on clean white. Costs 1 credit. You are only charged if it works.</p>
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={!!busy || balance < 1}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) enhance(f); e.target.value = ""; }} />
            {busy === "enhance" && <p className="hint">Generating — this takes a few seconds…</p>}
            {balance < 1 && <p className="pe-err">Out of credits. <a href="/admin/credits">Buy more →</a></p>}
          </div>
        </section>

        <section className="pe-card">
          <h3>Search &amp; listing</h3>
          <div className="pe-ai">
            <button type="button" onClick={writeSeo} disabled={!!busy} className="pe-aibtn">
              {busy === "seo" ? "Optimising…" : "✨ Write SEO"}
            </button>
            <span className="hint">Free</span>
          </div>
          <label>Page title <span className="hint">{seoTitle.length}/60</span>
            <input name="seo_title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} />
          </label>
          <label>Meta description <span className="hint">{seoDesc.length}/155</span>
            <textarea name="seo_description" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} maxLength={200} />
          </label>
          <label>URL slug
            <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="27-inch-4k-monitor" />
          </label>
          <label>Tags <span className="hint">comma separated</span>
            <input name="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
          <div className="pe-serp">
            <div className="pe-serp-url">yourstore.miraistitch.co.za › {slug || "product"}</div>
            <div className="pe-serp-title">{seoTitle || title || "Page title"}</div>
            <div className="pe-serp-desc">{seoDesc || "Your meta description shows here."}</div>
          </div>
        </section>
      </div>

      <div className="pe-actions">
        <button type="submit" className="pe-save" disabled={pending || !!busy}>
          {pending ? "Saving…" : product?.id ? "Save changes" : "Add product"}
        </button>
        <a href="/admin/products" className="pe-cancel">Cancel</a>
        {product && <span className="hint">Live price {rand(product.price_cents)}</span>}
      </div>
    </form>
  );
}
