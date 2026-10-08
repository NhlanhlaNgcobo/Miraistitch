---
name: seo-optimizer
description: >-
  Audit and improve the search performance of a website, landing page, or web app.
  Use this whenever the user mentions SEO, search rankings, organic traffic, keywords
  or keyword research, meta titles/descriptions, on-page optimization, technical SEO,
  Core Web Vitals / page speed as it affects ranking, schema / structured data,
  internal linking, content strategy for search, "why isn't my site ranking", getting
  found on Google, or optimizing a page/site for a specific search term. Trigger it
  even when the user doesn't say the word "SEO" but clearly wants more organic traffic,
  better rankings, or to be discoverable in search — e.g. "how do I get my studio site
  to show up when people search for X" or "rewrite these meta tags". Prefer this skill
  over ad-hoc advice because it runs a structured audit and returns prioritized,
  implementation-ready recommendations instead of generic tips.
---

# SEO Optimizer

Your job is to move a page or site up the search results in a way the user can actually
ship. Vague advice ("write quality content", "get backlinks") is worthless — every
recommendation you give should be specific, prioritized by impact vs. effort, and
concrete enough to implement today.

## How to work

### 1. Establish the target before auditing
Don't optimize in a vacuum. Quickly pin down:
- **The URL / page** in question (fetch it if a URL is given — real HTML beats assumptions).
- **The business & audience**: what they sell, to whom, where (local SEO changes everything — a Durban studio ranking for "web developer Durban" is a different game than global SaaS keywords).
- **The goal**: rank for specific terms, grow organic traffic generally, fix a drop, or win a local market.
- **The stack** if relevant: SSR frameworks (Next.js, etc.) render differently to crawlers than SPAs — a client-only React app that ships an empty `<div id="root">` is an SEO problem by itself.

If a URL is provided, fetch and read the real page. Inspect the `<title>`, meta description, heading structure, body copy, image alt text, links, and whether content is server-rendered. Audit what's there, not what you imagine is there.

### 2. Run the audit across four layers
Work through these in order. Read `references/checklists.md` for the full technical and on-page checklists and ready-to-paste schema snippets.

**Intent & keywords (the foundation).** Search ranking starts with matching *intent*. For each target topic, identify the dominant intent (informational / navigational / commercial / transactional) and the realistic keywords — including long-tail and local modifiers — the audience actually types. Cluster related keywords into one page each; don't try to rank one page for everything. Flag keyword cannibalization (two pages competing for the same term). Favor terms where the user can realistically compete, not just high-volume head terms dominated by giants.

**On-page.** Title tag (unique, ~50–60 chars, primary keyword near the front, brand at the end), meta description (compelling, ~150–160 chars, written to earn the click — it doesn't rank but it drives CTR), one clear `<h1>`, logical `<h2>/<h3>` hierarchy that mirrors the content, keyword-relevant URL slug, descriptive image `alt` text, internal links to and from the page with descriptive anchor text, and content that genuinely satisfies the intent (depth, freshness, scannability).

**Technical.** Crawlability (robots.txt, no accidental `noindex`), indexability, canonical tags, XML sitemap, server-side rendering of primary content, Core Web Vitals (LCP, INP, CLS), mobile-friendliness, HTTPS, structured data (JSON-LD), and clean status codes (no soft 404s, redirect chains). See the checklist for the full list.

**Authority & content strategy (off-page + ongoing).** E-E-A-T signals (experience, expertise, authoritativeness, trust — author bylines, credentials, real address, reviews), backlink profile and realistic link-earning angles, and a content plan built around topic clusters with a pillar page linking to supporting pages.

### 3. Deliver a prioritized report
Lead with the handful of changes that will move the needle most, not an exhaustive dump. Use this structure:

```
# SEO Audit — [page/site]
## Summary
2–3 sentences: current state, biggest opportunity, expected direction of impact.

## Priority fixes (do these first)
A short ranked list. For each: what to change, the exact new value where you can give
one (e.g. the rewritten title tag), why it matters, and effort (Low/Med/High).

## Keyword & intent map
Target keyword clusters → the page that should own each, with primary + secondary terms
and the intent behind them.

## On-page recommendations
Per element, current → recommended. Give the actual rewritten title tags, meta
descriptions, and H1s rather than describing them.

## Technical findings
Issues found, grouped, each with the fix. Include paste-ready schema/JSON-LD where useful.

## Content & authority plan
Topic clusters to build, link-earning angles, E-E-A-T gaps to close.

## Measurement
Which metrics and tools to watch (Search Console queries/impressions/CTR/position,
GA4 organic sessions, Core Web Vitals) so progress is verifiable.
```

## Principles that keep the advice honest
- **Write the actual artifact.** When you recommend a new title tag, meta description, H1, or schema block, produce the finished text/code — don't say "write a compelling title". The value is in the specifics.
- **Match ambition to the site's reality.** A new site won't outrank an established competitor for a head term in a month. Point toward winnable long-tail and local terms first, and say so plainly.
- **Never promise rankings or invent data.** You can't guarantee position 1, and you don't have live rank/volume numbers. Be clear about what's a best-practice certainty vs. an estimate, and recommend the tools (Search Console, a keyword tool) that would confirm volumes.
- **No manipulation.** Recommend only white-hat tactics. Never suggest keyword stuffing, cloaking, link schemes/buying links, doorway pages, or hidden text — they get sites penalized and burn trust.
- **Respect intent over tricks.** The durable win is a page that answers the searcher's question better than the competition. Most technical fixes just remove obstacles to that.

If the user wants, offer to implement the changes directly (edit the HTML/metadata/schema) rather than only recommending them.
