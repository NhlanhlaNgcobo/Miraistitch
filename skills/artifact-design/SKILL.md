---
name: artifact-design
description: >-
  Design guidance and fundamentals for Artifacts. Load before writing any artifact, including a
  skill-instructed Markdown one — Markdown is never a shortcut past the design pass.
note: >-
  This is an inline skill bundled with Claude Code (no separate asset files). This SKILL.md was
  reconstructed from the skill's loaded craft guidance so it can live in this repo. The full
  "page contract" (the Artifact tool's publish/CSP/theme rules) ships with the Artifact tool
  itself and is summarised under Fundamentals below.
---

# Artifact design

Work the way the design lead at a small, versatile studio would: give each client a visual
identity at the level of treatment the task calls for. Make deliberate choices about palette,
typography, and layout that are specific to this subject, and avoid templated designs.

## Read the request first

Decide the treatment; designing is a given. A doc gets the same craft as a landing page; only
the treatment differs. Author HTML; publish Markdown only when a loaded skill explicitly
instructs it (a Markdown publish keeps its filename as its title and uses almost none of the
craft below — it is never a way to save time).

- Many requests call for a **utilitarian** treatment (a plan, a memo, a demo): polished, with
  real typographic hierarchy, considered spacing, and a proper palette, but not over-designed.
  Most pages don't need a flashy, gigantic hero.
- Some call for an **editorial** treatment (a landing page, a game, an app or tool they'll keep
  or share). See the editorial process at the end.
- If unsure: a well-composed page is always acceptable; an over-designed identity sometimes isn't.

## Fundamentals for every artifact

**Respect what already exists.** Look for an existing design system first (CLAUDE.md, a tokens
or theme file, existing component styles). When one exists, apply it; precedence is the user's
words, then the project's system, then your choices.

**Ground it in the subject.** Define one concrete subject, its audience, and the page's single
job. Distinctive choices come from the subject's own world — its materials, instruments, and
vernacular. Include at least one detail only this subject would have, as content not ornament.
Use real content, never lorem ipsum.

**Pair typefaces.** Typography determines how the page reads. Use one or two families; if two,
make them clearly distinct. Load Google Fonts via `<link>` (the only font host the Artifact CSP
allows); any other face must be inlined as a @font-face data URI. Declare a real fallback stack.
Keep running text near 65 characters wide, set a type scale and keep to it, give headings
`text-wrap: balance`, and give uppercase labels a little letter-spacing.

**Load libraries instead of inlining them.** When a page needs React/charting/highlighting, load
the UMD build from cdnjs with one `<script>` pinned to an exact version (at least two weeks old),
placed before the inline script that uses its global. Most pages need no library.

**Choose neutrals deliberately.** A pure mid-grey looks unconsidered; bias it slightly toward the
accent. Pure white / near-black are fine when chosen deliberately.

**Design both themes.** The viewer has three states — explicit `data-theme="dark"`/`"light"` on
the root, or the default "system" setting (no attribute, only `prefers-color-scheme`). Define
every color as a token on bare `:root` (the full light palette), redefine tokens under
`@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) { … color-scheme: dark } }`
and again under `:root[data-theme="dark"]`. Style components through tokens, never with a literal
that reads in one theme only. `body` must set an explicit token background. A dark-first or
single-look design may commit to one world, but still sets background and every color explicitly.

**Use layout for spacing.** Lay out sibling groups with flex/grid and `gap`, not per-element
margins. Keep a ≥16px side gutter at every width (side padding on one wrapper; vertical padding
via `padding-block`). Let rows wrap/stack at ~400px. `max-width: 100%` on images and
`aspect-ratio` boxes; nothing wider than the screen except tables/code/diagrams in their own
`overflow-x: auto`. Use `font-variant-numeric: tabular-nums` where digits align.

**Make repeated elements consistent.** Cards in a row, label/value pairs, badges — same edges,
baselines, inner padding; recurring element in the same place on each. Let content set height;
pick a column count the items fill. Text that can outgrow its track wraps or scrolls; clipped
text is a bug.

**Use card styling selectively.** Border, fill, radius, and shadow each mark an element as a
separate object — apply them by role, to set off the one element that needs it. The same radius
and shadow on every block flattens the hierarchy.

**Draw charts to scale.** One scale for marks, ticks, labels; every label names a value the chart
reaches. Color chart text from theme tokens. In SVG, leave viewBox room for outer labels and give
every shape an explicit fill.

**Make the page complete at rest.** Everything meant to be read is visible once loaded, with no
scroll to trigger it (the first frame is what a thumbnail and a shared link show). A section may
animate in from a visible resting state, never left at `opacity:0` waiting for an observer. Size a
hero to its content, not `100vh`. A tool opens in a realistic working state (example rows clearly
marked as examples), never an empty shell.

**Avoid AI-generated design.** Current tells cluster around: warm cream (#F4F1EA) + serif display
+ terracotta accent; near-black with a lone acid-green/vermilion pop; broadsheet hairline rules
with dense columns; the SaaS-card kit (identical rounded cards, one radius and the same soft grey
shadow on everything, gradient washes as decoration); and template chrome regardless of subject
(tracked-out ALL-CAPS eyebrows, meta joined with middle dots, "WORD — fragment" labels, tinted
near-black for black, a mono face for small data labels, a '→' appended to link/button text). When
the user specifies a direction, follow it exactly. When they don't, don't spend that freedom on
one of these defaults.

**Build cleanly.** Watch overlapping elements and cascade collisions. Close every non-void
element, double-quote attributes, give keyboard focus a visible state, respect
`prefers-reduced-motion`, give form controls stable `id`s. Use Canvas/WebGL for generative
graphics instead of hand-writing long SVG path data.

**Writing the copy.** Words are design material, not decoration. Write from the user's side of the
screen; name things by what people recognise. Active voice; a control states exactly what happens
("Publish" → a toast that says "Published"). Errors explain what went wrong and how to fix it.
Prefer specific to clever; write plainly. Avoid mannered em-dash asides, "not X but Y" framing,
colon-then-reveal, scare quotes, and stock phrases.

**Name the page like a product; don't caption it.** The `<title>` is the artifact's name — a short
noun phrase (2–4 words) specific to the subject, or the one question the page answers. No appended
explanation after a dash or colon; put that in the one-sentence `description`.

**Structure is information.** Numbering, eyebrows, dividers, labels should encode something true
(numbered markers only when the content really is a sequence).

**When the page is a UI (dashboard, tool).** It is scanned and operated, not read top to bottom:
summary before detail, state encoded in form as well as number (pill, chip, severity stripe),
semantic color (good/warning/critical) separate from the accent, interactive elements that look
interactive.

## Process

Decide what the viewer should be able to **do**, not just read. If the page takes input, keeps
what people change, shows live data, or asks Claude something, load the `artifact-capabilities`
skill and design around it.

Before writing, settle a compact token system and write it into the file's `:root`:
- **Color** — the palette as 4–6 named tokens.
- **Type** — font tokens for 2+ roles (a characterful display face used with restraint, a
  complementary body face, a utility face if needed).
- **Layout** — the layout concept as a one-line comment above the tokens.

Derive every color and type decision from those tokens. The plan is working material; in your
reply, one plain sentence on the direction is the most to say (no hex, no font names).

**Write, check once, publish.** You may look at the rendered page once if the session offers a
preview or screenshot; make one pass of edits for what it shows, then publish. A page whose point
is logic may get one function/syntax check. Don't loop — review happens on the live page.

## When the request is editorial

The client has rejected templated proposals and is paying for a distinctive point of view. Make
opinionated decisions and take one real aesthetic risk where it serves the work. Review the design
plan against the subject first: if any part reads like the generic default you'd produce for any
similar page, revise it in the plan before building.

- **The hero states the thesis** — open with the most characteristic thing in the subject's world
  (headline, image, live demo, interactive moment).
- **Typography sets the personality** — pair display and body faces deliberately, avoiding the
  families you'd reach for on any project; make the type treatment itself memorable.
- **Use motion deliberately** — one orchestrated moment usually beats scattered effects; too much
  motion reads as AI-generated.
- **Match complexity to the vision** — maximalist needs elaborate execution; minimal needs
  precision in spacing, type, and detail.
- **Put your boldness in one place; keep everything around it quiet.** If the accent clashes with
  the background, shift it toward an analogous hue or desaturate rather than replace it.
