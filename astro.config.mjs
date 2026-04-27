import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://estrellasdelsur.eu',
  output: 'static',
  integrations: [sitemap()],
  redirects: {
    // Old WordPress project/noticia URLs → new Astro routes
    '/el-futuro-de-andalucia-es-ahora/':        '/noticias/el-futuro-de-andalucia-es-ahora/',
    '/e-youth-lab/':                             '/proyectos/e-youth-lab/',
    '/social-ecologic-actions/':                 '/proyectos/social-ecologic-actions/',
    '/upscale-your-skills/':                     '/proyectos/upscale-your-skills/',
    '/empowering-recognition-and-growth/':       '/proyectos/empowering-recognition-and-growth/',
    '/volunteering-at-hku':                      '/proyectos/volunteering-at-hku/',
    '/volunteering-at-hku/':                     '/proyectos/volunteering-at-hku/',
  },
});
