// src/core/rutas.js
// 🗺️ Enrutador Central de dev.seowii.com

import { configurar } from '@semillas';
import { limpiarPrefijoIdioma, buildRuta } from '@idioma';

export const RUTAS = {
  general: '/',
  imgwii: '/imgwii',
  lectorJson: '/lector-json',
  lectorMd: '/lector-md',
  seoTest: '/seo-test',
  speedTest: '/speed-test',
  aprender: '/aprender',
  nosotros: '/nosotros',
  contacto: '/contacto',
  privacidad: '/privacidad',
  terminos: '/terminos',
  cookies: '/cookies',
  feedback: '/feedback',
  ...(configurar.rutas || {})
};

export const normalizarRuta = (path = '/') => limpiarPrefijoIdioma(path);

export const esRutaActiva = (href = '/', currentPath = '/') =>
  normalizarRuta(href) === normalizarRuta(currentPath);

export const rutaConIdioma = (href = '/', lang = 'es') => buildRuta(href, lang);

export function resolverRutas(urlRaw = '', fallback = '') {
  const u = String(urlRaw || fallback || '').trim();
  if (!u) return fallback;
  if (/^(data:|blob:|mailto:|tel:|https?:\/\/)/i.test(u)) return u;
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const clean = u.startsWith('/') ? u : `/${u}`;
  return origin ? `${origin}${clean}` : clean;
}

export const slugify = (texto = '') =>
  String(texto)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export default { RUTAS, normalizarRuta, esRutaActiva, rutaConIdioma, resolverRutas, slugify };
