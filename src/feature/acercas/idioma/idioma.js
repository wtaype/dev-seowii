// src/feature/acercas/idioma/idioma.js
// Solo Español para dev.seowii.com
import es from './es.json';

export function tAcercas(seccion) {
  return es[seccion] || {};
}

export const TEXTOS_ACERCAS = es;
export default tAcercas;
