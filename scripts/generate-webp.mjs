import sharp from 'sharp';
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', 'public', 'images');

const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png']);
const MAX_WIDTH = 1800;
const QUALITY = 80;

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
  if (existsSync(webpPath)) {
    const srcMtime = statSync(file).mtimeMs;
    const webpMtime = statSync(webpPath).mtimeMs;
    if (webpMtime >= srcMtime) {
      skipped++;
      continue;
    }
  }

  const input = readFileSync(file);
  const output = await sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
  writeFileSync(webpPath, output);

  const inSize = input.length;
  const outSize = output.length;
  totalIn += inSize;
  totalOut += outSize;
  generated++;
}

console.log(`Generated: ${generated} webp files (skipped ${skipped} that already exist)`);
console.log(`Original total: ${(totalIn / 1024 / 1024).toFixed(2)} MB`);
console.log(`WebP total:     ${(totalOut / 1024 / 1024).toFixed(2)} MB`);
if (totalIn > 0) {
  console.log(`Saved:          ${Math.round((1 - totalOut / totalIn) * 100)}%`);
}
