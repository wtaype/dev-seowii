// src/semillas/configurar.js
// 🛠️ Tablero de Control Maestro del Sistema & Agregador Central — Seowii Studio
// Configuración centralizada de módulos, colecciones Firestore y navegación i18n (3 Idiomas).
// 0ms sobrecarga en runtime · Árbol de dependencias ultra optimizado.

import { id, app as appNombre, version, linkweb } from '../wii.js';
import seowii from './seowii.js';
import servicios, { serviciosCategorias } from './servicios.js';
import proyectos, { proyectosCategorias } from './proyectos.js';
import blogs from './blogs.js';
import galeria from './galeria.json';
import wimail from './wimail.json';
import * as wii from '../wii.js';

export const configurar = {
  id,
  modeloNegocio: 'estudio_ingenieria_software',
  modeloCatalogo: 'servicios',

  // 1. Control de Versión y Dominio
  version,
  versionNota: `${appNombre} Studio v${version}: Hub modular nativo ESM, 0ms de latencia y simetría total.`,
  dominioOficial: 'seowii.com',
  siteUrl: linkweb,
  actualizado: '2026-11-08',

  // 2. Banderas de Estado del Sistema y Modos
  modoDemo: false,
  modoMantenimiento: false,
  temaDefecto: 'luz',

  // 3. Interruptores de Módulos
  modulos: {
    hero: true,
    servicios: true,
    asesorias: true,
    proyectos: true,
    tecnologias: true,
    blogs: true,
    confianza: true,
    acerca: true,
    faqs: true,
    novedades: true,
    redes: true,
    dockFlotante: true,
    personal: false
  },

  // 4. Navegación Dinámica Multilingüe (3 Idiomas: ES, EN, PT)
  navegacion: [
    {
      id: 'servicios',
      href: '#servicios',
      icono: 'fa-solid fa-laptop-code',
      i18n: {
        es: { label: 'Servicios' },
        en: { label: 'Services' },
        pt: { label: 'Serviços' }
      }
    },
    {
      id: 'asesorias',
      href: '#asesorias',
      icono: 'fa-solid fa-comments',
      i18n: {
        es: { label: 'Asesorías' },
        en: { label: 'Advisory' },
        pt: { label: 'Consultoria' }
      }
    },
    {
      id: 'proyectos',
      href: '#proyectos',
      icono: 'fa-solid fa-briefcase',
      i18n: {
        es: { label: 'Proyectos' },
        en: { label: 'Projects' },
        pt: { label: 'Projetos' }
      }
    },
    {
      id: 'tecnologias',
      href: '#tecnologias',
      icono: 'fa-solid fa-microchip',
      i18n: {
        es: { label: 'Tecnologías' },
        en: { label: 'Technologies' },
        pt: { label: 'Tecnologias' }
      }
    },
    {
      id: 'blogs',
      href: '#blogs',
      icono: 'fa-solid fa-newspaper',
      i18n: {
        es: { label: 'Blogs' },
        en: { label: 'Blogs' },
        pt: { label: 'Blogs' }
      }
    },
    {
      id: 'novedades',
      href: '/novedades',
      icono: 'fa-solid fa-bullhorn',
      i18n: {
        es: { label: 'Novedades', badge: 'Nuevo' },
        en: { label: 'Updates', badge: 'New' },
        pt: { label: 'Novidades', badge: 'Novo' }
      }
    },
    {
      id: 'confianza',
      href: '#confianza',
      icono: 'fa-solid fa-shield-halved',
      i18n: {
        es: { label: 'Confianza' },
        en: { label: 'Trust' },
        pt: { label: 'Confiança' }
      }
    },
    {
      id: 'acerca',
      href: '#acerca',
      icono: 'fa-solid fa-user-tie',
      i18n: {
        es: { label: 'Acerca' },
        en: { label: 'About' },
        pt: { label: 'Sobre' }
      }
    }
  ],

  // 5. Rutas Canónicas del Sistema
  rutas: {
    inicio: '/',
    novedades: '/novedades',
    redes: '/redes',
    proyecto: '/proyecto',
    blog: '/',
    terminos: '/terminos',
    privacidad: '/privacidad'
  },

  // 6. Colecciones Canónicas de Firestore
  colecciones: {
    seowii: 'seowii',
    servicios: 'servicios',
    proyectos: 'proyectos',
    blogs: 'blogs',
    galeria: 'galeria',
    wimail: 'wimail'
  },

  // 7. Parámetros Comerciales
  parametros: {
    moneda: 'PEN',
    simboloMoneda: 'S/',
    precioBase: 69.90,
    precioWebBase: 650.00,
    precioAppBase: 1850.00,
    precioMapsBase: 180.00,
    descuentoMaximo: 0.15,
    impuestoIgv: 0.18
  }
};

export const configurarPersonal = {
  modulos: [
    // ── ZONA SUPERIOR (posicion: 'arriba') ──
    { id: 'dashboard', nombre: 'Dashboard',   icono: 'gauge',        mostrar: true, posicion: 'arriba' },
    { id: 'app',       nombre: 'Mi Estudio',  icono: 'briefcase',    mostrar: true, posicion: 'arriba' },
    { id: 'productos', nombre: 'Servicios',   icono: 'code',         mostrar: true, posicion: 'arriba' },
    { id: 'proyectos', nombre: 'Proyectos',   icono: 'laptop-code',  mostrar: true, posicion: 'arriba' },
    { id: 'blogs',     nombre: 'Blogs',       icono: 'newspaper',    mostrar: true, posicion: 'arriba' },
    { id: 'galeria',   nombre: 'Galería',     icono: 'image',        mostrar: true, posicion: 'arriba' },
    { id: 'correo',    nombre: 'WiMail',      icono: 'envelope',     mostrar: true, posicion: 'arriba' },
    { id: 'clientes',  nombre: 'Clientes',    icono: 'address-book', mostrar: true, posicion: 'arriba' },
    { id: 'whatsapp',  nombre: 'WhatsApp',    icono: 'fab:whatsapp', mostrar: false, posicion: 'arriba' },
    { id: 'notepad',   nombre: 'Notepad',     icono: 'file-lines',   mostrar: false, posicion: 'arriba' },
    { id: 'sunat',     nombre: 'SUNAT',       icono: 'receipt',      mostrar: false, posicion: 'arriba' },
    { id: 'personal',  nombre: 'Equipo',      icono: 'users',        mostrar: true, posicion: 'arriba' },
    { id: 'perfil',    nombre: 'Mi Perfil',   icono: 'user',         mostrar: true, posicion: 'arriba' },
    { id: 'ajustes',   nombre: 'Ajustes',     icono: 'gear',         mostrar: true, posicion: 'arriba' },

    // ── ZONA INFERIOR FIJA (posicion: 'abajo') ──
    { id: 'soporte',   nombre: 'Soporte',     icono: 'headset',         mostrar: true, posicion: 'abajo' },
    { id: 'aprender',  nombre: 'Aprender',    icono: 'graduation-cap',  mostrar: true, posicion: 'abajo' }
  ]
};

export const configurarCliente = {
  moduloDefecto: 'welcome',
  modulos: [
    { id: 'welcome',      nombre: 'Bienvenido',     icono: 'house',       activo: true },
    { id: 'perfil',       nombre: 'Mi Perfil',      icono: 'user',        activo: true },
    { id: 'cotizaciones', nombre: 'Cotizaciones',   icono: 'calculator',  activo: true },
    { id: 'proyectos',    nombre: 'Mis Proyectos',  icono: 'laptop-code', activo: true },
    { id: 'comprobantes', nombre: 'Comprobantes',   icono: 'receipt',     activo: true }
  ]
};

export function resolverIcono(icono = '') {
  if (!icono) return 'fa-solid fa-circle';
  if (icono.startsWith('fa-')) return icono;
  if (icono.startsWith('fab:')) return `fa-brands fa-${icono.slice(4)}`;
  return `fa-solid fa-${icono}`;
}

export const configurarRedes = {
  canales: [
    { id: 'whatsapp', nombre: 'WhatsApp', icono: 'fab:whatsapp', activo: true },
    { id: 'email',    nombre: 'Correo',   icono: 'envelope',     activo: true }
  ]
};

export const tieneCapacidad = (id) =>
  configurarPersonal.modulos.some(m => m.id === id && (m.mostrar ?? m.activo));

export const getModulosPersonal = () =>
  configurarPersonal.modulos
    .filter(m => (m.mostrar ?? m.activo))
    .map(m => {
      const iconoResuelto = resolverIcono(m.icono);
      return {
        ...m,
        mostrar: m.mostrar ?? m.activo,
        posicion: m.posicion || 'arriba',
        icono: iconoResuelto,
        iconoClase: iconoResuelto
      };
    });

export const getModulosCliente = () =>
  configurarCliente.modulos
    .filter(m => m.activo)
    .map(m => {
      const iconoResuelto = resolverIcono(m.icono);
      return {
        ...m,
        icono: iconoResuelto,
        iconoClase: iconoResuelto
      };
    });

export const getCanalesRedes = () =>
  configurarRedes.canales
    .filter(c => c.activo)
    .map(c => ({
      ...c,
      icono: resolverIcono(c.icono),
      iconoClase: resolverIcono(c.icono)
    }));

// ── EXPORTACIONES CANÓNICAS Y RETROCOMPATIBLES ──
export const config = configurar;
export const configurarSistema = configurar;
export const configSemilla = configurar;

export {
  seowii,
  seowii as app,
  servicios,
  serviciosCategorias,
  servicios as productos,
  proyectos,
  proyectosCategorias,
  blogs,
  galeria,
  wimail,
  wii
};

export const confianza = seowii.confianza || {};
export const acerca = seowii.acerca || {};
export const novedades = seowii.novedades || [];
export const whatsapp = seowii.whatsapp || seowii.contacto || {};
export const tecnologias = proyectosCategorias || [];
export const asesorias = serviciosCategorias || [];

export function tEntidad(item, lang = 'es') {
  if (!item || typeof item !== 'object') return item;
  const defaultLang = item.langPrincipal || 'es';

  if (item.langs && typeof item.langs === 'object') {
    const local = item.langs[lang] || item.langs[defaultLang] || {};
    return { ...item, ...local };
  }
  if (item.i18n && typeof item.i18n === 'object') {
    const local = item.i18n[lang] || item.i18n[defaultLang] || {};
    return { ...item, ...local };
  }
  const res = { ...item };
  for (const [k, v] of Object.entries(res)) {
    if (v && typeof v === 'object' && ('es' in v || 'en' in v || 'pt' in v)) {
      res[k] = v[lang] || v[defaultLang] || '';
    }
  }
  return res;
}

export function tLista(items, lang = 'es') {
  if (!Array.isArray(items)) return [];
  return items.map(item => tEntidad(item, lang));
}

export default {
  wii,
  seowii,
  app: seowii,
  servicios,
  serviciosCategorias,
  productos: servicios,
  proyectos,
  proyectosCategorias,
  blogs,
  galeria,
  wimail,
  configurar,
  config,
  configurarSistema,
  configSemilla,
  confianza,
  acerca,
  novedades,
  whatsapp,
  tecnologias,
  asesorias,
  tEntidad,
  tLista
};
