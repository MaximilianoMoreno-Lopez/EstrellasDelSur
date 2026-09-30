# -*- coding: utf-8 -*-
"""Cuenta los caracteres con espacios de cada respuesta de una solicitud en markdown.

Una respuesta es el texto que va desde un encabezado "### " hasta el siguiente
encabezado de cualquier nivel. Se cuenta como lo cuenta el portal después de
pegar, es decir sin el marcado markdown (**, *, `, viñetas "- ") y con cada
salto de párrafo como un carácter. Las líneas de recuento del tipo
"*4.321 caracteres - OK*" y las rayas "---" no cuentan.

Si la respuesta contiene una tabla, cada celda del cuerpo se cuenta por separado
(la fila de cabecera no), porque en el portal cada celda es un campo distinto,
como la tabla de actividades mensuales del ESC30. Un <br> dentro de la celda
cuenta como un salto de línea. El texto fuera de la tabla, si lo hay, se cuenta
aparte como la respuesta.

Uso:
    py contar.py fichero.md [otro.md ...] [--limite 5000] [--limite-celda 2000]
                 [--todas-celdas] [--solo-sobre]

Marca SOBRE lo que pasa del límite. Sale con código 1 si algo pasa del límite,
para poder usarlo en una comprobación automática.
"""
import argparse
import re
import sys

RE_HEADING = re.compile(r"^#{1,6}\s")
RE_MARKER = re.compile(r"^\*?\s*[\d.,\s]+(caracteres|caractères|characters|chars)\b.*$", re.I)
RE_BR = re.compile(r"<br\s*/?>", re.I)


def limpiar(texto):
    t = RE_BR.sub("\n", texto)
    t = re.sub(r"\*\*\*(.+?)\*\*\*", r"\1", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"\1", t)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    t = re.sub(r"\[([^\]]+)\]\([^)\s]+\)", r"\1", t)
    t = re.sub(r"(?m)^\s*[-*+]\s+", "", t)
    t = re.sub(r"(?m)^\s*>\s?", "", t)
    t = re.sub(r"(?m)^[ \t]+|[ \t]+$", "", t)
    t = re.sub(r"\n{2,}", "\n", t)
    return t.strip()


def celdas(linea):
    partes = re.split(r"(?<!\\)\|", linea.strip())
    if partes and not partes[0].strip():
        partes = partes[1:]
    if partes and not partes[-1].strip():
        partes = partes[:-1]
    return [p.strip() for p in partes]


def es_separador(linea):
    cs = celdas(linea)
    return bool(cs) and all(re.match(r"^:?-+:?$", c) for c in cs)


def respuestas(lineas):
    """Genera (número de línea, encabezado, líneas del cuerpo)."""
    actual, inicio, cuerpo = None, 0, []
    for n, linea in enumerate(lineas, 1):
        if RE_HEADING.match(linea):
            if actual is not None:
                yield inicio, actual, cuerpo
            actual = linea.strip()[4:] if linea.startswith("### ") else None
            inicio, cuerpo = n, []
        elif actual is not None:
            cuerpo.append(linea)
    if actual is not None:
        yield inicio, actual, cuerpo


def analizar(cuerpo):
    """Separa prosa y tablas. Devuelve (texto de prosa, lista de tablas)."""
    prosa, tablas, tabla = [], [], None
    for linea in cuerpo:
        s = linea.strip()
        if s.startswith("|"):
            if tabla is None:
                tabla = []
                tablas.append(tabla)
            if not es_separador(s):
                tabla.append(celdas(s))
            continue
        tabla = None
        if RE_MARKER.match(s.strip("*").strip()) or re.match(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$", s):
            continue
        prosa.append(linea)
    return limpiar("\n".join(prosa)), tablas


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(description="Caracteres con espacios por respuesta y por celda.")
    ap.add_argument("ficheros", nargs="+")
    ap.add_argument("--limite", type=int, default=5000, help="tope por respuesta (5000)")
    ap.add_argument("--limite-celda", type=int, default=None,
                    help="tope por celda de tabla (por defecto, el mismo que --limite)")
    ap.add_argument("--todas-celdas", action="store_true", help="lista todas las celdas, no solo el máximo")
    ap.add_argument("--solo-sobre", action="store_true", help="muestra solo lo que pasa del límite")
    a = ap.parse_args(argv)
    lim_celda = a.limite_celda or a.limite
    sobre_total = 0

    for ruta in a.ficheros:
        with open(ruta, encoding="utf-8-sig") as fh:
            lineas = fh.read().replace("\r\n", "\n").split("\n")
        print("== %s" % ruta)
        for inicio, titulo, cuerpo in respuestas(lineas):
            texto, tablas = analizar(cuerpo)
            n = len(texto)
            if not tablas or n:
                estado = "SOBRE" if n > a.limite else "ok"
                sobre_total += estado == "SOBRE"
                if not (a.solo_sobre and estado == "ok"):
                    print("%6d  %-5s  l.%-5d %s" % (n, estado, inicio, titulo[:90]))
            for k, tabla in enumerate(tablas, 1):
                if len(tabla) < 2:
                    continue
                cab, filas = tabla[0], tabla[1:]
                medidas = []
                for i, fila in enumerate(filas, 1):
                    for j, valor in enumerate(fila):
                        col = cab[j] if j < len(cab) else "col %d" % (j + 1)
                        medidas.append((len(limpiar(valor)), i, fila[0][:20] if fila else "", col[:30]))
                if not medidas:
                    continue
                n_sobre = sum(m[0] > lim_celda for m in medidas)
                sobre_total += n_sobre
                mayor = max(medidas)
                estado = "SOBRE" if n_sobre else "ok"
                if not (a.solo_sobre and not n_sobre):
                    etiqueta = "tabla %d" % k if len(tablas) > 1 else "tabla"
                    print("%6d  %-5s  l.%-5d %s | %s: %d celdas por separado, tope %d por celda, "
                          "la mayor en fila %d (%s / %s)" % (mayor[0], estado, inicio, titulo[:60], etiqueta,
                                                             len(medidas), lim_celda, mayor[1], mayor[2], mayor[3]))
                for m in medidas:
                    if a.todas_celdas or m[0] > lim_celda:
                        print("%14d  %-5s  fila %d (%s / %s)" % (m[0], "SOBRE" if m[0] > lim_celda else "ok",
                                                                 m[1], m[2], m[3]))
    if sobre_total:
        print("\n%d respuesta(s) o celda(s) por encima del límite" % sobre_total)
    return 1 if sobre_total else 0


if __name__ == "__main__":
    sys.exit(main())
