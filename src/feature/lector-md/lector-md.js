// src/feature/lector-md/lector-md.js
// ⚡ Orquestador de Lector MD (wiMd en vivo, savels/getls y exportación)

import { wiMd } from '@widev/wimd.js';
import { savels, getls } from '@widev/storage.js';
import { SAMPLE_MD, calcMdStats } from './lib/mdUtils.js';

const LS_KEY = 'dv_lector_md';

function getMsgs(root) {
  try {
    return JSON.parse(root?.dataset.i18nMsg || '{}');
  } catch {
    return {};
  }
}

async function copyBtn(text, btn, feedback) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const span = btn?.querySelector('span');
    const prev = span?.textContent;
    if (span && feedback) {
      span.textContent = feedback;
      setTimeout(() => { span.textContent = prev || ''; }, 1300);
    }
  } catch {}
}

function initLectorMd() {
  const root = document.getElementById('dvMdView');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';

  const msg = getMsgs(root);
  const editor = document.getElementById('dvMd_editor');
  const preview = document.getElementById('dvMd_preview');
  const statsEl = document.getElementById('dvMd_stats');
  const fileInput = document.getElementById('dvMd_fileInput');

  const saved = getls(LS_KEY);
  if (typeof saved === 'string' && saved.trim() && editor) {
    editor.value = saved;
  }

  let htmlCache = '';

  const render = () => {
    const raw = editor?.value || '';
    savels(LS_KEY, raw, 24);
    htmlCache = wiMd(raw, msg.idioma || 'es');
    if (preview) preview.innerHTML = htmlCache;

    const { words, lines, mins } = calcMdStats(raw);
    if (statsEl) {
      statsEl.textContent = `${words} ${msg.words} · ${lines} ${msg.lines} · ~${mins} ${msg.minRead}`;
    }
  };

  editor?.addEventListener('input', render);

  document.getElementById('dvMd_btnUpload')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file || !editor) return;
    editor.value = await file.text();
    fileInput.value = '';
    render();
  });

  document.getElementById('dvMd_btnSample')?.addEventListener('click', () => {
    if (!editor) return;
    editor.value = SAMPLE_MD;
    render();
  });

  document.getElementById('dvMd_btnClear')?.addEventListener('click', () => {
    if (!editor) return;
    editor.value = '';
    render();
  });

  document.getElementById('dvMd_btnCopyMd')?.addEventListener('click', (e) => {
    copyBtn(editor?.value, e.currentTarget, msg.copied);
  });

  document.getElementById('dvMd_btnCopyHtml')?.addEventListener('click', (e) => {
    copyBtn(htmlCache, e.currentTarget, msg.copied);
  });

  document.getElementById('dvMd_btnDlMd')?.addEventListener('click', () => {
    const blob = new Blob([editor?.value || ''], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  render();
}

if (!window.__dvMdReady) {
  window.__dvMdReady = true;
  document.addEventListener('astro:page-load', initLectorMd);
}
initLectorMd();
