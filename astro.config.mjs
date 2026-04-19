import { defineConfig } from 'astro/config';

export default defineConfig({
  // Mientras no haya dominio propio, el site vive en el subdirectorio del repo.
  // Cuando estrellasdelsur.eu esté configurado, cambiar a:
  //   site: 'https://estrellasdelsur.eu'
  //   (y eliminar la línea base)
  site: 'https://maximilianomoreno-lopez.github.io/EstrellasDelSur',
  base: '/EstrellasDelSur',
  output: 'static',
});
