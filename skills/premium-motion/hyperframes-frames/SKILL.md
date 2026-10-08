---
name: hyperframes-frames
description: "13 complete, opinionated design systems for websites — each with a locked palette, a full typographic ramp, spacing scale, and signature components. Use when a site needs a distinctive visual direction rather than generic defaults: pick a preset, port its tokens to CSS custom properties, and build against it. Also carries the 18-token theme contract and three ready theme packs (neutral, bold, editorial). Harvested from HyperFrames and re-contracted for the web."
---

# HyperFrames Frames — web design systems

13 fully-specified design systems. Each is a *committed* visual direction — not a theme switcher, not a palette generator. The value is that someone made all the hard decisions coherently: which single accent colour, which serif against which grotesque, what the display ramp does at 10vw, which two components are the signature.

Use one when a site would otherwise land on the default "Inter + neutral grays + blue button" look.

## The presets

Grouped by register. Palette and families are the actual atoms from each `FRAME.md` — the parts declared "sacred", i.e. not yours to modify.

**Editorial / paper — restrained, type-led, no shadows**

| Preset | Ground + accent | Faces | Signature |
| --- | --- | --- | --- |
| `cobalt-grid` | cream `#F0EBDE` · electric cobalt `#1F2BE0` (the only ink) | Newsreader 400 + Hanken Grotesk + DM Mono | permanent graph-paper grid, top/bottom cobalt hairlines, pixel-glitch + QR blocks |
| `code-editorial` | cream `#FAF9F5` · terracotta coral `#CC785C`, scarce | EB Garamond + Inter + JetBrains Mono | hairline ink elevation, warm-navy code surface. **Ships self-hosted fonts.** |
| `editorial-forest` | green `#2E4A2A` + pink `#E89CB1` + cream `#EFE7D4` triad | Source Serif 4 @500 (optical size) + JetBrains Mono | flat paper depth, 2px rules, monogram circle stamp |
| `cartesian` | five-tone warm stone `#EDE8E0` · taupe `#8A8178` | Playfair Display 400 + Inter | 1px taupe hairline as the *only* structural device, compass-drafted rings, zero fill |
| `blue-professional` | cream `#FDFAE7` · one saturated cobalt `#1E2BFA` | Space Grotesk (display/numerals) + Inter (body) | cobalt-tinted cards at 4% fill / 20% border, no shadows, pill chrome |

**Poster / graphic — loud, high-contrast, display-dominant**

| Preset | Ground + accent | Faces | Signature |
| --- | --- | --- | --- |
| `broadside` | ink-black `#111111` · fire-orange `#E85D26` | Barlow 900 **lowercase** as graphic primitive + IBM Plex Mono | two-register dark surface, flat plane, 1px hairlines |
| `coral` | coral fire `#E85D5D` / ink `#1A1A1A` / cream `#F5F0E8` | Bebas Neue uppercase tracked + Inter | 45° diagonal hatch, wallpaper numerals, hard colour-region splits, zero radius |
| `bold-poster` | white · brown-black `#1C1410` · tomato red `#D8000F` | Shrikhand (tilted) + Libre Baskerville + Space Grotesk | stacked text-shadow on red display, 3px+1.5px double border |
| `biennale-yellow` | parchment `#E9E5DB` · deep indigo ink `#1B2566` · solar yellow `#F1EE2E` | Instrument Serif + Archivo + JetBrains Mono | yellow as bloom/panel/tile underprint, hairlines only, atmospheric depth — no shadows |

**Neo-brutalist / playful — hard offset shadows, thick outlines, candy palettes**

| Preset | Ground + accent | Faces | Signature |
| --- | --- | --- | --- |
| `blockframe` | black/white/off-white + five pastels (pink `#FE90E8`, blue, green, yellow, cream) | Inter 800–900 uppercase + Space Grotesk | 4px black borders, 8px hard offset shadows, square corners, label-pills, star bursts |
| `creative-mode` | cream `#EFE9D9` · ink `#0F0F0F` + four accents (green `#1F8A4C`, pink `#F06CA8`…) | Archivo Black uppercase @0.92 lh + Space Grotesk + JetBrains Mono | 4px ink borders, hard offset shadows, no blur |
| `capsule` | cream `#F5F5F0` + nine-colour candy (coral, lime, lavender…) | Bodoni Moda + Space Grotesk | pill geometry (9999px / 2rem), 2px ink outline on everything, floating decorative pills |
| `daisy-days` | cream + sunny pastels (turquoise, pink, butter, mint, lavender, peach) | Fredoka + Quicksand | charcoal 3px outlines, 6/4px hard offset shadows, generous radii, dot bullets |

Each lives at `presets/<name>/`:

- **`FRAME.md`** — the spec: `colors`, `typography` (full ramp with family / size / weight / line-height / tracking), `spacing`, `components`. This is the file you read.
- **`frame-showcase.html`** — the system rendered, so you can see it before committing.
- **`fonts/`** — only `code-editorial` ships fonts (9 files: EB Garamond, Inter, JetBrains Mono woff2 + OFL licences). Every other preset names Google Fonts families you must load yourself — see `../../ui-ux-pro-max/data/google-fonts.csv`.
- **`caption-skin.html`** — video-caption styling. **Ignore for web work.**

> **One gap to know about.** Every `FRAME.md` opens "Video-first companion to X's `design.md`" — upstream keeps a separate web-oriented `design.md` for each system, and **those are not in the repo** (they live in the hosted catalog). What you have is the complete atom set — palette, type ramp, spacing, components — which is the part you need. What's missing is upstream's web *composition* guidance, so the layout translation in the next section is yours to do.

## Porting a FRAME.md to the web

`FRAME.md` is YAML written for a fixed 1920×1080 video frame. Three things need translating:

### 1. `cqw` / `cqmin` units → fluid web type

Upstream sizes are container-query units against a known frame (`cqw: 4.6` means 4.6% of frame width). On web, a viewport can be 320px or 2560px, so a raw port either explodes or vanishes.

```css
/* Upstream:  headline: { fontFamily: "Newsreader", cqw: 4.6, lineHeight: 0.95 } */
/* 4.6cqw at 1920px = ~88px. Clamp it with a sane floor and a fluid middle: */
--font-headline: clamp(2.25rem, 4.6vw, 5.5rem);

h1 {
  font-family: Newsreader, Georgia, serif;
  font-size: var(--font-headline);
  line-height: 0.95;              /* keep upstream exactly */
  letter-spacing: -0.008em;       /* keep upstream exactly */
}
```

Keep `lineHeight`, `weight`, `tracking`, `italic` and `upper` **verbatim** — those are the tuned parts and are resolution-independent. Only the *size* needs clamping. `cqw`/`cqmin` do work natively on web, but only inside an element with `container-type: inline-size` — fine for a card component, wrong for page-level type.

### 2. Palette → CSS custom properties, with contrast checked

Copy `colors` straight into `:root`. Then **verify contrast** — these palettes were tuned for large video type, where 3:1 is acceptable. Body text on the web needs **4.5:1** (WCAG AA), and 3:1 for large text and UI borders.

```css
:root {
  --paper: #f0ebde;
  --ink: #1f2be0;
  --ink-soft: #5560e5;
  --grid: rgba(31, 43, 224, 0.1);
}
```

`cobalt-grid`'s `ink-soft` (#5560E5) on `paper` (#F0EBDE) is roughly 4.2:1 — fine for headings, **short of AA for body copy**. Use full `ink` for paragraphs. Check every pair you actually ship; don't assume.

### 3. Frame composition → responsive layout

`spacing.edge: 4cqw` is a frame inset. On web that becomes a container with a max-width and fluid padding, and the preset's composition rules need a mobile answer the upstream spec never had to give:

```css
.frame { max-width: 90rem; margin-inline: auto; padding-inline: clamp(1rem, 4vw, 5rem); }
```

Signature components usually survive well — `cobalt-grid`'s graph-paper ground is a `background-image` gradient that works at any size, and its two cobalt hairlines are plain borders. Decorative chrome positioned by frame percentage (page numbers, corner marks) should be dropped or re-anchored on small screens.

## The theme contract (`themes/`)

A smaller, interchangeable alternative to a full preset: an 18-token contract with three ready packs — `neutral.css`, `bold.css`, `editorial.css`. Read `themes/CONTRACT.md` for the full token list.

| Group | Tokens |
| --- | --- |
| Palette | `--bg` `--fg` `--muted` `--surface` `--border` `--brand` `--accent` `--accent-2` |
| Type | `--font-display` `--font-body` `--font-mono` |
| Shape / spacing | `--radius` `--space-1` `--space-2` `--space-3` |
| Motion | `--dur-beat` `--ease-standard` `--ease-emphasis` |

Use this when the site needs **swappable** theming (light/dark, multi-tenant brands). Use a full preset when it needs one strong committed look.

Two web adjustments: the packs express `--radius` and spacing in `cqmin`, which resolves to `0` outside a container-query context — convert to `rem`, or set `container-type: inline-size` on the wrapper. And consume tokens with a fallback at point of use (`var(--fg, #111318)`) exactly as the contract says, so a missing pack degrades instead of disappearing.

The `--dur-beat` / `--ease-*` motion tokens are the handoff point to `../hyperframes-motion/` — same values, same vocabulary.

## Choosing, honestly

Do not pick by name. Open `frame-showcase.html` for two or three candidates, then match to the **content's register**: enterprise SaaS and `daisy-days` will fight each other no matter how well you execute it. If the client has existing brand colours, a preset's structure (type ramp, spacing, components) still ports cleanly even when you replace its palette — but replacing the palette of a preset whose whole identity *is* the colour (`biennale-yellow`, `coral`, `cobalt-grid`) leaves you with very little.

## See also

- `../hyperframes-motion/` — the motion library; `WEB-CONTRACT.md` there covers reduced-motion and triggers
- `../../ui-ux-pro-max/` — `data/typography.csv`, `data/colors.csv`, `data/google-fonts.csv` for substituting families
- `../../frontend-design/`, `../../baseline-ui/` — existing MiraiStitch design skills
- `../../dataviz/references/palette.md` — chart palettes that must coexist with these
- `../../fixing-accessibility/` — contrast and focus auditing
- `../HYPERFRAMES-UPSTREAM.md` — provenance, pinned commit, license
