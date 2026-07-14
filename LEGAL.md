# Mantenimiento de los documentos legales

Guía para actualizar los Términos y condiciones y la Política de Privacidad
sin que se desincronice nada. Todo gira en torno a un único sitio.

## Fuente única de la versión

`src/lib/legal.js` contiene la versión legal vigente:

```js
export const LEGAL_VERSION = '2026-07-14';        // AAAA-MM-DD
export const LEGAL_VERSION_LABEL = '14 de julio de 2026';
```

Ese número se propaga solo a dos sitios, sin tocar nada más:

1. La página `/terminos/` muestra "Versión AAAA-MM-DD" (lee la constante).
2. El registro del portal (`src/pages/portal/registro.astro`) guarda esa versión
   en los metadatos del usuario de Supabase (`legal_version`) cuando alguien acepta.

Por eso basta con cambiar la constante en un sitio.

## La regla de oro

Cada vez que cambies el TEXTO legal de forma relevante:

1. Edita el contenido en `src/pages/terminos.astro` o `src/pages/privacidad.astro`.
2. Sube la fecha en `src/lib/legal.js` (`LEGAL_VERSION` y `LEGAL_VERSION_LABEL`).
3. Haz los dos cambios en el MISMO commit.

Si cambias el texto pero no subes la fecha, no habrá forma de distinguir dos
versiones distintas, y se pierde la prueba de qué estaba vigente.

## Cómo se demuestra qué términos estaban vigentes

Tres piezas encajan:

1. Cada usuario tiene guardado en Supabase qué `legal_version` aceptó y cuándo
   (`accepted_at`), sellado con el `created_at` de su cuenta.
2. Esa versión la fija `src/lib/legal.js`, versionado en git.
3. El commit de git de esa versión, con su fecha y hash en GitHub, prueba
   palabra por palabra qué decía el texto ese día.

Para consultar una aceptación: panel de Supabase, Authentication, Users, abrir el
usuario y mirar "Raw User Meta Data" (`legal_version`, `accepted_at`).

## Documentos legales y sus fuentes

| Documento | Fuente | Publicado en |
|-----------|--------|--------------|
| Términos y condiciones | `src/pages/terminos.astro` | `/terminos/` |
| Política de Privacidad | `src/pages/privacidad.astro` | `/privacidad/` |
| Consentimiento y exención de menores | `scripts/consentimiento-menores.html` | `public/docs/Consentimiento_Participacion_Menores_Estrellas_del_Sur.pdf` |

Los PDF del portal (incluida la plantilla de menores) se generan desde el HTML de
`scripts/` con Chrome headless. El comando y las rutas están anotados en la memoria
del proyecto (pipeline de documentos).

## Aceptación fuera del portal (Google Form)

En el Google Form de solicitud de proyectos hay una casilla obligatoria de
aceptación. Google guarda automáticamente la marca de tiempo de cada respuesta,
así que ahí no hay que hacer nada técnico. Si se cambia el texto legal, conviene
revisar que el enlace de la casilla siga apuntando a `/terminos/` y `/privacidad/`.

## Checklist rápido al actualizar

- [ ] Texto editado en la página que corresponda.
- [ ] `LEGAL_VERSION` y `LEGAL_VERSION_LABEL` actualizados en `src/lib/legal.js`.
- [ ] Todo en el mismo commit, con un mensaje que describa el cambio legal.
- [ ] `npm run build` sin errores.
- [ ] Push a `main` (GitHub Actions despliega en unos 2 minutos).
