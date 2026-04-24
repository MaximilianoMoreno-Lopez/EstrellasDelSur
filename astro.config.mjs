import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// ── Domain switch checklist ──────────────────────────────────────────────────
// When estrellasdelsur.eu DNS is pointing here:
//   1. Change site to 'https://estrellasdelsur.eu'
//   2. Remove the base line entirely (GitHub Pages custom domain = root path)
// ────────────────────────────────────────────────────────────────────────────
export default defineConfig({
  site: 'https://maximilianomoreno-lopez.github.io/EstrellasDelSur',
  base: '/EstrellasDelSur',
  output: 'static',
  integrations: [sitemap()],
});
