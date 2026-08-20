# -*- coding: utf-8 -*-
"""Comprobación mecánica de un borrador de solicitud.

Busca lo que un verificador humano se salta y una lectura rápida no ve: guiones
largos, emojis, anglicismos, códigos internos fuera de su sección, tics de
redacción, placeholders inconsistentes y encabezados que faltan.

Uso:
    python comprobacion_mecanica.py <fichero.md>
    python comprobacion_mecanica.py <directorio> --patron "final_*.md"
    python comprobacion_mecanica.py <ensamblado.md> --seccion-codigos rationale

--seccion-codigos recibe un trozo de texto que identifica la sección donde SÍ
se permiten los códigos internos N1/O1. Se compara con el nombre del fichero y
con el encabezado "## " vigente, así que sirve tanto por bloques como sobre el
documento ensamblado.

Salida: una línea por hallazgo. Código de salida 1 si hay hallazgos duros.
"""
import argparse
import glob
import os
import re
import sys
from collections import Counter

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Comprobaciones que se aplican a cualquier línea.
DUROS = [
    ("guion largo o semilargo", re.compile(r"[–—]")),
    ("emoji o pictograma", re.compile(
        "[\U0001F300-\U0001FAFF\U00002700-\U000027BF\U00002600-\U000026FF\U0001F1E6-\U0001F1FF]")),
    ("marca de edicion olvidada", re.compile(r"\b(TODO|TBD|XXX|FIXME|LOREM)\b")),
    ("placeholder vacio", re.compile(r"\[\s*\]")),
    ("doble espacio", re.compile(r"\S  +\S")),
]

# Solo en prosa española: ni encabezados con la pregunta oficial ni traducciones.
DUROS_ES = [
    ("anglicismo evitable", re.compile(r"\b(feedback|newcomers?|networking|know-how|deadline)\b", re.I)),
    ("comilla tipografica suelta", re.compile(r"[“”]")),
]

BLANDOS = [
    ("patron no X sino Y", re.compile(r"\bno\s+[^.,;]{2,60},?\s+sino\b", re.I)),
    ("andamiaje enumerativo", re.compile(
        r"\b(distinguimos|identificamos|hemos identificado|se articula en|abordamos)\s+"
        r"(dos|tres|cuatro|cinco)\b", re.I)),
]

CODIGOS = re.compile(r"\b[NO][1-9]\b")
PLACEHOLDER = re.compile(r"\[([^\]\[]{2,80})\]")
INGLES = re.compile(r"\b(the|of|and|will|your|you|are|how|what|please|project)\b", re.I)


def es_ingles(linea):
    """Heurística barata: una línea con muchas palabras función inglesas es inglés."""
    return len(INGLES.findall(linea)) >= 4


def ficheros_de(entradas, patron):
    salida = []
    for e in entradas:
        if os.path.isdir(e):
            salida.extend(sorted(glob.glob(os.path.join(e, patron))))
        else:
            salida.append(e)
    return salida


def revisar(path, seccion_codigos, limite_blandos):
    hallazgos = []
    with open(path, encoding="utf-8") as f:
        lineas = f.read().splitlines()

    nombre = os.path.basename(path).lower()
    clave = (seccion_codigos or "").lower()
    codigos_permitidos_por_fichero = bool(clave) and clave in nombre
    seccion_actual = ""
    blandos = Counter()
    encabezados = 0
    placeholders = Counter()

    for n, linea in enumerate(lineas, 1):
        if linea.startswith("## "):
            seccion_actual = linea[3:].strip().lower()
        if linea.startswith("### "):
            encabezados += 1
        es_encabezado = linea.startswith("#")
        vistos = set()

        for etiqueta, rx in DUROS:
            if rx.search(linea) and etiqueta not in vistos:
                vistos.add(etiqueta)
                m = rx.search(linea)
                hallazgos.append(("DURO", n, etiqueta, linea[max(0, m.start() - 30):m.end() + 30].strip()))

        if not es_encabezado and not es_ingles(linea):
            for etiqueta, rx in DUROS_ES:
                m = rx.search(linea)
                if m:
                    hallazgos.append(("DURO", n, etiqueta, linea[max(0, m.start() - 30):m.end() + 30].strip()))
            for etiqueta, rx in BLANDOS:
                blandos[etiqueta] += len(rx.findall(linea))

        codigos_ok = codigos_permitidos_por_fichero or (clave and clave in seccion_actual)
        if not codigos_ok and not es_encabezado:
            m = CODIGOS.search(linea)
            if m:
                hallazgos.append(("DURO", n, "codigo interno fuera de su seccion",
                                  linea[max(0, m.start() - 30):m.end() + 30].strip()))

        for m in PLACEHOLDER.finditer(linea):
            placeholders[m.group(1).strip()] += 1

    for etiqueta, cuenta in blandos.items():
        tope = limite_blandos.get(etiqueta, 1)
        if cuenta > tope:
            hallazgos.append(("BLANDO", 0, f"{etiqueta} aparece {cuenta} veces (tope {tope})", ""))

    return hallazgos, encabezados, placeholders


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entradas", nargs="+", help="ficheros .md o un directorio")
    ap.add_argument("--patron", default="final_*.md", help="patrón si la entrada es un directorio")
    ap.add_argument("--seccion-codigos", default="",
                    help="fichero o encabezado donde SÍ se permiten los códigos N1/O1")
    ap.add_argument("--encabezados-esperados", type=int, default=0,
                    help="encabezados ### esperados por fichero; 0 desactiva la comprobación")
    ap.add_argument("--tope-no-sino", type=int, default=1,
                    help="apariciones permitidas del patrón no X sino Y por fichero")
    args = ap.parse_args()

    paths = ficheros_de(args.entradas, args.patron)
    if not paths:
        print("No hay ficheros que revisar")
        return 1

    limite_blandos = {"patron no X sino Y": args.tope_no_sino, "andamiaje enumerativo": 0}
    total_duros = 0
    placeholders_global = Counter()

    for path in paths:
        hallazgos, encabezados, placeholders = revisar(path, args.seccion_codigos, limite_blandos)
        placeholders_global.update(placeholders)
        total_duros += len([h for h in hallazgos if h[0] == "DURO"])
        print(f"\n=== {os.path.basename(path)} ({encabezados} encabezados ###) ===")
        if args.encabezados_esperados and encabezados != args.encabezados_esperados:
            print(f"  [DURO] encabezados: {encabezados}, esperados {args.encabezados_esperados}")
            total_duros += 1
        if not hallazgos:
            print("  limpio")
        for tipo, n, etiqueta, frag in hallazgos:
            sitio = f"linea {n}" if n else "bloque"
            print(f"  [{tipo}] {sitio}: {etiqueta}" + (f" -> {frag}" if frag else ""))

    print("\n=== placeholders (cada concepto debe usar un solo token) ===")
    for token, cuenta in sorted(placeholders_global.items()):
        print(f"  {cuenta:3d}x [{token}]")

    print(f"\nHallazgos duros: {total_duros}")
    return 1 if total_duros else 0


if __name__ == "__main__":
    sys.exit(main())
