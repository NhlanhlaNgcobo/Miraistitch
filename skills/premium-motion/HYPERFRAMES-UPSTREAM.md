# HyperFrames — upstream provenance

`skills/hyperframes-motion/` and `skills/hyperframes-frames/` are a **curated harvest** from the HyperFrames project, not original MiraiStitch work.

| | |
| --- | --- |
| Upstream | https://github.com/heygen-com/hyperframes |
| Pinned commit | `188475aaf2cc94d05a5a641341cab3020c131f16` |
| Commit date | 2026-10-08 |
| Licence | Apache License 2.0 — full text in `HYPERFRAMES-LICENSE.txt` |
| Harvested | 2026-10-08 |

## What HyperFrames actually is

An open-source framework for turning HTML, CSS, media and seekable animations into **deterministic MP4 video**, driven by a CLI and designed for AI coding agents. It is a video renderer. It is **not** a website builder, and nothing here makes MiraiStitch render video.

What was worth taking is the *craft* its skills encode — motion design and visual design knowledge that is good regardless of output medium.

## What was taken

| Destination | From upstream | Contents |
| --- | --- | --- |
| `hyperframes-motion/rules/` | `skills/hyperframes-animation/rules/` | 48 atomic motion recipes |
| `hyperframes-motion/blueprints/` | `skills/hyperframes-animation/blueprints/` | 22 multi-phase scene templates |
| `hyperframes-motion/adapters/` | `skills/hyperframes-animation/adapters/` | 12 runtime guides (GSAP ×4, CSS, WAAPI, Anime.js, Lottie, Three.js, TypeGPU, DOM-in-canvas, animate-text) |
| `hyperframes-motion/transitions/` | `skills/hyperframes-animation/transitions/` | 16 CSS transition catalogs |
| `hyperframes-motion/examples/` | `skills/hyperframes-animation/examples/` | 13 working HTML references |
| `hyperframes-motion/techniques.md`, `rules-index.md`, `blueprints-index.md` | same | indexes + broader technique notes |
| `hyperframes-motion/references/motion-blur.md` | `skills/hyperframes-animation/references/` | shutter smear guidance |
| `hyperframes-motion/references/keyframe-patterns.md` | `skills/hyperframes-keyframes/references/` | seek-safe keyframes, FLIP, SVG morph/draw, paths |
| `hyperframes-frames/presets/` | `skills/hyperframes-creative/frame-presets/` | 13 design systems (`FRAME.md` + showcase; fonts for `code-editorial`) |
| `hyperframes-frames/themes/` | `themes/` | 18-token contract + neutral / bold / editorial packs |

Roughly 2 MB and ~170 files, copied byte-for-byte.

## What was deliberately left behind

- **`packages/`** (~600 MB) — the renderer, CLI, studio server and test fixtures. Irrelevant to building websites.
- **`docs/`, `registry/`** (~130 MB) — hosted docs site and the composition catalog.
- **Video-workflow skills** — `embedded-captions`, `music-to-video`, `talking-head-recut`, `pr-to-video`, `product-launch-video`, `faceless-explainer`, `motion-graphics`, `slideshow`, `general-video`, `remotion-to-hyperframes`, `media-use`, `hyperframes-cli`, `hyperframes-core`, `hyperframes-studio`, `hyperframes-registry`, `hyperframes-audio`, `figma`.
- **`scripts/animation-map.mjs`** — audits a composition's choreography, but requires the HyperFrames runtime package.
- **`caption-skin.html`** files were copied with the presets but are video-caption styling; ignore them.

### Why not a submodule

The full repo is ~750 MB with Git LFS, and **its checkout fails on Windows** — Windows `MAX_PATH` limits killed ~70 files during the harvest clone (deep `docs/public/catalog/.../assets/fonts/` and `packages/studio-server/src/history/__fixtures__/` paths), and 67 LFS pointers failed to resolve. A submodule would reproduce that failure for anyone cloning MiraiStitch recursively.

## Local modifications

The harvested corpus is **unmodified**. Two new files were written for MiraiStitch, and they are the actual adaptation layer:

- **`hyperframes-motion/WEB-CONTRACT.md`** — the video→web translation. Upstream assumes a paused, seekable, deterministic timeline; the web is trigger-driven and must honour `prefers-reduced-motion`, avoid layout shift, never hide content behind JS, and pause off-screen work. It lists which upstream constraints to drop outright and which to keep.
- **`hyperframes-motion/SKILL.md`** and **`hyperframes-frames/SKILL.md`** — web-oriented routers, plus the `cqw`→`clamp()` type translation and WCAG contrast caveats the upstream specs don't need (they were tuned for large video type at 3:1; web body copy needs 4.5:1).

**Read `WEB-CONTRACT.md` before applying any harvested rule.** Applied verbatim, these recipes produce motion that is deterministic and seek-safe but inaccessible and occasionally content-hiding.

## Updating

```bash
# in a short path to survive Windows MAX_PATH, e.g. C:\hf
git clone --filter=blob:none --no-checkout https://github.com/heygen-com/hyperframes.git C:\hf
cd C:\hf
git sparse-checkout init --cone
git sparse-checkout set skills/hyperframes-animation skills/hyperframes-keyframes skills/hyperframes-creative/frame-presets themes
git checkout main
```

Then re-copy the directories in the table above, re-pin the commit here, and re-check `WEB-CONTRACT.md` against any new upstream rules. `GIT_LFS_SKIP_SMUDGE=1` avoids pulling LFS blobs the harvest doesn't use.

## Attribution

Apache-2.0 requires retaining the licence, the copyright notice, and a statement of changes. `HYPERFRAMES-LICENSE.txt` holds the licence; this file is the notice and the statement of changes. Upstream ships no `NOTICE` file, so none is reproduced. If MiraiStitch is redistributed, both files must travel with it.

HyperFrames is a HeyGen project. Its own `CREDITS.md` acknowledges [Remotion](https://www.remotion.dev) as prior art in browser-based video rendering.
