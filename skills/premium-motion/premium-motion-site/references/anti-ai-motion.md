# Anti-"AI motion" rules

How to stop machine-made motion from looking machine-made. The failure mode is specific and recognisable, and it has named causes with named fixes.

Consolidated from two independent sources, both video practitioners, plus the convergence between them:

- **[claude-motion-design](https://github.com/howseen-ai/claude-motion-design)** (Howseen AI, MIT) — §9b "Anti-AI motion rules", the critique loop, spring presets, honesty rules. Harvested at `../../motion-design-film/FILM-SKILL.md`.
- **[HyperFrames](https://github.com/heygen-com/hyperframes)** (Apache-2.0) — `../../hyperframes-motion/rules/`.

**Where two unrelated sources agree, treat it as settled.** They agree on more than they disagree.

---

## 1. The convergence — overshoot is the tell

| Source | Verdict |
| --- | --- |
| claude-motion-design | "springs with damping ratio **≥ 0.72**, tiny overshoot, **never cartoon bounce**" |
| HyperFrames | "`back.out` is the **#1 instant turn-off** in agent-made videos and is almost never executed well" |

Two independent practitioners, same conclusion. **Bouncy overshoot is the single clearest signature of machine-made motion.**

The fix on web:

```js
// Default. No overshoot, clean deceleration.
ease: "power3.out"       // or expo.out for a punchier front

// If you genuinely need physical settle, use a damped spring —
// damping ratio >= 0.72 gives ~5-10% overshoot that reads physical.
// back.out(2+) gives cartoon wobble that reads cheap.
```

CSS equivalents, from the LinkedIn-loop practice in §9b:

```css
--ease-standard: cubic-bezier(0.6, 0, 0.2, 1);
--ease-emphasis: cubic-bezier(0.2, 0.8, 0.2, 1);
```

**And: linear motion is cheap, never.** Anything moving at constant velocity (outside a scroll-scrub or a marquee) reads as unfinished.

## 2. Spring presets

Stiffness / damping pairs that are known to work, by what's moving:

| What's moving | k / d | Notes |
| --- | --- | --- |
| Snappy UI — buttons, toggles, menus | **320 / 30** | Interaction feedback. Fast. |
| Containers, cards, camera | **170 / 26** | The general default. |
| Heavy type, logos, hero marks | **120 / 24** | Weight reads as expensive. |
| Playful — mascots, novelty | **180 / 12** | Only for a deliberately playful register. |

Leading and trailing edges of a stretching element should sit on *different* springs — that's what makes a stretch read as material rather than as a scale transform.

## 3. The banned list

Not stylistic preference — these are the specific tells:

- **Rainbow / multi-hue gradients.** ONE accent colour. The constraint is what reads as deliberate.
- **Particles.** Almost always decoration with no meaning.
- **Glowing chrome / bevels.**
- **Emoji in UI chrome.**
- **Lorem ipsum.** Real copy or nothing — placeholder text changes the rhythm of a layout.
- **Gratuitous 3D flips.**
- **Cartoon bounce** (see §1).
- **Type too small for a phone.** Decide the mobile size first, not last.

Add, from the YouTube-walkthrough section (§9d): **"fight the fingerprint."** Claude's default font choices and crowded vertical layouts are *recognisable as AI output*. Always set an explicit brand font. This is the same point the playbook's step 1 makes — a committed point of view is the antidote.

## 4. One thing moves at a time

The most load-bearing rule in the whole document.

> **One thing moves at a time**, unless a single continuous input (a slider, a scroll position) is driving a continuous transform.

And its companion:

> **One shape / visual system from start to end — transformations, not cuts.**

A premium site transforms one coherent element through states. An amateur one cuts between unrelated animated things. On web this maps to **shared-element transitions** (the button carries its label into the panel; the card carries its image into the detail view) — which is FLIP:

→ `../../hyperframes-motion/references/keyframe-patterns.md` for FLIP mechanics
→ `../../hyperframes-motion/rules/card-morph-anchor.md`, `anchored-layout-expand.md`
→ `../../web-motion-stack/barba-js/` for page-level handoffs

**Text that swaps inside a morphing shape needs its own mask.** And during a handoff, never scale a blurry copy — crossfade the fill only, so type stays sharp.

## 5. The silent one-sentence test

The cheapest quality check that exists, and it works on web:

> Show the page (or the interaction) to someone with the sound off. If they summarise it in one sentence — *"the button became a player"* — it works. **If they hesitate, too much is moving.**

Web corollary, from §11's muted-first rule: a hero autoplays without sound, so **kinetic type has to carry the message**. Every title on **one line**. Respect safe margins.

## 6. Pacing

| Rule | Source | Web application |
| --- | --- | --- |
| Something new every **2–4 s** | critique loop | Applies to a scroll journey, not a timer — a visitor scrolling should meet something new every screen-height or so |
| Every element **finishes animating and stays readable ≥ 1.5 s** | §11 | Directly applicable. Motion that re-triggers while being read is hostile. |
| "Nothing still for > 1 s" | §1, beat map | **Invert this for web.** That's a video rule — a film can't afford stillness. A website must. Stillness is what makes the moving thing read. |

That last row matters: it's the clearest case where video craft must *not* be copied across. A page where everything moves has no emphasis left to spend.

## 7. Honesty rules — adopt these directly

The strongest non-motion content in the source, and immediately relevant to MiraiStitch, whose own README flags placeholder pricing and a placeholder testimonial.

- **Zero fabrication on screen.** Real data is sourced on screen, with a date. Anything illustrative is labelled **"Example data"** / **"Example answer"** / **"Illustration"**.
- **No `facts.md` → no numbers on screen.** If a figure can't be traced to a source with a date, it doesn't ship. A hard, checkable gate.
- **Captions stay true.** No "built in 10 minutes" if it wasn't; no "no external tools" if tools were used; no "one shot" after iterations.
- **Never invent product features.** Check the actual code. If a paywall blocks capturing real UI, either ask for screenshots or label the recreation as illustrative.
- **Anonymise examples.** One fictional company used consistently; no real client, competitor or person; neutral avatars.

For MiraiStitch specifically: the landing page's R0 / R290 / R690 pricing and its testimonial are placeholders. Under these rules they need either real figures or a visible "Example" label before the site goes anywhere near a customer.

## 8. The critique loop

Motion quality comes from reviewing it, not from authoring it well the first time. The source is blunt: **"Be a harsh motion director, not a proud author."**

Adapted to web — capture the page at each scroll state and interaction, then **score 1–10** on:

- Hook — does the first screen land in ~2 s?
- **Readability at 360 px width**
- Motion quality — springs, no dead frames, nothing linear
- Variety — something new every 2–4 s of journey
- Composition
- Brand / data accuracy
- Interaction response — anything user-initiated under 100 ms

Then:

> **Fix only what scores ≤ 7. Do not touch anything at 9+.** Re-score. Repeat until everything is 8+.

Two structural rules that make this work:

- **Judge ≠ builder.** Run the critique as a separate read-only reviewer, not as the author of the code.
- **Restate-from-frames test.** Have a fresh reviewer state the page's message from the visuals alone. If they can't, the design fails — regardless of how good the motion is.

Specific defects to hunt (from the source's list, web-relevant ones): text overlapping during swaps · anything moving linearly · blurry scaled text · a centred title on a gradient · dead beats · stutter on repeat.

## 9. Diagnostic — symptom to cause

Rows from the source's table that apply to websites:

| Symptom | Cause → fix |
| --- | --- |
| **Looks like every other AI site** | No charter, no committed direction → named reference style + real content. Playbook step 1. |
| **Cheap, bouncy** | Bounce easing → springs, damping ≥ 0.72 |
| **Blurry text / washed logo** | Raster where vector belongs → real SVG |
| **Stutters** | CSS transitions fighting JS tweens on the same property, or timer-driven motion → one owner per property |
| **Invented feature or number** | No screenshots / repo / `facts.md` |
| **Too much moving** | Fails the silent one-sentence test → cut until one thing moves at a time |

## 10. Name your reference style

From §9b, and it sharpens the playbook's step 1 considerably:

> Name a **specific** reference style — *"Linear launch"*, *"Stripe docs"*, *"Apple bumper"*. **Never "premium modern."**

"Premium modern", "clean and minimal", "sleek" are not directions. They are the absence of one, and they produce the generic output in §9's first row. A named reference is checkable: you can hold the work up against it and see whether it matches.

→ `../../hyperframes-frames/` supplies 13 already-named, already-committed directions if you don't have a reference in mind.

---

## What did not transfer

For the record, so nobody mines the source for the wrong things. These are video-only and have no web meaning:

ffmpeg render pipeline · subframe motion blur and `tmix` · beat maps, BPM, music drops, −14 LUFS, SFX peak placement · pop and one-frame-flash scans · loop seam checks · deterministic Chromium flags · poster in frame 0 · B-roll over a voice-over, captions, Whisper timings · aspect-ratio deliverables · remake mode.

Also **not** adopted: the source's house rule "no em/en dashes in any copy we write." That's their editorial style, not a motion principle.
