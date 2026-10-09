import { NextResponse } from "next/server";
import { guard, isFail, startJob, finishJob, failJob } from "@/lib/ai/guard";
import { ask, parseJson, clean, AIError } from "@/lib/ai/anthropic";

export const runtime = "nodejs";

/**
 * Product description writer.
 *
 * Free (no credits) — it is cheap text and we want owners listing products, which
 * is what actually makes the platform money. The paid feature is image enhancement.
 *
 * The model writes copy only. It never sees or sets price, stock or any identifier,
 * so a prompt-injected product title cannot reach anything that matters.
 */

type Body = { store_id?: string; title?: string; notes?: string; tone?: string };
type Out = { description?: unknown; bullets?: unknown; short?: unknown };

const TONES: Record<string, string> = {
  plain: "plain and factual, no hype",
  warm: "warm and human, lightly conversational",
  premium: "restrained and premium, confident but never boastful",
  playful: "playful and energetic, still clear",
};

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
  const notes = clean(body.notes, 600);
  const tone = TONES[String(body.tone ?? "warm")] ?? TONES.warm;
  if (!title) return NextResponse.json({ error: "add a product title first" }, { status: 400 });

  const job = await startJob(g, "describe", { title, notes, tone });

  const system =
    `You write product copy for "${g.storeName}", a South African online store. ` +
    `Voice: ${tone}. Audience: South African shoppers; prices are in rands and VAT-inclusive. ` +
    "Rules: never invent specifications, materials, certifications, dimensions or claims that were " +
    "not given to you — if a detail is unknown, leave it out. No superlatives you cannot support, " +
    "no 'best in the world', no fake scarcity, no emoji. Write British/South African English. " +
    'Reply with ONLY JSON: {"short":"one sentence under 160 chars","description":"2 short paragraphs, plain text","bullets":["3 to 5 short factual points"]}';

  try {
    const raw = await ask({
      system,
      user: `Product: ${title}${notes ? `\nWhat the owner told us: ${notes}` : ""}\n\nReturn the JSON now.`,
      maxTokens: 900,
      prefill: "{",
    });
    const parsed = parseJson<Out>(raw, "object");

    const out = {
      short: clean(parsed.short, 200),
      description: clean(parsed.description, 1500),
      bullets: (Array.isArray(parsed.bullets) ? parsed.bullets : [])
        .map((b) => clean(b, 140))
        .filter(Boolean)
        .slice(0, 5),
    };
    if (!out.description) throw new AIError("AI returned an empty description", 502);

    await finishJob(job, out);
    return NextResponse.json(out);
  } catch (e) {
    const err = e instanceof AIError ? e : new AIError("AI request failed");
    await failJob(job, err.message);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
