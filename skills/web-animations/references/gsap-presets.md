# GSAP & CSS motion presets

Ready-to-paste, performance-tuned presets. All use transform/opacity only. Wrap
non-essential motion in `gsap.matchMedia()` so reduced-motion users get the final state.
Pin GSAP to an exact version from cdnjs and feature-check `window.gsap`.

## Reduced-motion wrapper (use around non-essential motion)
```js
const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference)", () => {
  // all the animations that should ONLY run when motion is allowed
  gsap.from(".hero h1", { opacity: 0, y: 20, duration: 0.6, ease: "expo.out" });
});
// reduced-motion users simply never get the tween → element stays at its resting state
```

## 1. Hover micro-interaction (subtle / standard)
```js
// Subtle — reads as feedback, not movement
el.addEventListener("mouseenter", () => gsap.to(el, { y: -2, duration: 0.15, ease: "power1.out" }));
el.addEventListener("mouseleave", () => gsap.to(el, { y: 0, duration: 0.15, ease: "power1.out" }));

// Standard card lift — for many cards use quickTo to avoid GC churn
const y = gsap.quickTo(card, "y", { duration: 0.25, ease: "power2.out" });
card.addEventListener("mouseenter", () => { y(-4); gsap.to(card, { scale: 1.02, duration: 0.25 }); });
card.addEventListener("mouseleave", () => { y(0);  gsap.to(card, { scale: 1,    duration: 0.25 }); });
```
Do: always attach the reverse tween. Don't: animate width/height/margin on hover.

## 2. Staggered reveal on scroll
```js
gsap.registerPlugin(ScrollTrigger);
gsap.from(".card", {
  opacity: 0, y: 16, duration: 0.4, stagger: 0.04, ease: "power2.out",
  scrollTrigger: { trigger: ".grid", start: "top 80%", once: true }
});
```
Pure-JS alternative (no plugin):
```js
const io = new IntersectionObserver((es) => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll("[data-reveal]").forEach(el => io.observe(el));
```
Keep per-item stagger 0.02–0.04s; don't exceed 0.1s on long lists.

## 3. Page-load timeline (one signature moment)
```js
const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 0.6 } });
tl.from("nav",        { y: -16, opacity: 0, duration: 0.4 })
  .from(".hero h1",   { y: 24,  opacity: 0 }, "-=0.1")
  .from(".hero .sub", { y: 16,  opacity: 0 }, "-=0.35")
  .from(".hero .cta", { y: 12,  opacity: 0, duration: 0.4 }, "-=0.3");
```
Run once on load, not on every route change.

## 4. Drag & drop feedback (native HTML5 DnD + GSAP for the motion)
```js
item.addEventListener("dragstart", () => gsap.to(item, { scale: 1.03, opacity: 0.85, duration: 0.15 }));
item.addEventListener("dragend",   () => gsap.to(item, { scale: 1, opacity: 1, duration: 0.2 }));
// animate a freshly dropped block into place:
function animateIn(el){ gsap.from(el, { opacity: 0, scale: 0.96, y: 10, duration: 0.35, ease: "power3.out" }); }
```
With the Draggable plugin for free-dragging / sortable:
```js
gsap.registerPlugin(Draggable);
Draggable.create(".chip", { type: "x,y", inertia: false, onDragStart(){ gsap.to(this.target,{scale:1.05,duration:.15}); }, onRelease(){ gsap.to(this.target,{scale:1,duration:.2}); } });
```

## 5. Animated counter / stat
```js
function countUp(el, to){
  const obj = { v: 0 };
  gsap.to(obj, { v: to, duration: 1.2, ease: "power2.out",
    onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString(); },
    scrollTrigger: { trigger: el, start: "top 85%", once: true } });
}
```

## 6. Seamless marquee (logos / chips)
```css
.marquee{overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}
.marquee-track{display:flex;gap:14px;width:max-content;animation:scroll 28s linear infinite}
.marquee:hover .marquee-track{animation-play-state:paused}
@keyframes scroll{to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.marquee-track{animation:none;flex-wrap:wrap;width:auto}}
```
Duplicate the track's children once so the -50% loop is seamless.

## 7. Subtle parallax (pointer or scroll)
```js
// pointer parallax on a hero visual — small range, disable on touch/reduced-motion
const xTo = gsap.quickTo(".hero-art", "x", { duration: 0.6, ease: "power3.out" });
const yTo = gsap.quickTo(".hero-art", "y", { duration: 0.6, ease: "power3.out" });
addEventListener("pointermove", (e) => {
  const cx = (e.clientX / innerWidth - 0.5) * 20, cy = (e.clientY / innerHeight - 0.5) * 20;
  xTo(cx); yTo(cy);
});
```
Keep displacement small (≤20px). Scroll parallax: use ScrollTrigger `scrub`, never a scroll listener that writes layout.

## 8. Modal / drawer in and out (exit faster)
```js
function openModal(panel, backdrop){
  gsap.set([panel, backdrop], { display: "block" });
  gsap.to(backdrop, { opacity: 1, duration: 0.2 });
  gsap.fromTo(panel, { y: 20, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" });
}
function closeModal(panel, backdrop){
  gsap.to(panel, { y: 10, opacity: 0, scale: 0.98, duration: 0.18, ease: "power2.in" });
  gsap.to(backdrop, { opacity: 0, duration: 0.18, onComplete: () => gsap.set([panel, backdrop], { display: "none" }) });
}
```

## 9. SplitText headline (short headlines only)
```js
gsap.registerPlugin(SplitText);
const split = new SplitText(".headline", { type: "chars" });
gsap.from(split.chars, { opacity: 0, y: 20, rotateX: -40, duration: 0.6, stagger: 0.015, ease: "expo.out" });
// revert on cleanup for screen readers: split.revert();
```
Reserve for headlines under ~8 words; keep a plain-text fallback.

## Easing cheat-sheet
- Entrances: `power2.out`, `power3.out`, `expo.out` (decelerate into place).
- Exits: `power2.in`.
- Playful/bounce: `back.out(1.6)`, `elastic.out(1, 0.5)` — use sparingly.
- Continuous/ambient: `none` (linear) for marquees and spinners only.
