# MiraiStitch

A South African commerce platform — a localised, maker-focused alternative to Shopify.
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

Note: `artifact-design` and `artifact-diagramming` ship with Claude Code as inline skills (no
asset files); their `SKILL.md` here is reconstructed from the skills' own instructions.

## Status

Prototype / demo. Pricing figures, the testimonial, and some copy are placeholders. The
checkout is a PayFast-style simulation (no real payment). Next steps toward production:
a real backend (Supabase/Postgres), genuine PayFast integration, and auth.
