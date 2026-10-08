# The web contract

Every file in `rules/`, `blueprints/`, `transitions/` and `adapters/` was written for HyperFrames, a **video renderer**. It renders by seeking a paused GSAP timeline to each frame time and screenshotting. That architecture forces constraints that are meaningless — or actively wrong — on a website.

This document is the translation layer. **Read it before applying any rule.**

---

## 1. The single biggest difference: time vs. intent

| | HyperFrames (video) | Website |
| --- | --- | --- |
| Drives motion | Renderer seeks `tl.time(t)` | User intent — scroll, hover, click, focus, page load |
| Timeline state | Paused, scrubbed both directions | Plays forward; may be interrupted or abandoned |
| Duration | Fixed by `data-duration` | Open-ended; the user leaves whenever |
| Correctness test | Frame at time `t` is identical every run | Interaction feels responsive and never traps content |

Upstream rules position tweens on an absolute timeline (`ENTRY_AT`, `GROUP_ENTRY_AT + i * STAGGER`). On web, **those absolute positions become offsets from a trigger**. Keep the relative rhythm — it is the part that was tuned — and bind the whole thing to an event.

```js
// Upstream (video): absolute position on a paused root timeline
tl.fromTo("#hero", { scale: 0, opacity: 0 },
  { scale: 1, opacity: 1, duration: 0.6, ease: "power3.out" }, ENTRY_AT);

// Web: same tween, same ease, same duration — bound to entering the viewport,
// played once, and skipped entirely under reduced-motion.
const tl = gsap.timeline({ paused: true });
tl.fromTo("#hero", { scale: 0, opacity: 0 },
  { scale: 1, opacity: 1, duration: 0.6, ease: "power3.out" }, 0);

if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  tl.progress(1);                       // land on the end state, no motion
} else {
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    tl.play();
    obs.disconnect();                   // entrances fire once
  }, { threshold: 0.25 }).observe(document.querySelector("#hero"));
}
```

---

## 2. Drop these upstream constraints — they are video-only

| Upstream rule | Why it exists | On web |
| --- | --- | --- |
| One **paused** timeline registered on `window.__timelines` | The renderer needs a single seekable handle | **Drop.** Use as many timelines as you have triggers. Nothing registers globally. |
| Seek-safe in **both** directions | The renderer scrubs backwards | **Drop**, unless the motion is scroll-*scrubbed* (then see §5). Forward-only play is the norm. |
| No `Math.random()` / `Date.now()` | Two renders must match frame-for-frame | **Drop.** Non-determinism is fine, and often desirable (organic particle drift). |
| `repeat: -1` only under a finite `data-duration` | An infinite loop never finishes rendering | **Drop.** Infinite ambient loops are fine on web — but pause them off-screen (§6). |
| `data-duration`, `class="clip"`, `data-*` timing attributes, sub-compositions | The HyperFrames composition format | **Ignore entirely.** No equivalent. Use real semantic HTML sections. |
| Pre-calculated layout constants; never measure at tween time | The renderer samples frames in parallel, so measurements desync | **Relax, with care.** Measuring is allowed, but batch reads before writes to avoid layout thrash, and re-measure on resize. `ResizeObserver` is the web tool the upstream docs lack. |
| No CSS `transition` on animated elements | Transitions interpolate independently of seek and flicker | **Partly keep.** Don't mix a CSS `transition` and a JS tween on the *same property* — they fight. CSS transitions are otherwise the best tool for hover/press state on web. |
| Hero visible by `t ≤ 0.5s` | Short videos have no time to waste | **Stricter on web** — see §3. |

---

## 3. No hidden content — the rule video does not have

A video viewer has no alternative but to wait. A web visitor can scroll past, hit Ctrl+F, or arrive with JS broken. **Motion must never gate content.**

- **Never ship text that is invisible until JS runs.** An entrance that starts at `opacity: 0` in CSS and is revealed by a tween means a JS error, a slow network, or a blocked CDN leaves a blank page — and search crawlers and screen readers may see nothing.
  - Preferred: set the from-state **in JS**, immediately before binding the trigger. If the script never runs, content stays visible.
  - If you must use a CSS from-state, gate it on a class the script adds to `<html>` (`.js-motion .reveal { opacity: 0 }`), so the no-JS path renders normally.
- **Never animate layout-affecting properties on load.** `height`, `margin`, `top` entrances cause Cumulative Layout Shift, which is a Core Web Vital. Reserve space, then move the content *within* it via transform.
- **Scroll-triggered reveals need a safety net.** If an element is already in the viewport at load, fire immediately — don't wait for a scroll event that may never come.
- **Keep motion off the critical render path.** Don't block first paint on a motion library; the page should be readable before GSAP arrives.

---

## 4. `prefers-reduced-motion` is mandatory

Video ignores this; web cannot. Vestibular disorders make large-transform and parallax motion genuinely painful, and it is an accessibility requirement (WCAG 2.1 SC 2.3.3).

```css
/* CSS-driven motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```js
// JS-driven motion — and respond if the user changes it mid-session
const rm = matchMedia("(prefers-reduced-motion: reduce)");
const apply = () => rm.matches ? tl.progress(1).pause() : tl.play();
rm.addEventListener("change", apply);
apply();
```

Reduced motion means **land on the end state**, not "hide the content". What survives: opacity crossfades under ~200ms, and colour changes. What must go: parallax, large translation, scale, rotation, continuous loops, scroll-scrubbing, 3D camera motion.

Items in this library that require an explicit reduced-motion fallback — `rules/`: `3d-page-scroll`, `3d-camera-flight`, `multi-phase-camera`, `coordinate-target-zoom`, `orbit-3d-entry`, `camera-cursor-tracking`, `reactive-displacement`, `particle-burst`, `sine-wave-loop`, `motion-blur-streak`, `chromatic-glitch`; `blueprints/`: `overwhelm-surround`, `camera-journey`, `spatial-pan-stations`, `zoom-out-workspace-reveal`.

---

## 5. Scroll-scrubbed motion — where "seek-safe" comes back

Scroll-linked animation is the one web case that *is* bidirectional. Here the upstream seek-safety discipline becomes genuinely valuable again:

- Use explicit `fromTo` with absolute from-states — never relative `+=` tweens.
- State must be a pure function of progress, with no mutable trackers between frames.
- Both of those are exactly what the upstream rules already do, so scroll-scrubbed sections can lift recipes almost verbatim.

```js
gsap.timeline({
  scrollTrigger: { trigger: "#section", start: "top bottom", end: "bottom top", scrub: 1 },
}).fromTo("#layer", { y: 0 }, { y: -120, ease: "none" });
```

Use `scrub` for progress-tied motion only (parallax, a draw-on path, a horizontal rail). Entrances should **play on trigger**, not scrub — scrubbing an entrance makes it stutter with the scroll wheel. And disable scrub entirely under reduced motion; it is one of the worst offenders.

---

## 6. Performance budget (web-specific)

The renderer has unlimited time per frame. A browser has ~16ms.

- **Animate `transform` and `opacity`.** Everything else risks layout or paint per frame.
- **Pause off-screen work.** Infinite loops, canvas, WebGL and Lottie players must stop when out of viewport (`IntersectionObserver`) or when the tab is hidden (`document.visibilitychange`). This is the biggest battery win available.
- **Cap concurrent animations.** Dozens of simultaneous tweens on a long page cost more than the effect returns. Stagger by viewport, not by document.
- **`will-change` is a loan, not a gift.** Add before, remove after. Permanent `will-change: transform` on many elements exhausts GPU memory and can make things slower.
- **Lazy-load heavy runtimes.** Dynamic-`import()` Three.js / Lottie when the section approaches the viewport, and never on mobile if the effect is decorative.
- **Honour `navigator.connection.saveData`** and skip decorative motion when set.

See `../../fixing-motion-performance/SKILL.md` for diagnosing an existing page.

---

## 7. Interaction states video has no concept of

The upstream library covers entrances, loops and cinematic camera work. Websites also need state feedback, which has its own timing scale — **much faster**:

| State | Duration | Notes |
| --- | --- | --- |
| Hover | 120–200ms | CSS `transition`. Must be instant-feeling. |
| Press / active | 80–120ms | `scale(0.97)` is plenty. `rules/press-release-spring.md` and `rules/physics-press-reaction.md` port well — shorten them. |
| Focus ring | 0ms | **Never animate focus.** Keyboard users need it immediately, and it must never be removed. |
| Toggle / switch | 150–250ms | `rules/scale-swap-transition.md`, `rules/theme-crossfade-morph.md` |
| Entrance (on scroll) | 400–700ms | Upstream ranges apply as-is |
| Page / route transition | 200–400ms | `transitions/` catalog, but cut upstream durations roughly in half — a video transition that reads well at 0.8s feels sluggish between pages |

Also required on web and absent upstream: visible focus states, `aria-live` for content that animates in, and `aria-hidden` on purely decorative motion layers.

---

## 8. References to skills that aren't here

The harvest took the motion corpus but not the rest of HyperFrames. Files in `rules/` and `blueprints/` still refer in prose to upstream skills that don't exist in MiraiStitch. All *markdown links* resolve inside this skill — only these named mentions dangle:

| Mention | Count | What to do |
| --- | --- | --- |
| `hyperframes-core` | 29 | The video composition contract — `class="clip"`, `data-duration`, sub-compositions, determinism. **This document replaces it.** When a rule says "see `hyperframes-core` for the scene scaffold", the web answer is a semantic `<section>` and a trigger. |
| `animate-text` | 12 | An external skill of 24 named text effects. Not harvested, and not on npm as a drop-in. Treat `adapters/animate-text.md` as a catalogue of ideas to implement by hand, or substitute a text-splitting approach (GSAP SplitText, or wrap glyphs yourself). |
| `hyperframes-creative` | 10 | Partially harvested — the design systems live at `../hyperframes-frames/`. Palette, typography and component guidance is there; narration, beat planning and audio-reactive sections were video-only and were dropped. |
| `media-use` | 1 | Video/audio asset sourcing. Not applicable. |

Rules also reference `scripts/animation-map.mjs` for auditing choreography. It was **not** harvested — it requires the HyperFrames runtime package and reads `window.__timelines`, which no website registers. Use browser DevTools (Performance panel, or the Animations tab) to audit web motion instead.

## 9. Checklist before shipping any motion

- [ ] Content is visible and readable with JS disabled
- [ ] `prefers-reduced-motion: reduce` lands end states with no large motion
- [ ] No animation of `width` / `height` / `top` / `left` / `margin`
- [ ] No layout shift attributable to motion (check CLS)
- [ ] Off-screen loops, canvas and video are paused
- [ ] Focus is never animated and never suppressed
- [ ] `will-change` is removed after the animation completes
- [ ] Heavy runtimes are lazy-loaded and feature-detected
- [ ] Entrances fire for elements already in the viewport at load
- [ ] Tested on a throttled CPU (4× slowdown) — still ~60fps
