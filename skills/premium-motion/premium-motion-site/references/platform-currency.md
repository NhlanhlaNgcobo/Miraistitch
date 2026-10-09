# Platform currency — what's native now, and what that retires

Verified 9 October 2026. Re-check before trusting; this is the file that goes stale fastest.

Two kinds of drift matter. **Versions** drift quietly and mostly cost you nothing. **Platform capability** drift changes the advice — when the browser learns to do something natively, a library in these skills stops being the right answer.

---

## 1. The capability that changed the most: scroll-driven animations

Scroll animation can now run **in CSS, off the main thread**, with no library:

```css
/* fade + rise as the element enters the viewport — no JS, no observer */
@keyframes rise { from { opacity: 0; translate: 0 24px } to { opacity: 1; translate: 0 0 } }

.reveal {
  animation: rise linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}
```

### Support — check this carefully, it is widely misreported

| Browser | `animation-timeline` |
| --- | --- |
| Chrome / Edge | **115+** (July 2023) |
| Safari | **26** (Sept 2025) |
| **Firefox** | **Not in stable.** MDN compat reports `preview` — Nightly only, behind `layout.css.scroll-driven-animations.enabled` |

Global support sits around **82–83%**, and it is **not Baseline**, precisely because Firefox stable has not shipped.

> Several 2026 articles state this is "baseline in all major browsers" or "universal". That is **wrong** — MDN's browser-compat-data still lists Firefox as `preview`. Verified directly rather than taken from the blog posts.

### So what should you actually use

Unsupported browsers simply **never run the animation**, which means the from-state sticks. That is the dangerous failure mode: content stuck at `opacity: 0` in Firefox. Two safe shapes:

- **Progressive enhancement** — the element is fully visible by default, and the scroll animation only *enhances*. Then Firefox showing it immediately is correct, not broken.
- **Feature query** — `@supports (animation-timeline: view()) { … }`, with the JS path as the `@supports not` fallback.

| Job | Use |
| --- | --- |
| Entrance reveals, progress bars, parallax, simple scrubs — the easy ~80% | **Native CSS.** Zero JS, off the main thread, cannot jank. |
| Pinning, coordinated multi-element timelines, scrubbed sequences, anything needing precise control — the hard ~20% | **GSAP ScrollTrigger.** Still the right tool and not close to obsolete. |

This repo's landing page is the second category (pinned horizontal gallery, scrubbed thread, journey timeline), so GSAP stays. But a simple marketing page built from these skills should reach for CSS first now.

---

## 2. View Transitions

| | Support | Verdict |
| --- | --- | --- |
| **Same-document** | Chrome 111, **Firefox 144**, Safari 18 | Broadly available — use it |
| **Cross-document** (MPA) | Chrome 126, Safari 18.2, **Firefox: not shipped** | Progressive enhancement only |

```css
@view-transition { navigation: auto; }   /* cross-document, 2 lines */
```

Unsupported browsers skip the animation and show the new page instantly — no error, no broken layout, no polyfill. That makes it genuinely safe to ship today.

**What this affects in these skills:** `web-motion-stack/barba-js/` exists to animate page transitions without a SPA. Barba's last npm publish was **August 2024**. For a static multi-page site — which is exactly what the MiraiStitch root is — two lines of `@view-transition` now do the common case with no dependency. Keep Barba for complex orchestration or when you need Firefox parity; reach for the native API first.

---

## 3. Other platform wins worth knowing

- **CSS anchor positioning** reached Baseline **January 2026** (Firefox 147 was the last to ship). Tethers a tooltip/popover to its trigger in CSS. Retires most of what Floating UI was installed for.
- **`@starting-style`** + `transition-behavior: allow-discrete` — entry transitions for elements arriving in the DOM, and transitions on `display`. Baseline since 2024. Removes a whole class of "animate in on mount" JS.
- **Container style queries** — style on a parent's custom property, not just its size. An Interop 2026 focus area.

---

## 4. Version drift in the libraries these skills reference

Checked against the npm registry, 9 October 2026.

| Package | Current | Published | Note |
| --- | --- | --- | --- |
| `gsap` | **3.15.0** | 2026-04-13 | repo vendors 3.13.0 — two minors behind, no action needed |
| `motion` / `framer-motion` | **14.0.0** | 2026-10-02 | **major** — skills written against earlier majors |
| `three` | **0.186.1** | 2026-09-24 | `index.html` loaded **r128 (2021)** before it was disabled — ~58 releases behind |
| `@react-three/fiber` | **9.8.1** | 2026-09-24 | major ahead of the skill |
| `@react-three/drei` | **10.7.9** | 2026-09-25 | |
| `animejs` | **4.5.0** | 2026-06-22 | **v3 → v4 was an API rewrite.** Any v3 snippet is wrong. |
| `lenis` | **1.3.26** | 2026-08-05 | repo vendors 1.1.13 |
| `locomotive-scroll` | **5.0.1** | 2026-01-15 | v5 is a rewrite; Lenis is the lighter default now |
| `@barba/core` | 2.10.3 | **2024-08-12** | effectively dormant — see §2 |
| `pixi.js` | 8.22.0 | 2026-10-01 | |
| `babylonjs` | 9.30.0 | 2026-10-08 | |
| `@rive-app/canvas` | 2.44.1 | 2026-10-09 | actively shipping |
| `lottie-web` | 5.13.0 | 2025-05-21 | stable, slow-moving |
| `@splinetool/react-spline` | 4.1.0 | 2025-07-15 | |
| `tailwindcss` | **4.3.3** | 2026-07-16 | v4 — config-less; v3 snippets won't apply |
| `next` | 16.4.0 | 2026-10-06 | |
| `react` | 19.3.0 | 2026-09-09 | |

### What to distrust in `web-motion-stack`

That harvest came from ClaudeDesignSkills, last updated **20 November 2025**. Its *architecture* advice holds up well. Its **API specifics do not**, in three places especially:

1. **`animejs/`** — v4 rewrote the API. Treat every snippet there as v3 and verify.
2. **`motion-framer/`** — now at v14. Check imports and the package name (`motion`, not `framer-motion`).
3. **`react-three-fiber/`** — R3F 9 + Three 0.186. Version-sensitive.

---

## 5. The short version

- **Reach for CSS first** for entrance reveals and simple scroll effects. It is free, off-thread, and cannot jank.
- **Keep GSAP** for pinning, scrubbing and coordinated sequences. It is not obsolete and will not be soon.
- **Use `@view-transition`** before installing a page-transition library on a static site.
- **Assume any version number in these skills is stale** and check npm. The craft ages well; the APIs do not.
