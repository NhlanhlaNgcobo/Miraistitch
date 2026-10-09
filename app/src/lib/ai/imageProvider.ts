/**
 * Background removal / product-shot provider.
 *
 * Worth being explicit: the Anthropic API does not generate or edit images, so the
 * pixel work here cannot be done by the same model that writes the copy. This module
 * is the seam where a real image provider plugs in. Everything around it — credits,
 * the atomic spend, refund-on-failure, storage, the job audit trail — is real and
 * works today; only the provider call needs a key.
 *
 * Configure with:
 *   IMAGE_PROVIDER=replicate
 *   REPLICATE_API_TOKEN=...
 *   REPLICATE_BGREMOVE_VERSION=<model version id>   (a background-removal model)
 *
 * Returns a PNG with the subject cut out and composited onto white.
 */

export class ImageError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

export function imageProviderConfigured() {
  const p = (process.env.IMAGE_PROVIDER || "").toLowerCase();
  if (p === "replicate") return Boolean(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_BGREMOVE_VERSION);
  return false;
}

export function imageProviderName() {
  return (process.env.IMAGE_PROVIDER || "none").toLowerCase();
}

/** Poll a Replicate prediction to completion. */
async function replicate(dataUrl: string): Promise<ArrayBuffer> {
  const token = process.env.REPLICATE_API_TOKEN!;
  const version = process.env.REPLICATE_BGREMOVE_VERSION!;

  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ version, input: { image: dataUrl } }),
  });
  const started = await create.json().catch(() => null);
  if (!create.ok) throw new ImageError(started?.detail || "image provider rejected the request", 502);

  const url: string | undefined = started?.urls?.get;
  if (!url) throw new ImageError("image provider did not return a job url", 502);

  // ~60s ceiling; background removal is normally a few seconds
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const poll = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
    const job = await poll.json().catch(() => null);
    if (job?.status === "succeeded") {
      const out = Array.isArray(job.output) ? job.output[0] : job.output;
      if (typeof out !== "string") throw new ImageError("image provider returned no image", 502);
      const img = await fetch(out);
      if (!img.ok) throw new ImageError("could not download the generated image", 502);
      return await img.arrayBuffer();
    }
    if (job?.status === "failed" || job?.status === "canceled") {
      throw new ImageError(job?.error || "image generation failed", 502);
    }
  }
  throw new ImageError("image generation timed out", 504);
}

export async function toWhiteBackground(dataUrl: string): Promise<ArrayBuffer> {
  if (!imageProviderConfigured()) {
    throw new ImageError(
      "Product-shot generation is not configured on this deployment. Set IMAGE_PROVIDER, " +
        "REPLICATE_API_TOKEN and REPLICATE_BGREMOVE_VERSION to enable it. No credits were spent.",
      501,
    );
  }
  return replicate(dataUrl);
}
