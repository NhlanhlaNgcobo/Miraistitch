import { NextResponse } from "next/server";
import { guard, isFail, startJob, finishJob, failJob } from "@/lib/ai/guard";
import { ask, parseJson, clean, AIError } from "@/lib/ai/anthropic";
import { admin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Listing SEO: title tag, meta description, URL slug and tags.
 *
 * Lengths are enforced here rather than asked for politely — a 92-character title
 * tag gets truncated by Google, so the model's output is clamped and the slug is
 * rebuilt from scratch in code. Slugs are also de-duplicated per store, because
 * products.slug is unique per tenant, not globally.
 */

type Body = { store_id?: string; product_id?: string; title?: string; description?: string; category?: string };
type Out = { seo_title?: unknown; seo_description?: unknown; slug?: unknown; tags?: unknown };

const MAX_TITLE = 60;
const MAX_DESC = 155;

function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** products.slug is unique per (store_id, slug) — find the next free suffix. */
async function uniqueSlug(storeId: string, base: string, productId?: string) {
  const root = base || "product";
  const { data } = await admin()
    .from("products")
    .select("id,slug")
    .eq("store_id", storeId)
    .like("slug", `${root}%`);

  const taken = new Set((data ?? []).filter((r) => r.id !== productId).map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; i < 200; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
  return `${root}-${Date.now().toString(36)}`;
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const g = await guard(body.store_id);
  if (isFail(g)) return g.response;

  const title = clean(body.title, 140);
  const description = clean(body.description, 900);
  const category = clean(body.category, 80);
  if (!title) return NextResponse.json({ error: "add a product title first" }, { status: 400 });

  // If a product_id is given it must belong to this tenant — never trust the body.
  let productId: string | undefined;
  if (typeof body.product_id === "string" && body.product_id) {
    const { data } = await admin()
      .from("products")
      .select("id,store_id")
      .eq("id", body.product_id)
      .maybeSingle();
    if (!data || data.store_id !== g.storeId) {
      return NextResponse.json({ error: "that product is not in your store" }, { status: 403 });
    }
    productId = data.id;
  }

  const job = await startJob(g, "seo", { title, category });

  const system =
    `You do on-page SEO for product listings on "${g.storeName}", a South African online store. ` +
    "Target South African search intent: people search in English, often with 'South Africa', " +
    "'SA', a city, or 'price'. Do not keyword-stuff, do not repeat the brand name in every field, " +
    "and never invent specifications or claims. " +
    `Reply with ONLY JSON: {"seo_title":"max ${MAX_TITLE} chars, most distinctive words first",` +
    `"seo_description":"max ${MAX_DESC} chars, one sentence, says what it is and why to buy",` +
    '"slug":"short-lowercase-hyphenated","tags":["4 to 8 lowercase search terms"]}';

  try {
    const raw = await ask({
      system,
      user:
        `Product: ${title}` +
        (category ? `\nCategory: ${category}` : "") +
        (description ? `\nDescription: ${description}` : "") +
        "\n\nReturn the JSON now.",
      maxTokens: 700,
      prefill: "{",
    });
    const parsed = parseJson<Out>(raw, "object");

    const seo_title = clean(parsed.seo_title, MAX_TITLE) || clean(title, MAX_TITLE);
    const seo_description = clean(parsed.seo_description, MAX_DESC);
    const slug = await uniqueSlug(g.storeId, slugify(clean(parsed.slug, 70) || title), productId);
    const tags = (Array.isArray(parsed.tags) ? parsed.tags : [])
      .map((t) => clean(t, 40).toLowerCase())
      .filter(Boolean)
      .filter((t, i, a) => a.indexOf(t) === i)
      .slice(0, 8);

    const out = {
      seo_title,
      seo_description,
      slug,
      tags,
      // surfaced so the UI can show the budget rather than just silently truncating
      limits: { title: MAX_TITLE, description: MAX_DESC },
    };

    await finishJob(job, out);
    return NextResponse.json(out);
  } catch (e) {
    const err = e instanceof AIError ? e : new AIError("AI request failed");
    await failJob(job, err.message);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
