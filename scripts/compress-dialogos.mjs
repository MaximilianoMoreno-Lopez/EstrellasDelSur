import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const files = [
  'public/images/noticias/dialogos-1.jpg',
  'public/images/noticias/dialogos-2.jpg',
  'public/images/noticias/dialogos-3.jpg',
];

for (const rel of files) {
  const path = resolve(root, rel);
  const before = statSync(path).size;
  const input = readFileSync(path);
  const output = await sharp(input)
    .rotate()
    .resize({ width: 1800, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  writeFileSync(path, output);
  const after = statSync(path).size;
  const pct = Math.round((1 - after / before) * 100);
  console.log(`${rel}: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB (-${pct}%)`);
}
