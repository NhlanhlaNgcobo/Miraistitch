# Category playbooks

Section order, the signature that suits, motion notes, and the specific trap. Use with the 10-slot scaffold in `../SKILL.md`.

Every entry assumes the non-negotiables from `../../premium-motion-site/SKILL.md`: one accent, one signature, reduced-motion handled, 60fps at 4× CPU.

---

## Hero / standalone section

**Sections** — just the one. Eyebrow · headline · sub · two CTAs · one visual.

**Signature** — a single kinetic type treatment. Mask-rise per word (`translateY 105%` inside `overflow:hidden`, 45ms stagger) is the most reliable; it reads as craft and costs nothing.

**Motion** — everything resolves inside ~1.2s. The headline must be readable before the animation finishes, not after.

**Trap** — trying to do five things in 600px of viewport. A hero has one job: make the next scroll happen.

→ `../../hyperframes-motion/rules/` text section · `blueprints/titlecard-reveal.md`

---

## SaaS / product

**Sections** — hero with product · logo wall · problem → solution · feature trio · how it works (3 steps) · proof/metrics · pricing · FAQ · CTA.

**Signature** — the product interface assembling itself: panels snapping in, a cursor completing one real task, a number landing. Shows the thing instead of describing it.

**Motion** — scroll-pinned step sequences work well here (`ScrollTrigger` + `scrub`). Counters should count *to a real number* and stop.

**Trap** — a screenshot carousel. Nobody advances them. One product moment, animated, beats six static frames.

→ `../../hyperframes-motion/blueprints/panel-edit-live-sync.md`, `prompt-type-submit-generate.md`, `dataviz-countup.md`

---

## Agency / studio

**Sections** — bold statement hero · selected work grid · services · process · team · contact.

**Signature** — the work grid. A confident hover (image scale 1.06 over 600ms, title shift, cursor change) and a clean click-through transition carries the whole page.

**Motion** — this is the one category where a page-transition library earns its weight; the portfolio-to-detail handoff is the product.

**Trap** — style with no proof. An agency site that animates beautifully and shows no outcomes reads as a student project.

→ `../../web-motion-stack/barba-js/` · `../../hyperframes-motion/blueprints/grid-card-assemble.md`

---

## Portfolio

**Sections** — name + what you do (immediately) · selected work · about · contact.

**Signature** — one project-open transition, executed perfectly — the thumbnail becoming the detail (FLIP / shared element).

**Motion** — restraint reads as confidence. A portfolio with one impeccable transition beats one with twelve effects.

**Trap** — a different effect per project. It reads as "I learned these tutorials", not "I have a point of view".

→ `../../hyperframes-motion/references/keyframe-patterns.md` (FLIP) · `rules/card-morph-anchor.md`

---

## Ecommerce

**Sections** — hero/campaign · category tiles · bestsellers · trust strip (payment, delivery, returns) · reviews · newsletter.

**Signature** — the product itself: a 360° spin, a colour configurator, a fabric/finish swap. Motion that answers a buying question.

**Motion** — fast and functional. Hover 120–200ms, add-to-cart feedback under 100ms.

**Trap** — motion that delays purchase. Never animate the path to Add to cart; an entrance on the buy button is a conversion bug, not a flourish.

**Also** — product photography is the design. No amount of motion rescues bad or placeholder imagery.

---

## 3D / immersive

**Sections** — fewer than you think. 3–5, with the scene carrying continuity.

**Signature** — the scene *is* the page: camera moves between sections rather than sections replacing each other.

**Motion** — camera keyed in log space for zoom; never zoom in and out back to back.

**Trap** — 18fps on a mid-range Android. An Awwwards juror's words: *"a 3D hero that drops to 18fps will not win."* Budget before you build — Three.js is ~150 KB before your scene. Always feature-detect, lazy-load, and ship a static fallback.

→ `../../web-motion-stack/lightweight-3d-effects/` first, `threejs-webgl/` only if that is genuinely not enough · `web3d-integration-patterns/`

---

## Fintech

**Sections** — hero with a clear claim · trust/regulation · how it works · security · pricing/fees · calculator · CTA.

**Signature** — numbers that count up and reconcile: a balance, a fee saved, a transfer settling.

**Motion** — tight, precise, slightly understated. Tabular numerals, no bounce anywhere.

**Trap** — looking playful. Trust is the product; springy motion undermines it faster than any copy can rebuild it. Also: never invent a figure. Cite or omit.

→ `../../hyperframes-motion/rules/counting-dynamic-scale.md`, `stat-bars-and-fills.md` · `../../dataviz/`

---

## AI / tech

**Sections** — hero with a live demo · what it does · how it works · model/accuracy proof · integrations · pricing · CTA.

**Signature** — a working demonstration. A prompt typing and producing a real result beats any illustration of intelligence.

**Trap** — abstract neural-network particles and glowing orbs. It is the single most generic visual language on the web right now and signals that there is nothing concrete to show.

→ `../../hyperframes-motion/blueprints/prompt-type-submit-generate.md`

---

## Travel / hospitality

**Sections** — full-bleed hero · destinations · experience · rooms/itineraries · gallery · booking.

**Signature** — imagery with weighted parallax, or a horizontal destination rail.

**Motion** — slower than a SaaS page. Long easing, generous durations.

**Trap** — parallax on every layer at once. Pick one depth relationship; three competing speeds read as broken rather than deep.

---

## Wellness / lifestyle

**Sections** — calm hero · philosophy · offering · practitioner/story · testimonials · booking.

**Signature** — breathing motion: something that scales 1 → 1.02 over 4s, or a slow gradient drift.

**Motion** — the slowest register on this list. Durations 800ms+, generous whitespace, no sharp easing.

**Trap** — borrowing SaaS pacing. Urgency is the opposite of the product.

---

## Carousel / rail (a component, not a page)

**When** — more items than fit, and order does not matter much.

**Motion** — scroll-driven horizontal movement (pinned + `scrub`) reads as premium; auto-advancing slides do not, and get ignored.

**Trap** — auto-advance with dots. It takes control away from the reader and is skipped. If it must auto-advance, pause on hover and on focus, and never loop faster than 6s.

**Accessibility** — a rail must be keyboard-reachable and must not trap focus. A pinned horizontal section needs a non-scroll way through it.
