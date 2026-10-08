---
name: web-animations
description: >-
  Add tasteful, performant motion and interactivity to a web UI — using GSAP and/or CSS.
  Use this whenever the user wants something to feel animated, interactive, alive, or
  "less static": scroll reveals, staggered entrances, hover micro-interactions, page-load
  sequences, parallax, animated counters, marquees, drag feedback, modal/drawer in-and-out
  motion, SVG/path drawing, or text effects. Trigger it even when the user doesn't say
  "animation" but asks to make something "interactive", "engaging", "modern", "pop", or
  "feel premium", or mentions GSAP, ScrollTrigger, transitions, easing, or micro-interactions.
  Prefer this skill over hand-rolling ad-hoc keyframes because it enforces performant,
  accessible motion (transform/opacity only, reduced-motion fallbacks) and ships ready presets.
---

# Web Animations

Motion earns its place by showing change and guiding attention — not by decorating. The
difference between premium and amateur motion is restraint, consistency, and performance.
Your job: add interactivity that feels intentional, runs at 60fps, and never traps or
nauseates a user.

## The non-negotiables (every animation, every time)

- **Animate only `transform` and `opacity`.** They run on the compositor and stay at 60fps. Animating `width`, `height`, `top`, `left`, `margin`, or `box-shadow` on a loop causes layout thrashing and jank. Need a size change? Use `scale`. Need to move? Use `translate`.
- **Respect `prefers-reduced-motion`.** Wrap non-essential motion so reduced-motion users get the final state instantly. With GSAP use `gsap.matchMedia()`; in CSS use `@media (prefers-reduced-motion: reduce)`. This is an accessibility requirement, not a nicety — vestibular disorders make large motion physically painful.
- **Exit faster than enter.** Entrances ~300–600ms; exits ~150–250ms. Waiting on a slow exit feels broken.
- **Ease with intent.** Use `power2.out`/`expo.out` for entrances (decelerate into place), `power2.in` for exits. Never animate everything with one linear duration — that's the clearest "generated" tell.
- **Keep the resting state visible.** Don't leave content at `opacity:0` waiting for an observer that might not fire — reveal from a visible baseline, or ensure a no-JS/!reduced-motion fallback shows everything.

## CSS vs GSAP — pick the smaller tool

- **CSS transitions / keyframes** for hover states, simple one-shot entrances, loaders, and anything a single `transition` can express. No library needed.
- **GSAP** when you need sequencing (timelines), scroll-linked motion (ScrollTrigger), physics-y easing, staggered lists, drag (Draggable), or precise orchestration. Load the UMD build from cdnjs and pin the version:
  ```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
  <!-- plugins as needed, same version: -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/Draggable.min.js"></script>
  ```
  Register plugins before use: `gsap.registerPlugin(ScrollTrigger, Draggable)`. Always feature-check (`if (window.gsap)`) so the page still works if the CDN fails.

Read `references/gsap-presets.md` for ready-to-paste, tuned presets (hover, stagger reveal, page-load timeline, drag feedback, counter, marquee, parallax, modal in/out, SplitText headline) with do/don't notes.

## The method

1. **Decide what each motion communicates.** Entrance (this is new) · feedback (your action registered) · transition (where this came from) · ambient (alive, used sparingly). If a motion communicates nothing, cut it.
2. **Pick one orchestrated moment.** A single well-timed page-load sequence or one signature interaction lands harder than fade-up-on-every-section. Scattered identical effects read as generated filler.
3. **Match complexity to the brand.** A luxury brand wants slow, confident ease; a playful one wants spring and bounce. Tune duration and easing to the voice.
4. **Interactive > automatic.** Motion that answers a user action (hover, drag, open, confirm) is almost always better than motion that fires on its own. Favour it.
5. **Build, then cut.** Add the motion, then remove the weakest third. Restraint is the signature of good motion design.

## Common interactions, the right way

- **Scroll reveal:** `IntersectionObserver` (or ScrollTrigger) adds a class / triggers a tween once; `unobserve` after. Small `y` (8–24px) + opacity, stagger 0.02–0.04s for lists. Never animate a whole long page in; reveal per section.
- **Hover micro-interaction:** `translateY(-2 to -4px)` + `scale(1.02)`, 150–250ms, and **always** attach the reverse on mouseleave. Use `gsap.quickTo` for lists of 20+ hover targets.
- **Drag & drop:** give the dragged element a lifted state (scale 1.03, shadow, slight opacity), show a drop indicator, and animate the drop into place (`from` scale/opacity). Use the Draggable plugin or native HTML5 DnD; animate with transforms only.
- **Page-load:** one timeline — nav, then hero headline, then sub, then CTA, small `y` + opacity, ~0.4–0.6s total with 0.05–0.08s offsets. Once. Not on every subsequent navigation.
- **Counters / stats:** tween a number object and write `Math.round` to the DOM; trigger on scroll-in, once.

## Pre-ship checklist
- [ ] Only transform/opacity animated in any loop or hover.
- [ ] `prefers-reduced-motion` honoured (final state shown, no large motion).
- [ ] Exits faster than entrances; easing is directional (out to enter, in to exit).
- [ ] Reverse tween on every hover; no state left "stuck" on fast pointer-out.
- [ ] Library feature-checked; page works if GSAP fails to load.
- [ ] No layout shift from motion (reserve space); 60fps on a mid-range phone.
- [ ] One signature moment, not the same effect on everything.
