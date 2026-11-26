// src/feature/lector-json/lector-json.js
// ⚡ Orquestador de Lector JSON (Validación, Árbol interactivo, Copia de ruta y savels)

import { savels, getls } from '@widev/storage.js';
import { SAMPLE_JSON, parseJsonSeguro, contarStats, renderJsonTree } from './lib/jsonTree.js';

const LS_KEY = 'dv_lector_json';

function getMsgs(root) {
  try {
    return JSON.parse(root?.dataset.i18nMsg || '{}');
  } catch {
    return {};
  }
}

function initLectorJson() {
  const root = document.getElementById('dvJsonView');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';

  const msg = getMsgs(root);
  const editor = document.getElementById('dvJson_editor');
  const badge = document.getElementById('dvJson_badge');
  const errorBox = document.getElementById('dvJson_errorBox');
  const treeBox = document.getElementById('dvJson_tree');
  const statsEl = document.getElementById('dvJson_stats');
  const search = document.getElementById('dvJson_search');
  const fileInput = document.getElementById('dvJson_fileInput');

  const saved = getls(LS_KEY);
  if (typeof saved === 'string' && saved.trim() && editor) {
    editor.value = saved;
  }

  let parsedCache = null;

  const renderTree = () => {
    if (!parsedCache) {
      if (treeBox) treeBox.innerHTML = `<p class="dv-jt-empty">${msg.emptyTree || ''}</p>`;
      if (statsEl) statsEl.textContent = '';
      return;
    }
    if (treeBox) treeBox.innerHTML = renderJsonTree(parsedCache, search?.value || '');
    const { keys, nodes } = contarStats(parsedCache);
    const kb = (new Blob([editor?.value || '']).size / 1024).toFixed(2);
    if (statsEl) statsEl.textContent = `${keys} ${msg.keys} · ${nodes} ${msg.nodes} · ${kb} KB`;
  };

  const sync = () => {
    const raw = editor?.value || '';
    savels(LS_KEY, raw, 24);
    const res = parseJsonSeguro(raw);
    parsedCache = res.ok ? res.data : null;

    if (badge) {
      badge.textContent = res.ok ? msg.valid : msg.invalid;
      badge.dataset.state = res.ok ? 'ok' : 'err';
    }

    if (errorBox) {
      errorBox.classList.toggle('dv-json-hidden', res.ok);
      errorBox.textContent = res.ok ? '' : res.error;
    }

    renderTree();
  };

  editor?.addEventListener('input', sync);
  search?.addEventListener('input', renderTree);

  document.getElementById('dvJson_btnUpload')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file || !editor) return;
    editor.value = await file.text();
    fileInput.value = '';
    sync();
  });

  document.getElementById('dvJson_btnFormat')?.addEventListener('click', () => {
    if (!parsedCache || !editor) return;
    editor.value = JSON.stringify(parsedCache, null, 2);
    sync();
  });

  document.getElementById('dvJson_btnMinify')?.addEventListener('click', () => {
    if (!parsedCache || !editor) return;
    editor.value = JSON.stringify(parsedCache);
    sync();
  });

  document.getElementById('dvJson_btnSample')?.addEventListener('click', () => {
    if (!editor) return;
    editor.value = SAMPLE_JSON;
    sync();
  });

  document.getElementById('dvJson_btnClear')?.addEventListener('click', () => {
    if (!editor) return;
    editor.value = '';
    sync();
  });

  document.getElementById('dvJson_btnCopy')?.addEventListener('click', async (e) => {
    if (!editor?.value) return;
    try {
      await navigator.clipboard.writeText(editor.value);
      const span = e.currentTarget.querySelector('span');
      const prev = span?.textContent;
      if (span && msg.copied) {
        span.textContent = msg.copied;
        setTimeout(() => { span.textContent = prev || ''; }, 1300);
      }
    } catch {}
  });

  const btnExpand = document.getElementById('dvJson_btnExpand');
  const btnCollapse = document.getElementById('dvJson_btnCollapse');

  btnExpand?.addEventListener('click', () => {
    treeBox?.querySelectorAll('details').forEach((d) => { d.open = true; });
    btnExpand.classList.add('active');
    btnCollapse?.classList.remove('active');
  });

  btnCollapse?.addEventListener('click', () => {
    treeBox?.querySelectorAll('details').forEach((d) => { d.open = false; });
    btnCollapse.classList.add('active');
    btnExpand?.classList.remove('active');
  });

  treeBox?.addEventListener('click', async (e) => {
    const keyBtn = e.target.closest('[data-json-path]');
    if (!keyBtn) return;
    const p = keyBtn.getAttribute('data-json-path');
    if (!p) return;
    try {
      await navigator.clipboard.writeText(p);
      if (statsEl) {
        const prev = statsEl.textContent;
        statsEl.textContent = `${msg.pathCopied || ''} ${p}`;
        setTimeout(() => { statsEl.textContent = prev; }, 1600);
      }
    } catch {}
  });

  sync();
}

if (!window.__dvJsonReady) {
  window.__dvJsonReady = true;
  document.addEventListener('astro:page-load', initLectorJson);
}
initLectorJson();
