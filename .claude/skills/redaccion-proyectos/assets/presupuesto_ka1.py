# -*- coding: utf-8 -*-
"""Calculadora de presupuesto de movilidad juvenil Erasmus+ (KA152, KA153, KA155) y de ESC30.

Importes de la Guía del Programa Erasmus+ 2026 (versión francesa, tablas A2.1 y
A2.2 y reglas de financiación de cada acción) y, para el ESC30, de la Guía del
Cuerpo Europeo de Solidaridad 2026. Si sale una guía nueva, se cambian las
constantes de arriba y nada más.

Uso:
    py presupuesto_ka1.py entrada.json [--out presupuesto.md] [--lang es|fr|en]

Entrada KA152 / KA153 / KA155 (JSON):
    {
      "accion": "KA152",              KA152, KA153 o KA155
      "idioma": "fr",                 es, fr o en (textos y formato de números)
      "actividad": "YEX01 Cadres Communs",
      "pais_actividad": "FR",         código ISO o nombre; fija el apoyo individual
      "dias_actividad": 8,            días de actividad sin viaje
      "dias_viaje": 2,                días de viaje con apoyo individual (por defecto 2)
      "tarifa_dia": null,             opcional, fuerza el importe diario
      "flujos": [
        {"nombre": "1 France", "origen": "FR", "personas": 8, "participantes": 5,
         "menos_oportunidades": 3, "banda": "0-9", "green": false, "dias_extra": 0},
        {"nombre": "2 Espagne", "origen": "ES", "personas": 6, "participantes": 5,
         "menos_oportunidades": 3, "distancia_km": 1050, "green": true, "dias_extra": 2}
      ],
      "costes_reales": {"inclusion_participantes": 0, "excepcionales": 0}
    }

    personas = todas las que viajan y cobran apoyo individual (participantes,
    group leaders, facilitadores, acompañantes). participantes = las que generan
    apoyo organizativo (sin group leaders, formadores ni acompañantes, según la
    acción). menos_oportunidades = participantes con menos oportunidades (apoyo
    a la inclusión de la organización). banda o distancia_km = banda de viaje;
    "0-9" es sin viaje. green = viaje sostenible. dias_extra = días de viaje
    adicionales por viaje sostenible (máximo 4). Cada flujo puede sobrescribir
    dias_actividad y dias_viaje.

Entrada ESC30 (JSON):
    {"accion": "ESC30", "idioma": "es", "pais": "ES", "meses": 4, "dias_coach": 3,
     "coach_dia": null, "costes_reales": {"inclusion": 0, "excepcionales": 0}}

Salida: tablas markdown listas para pegar (flujos y resumen) y el total.
"""
import argparse
import json
import sys
import unicodedata

# ------------------------------------------------------------ importes 2026

APOYO_ORGANIZATIVO = 125      # por participante (KA152, KA153, KA155)
APOYO_INCLUSION = 125         # por participante con menos oportunidades
KA155_DIA = 78                # KA155 DiscoverEU inclusión: 78 al día, máximo 21 días
KA155_MAX_DIAS = 21
MAX_DIAS_GREEN = 4            # días de viaje adicionales con viaje sostenible
ESC30_MES = 630               # ESC30, costes del proyecto por mes
ESC30_COACH = {"ES": 227, "FR": 255}   # ESC30, coach por día y país (confirmados)

# Bandas de distancia: (estándar, sostenible) por persona, ida y vuelta
BANDAS = [
    ("0-9", 0, 9, 0, 0),
    ("10-99", 10, 99, 28, 56),
    ("100-499", 100, 499, 211, 285),
    ("500-1999", 500, 1999, 309, 417),
    ("2000-2999", 2000, 2999, 395, 535),
    ("3000-3999", 3000, 3999, 580, 785),
    ("4000-7999", 4000, 7999, 1188, 1188),
    ("8000+", 8000, 10 ** 6, 1735, 1735),
]

# Apoyo individual por día y país de la actividad.
# A21 = tabla A2.1 (intercambios juveniles KA152 y actividades de participación KA154)
# A22 = tabla A2.2 (movilidad de trabajadores juveniles KA153)
# Leídas de la Guía 2026 en francés, páginas 182-183 y 197.
PAISES = {
    # ISO: (nombres, A21, A22)
    "AT": (["austria", "autriche"], 78, 84),
    "BE": (["belgica", "belgique", "belgium"], 78, 88),
    "BG": (["bulgaria", "bulgarie"], 45, 60),
    "HR": (["croacia", "croatie", "croatia"], 57, 75),
    "CY": (["chipre", "chypre", "cyprus"], 63, 81),
    "CZ": (["chequia", "republica checa", "tchequie", "czechia", "czech republic"], 53, 65),
    "DK": (["dinamarca", "danemark", "denmark"], 81, 95),
    "EE": (["estonia", "estonie"], 48, 76),
    "FI": (["finlandia", "finlande", "finland"], 79, 93),
    "FR": (["francia", "france"], 67, 85),
    "DE": (["alemania", "allemagne", "germany"], 71, 77),
    "GR": (["grecia", "grece", "greece"], 68, 80),
    "HU": (["hungria", "hongrie", "hungary"], 60, 77),
    "IS": (["islandia", "islande", "iceland"], 76, 99),
    "IE": (["irlanda", "irlande", "ireland"], 73, 91),
    "IT": (["italia", "italie", "italy"], 69, 85),
    "LV": (["letonia", "lettonie", "latvia"], 48, 66),
    "LI": (["liechtenstein"], 77, 84),
    "LT": (["lituania", "lituanie", "lithuania"], 49, 65),
    "LU": (["luxemburgo", "luxembourg"], 77, 84),
    "MT": (["malta", "malte"], 57, 77),
    "NL": (["paises bajos", "pays-bas", "netherlands", "holanda"], 69, 92),
    "MK": (["macedonia del norte", "macedoine du nord", "north macedonia"], 41, 57),
    "NO": (["noruega", "norvege", "norway"], 83, 94),
    "PL": (["polonia", "pologne", "poland"], 51, 68),
    "PT": (["portugal"], 57, 78),
    "RO": (["rumania", "roumanie", "romania"], 46, 64),
    "RS": (["serbia", "serbie"], 47, 59),
    "SK": (["eslovaquia", "slovaquie", "slovakia"], 48, 67),
    "SI": (["eslovenia", "slovenie", "slovenia"], 54, 78),
    "ES": (["espana", "espagne", "spain"], 58, 81),
    "SE": (["suecia", "suede", "sweden"], 72, 87),
    "TR": (["turquia", "turquie", "turkey", "turkiye"], 50, 68),
    # Terceros países vecinos no asociados (Balcanes occidentales, Asociación Oriental,
    # Mediterráneo sur, Rusia): una sola tarifa
    "VECINO": (["tercer pais vecino", "pays tiers voisin", "neighbouring third country",
                "ucrania", "ukraine", "georgia", "georgie", "armenia", "armenie", "moldavia",
                "moldova", "albania", "albanie", "bosnia", "bosnie", "montenegro", "kosovo",
                "marruecos", "maroc", "morocco", "tunez", "tunisie", "tunisia", "egipto",
                "egypte", "egypt", "jordania", "jordanie", "jordan", "libano", "liban",
                "lebanon", "palestina", "palestine", "argelia", "algerie", "algeria"], 44, 62),
}

# ------------------------------------------------------------ textos

TXT = {
    "es": dict(flujo="Flujo", personas="Personas", dias="Días", ind="Apoyo individual ({t} € al día)",
               viaje="Viaje", green="Viaje sostenible", org="Apoyo organizativo (125 € por participante)",
               inc="Apoyo a la inclusión (125 € por participante con menos oportunidades)", total="Total",
               d="d", concepto="Concepto", calculo="Cálculo", importe="Importe",
               esc_mes="Costes del proyecto ({m} meses × 630 €)", esc_coach="Coach ({d} días × {t} €)",
               esc_inc="Apoyo a la inclusión (costes reales)", esc_exc="Costes excepcionales",
               total_act="Total de la actividad",
               resumen="{p} personas, {q} participantes, {m} con menos oportunidades, apoyo individual a {t} € al día"),
    "fr": dict(flujo="Flow", personas="Personnes", dias="Jours", ind="Individual support ({t} € par jour)",
               viaje="Travel", green="Green travel", org="Organisational support (125 € par participant)",
               inc="Inclusion support for organisations (125 € par participant ayant moins d'opportunités)",
               total="Total", d="j", concepto="Poste", calculo="Calcul", importe="Montant",
               esc_mes="Coûts du projet ({m} mois × 630 €)", esc_coach="Coach ({d} jours × {t} €)",
               esc_inc="Soutien à l'inclusion (coûts réels)", esc_exc="Coûts exceptionnels",
               total_act="Total de l'activité",
               resumen="{p} personnes, {q} participants dont {m} ayant moins d'opportunités, {t} € par jour"),
    "en": dict(flujo="Flow", personas="Persons", dias="Days", ind="Individual support ({t} € per day)",
               viaje="Travel", green="Green travel", org="Organisational support (125 € per participant)",
               inc="Inclusion support for organisations (125 € per participant with fewer opportunities)",
               total="Total", d="d", concepto="Item", calculo="Calculation", importe="Amount",
               esc_mes="Project costs ({m} months × 630 €)", esc_coach="Coach ({d} days × {t} €)",
               esc_inc="Inclusion support (real costs)", esc_exc="Exceptional costs",
               total_act="Total activity grant",
               resumen="{p} persons, {q} participants, {m} with fewer opportunities, {t} € per day"),
}
# Nombres de las partidas tal como las muestra el portal (siempre en inglés)
RESUMEN = [("viaje", "Travel Grant"), ("green", "Green travel"), ("org", "Organisational Support Grant"),
           ("ind", "Individual Support Grant"), ("inc", "Inclusion support for organisations"),
           ("inc_part", "Inclusion support for participants"), ("exc", "Exceptional costs")]


def eur(x, lang, simbolo=True):
    s = "{:,.2f}".format(x)
    if lang == "es":
        s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    elif lang == "fr":
        s = s.replace(",", " ").replace(".", ",")
    return s + (" €" if simbolo else "")


def ent(x, lang):
    """Entero con separador de miles del idioma (para las fórmulas)."""
    s = "{:,}".format(int(x))
    return s.replace(",", "." if lang == "es" else (" " if lang == "fr" else ","))


def llave(s):
    s = "".join(c for c in unicodedata.normalize("NFD", str(s)) if unicodedata.category(c) != "Mn")
    return s.lower().strip()


def pais(valor):
    k = llave(valor)
    if k.upper() in PAISES:
        return k.upper()
    for iso, (nombres, _, _) in PAISES.items():
        if k in nombres or any(k.startswith(n) for n in nombres):
            return iso
    raise SystemExit("País no reconocido: %r. Usa el código ISO (FR, ES, IT...) o añádelo a PAISES." % valor)


def banda(flujo):
    if "distancia_km" in flujo and flujo["distancia_km"] is not None:
        km = float(flujo["distancia_km"])
        for b in BANDAS:
            if b[1] <= km <= b[2] + 0.999:
                return b
    nombre = str(flujo.get("banda", "0-9")).replace(" ", "").replace("km", "").replace("\u2013", "-")
    nombre = {"8000-": "8000+", "8000ormore": "8000+", "0": "0-9"}.get(nombre, nombre)
    for b in BANDAS:
        if b[0] == nombre:
            return b
    raise SystemExit("Banda no reconocida: %r (usa 0-9, 10-99, 100-499, 500-1999, 2000-2999, "
                     "3000-3999, 4000-7999 u 8000+, o distancia_km)" % flujo.get("banda"))


def tabla(cab, filas):
    out = ["| " + " | ".join(cab) + " |", "|" + "---|" * len(cab)]
    out += ["| " + " | ".join(str(c) for c in f) + " |" for f in filas]
    return "\n".join(out)


# ------------------------------------------------------------ KA1

def calcular_ka1(cfg, lang, avisos):
    t = TXT[lang]
    accion = cfg["accion"].upper()
    if accion not in ("KA152", "KA153", "KA155"):
        raise SystemExit("accion debe ser KA152, KA153, KA155 o ESC30")
    iso = pais(cfg.get("pais_actividad", "")) if cfg.get("pais_actividad") else None
    if cfg.get("tarifa_dia"):
        tarifa = float(cfg["tarifa_dia"])
    elif accion == "KA155":
        tarifa = KA155_DIA
    else:
        if not iso:
            raise SystemExit("Falta pais_actividad")
        tarifa = PAISES[iso][1] if accion == "KA152" else PAISES[iso][2]
    filas, suma = [], dict(ind=0, viaje=0, green=0, org=0, inc=0)
    tot_pers = tot_part = tot_mo = 0
    for n, f in enumerate(cfg["flujos"], 1):
        nombre = f.get("nombre") or "%d %s" % (n, f.get("origen", ""))
        pers, part, mo = int(f["personas"]), int(f.get("participantes", 0)), int(f.get("menos_oportunidades", 0))
        if part > pers:
            avisos.append("Flujo %s: más participantes (%d) que personas (%d)" % (nombre, part, pers))
        if mo > part:
            avisos.append("Flujo %s: más participantes con menos oportunidades (%d) que participantes (%d)"
                          % (nombre, mo, part))
        green = bool(f.get("green"))
        extra = int(f.get("dias_extra", 0))
        if extra and not green:
            avisos.append("Flujo %s: días extra sin viaje sostenible; no se financian" % nombre)
            extra = 0
        if extra > MAX_DIAS_GREEN:
            avisos.append("Flujo %s: %d días extra, la Guía admite hasta %d; se cuentan %d" % (nombre, extra, MAX_DIAS_GREEN, MAX_DIAS_GREEN))
            extra = MAX_DIAS_GREEN
        b = banda(f)
        if b[0] == "0-9" and green:
            avisos.append("Flujo %s: viaje sostenible marcado en la banda 0-9 km, que no tiene importe" % nombre)
        dias = int(f.get("dias_actividad", cfg["dias_actividad"])) + int(f.get("dias_viaje", cfg.get("dias_viaje", 2)))
        dias_base = dias
        dias += extra
        if accion == "KA155" and dias > KA155_MAX_DIAS:
            avisos.append("Flujo %s: %d días, KA155 paga como mucho %d" % (nombre, dias, KA155_MAX_DIAS))
            dias = KA155_MAX_DIAS
        ind = pers * dias * tarifa
        imp_viaje = b[4] if green else b[3]
        viaje = 0 if green else pers * imp_viaje
        vgreen = pers * imp_viaje if green else 0
        org = part * APOYO_ORGANIZATIVO
        inc = mo * APOYO_INCLUSION
        total = ind + viaje + vgreen + org + inc
        for k, v in (("ind", ind), ("viaje", viaje), ("green", vgreen), ("org", org), ("inc", inc)):
            suma[k] += v
        tot_pers, tot_part, tot_mo = tot_pers + pers, tot_part + part, tot_mo + mo
        dias_txt = "%d" % dias if not extra else "%d + %d" % (dias_base, extra)
        filas.append([
            nombre, pers, dias_txt,
            "%d × %d %s = %s" % (pers, dias, t["d"], eur(ind, lang)),
            ("%d × %s = %s" % (pers, ent(imp_viaje, lang), eur(viaje, lang))) if viaje else eur(0, lang),
            ("%d × %s = %s" % (pers, ent(imp_viaje, lang), eur(vgreen, lang))) if vgreen else eur(0, lang),
            "%d × 125 = %s" % (part, eur(org, lang)),
            "%d × 125 = %s" % (mo, eur(inc, lang)),
            eur(total, lang),
        ])
    reales = cfg.get("costes_reales", {}) or {}
    suma["inc_part"] = float(reales.get("inclusion_participantes", 0))
    suma["exc"] = float(reales.get("excepcionales", 0))
    total = sum(suma.values())
    filas.append([t["total"], tot_pers, "", eur(suma["ind"], lang), eur(suma["viaje"], lang),
                  eur(suma["green"], lang), eur(suma["org"], lang), eur(suma["inc"], lang),
                  eur(total - suma["inc_part"] - suma["exc"], lang)])
    tarifa_txt = ent(tarifa, lang) if float(tarifa).is_integer() else str(tarifa)
    cab = [t["flujo"], t["personas"], t["dias"], t["ind"].format(t=tarifa_txt), t["viaje"], t["green"],
           t["org"], t["inc"], t["total"]]
    titulo = cfg.get("actividad", accion)
    md = ["### %s. %s" % (accion, titulo), "", tabla(cab, filas), ""]
    md += ["| Budget Items | Grant (EUR) |", "|---|---|"]
    md += ["| %s | %s |" % (et, eur(suma[k], lang, simbolo=False)) for k, et in RESUMEN]
    md += ["| Total Activity Grant | %s |" % eur(total, lang, simbolo=False), ""]
    md += ["%s: %s (%s%s)" % (t["total_act"], eur(total, lang),
                              t["resumen"].format(p=tot_pers, q=tot_part, m=tot_mo, t=tarifa_txt),
                              ", %s" % iso if iso else "")]
    return "\n".join(md), total


# ------------------------------------------------------------ ESC30

def calcular_esc30(cfg, lang, avisos):
    t = TXT[lang]
    iso = pais(cfg.get("pais", "ES"))
    meses = int(cfg["meses"])
    if not 2 <= meses <= 12:
        avisos.append("ESC30: la duración va de 2 a 12 meses y aquí hay %d" % meses)
    dias = int(cfg.get("dias_coach", 0))
    if cfg.get("coach_dia"):
        coach = float(cfg["coach_dia"])
    elif dias:
        if iso not in ESC30_COACH:
            raise SystemExit("No hay tarifa de coach confirmada para %s; pásala en coach_dia" % iso)
        coach = ESC30_COACH[iso]
    else:
        coach = 0
    reales = cfg.get("costes_reales", {}) or {}
    inc, exc = float(reales.get("inclusion", 0)), float(reales.get("excepcionales", 0))
    c_mes, c_coach = meses * ESC30_MES, dias * coach
    total = c_mes + c_coach + inc + exc
    filas = [[t["esc_mes"].format(m=meses), "%d × 630" % meses, eur(c_mes, lang)],
             [t["esc_coach"].format(d=dias, t=ent(coach, lang)), "%d × %s" % (dias, ent(coach, lang)),
              eur(c_coach, lang)]]
    if inc:
        filas.append([t["esc_inc"], "", eur(inc, lang)])
    if exc:
        filas.append([t["esc_exc"], "", eur(exc, lang)])
    filas.append([t["total"], "", eur(total, lang)])
    md = ["### ESC30. %s" % cfg.get("actividad", ""), "", tabla([t["concepto"], t["calculo"], t["importe"]], filas),
          "", "%s: %s" % (t["total_act"], eur(total, lang))]
    return "\n".join(md), total


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(description="Presupuesto KA152, KA153, KA155 y ESC30 con los importes de 2026.")
    ap.add_argument("entrada", help="JSON con la actividad y los flujos")
    ap.add_argument("--out", help="guarda el markdown en este fichero")
    ap.add_argument("--lang", choices=sorted(TXT), help="idioma (si no, el del JSON o es)")
    a = ap.parse_args(argv)
    with open(a.entrada, encoding="utf-8-sig") as fh:
        cfg = json.load(fh)
    lang = a.lang or cfg.get("idioma", "es")
    avisos = []
    if cfg.get("accion", "").upper() == "ESC30":
        md, total = calcular_esc30(cfg, lang, avisos)
    else:
        md, total = calcular_ka1(cfg, lang, avisos)
    print(md)
    for av in avisos:
        print("AVISO: " + av, file=sys.stderr)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as fh:
            fh.write(md + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
