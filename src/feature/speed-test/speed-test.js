// src/feature/speed-test/speed-test.js
// ⚡ Orquestador de Speed Test (Core Web Vitals, Oportunidades, Captura Móvil/Desktop, IA corta y JSON)

import { savels, getls } from '@widev/storage.js';
import { wiMd } from '@widev/wimd.js';
import { wiGaleria } from '@widev/galeria.js';
import { ejecutarPageSpeed, analizarConGemini } from '@servicios/googleApi.js';
import { parseSpeedReport, scoreState } from './lib/vitals.js';

const LS_KEY = 'dv_speed_cache';

function getMsgs(root) {
  try {
    return JSON.parse(root?.dataset.i18nMsg || '{}');
  } catch {
    return {};
  }
}

function initSpeedTest() {
  const root = document.getElementById('dvSpeedView');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';

  if (!window.__dvSpdGaleria) {
    window.__dvSpdGaleria = wiGaleria('.dv-spd-shot-img', { altFallback: 'Speed Screenshot' });
  }

  const msg = getMsgs(root);
  const urlInput = document.getElementById('dvSpd_url');
  const stratBtns = root.querySelectorAll('[data-spd-strat]');
  const btnRun = document.getElementById('dvSpd_btnRun');
  const btnAi = document.getElementById('dvSpd_btnAi');
  const btnSaveJson = document.getElementById('dvSpd_btnSaveJson');
  const errBox = document.getElementById('dvSpd_err');
  const progBox = document.getElementById('dvSpd_progressBox');
  const progTxt = document.getElementById('dvSpd_progressTxt');
  const progPct = document.getElementById('dvSpd_progressPct');
  const progFill = document.getElementById('dvSpd_progressFill');
  const progLines = root.querySelectorAll('[data-spd-step]');
  const vitalsBox = document.getElementById('dvSpd_vitals');
  const oppsBox = document.getElementById('dvSpd_opps');
  const shotBox = document.getElementById('dvSpd_shotBox');
  const aiBox = document.getElementById('dvSpd_aiBox');
  const welcomeCard = document.getElementById('dvSpd_welcomeCard');
  const resultsGrid = document.getElementById('dvSpd_resultsGrid');

  let strategy = 'mobile';
  let cacheReports = getls(LS_KEY) || {};
  let lastReport = cacheReports[strategy] || cacheReports.mobile || cacheReports.desktop || null;
  let progTimer = null;

  const startProgress = () => {
    clearInterval(progTimer);
    let pct = 14;
    const steps = msg.progressSteps || ['...'];
    progBox?.classList.remove('dv-spd-hidden');
    const paint = () => {
      if (progFill) progFill.style.width = `${pct}%`;
      if (progPct) progPct.textContent = `${pct}%`;
      const idx = pct < 42 ? 0 : pct < 78 ? 1 : 2;
      if (progTxt) progTxt.textContent = steps[idx] || steps[0];
      progLines.forEach((l, i) => l.setAttribute('data-active', i <= idx ? '1' : '0'));
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
    progLines.forEach((l) => l.setAttribute('data-active', '1'));
    setTimeout(() => progBox?.classList.add('dv-spd-hidden'), 350);
  };

  const render = (rep) => {
    if (!rep) return;
    lastReport = rep;
    welcomeCard?.classList.add('dv-spd-hidden');
    resultsGrid?.classList.remove('dv-spd-hidden');
    if (btnAi) btnAi.disabled = false;
    if (btnSaveJson) btnSaveJson.disabled = false;

    const kpis = [
      ['dvSpd_kpiPerf', 'dvSpd_valPerf', rep.scores.perf],
      ['dvSpd_kpiA11y', 'dvSpd_valA11y', rep.scores.a11y],
      ['dvSpd_kpiBp', 'dvSpd_valBp', rep.scores.bp],
      ['dvSpd_kpiSeo', 'dvSpd_valSeo', rep.scores.seo]
    ];
    kpis.forEach(([bId, vId, val]) => {
      const box = document.getElementById(bId);
      const vEl = document.getElementById(vId);
      if (vEl) vEl.textContent = String(val);
      if (box) box.dataset.state = scoreState(val);
    });

    if (vitalsBox) {
      vitalsBox.innerHTML = rep.vitals
        .map(
          (v) => `
          <div class="dv-spd-vital" data-state="${v.state}">
            <span>${v.label}</span>
            <strong>${v.value}</strong>
          </div>`
        )
        .join('');
    }

    if (oppsBox) {
      oppsBox.innerHTML = rep.opps.length
        ? rep.opps
            .map(
              (o) => `
            <div class="dv-spd-opp">
              <span>${o.title}</span>
              <strong>${o.display || 'Fix'}</strong>
            </div>`
            )
            .join('')
        : '';
    }

    if (shotBox && rep.screenshot) {
      shotBox.innerHTML = `<img class="dv-spd-shot-img" src="${rep.screenshot}" alt="${rep.url}" />`;
    }
  };

  if (lastReport) {
    if (urlInput && lastReport.url) urlInput.value = lastReport.url;
    render(lastReport);
  }

  const runSpeedTest = async () => {
    errBox?.classList.add('dv-spd-hidden');
    aiBox?.classList.add('dv-spd-hidden');
    const span = btnRun?.querySelector('span');
    if (btnRun) btnRun.disabled = true;
    if (span) span.textContent = msg.runningBtn || '...';
    startProgress();

    const res = await ejecutarPageSpeed(urlInput?.value, strategy);
    stopProgress();
    if (btnRun) btnRun.disabled = false;
    if (span) span.textContent = msg.runBtn || 'Speed Test';

    if (!res.ok) {
      if (errBox) {
        errBox.classList.remove('dv-spd-hidden');
        errBox.textContent = res.errorCode === 'rate_limit' ? msg.rateLimitMsg : res.error || msg.errGeneric;
      }
      return;
    }

    const rep = parseSpeedReport(res.data);
    cacheReports[strategy] = rep;
    savels(LS_KEY, cacheReports, 24);
    render(rep);
  };

  stratBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-spd-strat') || 'mobile';
      if (next === strategy) return;
      stratBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      strategy = next;
      const targetUrl = urlInput?.value?.trim().replace(/\/+$/, '');
      const cached = cacheReports[strategy];
      if (cached && cached.url?.replace(/\/+$/, '') === targetUrl) {
        render(cached);
      } else if (lastReport) {
        runSpeedTest();
      }
    });
  });

  btnRun?.addEventListener('click', runSpeedTest);

  btnSaveJson?.addEventListener('click', () => {
    if (!lastReport) return;
    const blob = new Blob([JSON.stringify(lastReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speed-report-${strategy}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  btnAi?.addEventListener('click', async () => {
    if (!lastReport) return;
    const span = btnAi.querySelector('span');
    btnAi.disabled = true;
    if (span) span.textContent = msg.aiRunning || '...';

    const summary = lastReport.vitals.map((v) => `${v.label}: ${v.value}`).join(', ');
    const prompt =
      msg.idioma === 'en'
        ? `Summarize in 2 short sentences (max 45 words) the top speed fix for ${lastReport.url} (Perf ${lastReport.scores.perf}, ${summary}).`
        : `Resume en 2 frases muy cortas (máximo 45 palabras) qué optimizar primero en ${lastReport.url} (Performance ${lastReport.scores.perf}, ${summary}).`;

    const res = await analizarConGemini(prompt);
    btnAi.disabled = false;
    if (span) span.textContent = msg.aiBtn || 'IA';

    if (aiBox) {
      aiBox.classList.remove('dv-spd-hidden');
      aiBox.innerHTML = res.ok
        ? wiMd(res.text, msg.idioma || 'es')
        : `<p class="dv-sub">${res.errorCode === 'rate_limit' ? msg.rateLimitMsg : res.error}</p>`;
    }
  });
}

if (!window.__dvSpdReady) {
  window.__dvSpdReady = true;
  document.addEventListener('astro:page-load', initSpeedTest);
}
initSpeedTest();
