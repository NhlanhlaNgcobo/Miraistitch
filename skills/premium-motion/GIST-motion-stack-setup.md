# The $35K Motion Site Stack for Claude Code — 5 repos + setup

The exact stack that makes Claude Code build premium motion websites — scroll animations, page transitions, landing pages that feel expensive.

## The 5 repos

| # | Repo | What it gives Claude |
|---|------|----------------------|
| 1 | [GSAP](https://github.com/greensock/GSAP) | The animation engine behind most award-winning sites (26k+ ⭐, now 100% free incl. all plugins) |
| 2 | [React Bits](https://github.com/DavidHDev/react-bits) | 130+ animated, interactive React components — copy-paste ready (43k+ ⭐) |
| 3 | [Magic UI](https://github.com/magicuidesign/magicui) | 150+ animated components & effects for design engineers (21k+ ⭐) |
| 4 | [Motion](https://github.com/motiondivision/motion) | Spring-physics animation for React & vanilla JS — the modern framer-motion (32k+ ⭐) |
| 5 | [Claude Design Skills](https://github.com/freshtechbro/ClaudeDesignSkills) | Claude Code skills that teach it to actually USE all of the above properly |

## Setup (5 minutes)

1. **Install the Claude Design Skills** into your project:
   ```bash
   cd your-project
   git clone https://github.com/freshtechbro/ClaudeDesignSkills .claude/skills/design
   ```
   (or copy the skill folders you want into `.claude/skills/`)

2. **Add the animation libraries** Claude should build with:
   ```bash
   npm install gsap motion
   ```
   React Bits & Magic UI are copy-paste component libraries — no install needed. Claude pulls the component code from their docs/repo when you reference them.

3. **Tell Claude about the stack once** — add this to your project's `CLAUDE.md`:
   ```
   ## Animation stack
   - Animations: GSAP (timelines, scroll) + Motion (springs, micro-interactions)
   - Components: prefer React Bits / Magic UI patterns before writing from scratch
   - Every section animates in; no static hero sections.
   ```

4. **Restart Claude Code** in the project so the skills load.

5. **Prompt it like a creative director**, not a dev:
   ```
   Build the hero section. Premium motion-agency feel:
   staggered entrance, scroll-triggered reveals, one signature interaction.
   Use the animation stack from CLAUDE.md.
   ```

## Why this combo works

- GSAP + Motion cover **every** animation primitive (timelines, scroll, springs).
- React Bits + Magic UI give Claude **proven visual patterns** to adapt instead of inventing bland ones.
- The Design Skills stop Claude from defaulting to boring — they encode taste.

---

Built by [@buildwith.conrad](https://instagram.com/buildwith.conrad) — I build one Claude workflow worth stealing every week.

---
---

# MiraiStitch verification notes

Everything above this line is the gist verbatim ([source](https://gist.github.com/conradcaffier03/a0c6bbca47b7fae91f69fc998721e9b7), commit `b5c7f0f`, retrieved 8 October 2026). Below is what checking it turned up.

## All 5 repos verified live — star counts are now higher than the gist states

| Repo | Gist says | Actual (8 Oct 2026) | Licence | Last push |
| --- | --- | --- | --- | --- |
| greensock/GSAP | 26k+ | **28,895** | custom (free) | 2026-04-13 |
| DavidHDev/react-bits | 43k+ | **48,671** | **Commons Clause** | 2026-10-08 |
| magicuidesign/magicui | 21k+ | **22,507** | MIT | 2026-10-05 |
| motiondivision/motion | 32k+ | **33,878** | MIT | 2026-10-08 |
| freshtechbro/ClaudeDesignSkills | — | **1,003** | MIT | **2025-11-20** |

## Confirmed

- **GSAP is genuinely 100% free, all plugins included.** Webflow acquired GreenSock 15 Oct 2024; as of 29 Apr 2025 every former Club plugin — ScrollTrigger, ScrollSmoother, SplitText, ScrambleText, MorphSVG, DrawSVG, MotionPath, Flip — is free for commercial use with no membership tier. The gist's central claim holds.
- **The stack reasoning is sound.** GSAP + Motion do cover the animation primitives, and award-winning sites do converge on GSAP + Three.js.

## Corrections and cautions

1. **React Bits is Commons Clause, not MIT.** Commercial use is fine, and attribution is required. But you **may not sell, sublicense or redistribute the components themselves** — alone, bundled, or ported. So: reference React Bits components, never vendor their source into this repo. (Magic UI is MIT and unrestricted.)

2. **`ClaudeDesignSkills` is the weakest link.** ~1k stars and last updated 20 Nov 2025 — roughly 11 months stale at time of writing. Its *architectural* guidance is good and its 23 skills fill real gaps, but verify version numbers and API details against current docs, especially for Motion and React Three Fiber. It is MIT, so it was harvested into [`skills/web-motion-stack/`](web-motion-stack/) (22 of 23 skills; `skill-creator` omitted).

3. **Don't `git clone` it into `.claude/skills/design` as step 1 suggests.** Upstream ships the same 23 skills duplicated four times for different installers (1,627 tree entries), so that command installs four copies of everything. The harvest in `web-motion-stack/` took only the `.claude/` set.

4. **`npm install gsap motion` doesn't apply to MiraiStitch as it stands.** This repo is static, dependency-free HTML with GSAP from a CDN. Keep it that way unless a build step is being added for other reasons — a CDN `<script>` tag gets you the same free GSAP.

5. **The "$35K" framing needs local translation.** $35,000 ≈ **R583,600**, about **3× the top of the entire South African agency range**. The gist's number is a US market signal, not a deliverable spec — and the craft it describes costs far less than that even in USD. Full market analysis: [`research/Premium-Motion-Websites-Research.md`](../../research/Premium-Motion-Websites-Research.md).

6. **"Every section animates in; no static hero sections"** — the suggested `CLAUDE.md` line — is the one piece of advice to **not** adopt verbatim. Uniform animate-in on every section is precisely what reads as a template with a plugin; and an Awwwards juror's criteria require working reduced-motion fallbacks plus ~60fps at 4× CPU throttle, which blanket animation works against. Choreography means different sections move differently, for reasons, with stillness between. See [`skills/premium-motion-site/SKILL.md`](premium-motion-site/SKILL.md) → "What makes it read as cheap".

## Where this landed in MiraiStitch

| Gist element | Here |
| --- | --- |
| GSAP | Covered by `hyperframes-motion/adapters/gsap*.md` (craft) + `web-motion-stack/gsap-scrolltrigger/` (scroll binding) |
| Motion | `web-motion-stack/motion-framer/` |
| React Bits / Magic UI | `web-motion-stack/animated-component-libraries/` — API reference only, by licence |
| Claude Design Skills | `web-motion-stack/` — 22 skills, MIT, pinned `1da73fe` |
| "Prompt it like a creative director" | `premium-motion-site/SKILL.md` — the build sequence, with a performance gate |
