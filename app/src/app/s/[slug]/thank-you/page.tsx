import Link from "next/link";

// Buyers aren't signed in, and orders are private under RLS, so this page stays generic.
// Payment is confirmed server-side by the PayFast ITN webhook; the merchant sees it in admin.
export default function ThankYou({ params }: { params: { slug: string } }) {
  return (
    <main className="wrap" style={{ paddingBlock: 100, maxWidth: 560, textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--gold)", display: "grid", placeItems: "center", margin: "0 auto 18px", color: "#fff", fontSize: 32 }}>✓</div>
      <h1 style={{ fontSize: "2rem" }}>Thank you!</h1>
      <p style={{ color: "var(--stone)", marginTop: 10 }}>
        Your payment is being confirmed. You'll get an email receipt once it clears, and the store
        will start preparing your order.
      </p>
      <Link className="btn ghost" href={`/s/${params.slug}`} style={{ marginTop: 24 }}>Back to the shop</Link>
    </main>
  );
}
