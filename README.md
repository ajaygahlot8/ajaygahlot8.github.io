# ajaygahlot8.github.io

Personal site: Astro (static), plain CSS, ~2 KB of JS. Posts are Markdown.

## Run locally
```sh
npm install
npm run dev        # http://localhost:4321
npm run build && npm run preview
```

## Add a post
Create `src/content/blog/<slug>.md`:
```yaml
---
title: "…"
description: "1–2 sentences, used for SEO and the list"
pubDate: 2026-11-07
tags: ["hermes"]
draft: false      # true hides it from production
---
```
Body headings start at `##`. Put assets in `public/blog/<slug>/` and reference them as `/blog/<slug>/file`.

## Deploy
Push to `main`; `.github/workflows/deploy.yml` builds and publishes to GitHub Pages
(repo Settings → Pages → Source: GitHub Actions).

## Custom domain
1. Set `site` in `astro.config.mjs` (the only place the URL lives).
2. Add `public/CNAME` containing the domain.
3. DNS: apex `A` records to GitHub Pages IPs (or `CNAME` www → `ajaygahlot8.github.io`), then enable HTTPS in Pages settings.

## Notes
- Headshot: drop `public/me.jpg`; it appears on `/about` automatically.
- `public/og.png` (1200×630) is a screenshot of an HTML template; regenerate it if the headline changes.
- /about prints as a resume ("Download as PDF" calls `window.print()`).
