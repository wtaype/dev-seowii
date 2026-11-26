// src/feature/speed-test/lib/vitals.js
// ⚡ Parser completo de Core Web Vitals, Diagnósticos, Peso y Oportunidades (PageSpeed v5)

const VITAL_KEYS = [
  { id: 'first-contentful-paint', label: 'FCP' },
  { id: 'largest-contentful-paint', label: 'LCP' },
  { id: 'cumulative-layout-shift', label: 'CLS' },
  { id: 'total-blocking-time', label: 'TBT' },
  { id: 'speed-index', label: 'Speed Index' },
  { id: 'server-response-time', label: 'TTFB' }
];

const DIAG_KEYS = [
  { id: 'total-byte-weight', label: 'Peso Total' },
  { id: 'dom-size', label: 'Nodos DOM' },
  { id: 'mainthread-work-breakdown', label: 'Hilo Principal' },
  { id: 'bootup-time', label: 'Ejecución JS' },
  { id: 'network-requests', label: 'Peticiones HTTP' },
  { id: 'uses-long-cache-ttl', label: 'Caché Estática' }
];

export function scoreState(score = 0) {
  if (score >= 90) return 'ok';
  if (score >= 50) return 'warn';
  return 'err';
}

export function parseSpeedReport(data) {
  const lh = data?.lighthouseResult || {};
  const cats = lh.categories || {};
  const audits = lh.audits || {};
  const perfRefs = cats.performance?.auditRefs || [];
  const pct = (c) => Math.round((c?.score || 0) * 100);

  const vitals = VITAL_KEYS.filter((v) => audits[v.id]).map((v) => {
    const a = audits[v.id];
    const s = Math.round((a.score ?? 1) * 100);
    return {
      id: v.id,
      label: v.label,
      value: a.displayValue || '--',
      state: scoreState(s)
    };
  });

  const diagnostics = DIAG_KEYS.filter((d) => audits[d.id]).map((d) => {
    const a = audits[d.id];
    const val =
      a.displayValue ||
      (d.id === 'network-requests' && a.details?.items ? `${a.details.items.length} reqs` : '--');
    const s = a.score === null ? 95 : Math.round((a.score ?? 1) * 100);
    return {
      id: d.id,
      label: d.label,
      value: val,
      state: scoreState(s)
    };
  });

  const opps = perfRefs
    .map((r) => audits[r.id])
    .filter(
      (a) =>
        a &&
        a.score !== null &&
        a.score < 0.9 &&
        !VITAL_KEYS.some((v) => v.id === a.id) &&
        !DIAG_KEYS.some((d) => d.id === a.id)
    )
    .map((a) => {
      const s = Math.round((a.score || 0) * 100);
      const ms = a.details?.overallSavingsMs ? `${Math.round(a.details.overallSavingsMs)} ms` : '';
      const kb = a.details?.overallSavingsBytes
        ? `${Math.round(a.details.overallSavingsBytes / 1024)} KiB`
        : '';
      const saving = [ms, kb].filter(Boolean).join(' · ') || a.displayValue || `${s}/100`;
      return {
        id: a.id,
        title: a.title || a.id,
        saving,
        state: scoreState(s)
      };
    })
    .slice(0, 12);

  return {
    url: data?.id || lh.finalDisplayedUrl || '',
    strategy: lh.configSettings?.formFactor || 'mobile',
    scores: {
      perf: pct(cats.performance),
      a11y: pct(cats.accessibility),
      bp: pct(cats['best-practices']),
      seo: pct(cats.seo)
    },
    vitals,
    diagnostics,
    opps,
    screenshot: audits['final-screenshot']?.details?.data || ''
  };
}
