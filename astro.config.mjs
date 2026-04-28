import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://estrellasdelsur.eu',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/portal') &&
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
          url === 'https://estrellasdelsur.eu/proyectos-coordinados/'
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
    // Old WordPress project URLs → new Astro routes
    '/el-futuro-de-andalucia-es-ahora/':        '/proyectos/el-futuro-de-andalucia-es-ahora/',
    '/e-youth-lab/':                             '/proyectos/e-youth-lab/',
    '/social-ecologic-actions/':                 '/proyectos/social-ecologic-actions/',
    '/upscale-your-skills/':                     '/proyectos/upscale-your-skills/',
    '/empowering-recognition-and-growth/':       '/proyectos/empowering-recognition-and-growth/',
    '/volunteering-at-hku/':                     '/proyectos/volunteering-at-hku/',

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
