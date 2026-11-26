// src/feature/acercas/idioma/idioma.js
// 🌐 Helper de traducciones trilingües para feature/acercas
import es from './es.json';
import en from './en.json';
import pt from './pt.json';

const dicts = { es, en, pt };

export function tAcercas(seccion, lang = 'es') {
  const l = ['en', 'pt'].includes(lang) ? lang : 'es';
  return dicts[l]?.[seccion] || dicts.es?.[seccion] || {};
}
