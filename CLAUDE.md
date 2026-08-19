# Estrellas del Sur — Contexto para Claude Code

## El proyecto
Sitio web estático de Estrellas del Sur, asociación juvenil de Córdoba (Erasmus+ / Cuerpo Europeo de Solidaridad).
- **Stack**: Astro 6, contenido en Markdown, deploy en GitHub Pages
- **Repo**: https://github.com/MaximilianoMoreno-Lopez/EstrellasDelSur
- **Web actual**: https://maximilianomoreno-lopez.github.io/EstrellasDelSur/
- **Dominio futuro**: https://estrellasdelsur.eu (CNAME ya configurado)

## Cuando el dominio esté activo
En `astro.config.mjs` cambiar:
```js
site: 'https://estrellasdelsur.eu'  // cambiar
// base: '/EstrellasDelSur'         // eliminar esta línea
```

## URLs internas
Siempre usar `${base}/ruta/` donde `base = import.meta.env.BASE_URL.replace(/\/$/, '')`.

## Colecciones de contenido
- `src/content/projects/*.md` — proyectos Erasmus+
- `src/content/noticias/*.md` — artículos de experiencias
- Config en `src/content.config.ts` (Astro 6 Content Layer API con `glob` loader)
- Los entries usan `.id` (no `.slug`)

## Equipo
- **Maximiliano Moreno López** — Cofundador y Presidente · maxi@estrellasdelsur.eu
- **Pablo Sánchez Ruiz** — Cofundador y Vicepresidente · pablo@estrellasdelsur.eu
- **Paula Arroyo** — International Project Manager · paula@estrellasdelsur.eu

## Documentos legales
Al actualizar Términos o Privacidad, subir siempre `LEGAL_VERSION` en `src/lib/legal.js`
en el mismo commit que el cambio de texto. Proceso completo en [`LEGAL.md`](LEGAL.md).

## Identidad
- CIF: G02811461 · OID: E10264295 · PIC: 892239563
- Sede social: Avda. Guerrita 14, 1ª pl., local 3A, 14005 Córdoba
- Colores: navy `#0a1628`, teal `#0d9488`, gold `#f59e0b`
- Logo: `public/images/logo.svg` (SVG sin fondo)
- OG image: `public/og-image.png`

## Deploy
Push a `main` → GitHub Actions construye y despliega automáticamente (~2 min).

## Cambios programados
Para abrir o cerrar una convocatoria en una fecha futura sin estar delante:
añadir una entrada en `scripts/programados.json` (slug, `cuando` en ISO con
zona horaria, y los `campos` del frontmatter a cambiar). El workflow
`programados.yml` corre dos veces al día, a las 05:05 y a las 11:05 UTC
(07:05 y 13:05 en España en verano), aplica lo que toque,
commitea y despliega. Probar en local con
`node scripts/aplicar-programados.mjs --simulacro`.
