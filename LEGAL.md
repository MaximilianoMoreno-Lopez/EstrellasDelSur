# Mantenimiento de los documentos legales

Guía para actualizar los Términos y condiciones y la Política de Privacidad
sin que se desincronice nada. Todo gira en torno a un único sitio.

## Fuente única de la versión

`src/lib/legal.js` contiene la versión legal vigente:

```js
export const LEGAL_VERSION = '2026-07-14';        // AAAA-MM-DD
export const LEGAL_VERSION_LABEL = '14 de julio de 2026';
```

Si se toca el texto legal más de una vez el mismo día, la segunda revisión lleva
sufijo (`2026-08-01.2`, `2026-08-01.3`). El `LEGAL_VERSION_LABEL` no cambia, porque
la fecha para la persona que lee sigue siendo la misma. Sin el sufijo habría dos
textos distintos compartiendo etiqueta y no se podría demostrar cuál regía.

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

En el Google Form de solicitud de proyectos hay casillas obligatorias de
aceptación. Google guarda automáticamente la marca de tiempo de cada respuesta,
así que ahí no hay que hacer nada técnico. Si se cambia el texto legal, conviene
revisar que los enlaces de las casillas sigan apuntando a `/terminos/` y `/privacidad/`.

### Textos de las casillas del formulario de inscripción

Estos son los textos vigentes. Se copian tal cual en cada convocatoria, y esta
sección es la fuente: si se cambian aquí, se cambian en el formulario, y el commit
deja constancia de qué texto se estaba usando en cada momento.

Son tres casillas, cada una como **pregunta independiente** de tipo casilla de verificación
con una sola opción. Una única pregunta con tres opciones no sirve, porque Google da por
válida la respuesta con que se marque una sola.

**Obligatorias**

1. He leído la Política de Privacidad (estrellasdelsur.eu/privacidad/) y acepto las
   condiciones de participación de esta convocatoria y del apartado 4 de los Términos y
   condiciones (estrellasdelsur.eu/terminos/#participacion), incluido lo relativo a seguro,
   salud, documentación de viaje, código ético, conducta y exención de responsabilidad.
2. Declaro que soy mayor de 18 años, que los datos facilitados son veraces, que cumplo los
   requisitos de la convocatoria y que me encuentro en condiciones de salud adecuadas para la
   actividad. Me comprometo a comunicar antes del inicio cualquier alergia, tratamiento o
   necesidad de apoyo relevante para mi seguridad. Si eres menor de edad, escríbenos antes de
   enviar la solicitud: necesitas la autorización firmada de tu madre, padre o tutor legal.

**Voluntaria** (va al final, precedida de "Esta casilla es voluntaria y no influye en la
selección")

3. Autorizo a la Asociación Cultural Estrellas del Sur a difundir las fotografías y vídeos
   de la actividad en los que aparezca, en su web, sus redes sociales, sus memorias anuales y
   los materiales de justificación del programa que financia el proyecto. La cesión es
   gratuita y sin límite territorial, mientras dure la difusión del proyecto y su
   conservación en el archivo de la asociación, y las imágenes no se ceden a terceros con
   fines comerciales. Puedo revocarla en cualquier momento escribiendo a
   paula@estrellasdelsur.eu, sin que ello afecte a los usos ya realizados.

Si en algún momento se hacen envíos de novedades por correo, hace falta una cuarta casilla,
también voluntaria, para eso. No sirve la 1.

La casilla 3 nunca se marca como obligatoria. Un consentimiento que condiciona la
participación no es libre y, por tanto, no es válido, y agruparlo con las obligatorias
arrastraría al resto. Las dos primeras sí pueden agrupar varias declaraciones, porque no son
consentimientos de tratamiento de datos sino declaraciones contractuales de la persona
solicitante.

La casilla 3 sustituye al PDF de autorización de imagen **solo para personas adultas**. El
RGPD no exige firma, sino un acto afirmativo específico, informado y demostrable, y la
casilla sin premarcar más la marca de tiempo de la respuesta lo cumplen. Se mantienen los
documentos firmados en dos casos, donde el consentimiento no lo da quien rellena el
formulario o requiere apoyos:

- Personas menores de edad: `Autorizacion_Imagen_Menores_Estrellas_del_Sur.pdf`, firmado por
  madre, padre o tutor legal.
- Personas con medidas de apoyo: `Autorizacion_Imagen_Medidas_Apoyo_Estrellas_del_Sur.pdf`.

Si alguien revoca la autorización, hay que retirar las imágenes de los canales propios y
dejar constancia de la fecha de la retirada junto al expediente del proyecto.

### Ajustes del formulario que conviene mantener

- Recopilar la dirección de correo de quien responde.
- Cabecera del formulario con la referencia de la versión legal aceptada
  (la de `src/lib/legal.js`, hoy 2026-08-01).
- Ninguna casilla premarcada.
- Al cerrar la convocatoria, descargar las respuestas y guardarlas junto al expediente
  del proyecto. El histórico de Google no es un archivo permanente.

## Checklist rápido al actualizar

- [ ] Texto editado en la página que corresponda.
- [ ] `LEGAL_VERSION` y `LEGAL_VERSION_LABEL` actualizados en `src/lib/legal.js`.
- [ ] Todo en el mismo commit, con un mensaje que describa el cambio legal.
- [ ] Si cambian las condiciones de participación, revisar los textos de las casillas
      del formulario de inscripción y actualizarlos también en el Google Form.
- [ ] `npm run build` sin errores.
- [ ] Push a `main` (GitHub Actions despliega en unos 2 minutos).
