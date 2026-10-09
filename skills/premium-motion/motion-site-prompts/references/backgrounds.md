# Animated backgrounds

Recipes that are cheap, tasteful and implementable, ordered by cost. Plus the ones to avoid.

**The rule that saves most of the grief: a background is a background.** If it competes with the headline it has failed, however impressive it looks in isolation. Three constraints apply to everything on this page:

- **Under ~10% contrast** against its own ground. If you notice it while reading, it is too loud.
- **Pause when off-screen and when the tab is hidden.** An infinite loop that ticks forever is a battery cost for nothing.
- **Gone under `prefers-reduced-motion`.** A moving background is exactly what that setting exists to stop. Replace with the static first frame.

```js
// the pause harness every background on this page needs
const io = new IntersectionObserver(([e]) => e.isIntersecting ? start() : stop());
io.observe(section);
document.addEventListener("visibilitychange", () => document.hidden && stop());
if (matchMedia("(prefers-reduced-motion: reduce)").matches) renderStaticFrame();
```

---

## Free — pure CSS, no JS, no library

**Drifting gradient wash.** Two or three large radial gradients on a pseudo-element, animated on `transform` only (never `background-position`, which repaints). 30–60s loop. The most-used premium background there is, because it works.

**Grain / film texture.** A tiled noise PNG at 3–6% opacity, `mix-blend-mode: overlay`, optionally nudged 1px on a slow loop. Instantly makes flat colour look considered. Under 10 KB.

**Graph-paper or dot grid.** `linear-gradient` / `radial-gradient` repeating, 2–4% ink. Static. Carries technical and editorial brands without moving at all — stillness is a legitimate choice.

**Conic sheen sweep.** A conic-gradient rotated slowly behind a card or logo. Reads as light moving across a surface.

**Scrolling marquee.** Duplicated track, `transform: translateX(-50%)`, infinite. Tie `timeScale` to scroll direction and it stops feeling like a looping GIF.

→ `../../hyperframes-motion/rules/css-marker-patterns.md`, `ambient-glow-bloom.md`, `gradient-text-sweep.md`

---

## Cheap — Canvas 2D, ~2–5 KB of your own code

**Constellation / connected points.** Points drift; lines drawn between pairs under a distance threshold. Cap at ~60 points on desktop, ~25 on mobile. Already borderline overused — tilt it toward your brand or skip it.

**Flow field.** Particles following a Perlin-style vector field. Slower and more organic than constellation, and much less common.

**Wave / ribbon.** Two or three sine curves at different frequencies, filled with low-opacity brand colour. Calm, cheap, reads as premium.

**Ripple on click.** Expanding ring from the pointer. The one interactive background that genuinely rewards attention, because it responds to the person.

Canvas notes: size the buffer to `devicePixelRatio` capped at 2, and resize via `ResizeObserver` — not a `resize` listener that fires at 60Hz.

---

## Considered — WebGL, ~150 KB+

Only when the background IS the point. The budget is real: Three.js is ~150 KB before your scene, against an LCP target of 2.5s.

**Shader gradient mesh.** Smoothly morphing colour field. Beautiful and now extremely common — check it is not just the default `.glsl` everyone uses.

**Displaced plane / liquid.** A plane distorted by noise, reacting to the pointer.

**Particle field with depth.** Only distinct from the Canvas version if it uses real depth-of-field.

Mandatory with any of these: feature-detect WebGL, lazy-load the library when the section approaches the viewport, ship a static poster fallback, and skip entirely on `saveData` or coarse pointers with low memory.

→ `../../web-motion-stack/lightweight-3d-effects/` before `threejs-webgl/`

---

## Video backgrounds

Sometimes right, usually not. If you use one:

- `muted autoplay playsinline loop` and a `poster` — without all four it will not autoplay on iOS
- Under 2 MB, under 10s, H.264 + WebM
- `preload="none"` until in view
- A static image fallback on `saveData`, reduced-motion, and mobile data
- Never put essential text over it without a scrim

A 6 MB hero video is the single fastest way to fail Core Web Vitals, and it is a very common way to do it.

---

## Avoid

| Effect | Why |
| --- | --- |
| **Rainbow / multi-hue gradient mesh** | On the banned list in `anti-ai-motion.md`. One accent, always. |
| **Glowing neural-network particles** | The default "AI product" background. Signals nothing concrete to show. |
| **Matrix rain** | Dated, and legible text in a background competes with real text. |
| **Starfields with parallax** | Vestibular trigger, and almost never on-brand. |
| **Cursor trails** | Fights the pointer. We give the cursor a job instead — see the MiraiStitch needle. |
| **Infinite auto-rotating 3D object** | Perpetual motion with no meaning; the clearest "I added Three.js" tell. |

---

## Choosing

1. Can stillness do the job? Usually yes — grain plus a committed palette beats most animated backgrounds.
2. If it must move, can CSS do it? Usually yes.
3. If not CSS, can Canvas 2D do it? Usually yes.
4. WebGL only when the background is the signature interaction — and then it is your one signature, so nothing else on the page gets to be clever.
