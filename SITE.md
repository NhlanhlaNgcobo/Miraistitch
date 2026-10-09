# MiraiStitch — frontend

Marketing frontend for **MiraiStitch**, a South African ecommerce platform for any product
category — electronics, furniture, fashion, groceries and everything between. Static, no build
step, no dependencies.

## Files
- `index.html` — the page
- `styles.css` — the design system + components
- `app.js` — nav, reveal, and the monthly/annual pricing toggle

## Design system
- **Palette:** porcelain `#F7F5F2`, stone-ink `#1C1917`, refined gold `#A16207` (dark-bg gold `#D9A94E`).
- **Type:** Cormorant (display serif) + Hanken Grotesk (body) via Google Fonts.
- **Signature:** the "stitch" — a gold dashed seam used as dividers and heading underlines.
- Accessible contrast, visible focus, reduced-motion honoured, responsive 375 → 1440.

## Run locally
Open `index.html`, or:
```bash
npx serve .
```

## Deploy
Static — deploys to Vercel as-is (`npx vercel`), or import the repo in the Vercel dashboard.

## Notes
- Pricing (R0 / R290 / R690) and the testimonial are **placeholders** — swap for real figures and a real quote before launch.
- Nav/footer links are stubs; wire them to real pages (or the app) when those exist.
