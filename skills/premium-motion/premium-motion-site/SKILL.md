---
name: premium-motion-site
description: "The build playbook for premium, high-end motion websites — the kind that read as a R584,000 / $35k agency build. Use for any request to make a site feel expensive, premium, high-end, award-winning, engaging, or 'motion-agency'; for hero sections with signature interactions; for scroll-driven narrative pages; or when a site looks generic and needs art direction and choreography. Sequences every motion and design skill in this repo into one order of work, and enforces the performance gate (60fps at 4x CPU throttle, reduced-motion, Core Web Vitals) that separates a premium site from a cheap imitation."
---

# Premium motion site — the playbook

This is the **router and order of work**, not another motion reference. The craft lives in `../hyperframes-motion/`, `../hyperframes-frames/` and `../web-motion-stack/`. This file decides what to do first, what to skip, and what to measure before calling it done.

Grounded in [`research/Premium-Motion-Websites-Research.md`](../../../research/Premium-Motion-Websites-Research.md) — read that for the pricing and judging evidence behind every rule here.

## The one thing to internalise

**The premium toolchain is free. The cost is taste and performance engineering.**

GSAP — including every former Club plugin (ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, DrawSVG, MotionPath, Flip) — has been free for all commercial use since 29 April 2025. React Bits and Magic UI are free. Three.js is free.

So a site does not read as expensive because of what it imports. It reads as expensive because of three things, and **missing any one of them caps the result**:

1. **Art direction** — a point of view. Every type choice, colour and grid serves one idea.
2. **Directed motion** — choreography, not decoration. Transitions carry meaning.
3. **Performance** — ~60fps on mid-range Android, verified under **4× CPU throttle**.

The third is the one that is actually hard, and the one cheap imitations fail. Treat it as a gate, not a polish pass.

---

## Order of work

Do these in order. Motion before art direction produces expensive-looking nonsense; motion before structure produces animation you have to rip out.

### 1 — Commit to a point of view (before any code)

Pick a design system and commit. Do not blend two, and do not start from "clean and modern" — that is the absence of a decision, and it is what generic sites are made of.

→ **`../hyperframes-frames/`** — 13 pre-committed systems. Open two or three `frame-showcase.html` files, match to the content's register, then port tokens per that skill's `cqw`→`clamp()` guidance.
→ `../../frontend-design/` if the brand needs an original direction instead of a preset.
→ `../../ui-ux-pro-max/` — `data/typography.csv`, `data/colors.csv`, `data/google-fonts.csv` for substitutions.

**Output before moving on:** a token block (palette, type ramp, spacing, radii) and one sentence naming the single idea.

### 2 — Structure and content, fully static

Build every section as semantic HTML that is complete and readable with **zero** motion and **zero** JavaScript. This is not a formality — it is the foundation of the no-hidden-content rule, and retrofitting it is painful.

Premium sites are typically **5–8 well-choreographed sections, not 40 pages.** Scope down before adding motion.

→ `../../baseline-ui/` for layout and spacing discipline
→ `../../seo-optimizer/` — structure and metadata now, not after the motion

**Gate:** disable JS entirely. Every word readable, every link reachable, nothing invisible.

### 3 — Choose the signature interaction (exactly one)

A premium site has **one** thing people remember. Not six. Choosing six is the most common way an ambitious build reads as cheap and noisy.

Candidates, cheapest-to-most-expensive:

| Signature | Cost | Where |
| --- | --- | --- |
| Smooth scroll with weighted easing | Low — biggest perceived-quality win available | `../web-motion-stack/locomotive-scroll/` (or Lenis) |
| Type-in-motion — letters stretch, snap, recombine on scroll | Low–medium | GSAP SplitText; `../hyperframes-motion/rules/` text section |
| Section transitions that read as camera moves | Medium | `../hyperframes-motion/transitions/`, `../web-motion-stack/barba-js/` |
| Scrollytelling — scroll position paces a narrative | Medium | `../web-motion-stack/gsap-scrolltrigger/` |
| Spotlight 3D — work treated as spotlit installations | High | `../web-motion-stack/lightweight-3d-effects/` |
| Full WebGL hero with custom shaders | Highest — **the single biggest cost lever** | `../web-motion-stack/threejs-webgl/`, `react-three-fiber/` |

Start at the top of that table. **Smooth scroll plus one well-executed text treatment outperforms a janky WebGL hero every time** — and the juror is explicit that a 3D hero dropping to 18fps will not win.

### 4 — Choreograph the sections

Now apply the motion library. Default to composing **2–4 atomic rules** per section; reach for a blueprint only when a section genuinely needs 4–5 phase orchestration.

→ **`../hyperframes-motion/WEB-CONTRACT.md` first** — the rules were written for a video renderer; this translates them (triggers instead of seek, reduced-motion, no CLS).
→ `../hyperframes-motion/rules-index.md` → 48 atomic recipes
→ `../hyperframes-motion/blueprints-index.md` → 22 multi-phase templates
→ `../hyperframes-motion/examples/` → ground-truth choreography (note: these are paused video compositions, see that skill's note)
→ `../../web-animations/` → existing GSAP/CSS presets

**Rhythm rules that carry over from film and matter here:**
- A group arrives as **one beat** — `items × stagger ≤ ~0.5s`. Past ~9 items the stagger stops reading; switch to a wipe.
- **Smooth beats bouncy.** `power3.out` / `expo.out`. `back.out` overshoot is the most common tell of machine-made motion.
- Let the ease produce the settle; never hand-key a `scale: 1.1` mid-state against the curve.
- Interaction feedback is **much faster** than entrance motion — hover 120–200ms, press 80–120ms, entrance 400–700ms.

### 5 — Micro-interactions that reward attention

The layer that makes a site feel built rather than assembled: cursor states, magnetic buttons, hover depth, state transitions with real easing.

→ `../web-motion-stack/motion-framer/`, `react-spring-physics/` (spring physics for React)
→ `../web-motion-stack/animated-component-libraries/` — React Bits + Magic UI **API references**
→ `../hyperframes-motion/rules/press-release-spring.md`, `physics-press-reaction.md` (shorten upstream durations)

**Never animate focus.** Keyboard users need it instantly, and it must never be suppressed.

### 6 — The performance gate (non-negotiable)

This is where premium is won or lost. Do not skip it, and do not accept "it's smooth on my machine."

```
DevTools → Performance → CPU: 4× slowdown, Network: Fast 3G
```

| Must hold | Target |
| --- | --- |
| Frame rate, mid-range Android | **~60fps** |
| LCP | **< 2.5s** |
| INP | **< 200ms** |
| CLS attributable to motion | **0** |
| `prefers-reduced-motion: reduce` | End states land, no large motion, site fully usable |
| JS disabled | All content readable |

Fix order when it fails: cut the heaviest effect → lazy-load the runtime → reduce concurrent tweens → only then micro-optimise.

→ `../hyperframes-motion/WEB-CONTRACT.md` §6 (budget) and §9 (ship checklist)
→ `../../fixing-motion-performance/` for diagnosing an existing page
→ `../../fixing-accessibility/` for contrast, focus, reduced-motion verification

### 7 — Final audit

→ `../../fixing-accessibility/` — contrast (body copy **4.5:1**; preset palettes were tuned for large video type at 3:1, so re-check every pair you ship)
→ `../../seo-optimizer/` — the motion must not have broken crawlability
→ `../../dataviz/` if the site carries charts — they must share the committed palette

---

## What makes it read as cheap

Ranked by how often it happens:

1. **No point of view.** Default fonts, default grays, a blue button. No amount of motion rescues this — fix step 1.
2. **Motion as decoration.** Everything fades up on scroll, uniformly, forever. Reads as a template with a plugin. Choreography means *different* sections move *differently*, for reasons.
3. **Bouncy overshoot everywhere.** `back.out` on every entrance is the single clearest machine-made tell.
4. **A janky signature.** A 3D hero at 18fps is worse than no 3D hero. The juror says it outright.
5. **Six signatures instead of one.** Noise reads as cheap, not rich.
6. **Content hidden until JS runs.** `opacity: 0` in CSS, revealed by a tween — one failed CDN request and the page is blank.
7. **Layout shift from entrances.** Animating `height`/`margin`/`top` on load. Transform within reserved space instead.
8. **No reduced-motion path.** A required gate, not a nicety, and jurors check it.
9. **Desktop-only thinking.** The performance bar is mid-range Android, not a MacBook.

## Engagement, honestly

"Engaging" does not mean more motion. The patterns that actually hold attention:

- **Motion that signals where you are** — progress through a narrative, sections that hand off to each other. Orientation, not ornament.
- **Interactions that reward curiosity** — something that responds to a hover the user didn't have to make. Small, discoverable, never required.
- **Pacing** — moments of stillness make the motion read. A page where everything moves has no emphasis left to spend.
- **Response under 100ms** on anything the user initiates. Perceived performance *is* perceived quality.

Decorative motion that delays content is the opposite of engaging. If a visitor must wait for an animation to read a sentence, that animation is a cost.

## Positioning note (MiraiStitch-specific)

$35,000 ≈ **R583,600**, which is roughly **3× the top of the entire South African agency range** (R15,000–200,000+). A typical SA professional business site is R12,000–30,000 — about 2–5% of that figure.

So **never quote the dollar figure to a South African merchant** — it is meaningless locally. The craft on this page is deliverable far below the headline number, and the honest framing is **"motion-agency quality at South African prices."** See the research doc §3 for the full market table.

## Skill map

| Need | Skill |
| --- | --- |
| Committed visual direction | `../hyperframes-frames/` (13 systems + 18-token theme contract) |
| Original visual direction | `../../frontend-design/` |
| Design intelligence, fonts, palettes, stacks | `../../ui-ux-pro-max/` |
| Motion rules, blueprints, transitions | `../hyperframes-motion/` (**read `WEB-CONTRACT.md` first**) |
| Scroll, page transitions, 3D, React motion | `../web-motion-stack/` (22 skills) |
| GSAP/CSS presets | `../../web-animations/` |
| Layout polish | `../../baseline-ui/` |
| Charts | `../../dataviz/` |
| Performance diagnosis | `../../fixing-motion-performance/` |
| Accessibility, contrast, focus | `../../fixing-accessibility/` |
| Crawlability, metadata | `../../seo-optimizer/` |
| Conversion copy, capture | `../../lead-generation/` |

## Stack, when a framework is in play

Award winners converge on **Next.js + GSAP + Three.js/WebGL**, often with a headless CMS.

```bash
npm install gsap motion        # GSAP: all plugins free since Apr 2025
```

React Bits and Magic UI are copy-paste — nothing to install. **React Bits is Commons Clause:** build commercial products with it freely, but never redistribute the components themselves (so don't vendor them into this repo).

MiraiStitch's own pages are static, dependency-free HTML with GSAP from a CDN — that stack is entirely capable of everything in step 3 up to and including lightweight 3D. Don't add a framework for motion alone.
