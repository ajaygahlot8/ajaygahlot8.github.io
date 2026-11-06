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
`npm run deploy` builds and force-pushes `dist/` to the `gh-pages` branch; GitHub Pages
(Settings → Pages → Deploy from a branch: `gh-pages` / root) publishes it in about a minute.

`.github/workflows/deploy.yml` (deploy on every push to `main`) is disabled because GitHub Actions
is blocked on this account by a billing lock. Once billing is fixed:
`gh workflow enable deploy.yml` and switch Pages to Actions with
`gh api -X PUT repos/ajaygahlot8/ajaygahlot8.github.io/pages -f build_type=workflow`.

## Custom domain
1. Set `site` in `astro.config.mjs` (the only place the URL lives).
2. Add `public/CNAME` containing the domain.
3. DNS: apex `A` records to GitHub Pages IPs (or `CNAME` www → `ajaygahlot8.github.io`), then enable HTTPS in Pages settings.

## Notes
- Headshot: drop `public/me.jpg`; it appears on `/about` automatically.
- `public/og.png` (1200×630) is a screenshot of an HTML template; regenerate it if the headline changes.
- /about prints as a resume ("Download as PDF" calls `window.print()`).
