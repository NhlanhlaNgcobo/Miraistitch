"use client";

import Script from "next/script";
import { useEffect } from "react";

/**
 * Storefront tracking tags.
 *
 * Only ever receives PUBLIC ids — they ship in the page HTML by design. The
 * Meta Conversions API access token is never passed to the client; it lives
 * server-side and is read only by the webhook (see lib/marketing/conversions).
 *
 * With consentMode on, Google's tags start in a denied state and the storefront
 * can grant later. That is the default because POPIA (and GDPR for any overseas
 * buyer) expects consent before tracking, and defaulting to "granted" quietly
 * makes every merchant on the platform non-compliant.
 */
export default function Pixels({
  metaPixelId, ga4Id, googleAdsId, tiktokPixelId, consentMode = true,
}: {
  metaPixelId?: string | null;
  ga4Id?: string | null;
  googleAdsId?: string | null;
  tiktokPixelId?: string | null;
  consentMode?: boolean;
}) {
  const googleTag = ga4Id || googleAdsId;

  // PageView on client-side route changes, which the inline snippets only fire once.
  useEffect(() => {
    if (metaPixelId && typeof window !== "undefined") {
      const w = window as unknown as { fbq?: (...a: unknown[]) => void };
      w.fbq?.("track", "PageView");
    }
  }, [metaPixelId]);

  return (
    <>
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaPixelId}');fbq('track','PageView');
        `}</Script>
      )}

      {googleTag && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleTag}`} strategy="afterInteractive" />
          <Script id="gtag" strategy="afterInteractive">{`
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
${consentMode ? `gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});` : ""}
gtag('js',new Date());
${ga4Id ? `gtag('config','${ga4Id}');` : ""}
${googleAdsId ? `gtag('config','${googleAdsId}');` : ""}
          `}</Script>
        </>
      )}

      {tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">{`
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};
ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;
var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('${tiktokPixelId}');ttq.page();}(window,document,'ttq');
        `}</Script>
      )}
    </>
  );
}

/* ---- helpers the storefront calls on real shopper actions ---- */

type W = Window & {
  fbq?: (...a: unknown[]) => void;
  gtag?: (...a: unknown[]) => void;
  ttq?: { track: (...a: unknown[]) => void };
};

export function trackViewContent(p: { id: string; title: string; priceCents: number; currency?: string }) {
  if (typeof window === "undefined") return;
  const w = window as W;
  const value = +(p.priceCents / 100).toFixed(2);
  const currency = p.currency || "ZAR";
  w.fbq?.("track", "ViewContent", { content_ids: [p.id], content_type: "product", value, currency });
  w.gtag?.("event", "view_item", { currency, value, items: [{ item_id: p.id, item_name: p.title, price: value }] });
  w.ttq?.track("ViewContent", { content_id: p.id, value, currency });
}

export function trackAddToCart(p: { id: string; title: string; priceCents: number; qty: number; currency?: string }) {
  if (typeof window === "undefined") return;
  const w = window as W;
  const value = +((p.priceCents * p.qty) / 100).toFixed(2);
  const currency = p.currency || "ZAR";
  w.fbq?.("track", "AddToCart", { content_ids: [p.id], content_type: "product", value, currency });
  w.gtag?.("event", "add_to_cart", { currency, value, items: [{ item_id: p.id, item_name: p.title, quantity: p.qty, price: +(p.priceCents / 100).toFixed(2) }] });
  w.ttq?.track("AddToCart", { content_id: p.id, value, currency });
}

export function trackBeginCheckout(totalCents: number, ids: string[], currency = "ZAR") {
  if (typeof window === "undefined") return;
  const w = window as W;
  const value = +(totalCents / 100).toFixed(2);
  w.fbq?.("track", "InitiateCheckout", { content_ids: ids, content_type: "product", value, currency, num_items: ids.length });
  w.gtag?.("event", "begin_checkout", { currency, value });
  w.ttq?.track("InitiateCheckout", { value, currency });
}

/**
 * Purchase, fired on the thank-you page.
 *
 * eventId must be `order_<uuid>` to match what the Conversions API sends from
 * the webhook — that is how Meta deduplicates the browser and server copies of
 * the same sale instead of counting it twice.
 */
export function trackPurchase(o: {
  orderId: string; number: string; totalCents: number; currency?: string;
  items: { id: string; title: string; qty: number; priceCents: number }[];
  googleAdsId?: string | null; googleAdsLabel?: string | null;
}) {
  if (typeof window === "undefined") return;
  const w = window as W;
  const value = +(o.totalCents / 100).toFixed(2);
  const currency = o.currency || "ZAR";

  w.fbq?.("track", "Purchase", { value, currency, content_ids: o.items.map((i) => i.id), content_type: "product" },
    { eventID: `order_${o.orderId}` });

  w.gtag?.("event", "purchase", {
    transaction_id: o.number, value, currency,
    items: o.items.map((i) => ({ item_id: i.id, item_name: i.title, quantity: i.qty, price: +(i.priceCents / 100).toFixed(2) })),
  });

  if (o.googleAdsId && o.googleAdsLabel) {
    w.gtag?.("event", "conversion", {
      send_to: `${o.googleAdsId}/${o.googleAdsLabel}`,
      value, currency, transaction_id: o.number,
    });
  }

  w.ttq?.track("CompletePayment", { value, currency });
}
