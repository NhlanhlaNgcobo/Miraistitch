import { NextResponse } from "next/server";
import { guard, isFail, startJob, finishJob, failJob } from "@/lib/ai/guard";
import { admin } from "@/lib/supabase/admin";
import { toWhiteBackground, imageProviderConfigured, ImageError } from "@/lib/ai/imageProvider";
import { ENHANCE_COST as COST } from "@/lib/credits";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * PAID: turn an owner's photo into a clean white-background product shot.
 *
 * Order of operations matters, and it is deliberate:
 *
 *   1. verify tenant ownership               (guard)
 *   2. validate the upload                   (before paying for anything)
 *   3. spend credits ATOMICALLY              (row lock in spend_credits)
 *   4. do the work
 *   5. refund on failure                     (the owner never pays for an error)
 *
 * Spending before the work — rather than after — is what stops two concurrent
 * requests with one credit left from both succeeding. The refund path is what
 * keeps that fair. Every step is written to ai_jobs and credit_ledger, so a
 * disputed charge can always be reconstructed.
 */

const BUCKET = "product-media";
const MAX_BYTES = 8 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Body = { store_id?: string; product_id?: string; image?: string };

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const g = await guard(body.store_id);
  if (isFail(g)) return g.response;

  // ---- validate before charging -------------------------------------------
  const dataUrl = typeof body.image === "string" ? body.image : "";
  const m = dataUrl.match(/^data:([a-z/+-]+);base64,(.+)$/i);
  if (!m) return NextResponse.json({ error: "send the image as a base64 data URL" }, { status: 400 });

  const [, mime, b64] = m;
  if (!OK_TYPES.includes(mime.toLowerCase())) {
    return NextResponse.json({ error: "use a JPEG, PNG or WebP image" }, { status: 415 });
  }
  const bytes = Buffer.from(b64, "base64");
  if (bytes.byteLength === 0) return NextResponse.json({ error: "that image is empty" }, { status: 400 });
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "image is over 8 MB — resize and try again" }, { status: 413 });
  }

  // product must belong to this tenant
  let productId: string | null = null;
  if (typeof body.product_id === "string" && body.product_id) {
    const { data } = await admin().from("products").select("id,store_id").eq("id", body.product_id).maybeSingle();
    if (!data || data.store_id !== g.storeId) {
      return NextResponse.json({ error: "that product is not in your store" }, { status: 403 });
    }
    productId = data.id;
  }

  // Fail before charging if the feature simply is not switched on.
  if (!imageProviderConfigured()) {
    return NextResponse.json(
      {
        error:
          "Product-shot generation is not configured on this deployment. No credits were spent.",
        configured: false,
      },
      { status: 501 },
    );
  }

  const db = admin();
  const job = await startJob(g, "image_enhance", { product_id: productId, bytes: bytes.byteLength }, COST);

  // ---- charge (atomic) -----------------------------------------------------
  const { data: balance, error: spendErr } = await db.rpc("spend_credits", {
    sid: g.storeId,
    n: COST,
    why: "image_enhance",
    r: job ?? null,
  });

  if (spendErr) {
    await failJob(job, spendErr.message);
    return NextResponse.json({ error: "could not reserve credits" }, { status: 500 });
  }
  if (balance === -1) {
    await failJob(job, "insufficient credits");
    return NextResponse.json(
      { error: "You're out of image credits.", code: "NO_CREDITS", needed: COST },
      { status: 402 },
    );
  }

  // ---- do the work, refund if it fails -------------------------------------
  const refund = async (why: string) => {
    await db.rpc("grant_credits", { sid: g.storeId, n: COST, why: "refund", r: `${job}-refund` });
    await failJob(job, why);
  };

  try {
    const out = await toWhiteBackground(dataUrl);

    const path = `${g.storeId}/${productId ?? "unassigned"}/${job}.png`;
    const up = await db.storage.from(BUCKET).upload(path, out, {
      contentType: "image/png",
      upsert: true,
    });
    if (up.error) throw new ImageError("could not save the generated image", 500);

    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
    const url = pub.publicUrl;

    if (productId) {
      await db.from("product_images").insert({
        store_id: g.storeId,
        product_id: productId,
        url,
        kind: "enhanced",
        position: 0,
      });
    }

    await finishJob(job, { url, path });
    return NextResponse.json({ url, credits_remaining: balance, cost: COST });
  } catch (e) {
    const err = e instanceof ImageError ? e : new ImageError("image generation failed");
    await refund(err.message);
    return NextResponse.json(
      { error: `${err.message} Your credit was refunded.`, refunded: true },
      { status: err.status },
    );
  }
}
