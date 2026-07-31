# Expediente del Plan de Igualdad 2026-2030

Documentos de trabajo del Plan de Igualdad de la Asociación Cultural Estrellas del Sur.
Ninguno está firmado ni inscrito todavía.

## Documentos

| Fichero | Fuente | Uso |
|---|---|---|
| `Plan_Igualdad_2026-2030_BORRADOR.pdf` | `scripts/plan-igualdad.html` | El plan, 47 páginas y 35 medidas. Publicable e inscribible en REGCON |
| `Plan_Igualdad_Cuaderno_BORRADOR.pdf` | `scripts/plan-igualdad-cuaderno.html` | 11 modelos del expediente negociador, instrumentos de diagnóstico y apéndice de inscripción. Interno |
| `modelos/*.pdf` | `scripts/modelos/*.html` | Los 11 modelos como documentos independientes, uno por fichero, listos para firmar. Fuera del control de versiones |

El cuaderno es el manual y por eso lleva los documentos de identidad enmascarados como `[DNI]`.
Los documentos independientes de `modelos/` son los que se firman y sí van cumplimentados, así que
**no se versionan**. Si regeneras `scripts/modelos/` a partir del cuaderno perderás los datos ya
cumplimentados: las copias locales de `scripts/modelos/` son las buenas.

El registro retributivo y la auditoría retributiva **no están en este repositorio**, porque contienen
retribuciones individualizables y el repositorio es público. Viven en `scripts/registro-retributivo.html`
y en `borradores/INTERNO_Registro_Retributivo_Auditoria.pdf`, ambos excluidos por `.gitignore`.
No los añadas al control de versiones ni los subas al portal.

## DNI en el historial: resuelto

El expediente llegó a contener tres documentos de identidad en
`scripts/plan-igualdad-cuaderno.html` y, por arrastre, en el PDF generado a partir de él. Como el
repositorio es público y ninguno de los commits se había subido, se reescribieron los diez commits
locales del Plan de Igualdad para enmascararlos como `[DNI]`, y se purgaron los objetos antiguos.

- El árbol final quedó **idéntico** al de antes de la reescritura, comprobado con `git diff`.
- El PDF del cuaderno, que es un artefacto generado y no se podía reescribir por commit, se sustituyó
  en todos ellos por la versión ya enmascarada. Es la única divergencia respecto del historial previo.
- Comprobación final sobre los 1.081 blobs del repositorio, incluyendo el texto extraído de cada PDF:
  ninguno contiene un documento de identidad.

Los documentos que sí van cumplimentados viven en `scripts/modelos/` y `borradores/modelos/`, ambos
excluidos por `.gitignore`. **No los añadas al control de versiones.**

## Cómo regenerar los PDF

Con Chrome headless y rutas absolutas estilo Windows, según el pipeline documentado en `LEGAL.md`:

```
chrome --headless=new --disable-gpu --no-pdf-header-footer \
  --user-data-dir=<temp-unico> \
  --print-to-pdf=C:/.../borradores/<salida>.pdf \
  C:/.../scripts/<entrada>.html
```

## Estado y decisiones tomadas

- **Naturaleza.** Plan voluntario. No se alcanza el umbral de 50 personas del art. 45.2 de la LO 3/2007
  y el convenio no lo impone. Su inscripción sí es obligatoria por el art. 11.1 del RD 901/2020.
- **Convenio.** IV Convenio colectivo marco estatal de ocio educativo y animación sociocultural,
  código 99100055012011, BOE de 11/03/2026. Jornada de 1.742 h anuales y 38 h 30 min semanales.
- **Comisión negociadora.** Por la entidad, Pablo Sánchez Ruiz y María Granados Villar, persona socia
  y titulada en Trabajo Social. Ninguna con relación laboral, composición equilibrada.
- **Calendario del proceso.** Convocatoria a CC.OO., UGT y USO. Plazo de respuesta hasta el 21/08/2026
  y sesión constitutiva el 31/08/2026 a las 10:00 por Google Meet, con alternativa presencial.
- **Auditoría retributiva.** Sin brecha de género. Las tres personas perciben la misma retribución
  equiparada a jornada completa.
- **Diagnóstico y auditoría** van dentro del texto del plan, de modo que serán públicos al inscribirlo.
  Los importes no, están solo en el documento interno.

## Pendiente antes de firmar

1. Confirmar el DNI de María Granados Villar. En el modelo 1 figuraba `31027729Q`, dato que llegó por
   otra vía y no está verificado, así que se ha dejado como `[DNI]` en el cuaderno. Hay que
   confirmarlo antes de firmar el acta, porque es quien presenta en REGCON.
2. Convocar a las tres organizaciones sindicales. Plazo de respuesta hasta el 21/08/2026 y sesión
   constitutiva el 31/08/2026, según el modelo 3 del cuaderno. El modelo 2, declaración responsable de
   inexistencia de representación legal, queda cumplimentado y con pie de firma electrónica, listo para
   firmar con certificado digital y adjuntar a las tres convocatorias.
3. No hace falta solicitar un certificado nuevo al CMAC. Ni el Real Decreto 901/2020 ni REGCON lo exigen,
   y la legitimación de CC.OO., UGT y USO consta por dos vías, el certificado ya obtenido y la parte
   expositiva de la Resolución de 25 de febrero de 2026 que publica el convenio de ocio educativo, donde
   figuran como organizaciones firmantes. Basta una nota en el expediente citando ambas fuentes.
4. Consultar a la Comisión Paritaria del convenio, C/ Albasanz 3, 2ª planta, 28037 Madrid, la adscripción
   al ámbito funcional, el encuadramiento de los tres puestos y si corresponde la tabla A o la tabla B.
5. Corregir las dos incidencias de la auditoría: el coeficiente de parcialidad calculado sobre 40 h en
   lugar de 38,5 h, y los grupos de cotización distintos con la misma categoría.
6. Regularizar la cláusula octava de los tres contratos, que declara la inexistencia de convenio.
7. Decidir la adecuación a las tablas salariales del convenio.
8. Unificar el código postal, 14004 o 14005, y rectificar el contrato que sitúa el centro de trabajo en
   la calle Isla Gomera 25 cuando la nómina lo sitúa en la Avenida Guerrita.
9. Cumplimentar la fecha de firma y suprimir la fila de estado de borrador de la ficha técnica.

## Al publicar

El PDF que se enlaza desde `/transparencia/` es `public/docs/Plan_Igualdad_Estrellas_del_Sur.pdf`.
Sustituirlo por la versión firmada y actualizar la descripción en `src/pages/transparencia.astro`,
donde hoy figura el texto del plan anterior.
