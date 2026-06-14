// Rehype plugin: make Markdown body images cheap.
//
// Astro's <Picture> component already serves WebP for cards/posters, but
// images written inline in Markdown (`![](...png)`) render as a plain <img>
// with the raw PNG/JPG. Those originals are ~10x heavier than the WebP that
// `scripts/generate-webp.mjs` already produces next to them.
//
// For every local raster <img> this plugin:
//   1. adds loading="lazy" + decoding="async" (deferred load, no main-thread block)
//   2. adds intrinsic width/height (prevents layout shift / CLS)
//   3. wraps it in <picture> with a WebP <source> when the sibling .webp exists,
//      keeping the original as fallback for any browser without WebP support.
//
// Pure Node, no extra dependencies. Runs at build over the HTML AST (hast).

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const PUBLIC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const sizeCache = new Map();

function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let off = 2;
  while (off + 1 < buf.length) {
    if (buf[off] !== 0xff) { off++; continue; }
    let marker = buf[off + 1];
    while (marker === 0xff && off + 1 < buf.length) { off++; marker = buf[off + 1]; }
    off += 2;
    // Standalone markers (no length payload)
    if ((marker >= 0xd0 && marker <= 0xd9) || marker === 0x01) continue;
    if (off + 2 > buf.length) break;
    const len = buf.readUInt16BE(off);
    // Start Of Frame markers carry the dimensions (skip DHT/JPG/DAC)
    const isSOF =
      marker >= 0xc0 && marker <= 0xcf &&
      marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) {
      if (off + 7 > buf.length) break;
      return { height: buf.readUInt16BE(off + 3), width: buf.readUInt16BE(off + 5) };
    }
    off += len;
  }
  return null;
}

function imageSize(absPath) {
  if (sizeCache.has(absPath)) return sizeCache.get(absPath);
  let result = null;
  try {
    const buf = readFileSync(absPath);
    result = /\.png$/i.test(absPath) ? pngSize(buf) : jpegSize(buf);
  } catch {
    result = null;
  }
  sizeCache.set(absPath, result);
  return result;
}

function transformImg(img) {
  const props = img.properties || (img.properties = {});
  const src = props.src;
  if (typeof src !== 'string' || !src.startsWith('/')) return null;

  // Defer offscreen loads and let the parser keep going.
  if (props.loading == null) props.loading = 'lazy';
  if (props.decoding == null) props.decoding = 'async';

  const isRaster = /\.(png|jpe?g)$/i.test(src);
  if (!isRaster) return null;

  const absSrc = resolve(PUBLIC_DIR, src.replace(/^\//, ''));

  // Reserve layout space to avoid content jumping as images load.
  if (props.width == null && props.height == null) {
    const size = imageSize(absSrc);
    if (size) {
      props.width = size.width;
      props.height = size.height;
    }
  }

  const webpSrc = src.replace(/\.(png|jpe?g)$/i, '.webp');
  const webpAbs = resolve(PUBLIC_DIR, webpSrc.replace(/^\//, ''));
  if (!existsSync(webpAbs)) return null; // no WebP sibling: keep the enhanced <img>

  return {
    type: 'element',
    tagName: 'picture',
    properties: {},
    children: [
      {
        type: 'element',
        tagName: 'source',
        properties: { type: 'image/webp', srcSet: webpSrc },
        children: [],
      },
      img,
    ],
  };
}

function walk(node) {
  if (!Array.isArray(node.children)) return;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === 'element' && child.tagName === 'img') {
      const replacement = transformImg(child);
      if (replacement) node.children[i] = replacement;
    } else {
      walk(child);
    }
  }
}

export default function rehypeContentPictures() {
  return (tree) => walk(tree);
}
