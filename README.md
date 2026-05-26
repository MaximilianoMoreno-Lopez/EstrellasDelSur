# Estrellas del Sur - Web oficial

Sitio web de **Estrellas del Sur**, asociación juvenil de Córdoba que conecta jóvenes con oportunidades europeas a través de proyectos **Erasmus+** y voluntariados del **Cuerpo Europeo de Solidaridad (ESC)**.

**Web:** [estrellasdelsur.eu](https://estrellasdelsur.eu)

---

## Stack

| Tecnología | Uso |
|---|---|
| [Astro 6](https://astro.build) | Framework web (SSG) |
| CSS nativo | Estilos (sin framework externo) |
| GitHub Pages | Hosting |
| GitHub Actions | CI/CD automático |

**Fuentes:** Playfair Display (títulos) + DM Sans (cuerpo) via Google Fonts  
**Colores:** Navy `#0a1628` · Teal `#0d9488` · Gold `#f59e0b` · Cream `#fafaf7`

---

## Estructura del proyecto

```
/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD → GitHub Pages
├── public/
│   ├── CNAME                       # Dominio personalizado
│   ├── favicon.svg
│   ├── og-image.png
│   └── images/
│       └── noticias/               # Fotos de artículos
├── src/
│   ├── components/
│   │   ├── Navbar.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro              # Hero animado con estrellas (canvas)
│   │   ├── EUBanner.astro          # Banner de cofinanciación UE
│   │   ├── Stats.astro             # Cifras destacadas
│   │   ├── ProjectCard.astro       # Tarjeta de proyecto
│   │   └── ProjectsSection.astro   # Grid con filtros
│   ├── content/
│   │   ├── content.config.ts       # Schema de colecciones (Astro 6)
│   │   ├── projects/               # Markdown de cada proyecto Erasmus+
│   │   └── noticias/               # Artículos de experiencias
│   ├── layouts/
│   │   └── BaseLayout.astro        # Layout base con SEO y OG
│   ├── pages/
│   │   ├── index.astro             # Home
│   │   ├── proyectos.astro         # Catálogo completo
│   │   ├── proyectos/[slug].astro  # Detalle de proyecto
│   │   ├── noticias.astro          # Listado de noticias
│   │   ├── noticias/[slug].astro   # Artículo completo
│   │   ├── sobre-nosotros.astro
│   │   ├── voluntariado-esc.astro
│   │   └── contacto.astro
│   └── styles/
│       └── global.css              # Design tokens y utilidades
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:4321)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

---

## Páginas

| Ruta | Descripción |
|---|---|
| `/` | Home: hero, stats, proyectos activos, sobre nosotros, CTA |
| `/proyectos/` | Catálogo completo con filtros por tipo y estado |
| `/proyectos/[slug]/` | Detalle de cada proyecto |
| `/noticias/` | Artículos de experiencias y noticias |
| `/noticias/[slug]/` | Artículo completo |
| `/sobre-nosotros/` | Historia, equipo, acreditaciones (OID + PIC) |
| `/voluntariado-esc/` | Explicación ESC, pasos, beneficios, FAQ |
| `/contacto/` | Email, ubicación, redes sociales |

---

## Contenido (Content Collections)

Los proyectos y noticias se gestionan como archivos Markdown en `src/content/`. Astro 6 usa la Content Layer API con `glob` loader.

**Proyecto** (`src/content/projects/*.md`):
```yaml
---
title: "Nombre del proyecto"
type: "Intercambio"      # Intercambio | Voluntariado | Formación
status: "active"          # active | past
flag: "🇪🇺"
description: "Descripción corta"
location: "Ciudad, País"
year: 2024
order: 1
---
```

**Noticia** (`src/content/noticias/*.md`):
```yaml
---
title: "Título del artículo"
type: "Formación"
status: "past"
date: "2026-03"
location: "Ciudad, País"
cover: "images/noticias/imagen.jpg"
description: "Descripción corta"
---
```

---

## Despliegue

El despliegue es automático via GitHub Actions al hacer push a `main`.

1. GitHub Actions ejecuta `npm run build`
2. El directorio `dist/` se publica en GitHub Pages
3. El dominio `estrellasdelsur.eu` apunta a GitHub Pages via DNS (Cloudflare)

### Configuración en GitHub

En **Settings → Pages**:
- Source: `GitHub Actions`
- Custom domain: `estrellasdelsur.eu`
- Enforce HTTPS: ✅

---

## Contacto

- **Email:** maxi@estrellasdelsur.eu · paula@estrellasdelsur.eu
- **Instagram / Facebook / TikTok:** @estrellasdelsur.eu
- **Ubicación:** Córdoba, España

---

*Proyecto cofinanciado por la Unión Europea a través de Erasmus+ y el Cuerpo Europeo de Solidaridad.*
