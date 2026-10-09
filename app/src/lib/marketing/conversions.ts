import crypto from "crypto";
import { admin } from "@/lib/supabase/admin";

/**
 * Server-side conversion events.
 *
 * Browser-fired purchase pixels lose a large share of events to iOS tracking
 * prevention, ad blockers and people who close the tab on the thank-you page.
 * A sale confirmed by the PayFast webhook is the one moment we KNOW a purchase
 * happened, so that is where the conversion should be reported from.
 *
 * Two rules this module follows:
 *
 *   - Never block or fail the webhook. PayFast retries on a non-200, and a
 *     marketing call failing must never cause an order to be processed twice.
 *     Everything here is wrapped and logged, never thrown.
 *   - Never send raw PII. Meta requires email and phone to be SHA-256 hashed,
 *     lowercased and trimmed first; that is done here rather than trusted to
 *     the caller.
 */

type Marketing = {
  meta_pixel_id: string | null;
  meta_dataset_id: string | null;
  meta_access_token: string | null;
  meta_test_code: string | null;
  google_ads_id: string | null;
  google_ads_label: string | null;
  track_enabled: boolean;
};

type OrderInfo = {
  id: string;
  storeId: string;
  number: string;
  email: string | null;
  phone?: string | null;
  totalCents: number;
  currency: string;
  items: { id: string; title: string; qty: number; priceCents: number }[];
  clientIp?: string | null;
  userAgent?: string | null;
  /** Meta's browser click/browser id cookies, if the storefront captured them. */
  fbp?: string | null;
  fbc?: string | null;
};

const sha256 = (v: string) => crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

/** Normalise a SA phone to E.164-ish digits before hashing, as Meta expects. */
function hashPhone(raw: string | null | undefined) {
  if (!raw) return undefined;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0")) d = "27" + d.slice(1);
  return d.length >= 9 ? sha256(d) : undefined;
}

async function log(
  storeId: string, orderId: string | null, channel: "meta" | "google",
  event: string, status: "sent" | "error" | "skipped",
  valueCents: number, request?: unknown, response?: unknown, error?: string,
) {
  try {
    await admin().from("ad_events").insert({
      store_id: storeId, order_id: orderId, channel, event, status,
      value_cents: valueCents,
      request: (request ?? null) as never,
      response: (response ?? null) as never,
      error: error ?? null,
    });
  } catch {
    // the log failing must not take the webhook down either
  }
}

/** Meta Conversions API — Purchase. */
async function sendMeta(m: Marketing, o: OrderInfo) {
  const dataset = m.meta_dataset_id || m.meta_pixel_id;
  if (!dataset || !m.meta_access_token) {
    await log(o.storeId, o.id, "meta", "Purchase", "skipped", o.totalCents, null, null, "not connected");
    return;
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        // Deduplicates against the browser pixel: if both fire, Meta keeps one.
        event_id: `order_${o.id}`,
        action_source: "website",
        user_data: {
          em: o.email ? [sha256(o.email)] : undefined,
          ph: hashPhone(o.phone) ? [hashPhone(o.phone)!] : undefined,
          client_ip_address: o.clientIp ?? undefined,
          client_user_agent: o.userAgent ?? undefined,
          fbp: o.fbp ?? undefined,
          fbc: o.fbc ?? undefined,
        },
        custom_data: {
          currency: o.currency,
          value: +(o.totalCents / 100).toFixed(2),
          order_id: o.number,
          contents: o.items.map((i) => ({
            id: i.id, quantity: i.qty, item_price: +(i.priceCents / 100).toFixed(2),
          })),
          content_type: "product",
        },
      },
    ],
    ...(m.meta_test_code ? { test_event_code: m.meta_test_code } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${dataset}/events?access_token=${encodeURIComponent(m.meta_access_token)}`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) },
    );
    const body = await res.json().catch(() => null);
    // The token is in the URL, so the request is logged without it.
    const safe = { ...payload, data: payload.data.map((d) => ({ ...d, user_data: "[hashed]" })) };
    await log(o.storeId, o.id, "meta", "Purchase", res.ok ? "sent" : "error",
      o.totalCents, safe, body, res.ok ? undefined : (body?.error?.message ?? `HTTP ${res.status}`));
  } catch (e) {
    await log(o.storeId, o.id, "meta", "Purchase", "error", o.totalCents, null, null, (e as Error).message);
  }
}

/**
 * Google Ads.
 *
 * Offline/server conversion upload needs OAuth and a developer token, which is
 * a much larger integration than a pasted ID. For now the purchase is recorded
 * so the merchant can see it, and the browser gtag conversion on the thank-you
 * page is what reports to Google. Logged as 'skipped' with a clear reason
 * rather than pretending it was sent.
 */
async function sendGoogle(m: Marketing, o: OrderInfo) {
  if (!m.google_ads_id || !m.google_ads_label) {
    await log(o.storeId, o.id, "google", "Purchase", "skipped", o.totalCents, null, null, "not connected");
    return;
  }
  await log(o.storeId, o.id, "google", "Purchase", "skipped", o.totalCents, null, null,
    "reported client-side via gtag; server-side upload needs Google Ads API OAuth");
}

/**
 * Fire all configured channels for a confirmed purchase.
 * Safe to call from the PayFast webhook: never throws, never blocks on failure.
 */
export async function reportPurchase(o: OrderInfo) {
  try {
    const { data } = await admin()
      .from("store_marketing")
      .select("meta_pixel_id,meta_dataset_id,meta_access_token,meta_test_code,google_ads_id,google_ads_label,track_enabled")
      .eq("store_id", o.storeId)
      .maybeSingle();

    const m = data as Marketing | null;
    if (!m || !m.track_enabled) return;

    await Promise.allSettled([sendMeta(m, o), sendGoogle(m, o)]);
  } catch {
    // marketing must never break order processing
  }
}
