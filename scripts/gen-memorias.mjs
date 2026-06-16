// Genera las memorias anuales (HTML) combinando dos fuentes reales:
//  - PIF (scripts/pif-projects.mjs): relacion oficial completa + codigos.
//  - src/content/projects: descripcion ("Sobre el proyecto"), fechas, lugar.
// No inventa datos.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PIF } from './pif-projects.mjs';

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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (/^-?\d+$/.test(v)) v = Number(v);
    data[mm[1]] = v;
  }
  return { data, body: m[2] };
}

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
  text = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/[*_`#>]/g, '')
    .replace(/\r/g, '')
    .split('\n').map(s => s.trim()).filter(Boolean).join('\n');
  return text.trim();
}

function startTime(dates) {
  if (!dates) return Number.POSITIVE_INFINITY;
  const m = String(dates).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return Number.POSITIVE_INFINITY;
  return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
}

const norm = (s) => String(s ?? '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]/g, '');

function matchPif(title, pifList) {
  const n = norm(title);
  return pifList.find(p => {
    const pn = norm(p.name);
    return pn === n || (n.length >= 10 && (pn.startsWith(n) || n.startsWith(pn)));
  });
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paragraphs = (t) => t.split('\n').filter(Boolean).map(p => `<p class="proj-desc">${esc(p)}</p>`).join('\n      ');

const files = readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_'));
const all = files.map(f => {
  const { data, body } = parseFrontmatter(readFileSync(join(PROJECTS_DIR, f), 'utf8'));
  return { f, data, desc: extractDescription(body, data.description) };
});

function dedupePif(list) {
  const seen = new Set(); const out = [];
  for (const p of list) {
    const k = norm(p.name) + '|' + (p.code || '');
    if (seen.has(k)) continue;
    seen.add(k); out.push(p);
  }
  return out;
}

function buildHtml(year, registry, detailed) {
  const rows = registry.map((p, i) => `      <tr>
        <td class="num">${i + 1}</td>
        <td>${esc(p.name)}</td>
        <td>${esc(p.programa || '')}</td>
        <td class="code">${esc(p.code || '—')}</td>
        <td class="coord">${esc(p.coord || '—')}</td>
      </tr>`).join('\n');

  const items = detailed.map((p, i) => {
    const d = p.data;
    const meta = [d.dates, d.location].filter(Boolean).map(esc).join(' &middot; ');
    const code = p.code ? `<span class="proj-code">${esc(p.code)}</span>` : '';
    return `    <article class="proj">
      <div class="proj-head">
        <span class="proj-num">${i + 1}</span>
        <div class="proj-head-text">
          <h3 class="proj-title">${esc(d.title)}</h3>
          <p class="proj-meta"><span class="proj-type">${esc(d.type)}</span>${meta ? ' &middot; ' + meta : ''}${code ? ' &middot; ' + code : ''}</p>
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
  table.reg{width:100%;border-collapse:collapse;font-size:8.4pt;margin:6px 0 14px;}
  table.reg th{background:var(--navy);color:#fff;text-align:left;padding:6px 7px;font-weight:600;}
  table.reg td{padding:5px 7px;border-bottom:1px solid #eef0f2;vertical-align:top;}
  table.reg tr:nth-child(even) td{background:#f8fafa;}
  table.reg td.num{text-align:right;color:var(--gray);}
  table.reg td.code{font-family:monospace;font-size:7.4pt;white-space:nowrap;color:var(--teal-dark);}
  table.reg td.coord{color:var(--gray);font-size:8pt;}
  .proj{padding:13px 0 6px;border-top:1px solid var(--line);page-break-inside:avoid;}
  .proj:first-of-type{border-top:none;}
  .proj-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:6px;}
  .proj-num{flex-shrink:0;width:26px;height:26px;border-radius:50%;background:var(--teal);color:#fff;
    font-size:9.5pt;font-weight:700;display:flex;align-items:center;justify-content:center;}
  .proj-title{margin:0;font-size:11.5pt;font-weight:700;color:var(--navy);line-height:1.2;}
  .proj-meta{margin:3px 0 0;font-size:8.6pt;color:var(--gray);}
  .proj-type{display:inline-block;background:rgba(13,148,136,.12);color:var(--teal-dark);
    font-weight:700;font-size:7.6pt;text-transform:uppercase;letter-spacing:.05em;padding:2px 7px;border-radius:5px;}
  .proj-code{font-family:monospace;font-size:7.8pt;color:var(--teal-dark);}
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
  <p class="doc-sub">Proyectos Erasmus+ y del Cuerpo Europeo de Solidaridad en los que participó Estrellas del Sur durante ${year}.</p>

  <p class="intro">Durante ${year}, Estrellas del Sur participó en <strong>${registry.length} proyectos</strong> de los programas Erasmus+ y Cuerpo Europeo de Solidaridad. A continuación se presenta la relación completa y, después, el detalle de aquellos con descripción disponible.</p>

  <h2>Relación de proyectos ${year}</h2>
  <table class="reg">
    <thead>
      <tr><th>#</th><th>Proyecto</th><th>Programa</th><th>Código</th><th>Organización coordinadora</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>

  <h2>Detalle de proyectos</h2>
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
  const pifList = dedupePif(PIF[year] || []);
  const web = all.filter(p => p.data.year === year)
    .sort((a, b) => startTime(a.data.dates) - startTime(b.data.dates));

  // Detalle: proyectos de la web, con su codigo del PIF si hay coincidencia.
  const detailed = web.map(p => ({ ...p, code: (matchPif(p.data.title, pifList) || {}).code || '' }));

  // Registro completo: PIF + proyectos de la web que no esten en el PIF.
  const webOnly = web
    .filter(p => !matchPif(p.data.title, pifList))
    .map(p => ({ name: p.data.title, programa: 'Erasmus+', code: '', coord: '' }));
  const registry = [...pifList, ...webOnly];

  const html = buildHtml(year, registry, detailed);
  writeFileSync(join(__dir, `memoria-${year}.html`), html, 'utf8');
  console.log(`memoria-${year}: ${registry.length} en relacion (PIF ${pifList.length} + web-only ${webOnly.length}), ${detailed.length} detallados`);
}
