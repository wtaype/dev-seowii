// src/feature/ajustes/ajustes.js
// ⚡ Orquestador de Ajustes API (guardado local y estado de cuota)

import { getUserKeys, saveUserKeys, getKeyStatus } from '@servicios/googleApi.js';

function getMsgs(root) {
  try {
    return JSON.parse(root?.dataset.i18nMsg || '{}');
  } catch {
    return {};
  }
}

function initAjustes() {
  const root = document.getElementById('dvAjustesView');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';

  const msg = getMsgs(root);
  const inpSpeed = document.getElementById('dvAj_speedKey');
  const inpGemini = document.getElementById('dvAj_geminiKey');
  const statusEl = document.getElementById('dvAj_status');

  const current = getUserKeys();
  if (inpSpeed) inpSpeed.value = current.speedKey;
  if (inpGemini) inpGemini.value = current.geminiKey;

  const refreshStatus = (customText = '', customState = '') => {
    if (!statusEl) return;
    if (customText) {
      statusEl.textContent = customText;
      statusEl.dataset.state = customState || 'ok';
      return;
    }
    const st = getKeyStatus();
    if (st.hasUserSpeed || st.hasUserGemini) {
      statusEl.textContent = msg.statusUser || '';
      statusEl.dataset.state = 'ok';
    } else if (!st.limitOk) {
      statusEl.textContent = msg.statusBlocked || '';
      statusEl.dataset.state = 'err';
    } else {
      statusEl.textContent = msg.statusSystem || '';
      statusEl.dataset.state = 'warn';
    }
  };

  root.querySelectorAll('[data-toggle-vis]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.getAttribute('data-toggle-vis') || '');
      if (!target) return;
      target.type = target.type === 'password' ? 'text' : 'password';
    });
  });

  document.getElementById('dvAj_btnSave')?.addEventListener('click', () => {
    saveUserKeys({
      speedKey: inpSpeed?.value || '',
      geminiKey: inpGemini?.value || ''
    });
    refreshStatus(msg.savedMsg, 'ok');
  });

  document.getElementById('dvAj_btnClear')?.addEventListener('click', () => {
    if (inpSpeed) inpSpeed.value = '';
    if (inpGemini) inpGemini.value = '';
    saveUserKeys({ speedKey: '', geminiKey: '' });
    refreshStatus(msg.clearedMsg, 'warn');
  });

  refreshStatus();
}

if (!window.__dvAjustesReady) {
  window.__dvAjustesReady = true;
  document.addEventListener('astro:page-load', initAjustes);
}
initAjustes();
