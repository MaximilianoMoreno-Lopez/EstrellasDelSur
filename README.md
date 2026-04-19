# Estrellas del Sur — Web oficial

Sitio web de **Estrellas del Sur**, asociación juvenil de Córdoba que gestiona proyectos **Erasmus+** y voluntariados del **Cuerpo Europeo de Solidaridad (ESC)**.

**Web:** [estrellasdelsur.eu](https://estrellasdelsur.eu)

---

## Stack

| Tecnología | Uso |
|---|---|
| [Astro 4](https://astro.build) | Framework web (SSG) |
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
│       └── deploy.yml          # CI/CD → GitHub Pages
├── public/
│   ├── CNAME                   # Dominio personalizado
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Navbar.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro          # Hero animado con estrellas (canvas)
│   │   ├── EUBanner.astro      # Banner de cofinanciación UE
│   │   ├── Stats.astro         # Cifras destacadas
│   │   ├── ProjectCard.astro   # Tarjeta de proyecto
│   │   └── ProjectsSection.astro  # Grid con filtros
│   ├── content/
│   │   ├── config.ts           # Schema de la colección
│   │   └── projects/           # Markdown de cada proyecto
│   ├── layouts/
│   │   └── BaseLayout.astro    # Layout base con SEO
│   ├── pages/
│   │   ├── index.astro         # Home
│   │   ├── proyectos.astro     # Catálogo completo
│   │   ├── sobre-nosotros.astro
│   │   ├── voluntariado-esc.astro
│   │   └── contacto.astro
│   └── styles/
│       └── global.css          # Design tokens y utilidades
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
| `/sobre-nosotros/` | Historia, equipo (Pablo y Maxi), acreditaciones |
| `/voluntariado-esc/` | Explicación ESC, pasos, beneficios, FAQ |
| `/contacto/` | Email, ubicación, redes sociales |

---

## Proyectos (Content Collections)

Los proyectos se gestionan como archivos Markdown en `src/content/projects/`. Cada proyecto tiene el siguiente frontmatter:

```yaml
---
title: "Nombre del proyecto"
type: "Intercambio"      # Intercambio | Voluntariado | Formación
status: "active"          # active | past
flag: "🇪🇺"
description: "Descripción corta"
location: "Ciudad, País"  # (opcional)
year: 2024                # (opcional)
order: 1                  # Orden en el grid
---
```

Para añadir un nuevo proyecto, crea un archivo `.md` en `src/content/projects/`.

---

## Despliegue

El despliegue es automático via GitHub Actions al hacer push a `main`.

1. GitHub Actions ejecuta `npm run build`
2. El directorio `dist/` se publica en GitHub Pages
3. El dominio `estrellasdelsur.eu` apunta a GitHub Pages via DNS

### Configuración requerida en GitHub

En **Settings → Pages**:
- Source: `GitHub Actions`
- Custom domain: `estrellasdelsur.eu`
- Enforce HTTPS: ✅

---

## Contacto

- **Email:** info@estrellasdelsur.eu
- **Instagram / Facebook / TikTok:** @estrellasdelsur.eu
- **Ubicación:** Córdoba, España

---

*Proyecto cofinanciado por la Unión Europea a través de Erasmus+ y el Cuerpo Europeo de Solidaridad.*
