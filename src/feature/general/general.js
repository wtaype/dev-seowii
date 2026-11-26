// src/feature/general/general.js
// ⚡ Lógica cliente de Feature General (100% compatible con ClientRouter)

import { slugify } from '@core/rutas.js';

function getMsgs(root) {
  try {
    return JSON.parse(root?.dataset.i18nMsg || '{}');
  } catch {
    return {};
  }
}

async function copyText(text, btn, feedbackText) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if (!btn) return;
    const span = btn.querySelector('span');
    const prev = span?.textContent;
    if (span && feedbackText) {
      span.textContent = feedbackText;
      setTimeout(() => {
        span.textContent = prev || '';
      }, 1400);
    }
  } catch {}
}

function genToken(mode) {
  if (mode === 'uuid' && crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(mode === 'secret' ? 24 : 12);
  crypto.getRandomValues(bytes);
  if (mode === 'secret') {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 16 }, (_, i) => chars[bytes[i % bytes.length] % chars.length]).join('');
}

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function luminance({ r, g, b }) {
  const toLin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function contrastRatio(rgb1, rgb2) {
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function initGeneral() {
  const root = document.getElementById('dvGeneralView');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';

  const msg = getMsgs(root);

  // 1. Text & Case Studio
  const textArea = document.getElementById('dvGen_textArea');
  const textStats = document.getElementById('dvGen_textStats');
  const syncTextStats = () => {
    const v = textArea?.value || '';
    const words = v.trim() ? v.trim().split(/\s+/).length : 0;
    if (textStats) textStats.textContent = `${v.length} ${msg.chars || 'chars'} · ${words} ${msg.words || 'words'}`;
  };
  syncTextStats();
  textArea?.addEventListener('input', syncTextStats);

  const textOps = {
    upper: (s) => s.toUpperCase(),
    lower: (s) => s.toLowerCase(),
    cap: (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    camel: (s) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())
        .replace(/^[A-Z]/, (c) => c.toLowerCase()),
    slug: (s) => slugify(s),
    clean: (s) => s.replace(/\s+/g, ' ').trim()
  };

  root.querySelectorAll('[data-text-op]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!textArea) return;
      const op = btn.getAttribute('data-text-op');
      if (op && textOps[op]) {
        textArea.value = textOps[op](textArea.value);
        syncTextStats();
      }
    });
  });

  document.getElementById('dvGen_copyText')?.addEventListener('click', (e) => {
    copyText(textArea?.value, e.currentTarget, msg.textCopied);
  });

  // 2. JSON Formatter & Validator
  const jsonArea = document.getElementById('dvGen_jsonArea');
  const jsonBadge = document.getElementById('dvGen_jsonBadge');
  const validateJson = () => {
    try {
      const parsed = JSON.parse(jsonArea?.value || '');
      if (jsonBadge) {
        jsonBadge.textContent = msg.jsonValid || 'VALID';
        jsonBadge.dataset.state = 'ok';
      }
      return parsed;
    } catch {
      if (jsonBadge) {
        jsonBadge.textContent = msg.jsonInvalid || 'INVALID';
        jsonBadge.dataset.state = 'err';
      }
      return null;
    }
  };
  validateJson();
  jsonArea?.addEventListener('input', validateJson);

  document.getElementById('dvGen_jsonFormat')?.addEventListener('click', () => {
    const parsed = validateJson();
    if (parsed !== null && jsonArea) jsonArea.value = JSON.stringify(parsed, null, 2);
  });

  document.getElementById('dvGen_jsonMinify')?.addEventListener('click', () => {
    const parsed = validateJson();
    if (parsed !== null && jsonArea) jsonArea.value = JSON.stringify(parsed);
  });

  document.getElementById('dvGen_copyJson')?.addEventListener('click', (e) => {
    copyText(jsonArea?.value, e.currentTarget, msg.jsonCopied);
  });

  // 3. HTTP & SEO Status filter
  const httpSearch = document.getElementById('dvGen_httpSearch');
  httpSearch?.addEventListener('input', () => {
    const q = httpSearch.value.trim().toLowerCase();
    root.querySelectorAll('[data-http-item]').forEach((row) => {
      const txt = row.getAttribute('data-http-item') || '';
      row.classList.toggle('dv-gen-hidden', Boolean(q) && !txt.includes(q));
    });
  });

  // 4. Tokens & UUID .env
  const tokenOut = document.getElementById('dvGen_tokenOut');
  const setToken = (mode) => {
    if (tokenOut) tokenOut.textContent = genToken(mode);
  };
  setToken('uuid');

  root.querySelectorAll('[data-token-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-token-mode]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      setToken(btn.getAttribute('data-token-mode') || 'uuid');
    });
  });

  document.getElementById('dvGen_copyToken')?.addEventListener('click', (e) => {
    copyText(tokenOut?.textContent, e.currentTarget, msg.tokenCopied);
  });

  // 5. Color & Contraste WCAG
  const picker = document.getElementById('dvGen_colorPicker');
  const hexInput = document.getElementById('dvGen_colorHex');
  const rgbOut = document.getElementById('dvGen_rgbOut');
  const darkOut = document.getElementById('dvGen_contrastDark');
  const lightOut = document.getElementById('dvGen_contrastLight');
  const colorBadge = document.getElementById('dvGen_colorBadge');

  const syncColor = (val) => {
    const rgb = hexToRgb(val);
    if (!rgb) return;
    if (picker && picker.value !== val) picker.value = val;
    if (hexInput && hexInput.value !== val) hexInput.value = val;
    if (rgbOut) rgbOut.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

    const cDark = contrastRatio(rgb, { r: 10, g: 24, b: 39 });
    const cLight = contrastRatio(rgb, { r: 255, g: 255, b: 255 });
    if (darkOut) darkOut.textContent = `${cDark.toFixed(2)}:1`;
    if (lightOut) lightOut.textContent = `${cLight.toFixed(2)}:1`;
    if (colorBadge) {
      const ok = Math.max(cDark, cLight) >= 4.5;
      colorBadge.textContent = ok ? msg.aaOk : msg.aaLow;
      colorBadge.dataset.state = ok ? 'ok' : 'err';
    }
  };
  syncColor(hexInput?.value || '#06b6d4');
  picker?.addEventListener('input', () => syncColor(picker.value));
  hexInput?.addEventListener('input', () => syncColor(hexInput.value));

  // 6. Breakpoints CSS
  const bpBadge = document.getElementById('dvGen_bpBadge');
  root.querySelectorAll('[data-bp-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-bp-copy');
      if (!val) return;
      try {
        await navigator.clipboard.writeText(val);
        if (bpBadge && msg.bpCopied) {
          const prev = bpBadge.textContent;
          bpBadge.textContent = msg.bpCopied;
          setTimeout(() => {
            bpBadge.textContent = prev;
          }, 1200);
        }
      } catch {}
    });
  });
}

if (!window.__dvGeneralReady) {
  window.__dvGeneralReady = true;
  document.addEventListener('astro:page-load', initGeneral);
}
initGeneral();
