import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED = ["hero", "products", "banner", "collection", "testimonial", "newsletter", "richtext", "spacer"];

// AI store builder: brand prompt → validated layout blocks (the same JSON the builder edits).
// Keeps logic out of the model — it only chooses blocks + copy; products render from the DB.
export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "not configured — set ANTHROPIC_API_KEY" }, { status: 501 });

  let prompt = "";
  try {
    prompt = String((await req.json()).prompt ?? "").slice(0, 400);
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (!prompt.trim()) return NextResponse.json({ error: "describe your brand" }, { status: 400 });

  const system =
    "You design a South African online store layout for a maker/craft/fashion brand. " +
    "Reply with ONLY a JSON array of blocks, no prose. Allowed types and props: " +
    'hero{heading,sub,btn,align("center"|"left")}, products{title,cols("2"|"3"|"4")}, ' +
    "banner{emoji,heading,sub,btn}, collection{title}, testimonial{quote,author}, " +
    "newsletter{heading,btn}, richtext{heading,body}, spacer{h}. " +
    "Use 4–7 blocks, start with a hero, include exactly one products block. South African voice, ZAR context. No markdown.";

  let text = "";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content: `Brand: ${prompt}. Return the JSON array now.` }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.error?.message || "AI request failed" }, { status: 502 });
    text = data?.content?.[0]?.text ?? "";
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  let parsed: unknown;
  try {
    const m = text.match(/\[[\s\S]*\]/);
    parsed = JSON.parse(m ? m[0] : text);
  } catch {
    return NextResponse.json({ error: "AI returned an invalid layout" }, { status: 502 });
  }

  const blocks = (Array.isArray(parsed) ? parsed : [])
    .filter((b): b is { type: string; props?: Record<string, unknown> } => !!b && typeof b === "object" && ALLOWED.includes((b as { type: string }).type))
    .map((b) => ({ type: b.type, props: b.props && typeof b.props === "object" ? b.props : {} }));

  if (blocks.length === 0) return NextResponse.json({ error: "AI returned no valid blocks" }, { status: 502 });
  return NextResponse.json({ blocks });
}
