/**
 * One place that talks to the model, so every route gets the same timeout,
 * error shape and model pin. Routes stay responsible for validating whatever
 * comes back — the model is never trusted to produce safe output.
 */

const API = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 25_000;

export class AIError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

export function hasKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function ask(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  /** Prefill the assistant turn to force a shape, e.g. "{" for JSON. */
  prefill?: string;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AIError("AI is not configured — set ANTHROPIC_API_KEY", 501);

  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: opts.user },
  ];
  if (opts.prefill) messages.push({ role: "assistant", content: opts.prefill });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: opts.maxTokens ?? 1200,
        system: opts.system,
        messages,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new AIError(data?.error?.message || `AI request failed (${res.status})`, 502);
    }
    const text: string = data?.content?.[0]?.text ?? "";
    return opts.prefill ? opts.prefill + text : text;
  } catch (e) {
    if (e instanceof AIError) throw e;
    if ((e as Error).name === "AbortError") throw new AIError("AI request timed out", 504);
    throw new AIError("AI request failed", 502);
  } finally {
    clearTimeout(timer);
  }
}

/** Pull the first JSON object/array out of a model reply and parse it. */
export function parseJson<T>(text: string, shape: "object" | "array" = "object"): T {
  const re = shape === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const m = text.match(re);
  try {
    return JSON.parse(m ? m[0] : text) as T;
  } catch {
    throw new AIError("AI returned something unreadable — try again", 502);
  }
}

export const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
