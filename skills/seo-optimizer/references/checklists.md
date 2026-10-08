# SEO Checklists & Snippets

Read this when running the technical and on-page passes of an audit, or when you need a
paste-ready schema block. Everything here is white-hat and current best practice.

## On-page checklist

- [ ] **Title tag** — unique per page, ~50–60 chars, primary keyword near the front, brand at the end. One per page.
- [ ] **Meta description** — ~150–160 chars, written to earn the click (benefit + hook). Doesn't rank directly but drives CTR, which does.
- [ ] **H1** — exactly one, contains the primary topic, matches searcher intent.
- [ ] **Heading hierarchy** — H2/H3 nest logically and describe the sections; don't skip levels for styling.
- [ ] **URL slug** — short, lowercase, hyphenated, keyword-relevant, no stop-word soup or dates unless meaningful.
- [ ] **Body content** — satisfies the intent fully; scannable (short paragraphs, lists, subheads); primary keyword + natural variants present without stuffing.
- [ ] **Image alt text** — descriptive, includes keywords only where genuinely relevant; filenames are descriptive too.
- [ ] **Internal links** — the page links out to related pages and is linked to from relevant pages, with descriptive anchor text (not "click here").
- [ ] **Outbound links** — cite authoritative sources where it helps the reader.
- [ ] **Freshness** — content is current; update and re-publish stale pages rather than leaving them to decay.
- [ ] **CTA** — the page has a clear next step so ranked traffic converts.

## Technical checklist

- [ ] **Crawlability** — robots.txt doesn't block important pages; no stray `<meta name="robots" content="noindex">` on pages that should rank.
- [ ] **Indexability** — important pages are indexed (confirm in Search Console); thin/duplicate pages are consolidated or `noindex`ed deliberately.
- [ ] **Canonical tags** — each page declares a self-referencing canonical; duplicates point to the preferred URL.
- [ ] **XML sitemap** — exists, lists canonical URLs only, submitted to Search Console.
- [ ] **Server-side rendering** — primary content and links are in the initial HTML, not injected only by client JS. Check "View Source" (not just DevTools). SPAs that ship an empty root element hide content from crawlers — use SSR/SSG/prerendering.
- [ ] **Core Web Vitals** — LCP < 2.5s, INP < 200ms, CLS < 0.1. Optimize images (modern formats, sizing, lazy-load below the fold), reduce render-blocking JS/CSS, reserve space for media to avoid layout shift.
- [ ] **Mobile-friendly** — responsive, legible without zoom, tap targets spaced; Google indexes mobile-first.
- [ ] **HTTPS** — enforced sitewide; mixed-content and redirect chains cleaned up.
- [ ] **Status codes** — real 404s return 404; moved pages use 301; no redirect chains/loops; no soft 404s.
- [ ] **Structured data** — relevant JSON-LD present and valid (see snippets below); validate before shipping.
- [ ] **Pagination & faceted URLs** — handled so crawl budget isn't wasted on infinite parameter combinations.
- [ ] **hreflang** — only if the site serves multiple languages/regions.

## Local SEO (when the business serves a place)

- [ ] Google Business Profile claimed, categorized, and fully filled out.
- [ ] NAP (Name, Address, Phone) consistent across the site and directories.
- [ ] Location in title tags, H1s, and content where natural.
- [ ] `LocalBusiness` schema with address and geo.
- [ ] Reviews actively gathered and responded to.
- [ ] Location/service-area pages for each real area served (not spammy near-duplicate doorway pages).

## JSON-LD snippets (paste into `<head>` or end of `<body>`)

**Organization**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "sameAs": ["https://github.com/handle", "https://linkedin.com/company/handle"]
}
</script>
```

**LocalBusiness**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Company Name",
  "image": "https://example.com/photo.jpg",
  "url": "https://example.com",
  "telephone": "+27-00-000-0000",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Durban",
    "addressRegion": "KZN",
    "addressCountry": "ZA"
  },
  "areaServed": "Durban"
}
</script>
```

**FAQPage** (great for pages with Q&A content — can earn rich results)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How long does a project take?",
    "acceptedAnswer": { "@type": "Answer", "text": "Typically 4–12 weeks depending on scope." }
  }]
}
</script>
```

**BreadcrumbList**, **Article**, **Product**, **Service**, and **Review** schemas follow the
same pattern — pick the type that matches the page's actual content and never mark up
content that isn't visible on the page (that violates Google's structured-data guidelines).

## Keyword research without live tools

You won't always have a paid keyword tool. You can still produce a strong keyword map by:
- Reading the target page and competitors to see what terms they target.
- Expanding seed terms with modifiers: *problem* ("slow website"), *solution* ("website speed optimization"), *commercial* ("web development agency"), *local* ("...in Durban"), *comparison* ("X vs Y"), *question* ("how to...").
- Mapping each cluster to one intent and one page.
- Being explicit that exact search volumes need confirming in Google Search Console, Google Keyword Planner, or a tool like Ahrefs/Semrush — recommend the user verify before committing.
