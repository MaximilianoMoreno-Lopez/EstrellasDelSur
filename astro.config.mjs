import { defineConfig } from 'astro/config';

export default defineConfig({
  // En GitHub Pages sin dominio propio, el site vive en un subdirectorio.
  // Las variables SITE y BASE las inyecta el workflow automáticamente.
  // En local (npm run dev) se usan los valores por defecto.
  site: process.env.SITE ?? 'https://estrellasdelsur.eu',
  base: process.env.BASE,
  output: 'static',
});
