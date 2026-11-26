// src/feature/seo-test/lib/seoAudit.js
// 🔍 Escape HTML, fetchMetaReal (/api/meta), notas transparentes 0-10 y parser Lighthouse

import { SEO_LIMITS } from '@semillas/seo-test.js';

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cleanDesc(raw = '') {
  return String(raw).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
}

export async function fetchMetaReal(url = '') {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`/api/meta?url=${encodeURIComponent(url)}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok ? data : null;
  } catch {
    return null;
  }
}

export function evaluarSeo({ title = '', desc = '', url = '', h1 = '', ogImage = '' }) {
  const tLen = title.trim().length;
  const dLen = desc.trim().length;
  const checks = [
    { key: 'titleOk', ok: tLen >= SEO_LIMITS.titleMin && tLen <= SEO_LIMITS.titleMax },
    { key: 'descOk', ok: dLen >= SEO_LIMITS.descMin && dLen <= SEO_LIMITS.descMax },
    { key: 'urlOk', ok: /^https:\/\/.+\..+/i.test(url.trim()) },
    { key: 'h1Ok', ok: h1.trim().length >= 5 },
    { key: 'ogOk', ok: /^https?:\/\/.+/i.test(ogImage.trim()) }
  ];
  const passed = checks.filter((c) => c.ok).length;
  return { score: Math.round((passed / checks.length) * 100), tLen, dLen, checks };
}

export function extraerDominio(url = '') {
  try {
    const u = new URL(url.trim());
    return `${u.hostname}${u.pathname === '/' ? '' : u.pathname}`;
  } catch {
    return url || 'mi-negocio.com';
  }
}

export function generarMetaHtml({ title = '', desc = '', url = '', ogImage = '', robots = 'index, follow' }) {
  return `<title>${title}</title>
<meta name="description" content="${desc}" />
<meta name="robots" content="${robots}" />
<link rel="canonical" href="${url}" />

<meta property="og:type" content="website" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${ogImage}" />`;
}

function enrichAudit(a, metaReal, lang) {
  let extracted = '';
  let reason = '';
  let nota10 = a.score === null ? 10 : Math.round((a.score || 0) * 10);
  const es = lang !== 'en';

  if (a.id === 'document-title' && metaReal?.title) {
    const len = metaReal.title.length;
    extracted = metaReal.title;
    if (len >= 30 && len <= 60) {
      nota10 = 10;
      reason = es ? `Tiene ${len} caracteres (rango óptimo 30–60).` : `${len} chars (optimal 30–60 range).`;
    } else {
      nota10 = 7;
      reason = es
        ? `Tiene ${len} caracteres (recomendado entre 30 y 60).`
        : `${len} chars (recommended 30–60).`;
    }
  } else if (a.id === 'meta-description' && metaReal?.desc) {
    const len = metaReal.desc.length;
    extracted = metaReal.desc;
    if (len >= 110 && len <= 160) {
      nota10 = 10;
      reason = es ? `Tiene ${len} caracteres (rango óptimo 110–160).` : `${len} chars (optimal 110–160).`;
    } else {
      nota10 = 7;
      reason = es
        ? `Tiene ${len} caracteres (recomendado entre 110 y 160).`
        : `${len} chars (recommended 110–160).`;
    }
  } else if (a.id === 'canonical' && metaReal?.canonical) {
    extracted = metaReal.canonical;
  } else if (a.displayValue) {
    extracted = a.displayValue;
  }

  const state = nota10 >= 9 ? 'ok' : nota10 >= 6 ? 'warn' : 'err';
  return {
    id: a.id,
    title: a.title || a.id,
    desc: cleanDesc(a.description || ''),
    extracted,
    reason,
    nota10,
    state
  };
}

export function parseLighthouseSeo(data, metaReal = null, lang = 'es') {
  const lh = data?.lighthouseResult || {};
  const cats = lh.categories || {};
  const audits = lh.audits || {};
  const seoRefs = cats.seo?.auditRefs || [];
  const pct = (c) => Math.round((c?.score || 0) * 100);

  const seoList = seoRefs
    .map((ref) => audits[ref.id])
    .filter((a) => a && a.scoreDisplayMode !== 'notApplicable')
    .map((a) => enrichAudit(a, metaReal, lang))
    .sort((a, b) => a.nota10 - b.nota10);

  return {
    url: data?.id || lh.finalDisplayedUrl || '',
    strategy: lh.configSettings?.formFactor || 'mobile',
    scores: {
      seo: pct(cats.seo),
      perf: pct(cats.performance),
      a11y: pct(cats.accessibility),
      bp: pct(cats['best-practices'])
    },
    screenshot: audits['final-screenshot']?.details?.data || '',
    metaReal,
    seoList
  };
}
