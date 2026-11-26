// src/feature/speed-test/speed-test.js
// ⚡ Orquestador de Speed Test (Core Web Vitals, Diagnósticos DOM/Peso, Oportunidades, Gauge y JSON)

import { savels, getls } from '@widev/storage.js';
import { wiGaleria } from '@widev/galeria.js';
import { ejecutarPageSpeed } from '@servicios/googleApi.js';
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
  const btnSaveJson = document.getElementById('dvSpd_btnSaveJson');
  const errBox = document.getElementById('dvSpd_err');
  const progBox = document.getElementById('dvSpd_progressBox');
  const progTxt = document.getElementById('dvSpd_progressTxt');
  const progPct = document.getElementById('dvSpd_progressPct');
  const progFill = document.getElementById('dvSpd_progressFill');
  const progLines = root.querySelectorAll('[data-spd-step]');
  const vitalsBox = document.getElementById('dvSpd_vitals');
  const diagsBox = document.getElementById('dvSpd_diags');
  const oppsBox = document.getElementById('dvSpd_opps');
  const oppsCount = document.getElementById('dvSpd_oppsCount');
  const shotBox = document.getElementById('dvSpd_shotBox');
  const welcomeCard = document.getElementById('dvSpd_welcomeCard');
  const resultsGrid = document.getElementById('dvSpd_resultsGrid');
  const needle = document.getElementById('dvSpd_needle');
  const gaugeScore = document.getElementById('dvSpd_gaugeScore');
  const gaugeBadge = document.getElementById('dvSpd_gaugeBadge');

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
    if (btnSaveJson) btnSaveJson.disabled = false;

    const kpis = [
      ['dvSpd_kpiPerf', 'dvSpd_valPerf', 'dvSpd_barPerf', 'dvSpd_barTxtPerf', rep.scores.perf],
      ['dvSpd_kpiA11y', 'dvSpd_valA11y', 'dvSpd_barA11y', 'dvSpd_barTxtA11y', rep.scores.a11y],
      ['dvSpd_kpiBp', 'dvSpd_valBp', 'dvSpd_barBp', 'dvSpd_barTxtBp', rep.scores.bp],
      ['dvSpd_kpiSeo', 'dvSpd_valSeo', 'dvSpd_barSeo', 'dvSpd_barTxtSeo', rep.scores.seo]
    ];
    kpis.forEach(([bId, vId, barId, txtId, val]) => {
      const st = scoreState(val);
      const box = document.getElementById(bId);
      const vEl = document.getElementById(vId);
      const barEl = document.getElementById(barId);
      const txtEl = document.getElementById(txtId);
      if (vEl) vEl.textContent = String(val);
      if (box) box.dataset.state = st;
      if (barEl) {
        barEl.style.width = `${val}%`;
        barEl.dataset.state = st;
      }
      if (txtEl) txtEl.textContent = `${val}%`;
    });

    const perf = rep.scores.perf || 0;
    const deg = -90 + (perf / 100) * 180;
    if (needle) needle.style.transform = `rotate(${deg}deg)`;
    if (gaugeScore) gaugeScore.textContent = `${perf}.0`;
    if (gaugeBadge) {
      const st = scoreState(perf);
      gaugeBadge.dataset.state = st;
      gaugeBadge.textContent = st === 'ok' ? msg.gaugePerfect : st === 'warn' ? msg.gaugeWarn : msg.gaugeBad;
    }

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

    if (diagsBox) {
      diagsBox.innerHTML = (rep.diagnostics || [])
        .map(
          (d) => `
          <div class="dv-spd-vital" data-state="${d.state}">
            <span>${d.label}</span>
            <strong>${d.value}</strong>
          </div>`
        )
        .join('');
    }

    if (oppsCount) oppsCount.textContent = String(rep.opps?.length || 0);
    if (oppsBox) {
      oppsBox.innerHTML = rep.opps?.length
        ? rep.opps
            .map(
              (o) => `
            <div class="dv-spd-opp" data-state="${o.state || 'warn'}">
              <span>${o.title}</span>
              <strong>${o.saving || o.display || 'Fix'}</strong>
            </div>`
            )
            .join('')
        : `<p class="dv-sub">${msg.oppsAllOk || ''}</p>`;
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
}

if (!window.__dvSpdReady) {
  window.__dvSpdReady = true;
  document.addEventListener('astro:page-load', initSpeedTest);
}
initSpeedTest();
