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
- Colores: navy `#0a1628`, teal `#0d9488`, gold `#f59e0b`. Para **texto** turquesa sobre fondo claro usar `var(--teal-text)` (`#0f766e`, 5,5:1); `--teal` solo para fondos, bordes e iconos
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

## Redacción de solicitudes (/redaccion/)
Página interna del portal (solo miembros de la tabla `equipo`, admins y becarios)
para redactar solicitudes Erasmus+ con las preguntas literales del portal oficial y
un contador por respuesta. Las preguntas, tipos y topes de KA152, KA153, KA154,
KA210 y KA220 están en `src/lib/formularios/<accion>.json` y el editor es genérico
sobre esa estructura (`src/lib/formularios.mjs` documenta la forma). Si el portal
cambia una pregunta, se edita el JSON. Las fuentes de cada pregunta y las dudas
pendientes están fuera del repo, en `borradores/fuentes/formularios/`, porque citan
expedientes de otras entidades. Los borradores se guardan en la tabla `borradores`
de Supabase (`scripts/sql/2026-10-27-redaccion.sql`) y se exportan al markdown
que leen las herramientas de la skill `redaccion-proyectos` (`###` por pregunta).
`scripts/borrador.mjs` crea, baja y sube borradores desde Claude Code con la cuenta del
portal (`PORTAL_EMAIL` y `PORTAL_PASSWORD` en `.env.local`) y deja comentarios por
pregunta que se ven en el editor. Lo que Claude redacta o revisa para esas cinco acciones
va a la web (`plantilla` y `crear` para uno nuevo, `bajar`, `comentar`, `notas` y `subir`
para revisar); el flujo está en la sección "La web es el sitio de trabajo" de la skill.

Comentarios e historial (`scripts/sql/2026-11-12-redaccion-comentarios-versiones.sql`):
cada pregunta tiene un botón "Comentar" que guarda en la tabla `borrador_comentarios`
(con autor, cita del fragmento seleccionado, respuestas y "resuelto"), aparte de las
respuestas, así que comentar nunca toca el texto ni provoca conflictos de guardado.
La tabla `borrador_versiones` la rellena un trigger del servidor antes de cada cambio
(sesión nueva, cada 10 min o cambio grande) y antes de borrar un borrador; desde
"Historial" se compara cualquier copia con lo actual y se recupera pregunta a pregunta.
Las versiones no se editan ni se borran desde la web. Los avisos de estilo bajo cada
respuesta (`avisosRedaccion` en `formularios.mjs`) son las comprobaciones baratas de
`comprobacion_mecanica.py` de la skill; si cambia una, cambiar las dos. Los fragmentos
citados en comentarios abiertos se marcan en ámbar con una capa detrás del textarea
(`pintarMarcas`), que copia sus estilos de texto: si cambia el estilo del textarea, revisar
que la marca sigue cayendo encima. Responsables de cada borrador en la tabla
`borrador_responsables` (`scripts/sql/2026-11-12-redaccion-responsables.sql`), aparte de
`borradores` para que asignar desde la lista no provoque conflictos de guardado; la lista
filtra por "Asignados a mí" y "Sin asignar".

## Facturas (/facturas/)
Página interna (solo miembros de la tabla `equipo`) para hacer facturas y sacarlas en PDF
con "Imprimir". Hay una sola serie (no hay notas de cargo). El HTML de la factura lo genera
`src/lib/factura.mjs` (emisor, IBAN, socias habituales en `CLIENTES` y la nota de IVA del
traspaso de subvención) y los estilos están en `src/styles/factura.css`. Mientras no se
emite, la factura es un borrador sin número en el `localStorage`. Al pulsar "Emitir", la
función `emitir_factura` de Supabase le da el siguiente número con un bloqueo, para que
dos personas no se pisen, y la guarda en la tabla `facturas`
(`scripts/sql/2026-11-04-facturas.sql`). Las emitidas salen en un listado, se abren, se
editan con el mismo número y se reimprimen; un admin puede borrar solo la última.

## Cambios programados
Para abrir o cerrar una convocatoria en una fecha futura sin estar delante:
añadir una entrada en `scripts/programados.json` (slug, `cuando` en ISO con
zona horaria, y los `campos` del frontmatter a cambiar). El workflow
`programados.yml` corre seis veces al día, a las 05:05, 06:00, 09:25, 11:05, 22:59 y 23:30 UTC
(07:05, 08:00, 11:25, 13:05, 00:59 y 01:30 en España en verano; una hora antes en invierno,
así que en invierno el de las 22:59 UTC cierra los plazos "hasta las 23:59" y el de las 23:30 es de reserva),
aplica lo que toque, commitea y despliega. Probar en local con
`node scripts/aplicar-programados.mjs --simulacro`.

La publicación es "a partir de" y no al segundo, porque GitHub puede
retrasar los cron cuando hay cola. Conviene poner `cuando` un poco antes
de la hora a la que se quiere abrir y siempre después del pase anterior,
para que no se adelante.
