import { NextResponse } from "next/server";
import { guard, isFail, startJob, finishJob, failJob } from "@/lib/ai/guard";
import { ask, parseJson, clean, AIError } from "@/lib/ai/anthropic";

export const runtime = "nodejs";

/**
 * AI store builder: brand prompt → validated layout blocks (the same JSON the
 * builder edits). Logic stays out of the model — it only chooses blocks and writes
 * copy; products always render from the database.
 *
 * This route previously had no authentication, which meant any visitor could spend
 * the platform's model budget. It now requires a signed-in owner and a store they
 * actually own, and every call is recorded against that tenant in ai_jobs.
 */

const ALLOWED = ["hero", "products", "banner", "collection", "testimonial", "newsletter", "richtext", "spacer"] as const;
type BlockType = (typeof ALLOWED)[number];

// Props are whitelisted per block type: the model cannot smuggle extra keys into
// the layout JSON, and every string is length-clamped before it is stored.
const PROPS: Record<BlockType, Record<string, number>> = {
  hero: { heading: 120, sub: 240, btn: 32, align: 10 },
  products: { title: 80, cols: 2 },
  banner: { heading: 90, sub: 200, btn: 32 },
  collection: { title: 80 },
  testimonial: { quote: 240, author: 60 },
  newsletter: { heading: 90, btn: 32 },
  richtext: { heading: 90, body: 900 },
  spacer: { h: 4 },
};

export async function POST(req: Request) {
  let body: { store_id?: string; prompt?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const g = await guard(body.store_id);
  if (isFail(g)) return g.response;

  const prompt = clean(body.prompt, 400);
  if (!prompt) return NextResponse.json({ error: "describe your store" }, { status: 400 });

  const job = await startJob(g, "layout", { prompt });

  const system =
    `You design the storefront layout for "${g.storeName}", a South African online store. ` +
    "It may sell anything — electronics, furniture, fashion, groceries, hardware — so do not " +
    "assume a craft or maker brand. Reply with ONLY a JSON array of blocks, no prose. " +
    "Allowed types and props: " +
    'hero{heading,sub,btn,align("center"|"left")}, products{title,cols("2"|"3"|"4")}, ' +
    "banner{heading,sub,btn}, collection{title}, testimonial{quote,author}, " +
    "newsletter{heading,btn}, richtext{heading,body}, spacer{h}. " +
    "Use 4–7 blocks, start with a hero, include exactly one products block. " +
    "South African voice, ZAR context, VAT-inclusive pricing. Never invent statistics, " +
    "awards or customer numbers. If you write a testimonial, keep it generic enough to be " +
    "obviously illustrative — the owner will replace it. No markdown, no emoji.";

  try {
    const text = await ask({
      system,
      user: `Store: ${prompt}. Return the JSON array now.`,
      maxTokens: 1500,
      prefill: "[",
    });
    const parsed = parseJson<unknown[]>(text, "array");

    const blocks = (Array.isArray(parsed) ? parsed : [])
      .filter((b): b is { type: BlockType; props?: Record<string, unknown> } =>
        !!b && typeof b === "object" && ALLOWED.includes((b as { type: BlockType }).type))
      .map((b) => {
        const allowed = PROPS[b.type];
        const props: Record<string, string> = {};
        for (const [k, max] of Object.entries(allowed)) {
          const v = b.props?.[k];
          const s = clean(v, max);
          if (s) props[k] = s;
        }
        return { type: b.type, props };
      })
      .slice(0, 9);

    if (blocks.length === 0) throw new AIError("AI returned no usable blocks", 502);

    await finishJob(job, { blocks });
    return NextResponse.json({ blocks });
  } catch (e) {
    const err = e instanceof AIError ? e : new AIError("AI request failed");
    await failJob(job, err.message);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
