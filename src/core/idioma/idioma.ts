// src/core/idioma/idioma.ts
// 🌐 Motor Central i18n — dev.seowii.com (Escalable a N idiomas sin ternarios)

// Mapa maestro de idiomas soportados (agrega aquí nuevos idiomas como pt, fr, etc.)
export const IDIOMAS = {
  es: { code: 'es', label: 'ES', nombre: 'Español' },
  en: { code: 'en', label: 'EN', nombre: 'English' }
} as const;

export type Idioma = keyof typeof IDIOMAS;
export const langPrincipal: Idioma = 'es';
export const LISTA_IDIOMAS = Object.values(IDIOMAS);

// Expresión regular generada automáticamente para detectar prefijos (/en, /pt, etc.)
const LANG_CODES = Object.keys(IDIOMAS).filter((k) => k !== langPrincipal);
const PREFIX_RE = LANG_CODES.length
  ? new RegExp(`^\\/(${LANG_CODES.join('|')})(?=\\/|$)`, 'i')
  : null;

// Detecta el código de idioma activo a partir de la URL actual
export function getIdioma(pathname = '/'): Idioma {
  if (!PREFIX_RE) return langPrincipal;
  const match = String(pathname || '/').match(PREFIX_RE);
  const code = match?.[1]?.toLowerCase() as Idioma | undefined;
  return code && code in IDIOMAS ? code : langPrincipal;
}

// Elimina el prefijo de idioma de la ruta para obtener la ruta base limpia
export function limpiarPrefijoIdioma(pathname = '/'): string {
  const clean = String(pathname || '/').startsWith('/') ? String(pathname || '/') : `/${pathname}`;
  const stripped = PREFIX_RE ? clean.replace(PREFIX_RE, '') : clean;
  const normalized = stripped.replace(/\/+$/, '');
  return normalized || '/';
}

// Construye la ruta final anteponiendo /idioma solo si no es el idioma principal
export function buildRuta(ruta = '/', lang: string = langPrincipal): string {
  const clean = limpiarPrefijoIdioma(ruta);
  if (!lang || lang === langPrincipal || !(lang in IDIOMAS)) return clean;
  return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

// Traduce cualquier ruta actual al idioma destino manteniendo la misma página
export function resolverRutaIdioma(pathname = '/', targetLang: string = langPrincipal): string {
  return buildRuta(limpiarPrefijoIdioma(pathname), targetLang);
}

// Devuelve el siguiente idioma en el ciclo para el botón de cambio rápido
export function getNextIdioma(lang: string = langPrincipal): Idioma {
  const keys = Object.keys(IDIOMAS) as Idioma[];
  const idx = keys.indexOf(lang as Idioma);
  return keys[(idx + 1) % keys.length];
}

// Carga automática de los diccionarios globales del Shell (core/idioma/*.json)
const coreLocales = import.meta.glob<Record<string, any>>('./*.json', {
  eager: true,
  import: 'default'
});

// Obtiene los textos globales del Shell para el idioma solicitado con fallback seguro
export function getCoreLang(lang: string = langPrincipal): Record<string, any> {
  const l = lang in IDIOMAS ? lang : langPrincipal;
  return coreLocales[`./${l}.json`] || coreLocales[`./${langPrincipal}.json`] || {};
}

// Resuelve los textos de cualquier feature desde su propio import.meta.glob('./idioma/*.json')
export function getFeatureLang<T = Record<string, any>>(
  locales: Record<string, T>,
  lang: string = langPrincipal
): T {
  const l = lang in IDIOMAS ? lang : langPrincipal;
  const match = Object.keys(locales).find((k) => k.endsWith(`/${l}.json`));
  const fallback = Object.keys(locales).find((k) => k.endsWith(`/${langPrincipal}.json`));
  return (match ? locales[match] : fallback ? locales[fallback] : {}) as T;
}
