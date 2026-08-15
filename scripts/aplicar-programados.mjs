// Aplica los cambios de frontmatter que estaban programados para una fecha.
//
// Lo lanza el workflow "Cambios programados" una vez al día. Lee
// scripts/programados.json, aplica las entradas cuya fecha ya ha pasado, las
// borra de la lista y avisa al workflow para que reconstruya y despliegue.
// Así una convocatoria puede abrirse sola un lunes a las 7 sin que nadie
// tenga que estar delante del ordenador.
//
// Formato de cada entrada:
//   slug    nombre del fichero en src/content/projects (sin .md)
//   cuando  fecha ISO con zona horaria explícita, p. ej. 2026-08-17T07:00:00+02:00
//   motivo  texto libre, se usa en el mensaje del commit
//   campos  pares campo/valor del frontmatter; se sustituyen si existen y se
//           añaden al final si no
//
// Para probarlo en local sin tocar nada: node scripts/aplicar-programados.mjs --simulacro

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = process.cwd();
const LISTA = resolve(RAIZ, 'scripts/programados.json');
const simulacro = process.argv.includes('--simulacro');

// Los comentarios que anuncian una apertura programada dejan de tener sentido
// en cuanto se aplica, así que se van con ella. Se lleva el bloque entero: la
// línea que empieza por "# Programada para ..." y las de comentario que la
// siguen, que son su continuación.
const COMENTARIO_PROGRAMADO = /^#\s*Programad[ao] para .*(?:\n#.*)*\n?/gm;

// Un valor de YAML: los números van desnudos y el resto entrecomillado. Con
// JSON.stringify las comillas y los acentos se escapan como toca.
const aYaml = (valor) => (typeof valor === 'number' ? String(valor) : JSON.stringify(valor));

function aplicarCampos(frontmatter, campos) {
  let salida = frontmatter.replace(COMENTARIO_PROGRAMADO, '');

  for (const [campo, valor] of Object.entries(campos)) {
    const linea = `${campo}: ${aYaml(valor)}`;
    const existente = new RegExp(`^${campo}:.*$`, 'm');
    salida = existente.test(salida)
      ? salida.replace(existente, linea)
      : `${salida.replace(/\n*$/, '')}\n${linea}\n`;
  }

  // Exactamente un salto al final: ni pegado al cierre del frontmatter ni con
  // una línea en blanco de propina.
  return salida.replace(/\n*$/, '\n');
}

if (!existsSync(LISTA)) {
  console.log('No hay scripts/programados.json, no hay nada que hacer.');
  process.exit(0);
}

const pendientes = JSON.parse(readFileSync(LISTA, 'utf8'));
const ahora = new Date();
const aplicadas = [];
const quedan = [];

for (const entrada of pendientes) {
  const cuando = new Date(entrada.cuando);

  if (Number.isNaN(cuando.getTime())) {
    // Una fecha ilegible no debe aplicarse por si acaso, pero tampoco puede
    // desaparecer en silencio: se queda en la lista y el workflow falla.
    console.error(`Fecha ilegible en la entrada de "${entrada.slug}": ${entrada.cuando}`);
    process.exit(1);
  }

  if (cuando > ahora) {
    quedan.push(entrada);
    console.log(`Todavía no toca "${entrada.slug}" (${entrada.cuando}).`);
    continue;
  }

  const ficha = resolve(RAIZ, `src/content/projects/${entrada.slug}.md`);
  if (!existsSync(ficha)) {
    console.error(`No existe la ficha src/content/projects/${entrada.slug}.md`);
    process.exit(1);
  }

  const original = readFileSync(ficha, 'utf8');
  const partes = original.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)$/);
  if (!partes) {
    console.error(`La ficha de "${entrada.slug}" no tiene frontmatter reconocible.`);
    process.exit(1);
  }

  const actualizado = `---\n${aplicarCampos(partes[1], entrada.campos)}---${partes[2]}`;

  if (!simulacro) writeFileSync(ficha, actualizado);
  aplicadas.push(entrada);
  console.log(`Aplicado en "${entrada.slug}": ${JSON.stringify(entrada.campos)}`);
}

if (aplicadas.length && !simulacro) {
  writeFileSync(LISTA, `${JSON.stringify(quedan, null, 2)}\n`);
}

const resumen = aplicadas.map((e) => e.motivo || e.slug).join('; ');
console.log(aplicadas.length ? `Cambios aplicados: ${resumen}` : 'Nada que aplicar hoy.');

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `cambios=${aplicadas.length > 0}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `resumen=${resumen}\n`);
}
