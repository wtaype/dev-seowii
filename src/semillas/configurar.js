// src/semillas/configurar.js
// 🛠️ Tablero Maestro de Configuración — dev.seowii.com
// Solo estructura, iconos y rutas base. Los textos viven en core/idioma/{es,en}.json.

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

  // Navegación principal (General vive en '/', sin '/general')
  navPrincipal: [
    { id: 'general', href: '/', icono: 'fa-solid fa-layer-group' },
    { id: 'imgwii', href: '/imgwii', icono: 'fa-solid fa-image' },
    { id: 'lector-json', href: '/lector-json', icono: 'fa-solid fa-code' },
    { id: 'lector-md', href: '/lector-md', icono: 'fa-solid fa-file-lines' },
    { id: 'seo-test', href: '/seo-test', icono: 'fa-solid fa-magnifying-glass-chart' },
    { id: 'speed-test', href: '/speed-test', icono: 'fa-solid fa-gauge-high' }
  ],

  // Navegación inferior (Aprender arriba de Colapsar)
  navInferior: [
    { id: 'tema', tipo: 'accion', accion: 'toggle-tema', icono: 'fa-solid fa-moon', key: 'temaLuz' },
    { id: 'idioma', tipo: 'accion', accion: 'toggle-idioma', icono: 'fa-solid fa-globe', key: 'idioma' },
    { id: 'acerca', tipo: 'accion', accion: 'open-acerca', icono: 'fa-solid fa-circle-info', key: 'acerca' },
    { id: 'aprender', tipo: 'link', href: '/aprender', icono: 'fa-solid fa-graduation-cap', key: 'aprender' },
    { id: 'colapsar', tipo: 'accion', accion: 'toggle-sidebar', icono: 'fa-solid fa-angles-left', key: 'colapsar' }
  ],

  enlacesAcerca: [
    { id: 'nosotros', href: '/nosotros', icono: 'fa-solid fa-users' },
    { id: 'contacto', href: '/contacto', icono: 'fa-solid fa-envelope' },
    { id: 'feedback', href: '/feedback', icono: 'fa-solid fa-comment-dots' },
    { id: 'privacidad', href: '/privacidad', icono: 'fa-solid fa-shield-halved' },
    { id: 'terminos', href: '/terminos', icono: 'fa-solid fa-file-contract' },
    { id: 'cookies', href: '/cookies', icono: 'fa-solid fa-cookie-bite' }
  ]
};

export { id, app, slogan, by, version, linkweb };
export default configurar;
