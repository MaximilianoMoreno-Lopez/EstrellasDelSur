// Formularios de solicitud Erasmus+ que replica el editor de /redaccion/.
//
// Las preguntas literales, su orden, sus tipos y sus topes de caracteres
// están en src/lib/formularios/<accion>.json, extraídos de solicitudes
// exportadas del portal y de los formularios oficiales publicados por las
// agencias. Las fuentes de cada pregunta y las dudas pendientes están fuera
// del repo, en borradores/fuentes/formularios/<accion>.notas.json, porque
// citan expedientes de otras entidades. Cuando el portal cambie el
// formulario, se actualiza el JSON y el editor lo sigue solo.
//
// Forma de cada JSON:
//   accion, nombre, limiteDefecto
//   bloques[]: { id, titulo, tituloEs, subtitulo?, repetible, etiquetaRepetible,
//                padre? (id de otro bloque repetible del que cuelga), preguntas[] }
//   preguntas[]: { id, texto, tipo, limite, opciones, ayuda,
//                  maximo? (tope de marcadas en "opciones"),
//                  opcionesAbiertas? (admite un valor fuera de la lista) }
//   tipo: texto | corto | numero | fecha | si_no | opcion | opciones
//
// Las respuestas de un borrador van en { idioma, campos: {id: valor},
// repetidos: {bloqueId: [{id: valor, _padre?: etiqueta de la ficha madre}]} }.

// Los atributos de importación hacen que el módulo cargue igual en Vite y en
// Node, así las funciones de abajo se pueden probar desde la terminal.
import ka152 from './formularios/KA152-YOU.json' with { type: 'json' };
import ka153 from './formularios/KA153-YOU.json' with { type: 'json' };
import ka154 from './formularios/KA154-YOU.json' with { type: 'json' };
import ka210 from './formularios/KA210-YOU.json' with { type: 'json' };
import ka220 from './formularios/KA220-YTH.json' with { type: 'json' };

export const FORMULARIOS = [ka152, ka153, ka154, ka210, ka220];

export function formularioDe(accion) {
  return FORMULARIOS.find((f) => f.accion === accion) ?? null;
}

// Tope de una pregunta: el suyo o, en las respuestas largas, el del
// formulario. Los campos cortos solo tienen tope si el JSON lo dice.
export function limiteDe(pregunta, formulario) {
  if (pregunta.tipo === 'texto') return pregunta.limite ?? formulario.limiteDefecto ?? null;
  if (pregunta.tipo === 'corto') return pregunta.limite ?? null;
  return null;
}

// Cuenta como cuenta el portal después de pegar: caracteres con espacios y
// cada salto de línea como un carácter. Los saltos de Windows (\r\n) se
// normalizan antes para no contarlos doble.
export function contar(texto) {
  return (texto ?? '').replace(/\r\n?/g, '\n').length;
}

// Algunos campos del portal cuentan cada salto de párrafo como dos
// caracteres. Es el recuento "pesimista" que conviene mirar cuando se va
// justo de espacio (margen de 60 a 100 que recomienda la skill).
export function contarPesimista(texto) {
  const t = (texto ?? '').replace(/\r\n?/g, '\n');
  return t.length + (t.match(/\n/g) ?? []).length;
}

// Margen de aviso antes del tope, para que el amarillo salte a tiempo: los
// últimos 100 caracteres en las respuestas largas (en las de 5.000 coincide
// con el techo de 4.900 que recomienda la skill) y el último 10 % en los
// campos pequeños, donde 100 sería una quinta parte del tope.
export const MARGEN_AVISO = 100;
export function margenDe(limite) {
  return Math.min(MARGEN_AVISO, Math.round(limite * 0.1));
}

// Estado del contador: ok, cerca (dentro del margen) o sobre (pasado).
export function estadoContador(n, limite) {
  if (!limite) return 'ok';
  if (n > limite) return 'sobre';
  if (n >= limite - margenDe(limite)) return 'cerca';
  return 'ok';
}

// Número de preguntas de texto largo de un formulario, contando las de los
// bloques repetibles una sola vez. Sirve para la barra de progreso.
export function preguntasTexto(formulario) {
  return formulario.bloques.flatMap((b) => b.preguntas.filter((p) => p.tipo === 'texto'));
}

// Exporta un borrador al markdown que usan las herramientas de la skill de
// redacción: "## Bloque", "### Pregunta literal", respuesta y una línea de
// recuento que contar.py ignora. Las fichas repetidas van numeradas.
export function aMarkdown(borrador, formulario) {
  const campos = borrador.respuestas?.campos ?? {};
  const repetidos = borrador.respuestas?.repetidos ?? {};
  const lineas = [`# ${borrador.titulo}`, '', `Acción: ${formulario.accion}, ${formulario.nombre}`, ''];

  const tieneAlgo = (preguntas, valores) =>
    preguntas.some((p) => valores[p.id] !== undefined && valores[p.id] !== null && valores[p.id] !== '');

  const volcar = (preguntas, valores) => {
    preguntas.forEach((p) => {
      const v = valores[p.id];
      if (v === undefined || v === null || v === '') return;
      // El encabezado va en una sola línea: contar.py toma como respuesta
      // todo lo que sigue a "### " hasta el siguiente encabezado.
      lineas.push(`### ${p.texto.replace(/\s*\n\s*/g, ' ')}`, '');
      if (p.tipo === 'texto') {
        lineas.push(String(v), '', `*${contar(v).toLocaleString('es-ES')} caracteres*`, '');
      } else if (p.tipo === 'opciones' && Array.isArray(v)) {
        lineas.push(v.map((o) => `- ${o}`).join('\n'), '');
      } else {
        lineas.push(String(v), '');
      }
    });
  };

  // Los bloques sin nada escrito no se exportan
  formulario.bloques.forEach((b) => {
    if (b.repetible) {
      const fichas = (Array.isArray(repetidos[b.id]) ? repetidos[b.id] : []).filter((f) => f && tieneAlgo(b.preguntas, f));
      if (!fichas.length) return;
      lineas.push(`## ${b.titulo}`, '');
      fichas.forEach((ficha, i) => {
        lineas.push(`#### ${b.etiquetaRepetible ?? 'Ficha'} ${i + 1}`, '');
        if (typeof ficha._padre === 'string') lineas.push(`Pertenece a: ${ficha._padre}`, '');
        volcar(b.preguntas, ficha);
      });
    } else if (tieneAlgo(b.preguntas, campos)) {
      lineas.push(`## ${b.titulo}`, '');
      volcar(b.preguntas, campos);
    }
  });
  return lineas.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
