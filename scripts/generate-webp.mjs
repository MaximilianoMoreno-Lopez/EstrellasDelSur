import sharp from 'sharp';
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const root = resolve(projectRoot, 'public', 'images');

const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png']);
const MAX_WIDTH = 1800;
const QUALITY = 75;
// effort 6 (por defecto 4) comprime algo mas sin perder calidad, solo cuesta tiempo de build
const EFFORT = 6;
// Smaller variant for thumbnails (project cards, noticia listings)
const CARD_WIDTH = 800;
// Escalon intermedio. Solo para las portadas de noticia, que son el elemento LCP
// de la pagina de articulo: con 800 y 1800 el salto es grande y un movil retina
// se llevaba la version de 1800 para una banda de 280 px de alto.
const MID_WIDTH = 1200;

// Portadas declaradas en el frontmatter de las noticias, rutas relativas a public/
function heroCovers() {
  const dir = resolve(projectRoot, 'src', 'content', 'noticias');
  if (!existsSync(dir)) return new Set();
  const out = new Set();
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.md')) continue;
    const md = readFileSync(resolve(dir, entry), 'utf8');
    // Solo el bloque de frontmatter: una linea del cuerpo que empiece por
    // "cover:" (una lista, una cita, una tabla) no debe contar como portada.
    const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;
    const m = fm[1].match(/^cover:\s*["']?([^"'\r\n]+?)["']?\s*$/m);
    if (m) out.add(resolve(projectRoot, 'public', m[1].trim()));
  }
  return out;
}

const covers = heroCovers();

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) yield* walk(full);
    else yield full;
  }
}

// Anchura del original ya rotado segun la etiqueta EXIF de orientacion, que es
// como lo vera sharp al aplicar .rotate(). Con orientacion de 5 a 8 la foto gira
// un cuarto de vuelta y los dos lados se intercambian, asi que metadata().width
// por si sola mediria el lado equivocado.
async function orientedWidth(file) {
  const meta = await sharp(file).metadata();
  const swap = meta.orientation >= 5 && meta.orientation <= 8;
  return (swap ? meta.height : meta.width) ?? 0;
}

let totalIn = 0;
let totalOut = 0;
let generated = 0;
let skipped = 0;
let removed = 0;

for (const file of walk(root)) {
  const ext = extname(file).toLowerCase();
  if (!RASTER_EXT.has(ext)) continue;

  const webpPath = file.replace(/\.(jpe?g|png)$/i, '.webp');
  const cardPath = file.replace(/\.(jpe?g|png)$/i, '-card.webp');
  const midPath = file.replace(/\.(jpe?g|png)$/i, '-mid.webp');
  const srcMtime = statSync(file).mtimeMs;

  // Skip when every needed variant exists and is newer than the source
  const webpUpToDate = existsSync(webpPath) && statSync(webpPath).mtimeMs >= srcMtime;
  const cardUpToDate = existsSync(cardPath) && statSync(cardPath).mtimeMs >= srcMtime;

  // El escalon intermedio solo se genera para las portadas de noticia y solo si
  // el original es mas ancho que MID_WIDTH (si no, la version grande ya vale).
  // Cuando el -mid.webp ya existe y es mas nuevo que el original, se dio por
  // bueno en una pasada anterior y no hace falta volver a abrir la foto.
  const isCover = covers.has(file);
  const midFresh = existsSync(midPath) && statSync(midPath).mtimeMs >= srcMtime;
  let wantsMid = false;
  if (isCover) {
    wantsMid = midFresh || (await orientedWidth(file)) > MID_WIDTH;
  }

  // Autolimpieza. Si el escalon deja de hacer falta, porque la portada se
  // sustituye por una foto estrecha o porque el campo cover pasa a apuntar a
  // otro fichero, se borra el sobrante. Picture.astro solo mira si el fichero
  // existe, asi que un -mid.webp huerfano seguiria anunciandose en el srcset y
  // el navegador podria descargar la imagen antigua.
  if (!wantsMid && existsSync(midPath)) {
    unlinkSync(midPath);
    removed++;
  }

  const midUpToDate = !wantsMid || midFresh;
  if (webpUpToDate && cardUpToDate && midUpToDate) {
    skipped++;
    continue;
  }

  const input = readFileSync(file);
  const inSize = input.length;
  totalIn += inSize;

  // Main WebP at MAX_WIDTH (used for hero/poster on detail pages)
  if (!webpUpToDate) {
    const output = await sharp(input)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: EFFORT })
      .toBuffer();
    writeFileSync(webpPath, output);
    totalOut += output.length;
    generated++;
  }

  // Intermediate -mid.webp for the article hero band
  if (!midUpToDate) {
    const midOut = await sharp(input)
      .rotate()
      .resize({ width: MID_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: EFFORT })
      .toBuffer();
    writeFileSync(midPath, midOut);
    totalOut += midOut.length;
    generated++;
  }

  // Smaller -card.webp for thumbnails in listings
  if (!cardUpToDate) {
    const cardOut = await sharp(input)
      .rotate()
      .resize({ width: CARD_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: EFFORT })
      .toBuffer();
    writeFileSync(cardPath, cardOut);
    totalOut += cardOut.length;
    generated++;
  }
}

console.log(`Generated: ${generated} webp files (skipped ${skipped} that already exist, removed ${removed} stale)`);
console.log(`Original total: ${(totalIn / 1024 / 1024).toFixed(2)} MB`);
console.log(`WebP total:     ${(totalOut / 1024 / 1024).toFixed(2)} MB`);
if (totalIn > 0) {
  console.log(`Saved:          ${Math.round((1 - totalOut / totalIn) * 100)}%`);
}
