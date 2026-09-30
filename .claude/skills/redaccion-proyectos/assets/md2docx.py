# -*- coding: utf-8 -*-
"""Convierte el markdown de una solicitud en un Word listo para copiar y pegar.

Uso:
    py md2docx.py entrada.md salida.docx
    py md2docx.py entrada.md salida.docx --lang fr
    py md2docx.py entrada.md salida.docx --titulo "EuroÁgora" \
        --subtitulo "Solicitud Erasmus+ KA154-YOU" --extra "Convocatoria 2026" --lang es

Portada. Con --titulo se usa lo que se pasa por la línea de órdenes. Sin
--titulo se busca la primera tabla de dos columnas del markdown (la ficha con
Project title, Project acronym, Acción, Solicitante, Agencia nacional,
Convocatoria) y se monta la portada con los textos fijos del idioma de --lang.
Si no hay ficha, la portada lleva solo un título genérico. --sin-portada la quita.

Conversión:
- Encabezados # a ####. El nivel más alto que aparezca en el documento pasa a
  Heading 1 y lleva salto de página delante (si el documento usa "# ", salto
  antes de cada "# "; si empieza en "## ", antes de cada "## "). Los demás
  niveles bajan en orden (Heading 2, 3 y 4).
- Listas con guion, asterisco o más (con sangría, segundo nivel) y listas
  numeradas, que conservan el número escrito en el markdown.
- **negrita**, *cursiva*, ***ambas*** y `código`. El guion bajo no marca énfasis
  para no romper identificadores.
- Tablas reales (estilo Table Grid), fila de cabecera en negrita que se repite
  al cambiar de página, y <br> convertido en salto de línea dentro de la celda.
- "> cita" en cursiva con sangría. Las líneas "---" no se imprimen.

Colores de marca: navy #0a1628, teal #0d9488, gold #b47a0a.
"""
import argparse
import math
import re
import sys

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Emu, Pt, RGBColor

NAVY = RGBColor(0x0A, 0x16, 0x28)
TEAL = RGBColor(0x0D, 0x94, 0x88)
GOLD = RGBColor(0xB4, 0x7A, 0x0A)
GREY = RGBColor(0x55, 0x55, 0x55)
HEADER_FILL = "E6F4F2"  # teal muy claro para la cabecera de las tablas

FONT = "Calibri"
MONO = "Consolas"
SEP = "  ·  "

# Textos fijos de la portada por idioma
TXT = {
    "es": dict(pie="Para copiar y pegar en el formulario oficial", solicitud="Solicitud",
               agencia="Agencia Nacional", convocatoria="Convocatoria", generico="Solicitud"),
    "fr": dict(pie="Réponses à coller dans le formulaire officiel", solicitud="Candidature",
               agencia="Agence nationale", convocatoria="Appel", generico="Candidature"),
    "en": dict(pie="To copy and paste into the official form", solicitud="Application",
               agencia="National Agency", convocatoria="Call", generico="Application"),
}

ZERO_WIDTH = "﻿​‌‍‎‏⁠"
RE_HEADING = re.compile(r"^(#{1,6})\s+(.*)$")
RE_BULLET = re.compile(r"^(\s*)[-*+]\s+(.*)$")
RE_ORDERED = re.compile(r"^(\s*)(\d+[.)])\s+(.*)$")
RE_RULE = re.compile(r"^\s*(?:-{3,}|\*{3,}|_{3,})\s*$")
RE_TABLE_SEP = re.compile(r"^\s*:?-{1,}:?\s*$")
RE_CELL_SPLIT = re.compile(r"(?<!\\)\|")
RE_BR = re.compile(r"<br\s*/?>", re.IGNORECASE)
RE_LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
RE_INLINE = re.compile(
    r"`(?P<code>[^`]+)`"
    r"|\*\*\*(?P<bi>[^*]+)\*\*\*"
    r"|\*\*(?P<bold>[^*]+(?:\*(?!\*)[^*]*)*)\*\*"
    r"|\*(?P<ital>[^*\s][^*]*)\*"
)
ESCAPABLE = "\\`*_{}[]()#+-.!|>~"
PRIVATE_BASE = 0xE000


# ---------------------------------------------------------------- en línea

def _protect(text):
    if "\\" not in text:
        return text
    return re.sub(r"\\([%s])" % re.escape(ESCAPABLE),
                  lambda m: chr(PRIVATE_BASE + ESCAPABLE.index(m.group(1))), text)


def _restore(text):
    return re.sub(r"[-]", lambda m: ESCAPABLE[ord(m.group(0)) - PRIVATE_BASE], text)


def _run(par, text, bold, italic, size=None, mono=False):
    # python-docx convierte "\n" en salto de línea (w:br) dentro del run
    run = par.add_run(_restore(text))
    if bold:
        run.bold = True
    if italic:
        run.italic = True
    if size is not None:
        run.font.size = size
    if mono:
        run.font.name = MONO
    return run


def add_inline(par, text, bold=False, italic=False, size=None):
    text = RE_BR.sub("\n", RE_LINK.sub(r"\1", _protect(text)))
    pos = 0
    for m in RE_INLINE.finditer(text):
        if m.start() > pos:
            _run(par, text[pos:m.start()], bold, italic, size)
        if m.group("code") is not None:
            _run(par, m.group("code"), bold, italic, size, mono=True)
        elif m.group("bi") is not None:
            _run(par, m.group("bi"), True, True, size)
        elif m.group("bold") is not None:
            _run(par, m.group("bold"), True, italic, size)
        else:
            _run(par, m.group("ital"), bold, True, size)
        pos = m.end()
    if pos < len(text):
        _run(par, text[pos:], bold, italic, size)
    if not par.runs:
        _run(par, "", bold, italic, size)
    return par


# ---------------------------------------------------------------- lectura

def read_lines(path):
    with open(path, "r", encoding="utf-8-sig", newline="") as fh:
        text = fh.read()
    return text.replace("\r\n", "\n").replace("\r", "\n").split("\n")


def clean(line):
    return line.strip().strip(ZERO_WIDTH).strip()


def split_row(line):
    cells = RE_CELL_SPLIT.split(clean(line))
    if cells and not cells[0].strip():
        cells = cells[1:]
    if cells and not cells[-1].strip():
        cells = cells[:-1]
    return [c.strip().replace("\\|", "|") for c in cells]


def is_sep(line):
    cells = split_row(line)
    return bool(cells) and all(RE_TABLE_SEP.match(c) for c in cells)


def parse(lines):
    """Devuelve bloques (tipo, contenido) y la lista de líneas con invisibles."""
    blocks, warn, i, n = [], [], 0, len(lines)
    while i < n:
        raw = lines[i]
        s = clean(raw)
        if any(ch in raw for ch in ZERO_WIDTH):
            warn.append(i + 1)
        if not s or RE_RULE.match(s):
            i += 1
            continue
        if s.startswith("```"):
            code = []
            i += 1
            while i < n and not clean(lines[i]).startswith("```"):
                code.append(lines[i].rstrip())
                i += 1
            blocks.append(("code", code))
            i += 1
            continue
        if s.startswith("|"):
            rows = []
            while i < n and clean(lines[i]).startswith("|"):
                if not is_sep(lines[i]):
                    rows.append(split_row(lines[i]))
                i += 1
            if rows:
                blocks.append(("table", rows))
            continue
        h = RE_HEADING.match(s)
        if h:
            blocks.append(("heading", (len(h.group(1)), h.group(2).strip().rstrip("#").strip())))
        elif s.startswith(">"):
            blocks.append(("quote", s.lstrip(">").strip()))
        elif RE_BULLET.match(raw.rstrip()):
            m = RE_BULLET.match(raw.rstrip())
            blocks.append(("bullet", (2 if len(m.group(1).expandtabs(4)) >= 2 else 1, m.group(2).strip())))
        elif RE_ORDERED.match(raw.rstrip()):
            m = RE_ORDERED.match(raw.rstrip())
            blocks.append(("ordered", (m.group(2), m.group(3).strip())))
        else:
            blocks.append(("para", s))
        i += 1
    return blocks, warn


# ---------------------------------------------------------------- estilos

def setup(doc):
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.left_margin = sec.right_margin = Cm(2.5)
    sec.top_margin = sec.bottom_margin = Cm(2.2)
    normal = doc.styles["Normal"]
    normal.font.name = FONT
    normal.font.size = Pt(11)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    spec = (("Heading 1", 17, NAVY, 24), ("Heading 2", 13, TEAL, 12),
            ("Heading 3", 11, GOLD, 10), ("Heading 4", 11, NAVY, 8))
    for name, size, color, before in spec:
        st = doc.styles[name]
        st.font.name = FONT
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.italic = False
        st.font.color.rgb = color
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(4)
        st.paragraph_format.keep_with_next = True


def usable_width(doc):
    sec = doc.sections[0]
    return sec.page_width - sec.left_margin - sec.right_margin


# ---------------------------------------------------------------- portada

def fact_sheet(blocks):
    for kind, content in blocks:
        if kind == "table" and content and len(content[0]) == 2:
            return {r[0].strip().lower(): r[1].strip() for r in content[1:] if len(r) == 2}
    return {}


def pick(data, *keys):
    for k in keys:
        if k.lower() in data:
            return data[k.lower()]
    return ""


def cover_lines(blocks, args, t):
    if args.titulo:
        out = [("\n\n" + args.titulo, 40, NAVY, True)]
        if args.subtitulo:
            out.append((args.subtitulo, 15, TEAL, False))
        if args.extra:
            out.append((args.extra, 12, NAVY, False))
        return out
    data = fact_sheet(blocks)
    acronym = pick(data, "project acronym", "acrónimo", "acronimo", "acronyme", "acronym")
    title = pick(data, "project title", "título del proyecto", "titulo del proyecto", "titre du projet", "title")
    if not (acronym or title):
        return [("\n\n" + t["generico"], 40, NAVY, True)]
    out = [("\n\n" + (acronym or title), 48, NAVY, True)]
    if acronym and title:
        out.append((title, 15, TEAL, False))
    action = pick(data, "acción", "accion", "action", "key action")
    if action:
        out.append((t["solicitud"] + " Erasmus+ " + action.replace(", ", SEP), 12, NAVY, False))
    third = []
    applicant = pick(data, "solicitante", "applicant", "organisation candidate", "candidat")
    if applicant:
        third.extend(p.strip() for p in applicant.split(", ")[:2] if p.strip())
    agency = pick(data, "agencia nacional", "national agency", "agence nationale",
                  "national agency of the applicant organisation")
    if agency:
        name = agency.replace(" - ", " ")
        third.append(name if re.search(r"agen[cz]", name, re.I) else t["agencia"] + " " + name)
    if third:
        out.append((SEP.join(third), 11, NAVY, False))
    call = pick(data, "convocatoria", "call", "appel")
    if call:
        c = re.sub(r",\s*\d{1,2}:\d{2}[^.]*", "", call).strip().rstrip(".")
        out.append((t["convocatoria"] + " " + SEP.join(p.strip() for p in c.split(". ")), 11, NAVY, False))
    if args.extra:
        out.append((args.extra, 11, NAVY, False))
    return out


def add_cover(doc, blocks, args, t):
    lines = cover_lines(blocks, args, t)
    pie = args.pie if args.pie is not None else t["pie"]
    if pie:
        lines.append(("\n" + pie, 10, GREY, False))
    for text, size, color, bold in lines:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(text)
        r.font.size = Pt(size)
        r.font.color.rgb = color
        r.bold = bold


def page_break(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


# ---------------------------------------------------------------- tablas

def _repeat_header(row):
    trpr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    trpr.append(el)


def _shade(cell, fill):
    tcpr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tcpr.append(shd)


def col_widths(rows, ncols, total, size_pt):
    """Ancho proporcional a la raíz de la longitud media de cada columna, con un
    mínimo que deja caber la palabra más larga de la columna."""
    char_cm = 0.021 * size_pt  # anchura media de un carácter de Calibri en cm
    weights, minimum = [], []
    for c in range(ncols):
        texts = [RE_BR.sub(" ", r[c]) if c < len(r) else "" for r in rows]
        lens = [len(x) for x in texts]
        avg = sum(lens) / max(1, len(lens))
        weights.append(max(math.sqrt(max(avg, 4)), math.sqrt(max(lens) if lens else 4) * 0.5))
        longest = max((len(w) for x in texts for w in x.split()), default=4)
        minimum.append(Cm(max(1.4, min(longest, 14) * char_cm + 0.45)))
    cap = total / ncols
    minimum = [min(m, cap) for m in minimum]
    rest = total - sum(minimum)
    s = sum(weights)
    widths = [m + rest * w / s for m, w in zip(minimum, weights)]
    return [Emu(int(w)) for w in widths]


def add_table(doc, rows):
    ncols = max(len(r) for r in rows)
    size = Pt(9) if ncols <= 7 else Pt(8)
    table = doc.add_table(rows=0, cols=ncols)
    table.style = "Table Grid"
    table.autofit = False
    widths = col_widths(rows, ncols, usable_width(doc), size.pt)
    for idx, row in enumerate(rows):
        tr = table.add_row()
        if idx == 0:
            _repeat_header(tr)
        for c in range(ncols):
            cell = tr.cells[c]
            cell.width = widths[c]
            if idx == 0:
                _shade(cell, HEADER_FILL)
            par = cell.paragraphs[0]
            par.paragraph_format.space_after = Pt(0)
            add_inline(par, row[c] if c < len(row) else "", bold=(idx == 0), size=size)
    doc.add_paragraph()


# ---------------------------------------------------------------- montaje

def build(args):
    t = TXT[args.lang]
    blocks, warn = parse(read_lines(args.entrada))
    levels = [c[0] for k, c in blocks if k == "heading"]
    top = min(levels) if levels else 1
    doc = Document()
    setup(doc)
    stats = dict(encabezados=0, parrafos=0, vinetas=0, numeradas=0, tablas=0, filas=0, saltos=0)
    if not args.sin_portada:
        add_cover(doc, blocks, args, t)
        page_break(doc)
    started = False  # ya hay contenido en la página actual
    for kind, content in blocks:
        if kind == "heading":
            level, text = content
            rel = min(level - top + 1, 4)
            if level == top and started:
                page_break(doc)
                stats["saltos"] += 1
            add_inline(doc.add_paragraph(style="Heading %d" % max(rel, 1)), text)
            stats["encabezados"] += 1
        elif kind == "table":
            add_table(doc, content)
            stats["tablas"] += 1
            stats["filas"] += len(content)
        elif kind == "bullet":
            level, text = content
            add_inline(doc.add_paragraph(style="List Bullet" if level == 1 else "List Bullet 2"), text)
            stats["vinetas"] += 1
        elif kind == "ordered":
            num, text = content
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.9)
            p.paragraph_format.first_line_indent = Cm(-0.6)
            add_inline(p, num + " " + text)
            stats["numeradas"] += 1
        elif kind == "quote":
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(1)
            add_inline(p, content, italic=True)
            stats["parrafos"] += 1
        elif kind == "code":
            p = doc.add_paragraph()
            _run(p, "\n".join(content), False, False, Pt(9), mono=True)
        else:
            add_inline(doc.add_paragraph(), content)
            stats["parrafos"] += 1
        started = True
    doc.save(args.salida)
    return stats, warn


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(description="Markdown de solicitud a Word con portada y tablas.")
    ap.add_argument("entrada")
    ap.add_argument("salida")
    ap.add_argument("--titulo", default="", help="título de portada (si falta, se lee de la ficha)")
    ap.add_argument("--subtitulo", default="")
    ap.add_argument("--extra", default="", help="línea adicional de portada")
    ap.add_argument("--pie", default=None, help="pie de portada (por defecto, el del idioma)")
    ap.add_argument("--lang", choices=sorted(TXT), default="es", help="idioma de los textos fijos")
    ap.add_argument("--sin-portada", action="store_true")
    args = ap.parse_args(argv)
    stats, warn = build(args)
    print("OK", args.salida)
    print("  " + ", ".join("%s %d" % kv for kv in stats.items()))
    for n in warn:
        print("  aviso: carácter invisible en la línea %d del markdown; conviene limpiarlo" % n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
