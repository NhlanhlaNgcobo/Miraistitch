import Link from "next/link";

// The SaaS front door. Pure marketing — no database — so it always renders, with or
// without a backend. CTAs lead into the same app: sign in → admin/builder → storefront.
export default function Home() {
  return (
    <>
      <nav className="lp-nav">
        <div className="in">
          <span className="lp-brand">MiraiStitch</span>
          <div className="lk">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login">Sign in</Link>
            <Link className="btn gold" href="/login">Start your store</Link>
          </div>
        </div>
      </nav>

      <header className="lp-hero">
        <span className="lp-eyebrow rise">Ecommerce built for South Africa</span>
        <h1 className="rise">Sell anything online, <em>stitched</em> into one store.</h1>
        <p className="rise">
          Electronics, furniture, fashion, groceries — whatever you sell. An AI store builder,
          local payments with no platform sales fee, and delivery your customers already trust.
        </p>
        <div className="lp-cta rise">
          <Link className="btn gold" href="/login">Start your store</Link>
          <Link className="btn ghost" href="/s/indlela">See a live store</Link>
        </div>
        <p className="lp-foot-note rise">Free to start · Built for ZAR, VAT &amp; POPIA · PayFast, Yoco, Ozow &amp; SnapScan</p>
      </header>

      <section className="lp-strip">
        <div className="in">
          <span style={{ color: "var(--muted)", fontSize: ".86rem", marginRight: 6 }}>Pay-ins &amp; delivery, local by default:</span>
          {["PayFast", "Yoco", "Ozow", "SnapScan", "Pudo", "The Courier Guy", "PAXI"].map((x) => (
            <span className="lp-chip" key={x}>{x}</span>
          ))}
        </div>
      </section>

      <section className="lp-sec" id="features">
        <div className="lp-feats">
          <div className="lp-feat">
            <h3>AI store builder</h3>
            <p>Describe what you sell and get a full storefront — hero, products, the lot — in your voice, in ZAR. Then drag, drop and publish.</p>
          </div>
          <div className="lp-feat">
            <h3>Keep what you earn</h3>
            <p>Local payment gateways built in, with <b>no platform fee</b> on your sales. Your money, in rands, in your account.</p>
          </div>
          <div className="lp-feat">
            <h3>Delivery that fits SA</h3>
            <p>Real courier rates at checkout — Pudo lockers, The Courier Guy, PAXI or collection — plus WhatsApp selling.</p>
          </div>
        </div>
      </section>

      <section className="lp-sec" id="pricing" style={{ paddingTop: 0 }}>
        <h2 style={{ fontSize: "clamp(2rem,4.4vw,2.8rem)", textAlign: "center" }}>Start free. Grow when you do.</h2>
        <p style={{ textAlign: "center", color: "var(--muted)", marginTop: 10 }}>Example pricing — confirmed at launch. No platform fee on sales, ever.</p>
        <div className="lp-plans">
          {[
            { n: "Starter", p: "R0", f: "No platform fee", list: ["One storefront", "Local payments & couriers", "Up to 25 products"], feat: false },
            { n: "Growth", p: "R290", f: "No platform fee", list: ["Unlimited products", "WhatsApp selling", "Your own domain"], feat: true },
            { n: "Pro", p: "R690", f: "Priority support", list: ["Advanced analytics", "Team members", "Marketing integrations"], feat: false },
          ].map((pl) => (
            <div className={`lp-plan${pl.feat ? " feat" : ""}`} key={pl.n}>
              <div style={{ fontFamily: "var(--f-serif)", fontSize: "1.5rem", fontWeight: 600 }}>{pl.n}</div>
              <div style={{ margin: "10px 0 2px" }}><b style={{ fontFamily: "var(--f-serif)", fontSize: "2.4rem" }}>{pl.p}</b><span style={{ color: "var(--muted)" }}>/month</span></div>
              <div style={{ color: "var(--stone)", fontSize: ".88rem" }}>{pl.f}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 22px", display: "flex", flexDirection: "column", gap: 9 }}>
                {pl.list.map((li) => <li key={li} style={{ fontSize: ".93rem" }}>✓ {li}</li>)}
              </ul>
              <Link className={`btn ${pl.feat ? "gold" : "ghost"}`} href="/login" style={{ width: "100%", justifyContent: "center" }}>Choose {pl.n}</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-cta-band">
        <h2>Your brand deserves a shop this good.</h2>
        <p style={{ color: "#ccc2b5", marginTop: 14, fontSize: "1.05rem" }}>Open your MiraiStitch store today and start selling to South Africa by the weekend.</p>
        <div className="lp-cta" style={{ marginTop: 24 }}>
          <Link className="btn gold" href="/login">Start your store</Link>
          <Link className="btn ghost" href="/s/indlela" style={{ borderColor: "#5a5248", color: "var(--paper)" }}>See a live store</Link>
        </div>
      </section>

      <footer className="lp-foot">
        © {new Date().getFullYear()} MiraiStitch · Durban, South Africa · built by Mirai Stack · Prices in ZAR incl. 15% VAT
      </footer>
    </>
  );
}
