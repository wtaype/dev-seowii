// src/core/servicios/traductor.js
// 🌐 Smart Translation Hub Universal — Seowii Studio
// Centraliza y optimiza todas las traducciones con Google Gemini IA en un solo servicio.
// Soporte trilingüe estructurado (ES -> EN / PT) para Proyectos, Servicios, App y Blogs.
// 100% JS Nativo · Respeta Markdown · Cero dependencias externas

import { consultarJsonGemini } from './gemini.js';

const INSTRUCCION_BASE = 'Eres el traductor y copywriter técnico B2B oficial de Seowii Studio. Responde EXCLUSIVAMENTE con el objeto JSON solicitado, sin explicaciones ni markdown.';

/**
 * Traduce campos de un Proyecto & Caso de Estudio a Inglés (EN) y Portugués (PT)
 */
export async function traducirProyecto({ titulo = '', descripcion = '' } = {}) {
  if (!titulo) throw new Error('El título del proyecto es obligatorio para traducir.');

  const prompt = `Traduce del español hacia English ('en') y Português ('pt') para un portafolio de software y desarrollo web:
- titulo: "${titulo}"
- descripcion: "${descripcion || ''}"

Responde en formato JSON estricto:
{
  "en": { "titulo": "...", "descripcion": "..." },
  "pt": { "titulo": "...", "descripcion": "..." }
}`;

  const res = await consultarJsonGemini({ prompt, systemInstruction: INSTRUCCION_BASE });
  return {
    en: { titulo: res?.en?.titulo || titulo, descripcion: res?.en?.descripcion || descripcion },
    pt: { titulo: res?.pt?.titulo || titulo, descripcion: res?.pt?.descripcion || descripcion }
  };
}

/**
 * Traduce la ficha completa de un Servicio o Asesoría comercial (ES -> EN / PT)
 */
export async function traducirServicio({
  titulo = '',
  descripcion = '',
  prefijo = 'Entrega: ',
  tiempo = '5 a 7 días hábiles',
  garantia = 'Astro para SEO amigable',
  inversionTexto = 'DESDE',
  ctaTexto = 'Consultar',
  headerIncluye = 'LO QUE INCLUYE TU PROYECTO:',
  bullets = []
} = {}) {
  if (!titulo) throw new Error('El título del servicio es requerido para traducir.');

  const prompt = `Traduce la siguiente propuesta comercial B2B de desarrollo web y software de Seowii Studio hacia English ('en') y Português ('pt'):
- titulo: "${titulo}"
- descripcion: "${descripcion}"
- prefijo: "${prefijo}"
- tiempo: "${tiempo}"
- garantia: "${garantia}"
- inversionTexto: "${inversionTexto}"
- ctaTexto: "${ctaTexto}"
- headerIncluye: "${headerIncluye}"
- bullets: ${JSON.stringify(bullets)}

Devuelve EXCLUSIVAMENTE un JSON con esta estructura exacta:
{
  "en": {
    "titulo": "...",
    "descripcion": "...",
    "prefijo": "...",
    "tiempo": "...",
    "garantia": "...",
    "inversionTexto": "...",
    "ctaTexto": "...",
    "headerIncluye": "...",
    "bullets": [...]
  },
  "pt": {
    "titulo": "...",
    "descripcion": "...",
    "prefijo": "...",
    "tiempo": "...",
    "garantia": "...",
    "inversionTexto": "...",
    "ctaTexto": "...",
    "headerIncluye": "...",
    "bullets": [...]
  }
}`;

  return consultarJsonGemini({
    prompt,
    systemInstruction: `${INSTRUCCION_BASE} Adapta la terminología comercial para atraer clientes en USA/Global (en) y Brasil/Portugal (pt).`
  });
}

/**
 * Traduce los bloques globales de Mi Estudio / App (SEO, Hero y Marca)
 */
export async function traducirApp({ seo = {}, hero = {}, marca = {} } = {}) {
  const prompt = `Traduce los siguientes textos institucionales y de posicionamiento web de Seowii Studio del Español hacia English ('en') y Português ('pt'):
- seo: ${JSON.stringify(seo)}
- hero: ${JSON.stringify(hero)}
- marca: ${JSON.stringify(marca)}

Devuelve JSON estricto:
{
  "en": { "seo": { ... }, "hero": { ... }, "marca": { ... } },
  "pt": { "seo": { ... }, "hero": { ... }, "marca": { ... } }
}`;

  return consultarJsonGemini({
    prompt,
    systemInstruction: `${INSTRUCCION_BASE} Mantén las palabras clave técnicas relevantes para posicionamiento en motores de búsqueda.`
  });
}

/**
 * Traduce un artículo de Blog completo preservando la sintaxis Markdown
 */
export async function traducirBlog({
  titulo = '',
  slug = '',
  descripcion = '',
  keywords = '',
  categoria = 'Desarrollo Web',
  contenidoMD = ''
} = {}, targetLang = 'en') {
  if (!titulo) throw new Error('El título del artículo es requerido para traducir.');
  const targetName = targetLang === 'pt' ? 'Português' : 'English';

  const prompt = `Traduce este artículo técnico de blog del Español hacia ${targetName} ('${targetLang}'):
- titulo: "${titulo}"
- slug: "${slug}"
- descripcion: "${descripcion}"
- keywords: "${keywords}"
- categoria: "${categoria}"
- contenidoMD:
${contenidoMD}

Reglas estrictas:
1. Adapta el slug y título con gancho técnico y SEO para ${targetName}.
2. Conserva INTACTOS los encabezados Markdown (##, ###), bloques de alerta (> [!NOTE], > [!TIP]), citas, código (\`\`\`) y enlaces [texto](url).

Responde en formato JSON estricto:
{
  "titulo": "...",
  "slug": "...",
  "descripcion": "...",
  "keywords": "...",
  "categoria": "...",
  "contenidoMD": "..."
}`;

  return consultarJsonGemini({
    prompt,
    systemInstruction: `${INSTRUCCION_BASE} Eres un redactor senior de artículos de ingeniería de software. Conserva la jerarquía de formato Markdown exactamente igual al original.`
  });
}

/**
 * Traduce un texto genérico o plantilla corta hacia Inglés y Portugués
 */
export async function traducirTextoTrilingue(texto = '') {
  if (!texto) return { en: '', pt: '' };
  const prompt = `Traduce este texto o plantilla comercial de español hacia English ('en') y Português ('pt'):
"${texto}"
Conserva intactas las variables entre llaves como {servicio} o {titulo}.
Responde en JSON estricto:
{
  "en": "...",
  "pt": "..."
}`;
  const res = await consultarJsonGemini({ prompt, systemInstruction: INSTRUCCION_BASE });
  return {
    en: res?.en || texto,
    pt: res?.pt || texto
  };
}

export default {
  traducirProyecto,
  traducirServicio,
  traducirApp,
  traducirBlog,
  traducirTextoTrilingue
};
