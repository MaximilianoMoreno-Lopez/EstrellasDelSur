# Estrellas del Sur — Contexto para Claude Code

## El proyecto
Sitio web estático de Estrellas del Sur, asociación juvenil de Córdoba (Erasmus+ / Cuerpo Europeo de Solidaridad).
- **Stack**: Astro 6, contenido en Markdown, deploy en GitHub Pages
- **Repo**: https://github.com/MaximilianoMoreno-Lopez/EstrellasDelSur
- **Web**: https://estrellasdelsur.eu (dominio propio activo; la antigua URL de github.io redirige con 301)
- `astro.config.mjs` tiene `site: 'https://estrellasdelsur.eu'` y ya no lleva `base`.

## URLs internas
Siempre usar `${base}/ruta/` donde `base = import.meta.env.BASE_URL.replace(/\/$/, '')`.
Aunque hoy `base` está vacío, así las rutas no se rompen si algún día vuelve a hacer falta.

## Colecciones de contenido
- `src/content/projects/*.md` — proyectos Erasmus+
- `src/content/noticias/*.md` — artículos de experiencias
- Config en `src/content.config.ts` (Astro 6 Content Layer API con `glob` loader)
- Los entries usan `.id` (no `.slug`)

## Equipo
- **Maximiliano Moreno López** — Cofundador y Presidente · maxi@estrellasdelsur.eu
- **Pablo Sánchez Ruiz** — Cofundador · pablo@estrellasdelsur.eu (fue Secretario hasta el 16/08/2026; sigue como administrador del portal)
- **Paula Arroyo** — International Project Manager · paula@estrellasdelsur.eu

Junta Directiva desde la Asamblea del 16/08/2026: Maximiliano Moreno López (Presidencia),
Ángel González Ruiz (Vicepresidencia), Ane Bados Gil (Secretaría) y Cristina Peralbo
Villamandos (Tesorería). La web (transparencia) aún muestra la composición anterior.

## Documentos legales
Al actualizar Términos o Privacidad, subir siempre `LEGAL_VERSION` en `src/lib/legal.js`
en el mismo commit que el cambio de texto. Proceso completo en [`LEGAL.md`](LEGAL.md).

## Identidad
- CIF: G02811461 · OID: E10264295 · PIC: 892239563
- Sede social: Avda. Guerrita 14, 1ª pl., local 3A, 14005 Córdoba
- Colores: navy `#0a1628`, teal `#0d9488`, gold `#f59e0b`
- Logo: `public/images/logo.svg` (SVG sin fondo)
- OG image: `public/og-image.png`

## Imágenes
`npm run build` ejecuta antes `scripts/generate-webp.mjs`, que crea junto a cada JPG/PNG de
`public/images` su `.webp` y su `-card.webp`, y un `-og.jpg` de 1200x630 para cada portada de
proyecto (`image`) y de noticia (`cover`), que es la imagen de la vista previa al compartir.
Las imágenes metidas como HTML en el Markdown (`<img>` en galerías) no pasan por el plugin
de WebP: hay que apuntarlas a mano al `-card.webp`.

## Deploy
Push a `main` → GitHub Actions construye y despliega automáticamente (~2 min).

## Cambios programados
Para abrir o cerrar una convocatoria en una fecha futura sin estar delante:
añadir una entrada en `scripts/programados.json` (slug, `cuando` en ISO con
zona horaria, y los `campos` del frontmatter a cambiar). El workflow
`programados.yml` corre cuatro veces al día, a las 05:05, 06:00, 09:25 y 11:05 UTC
(07:05, 08:00, 11:25 y 13:05 en España en verano; una hora antes en invierno),
aplica lo que toque, commitea y despliega. Probar en local con
`node scripts/aplicar-programados.mjs --simulacro`.

La publicación es "a partir de" y no al segundo, porque GitHub puede
retrasar los cron cuando hay cola. Conviene poner `cuando` un poco antes
de la hora a la que se quiere abrir y siempre después del pase anterior,
para que no se adelante.
