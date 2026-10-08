# The Claude skills landscape: motion websites and marketing

Survey for MiraiStitch, 8 October 2026. Commissioned to find the most-adopted Claude skills for (a) a smart animated website builder and (b) marketing.

## Method and its limit

**GitHub has no download counter for skills** — they are repo files, not published packages. Stars and forks are the only available proxy, so every number here is one of those, read from the GitHub API on 8 October 2026.

Searched five ways (`claude skills`, `topic:claude-skills`, animation/website-builder phrasings, marketing phrasings, GSAP/motion phrasings), sorted by stars. Where several repos carried an identical description, the largest was treated as canonical and the rest as forks.

---

## 1. Marketing — a decisive winner

### [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)

| | |
| --- | --- |
| Stars / forks | **53,704 / 7,987** |
| Licence | MIT |
| Last push | 2026-10-08 (active) |
| Size | 4.8 MB, 711 tree entries |
| Skills | **51** |

It is not close. The next *dedicated* marketing skill repo is 13× smaller, and four repos carry this one's description verbatim — they are forks of the canonical source.

| Repo | Stars | Note |
| --- | --- | --- |
| **coreyhaines31/marketingskills** | **53,704** | canonical |
| irinabuht12-oss/marketing-skills | 3,942 | 49 skills |
| zubair-trabzada/ai-marketing-claude | 2,721 | 15 skills, parallel subagents |
| wondelai/skills | 2,361 | business + marketing + UX |
| appeeky/aso-skills | 2,154 | App Store Optimization only |
| LeoYeAI/openclaw-marketing-skills | 1,041 | description verbatim → fork |
| kostja94/marketing-skills | 1,020 | 160+ skills |
| borghei/Claude-Skills | 883 | 385 skills, general |
| Cesarjoquin/Marketing-Skills | 200 | description verbatim → fork |
| davidpc007/openclaw-marketing-skills | 170 | description verbatim → fork |
| ayrshare/marketingskills | 14 | description verbatim → fork |

**Contents** (51 skills): `ab-testing` · `ad-creative` · `ads` · `ai-seo` · `analytics` · `aso` · `attribution` · `churn-prevention` · `co-marketing` · `cold-email` · `community-marketing` · `competitor-profiling` · `competitors` · `content-strategy` · `copy-editing` · `copywriting` · `cro` · `customer-research` · `directory-submissions` · `emails` · `events` · `free-tools` · `image` · `influencer-marketing` · `launch` · `lead-magnets` · `marketing-council` · `marketing-ideas` · `marketing-loops` + 21 more.

Authored by Corey Haines (Swipe Files), a working SaaS marketer — not an aggregated dump.

**Overlap warning:** this would partly duplicate MiraiStitch's existing `skills/seo-optimizer` and `skills/lead-generation`. Adopting it means deciding which wins for SEO and lead capture.

---

## 2. Smart animated website builder — it does not exist at scale

This is the finding that matters. Repos *literally described* as animated-website-builder skills top out at **11 stars**:

| Repo | Stars | What |
| --- | --- | --- |
| aiatelie/ai-atelie | 11 | open-source alternative to Claude Design, MIT |
| Samin12/claude-club-motion-library-skill | 5 | 547 animated website/section/background templates |
| enegaltech/lottie-marketplace | 5 | free Lottie search/fetch/embed |
| drshailesh88/ui-cloner-skill | 4 | clone site designs with animation extraction |
| Boom-Vitt/boom-3d-website | 3 | Dribbble-level landing pages with 3D (Thai) |
| sergeyramas/3d-animation-creator-skill | 2 | video → Apple-style canvas scroll animation |
| HaidarCreator/animation-website-design | 1 | — |
| ayaanoncrypto/WebsiteDesignSkillForclaude | 1 | animated web design patterns |

Landing-page-builder skills are worse — the top result has **1 star**, and most have 0.

**There is no popular skill to recommend for this.** The three options with real adoption are general, not animation-specific:

### Already owned — the #1 skill in the space

[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — **134,015★ / 14,212 forks / MIT / 8.2 MB**

The most-starred skill in this entire category, and MiraiStitch already vendors it at [`skills/ui-ux-pro-max`](../skills/ui-ux-pro-max/SKILL.md). Verified as the same skill: 79 searchable styles, 192 product palettes, 74 font pairings, 119 UX guidelines, 17 GSAP presets, 25 chart types, 22 stacks.

### The "smart" half — taste

[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) — **93,747★ / 6,364 forks / MIT / 36.9 MB / 13 skills**

Stated purpose: *"gives your AI good taste; stops the AI from generating boring, generic"* output. Ships `taste-skill`, `brandkit`, `brutalist-skill`, `minimalist-skill`, `soft-skill`, `redesign-skill`, `image-to-code-skill`, `imagegen-frontend-web`, `imagegen-frontend-mobile`, `stitch-skill`, `output-skill`.

The highest-adoption answer to the "smart" in "smart animated website builder" — it is about design judgment, not animation.

### The actual animation one

[AThevon/genjutsu](https://github.com/AThevon/genjutsu) — **427★ / 30 forks / MIT / 9.2 MB / 20 skills**

Low adoption, but the contents are exactly on target: `gsap` · `framer-motion` · `threejs-r3f` · `motion-principles` · `css-native` · `canvas-generative` · `compose-motion` · `compose-graphics` · `compose-multiplatform` · `design-audit` · **`tells`** · `orchestration` · `swiftui-motion` · `paint` · `cast` · `bunshin` · and a bundled copy of `ui-ux-pro-max`.

GitHub reports its licence as `NOASSERTION`; the LICENSE file was fetched and read — it is **MIT**, with a third-party-components section appended that confuses GitHub's detector. Commercial use, modification and redistribution are permitted with notice retained.

The largest *dedicated* motion-for-web skill found. For comparison, the rest of that tier:

| Repo | Stars |
| --- | --- |
| **AThevon/genjutsu** | **427** |
| AbubakrChan/product-launch-motion | 76 |
| imMamdouhaboammar/motion-graphics-skills | 19 |
| ouerf-man/product-launch-motion-skill | 16 |
| voidmatcha/ui-clone-skills (motion forensics) | 14 |
| simonsez9510/motion-graphic-skill | 5 |

Note that three of those six are **video** skills, not website skills — the same pattern found with HyperFrames and claude-motion-design.

---

## 3. Why the gap exists

The survey explains something this project kept running into:

- The best **motion** knowledge sits in **video** repos — HyperFrames, claude-motion-design, product-launch-motion. Video renderers, all of them.
- The best **design** knowledge sits in **static** design skills — ui-ux-pro-max (134k★), taste-skill (94k★). Neither does motion.
- **Nobody has joined the two.** That join is what [`skills/premium-motion/`](../skills/premium-motion/README.md) now is.

### Independent corroboration of the anti-AI-slop problem

Four unrelated authors have converged on the same problem that [`anti-ai-motion.md`](../skills/premium-motion/premium-motion-site/references/anti-ai-motion.md) addresses:

| Repo | Stars | Framing |
| --- | --- | --- |
| genjutsu's `tells/` skill | 427 | the "tells" that mark AI output |
| marten-osieka/de-ai-ui | 2 | "strips AI fingerprints from web UI: purple gradients, 3-card layouts" |
| arham777/ui-ux-kit | 2 | "taste-first, anti-AI-slop design skill" |
| Leonxlnx/taste-skill | 93,747 | "stops the AI from generating boring, generic" |

The problem is widely recognised. The dedicated solutions are all tiny — only taste-skill has scale, and it addresses static design rather than motion.

**Honest counterweight:** `skills/premium-motion/` has zero stars and no outside validation. These alternatives have tens of thousands. Novelty is not quality.

---

## 4. Recommendation

| Priority | Repo | Licence | Rationale |
| --- | --- | --- | --- |
| **1** | coreyhaines31/marketingskills | MIT | Decisive category winner, 13× the nearest rival, active, 51 skills. Resolve the overlap with `seo-optimizer` + `lead-generation` first. |
| **2** | Leonxlnx/taste-skill | MIT | 94k★. Strengthens step 1 of the playbook (commit to a point of view) — the step the Awwwards research named as most commonly skipped. |
| **3** | genjutsu — `tells/` + `motion-principles/` only | MIT | Low stars, but `tells` independently cross-validates `anti-ai-motion.md`. Skip its bundled `ui-ux-pro-max`; MiraiStitch already has it standalone. |

Nothing has been harvested from this survey. It is a finding, not a change.

### Useful curated indexes

- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) — 76,701★, no licence file, last push 2026-09-18
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — 35,373★, MIT, 1000+ skills, active
- [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) — 27,854★, 380 skills + 30 agents

---

## Related

- [`Premium-Motion-Websites-Research.md`](Premium-Motion-Websites-Research.md) — what a "$35,000 website" actually is, and the performance bar
- [`skills/premium-motion/README.md`](../skills/premium-motion/README.md) — the four harvested libraries and the playbook
