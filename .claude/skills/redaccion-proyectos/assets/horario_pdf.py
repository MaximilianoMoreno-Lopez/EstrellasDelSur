# -*- coding: utf-8 -*-
"""Genera el anexo del horario en PDF A4 apaisado (HTML imprimible y Chrome sin ventana).

Uso:
    py horario_pdf.py --md horario.md --config horario_pdf.json --out Programa_anexo.pdf
                      [--solo-html] [--chrome ruta/chrome.exe]

Lee el mismo markdown que horario_xlsx.py ("## " secciones, "### " un día con su
tabla Hora | Sesión | Objetivo | Método | Conduce, línea "Producto del día" o
equivalente y, en otra "## ", la tabla del calendario de 5 o 6 columnas).
El texto que va bajo un "## " antes del primer día sale como introducción.

Config (JSON):
    {
      "titulo": "Título del proyecto",
      "subtitulo": "Anexo. Horario del intercambio y calendario del proyecto",
      "meta": "Erasmus+ KA152-YOU · Intercambio juvenil · Ciudad, fechas · Solicitante",
      "socias": "Con Socia A (FR), Socia B (IT)...",
      "idioma": "es"
    }

Deja el HTML junto al PDF (mismo nombre, extensión .html) para retocarlo si hace
falta y volver a imprimirlo con Chrome.
"""
import argparse
import html
import json
import os
import re
import subprocess
import sys

CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
RE_PRODUCTO = re.compile(r"^\**\s*(producto del d[ií]a|produit du jour|product of the day)", re.I)
RE_BR = re.compile(r"&lt;br\s*/?&gt;", re.I)

CSS = """
@page { size: A4 landscape; margin: 12mm 12mm 14mm 12mm; }
* { box-sizing: border-box; }
body { font-family: Calibri, "Segoe UI", Arial, sans-serif; color: #0a1628; font-size: 9pt; margin: 0; }
header { border-bottom: 3px solid #0d9488; padding-bottom: 6px; margin-bottom: 10px; }
header h1 { font-size: 20pt; margin: 0; color: #0a1628; }
header .sub { font-size: 11pt; color: #0d9488; font-weight: 600; margin-top: 2px; }
header .meta { font-size: 8.5pt; color: #555; margin-top: 3px; }
h2 { font-size: 13pt; color: #0a1628; margin: 4px 0 6px; }
h3 { font-size: 10.5pt; color: #fff; background: #0a1628; padding: 4px 8px; margin: 10px 0 0;
     border-radius: 3px 3px 0 0; break-after: avoid; }
table { width: 100%; border-collapse: collapse; margin: 0 0 4px; table-layout: fixed; }
thead { display: table-header-group; }
th { background: #0d9488; color: #fff; text-align: left; padding: 3px 5px; font-size: 8.5pt; }
td { border: 0.5pt solid #b8c4cc; padding: 3px 5px; vertical-align: top; line-height: 1.25;
     overflow-wrap: anywhere; }
tr { break-inside: avoid; }
table.dia td:nth-child(1) { font-weight: 600; }
table.dia td:nth-child(2) { font-weight: 600; }
tr.pausa td { background: #f1f5f7; color: #555; font-style: italic; font-weight: normal; }
table.cal td:nth-child(-n+3) { font-weight: 600; }
p.intro { margin: 0 0 6px; }
p.objetivo { margin: 4px 0; font-style: italic; }
p.nota { margin: 3px 0; font-style: italic; }
p.producto { margin: 3px 0 6px; padding: 3px 7px; background: #fef3c7; border-left: 3px solid #f59e0b; }
.salto { break-before: page; }
"""

# Anchos de columna (%) por tipo de tabla y número de columnas
ANCHOS = {
    ("dia", 5): [9, 17, 24, 33, 17],
    ("cal", 5): [7, 13, 13, 45, 22],
    ("cal", 6): [6, 9, 12, 33, 20, 20],
}


def inline(t):
    t = html.escape(t)
    t = RE_BR.sub("<br>", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)
    return t


def celdas(linea):
    partes = re.split(r"(?<!\\)\|", linea.strip())
    if partes and not partes[0].strip():
        partes = partes[1:]
    if partes and not partes[-1].strip():
        partes = partes[:-1]
    return [p.strip() for p in partes]


def tabla(lineas, clase):
    filas = [celdas(l) for l in lineas]
    filas = [f for f in filas if not (f and all(re.match(r"^:?-+:?$", c) for c in f))]
    if not filas:
        return ""
    cab, cuerpo = filas[0], filas[1:]
    n = len(cab)
    anchos = ANCHOS.get((clase, n)) or [round(100 / n, 2)] * n
    out = ['<table class="%s"><colgroup>%s</colgroup><thead><tr>%s</tr></thead><tbody>' % (
        clase, "".join('<col style="width:%s%%">' % w for w in anchos),
        "".join("<th>%s</th>" % inline(c) for c in cab))]
    for f in cuerpo:
        f = (f + [""] * n)[:n]
        pausa = clase == "dia" and n >= 3 and not any(x.strip() for x in f[2:4])
        out.append("<tr%s>%s</tr>" % (' class="pausa"' if pausa else "",
                                       "".join("<td>%s</td>" % inline(c) for c in f)))
    out.append("</tbody></table>")
    return "\n".join(out)


def cuerpo_html(md):
    lineas = md.split("\n")
    out, i, primer_h2 = [], 0, True
    while i < len(lineas):
        l = lineas[i]
        s = l.strip()
        if l.startswith("## "):
            if not primer_h2:
                out.append('<div class="salto"></div>')
            primer_h2 = False
            out.append("<h2>%s</h2>" % inline(l[3:].strip()))
        elif l.startswith("### "):
            out.append('<section class="dia"><h3>%s</h3>' % inline(l[4:].strip()))
            j = i + 1
            while j < len(lineas) and not lineas[j].startswith("#"):
                j += 1
            bloque, k, primera = lineas[i + 1:j], 0, True
            while k < len(bloque):
                b = bloque[k].strip()
                if b.startswith("|"):
                    t = []
                    while k < len(bloque) and bloque[k].strip().startswith("|"):
                        t.append(bloque[k])
                        k += 1
                    out.append(tabla(t, "dia"))
                    primera = False
                    continue
                if b and not re.match(r"^-{3,}$", b):
                    if RE_PRODUCTO.match(b):
                        cls = "producto"
                    else:
                        cls = "objetivo" if primera else "nota"
                        primera = False
                    out.append('<p class="%s">%s</p>' % (cls, inline(b)))
                k += 1
            out.append("</section>")
            i = j
            continue
        elif s.startswith("|"):
            t = []
            while i < len(lineas) and lineas[i].strip().startswith("|"):
                t.append(lineas[i])
                i += 1
            out.append(tabla(t, "cal"))
            continue
        elif s.startswith("# "):
            pass  # el título del documento ya va en la cabecera
        elif s and not re.match(r"^-{3,}$", s):
            out.append('<p class="intro">%s</p>' % inline(s))
        i += 1
    return "\n".join(out)


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(description="Horario en markdown a PDF A4 apaisado.")
    ap.add_argument("--md", required=True)
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", required=True, help="PDF de salida")
    ap.add_argument("--chrome", default=CHROME)
    ap.add_argument("--solo-html", action="store_true", help="genera el HTML y no llama a Chrome")
    a = ap.parse_args(argv)

    with open(a.md, encoding="utf-8-sig") as fh:
        md = fh.read().replace("\r\n", "\n")
    with open(a.config, encoding="utf-8-sig") as fh:
        cfg = json.load(fh)
    meta = "<br>".join(html.escape(x) for x in (cfg.get("meta", ""), cfg.get("socias", "")) if x)
    doc = ('<!doctype html><html lang="%s"><head><meta charset="utf-8"><title>%s</title><style>%s</style>'
           '</head><body><header><h1>%s</h1><div class="sub">%s</div><div class="meta">%s</div></header>\n%s\n'
           '</body></html>') % (cfg.get("idioma", "es"), html.escape(cfg.get("titulo", "")), CSS,
                                html.escape(cfg.get("titulo", "")), html.escape(cfg.get("subtitulo", "")),
                                meta, cuerpo_html(md))
    pdf = os.path.abspath(a.out)
    ruta_html = os.path.splitext(pdf)[0] + ".html"
    with open(ruta_html, "w", encoding="utf-8") as fh:
        fh.write(doc)
    print("HTML", ruta_html)
    if a.solo_html:
        return 0
    if not os.path.exists(a.chrome):
        print("AVISO: no encuentro Chrome en %s; usa --chrome o imprime el HTML a mano" % a.chrome, file=sys.stderr)
        return 2
    if os.path.exists(pdf):
        os.remove(pdf)
    url = "file:///" + ruta_html.replace("\\", "/")
    cmd = [a.chrome, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
           "--print-to-pdf=" + pdf, url]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if res.returncode != 0 or not os.path.exists(pdf):
        print("ERROR de Chrome:\n" + (res.stderr or res.stdout), file=sys.stderr)
        return 1
    print("OK", pdf)
    return 0


if __name__ == "__main__":
    sys.exit(main())
