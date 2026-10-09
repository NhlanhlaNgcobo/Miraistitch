# Magic UI — provenance

`skills/magic-ui/` is harvested from the Magic UI repository, not original work.

| | |
| --- | --- |
| Upstream | https://github.com/magicuidesign/magicui |
| Pinned commit | `cdb348cb4c72a9b54b554d8617801e479fbc8714` |
| Licence | MIT — full text in [`UPSTREAM-LICENSE.md`](UPSTREAM-LICENSE.md) · © Magic UI |
| Harvested | 9 October 2026 |
| Upstream stars | ~22,500 |

## Why this one

It was chosen over the larger alternative on licence grounds. [React Bits](https://github.com/DavidHDev/react-bits)
has roughly twice the stars (~48,800) and more components, but it is **Commons
Clause**: you may build commercial products with it, you may **not** redistribute
the components. That makes it impossible to vendor into this repo. Magic UI is
MIT and unrestricted.

Magic UI is also the closest free equivalent to a paid prompt-and-component
library like [motionsites.ai](https://motionsites.ai) — 79 animated components
covering the same ground (hero anchors, kinetic text, CTA treatments, ambient
backgrounds, device mockups), and it already ships a Claude skill.

## What was taken

| File | Source |
| --- | --- |
| `SKILL.md` | upstream `skills/magic-ui/SKILL.md`, **unmodified** |
| `references/components.md` | upstream `skills/magic-ui/references/components.md`, **unmodified** |
| `references/recipes.md` | upstream `skills/magic-ui/references/recipes.md`, **unmodified** |
| `UPSTREAM-LICENSE.md` | upstream `LICENSE.md` |

About 8 KB in total. The 79 component **sources** were deliberately not vendored:
they are installed per-project through the shadcn registry
(`npx shadcn@latest add @magicui/<slug>`), so copying them here would create a
stale fork of code that is designed to be pulled fresh.

## MiraiStitch additions

| File | Why |
| --- | --- |
| `references/all-components.md` | Upstream's selection guide lists about 20 components. This is the complete set of 79, grouped by job, with the project-specific cautions below. |
| `UPSTREAM.md` | This file. |

## Things to know before using it

**Stack.** React + Tailwind + shadcn. That fits the Next.js app in [`app/`](../../app).
It does **not** fit the static pages at the repo root, which are vanilla HTML with
GSAP served from `vendor/`. A component used there has to be rewritten, not installed.

**Cursor conflict.** `smooth-cursor` and `pointer` both take over the cursor, and
the MiraiStitch landing page already uses a needle cursor as its brand signature.
Don't stack them.

**Restraint.** The registry makes it trivially easy to stack four animated
backgrounds and three text effects on one page. Upstream's own skill warns
against it, and the playbook in
[`../premium-motion/premium-motion-site/SKILL.md`](../premium-motion/premium-motion-site/SKILL.md)
allows exactly one signature interaction. `rainbow-button` in particular conflicts
with the one-accent rule in
[`anti-ai-motion.md`](../premium-motion/premium-motion-site/references/anti-ai-motion.md).

## Related in this repo

- [`../premium-motion/motion-site-prompts/`](../premium-motion/motion-site-prompts/SKILL.md) — turns a brief into a spec; decides *which* component is needed and why
- [`../premium-motion/web-motion-stack/animated-component-libraries/`](../premium-motion/web-motion-stack/animated-component-libraries/) — documents Magic UI and React Bits **second-hand** via ClaudeDesignSkills. This folder is the first-hand source and should be preferred.
