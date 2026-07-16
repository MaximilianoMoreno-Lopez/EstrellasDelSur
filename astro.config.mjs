import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync } from 'node:fs';
import rehypeContentPictures from './scripts/rehype-content-pictures.mjs';

// Old WordPress project URLs lived at /<slug>/. The new site has them
// under /proyectos/<slug>/. Generate a redirect for every project file
// so Google (and old inbound links) land on the right page.
const projectSlugs = readdirSync('./src/content/projects')
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''));

const projectRootRedirects = Object.fromEntries(
  projectSlugs.map((slug) => [`/${slug}/`, `/proyectos/${slug}/`]),
);

export default defineConfig({
  site: 'https://estrellasdelsur.eu',
  output: 'static',
  markdown: {
    // Serve WebP + lazy-load + intrinsic dimensions for images written inline
    // in Markdown article bodies (see scripts/rehype-content-pictures.mjs).
    rehypePlugins: [rehypeContentPictures],
  },
  build: {
    // Inline all stylesheets into the HTML to avoid render-blocking <link>
    // requests on first load. CSS payload is small and GitHub Pages caches
    // for only 10 min, so the cache benefit of external CSS is minimal.
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/portal') &&
        !page.includes('/radar/') &&
        !page.includes('/equipo/') &&
        !page.endsWith('/404/'),
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        const url = item.url;
        if (url === 'https://estrellasdelsur.eu/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (
          url === 'https://estrellasdelsur.eu/proyectos/' ||
          url === 'https://estrellasdelsur.eu/noticias/'
        ) {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }
        if (
          url === 'https://estrellasdelsur.eu/sobre-nosotros/' ||
          url === 'https://estrellasdelsur.eu/voluntariado-esc/' ||
          url === 'https://estrellasdelsur.eu/contacto/' ||
          url === 'https://estrellasdelsur.eu/iniciativas-locales/' ||
          url === 'https://estrellasdelsur.eu/proyectos-coordinados/' ||
          url === 'https://estrellasdelsur.eu/destinos/' ||
          url === 'https://estrellasdelsur.eu/partners/'
        ) {
          return { ...item, priority: 0.8, changefreq: 'monthly' };
        }
        if (url.includes('/proyectos/') || url.includes('/noticias/')) {
          return { ...item, priority: 0.6, changefreq: 'monthly' };
        }
        return item;
      },
    }),
  ],
  redirects: {
    // Old WordPress project URLs at root /<slug>/ → /proyectos/<slug>/
    ...projectRootRedirects,

    // Old WP pages with no direct equivalent
    '/proyectos-erasmus/':            '/proyectos/',
    '/get-involved/':                 '/voluntariado-esc/',
    '/european-solidarity-corps-esc/':'/voluntariado-esc/',
    '/the-rythm-of-unit/':            '/proyectos/the-rythm-of-unity/',
    '/login/':                        '/portal/login/',
    '/password-reset/':               '/portal/login/',

    // Old WP project URLs without an Astro file (or with -2 / variant slugs)
    '/against-food-waste/':           '/proyectos/embrace-the-fight-against-food-waste-challenge/',
    '/referee-for-life-2/':           '/proyectos/referee-for-life/',
    '/upscale-your-skills-2/':        '/proyectos/upscale-your-skills/',

    // Removed noticias → corresponding project page (preserve indexed links)
    '/noticias/referee-for-life/':                  '/proyectos/referee-for-life/',
    '/noticias/feel-like-a-new/':                   '/proyectos/feel-like-a-new/',
    '/noticias/upscale-your-skills/':               '/proyectos/upscale-your-skills/',
    '/noticias/start-up-hub/':                      '/proyectos/startup-hub/',
    '/noticias/embrace-food-waste/':                '/proyectos/embrace-the-fight-against-food-waste-challenge/',
    '/noticias/beyond-the-fields/':                 '/proyectos/beyond-the-fields/',
    '/noticias/eco-youth/':                         '/proyectos/eco-youth/',
    '/noticias/el-futuro-de-andalucia-es-ahora/':   '/proyectos/el-futuro-de-andalucia-es-ahora/',
    '/noticias/e-youth-lab/':                       '/proyectos/e-youth-lab/',
    '/noticias/seeds/':                             '/noticias/',
  },
});
