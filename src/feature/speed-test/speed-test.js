// src/feature/speed-test/speed-test.js
// ⚡ Orquestador de Speed Test (PageSpeed Insights v5 + Core Web Vitals + Gemini AI)

import { savels, getls } from '@widev/storage.js';
import { wiMd } from '@widev/wimd.js';
import { wiGaleria } from '@widev/galeria.js';
import { ejecutarPageSpeed, analizarConGemini } from '@servicios/googleApi.js';
import { parseSpeedReport, scoreState } from './lib/vitals.js';

const LS_KEY = 'dv_speed_last';

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
    window.__dvSpdGaleria = wiGaleria('.dv-seo-shot-img', { altFallback: 'Speed Screenshot' });
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

  let strategy = 'mobile';
  let lastReport = getls(LS_KEY);
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
      shotBox.innerHTML = `<img class="dv-seo-shot-img" src="${rep.screenshot}" alt="${rep.url}" />`;
    }
  };

  if (lastReport) {
    if (urlInput && lastReport.url) urlInput.value = lastReport.url;
    render(lastReport);
  }

  stratBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      stratBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      strategy = btn.getAttribute('data-spd-strat') || 'mobile';
    });
  });

  btnRun?.addEventListener('click', async () => {
    errBox?.classList.add('dv-spd-hidden');
    const span = btnRun.querySelector('span');
    btnRun.disabled = true;
    if (span) span.textContent = msg.runningBtn || '...';
    startProgress();

    const res = await ejecutarPageSpeed(urlInput?.value, strategy);
    stopProgress();
    btnRun.disabled = false;
    if (span) span.textContent = msg.runBtn || 'Speed Test';

    if (!res.ok) {
      if (errBox) {
        errBox.classList.remove('dv-spd-hidden');
        errBox.textContent = res.errorCode === 'rate_limit' ? msg.rateLimitMsg : res.error || msg.errGeneric;
      }
      return;
    }

    const rep = parseSpeedReport(res.data);
    savels(LS_KEY, rep, 24);
    render(rep);
  });

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
    const opps = lastReport.opps.map((o) => `- ${o.title} (${o.display})`).join('\n');
    const prompt =
      msg.idioma === 'en'
        ? `Act as a web performance engineer. URL: ${lastReport.url} (Performance ${lastReport.scores.perf}/100, ${summary}). Opportunities:\n${opps}\nGive 5 concise fixes.`
        : `Actúa como especialista en WPO y Core Web Vitals. URL: ${lastReport.url} (Performance ${lastReport.scores.perf}/100, ${summary}). Oportunidades:\n${opps}\nDame 5 mejoras prácticas y breves.`;

    const res = await analizarConGemini(prompt);
    btnAi.disabled = false;
    if (span) span.textContent = msg.aiBtn || 'Gemini AI';

    if (!res.ok) {
      if (aiBox) {
        aiBox.innerHTML = `<p class="dv-sub">${res.errorCode === 'rate_limit' ? msg.rateLimitMsg : res.error}</p>`;
      }
      return;
    }
    if (aiBox) aiBox.innerHTML = wiMd(res.text, msg.idioma || 'es');
  });
}

if (!window.__dvSpdReady) {
  window.__dvSpdReady = true;
  document.addEventListener('astro:page-load', initSpeedTest);
}
initSpeedTest();
