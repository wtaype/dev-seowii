// src/semillas/configurar.js
// 🛠️ Tablero Maestro de Configuración — dev.seowii.com
// Fuente única de verdad para navegación, módulos, rutas y tema por defecto.

import { id, app, slogan, by, version, linkweb } from '@wii';

export const configurar = {
  id,
  app,
  slogan,
  by,
  version,
  linkweb,
  dominioOficial: 'dev.seowii.com',
  temaDefecto: 'luz',
  storageKeys: {
    tema: 'dv_tema',
    sidebar: 'dv_sidebar_collapsed'
  },

  rutas: {
    general: '/',
    imgwii: '/imgwii',
    lectorJson: '/lector-json',
    lectorMd: '/lector-md',
    seoTest: '/seo-test',
    speedTest: '/speed-test',
    aprender: '/aprender'
  },

  // Navegación principal (Sidebar superior + Mobile)
  // Nota: General vive en '/' (por defecto, sin '/general')
  navPrincipal: [
    {
      id: 'general',
      href: '/',
      label: 'General',
      sub: 'Herramientas',
      icono: 'fa-solid fa-layer-group'
    },
    {
      id: 'imgwii',
      href: '/imgwii',
      label: 'ImgWii',
      sub: 'WebP & Resize',
      icono: 'fa-solid fa-image'
    },
    {
      id: 'lector-json',
      href: '/lector-json',
      label: 'Lector JSON',
      sub: 'Validar & Árbol',
      icono: 'fa-solid fa-code'
    },
    {
      id: 'lector-md',
      href: '/lector-md',
      label: 'Lector MD',
      sub: 'Visor Markdown',
      icono: 'fa-solid fa-file-lines'
    },
    {
      id: 'seo-test',
      href: '/seo-test',
      label: 'SEO Test',
      sub: 'Meta & Headers',
      icono: 'fa-solid fa-magnifying-glass-chart'
    },
    {
      id: 'speed-test',
      href: '/speed-test',
      label: 'Speed Test',
      sub: 'Peso & Vitals',
      icono: 'fa-solid fa-gauge-high'
    }
  ],

  // Navegación inferior del Sidebar (anclada abajo; Aprender arriba de Colapsar)
  navInferior: [
    {
      id: 'tema',
      tipo: 'accion',
      accion: 'toggle-tema',
      labelLuz: 'Tema Noche',
      labelNoche: 'Tema Luz',
      iconoLuz: 'fa-solid fa-moon',
      iconoNoche: 'fa-solid fa-sun'
    },
    {
      id: 'acerca',
      tipo: 'accion',
      accion: 'open-acerca',
      label: 'Acerca',
      icono: 'fa-solid fa-circle-info'
    },
    {
      id: 'aprender',
      tipo: 'link',
      href: '/aprender',
      label: 'Aprender',
      icono: 'fa-solid fa-graduation-cap'
    },
    {
      id: 'colapsar',
      tipo: 'accion',
      accion: 'toggle-sidebar',
      label: 'Colapsar',
      icono: 'fa-solid fa-angles-left'
    }
  ],

  // Enlaces legales / acerca incluidos en Acerca.astro
  enlacesAcerca: [
    { label: 'Nosotros', href: '/nosotros', icono: 'fa-solid fa-users' },
    { label: 'Contacto', href: '/contacto', icono: 'fa-solid fa-envelope' },
    { label: 'Feedback', href: '/feedback', icono: 'fa-solid fa-comment-dots' },
    { label: 'Privacidad', href: '/privacidad', icono: 'fa-solid fa-shield-halved' },
    { label: 'Términos', href: '/terminos', icono: 'fa-solid fa-file-contract' },
    { label: 'Cookies', href: '/cookies', icono: 'fa-solid fa-cookie-bite' }
  ]
};

export { id, app, slogan, by, version, linkweb };
export default configurar;
