// Generates src/lib/europe-map.json — simplified Europe + Mediterranean map
// as SVG path data, one entry per country (ISO2), projected with a Lambert
// azimuthal equal-area projection (the standard look for Europe maps).
//
// Source data: Natural Earth (public domain), via the countries.geo.json of
// https://github.com/johan/world.geo.json. Pass the path to that file:
//
//   node scripts/build-europe-map.mjs path/to/countries.geo.json

import fs from 'node:fs';

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/build-europe-map.mjs <countries.geo.json>');
  process.exit(1);
}

// ISO3 -> ISO2 for every country drawn on the map. Countries not listed
// here are omitted entirely.
const ISO3_TO_2 = {
  ISL: 'IS', NOR: 'NO', SWE: 'SE', FIN: 'FI', DNK: 'DK',
  EST: 'EE', LVA: 'LV', LTU: 'LT',
  IRL: 'IE', GBR: 'GB', NLD: 'NL', BEL: 'BE', LUX: 'LU',
  DEU: 'DE', POL: 'PL', CZE: 'CZ', SVK: 'SK', AUT: 'AT', CHE: 'CH',
  HUN: 'HU', ROU: 'RO', MDA: 'MD', UKR: 'UA', BLR: 'BY', RUS: 'RU',
  SRB: 'RS', BIH: 'BA', MNE: 'ME', MKD: 'MK', ALB: 'AL', KOS: 'XK',
  GRC: 'GR', BGR: 'BG', TUR: 'TR', CYP: 'CY', MLT: 'MT',
  PRT: 'PT', ESP: 'ES', FRA: 'FR', ITA: 'IT', SVN: 'SI', HRV: 'HR',
  MAR: 'MA', DZA: 'DZ', TUN: 'TN', LBY: 'LY', EGY: 'EG',
  ISR: 'IL', PSE: 'PS', LBN: 'LB', SYR: 'SY', JOR: 'JO',
};

// Countries whose extent defines the viewBox (Russia et al. are drawn but
// cropped so the frame stays centred on Europe and the Mediterranean).
const FRAME = new Set([
  'IS', 'NO', 'SE', 'FI', 'DK', 'EE', 'LV', 'LT', 'IE', 'GB', 'NL', 'BE',
  'LU', 'DE', 'PL', 'CZ', 'SK', 'AT', 'CH', 'HU', 'RO', 'MD', 'RS', 'BA',
  'ME', 'MK', 'AL', 'GR', 'BG', 'TR', 'CY', 'MT', 'PT', 'ES', 'FR', 'IT',
  'SI', 'HR', 'MA', 'TN', 'EG', 'IL', 'LB',
]);

const NAMES = {
  IS: 'Islandia', NO: 'Noruega', SE: 'Suecia', FI: 'Finlandia', DK: 'Dinamarca',
  EE: 'Estonia', LV: 'Letonia', LT: 'Lituania', IE: 'Irlanda', GB: 'Reino Unido',
  NL: 'Países Bajos', BE: 'Bélgica', LU: 'Luxemburgo', DE: 'Alemania', PL: 'Polonia',
  CZ: 'Chequia', SK: 'Eslovaquia', AT: 'Austria', CH: 'Suiza', HU: 'Hungría',
  RO: 'Rumanía', MD: 'Moldavia', UA: 'Ucrania', BY: 'Bielorrusia', RU: 'Rusia',
  RS: 'Serbia', BA: 'Bosnia y Herzegovina', ME: 'Montenegro', MK: 'Macedonia del Norte',
  AL: 'Albania', XK: 'Kosovo', GR: 'Grecia', BG: 'Bulgaria', TR: 'Turquía',
  CY: 'Chipre', MT: 'Malta', PT: 'Portugal', ES: 'España', FR: 'Francia',
  IT: 'Italia', SI: 'Eslovenia', HR: 'Croacia',
  MA: 'Marruecos', DZ: 'Argelia', TN: 'Túnez', LY: 'Libia', EG: 'Egipto',
  IL: 'Israel', PS: 'Palestina', LB: 'Líbano', SY: 'Siria', JO: 'Jordania',
};

// Lambert azimuthal equal-area centred on Europe/Mediterranean.
const LON0 = (15 * Math.PI) / 180;
const LAT0 = (46 * Math.PI) / 180;
const SCALE = 520;

function project([lon, lat]) {
  const l = (lon * Math.PI) / 180;
  const p = (lat * Math.PI) / 180;
  const k = Math.sqrt(
    2 / (1 + Math.sin(LAT0) * Math.sin(p) + Math.cos(LAT0) * Math.cos(p) * Math.cos(l - LON0)),
  );
  const x = k * Math.cos(p) * Math.sin(l - LON0) * SCALE;
  const y = -k * (Math.cos(LAT0) * Math.sin(p) - Math.sin(LAT0) * Math.cos(p) * Math.cos(l - LON0)) * SCALE;
  return [x, y];
}

// France in this dataset includes French Guiana; drop rings whose points sit
// outside a generous Europe/Med window before projecting.
const inWindow = ([lon, lat]) => lon > -32 && lon < 63 && lat > 18 && lat < 75;

function ringToPath(ring) {
  const pts = ring.map(project).map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) d += `L${pts[i][0]} ${pts[i][1]}`;
  return d + 'Z';
}

const geo = JSON.parse(fs.readFileSync(src, 'utf8'));
const countries = [];
const frameBox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

for (const f of geo.features) {
  const iso2 = ISO3_TO_2[f.id];
  if (!iso2) continue;
  const polys =
    f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let d = '';
  for (const poly of polys) {
    for (const ring of poly) {
      if (!ring.some(inWindow)) continue;
      d += ringToPath(ring);
      if (FRAME.has(iso2)) {
        for (const pt of ring) {
          if (!inWindow(pt)) continue;
          const [x, y] = project(pt);
          frameBox.minX = Math.min(frameBox.minX, x);
          frameBox.maxX = Math.max(frameBox.maxX, x);
          frameBox.minY = Math.min(frameBox.minY, y);
          frameBox.maxY = Math.max(frameBox.maxY, y);
        }
      }
    }
  }
  if (d) countries.push({ iso: iso2, name: NAMES[iso2], d });
}

const pad = 8;
const viewBox = [
  Math.round(frameBox.minX - pad),
  Math.round(frameBox.minY - pad),
  Math.round(frameBox.maxX - frameBox.minX + pad * 2),
  Math.round(frameBox.maxY - frameBox.minY + pad * 2),
].join(' ');

const out = { viewBox, countries };
fs.writeFileSync('src/lib/europe-map.json', JSON.stringify(out));
const kb = (fs.statSync('src/lib/europe-map.json').size / 1024).toFixed(1);
console.log(`europe-map.json written: ${countries.length} countries, ${kb} KB, viewBox ${viewBox}`);
