// src/feature/seo-test/seo-test.js
// ⚡ Orquestador de SEO Test (Gauge Velocímetro, Notas 0-10 transparentes, /api/meta, IA corta y JSON)

import { savels, getls } from '@widev/storage.js';
import { wiMd } from '@widev/wimd.js';
import { wiGaleria } from '@widev/galeria.js';
import { wiTip } from '@widev/witip.js';
import { ejecutarPageSpeed, analizarConGemini } from '@servicios/googleApi.js';
import { SEO_LIMITS } from '@semillas/seo-test.js';
import {
  escapeHtml,
  evaluarSeo,
  extraerDominio,
  fetchMetaReal,
  generarMetaHtml,
  parseLighthouseSeo
} from './lib/seoAudit.js';

const LS_SIM = 'dv_seo_test';
const LS_LIVE = 'dv_seo_live_cache';

function getMsgs(root) {
  try {
    return JSON.parse(root?.dataset.i18nMsg || '{}');
  } catch {
    return {};
  }
}

function scoreState(n) {
  if (n >= 90) return 'ok';
  if (n >= 50) return 'warn';
  return 'err';
}

function descargarJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function initSeoTest() {
  const root = document.getElementById('dvSeoView');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';

  wiTip();
  if (!window.__dvSeoGaleria) {
    window.__dvSeoGaleria = wiGaleria('.dv-seo-shot-img', { altFallback: 'SEO Screenshot' });
  }

  const msg = getMsgs(root);
  const livePane = document.getElementById('dvSeo_livePane');
  const simPane = document.getElementById('dvSeo_simPane');
  const modeBtns = root.querySelectorAll('[data-seo-mode]');

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const isLive = btn.getAttribute('data-seo-mode') === 'live';
      livePane?.classList.toggle('dv-seo-hidden', !isLive);
      simPane?.classList.toggle('dv-seo-hidden', isLive);
    });
  });

  // ── MODO 1: AUDITORÍA URL ──
  const liveUrl = document.getElementById('dvSeo_liveUrl');
  const stratBtns = root.querySelectorAll('[data-seo-strat]');
  const btnRun = document.getElementById('dvSeo_btnRun');
  const btnAi = document.getElementById('dvSeo_btnAi');
  const btnSaveJson = document.getElementById('dvSeo_btnSaveJson');
  const liveErr = document.getElementById('dvSeo_liveErr');
  const auditsBox = document.getElementById('dvSeo_liveAudits');
  const auditsCount = document.getElementById('dvSeo_auditsCount');
  const metaRealBox = document.getElementById('dvSeo_metaRealBox');
  const shotBox = document.getElementById('dvSeo_shotBox');
  const aiBox = document.getElementById('dvSeo_aiBox');
  const needle = document.getElementById('dvSeo_needle');
  const gaugeScore = document.getElementById('dvSeo_gaugeScore');
  const gaugeBadge = document.getElementById('dvSeo_gaugeBadge');
  const progBox = document.getElementById('dvSeo_progressBox');
  const progTxt = document.getElementById('dvSeo_progressTxt');
  const progPct = document.getElementById('dvSeo_progressPct');
  const progFill = document.getElementById('dvSeo_progressFill');
  const progLines = root.querySelectorAll('[data-prog-step]');

  let strategy = 'mobile';
  let cacheReports = getls(LS_LIVE) || {};
  let currentParsed = cacheReports[strategy] || cacheReports.mobile || cacheReports.desktop || null;
  let progTimer = null;

  const startProgress = () => {
    clearInterval(progTimer);
    let pct = 14;
    const steps = msg.progressSteps || ['...'];
    progBox?.classList.remove('dv-seo-hidden');
    const paint = () => {
      if (progFill) progFill.style.width = `${pct}%`;
      if (progPct) progPct.textContent = `${pct}%`;
      const stepIdx = pct < 42 ? 0 : pct < 78 ? 1 : 2;
      if (progTxt) progTxt.textContent = steps[stepIdx] || steps[0];
      progLines.forEach((line, idx) => line.setAttribute('data-active', idx <= stepIdx ? '1' : '0'));
    };
    paint();
    progTimer = setInterval(() => {
      pct = Math.min(92, pct + (pct < 60 ? 8 : 3));
      paint();
    }, 650);
  };

  const stopProgress = () => {
    clearInterval(progTimer);
    if (progFill) progFill.style.width = '100%';
    if (progPct) progPct.textContent = '100%';
    progLines.forEach((line) => line.setAttribute('data-active', '1'));
    setTimeout(() => progBox?.classList.add('dv-seo-hidden'), 350);
  };

  const updateGauge = (seo, perf) => {
    const avg = Math.round((seo * 0.65) + (perf * 0.35));
    const deg = -90 + (avg / 100) * 180;
    if (needle) needle.style.transform = `rotate(${deg}deg)`;
    if (gaugeScore) gaugeScore.textContent = `${avg}.0`;
    if (gaugeBadge) {
      const st = scoreState(avg);
      gaugeBadge.dataset.state = st;
      gaugeBadge.textContent = st === 'ok' ? msg.gaugePerfect : st === 'warn' ? msg.gaugeWarn : msg.gaugeBad;
    }
  };

  const renderLive = (parsed) => {
    if (!parsed) return;
    currentParsed = parsed;
    if (btnAi) btnAi.disabled = false;
    if (btnSaveJson) btnSaveJson.disabled = false;

    const mapKpi = [
      ['dvSeo_kpiSeo', 'dvSeo_valSeo', parsed.scores.seo],
      ['dvSeo_kpiPerf', 'dvSeo_valPerf', parsed.scores.perf],
      ['dvSeo_kpiA11y', 'dvSeo_valA11y', parsed.scores.a11y],
      ['dvSeo_kpiBp', 'dvSeo_valBp', parsed.scores.bp]
    ];
    mapKpi.forEach(([boxId, valId, val]) => {
      const box = document.getElementById(boxId);
      const valEl = document.getElementById(valId);
      if (valEl) valEl.textContent = String(val);
      if (box) box.dataset.state = scoreState(val);
    });

    updateGauge(parsed.scores.seo, parsed.scores.perf);

    if (metaRealBox) {
      const m = parsed.metaReal;
      if (m && (m.title || m.desc || m.h1)) {
        metaRealBox.classList.remove('dv-seo-hidden');
        metaRealBox.innerHTML = `
          <div class="dv-seo-meta-row"><strong>&lt;title&gt;</strong><span>${escapeHtml(m.title || '—')}</span></div>
          <div class="dv-seo-meta-row"><strong>Description</strong><span>${escapeHtml(m.desc || '—')}</span></div>
          <div class="dv-seo-meta-row"><strong>H1 / H2</strong><span>${escapeHtml(m.h1 || '—')} (${m.h2Count || 0} H2)</span></div>
          <div class="dv-seo-meta-row"><strong>Canonical</strong><span>${escapeHtml(m.canonical || '—')}</span></div>
        `;
      } else {
        metaRealBox.classList.add('dv-seo-hidden');
      }
    }

    if (auditsCount) {
      const okTotal = parsed.seoList.filter((a) => a.state === 'ok').length;
      auditsCount.textContent = `${okTotal}/${parsed.seoList.length}`;
    }

    const auditMap = msg.auditMap || {};
    if (auditsBox) {
      auditsBox.innerHTML = parsed.seoList
        .map((a) => {
          const localized = auditMap[a.id] || {};
          const title = localized.title || a.title;
          const tip = localized.tip || a.desc || title;
          const st = a.state || (a.nota10 >= 9 ? 'ok' : a.nota10 >= 6 ? 'warn' : 'err');
          const ico = st === 'ok' ? 'fa-circle-check' : st === 'warn' ? 'fa-circle-exclamation' : 'fa-circle-xmark';
          const comment = a.reason ? `${tip} · ${a.reason}` : tip;
          return `
          <div class="dv-seo-audit-item" data-state="${st}" data-witip="${escapeHtml(comment)}" data-wtipo="top">
            <div class="dv-seo-audit-top">
              <span class="dv-seo-audit-title">
                <i class="fa-solid ${ico}"></i>
                <span>${escapeHtml(title)}</span>
              </span>
              <span class="dv-pill-status" data-state="${st}">${a.nota10}/10</span>
            </div>
            ${a.extracted ? `<div class="dv-seo-extracted">${escapeHtml(a.extracted)}</div>` : ''}
            <p class="dv-seo-audit-desc">${escapeHtml(comment)}</p>
          </div>`;
        })
        .join('');
    }

    if (shotBox && parsed.screenshot) {
      shotBox.innerHTML = `<img class="dv-seo-shot-img" src="${parsed.screenshot}" alt="${escapeHtml(parsed.url)}" />`;
    }
  };

  if (currentParsed) {
    if (liveUrl && currentParsed.url) liveUrl.value = currentParsed.url;
    renderLive(currentParsed);
  }

  const runLiveAudit = async () => {
    liveErr?.classList.add('dv-seo-hidden');
    aiBox?.classList.add('dv-seo-hidden');
    const urlTarget = liveUrl?.value?.trim() || '';
    const span = btnRun?.querySelector('span');
    if (btnRun) btnRun.disabled = true;
    if (span) span.textContent = msg.runningBtn || '...';
    startProgress();

    const [res, metaReal] = await Promise.all([
      ejecutarPageSpeed(urlTarget, strategy),
      fetchMetaReal(urlTarget)
    ]);

    stopProgress();
    if (btnRun) btnRun.disabled = false;
    if (span) span.textContent = msg.runBtn || 'Analizar SEO';

    if (!res.ok) {
      if (liveErr) {
        liveErr.classList.remove('dv-seo-hidden');
        liveErr.textContent = res.errorCode === 'rate_limit' ? msg.rateLimitMsg : res.error || msg.errGeneric;
      }
      return;
    }

    const parsed = parseLighthouseSeo(res.data, metaReal, msg.idioma || 'es');
    cacheReports[strategy] = parsed;
    savels(LS_LIVE, cacheReports, 24);
    renderLive(parsed);
  };

  stratBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-seo-strat') || 'mobile';
      if (next === strategy) return;
      stratBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      strategy = next;
      const targetUrl = liveUrl?.value?.trim().replace(/\/+$/, '');
      const cached = cacheReports[strategy];
      if (cached && cached.url?.replace(/\/+$/, '') === targetUrl) {
        renderLive(cached);
      } else if (currentParsed) {
        runLiveAudit();
      }
    });
  });

  btnRun?.addEventListener('click', runLiveAudit);

  btnSaveJson?.addEventListener('click', () => {
    if (!currentParsed) return;
    descargarJson(currentParsed, `seo-report-${strategy}.json`);
  });

  btnAi?.addEventListener('click', async () => {
    if (!currentParsed) return;
    const span = btnAi.querySelector('span');
    btnAi.disabled = true;
    if (span) span.textContent = msg.aiRunning || '...';

    const resumen = currentParsed.seoList.map((a) => `${a.title}: ${a.nota10}/10`).join('; ');
    const prompt =
      msg.idioma === 'en'
        ? `Summarize in 2 short sentences (max 45 words) the top SEO & speed action for ${currentParsed.url} (SEO ${currentParsed.scores.seo}, Speed ${currentParsed.scores.perf}). Audits: ${resumen}`
        : `Resume en 2 frases muy cortas (máximo 45 palabras) qué corregir primero en ${currentParsed.url} (SEO ${currentParsed.scores.seo}, Velocidad ${currentParsed.scores.perf}). Auditorías: ${resumen}`;

    const res = await analizarConGemini(prompt);
    btnAi.disabled = false;
    if (span) span.textContent = msg.aiBtn || 'IA';

    if (aiBox) {
      aiBox.classList.remove('dv-seo-hidden');
      aiBox.innerHTML = res.ok
        ? wiMd(res.text, msg.idioma || 'es')
        : `<p class="dv-sub">${res.errorCode === 'rate_limit' ? msg.rateLimitMsg : escapeHtml(res.error)}</p>`;
    }
  });

  // ── MODO 2: ANALISA LAS METAS ──
  const inpTitle = document.getElementById('dvSeo_title');
  const inpDesc = document.getElementById('dvSeo_desc');
  const inpUrl = document.getElementById('dvSeo_url');
  const inpH1 = document.getElementById('dvSeo_h1');
  const inpOg = document.getElementById('dvSeo_og');
  const selRobots = document.getElementById('dvSeo_robots');
  const titleCount = document.getElementById('dvSeo_titleCount');
  const descCount = document.getElementById('dvSeo_descCount');
  const serpUrl = document.getElementById('dvSeo_serpUrl');
  const serpTitle = document.getElementById('dvSeo_serpTitle');
  const serpDesc = document.getElementById('dvSeo_serpDesc');
  const ogImgOut = document.getElementById('dvSeo_ogImgOut');
  const ogTitleOut = document.getElementById('dvSeo_ogTitleOut');
  const ogDescOut = document.getElementById('dvSeo_ogDescOut');
  const codeOut = document.getElementById('dvSeo_codeOut');
  const tabBtns = root.querySelectorAll('[data-seo-tab]');

  let activeTab = 'meta';
  const savedSim = getls(LS_SIM);
  if (savedSim && typeof savedSim === 'object') {
    if (inpTitle && savedSim.title != null) inpTitle.value = savedSim.title;
    if (inpDesc && savedSim.desc != null) inpDesc.value = savedSim.desc;
    if (inpUrl && savedSim.url != null) inpUrl.value = savedSim.url;
    if (inpH1 && savedSim.h1 != null) inpH1.value = savedSim.h1;
    if (inpOg && savedSim.ogImage != null) inpOg.value = savedSim.ogImage;
    if (selRobots && savedSim.robots != null) selRobots.value = savedSim.robots;
  }

  const syncSim = () => {
    const data = {
      title: inpTitle?.value || '',
      desc: inpDesc?.value || '',
      url: inpUrl?.value || '',
      h1: inpH1?.value || '',
      ogImage: inpOg?.value || '',
      robots: selRobots?.value || 'index, follow'
    };
    savels(LS_SIM, data, 24);
    const { tLen, dLen, checks } = evaluarSeo(data);

    if (titleCount) {
      titleCount.textContent = `${tLen} / ${SEO_LIMITS.titleMax}`;
      titleCount.dataset.state = tLen >= SEO_LIMITS.titleMin && tLen <= SEO_LIMITS.titleMax ? 'ok' : 'err';
    }
    if (descCount) {
      descCount.textContent = `${dLen} / ${SEO_LIMITS.descMax}`;
      descCount.dataset.state = dLen >= SEO_LIMITS.descMin && dLen <= SEO_LIMITS.descMax ? 'ok' : 'err';
    }
    checks.forEach((c) => {
      const row = root.querySelector(`[data-check-key="${c.key}"]`);
      if (!row) return;
      row.setAttribute('data-ok', c.ok ? '1' : '0');
      const ico = row.querySelector('i');
      if (ico) ico.className = c.ok ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
    });

    if (serpUrl) serpUrl.textContent = extraerDominio(data.url);
    if (serpTitle) serpTitle.textContent = data.title || '...';
    if (serpDesc) serpDesc.textContent = data.desc || '...';
    if (ogImgOut) ogImgOut.textContent = data.ogImage || '—';
    if (ogTitleOut) ogTitleOut.textContent = data.title || '...';
    if (ogDescOut) ogDescOut.textContent = data.desc || '...';
    if (codeOut) codeOut.textContent = activeTab === 'headers' ? msg.headersTpl || '' : generarMetaHtml(data);
  };

  [inpTitle, inpDesc, inpUrl, inpH1, inpOg, selRobots].forEach((el) => {
    el?.addEventListener('input', syncSim);
    el?.addEventListener('change', syncSim);
  });

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.getAttribute('data-seo-tab') || 'meta';
      syncSim();
    });
  });

  document.getElementById('dvSeo_btnReset')?.addEventListener('click', () => {
    const d = msg.defaults || {};
    if (inpTitle) inpTitle.value = d.title || '';
    if (inpDesc) inpDesc.value = d.desc || '';
    if (inpUrl) inpUrl.value = d.url || '';
    if (inpH1) inpH1.value = d.h1 || '';
    if (inpOg) inpOg.value = d.ogImage || '';
    if (selRobots) selRobots.value = d.robots || 'index, follow';
    syncSim();
  });

  document.getElementById('dvSeo_btnCopy')?.addEventListener('click', async (e) => {
    if (!codeOut?.textContent) return;
    try {
      await navigator.clipboard.writeText(codeOut.textContent);
      const span = e.currentTarget.querySelector('span');
      const prev = span?.textContent;
      if (span && msg.copied) {
        span.textContent = msg.copied;
        setTimeout(() => { span.textContent = prev || ''; }, 1300);
      }
    } catch {}
  });

  syncSim();
}

if (!window.__dvSeoReady) {
  window.__dvSeoReady = true;
  document.addEventListener('astro:page-load', initSeoTest);
}
initSeoTest();
