---
name: web-motion-stack
description: "22 web-native motion and 3D skills — smooth scroll, page transitions, ScrollTrigger, Three.js / React Three Fiber / Babylon / PlayCanvas / PixiJS / A-Frame, Rive, Spline, Lottie, Anime.js, Motion (framer-motion), react-spring, plus React Bits and Magic UI component references and a Blender→web asset pipeline. Use when a site needs smooth scrolling, scroll-driven narrative, animated page transitions, 3D or WebGL, interactive runtime assets, or React animation libraries. Covers the web-native layer that hyperframes-motion structurally cannot, because that library came from a video renderer with no scroll and no page navigation."
---

# Web motion stack

22 skills covering the **web-native** motion layer. Each subdirectory is a self-contained, installable skill (`SKILL.md` + `references/` + usually `scripts/` and a starter template) — copy one into `~/.claude/skills/` to install it on its own.

## Why this exists alongside `hyperframes-motion`

`../hyperframes-motion/` is a superb motion library, but it was harvested from a **video renderer**. A video has no scroll position, no page navigation, no hover, and no React. So three whole categories were structurally absent — and they happen to be the ones that make a website feel expensive:

- **Smooth scroll** — the single most recognisable "premium" tell
- **Page / route transitions**
- **Scroll-driven narrative (scrollytelling)**

This stack fills exactly those gaps, plus the React animation ecosystem and the broader 3D engines.

## Before you install anything — check what the browser now does for free

This harvest predates some of the platform. Verified 9 Oct 2026:

- **Scroll reveals, progress bars, simple parallax** → native CSS `animation-timeline: view()`. Chrome 115+, Safari 26+. **Firefox is still `preview`** (not stable, ~82% global), so ship it as progressive enhancement or behind `@supports`. Off the main thread, cannot jank, zero bytes.
- **Page transitions on a static multi-page site** → `@view-transition { navigation: auto }`. Two lines. Chrome 126+, Safari 18.2+, Firefox skips it silently.
- **Tooltips / popovers positioned against a trigger** → CSS anchor positioning, Baseline since January 2026.

GSAP ScrollTrigger is still correct for pinning, scrubbing and coordinated sequences — roughly the hard 20%. It is the easy 80% that no longer needs a library.

→ Full detail, support tables and the version-drift list: [`../premium-motion-site/references/platform-currency.md`](../premium-motion-site/references/platform-currency.md)

**Three API-specific warnings for this harvest** (upstream last updated 20 Nov 2025):
`animejs/` documents **v3; v4 rewrote the API** · `motion-framer/` is behind **Motion v14** · `react-three-fiber/` is behind **R3F 9 / Three 0.186**. Verify any snippet from those three against current docs.

## Routing

### Scroll — start here for premium feel

| Skill | Use for |
| --- | --- |
| `locomotive-scroll/` | Smooth scroll with weighted easing, parallax. The highest perceived-quality-per-effort win available. (Lenis is the current lighter alternative — same concepts.) |
| `gsap-scrolltrigger/` | Scroll-driven timelines, pinning, scrubbing, scrollytelling. **The workhorse.** |
| `scroll-reveal-libraries/` | Lightweight entrance-on-scroll when you don't need GSAP |

### Page transitions

| Skill | Use for |
| --- | --- |
| `barba-js/` | Animated page-to-page transitions without a SPA framework — fits MiraiStitch's multi-page static setup |

### React motion

| Skill | Use for |
| --- | --- |
| `motion-framer/` | Motion (formerly framer-motion) — layout animations, gestures, variants |
| `react-spring-physics/` | Spring-physics animation for React |
| `animated-component-libraries/` | **React Bits** (~48.7k ★) and **Magic UI** (~22.5k ★) component references — props and usage |

### 3D and WebGL — the biggest cost lever

| Skill | Use for |
| --- | --- |
| `lightweight-3d-effects/` | 3D feel without a full engine. **Try this before Three.js.** |
| `threejs-webgl/` | Three.js — scenes, cameras, shaders, the award-winner default |
| `react-three-fiber/` | Three.js declaratively in React |
| `babylonjs-engine/` | Babylon.js — heavier, game-oriented |
| `playcanvas-engine/` | PlayCanvas — engine + hosted editor |
| `pixijs-2d/` | PixiJS — fast 2D WebGL, particles, filters |
| `aframe-webxr/` | WebXR / VR scenes |
| `web3d-integration-patterns/` | How to embed 3D in a page without wrecking performance. **Read before shipping any 3D.** |

### Interactive and authored assets

| Skill | Use for |
| --- | --- |
| `rive-interactive/` | Rive — state-machine-driven interactive animation. Excellent for buttons, mascots, toggles. |
| `spline-interactive/` | Spline — 3D scenes from a visual editor |
| `lottie-animations/` | Lottie / dotLottie — After Effects exports |
| `animejs/` | Anime.js — lightweight tweening |

### Asset pipeline

| Skill | Use for |
| --- | --- |
| `blender-web-pipeline/` | Blender → glTF, draco compression, web-ready export |
| `substance-3d-texturing/` | PBR texturing for web 3D |

### Meta

| Skill | Use for |
| --- | --- |
| `modern-web-design/` | Coordination layer — Core Web Vitals targets (LCP < 2.5s, INP < 200ms), fluid type, OKLCH colour, scrollytelling, cursor UX, glassmorphism, and when to use each sibling skill |

## Overlaps with `hyperframes-motion` — which to trust

Four skills overlap. They are not contradictory, but they have different centres of gravity:

| Topic | Prefer `hyperframes-motion` for | Prefer this stack for |
| --- | --- | --- |
| GSAP | Easing taste, stagger ranges, timeline craft, 48 atomic recipes | **ScrollTrigger** — scroll binding, pinning, scrub (absent upstream) |
| Three.js | Camera-move choreography | Scene setup, loaders, materials, perf patterns |
| Anime.js / Lottie | Choreographing them inside a sequence | API surface, player setup |

Rule of thumb: **`hyperframes-motion` for *what the motion should be*, this stack for *how to wire it to the web*.**

Where they conflict on a contract, `../hyperframes-motion/WEB-CONTRACT.md` wins — it is the only document here written specifically for MiraiStitch's web constraints.

## Before you ship any of this

Everything in this stack can wreck performance, and the premium bar is strict (~60fps at 4× CPU throttle, LCP < 2.5s, INP < 200ms, functional reduced-motion). The 3D engines in particular must be lazy-loaded, feature-detected, paused off-screen, and given a static fallback.

→ `../premium-motion-site/SKILL.md` — the build sequence and the performance gate
→ `../hyperframes-motion/WEB-CONTRACT.md` §4 (reduced motion), §6 (budget), §9 (checklist)

## Provenance

Harvested from **[ClaudeDesignSkills](https://github.com/freshtechbro/ClaudeDesignSkills)** by freshtechbro.

| | |
| --- | --- |
| Pinned commit | `1da73febff0c3e1dfefc07f8a5ef8f7d1dfdb6cd` |
| Licence | MIT — full text in `UPSTREAM-LICENSE.txt` |
| Harvested | 8 October 2026 |
| Taken | 22 of 23 skills, byte-for-byte (199 files, 2.47 MB) |
| Omitted | `skill-creator` — meta-tooling, not design work |

Upstream ships the same 23 skills duplicated four times (`.claude/`, `.factory/`, `plugins/bundles/`, `plugins/individual/`) for different installers; only the `.claude/` copy was taken.

**Note on licensing:** `animated-component-libraries/references/react_bits_components.md` documents React Bits' **API** (props, usage) — it contains no component implementations, which matters because React Bits is **Commons Clause**: commercial use is permitted, but redistributing the components themselves is not. Keep it that way — reference React Bits components, never vendor their source into this repo. Magic UI is MIT.

**Caveat:** upstream was last updated 20 November 2025 and has ~1k stars, so treat version numbers and API details as needing a check against current docs — especially for fast-moving libraries (Motion, R3F). The architectural guidance ages far better than the API specifics.

Reached MiraiStitch via [this gist](https://gist.github.com/conradcaffier03/a0c6bbca47b7fae91f69fc998721e9b7) by [@buildwith.conrad](https://instagram.com/buildwith.conrad) — see `GIST-motion-stack-setup.md` in `skills/`.
