// src/semillas/aprender.js
// ⭐ Semillas universales agnósticas para Aprender: enlaces oficiales, fuentes, snippets y comandos CLI

export const APRENDER_SECCIONES = [
  { id: 'recursos', icono: 'fa-solid fa-compass' },
  { id: 't1_frameworks', icono: 'fa-solid fa-layer-group' },
  { id: 't2_firebase', icono: 'fa-solid fa-fire' },
  { id: 't3_vercel', icono: 'fa-solid fa-triangle-exclamation' },
  { id: 't4_cloudflare', icono: 'fa-solid fa-cloud-bolt' },
  { id: 't5_combo', icono: 'fa-solid fa-rocket' }
];

export const RECURSOS_LINKS = {
  iconos: [
    {
      id: 'fontawesome',
      icono: 'fa-solid fa-icons',
      url: 'https://fontawesome.com/search?o=r&m=free',
      snippet:
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />',
      tags: ['iconos', 'icons', 'font awesome', 'css', 'ui']
    },
    {
      id: 'realfavicon',
      icono: 'fa-solid fa-star',
      url: 'https://realfavicongenerator.net/',
      snippet: '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
      tags: ['favicon', 'svg', 'og', 'seo', 'icono']
    }
  ],
  fuentes: [
    {
      id: 'poppins',
      nombre: 'Poppins',
      pesos: '400;500;600;700',
      url: 'https://fonts.google.com/specimen/Poppins',
      snippet:
        '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />',
      tags: ['fuente', 'font', 'poppins', 'saas', 'ui']
    },
    {
      id: 'jakarta',
      nombre: 'Plus Jakarta Sans',
      pesos: '400;500;600;700',
      url: 'https://fonts.google.com/specimen/Plus+Jakarta+Sans',
      snippet:
        '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />',
      tags: ['fuente', 'font', 'jakarta', 'dashboard', 'moderna']
    },
    {
      id: 'inter',
      nombre: 'Inter',
      pesos: '400;500;600;700',
      url: 'https://fonts.google.com/specimen/Inter',
      snippet:
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />',
      tags: ['fuente', 'font', 'inter', 'docs', 'clean']
    },
    {
      id: 'outfit',
      nombre: 'Outfit',
      pesos: '500;600;700;800',
      url: 'https://fonts.google.com/specimen/Outfit',
      snippet:
        '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet" />',
      tags: ['fuente', 'font', 'outfit', 'landing', 'hero']
    },
    {
      id: 'jetbrains',
      nombre: 'JetBrains Mono',
      pesos: '400;500;600',
      url: 'https://fonts.google.com/specimen/JetBrains+Mono',
      snippet:
        '<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />',
      tags: ['fuente', 'font', 'mono', 'codigo', 'code']
    }
  ],
  ecosistema: [
    {
      id: 'googlefonts',
      icono: 'fa-solid fa-font',
      url: 'https://fonts.google.com/',
      tags: ['google fonts', 'tipografia', 'typography', 'css']
    },
    {
      id: 'astrodocs',
      icono: 'fa-solid fa-meteor',
      url: 'https://docs.astro.build/',
      tags: ['astro', 'docs', 'framework', 'ssg']
    },
    {
      id: 'cloudflare',
      icono: 'fa-solid fa-cloud',
      url: 'https://dash.cloudflare.com/',
      tags: ['cloudflare', 'workers', 'pages', 'cdn', 'dns']
    },
    {
      id: 'firebase',
      icono: 'fa-solid fa-fire',
      url: 'https://console.firebase.google.com/',
      tags: ['firebase', 'hosting', 'auth', 'firestore']
    },
    {
      id: 'vercel',
      icono: 'fa-solid fa-caret-up',
      url: 'https://vercel.com/',
      tags: ['vercel', 'deploy', 'ssr', 'nextjs', 'astro']
    },
    {
      id: 'pagespeed',
      icono: 'fa-solid fa-gauge-high',
      url: 'https://pagespeed.web.dev/',
      tags: ['pagespeed', 'lighthouse', 'vitals', 'seo']
    }
  ],
  suiteInterna: [
    { id: 'imgwii', icono: 'fa-solid fa-images', href: '/imgwii' },
    { id: 'seo-test', icono: 'fa-solid fa-magnifying-glass-chart', href: '/seo-test' },
    { id: 'speed-test', icono: 'fa-solid fa-bolt', href: '/speed-test' }
  ]
};

export const SNIPPETS_TUTORIALES = {
  t1_frameworks: [
    'pnpm create astro@latest mi-negocio-web -- --template minimal',
    'npx create-next-app@latest mi-app-saas',
    'pnpm create vite@latest mi-panel -- --template react'
  ],
  t2_firebase: [
    'pnpm create astro@latest mi-sitio-firebase -- --template minimal\ncd mi-sitio-firebase\npnpm add firebase @astrojs/sitemap',
    'npm i -g firebase-tools\nfirebase login\nfirebase init hosting',
    'pnpm build && firebase deploy'
  ],
  t3_vercel: [
    'pnpm create astro@latest mi-sitio-vercel -- --template minimal\ncd mi-sitio-vercel\npnpm build',
    'npx astro add vercel',
    '// astro.config.mjs\nimport { defineConfig } from "astro/config";\nimport vercel from "@astrojs/vercel";\n\nexport default defineConfig({\n  output: "server",\n  adapter: vercel()\n});'
  ],
  t4_cloudflare: [
    'npm create cloudflare@latest -- --framework=astro',
    '# pnpm-workspace.yaml (si usas pnpm en Cloudflare)\npackages:\n  - "."',
    '// wrangler.jsonc\n{\n  "name": "mi-negocio-web",\n  "compatibility_date": "2026-01-01",\n  "assets": { "directory": "./dist" }\n}',
    '/* public/_headers */\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/*\n  X-Frame-Options: SAMEORIGIN\n  X-Content-Type-Options: nosniff',
    'pnpm build && npx wrangler deploy'
  ],
  t5_combo: [
    'pnpm create astro@latest mi-negocio-pro -- --template minimal\ncd mi-negocio-pro\npnpm add firebase @astrojs/sitemap',
    '/* src/lib/firebase.js */\nimport { initializeApp } from "firebase/app";\nimport { getFirestore } from "firebase/firestore";\n\nconst app = initializeApp({\n  apiKey: import.meta.env.PUBLIC_FB_KEY,\n  projectId: import.meta.env.PUBLIC_FB_PROJECT\n});\nexport const db = getFirestore(app);',
    '<title>Mi Negocio Pro | Servicios Digitales</title>\n<meta name="description" content="Descripción clara entre 110 y 160 caracteres." />\n<link rel="canonical" href="https://mi-negocio.com/" />\n<meta property="og:image" content="https://mi-negocio.com/og-cover.webp" />'
  ]
};
