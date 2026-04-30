import sharp from 'sharp';
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', 'public', 'images');

const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png']);
const MAX_WIDTH = 1800;
const QUALITY = 80;
// Smaller variant for thumbnails (project cards, noticia listings)
const CARD_WIDTH = 800;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let totalIn = 0;
let totalOut = 0;
let generated = 0;
let skipped = 0;

for (const file of walk(root)) {
  const ext = extname(file).toLowerCase();
  if (!RASTER_EXT.has(ext)) continue;

  const webpPath = file.replace(/\.(jpe?g|png)$/i, '.webp');
  const cardPath = file.replace(/\.(jpe?g|png)$/i, '-card.webp');
  const srcMtime = statSync(file).mtimeMs;

  // Skip when both variants exist and are newer than the source
  const webpUpToDate = existsSync(webpPath) && statSync(webpPath).mtimeMs >= srcMtime;
  const cardUpToDate = existsSync(cardPath) && statSync(cardPath).mtimeMs >= srcMtime;
  if (webpUpToDate && cardUpToDate) {
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
      .webp({ quality: QUALITY })
      .toBuffer();
    writeFileSync(webpPath, output);
    totalOut += output.length;
    generated++;
  }

  // Smaller -card.webp for thumbnails in listings
  if (!cardUpToDate) {
    const cardOut = await sharp(input)
      .rotate()
      .resize({ width: CARD_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    writeFileSync(cardPath, cardOut);
    totalOut += cardOut.length;
    generated++;
  }
}

console.log(`Generated: ${generated} webp files (skipped ${skipped} that already exist)`);
console.log(`Original total: ${(totalIn / 1024 / 1024).toFixed(2)} MB`);
console.log(`WebP total:     ${(totalOut / 1024 / 1024).toFixed(2)} MB`);
if (totalIn > 0) {
  console.log(`Saved:          ${Math.round((1 - totalOut / totalIn) * 100)}%`);
}
