# -*- coding: utf-8 -*-
"""Comprueba que el día de la semana de cada fecha escrita en los markdown es el correcto.

Busca fechas con día de la semana en español, francés e inglés, por ejemplo
"sábado 24 de abril de 2027", "el sábado, 24 de abril", "samedi 24 avril 2027",
"samedi 1er mai", "sábado 24/04/2027", "lunes 19/04", "Saturday 24 April 2027",
"Saturday, April 24, 2027" o "Saturday 24th of April".

Año. Si la fecha no lo lleva se usa --anio; sin --anio, el año de la última fecha
completa o del último "mes año" del mismo fichero; si no hay ninguno, se informa
como "sin año".

Mes por contexto. "Martes 2" o "del lunes 19 al lunes 26 avril" no dicen el mes
junto al número. Si justo después viene un rango ("al", "au", "to", "y", "et",
"and" o un guion) con mes, se toma ese mes; si no, el último mes que haya
aparecido antes, en la misma línea o en las anteriores, con año ("Marzo de
2027." al principio de la celda de un mes del ESC30) o al empezar frase ("Mayo
es el mes...", "En abril"). Un mes a media frase ("las jornadas de junio") no
cambia el contexto. Esas fechas se marcan "(mes por contexto)" y conviene
mirarlas con ojo humano si salen como error. --sin-contexto las ignora.

Uso:
    py fechas.py fichero.md [otro.md ...] [--anio 2027] [--todas] [--sin-contexto]

Informe: fichero:línea, texto encontrado, y el día correcto cuando no cuadra.
Sale con código 1 si hay algún error.
"""
import argparse
import datetime as dt
import re
import sys
import unicodedata


def sin_tildes(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


DIAS = {  # nombre sin tildes y en minúsculas -> weekday() de Python (lunes = 0)
    "lunes": 0, "martes": 1, "miercoles": 2, "jueves": 3, "viernes": 4, "sabado": 5, "domingo": 6,
    "lundi": 0, "mardi": 1, "mercredi": 2, "jeudi": 3, "vendredi": 4, "samedi": 5, "dimanche": 6,
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
}
NOMBRE = {
    "es": ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"],
    "fr": ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
    "en": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
}
IDIOMA_DIA = {sin_tildes(d).lower(): lang for lang, dias in NOMBRE.items() for d in dias}

MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6, "julio": 7,
    "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
    "janvier": 1, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5, "juin": 6, "juillet": 7,
    "aout": 8, "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12,
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6, "july": 7,
    "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "sept": 9,
    "oct": 10, "nov": 11, "dec": 12,
}

D = "|".join(sorted(DIAS, key=len, reverse=True))
M = "|".join(sorted(MESES, key=len, reverse=True))
NUM = r"(?P<d>\d{1,2})(?:er|st|nd|rd|th|º|°)?"
ANIO = r"(?P<y>\d{4})"
# Todas las expresiones se aplican al texto sin tildes y en minúsculas, que
# conserva la misma longitud que el original (NFD + quitar marcas se hace por carácter).
PATRONES = [
    # sábado 24/04/2027, lunes 19/04, samedi 24.04.27
    re.compile(r"\b(?P<w>%s)\b,?\s+(?:el\s+|le\s+|the\s+|dia\s+)?(?P<d>\d{1,2})[/.](?P<m>\d{1,2})(?:[/.](?P<y>\d{2,4}))?\b" % D),
    # sábado 24 de abril de 2027, samedi 24 avril 2027, Saturday 24th of April, 2027
    re.compile(r"\b(?P<w>%s)\b,?\s+(?:el\s+|le\s+|the\s+|dia\s+)?%s\s+(?:de\s+|of\s+)?(?P<mn>%s)\b\.?(?:,?\s+(?:de\s+|del\s+)?%s\b)?" % (D, NUM, M, ANIO)),
    # Saturday, April 24, 2027
    re.compile(r"\b(?P<w>%s)\b,?\s+(?P<mn>%s)\b\.?\s+%s\b(?:,?\s+%s\b)?" % (D, M, NUM, ANIO)),
]
# día de la semana y número sin mes: "martes 2", "du lundi 19 au lundi 26 avril"
SOLO_NUM = re.compile(r"\b(?P<w>%s)\b,?\s+(?:el\s+|le\s+|the\s+|dia\s+)?%s\b(?!\s*[/.:h]\s*\d)(?!\s*(?:h|am|pm|km|%%|horas|heures|hours)\b)" % (D, NUM))
RANGO = re.compile(r"^\s*(?:,\s*)?(?:al|au|to|y|et|and|-|a)\s+(?:(?:el|le|the)\s+)?(?:(?:%s)\s+)?\d{1,2}(?:er|st|nd|rd|th)?\s+(?:de\s+|of\s+)?(?P<mn>%s)\b(?:\s+(?:de\s+)?(?P<y>\d{4}))?" % (D, M))
# mes con año para el contexto: "marzo de 2027", "avril 2027", "April 2027", y fechas completas
CTX_MES = re.compile(r"\b(?P<mn>%s)\b\.?\s+(?:de\s+|del\s+)?(?P<y>\d{4})\b" % M)
# mes suelto sin año ("Mayo es el mes...", "En abril"), solo nombres completos
MESES_COMPLETOS = [m for m in MESES if len(m) > 3 or m in ("mai", "may")]
# Solo al empezar frase o tras "en", "in", "durante"...; "las jornadas de junio" no cambia el mes.
CTX_MES_SOLO = re.compile(
    r"(?:^|[.!?:;|]\s*|<br\s*/?>\s*|\b(?:en|in|durante|during|au mois de|en el mes de)\s+)(?:[*_\s]*)"
    r"(?P<mn>%s)\b" % "|".join(sorted(MESES_COMPLETOS, key=len, reverse=True)))
CTX_NUM = re.compile(r"\b\d{1,2}[/.](?P<m>\d{1,2})[/.](?P<y>\d{4})\b")


def normal(linea):
    """Minúsculas sin tildes, misma longitud que la línea original."""
    return "".join(((sin_tildes(c) or c).lower() or c)[:1] for c in linea)


def anio4(y):
    y = int(y)
    return y + 2000 if y < 100 else y


def comprobar(texto_linea, norm, estado, args):
    """Devuelve la lista de hallazgos de una línea y actualiza el contexto."""
    hallazgos, ocupado = [], []

    def solapa(a, b):
        return any(a < y and b > x for x, y in ocupado)

    eventos = []  # (posición, tipo, datos) para recorrer la línea en orden
    for pat in PATRONES:
        for m in pat.finditer(norm):
            if solapa(*m.span()):
                continue
            ocupado.append(m.span())
            g = m.groupdict()
            mes = int(g["m"]) if g.get("m") else MESES[g["mn"]]
            eventos.append((m.start(), "fecha", m, mes, g.get("y"), False))
    if not args.sin_contexto:
        for m in SOLO_NUM.finditer(norm):
            if solapa(*m.span()):
                continue
            ocupado.append(m.span())
            eventos.append((m.start(), "suelta", m, None, None, True))
    for m in CTX_MES.finditer(norm):
        eventos.append((m.start(), "ctx", m, MESES[m.group("mn")], m.group("y"), False))
    for m in CTX_MES_SOLO.finditer(norm):
        # "may" en inglés solo cuenta con mayúscula, para no confundirlo con el verbo
        if m.group("mn") == "may" and texto_linea[m.start("mn")] != "M":
            continue
        eventos.append((m.start("mn"), "ctx_solo", m, MESES[m.group("mn")], None, False))
    for m in CTX_NUM.finditer(norm):
        eventos.append((m.start(), "ctx", m, int(m.group("m")), m.group("y"), False))
    eventos.sort(key=lambda e: (e[0], e[1] not in ("ctx", "ctx_solo"), e[1] == "ctx_solo"))

    for pos, tipo, m, mes, y, por_contexto in eventos:
        if tipo == "ctx":
            estado["mes"], estado["anio_mes"] = mes, int(y)
            estado["anio"] = int(y)
            continue
        if tipo == "ctx_solo":
            anio_ctx = args.anio or estado.get("anio")
            if anio_ctx:
                estado["mes"], estado["anio_mes"] = mes, anio_ctx
            continue
        if tipo == "anio":
            estado["anio"] = int(y)
            continue
        dia_txt = m.group("w")
        nota = ""
        if tipo == "suelta":
            r = RANGO.match(norm[m.end():])
            if r:
                mes = MESES[r.group("mn")]
                y = r.group("y")
                nota = " (mes del rango)"
            elif estado.get("mes"):
                mes, y = estado["mes"], estado["anio_mes"]
                nota = " (mes por contexto)"
            else:
                continue
        anio = anio4(y) if y else (args.anio or estado.get("anio"))
        if not y and not args.anio and anio:
            nota += " (año %d supuesto, mejor con --anio)" % anio
        dia = int(m.group("d"))
        texto = texto_linea[m.start():m.end()].strip().rstrip(".,")
        if not anio:
            hallazgos.append(("SIN AÑO", texto, "usa --anio"))
            continue
        try:
            f = dt.date(anio, mes, dia)
        except ValueError:
            hallazgos.append(("NO EXISTE", texto, "%02d/%02d/%d no es una fecha válida%s" % (dia, mes, anio, nota)))
            continue
        if y:
            estado["anio"] = anio
        escrito = DIAS[dia_txt]
        lang = IDIOMA_DIA[dia_txt]
        if f.weekday() == escrito:
            hallazgos.append(("ok", texto, "%s %s%s" % (NOMBRE[lang][f.weekday()], f.strftime("%d/%m/%Y"), nota)))
        else:
            hallazgos.append(("ERROR", texto, "el %s es %s, no %s%s" % (
                f.strftime("%d/%m/%Y"), NOMBRE[lang][f.weekday()], NOMBRE[lang][escrito], nota)))
    return hallazgos


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(description="Comprueba el día de la semana de las fechas escritas.")
    ap.add_argument("ficheros", nargs="+")
    ap.add_argument("--anio", type=int, default=None, help="año para las fechas que no lo llevan")
    ap.add_argument("--todas", action="store_true", help="lista también las fechas correctas")
    ap.add_argument("--sin-contexto", action="store_true", help="ignora 'martes 2' sin mes al lado")
    a = ap.parse_args(argv)
    total = errores = 0
    for ruta in a.ficheros:
        with open(ruta, encoding="utf-8-sig") as fh:
            lineas = fh.read().replace("\r\n", "\n").split("\n")
        estado = {}
        for n, linea in enumerate(lineas, 1):
            for tipo, texto, detalle in comprobar(linea, normal(linea), estado, a):
                total += 1
                if tipo != "ok":
                    errores += 1
                if tipo != "ok" or a.todas:
                    print("%s:%d  %-9s %-45s %s" % (ruta, n, tipo, texto[:45], detalle))
    print("\n%d fechas con día de la semana revisadas, %d con problema" % (total, errores))
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main())
