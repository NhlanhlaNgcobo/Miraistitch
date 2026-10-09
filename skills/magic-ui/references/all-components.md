# Magic UI — complete component index

All **79** components in the registry at commit `cdb348c`, grouped by job.

This file is a MiraiStitch addition. Upstream's `components.md` lists about twenty
of these as a selection guide; this is the full set, so you can tell at a glance
whether something already exists before building it yourself.

Install any of them with:

```bash
npx shadcn@latest add @magicui/<slug>
```

---

## Text motion (16)

`animated-gradient-text` · `animated-shiny-text` · `aurora-text` · `comic-text`
`dia-text-reveal` · `hyper-text` · `kinetic-text` · `line-shadow-text`
`morphing-text` · `sparkles-text` · `spinning-text` · `text-3d-flip`
`text-animate` · `text-reveal` · `typing-animation` · `word-rotate`

The deepest family by far, and the one most worth reaching for — kinetic type is
the cheapest premium signal there is. `text-animate` is the general-purpose one;
the rest are specific effects.

## Backgrounds and ambient (14)

`animated-grid-pattern` · `dot-pattern` · `flickering-grid` · `floating-3d-particles`
`grid-pattern` · `hexagon-pattern` · `interactive-grid-pattern` · `light-rays`
`meteors` · `noise-texture` · `particles` · `retro-grid` · `ripple` · `striped-pattern`
`warp-background`

Cross-check against [`../../premium-motion/motion-site-prompts/references/backgrounds.md`](../../premium-motion/motion-site-prompts/references/backgrounds.md)
before using one: a background that competes with the headline has failed, and
several of these are easy to over-apply.

## Buttons and CTA (6)

`animated-subscribe-button` · `interactive-hover-button` · `pulsating-button`
`rainbow-button` · `ripple-button` · `shimmer-button` · `shiny-button`

Keep one CTA treatment per page. `rainbow-button` conflicts with the one-accent
rule in `anti-ai-motion.md` — use it only if multi-hue genuinely is the brand.

## Cards and surfaces (6)

`bento-grid` · `border-beam` · `glare-hover` · `magic-card` · `neon-gradient-card`
`shine-border`

## Device and product mockups (6)

`android` · `iphone` · `safari` · `hero-video-dialog` · `lens` · `pixel-image`

Genuinely useful for SaaS and ecommerce — a real screenshot in a device frame
beats an illustration, and `lens` gives product zoom for free.

## Data and numbers (6)

`animated-circular-progress-bar` · `animated-list` · `number-ticker`
`scroll-progress` · `dotted-map` · `icon-cloud`

`number-ticker` is the one fintech and SaaS pages reach for. Pair it with the
honesty rule: count to a **real** figure.

## Developer / technical content (5)

`code-comparison` · `file-tree` · `terminal` · `tweet-card` · `client-tweet-card`

`terminal` and `code-comparison` are strong for dev-tool landing pages where the
product *is* the code.

## Motion and interaction (9)

`animated-beam` · `confetti` · `cool-mode` · `dock` · `highlighter` · `orbiting-circles`
`pointer` · `progressive-blur` · `scroll-based-velocity` · `smooth-cursor`

`animated-beam` (connecting two nodes) is the signature "how it works" diagram
component. `smooth-cursor` and `pointer` override the cursor — see the note below.

## Media and 3D (4)

`globe` · `video-text` · `backlight` · `blur-fade`

`globe` needs `cobe`; it is the most-used "we are global" visual and therefore
also one of the most generic. `blur-fade` is the general entrance wrapper and is
probably the single most useful component in the library.

## Theme (2)

`animated-theme-toggler` · `glyph-matrix`

---

## Notes before you use these

**Stack requirement.** Everything here is React + Tailwind + shadcn. That fits the
MiraiStitch Next.js app in [`app/`](../../../app). It does **not** fit the static
pages at the repo root (`index.html`, `store.html`, `builder.html`), which are
vanilla HTML with GSAP from `vendor/`. Porting a component there means rewriting
it, not installing it.

**Cursor components conflict with this project.** `smooth-cursor` and `pointer`
both take over the cursor. The MiraiStitch landing already uses a needle cursor
as its brand signature — do not stack them.

**One background, one signature.** The registry makes it very easy to put four
animated backgrounds and three text effects on one page. The playbook in
[`../../premium-motion/premium-motion-site/SKILL.md`](../../premium-motion/premium-motion-site/SKILL.md)
allows exactly one signature interaction, and upstream's own skill agrees:
*"avoid stacking many high-motion effects in one viewport."*

**Check the dependency before installing.** Several components pull extra
packages (`cobe` for `globe`, `motion` for others) or require global CSS
keyframes. The component's docs page lists them.
