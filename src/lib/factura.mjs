// Facturas de la asociación (página interna /facturas/).
//
// Este módulo no toca el DOM: calcula importes y devuelve el HTML de la
// factura, que la página pinta en la vista previa y el navegador imprime.
// Los estilos están en src/styles/factura.css (clases .fx-*).
//
// Solo hay una serie de facturas. El número lo da Supabase al emitir
// (tabla facturas, scripts/sql/2026-11-04-facturas.sql); aquí solo se formatea.

export const EMISOR = {
  nombre: 'Asociación Cultural Estrellas del Sur',
  direccion: ['Avda. Guerrita 14, 1ª planta, local 3A', '14005 Córdoba, España'],
  cif: 'G02811461',
  oid: 'E10264295',
  web: 'estrellasdelsur.eu',
  email: 'maxi@estrellasdelsur.eu',
};

export const PAGO = {
  iban: 'ES62 0182 5899 3502 0168 1816',
  bic: 'BBVAESMMXXX',
  banco: 'BBVA',
};

// Socias a las que se factura a menudo. Solo datos de registro de la
// entidad: las personas de contacto se escriben a mano en cada factura.
export const CLIENTES = [
  {
    id: 'brno',
    nombre: 'Brno for you, z.s.',
    direccion: 'Nové sady 988/2\n602 00 Brno, Czech Republic',
    fiscal: 'IN 03376010  ·  OID E10016119',
  },
  {
    id: 'donbosco',
    nombre: 'Stichting Don Bosco Rijswijk',
    direccion: 'Don Boscolaantje 3\n2283 TL Rijswijk, The Netherlands',
    fiscal: 'Nº fiscal 822982900',
  },
];

// Texto por defecto para el traspaso de la subvención entre socias.
// Pendiente de que lo confirme la gestoría.
export const NOTA_SUBVENCION =
  'Operación no sujeta al IVA por tratarse de una transferencia de fondos de la subvención Erasmus+ entre entidades socias del proyecto, sin entrega de bienes ni prestación de servicios (art. 4.Uno de la Ley 37/1992).\n' +
  'Not subject to VAT. Transfer of Erasmus+ grant funds between project partners, with no supply of goods or services.';

export function facturaVacia(hoy = new Date()) {
  const iso = (d) => d.toISOString().slice(0, 10);
  const vence = new Date(hoy);
  vence.setDate(vence.getDate() + 30);
  return {
    numero: '',
    fecha: iso(hoy),
    vence: iso(vence),
    proyecto: '',
    cliente: { nombre: '', direccion: '', fiscal: '', atencion: '' },
    lineas: [{ desc: '', cant: 1, precio: 0 }],
    ivaPct: 0,
    nota: NOTA_SUBVENCION,
    pago: { ...PAGO },
  };
}

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function calcular(f) {
  const lineas = (f.lineas || []).map((l) => ({ ...l, importe: r2((Number(l.cant) || 0) * (Number(l.precio) || 0)) }));
  const base = r2(lineas.reduce((s, l) => s + l.importe, 0));
  const iva = r2((base * (Number(f.ivaPct) || 0)) / 100);
  return { lineas, base, iva, total: r2(base + iva) };
}

export const eur = (n) =>
  (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' }) + ' €';

const cant = (n) => (Number(n) || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 });

export function fechaES(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const lineasHTML = (txt) => esc(txt).split(/\r?\n/).filter(Boolean).join('<br>');

// 18 -> "018", como se han numerado siempre.
export const numeroTexto = (n) => (n ? String(n).padStart(3, '0') : '');

// Nombre que propone el navegador al guardar el PDF.
export function tituloArchivo(f) {
  return ['Factura', f.numero, f.cliente?.nombre].filter(Boolean).join(' ').replace(/[\\/:*?"<>|]/g, '');
}

export function renderFactura(f, { logo = '/images/logo-factura.png' } = {}) {
  const { lineas, base, iva, total } = calcular(f);
  const c = f.cliente || {};
  const p = f.pago || {};
  const filas = lineas
    .filter((l) => l.desc || l.importe)
    .map(
      (l) => `<tr>
        <td>${esc(l.desc)}</td>
        <td class="fx-c fx-mute">${cant(l.cant)}</td>
        <td class="fx-r fx-mute">${eur(l.precio)}</td>
        <td class="fx-r">${eur(l.importe)}</td>
      </tr>`
    )
    .join('');

  return `<article class="fx-page">
  <header class="fx-top">
    <img class="fx-logo" src="${esc(logo)}" alt="Estrellas del Sur">
    <div class="fx-emisor">
      <strong>${esc(EMISOR.nombre)}</strong>
      ${EMISOR.direccion.map(esc).join('<br>')}<br>
      CIF ${esc(EMISOR.cif)}
    </div>
  </header>

  <h1 class="fx-title">Factura <span>${esc(f.numero || 'sin emitir')}</span></h1>
  <p class="fx-sub">Invoice</p>

  <section class="fx-meta">
    <div class="fx-cliente">
      <p class="fx-k">Facturar a  ·  Bill to</p>
      <strong>${esc(c.nombre)}</strong>
      <p class="fx-mute">${lineasHTML(c.direccion)}${c.fiscal ? `<br>${esc(c.fiscal)}` : ''}${c.atencion ? `<br>Att. ${esc(c.atencion)}` : ''}</p>
    </div>
    <div><p class="fx-k">Fecha  ·  Date</p><strong>${esc(fechaES(f.fecha))}</strong></div>
    <div><p class="fx-k">Vencimiento  ·  Due</p><strong>${esc(fechaES(f.vence))}</strong></div>
    <div><p class="fx-k">Proyecto  ·  Project</p><strong class="fx-proy">${esc(f.proyecto)}</strong></div>
  </section>

  <table class="fx-items">
    <thead><tr>
      <th>Descripción  ·  Description</th><th class="fx-c">Cant.</th><th class="fx-r">Precio</th><th class="fx-r">Importe</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>

  <table class="fx-totals">
    <tr><td>Base imponible</td><td>${eur(base)}</td></tr>
    <tr><td>IVA ${cant(f.ivaPct)} %</td><td>${eur(iva)}</td></tr>
    <tr class="fx-total"><td>Total</td><td>${eur(total)}</td></tr>
  </table>

  <section class="fx-pago">
    <p class="fx-k">Pago por transferencia  ·  Bank transfer</p>
    <p><span class="fx-mute">IBAN</span> <strong>${esc(p.iban)}</strong>&nbsp;&nbsp;&nbsp; <span class="fx-mute">BIC</span> <strong>${esc(p.bic)}</strong>&nbsp;&nbsp;&nbsp; <span class="fx-mute">${esc(p.banco)}</span></p>
    <p><span class="fx-mute">Concepto  ·  Reference</span> <strong>Factura ${esc(f.numero)}</strong></p>
    ${f.nota ? `<p class="fx-nota">${lineasHTML(f.nota)}</p>` : ''}
  </section>

  <footer class="fx-foot">
    ${esc(EMISOR.nombre)}  ·  CIF ${esc(EMISOR.cif)}  ·  OID ${esc(EMISOR.oid)}  ·  ${esc(EMISOR.web)}  ·  ${esc(EMISOR.email)}
  </footer>
</article>`;
}
