# Premium motion websites

Everything needed to build a high-end, motion-led website — the visual tier that reads as a
R584,000 ($35,000) agency build. Added 8 October 2026.

**Start here → [`premium-motion-site/SKILL.md`](premium-motion-site/SKILL.md)**

That's the playbook. It sequences the other three skills into one order of work and enforces the
performance gate. The rest are reference libraries you pull from as the playbook directs.

## What's in this folder

| | What it is | Size |
|---|---|---|
| [`premium-motion-site/`](premium-motion-site/SKILL.md) | **The playbook.** 7-step order of work: point of view → static structure → one signature interaction → choreography → micro-interactions → performance gate → audit. Plus the "what makes it read as cheap" list. | 1 file |
| [`hyperframes-motion/`](hyperframes-motion/SKILL.md) | Motion craft — 48 atomic rules, 22 scene blueprints, 16 transition catalogs, 12 runtime adapter guides, 13 reference compositions | 118 files |
| [`hyperframes-frames/`](hyperframes-frames/SKILL.md) | 13 complete design systems (locked palette, full type ramp, spacing, signature components) + an 18-token theme contract and 3 theme packs | 53 files |
| [`web-motion-stack/`](web-motion-stack/SKILL.md) | 22 web-native skills — smooth scroll, page transitions, ScrollTrigger, Three.js / R3F / Babylon / PlayCanvas / PixiJS / A-Frame, Rive, Spline, Lottie, Anime.js, Motion, react-spring, React Bits + Magic UI references, Blender→web pipeline | 199 files |
| [`motion-site-prompts/`](motion-site-prompts/SKILL.md) | **Reusable on any project.** Turns a brief into a complete buildable spec for an animated marketing site — 10-slot scaffold, 10 category playbooks, animated-background recipes. | 3 files |
| [`motion-design-film/`](motion-design-film/SKILL.md) | **Video, not web.** HTML + Playwright + ffmpeg → MP4. Keep for when the deliverable is an actual video file. Its transferable craft is already extracted into the playbook. | 18 files |

Don't miss: **[`premium-motion-site/references/anti-ai-motion.md`](premium-motion-site/references/anti-ai-motion.md)** — the named causes and fixes for machine-made motion (spring presets, the banned list, "one thing moves at a time", the silent one-sentence test, the critique loop, honesty rules). Consolidated from two independent video-practitioner sources.

Research behind it: [`research/Premium-Motion-Websites-Research.md`](../../research/Premium-Motion-Websites-Research.md)

## The two things to know before using any of it

**1. `hyperframes-motion` came from a video renderer.** Its rules assume a paused, seekable,
deterministic timeline — because HyperFrames renders HTML to MP4 frame by frame. Websites are
trigger-driven. [`hyperframes-motion/WEB-CONTRACT.md`](hyperframes-motion/WEB-CONTRACT.md) is the
translation: which upstream constraints to drop, which to keep, and the web-only rules video never
needed (reduced-motion, no content hidden behind JS, no layout shift, off-screen pausing).
**Read it before applying any harvested rule.**

**2. The premium toolchain is free — the cost is taste and performance engineering.** GSAP,
including every former Club plugin (ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, DrawSVG,
MotionPath, Flip), has been free for all commercial use since 29 April 2025. React Bits, Magic UI
and Three.js are free. So nothing here is gated on budget. What separates a premium site from an
imitation is the gate in step 6 of the playbook:

```
DevTools → Performance → CPU: 4× slowdown, Network: Fast 3G
~60fps on mid-range Android · LCP < 2.5s · INP < 200ms · CLS 0
prefers-reduced-motion: reduce → end states land, site fully usable
JS disabled → all content readable
```

Those are an Awwwards juror's actual criteria, not invented targets.

## Division of labour

The two motion libraries overlap on GSAP, Three.js, Anime.js and Lottie. They aren't
contradictory — they have different centres of gravity:

> **`hyperframes-motion` for *what the motion should be*. `web-motion-stack` for *how to wire it
> to the web*.**

Scroll binding, pinning, scrub, page transitions and the React ecosystem exist only in
`web-motion-stack`, because a video renderer has no scroll position, no navigation, no hover and
no React. Where the two conflict on a contract, `WEB-CONTRACT.md` wins — it's the only document
written specifically for web constraints.

## Provenance and licensing

| Source | Licence | Pinned | Notes |
|---|---|---|---|
| [HyperFrames](https://github.com/heygen-com/hyperframes) | Apache-2.0 | `188475a` | `hyperframes-motion` + `hyperframes-frames`. See [`HYPERFRAMES-UPSTREAM.md`](HYPERFRAMES-UPSTREAM.md) and [`HYPERFRAMES-LICENSE.txt`](HYPERFRAMES-LICENSE.txt) |
| [ClaudeDesignSkills](https://github.com/freshtechbro/ClaudeDesignSkills) | MIT | `1da73fe` | `web-motion-stack` (22 of 23 skills). Licence in [`web-motion-stack/UPSTREAM-LICENSE.txt`](web-motion-stack/UPSTREAM-LICENSE.txt) |
| [claude-motion-design](https://github.com/howseen-ai/claude-motion-design) | MIT | `3d90d34` | `motion-design-film` + the craft in `anti-ai-motion.md`. Excludes a 4.18 MB preview GIF and the Howseen trademark. © 2026 Howseen AI (Raphaël Aubry) |
| [Motion-stack gist](https://gist.github.com/conradcaffier03/a0c6bbca47b7fae91f69fc998721e9b7) | — | `b5c7f0f` | The pointer that led here. Verbatim + verification notes in [`GIST-motion-stack-setup.md`](GIST-motion-stack-setup.md) |

Harvested corpora are **unmodified**. The original work in this folder is
`premium-motion-site/SKILL.md`, `hyperframes-motion/WEB-CONTRACT.md`, the four `SKILL.md` routers,
the provenance docs, and this README.

**One licence trap worth repeating:** React Bits is **Commons Clause**, not MIT. Build commercial
products with it freely, but never redistribute the components themselves. `web-motion-stack/
animated-component-libraries/` documents its *API* only — no implementations — which is why it's
safe to ship here. Keep it that way.

## Known issues

- `web-motion-stack/gsap-scrolltrigger/assets/examples/README.md` has two links pointing at
  `../references/` that should be `../../references/`. That's a pre-existing upstream typo, left
  as-is to keep the harvest byte-for-byte. Both target files exist one level up.
- `web-motion-stack` upstream was last updated 20 November 2025. Its architectural guidance ages
  well; verify version numbers and API details against current docs, especially for Motion and
  React Three Fiber.
- `hyperframes-motion/examples/*.html` are paused video compositions — they open as a frozen
  frame. Run `window.__timelines.main.play()` in the console to watch one.
- `motion-design-film/UPSTREAM-README.md` references an `examples/howseen-launch/` directory that
  wasn't harvested (4.18 MB preview GIF + the Howseen trademark). A note at the top of that file
  explains it; clone upstream directly to run the example.
- **Two of the four harvested repos are video tools, not website tools** — `hyperframes-*` and
  `motion-design-film`. Their craft transfers; their pipelines don't. The translations live in
  `hyperframes-motion/WEB-CONTRACT.md` and
  `premium-motion-site/references/anti-ai-motion.md`. Read those before mining either source.
