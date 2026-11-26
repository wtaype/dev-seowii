// src/feature/speed-test/lib/vitals.js
// ⚡ Parser de Core Web Vitals y oportunidades desde PageSpeed Insights v5

const VITAL_KEYS = [
  { id: 'first-contentful-paint', label: 'FCP' },
  { id: 'largest-contentful-paint', label: 'LCP' },
  { id: 'cumulative-layout-shift', label: 'CLS' },
  { id: 'total-blocking-time', label: 'TBT' },
  { id: 'speed-index', label: 'Speed Index' },
  { id: 'server-response-time', label: 'TTFB' }
];

const OPP_KEYS = [
  'render-blocking-resources',
  'unused-javascript',
  'unused-css-rules',
  'uses-optimized-images',
  'modern-image-formats',
  'uses-text-compression',
  'total-byte-weight'
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

  const opps = OPP_KEYS.filter((k) => audits[k] && (audits[k].score ?? 1) < 0.9).map((k) => ({
    id: k,
    title: audits[k].title || k,
    display: audits[k].displayValue || ''
  }));

  return {
    url: data?.id || lh.finalDisplayedUrl || '',
    scores: {
      perf: pct(cats.performance),
      a11y: pct(cats.accessibility),
      bp: pct(cats['best-practices']),
      seo: pct(cats.seo)
    },
    vitals,
    opps,
    screenshot: audits['final-screenshot']?.details?.data || ''
  };
}
