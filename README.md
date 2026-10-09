# MiraiStitch

A South African commerce platform — a localised alternative to Shopify, for any product category.
Built as a static, dependency-free frontend prototype: a marketing landing page, a visual
drag-and-drop store builder, a merchant admin, and a live storefront with a ZAR checkout.
Made by [Mirai Stack](https://miraistack.co.za), Durban.

## The platform (at the repo root)

Four connected pages that share state in the browser — design in the builder, it renders in
the store, orders flow back to the admin.

| File | What it is |
|---|---|
| `index.html` | Marketing landing page (hero, bento features, pricing, GSAP motion) |
| `app.html` | Merchant **admin** — dashboard, products, orders, setup guide |
| `builder.html` | Drag-and-drop **store builder** — glassmorphism UI, GSAP interactions |
| `store.html` | Live **storefront** — renders the published layout, cart + checkout |
| `styles.css`, `app.js` | Landing design system + landing motion |
| `SITE.md` | Notes specific to the frontend |

**Routing & data flow**

```
index.html ──▶ app.html ──▶ builder.html ──Publish──▶ store.html
                 ▲                                         │
                 └──────────── orders written back ────────┘
```

Shared browser state: `miraistitch_v1` (products + orders), `miraistitch_layout` (published
design), `miraistitch_cart`. Design system: porcelain + stone-ink + gold, Cormorant +
Hanken Grotesk, a gold "stitch" seam motif. ZAR, 15% VAT, and local payments/couriers
(PayFast, Yoco, Ozow, SnapScan, Pudo, The Courier Guy, PAXI) throughout.

### Run locally
```bash
# from the repo root
npx serve .
# or
python -m http.server 8089
```
Then open http://localhost:8089/. No build step, no dependencies (GSAP loads from a CDN).

### Deploy
Static site — deploys to Vercel / Netlify / GitHub Pages as-is from the repo root.

## Skills (`skills/`)

The Claude Code skills used to build MiraiStitch. Drop a folder into `~/.claude/skills/` to
install it.

Authored for this project:

| Skill | Purpose |
|---|---|
| `skills/seo-optimizer` | Structured SEO audits → prioritised, implementation-ready fixes |
| `skills/lead-generation` | Lead-gen strategy, capture copy, nurture sequences |
| `skills/web-animations` | Tasteful, performant GSAP/CSS motion with accessible defaults |

UI / design / build (as used on this project):

| Skill | Purpose |
|---|---|
| `skills/ui-ux-pro-max` | UI/UX design intelligence — styles, palettes, fonts, charts, stacks (searchable) |
| `skills/baseline-ui` | Fast UI cleanup / polish pass |
| `skills/frontend-design` | Distinctive, intentional visual-design direction |
| `skills/fixing-accessibility` | ARIA, keyboard nav, focus, contrast, WCAG |
| `skills/fixing-motion-performance` | Animation / scroll performance |
| `skills/dataviz` | Charts, graphs, dashboards |
| `skills/artifact-design` | Design fundamentals for claude.ai artifacts |
| `skills/artifact-diagramming` | Diagrams for artifacts (inline-SVG mechanics) |
| `skills/artifact-capabilities` | Runtime capabilities for published artifacts |

### Premium motion websites

The playbook and the libraries behind it. **Start at `premium-motion-site`** — it sequences
everything else into one order of work and enforces the performance gate.

| Skill | Purpose |
|---|---|
| `skills/premium-motion/premium-motion-site` | **The playbook.** Order of work for a high-end motion site: art direction → static structure → one signature interaction → choreography → micro-interactions → performance gate. Encodes the research below. |
| `skills/premium-motion/hyperframes-motion` | 48 atomic motion rules, 22 scene blueprints, 16 transition catalogs, 7 runtime adapters (GSAP, CSS, WAAPI, Three.js, Anime.js, Lottie, TypeGPU) |
| `skills/premium-motion/hyperframes-frames` | 13 complete design systems (locked palette, full type ramp, spacing, signature components) + an 18-token theme contract |
| `skills/premium-motion/web-motion-stack` | 22 web-native skills — smooth scroll, page transitions, ScrollTrigger, Three.js / R3F / Babylon / PixiJS, Rive, Spline, Motion, react-spring, React Bits + Magic UI references, Blender→web pipeline |
| `skills/premium-motion/motion-design-film` | **Video, not web** — HTML + Playwright + ffmpeg → MP4. For when the deliverable is an actual video file. |
| `skills/magic-ui` | **79 animated React components** (Magic UI, MIT) — kinetic text, ambient backgrounds, CTA treatments, device mockups. Ships its own Claude skill; installs per-project via the shadcn registry. |

Also: [`anti-ai-motion.md`](skills/premium-motion/premium-motion-site/references/anti-ai-motion.md) —
the named causes and fixes for machine-made motion. Spring presets, the banned list, "one thing
moves at a time", the silent one-sentence test, the critique loop, and honesty rules for numbers
on screen. Two independent video-practitioner sources agree that bouncy overshoot is the single
clearest tell of AI-made motion.

Provenance: [`HYPERFRAMES-UPSTREAM.md`](skills/premium-motion/HYPERFRAMES-UPSTREAM.md) (Apache-2.0),
[`web-motion-stack/SKILL.md`](skills/premium-motion/web-motion-stack/SKILL.md) (MIT),
[`GIST-motion-stack-setup.md`](skills/premium-motion/GIST-motion-stack-setup.md) (the source gist + verification notes).

Two things worth knowing before using these:

- **HyperFrames is a video renderer**, so its motion recipes assume a paused, seekable,
  deterministic timeline. [`hyperframes-motion/WEB-CONTRACT.md`](skills/premium-motion/hyperframes-motion/WEB-CONTRACT.md)
  translates them for the web — trigger-driven motion, mandatory `prefers-reduced-motion`,
  no content hidden behind JS, no layout shift. **Read it before applying a harvested rule.**
- **The premium toolchain is free** (GSAP including all former Club plugins since April 2025).
  The cost is taste and performance engineering — ~60fps at 4× CPU throttle, LCP < 2.5s,
  INP < 200ms, working reduced-motion. That gate is what separates a premium site from an
  imitation, and it's step 6 of the playbook.

Note: `artifact-design` and `artifact-diagramming` ship with Claude Code as inline skills (no
asset files); their `SKILL.md` here is reconstructed from the skills' own instructions.

## Research (`research/`)

- [`research/MiraiStitch-Research.md`](research/MiraiStitch-Research.md) — how Shopify works, a
  multi-tenant re-engineering design (Postgres + RLS), an AI store-builder design, the
  competitive wedge for South Africa, and a phased plan of action.
- [`research/Claude-Skills-Landscape.md`](research/Claude-Skills-Landscape.md) — survey of the
  most-adopted Claude skills for motion websites and marketing. **Marketing has a decisive winner**
  ([coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills), 53.7k★, 13× the
  nearest rival); **a popular "animated website builder" skill does not exist** — that category tops
  out at 11 stars. The good motion knowledge lives in video repos, the good design knowledge in
  static design skills, and nobody had joined them. Includes what to adopt next, with licences.
- [`research/Premium-Motion-Websites-Research.md`](research/Premium-Motion-Websites-Research.md) —
  what a "$35,000 website" actually is (≈ **R583,600** at R16.675/USD), the US vs South African
  pricing gap, Awwwards judging criteria and the real performance bar, and why the premium
  toolchain being free means the cost is taste and performance engineering. **$35k is ~3× the top
  of the entire SA agency range** — so the positioning is "motion-agency quality at SA prices",
  never the dollar figure.

## Status

Prototype / demo. Pricing figures, the testimonial, and some copy are placeholders. The
checkout is a PayFast-style simulation (no real payment). Next steps toward production:
a real backend (Supabase/Postgres), genuine PayFast integration, and auth.
