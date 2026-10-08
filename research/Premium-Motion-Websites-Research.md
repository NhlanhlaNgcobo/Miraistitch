# What a "$35,000 website" actually is

Research for MiraiStitch, 8 October 2026. Commissioned to ground the motion-site skills in what the premium tier genuinely delivers, rather than in marketing copy.

---

## 1. The number, in rands

| | |
| --- | --- |
| USD/ZAR on 8 Oct 2026 | **16.675** (up 0.39% on the session; rand weakened 4.0% over the month) |
| $35,000 | **≈ R583,600** |
| Dec 2026 forecast rate | 16.209 → ≈ R567,300 |

So the headline figure is **a little under R600,000**.

## 2. The finding that matters most

**$35,000 is a market position, not a technical specification.** Three independent pricing sources put the technical work well below it:

| Tier (practitioner pricing) | Price | Scope |
| --- | --- | --- |
| Template / DIY | $500–3k | Pre-built effects, Webflow/Framer customisation |
| Custom landing page | $3k–5k | One bespoke page, custom design, GSAP scroll reveals |
| Brand / marketing site | $5k–8k | 5–8 templates, headless CMS, GSAP timelines, page transitions |
| **Award-level / WebGL flagship** | **$8k+** | Bespoke design, Three.js/WebGL, custom shaders, full choreography |

A WebGL hero effect is $2k–4k; a fully interactive 3D experience $8k+. Meanwhile generic agency surveys place $35k in the *small-business marketing website* bracket — 5–15 pages, CMS, SEO setup, contact form, delivered by a 2–10 person shop at $70–120/hour.

The reconciling fact: **agencies cost 2–4× a freelance creative developer for equivalent build quality.** Motion-graphics work with identical documented scope was quoted anywhere from $2,500 to $150,000+, median ~$43,000.

So $35k buys award-level *craft* plus agency overhead — strategy, account management, content production, revisions, warranty. The craft itself starts around $8k.

**Implication for MiraiStitch:** the visual and motion signature of a R584,000 website is reproducible at a fraction of the cost. What is *not* cheap is the performance engineering (§4) — that part is irreducible skilled labour, and it is where most cheap imitations fail.

## 3. The South African reality — this is the important divergence

The SA market does not have a $35k tier.

| SA pricing (2026) | Rands | ≈ USD |
| --- | --- | --- |
| Landing page | R1,990 | $119 |
| Starter (1–3 pages) | R3,490 | $209 |
| Small business (5–9 pages) | R5,590–15,000 | $335–900 |
| Corporate / enterprise (12–20 pages) | R16,900–40,000 | $1,013–2,399 |
| E-commerce | R7,580–20,000 | $455–1,199 |
| Custom platforms | R18,000–100,000+ | $1,080–6,000+ |
| **Agency project range (full)** | **R15,000–200,000+** | **$900–12,000+** |
| Agency hourly | R800–2,500 | $48–150 |

**$35,000 (R584k) is roughly 3× the top of the entire South African agency range.** A typical SA professional business site is R12,000–30,000 — about **2–5% of the $35k figure**.

Two consequences:

1. **Nobody in South Africa is buying a R584,000 marketing site.** Pitching MiraiStitch's output as "a $35k website" to a local maker is meaningless at best.
2. **That is precisely the opportunity.** If the motion craft can be delivered at R20k–60k, MiraiStitch's merchants get a visual tier that currently has no local supply, at a price the local market actually pays. The gap between SA ceiling (R200k) and the premium signature (~$8k ≈ R133k of craft) is the wedge — and it is narrower than the headline $35k suggests.

Positioning language should be **"motion-agency quality at SA prices"**, never a dollar figure.

## 4. What actually earns the premium — judging criteria

From a working Awwwards juror, the three non-negotiables. Missing any one caps a site in the mid-7s on the scoring rubric:

### Art direction
> "A point of view. Award-winners aren't decorated templates; every type choice, color, and layout grid serves a single idea."

This is the cheapest of the three to achieve and the most commonly skipped. It is also exactly what `skills/premium-motion/hyperframes-frames/` supplies — 13 pre-committed points of view.

### Directed motion
> "Not 'animation for its own sake' — choreography. Transitions that carry meaning, scroll sequences that pace a story, and micro-interactions that reward attention."

### Performance — the real gate
- **~60fps on mid-range Android.** "A 3D hero that drops to 18fps will not win."
- Jurors test under **CPU 4× slowdown + Fast 3G** in DevTools.
- Core Web Vitals: **LCP < 2.5s, INP < 200ms**.
- **Functional reduced-motion fallbacks are required**, not optional polish.

This is the part money actually buys. Achieving 60fps WebGL *while* holding Core Web Vitals on mid-range devices is described as "skilled, time-consuming work" — and it is the single thing that separates a premium site from a cheap imitation of one.

## 5. The technical signature

Patterns that recur across winners:

| Pattern | Notes |
| --- | --- |
| **Smooth scroll with weighted easing** | The single most recognisable "expensive" tell. Lenis / Locomotive. |
| **Transitions as camera moves** | Section changes read as a camera travelling, not elements fading. |
| **Scrollytelling** | Scroll position drives narrative; content reveals pace a story. |
| **Type-in-motion** | "Letters that stretch, snap, and recombine on scroll." GSAP SplitText. |
| **Spotlight 3D** | Projects treated as "spotlit installations" rather than cards. |
| **Micro-interactions that reward attention** | Cursor states, magnetic buttons, hover depth. |
| **Bold typography + dark themes** | Current dominant aesthetic. |

Stack consistently used by winners: **Next.js + GSAP + Three.js/WebGL**, often with a headless CMS.

Cost drivers, ranked: **WebGL/3D is the biggest lever**, then motion choreography ("design engineering" time), then performance optimisation, then CMS/API integration.

## 6. Where the money is *not*

Worth stating plainly, because it shapes what to build:

- Not in the animation library — **GSAP including every former Club plugin (ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, DrawSVG, MotionPath, Flip) has been free for all commercial use since 29 April 2025**, after Webflow acquired GreenSock in October 2024. The toolkit behind most award-winning sites now costs R0.
- Not in components — React Bits (~48.7k ★) and Magic UI (~22.5k ★) are free copy-paste libraries.
- Not in volume — winners are typically 5–8 well-choreographed templates, not 40 pages.

The entire premium toolchain is free. **The cost is taste and performance engineering.**

## 7. What this means for the skills

| Research finding | Skill that answers it |
| --- | --- |
| Art direction / committed point of view | `hyperframes-frames` (13 design systems) |
| Directed motion, choreography | `hyperframes-motion` (48 rules, 22 blueprints) |
| Smooth scroll, page transitions, scrollytelling | `web-motion-stack` (locomotive-scroll, barba-js, gsap-scrolltrigger) |
| 3D / WebGL — the biggest cost lever | `web-motion-stack` (threejs-webgl, react-three-fiber, lightweight-3d-effects) |
| 60fps @ 4× CPU throttle | `hyperframes-motion/WEB-CONTRACT.md` §6, `fixing-motion-performance` |
| Reduced-motion as a gate, not polish | `hyperframes-motion/WEB-CONTRACT.md` §4, `fixing-accessibility` |
| Sequencing all of it into a build | **`premium-motion-site`** (the playbook) |

The performance bar the juror describes — 4× CPU throttle, 60fps mid-range Android, reduced-motion required — is already the acceptance criteria written into `WEB-CONTRACT.md` §6 and §9. That was arrived at independently; the research confirms it.

---

## Sources

- [Web Design Pricing Guide 2026 — rates from 600+ project quotes](https://projectcostestimator.com/blog/web-design-pricing-guide-2026)
- [Web Design Pricing Guide 2026: What Agencies & Freelancers Actually Charge](https://pitchsite.io/guides/web-design-pricing)
- [How Much Agencies Charge for Website Design: True Costs](https://keomarketing.com/how-much-agencies-charge-website-design/)
- [How Much Does an Animated Website Cost? 2026 Pricing](https://www.hontran.dev/blog/animated-website-cost) — practitioner tiers, cost drivers
- [10 Best Award-Winning Websites of 2026 (Judged by a Juror)](https://www.hontran.dev/blog/best-award-winning-websites-2026) — judging criteria, performance methodology
- [10 Best Motion Graphics Design Agencies (2026) — Bricx Labs](https://bricxlabs.com/ux-agencies/best-motion-graphics-design-agencies) — $43k median
- [Awwwards agency/studio directory](https://www.awwwards.com/directory/agency-studio/) · [Best GSAP sites](https://www.awwwards.com/websites/gsap/) · [Best motion sites](https://www.awwwards.com/websites/motion/)
- [Top Web Design Trends for 2026 — Figma](https://www.figma.com/resource-library/web-design-trends/)
- [Top 10 Web Design Trends 2026](https://reallygooddesigns.com/web-design-trends-2026/)
- [How Much Does Web Design Cost in South Africa (2026)? — HostAfrica](https://hostafrica.co.za/blog/websites/web-design/how-much-does-web-design-cost-in-south-africa/)
- [Website Design Prices in South Africa: Full 2026 Breakdown — Juicy Designs](https://www.juicydesigns.co.za/blog/website-design-prices-south-africa/)
- [Website Design Cost South Africa 2026: R3K–R200K Real Pricing — Printulu](https://printing.printulu.co.za/blog/website-design-south-africa-2026/)
- [Website Design Prices in South Africa — 2026 Agency Survey — SME Rocket](https://www.smerocket.co.za/website-design-prices-in-south-africa/)
- [South African Rand — Trading Economics](https://tradingeconomics.com/south-africa/currency) · [USD/ZAR forecast](https://www.exchangerates.org.uk/currency-forecasts/us-dollar-to-rand-forecast)
- [GSAP is Now Completely Free, Even for Commercial Use — CSS-Tricks](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/)
- [Is GSAP Free? Yes, Since April 2025](https://motionkit.io/blog/gsap-is-free-what-it-means-for-wordpress)
