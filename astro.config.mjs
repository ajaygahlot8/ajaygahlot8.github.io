// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Custom domain later: change this one line (plus public/CNAME, see README).
  site: 'https://ajaygahlot8.github.io',
  output: 'static',
  // Recruiters type /resume; /about is the print-ready resume.
  redirects: { '/resume': '/about/' },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false, // colours come from --shiki-* vars, picked in global.css
    },
  },
});
