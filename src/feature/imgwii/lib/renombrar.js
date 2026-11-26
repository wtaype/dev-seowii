// src/feature/imgwii/lib/renombrar.js
// 🏷️ Limpieza de nombres raros y renombrado SEO en serie

import { slugify } from '@core/rutas.js';

const MIME_EXT = {
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

export const extDesdeMime = (mime = 'image/webp') => MIME_EXT[mime] || 'webp';

/** Limpia la extensión y convierte un nombre de archivo en slug SEO */
export function limpiarNombreSeo(nombreOriginal = '') {
  const sinExt = String(nombreOriginal || 'imagen').replace(/\.[^.]+$/, '');
  const limpio = slugify(sinExt);
  return limpio || 'imagen-seo';
}

/** Genera nombres en serie: prefijo-01, prefijo-02, ... */
export function nombreEnSerie(prefijo = 'imagen', indice = 0, total = 1) {
  const base = slugify(prefijo) || 'imagen';
  const pad = total >= 100 ? 3 : 2;
  return `${base}-${String(indice + 1).padStart(pad, '0')}`;
}

/** Garantiza nombres únicos dentro del mismo lote .zip */
export function asegurarNombresUnicos(items = [], ext = 'webp') {
  const vistos = new Map();
  return items.map((item) => {
    const base = slugify(item.nombreSeo) || 'imagen';
    const count = vistos.get(base) || 0;
    vistos.set(base, count + 1);
    const finalBase = count === 0 ? base : `${base}-${count + 1}`;
    return `${finalBase}.${ext}`;
  });
}
