// Genera las memorias anuales (HTML) a partir de los datos reales de
// src/content/projects. No inventa nada: usa titulo, tipo, fechas, lugar y
// la seccion "Sobre el proyecto" de cada ficha.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = join(__dir, '..', 'src', 'content', 'projects');

function parseFrontmatter(rawInput) {
  const raw = rawInput.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!mm) continue;
    let v = mm[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (/^-?\d+$/.test(v)) v = Number(v);
    data[mm[1]] = v;
  }
  return { data, body: m[2] };
}

// Extrae la seccion "## Sobre el proyecto" (o la primera de texto) y la limpia de markdown.
function extractDescription(body, fallback) {
  let text = '';
  const re = /^##\s+Sobre el proyecto\s*$/im;
  const idx = body.search(re);
  if (idx !== -1) {
    const after = body.slice(idx).replace(re, '');
    const next = after.search(/^##\s+/m);
    text = (next === -1 ? after : after.slice(0, next));
  }
  if (!text.trim()) text = fallback || '';
  // Limpieza de markdown basica
  text = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')      // imagenes
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // enlaces
    .replace(/^[-*]\s+/gm, '')                  // vinietas
    .replace(/[*_`#>]/g, '')                    // simbolos md
    .replace(/\r/g, '')
    .split('\n').map(s => s.trim()).filter(Boolean)
    .join('\n');
  return text.trim();
}

function startTime(dates) {
  if (!dates) return Number.POSITIVE_INFINITY; // sin fecha al final
  const m = String(dates).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return Number.POSITIVE_INFINITY;
  return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
}

const files = readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_'));
const all = files.map(f => {
  const { data, body } = parseFrontmatter(readFileSync(join(PROJECTS_DIR, f), 'utf8'));
  return { f, data, desc: extractDescription(body, data.description) };
});

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function paragraphs(text) {
  return text.split('\n').filter(Boolean).map(p => `<p class="proj-desc">${esc(p)}</p>`).join('\n      ');
}

function buildHtml(year, projects) {
  const items = projects.map((p, i) => {
    const d = p.data;
    const meta = [d.dates, d.location].filter(Boolean).map(esc).join(' &middot; ');
    return `    <article class="proj">
      <div class="proj-head">
        <span class="proj-num">${i + 1}</span>
        <div class="proj-head-text">
          <h3 class="proj-title">${esc(d.title)}</h3>
          <p class="proj-meta"><span class="proj-type">${esc(d.type)}</span>${meta ? ' &middot; ' + meta : ''}</p>
        </div>
      </div>
      ${paragraphs(p.desc)}
    </article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Memoria Anual ${year} - Asociación Cultural Estrellas del Sur</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<link href="_plan-base.css" rel="stylesheet">
<style>
  .intro{color:var(--gray);margin:0 0 8px;}
  .proj{padding:14px 0 6px;border-top:1px solid var(--line);page-break-inside:avoid;}
  .proj:first-of-type{border-top:none;}
  .proj-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:6px;}
  .proj-num{flex-shrink:0;width:26px;height:26px;border-radius:50%;background:var(--teal);color:#fff;
    font-size:9.5pt;font-weight:700;display:flex;align-items:center;justify-content:center;}
  .proj-title{margin:0;font-size:11.5pt;font-weight:700;color:var(--navy);line-height:1.2;}
  .proj-meta{margin:3px 0 0;font-size:8.6pt;color:var(--gray);}
  .proj-type{display:inline-block;background:rgba(13,148,136,.12);color:var(--teal-dark);
    font-weight:700;font-size:7.6pt;text-transform:uppercase;letter-spacing:.05em;padding:2px 7px;border-radius:5px;}
  .proj-desc{margin:6px 0 0;font-size:9.6pt;}
</style>
</head>
<body>

  <div class="cover">
    <img src="../public/images/logo.svg" alt="Estrellas del Sur">
    <div class="org">
      Asociación Cultural Estrellas del Sur
      <small>Córdoba · Erasmus+ · Cuerpo Europeo de Solidaridad</small>
    </div>
  </div>

  <span class="doc-period">Ejercicio ${year}</span>
  <h1 class="doc-title">Memoria anual de actividades</h1>
  <p class="doc-sub">Proyectos Erasmus+ y del Cuerpo Europeo de Solidaridad desarrollados durante ${year}.</p>

  <p class="intro">Durante ${year}, Estrellas del Sur participó en ${projects.length} proyectos de movilidad, formación y participación juvenil. A continuación se detalla cada uno de ellos.</p>

  <h2>Proyectos ${year}</h2>

${items}

  <div class="ident">
    <p class="ident-label">Datos identificativos</p>
    <dl class="ident-grid">
      <div><dt>Denominación</dt><dd>Asociación Cultural Estrellas del Sur</dd></div>
      <div><dt>Ejercicio</dt><dd>${year}</dd></div>
      <div><dt>Sede</dt><dd>Córdoba, España</dd></div>
      <div><dt>Acreditaciones</dt><dd>Erasmus+ y Cuerpo Europeo de Solidaridad</dd></div>
      <div><dt>OID</dt><dd>E10264295</dd></div>
      <div><dt>PIC</dt><dd>892239563</dd></div>
      <div><dt>Contacto</dt><dd class="gold">paula@estrellasdelsur.eu</dd></div>
      <div><dt>Web</dt><dd class="gold">estrellasdelsur.eu</dd></div>
    </dl>
  </div>

  <footer>
    <span>Asociación Cultural Estrellas del Sur</span>
    <span>Memoria anual ${year}</span>
  </footer>

</body>
</html>
`;
}

for (const year of [2024, 2025]) {
  const projects = all
    .filter(p => p.data.year === year)
    .sort((a, b) => startTime(a.data.dates) - startTime(b.data.dates));
  const html = buildHtml(year, projects);
  const out = join(__dir, `memoria-${year}.html`);
  writeFileSync(out, html, 'utf8');
  console.log(`memoria-${year}.html -> ${projects.length} proyectos`);
}
