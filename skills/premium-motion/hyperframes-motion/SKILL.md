---
name: hyperframes-motion
description: "Motion and animation craft for websites — 48 atomic motion rules, 22 multi-phase scene blueprints, 16 scene-transition catalogs, and 7 runtime adapters (GSAP default, plus CSS keyframes, WAAPI, Three.js, Anime.js, Lottie, TypeGPU). Use for any web motion task: hero reveals, scroll-driven sections, hover/press feedback, stat counters, SVG draw, page transitions, 3D scenes, or auditing existing motion. Harvested from HyperFrames (a video renderer) and re-contracted for the web: trigger-driven instead of seek-driven, reduced-motion mandatory."
---

# HyperFrames Motion — web edition

A motion library harvested from [HyperFrames](https://github.com/heygen-com/hyperframes), an HTML→MP4 video renderer. The **craft** in `rules/`, `blueprints/`, `adapters/` and `transitions/` is runtime-agnostic and world-class: easing choices, duration and stagger ranges, transform-only discipline, and strong opinions about what reads cheap.

**The upstream contract is not.** Those docs were written for a deterministic video renderer that seeks a paused timeline frame by frame. Websites play motion forward in response to user intent. Read `WEB-CONTRACT.md` before authoring — it maps every upstream rule onto the web, and lists exactly which upstream constraints to drop.

## Read first

| Step | Do |
| --- | --- |
| 1 | `WEB-CONTRACT.md` — the video→web translation. Non-negotiable on web: reduced-motion, trigger binding, no CLS. |
| 2 | `rules-index.md` — pick **2–4 atomic rules** and compose. This is the default path and produces less code than a blueprint. |
| 3 | A blueprint only when the section genuinely needs 4–5 phase orchestration (`blueprints-index.md`). |

## Routing

| Want to… | Read |
| --- | --- |
| Translate upstream video rules to web motion | `WEB-CONTRACT.md` |
| Pick an atomic motion pattern by trigger / tag | `rules-index.md` → `rules/<name>.md` |
| Multi-phase section choreography | `blueprints-index.md` → `blueprints/<id>.md` |
| Section-to-section / page transitions (CSS-driven) | `transitions/overview.md`, `transitions/catalog.md` |
| Broader motion-design technique | `techniques.md` |
| Seek-safe keyframe authoring, FLIP, SVG morph/draw, path motion | `references/keyframe-patterns.md` |
| Shutter smear, and when not to use it | `references/motion-blur.md` |
| GSAP — timelines, position params | `adapters/gsap.md` |
| GSAP — eases / stagger (incl. spring eases) | `adapters/gsap-easing-and-stagger.md` |
| GSAP — timeline / labels | `adapters/gsap-timeline-and-labels.md` |
| GSAP — transforms / perf | `adapters/gsap-transforms-and-perf.md` |
| GSAP — drop-in effect recipes | `rules/gsap-effects.md` |
| CSS keyframes | `adapters/css-animations.md` |
| Web Animations API (`element.animate()`) | `adapters/waapi.md` |
| Anime.js | `adapters/animejs.md` |
| Lottie / dotLottie (After Effects, characters) | `adapters/lottie.md` |
| Three.js / WebGL (3D, camera, shaders) | `adapters/three.md` |
| TypeGPU / WebGPU (particles, custom shaders) | `adapters/typegpu.md` |
| DOM-as-texture + GLSL post-fx | `adapters/html-in-canvas-patterns.md` |
| Ground-truth source for complex choreography (13 files) | `examples/` — see note below |

## Picking a runtime

- **CSS** first for websites — entrances, hovers, shimmer, decoration. Zero JS cost, interruptible, composited. Most of a marketing page needs nothing else.
- **GSAP** when you need sequencing, scroll-scrubbing (ScrollTrigger), or stagger across many elements. The atomic rules are written in GSAP.
- **WAAPI** for native keyframes with no dependency — a good middle ground when you want JS control without shipping GSAP.
- **Anime.js** for lightweight tweening when GSAP is overkill.
- **Lottie** when the asset carries its own baked timeline (After Effects exports, mascots).
- **Three.js** for 3D scenes, camera motion, shader visuals. Gate it behind reduced-motion and a WebGL check, and lazy-load it.
- **TypeGPU / WebGPU** for GPU canvases. Always feature-detect `navigator.gpu` and ship a static fallback.

Budget check before adding a runtime: GSAP core is ~25 KB gzipped, Three.js ~150 KB+, Lottie ~60 KB+. A hero fade does not justify any of them.

## About `examples/`

The 13 files in `examples/` are **video compositions, not web demos.** Each builds `gsap.timeline({ paused: true })`, registers it on `window.__timelines["main"]`, and never calls `.play()` — the renderer was meant to seek it. Opened in a browser they show a frozen first frame.

They load GSAP 3.14.2 from jsdelivr, so you can watch any of them by opening the file and running this in the console:

```js
window.__timelines.main.play();   // or .seek(2.4) to jump to a moment
```

Read them for **choreography** — how phases overlap, how stagger is distributed, how a 5-second sequence is apportioned. Do not copy one into a website wholesale: strip `data-duration` / `class="clip"`, bind the timeline to a trigger, and add a reduced-motion path (`WEB-CONTRACT.md` §1–4).

## Craft rules that survive the port intact

These are the transferable opinions — they are about taste, not about rendering:

- **Smooth beats bouncy.** `power3.out` / `expo.out` settle cleanly. `back.out` overshoot is the single most common tell of machine-made motion — reserve it for explicitly playful brands, and cap overshoot at ~2.
- **Transforms and paint only** — `transform` and `opacity` composite on the GPU. Animating `width`/`height`/`top`/`left` triggers layout on every frame; use `scale`/`translate`, masks, or a FLIP technique instead.
- **A group arrives as one beat** — `items × stagger ≤ ~0.5s`. Past ~9 items the stagger stops reading; switch to a wipe or sweep.
- **The subject lands fast** — in video, by t ≤ 0.5s. On web the equivalent is stricter: content must be *readable before* motion resolves (see `WEB-CONTRACT.md` → No hidden content).
- **Let the ease do the settle** — never hand-key a `scale: 1.1` mid-state against an easing curve; it double-bounces.
- **Hint the compositor** with `will-change: transform` only while many tweens run, and remove it after. Permanent `will-change` wastes GPU memory.

## See also

- `../hyperframes-frames/` — the 13 design systems (palette, type ramp, components) these motions dress
- `../../web-animations/` — existing MiraiStitch animation skill, incl. GSAP presets
- `../../ui-ux-pro-max/` — motion data in `data/motion.csv`, React perf in `data/react-performance.csv`
- `../../fixing-motion-performance/` — diagnosing jank in an existing page
- `../HYPERFRAMES-UPSTREAM.md` — provenance, pinned commit, license
