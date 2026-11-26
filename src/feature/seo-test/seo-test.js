// src/feature/seo-test/seo-test.js
// ⚡ Orquestador de SEO Test (Auditoría URL + SERP Real + Velocímetro + Analisa las Mejoras con JSON real)

import { savels, getls } from '@widev/storage.js';
import { wiMd } from '@widev/wimd.js';
import { wiGaleria } from '@widev/galeria.js';
import { wiTip } from '@widev/witip.js';
import { ejecutarPageSpeed, analizarConGemini } from '@servicios/googleApi.js';
import {
  escapeHtml,
  fetchMetaReal,
  generarMetaHtml,
  parseLighthouseSeo
} from './lib/seoAudit.js';

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
  const welcomeCard = document.getElementById('dvSeo_welcomeCard');
  const resultsGrid = document.getElementById('dvSeo_resultsGrid');
  const needle = document.getElementById('dvSeo_needle');
  const gaugeScore = document.getElementById('dvSeo_gaugeScore');
  const gaugeBadge = document.getElementById('dvSeo_gaugeBadge');
  const progBox = document.getElementById('dvSeo_progressBox');
  const progTxt = document.getElementById('dvSeo_progressTxt');
  const progPct = document.getElementById('dvSeo_progressPct');
  const progFill = document.getElementById('dvSeo_progressFill');
  const progLines = root.querySelectorAll('[data-prog-step]');

  // ── MODO 2: ANALISA LAS MEJORAS (desde el JSON real del reporte) ──
  const mejEmpty = document.getElementById('dvSeo_mejEmpty');
  const mejGrid = document.getElementById('dvSeo_mejGrid');
  const mejBadge = document.getElementById('dvSeo_mejBadge');
  const mejList = document.getElementById('dvSeo_mejList');
  const codeOut = document.getElementById('dvSeo_codeOut');
  const tabBtns = root.querySelectorAll('[data-seo-tab]');

  let strategy = 'mobile';
  let activeTab = 'json';
  let cacheReports = getls(LS_LIVE) || {};
  let currentParsed = cacheReports[strategy] || cacheReports.mobile || cacheReports.desktop || null;
  let progTimer = null;

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const isLive = btn.getAttribute('data-seo-mode') === 'live';
      livePane?.classList.toggle('dv-seo-hidden', !isLive);
      simPane?.classList.toggle('dv-seo-hidden', isLive);
    });
  });

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
    const avg = Math.round(seo * 0.65 + perf * 0.35);
    const deg = -90 + (avg / 100) * 180;
    if (needle) needle.style.transform = `rotate(${deg}deg)`;
    if (gaugeScore) gaugeScore.textContent = `${avg}.0`;
    if (gaugeBadge) {
      const st = scoreState(avg);
      gaugeBadge.dataset.state = st;
      gaugeBadge.textContent = st === 'ok' ? msg.gaugePerfect : st === 'warn' ? msg.gaugeWarn : msg.gaugeBad;
    }
  };

  const renderMejoras = (parsed) => {
    const has = Boolean(parsed);
    mejEmpty?.classList.toggle('dv-seo-hidden', has);
    mejGrid?.classList.toggle('dv-seo-hidden', !has);
    if (!parsed) return;

    const auditMap = msg.auditMap || {};
    const pendientes = parsed.seoList.filter((a) => a.nota10 < 10);

    if (mejBadge) {
      mejBadge.textContent = `${pendientes.length}`;
      mejBadge.dataset.state = pendientes.length === 0 ? 'ok' : 'warn';
    }

    if (mejList) {
      if (!pendientes.length) {
        mejList.innerHTML = `<div class="dv-seo-audit-item" data-state="ok"><p class="dv-seo-audit-title"><i class="fa-solid fa-circle-check"></i><span>${escapeHtml(msg.mejorasAllOk)}</span></p></div>`;
      } else {
        mejList.innerHTML = pendientes
          .map((a) => {
            const loc = auditMap[a.id] || {};
            const title = loc.title || a.title;
            const tip = loc.tip || a.desc || title;
            const comment = a.reason ? `${tip} · ${a.reason}` : tip;
            return `
            <div class="dv-seo-audit-item" data-state="${a.state}">
              <div class="dv-seo-audit-top">
                <span class="dv-seo-audit-title">
                  <i class="fa-solid ${a.state === 'warn' ? 'fa-circle-exclamation' : 'fa-circle-xmark'}"></i>
                  <span>${escapeHtml(title)}</span>
                </span>
                <span class="dv-pill-status" data-state="${a.state}">${a.nota10}/10</span>
              </div>
              ${a.extracted ? `<div class="dv-seo-extracted">${escapeHtml(a.extracted)}</div>` : ''}
              <p class="dv-seo-audit-desc">${escapeHtml(comment)}</p>
            </div>`;
          })
          .join('');
      }
    }

    if (codeOut) {
      if (activeTab === 'headers') {
        codeOut.textContent = msg.headersTpl || '';
      } else if (activeTab === 'meta') {
        const m = parsed.metaReal || {};
        codeOut.textContent = generarMetaHtml({
          title: m.title || '',
          desc: m.desc || '',
          url: m.canonical || parsed.url || '',
          ogImage: m.ogImage || ''
        });
      } else {
        const cleanJson = { ...parsed, screenshot: parsed.screenshot ? '[base64_image]' : '' };
        codeOut.textContent = JSON.stringify(cleanJson, null, 2);
      }
    }
  };

  const renderLive = (parsed) => {
    if (!parsed) return;
    currentParsed = parsed;
    welcomeCard?.classList.add('dv-seo-hidden');
    resultsGrid?.classList.remove('dv-seo-hidden');
    if (btnAi) btnAi.disabled = false;
    if (btnSaveJson) btnSaveJson.disabled = false;

    const mapKpi = [
      ['dvSeo_kpiSeo', 'dvSeo_valSeo', 'dvSeo_barSeo', 'dvSeo_barTxtSeo', parsed.scores.seo],
      ['dvSeo_kpiPerf', 'dvSeo_valPerf', 'dvSeo_barPerf', 'dvSeo_barTxtPerf', parsed.scores.perf],
      ['dvSeo_kpiA11y', 'dvSeo_valA11y', 'dvSeo_barA11y', 'dvSeo_barTxtA11y', parsed.scores.a11y],
      ['dvSeo_kpiBp', 'dvSeo_valBp', 'dvSeo_barBp', 'dvSeo_barTxtBp', parsed.scores.bp]
    ];
    mapKpi.forEach(([boxId, valId, barId, txtId, val]) => {
      const st = scoreState(val);
      const box = document.getElementById(boxId);
      const valEl = document.getElementById(valId);
      const barEl = document.getElementById(barId);
      const txtEl = document.getElementById(txtId);
      if (valEl) valEl.textContent = String(val);
      if (box) box.dataset.state = st;
      if (barEl) {
        barEl.style.width = `${val}%`;
        barEl.dataset.state = st;
      }
      if (txtEl) txtEl.textContent = `${val}%`;
    });

    updateGauge(parsed.scores.seo, parsed.scores.perf);

    if (metaRealBox) {
      const m = parsed.metaReal;
      if (m && (m.title || m.desc || m.h1)) {
        let host = parsed.url || '';
        let originUrl = parsed.url || '';
        try {
          const u = new URL(parsed.url);
          host = u.hostname.replace(/^www\./, '');
          originUrl = u.origin;
        } catch {}
        const fav = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
        const siteLabel = host.split('.')[0] ? host.split('.')[0].replace(/^\w/, (c) => c.toUpperCase()) : host;
        const headLabel =
          msg.idioma === 'en' ? 'Google Result (Desktop & Mobile)' : 'Resultado en Google (Desktop & Móvil)';
        const activeLabel = msg.idioma === 'en' ? '• SEO Active' : '• SEO Activo';
        const verifiedLabel = msg.idioma === 'en' ? 'Verified Snippet' : 'Rich Snippet Verificado';

        metaRealBox.classList.remove('dv-seo-hidden');
        metaRealBox.innerHTML = `
          <div class="dv-gserp-wrap">
            <div class="dv-gserp-head">
              <span>${headLabel}</span>
              <span class="dv-pill-status" data-state="ok">${activeLabel}</span>
            </div>
            <div class="dv-gserp-card">
              <div class="dv-gserp-site">
                <img class="dv-gserp-fav" src="${fav}" alt="" />
                <div class="dv-gserp-site-txt">
                  <strong>${escapeHtml(siteLabel)}</strong>
                  <span>${escapeHtml(m.canonical || originUrl)}</span>
                </div>
              </div>
              <div class="dv-gserp-body">
                <div class="dv-gserp-copy">
                  <div class="dv-gserp-title">${escapeHtml(m.title || '—')}</div>
                  <div class="dv-gserp-desc">${escapeHtml(m.desc || '—')}</div>
                </div>
                ${m.ogImage ? `<img class="dv-gserp-thumb" src="${escapeHtml(m.ogImage)}" alt="" />` : ''}
              </div>
              <div class="dv-gserp-foot">
                <span><i class="fa-solid fa-shield-halved"></i> ${verifiedLabel}</span>
                <span>H1: ${escapeHtml(m.h1 || '—')} · ${m.h2Count || 0} H2</span>
              </div>
            </div>
          </div>
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

    renderMejoras(parsed);
  };

  if (currentParsed) {
    if (liveUrl && currentParsed.url) liveUrl.value = currentParsed.url;
    renderLive(currentParsed);
  } else {
    renderMejoras(null);
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

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.getAttribute('data-seo-tab') || 'json';
      renderMejoras(currentParsed);
    });
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
}

if (!window.__dvSeoReady) {
  window.__dvSeoReady = true;
  document.addEventListener('astro:page-load', initSeoTest);
}
initSeoTest();
