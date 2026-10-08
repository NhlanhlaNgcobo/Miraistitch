---
name: motion-design-film
description: "Render motion-design VIDEO from pure code — HTML + Playwright + ffmpeg, no After Effects and no Remotion licence. Use only when the deliverable is an actual video file (launch film, product film, social clip, logo sting, LinkedIn loop) or a frame-locked remake of an existing video. NOT for website motion — for that use premium-motion-site, which already extracts this skill's transferable craft into references/anti-ai-motion.md."
---

# Motion design, 100% code — film pipeline

Harvested from [claude-motion-design](https://github.com/howseen-ai/claude-motion-design) by Raphaël Aubry / Howseen AI. MIT.

**This is a video tool.** It computes every frame from time, screenshots it with Playwright, blends subframes for motion blur, and encodes to MP4 with ffmpeg — cut to the beat of the music, with sound effects placed on measured peaks.

## Read this first — what you probably want instead

If you are building a **website**, you want **[`../premium-motion-site/SKILL.md`](../premium-motion-site/SKILL.md)**, not this. The genuinely transferable craft from this skill — the anti-"AI motion" rules, spring presets, the silent one-sentence test, the critique loop, the honesty rules — has already been extracted and web-adapted into:

→ **[`../premium-motion-site/references/anti-ai-motion.md`](../premium-motion-site/references/anti-ai-motion.md)**

Use *this* skill only when the output is a real video file.

## The full upstream skill

[`FILM-SKILL.md`](FILM-SKILL.md) — the complete 34 KB skill, unmodified. Contents:

| § | Covers |
| --- | --- |
| 0 | Non-negotiables — zero fabrication, "Example data" labels, true captions |
| 1 | Flow: inputs → beat map → 4 stills approved → full render → pop scan → audio → mux |
| 2 | The engine — one HTML file, `window.seek(t)` only, closed-form springs, camera keyed in log space, shared-element handoffs, masked text, floods, glass/goo/iris/cube/beam effects |
| 3 | Render — Playwright, draft pass, subframes on a 180° shutter, BT.709, pop detection |
| 4 | Music & SFX — find the real drop by band energy, place SFX by measured peak, −14 LUFS |
| 5 | Assets — free sources only (Mixkit, Pexels, Unsplash, svgl, simple-icons) |
| 6 | Gotchas, all hit for real |
| 7 | Delivery checklist |
| 8 | **Critique loop** — contact sheets, score 1–10, fix only ≤7, repeat until 8+ |
| 9 | Extra rules — determinism, spring presets, formats, synthesized SFX |
| 9b | **Studio conventions + director's brief + anti-"AI motion" rules + prompt library + diagnostic table** |
| 9c | Techniques borrowed from other public motion skills (including HyperFrames) |
| 9d | From YouTube walkthroughs — B-roll, VO pipeline, brand intake, "fight the fingerprint" |
| 10 | Remake mode — frame-locked 1:1 copy of an existing video |
| 11 | Product film mode — 45–75 s homepage SaaS film |

The sections worth reading even if you never render a video: **9b** and **8**. That's where the taste is.

## Scripts (`scripts/`)

Video-only. All require Python + Playwright + ffmpeg:

```bash
pip install playwright imageio-ffmpeg numpy pillow && python -m playwright install chromium
```

| Script | Does |
| --- | --- |
| `render_template.py` | Frame-by-frame Playwright render, subframe motion blur, pop/loop scans |
| `audio_template.py` | Music + SFX placement, two-pass loudnorm to −14 LUFS |
| `analyze_song.py` | Find the real drop by band energy |
| `mixkit_sfx_search.py`, `svgl_logos.py` | Free asset search / download |
| `mcp21_client.py` | 21st.dev component client |
| `remake/` | Frame-locked remake: extract frames, detect cuts, shot-by-shot spec, split-screen compare |

To install this as a standalone Claude Code skill, copy this directory to `~/.claude/skills/motion-design/` and rename `FILM-SKILL.md` back to `SKILL.md` (it was renamed here so it doesn't compete with this router).

## Provenance

| | |
| --- | --- |
| Upstream | https://github.com/howseen-ai/claude-motion-design |
| Pinned commit | `3d90d349ef3fdde9b7e89de4df4a2159c9e8697f` |
| Commit date | 2026-10-02 |
| Licence | MIT — [`UPSTREAM-LICENSE.txt`](UPSTREAM-LICENSE.txt) · © 2026 Howseen AI (Raphaël Aubry) |
| Harvested | 8 October 2026 |
| Upstream README | [`UPSTREAM-README.md`](UPSTREAM-README.md) |

**Deliberately not harvested:**

- `examples/howseen-launch/preview.gif` — 4.18 MB, a GIF preview of the example video. Nearly all of the repo's weight for no reference value.
- `examples/howseen-launch/assets/logo-mark.png` — the Howseen brand mark. Upstream states it "belongs to Howseen AI", so it is not ours to redistribute.
- The rest of `examples/howseen-launch/` (`film.html`, `render.py`, `audio.py`, `fetch_assets.py`) — a complete video composition that depends on both of the above plus downloaded third-party media.

Third-party media that upstream's `fetch_assets.py` downloads stays under its own licence (Mixkit free licence, Pexels/Unsplash, OFL for Geist). Nothing of it is vendored here.

The code and `FILM-SKILL.md` are MIT and **unmodified**. Changes made: `SKILL.md` → `FILM-SKILL.md`, `README.md` → `UPSTREAM-README.md`, `LICENSE` → `UPSTREAM-LICENSE.txt`, this router added, and a clearly-marked note prepended to `UPSTREAM-README.md` explaining that its `examples/` references don't resolve here (everything below that note is verbatim).

## Worth noting

§9c of the upstream skill explicitly credits **HyperFrames** for several techniques (GSAP/WAAPI seeking, targeted blur, cut seams, caption rules), and §9b lists HyperFrames and Remotion as alternative routes. So this skill and [`../hyperframes-motion/`](../hyperframes-motion/SKILL.md) are aware of each other and partly cross-pollinated — which is why their independent agreement on overshoot being the giveaway is still meaningful, but their agreement on *seeking technique* is not independent.
