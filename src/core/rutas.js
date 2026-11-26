// src/core/rutas.js
// 🗺️ Enrutador Central de Seowii Studio
// Conectado a la configuración maestra del sistema

import { configurar } from '@/semillas/configurar.js';

export const RUTAS = {
  inicio: '/',
  inicioEn: '/en',
  inicioPt: '/pt',
  login: '/login',
  loginEn: '/en/login',
  loginPt: '/pt/login',
  personal: '/personal',
  redes: '/redes',
  ...(configurar.rutas || {})
};

export const ROL_PATH = {
  cliente: '/personal',
  personal: '/personal',
  gestor: '/personal',
  admin: '/personal'
};

/**
 * Resuelve cualquier ruta o URL (relativa o absoluta) al origen activo del navegador.
 * Adapta dinámicamente recursos locales (/repowii, /favicon.ico) sin importar el dominio o puerto.
 */
export function resolverRutas(urlRaw = '', fallback = '') {
  const u = String(urlRaw || fallback || '').trim();
  if (!u) return fallback;
  if (u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('mailto:') || u.startsWith('tel:')) {
    return u;
  }
  const origin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';

  if (u.startsWith('/')) {
    return origin ? `${origin}${u}` : u;
  }

  if (/^https?:\/\//i.test(u)) {
    try {
      const parsed = new URL(u);
      if (parsed.pathname.startsWith('/repowii/') || parsed.pathname === '/favicon.ico') {
        return origin ? `${origin}${parsed.pathname}${parsed.search}` : parsed.pathname;
      }
    } catch (e) {}
    return u;
  }

  const clean = `/${u}`;
  return origin ? `${origin}${clean}` : clean;
}

/**
 * Normaliza cualquier texto a un slug canónico URL-friendly
 */
export function slugify(texto = '') {
  return String(texto)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export const generarSlug = slugify;
export const resolverUrlCompleta = resolverRutas;
export const resolverUrlDinamica = resolverRutas;

export default { RUTAS, ROL_PATH, resolverRutas, slugify, generarSlug, resolverUrlCompleta, resolverUrlDinamica };
