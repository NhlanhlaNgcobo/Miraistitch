---
name: motion-site-prompts
description: "Build animated marketing sites from a structured brief — hero sections, landing pages, SaaS, agency, portfolio, 3D, fintech, ecommerce, wellness, travel. Use when asked for a motion-led site or section for ANY project (not just MiraiStitch), when someone wants a 'motionsites-style' animated page, or when a brief needs turning into a complete, buildable spec. Produces a full prompt covering layout, type, palette, motion, dependencies and responsive behaviour — grounded in this repo's motion rules rather than generic AI-site boilerplate."
---

# Motion site prompts

A prompt scaffold and category playbook for building animated marketing sites. Reusable across projects — nothing here is MiraiStitch-specific.

Inspired by the format of **[motionsites.ai](https://motionsites.ai)**, a paid library (~364 prompts, 159 animated backgrounds, 40 templates as of July 2026; free tier then $149/yr or $239 once) of copy-paste prompts for Lovable, Bolt, Cursor and Claude. Worth browsing as a **gallery** — seeing fifty animated heroes side by side is the fastest way to calibrate what a category looks like.

**Nothing from it is reproduced here.** Their prompts are the paid product. This skill is the same *shape* — a structured brief that produces a complete buildable spec — written from scratch and wired into the craft already in this repo.

## Why not just use a generic prompt library

Copy-paste prompt libraries produce the look and skip the engineering. They rarely specify reduced-motion behaviour, never mention the frame budget, and tend toward the exact tells that mark a page as machine-made. This repo already holds the corrective:

| Need | Already here |
| --- | --- |
| What the motion should be | [`../hyperframes-motion/`](../hyperframes-motion/SKILL.md) — 48 rules, 22 blueprints |
| How to wire it to the web | [`../web-motion-stack/`](../web-motion-stack/SKILL.md) — scroll, transitions, 3D, React |
| A committed visual direction | [`../hyperframes-frames/`](../hyperframes-frames/SKILL.md) — 13 design systems |
| What makes it read as cheap | [`../premium-motion-site/references/anti-ai-motion.md`](../premium-motion-site/references/anti-ai-motion.md) |
| The order of work + perf gate | [`../premium-motion-site/SKILL.md`](../premium-motion-site/SKILL.md) |

So: **use this skill to turn a brief into a spec. Use those to actually build it well.**

## The scaffold

Fill every slot. An unfilled slot is where generic output comes from — "modern and clean" is the absence of a decision, and it produces the absence of a design.

```
1  WHAT          one sentence: what this page is and who it is for
2  REFERENCE     a NAMED style — "Linear launch", "Stripe docs", "Apple bumper".
                 Never "premium modern". A named reference is checkable.
3  SECTIONS      5–8, in order, each with its one job
4  ART DIRECTION palette (ONE accent), type pairing + scale, spacing, radius,
                 light/dark. Pick a preset from hyperframes-frames or commit to
                 your own.
5  SIGNATURE     exactly ONE memorable interaction. Not six.
6  MOTION        per section: trigger, what moves, duration, easing.
                 Default power3.out. Never back.out overshoot.
7  CONTENT       real copy, or explicitly labelled Example data. No lorem ipsum.
8  STACK         framework, motion libs, and the weight budget you accept
9  CONSTRAINTS   reduced-motion, no-JS, CLS 0, LCP < 2.5s, 60fps @ 4x CPU
10 OUT OF SCOPE  what NOT to build — the most skipped and most useful slot
```

### Worked example

> **WHAT** — Landing page for a B2B payroll API, for CTOs evaluating vendors.
> **REFERENCE** — Stripe docs: dense, technical, confident; whitespace as hierarchy not decoration.
> **SECTIONS** — hero (claim + live code sample) · logos · how it works (3 steps, scroll-pinned) · code/API proof · pricing · FAQ · CTA.
> **ART DIRECTION** — near-black `#0B0C0E`, off-white text, ONE electric blue accent `#2D5BFF`. Inter + JetBrains Mono. 8px grid, 10px radius. Dark only.
> **SIGNATURE** — the code sample in the hero types itself once, then stays selectable and copyable. Real code, runs.
> **MOTION** — hero: text mask-rise, 0.6s, power3.out, 45ms word stagger, on load. Steps: pinned scroll-scrub, `ease:none`. Everything else: 400ms fade+16px rise on enter, once. Hover 150ms.
> **CONTENT** — real API endpoints and real latency numbers from the docs; pricing real; no testimonials until we have some.
> **STACK** — Next.js + GSAP/ScrollTrigger + Lenis. ~90 KB JS budget. No 3D.
> **CONSTRAINTS** — reduced-motion lands end states; readable with JS off; CLS 0; LCP < 2.5s; 60fps at 4× CPU.
> **OUT OF SCOPE** — no particles, no gradient mesh, no auto-playing video, no cookie-banner animation.

That brief is buildable by anyone. "Make me a modern animated SaaS landing page" is not.

## Categories

Each has a different centre of gravity. Full playbooks — section order, the signature that suits, the trap to avoid — in [`references/categories.md`](references/categories.md).

| Category | Signature that usually fits | The trap |
| --- | --- | --- |
| **Hero / section** | One kinetic type treatment | Doing five things in 600px |
| **SaaS / product** | Product UI that assembles itself | Screenshot carousel nobody scrolls |
| **Agency / studio** | Work grid with a confident hover | Style over any actual proof |
| **Portfolio** | One project transition done perfectly | A different effect per project |
| **Ecommerce** | Product that rotates or configures | Motion that delays Add to cart |
| **3D / immersive** | The scene *is* the page | 18fps on a mid-range Android |
| **Fintech** | Numbers that count and reconcile | Looking playful; trust is the product |
| **AI / tech** | A live demo of the actual thing | Abstract neural-network particles |
| **Travel** | Imagery with weighted parallax | Parallax on every single layer |
| **Wellness** | Slow, breathing, generous space | Pace borrowed from a SaaS page |

## Animated backgrounds

The other half of a motion site. Recipes that are cheap, tasteful and implementable — plus which to avoid — in [`references/backgrounds.md`](references/backgrounds.md).

Rule of thumb that saves most of the grief: **a background is a background.** If it competes with the headline it has failed, however impressive it is in isolation. Keep it under 10% contrast against its own ground, pause it off-screen, and kill it under reduced-motion.

## Before you hand the spec over

- [ ] Every one of the 10 slots filled — especially **out of scope**
- [ ] Exactly one signature interaction
- [ ] A named reference, not an adjective
- [ ] One accent colour
- [ ] Reduced-motion and no-JS behaviour stated, not assumed
- [ ] A weight budget in KB, not "lightweight"
- [ ] Content is real or labelled as example

Then build it through [`../premium-motion-site/SKILL.md`](../premium-motion-site/SKILL.md) — brief, then order of work, then the performance gate.
