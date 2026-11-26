// src/core/layouts/principal.js
// ⚡ Orquestador global de dev.seowii.com (ClientRouter + Tema + Idioma + Sidebar + Modal)

import { navigate } from 'astro:transitions/client';
import { configurar } from '@semillas';
import { esRutaActiva } from '@core/rutas.js';
import { getIdioma, getCoreLang, buildRuta, resolverRutaIdioma, getNextIdioma } from '@idioma';

const { tema: KEY_TEMA, sidebar: KEY_SB } = configurar.storageKeys;
const TEMA_DEFECTO = configurar.temaDefecto || 'luz';

function syncTemaUI() {
  const tema = document.documentElement.dataset.theme || TEMA_DEFECTO;
  const lang = getIdioma(window.location.pathname);
  const t = getCoreLang(lang);
  const key = tema === 'noche' ? 'temaNoche' : 'temaLuz';

  document.querySelectorAll('[data-tema-lbl]').forEach((el) => {
    el.textContent = t.util?.[key] || '';
  });

  document.querySelectorAll('[data-tema-ico]').forEach((ico) => {
    ico.className = tema === 'noche' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  });
}

function syncIdiomaUI() {
  const lang = getIdioma(window.location.pathname);
  const t = getCoreLang(lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-nav-link][data-base-href]').forEach((el) => {
    const base = el.getAttribute('data-base-href') || '/';
    el.setAttribute('href', buildRuta(base, lang));
  });

  document.querySelectorAll('[data-i18n-nav]').forEach((el) => {
    const id = el.getAttribute('data-i18n-nav');
    if (id && t.nav?.[id]?.label) el.textContent = t.nav[id].label;
  });

  document.querySelectorAll('[data-i18n-sub]').forEach((el) => {
    const id = el.getAttribute('data-i18n-sub');
    if (id && t.nav?.[id]?.sub) el.textContent = t.nav[id].sub;
  });

  document.querySelectorAll('[data-i18n-util]').forEach((el) => {
    if (el.hasAttribute('data-tema-lbl')) return;
    const key = el.getAttribute('data-i18n-util');
    if (key && t.util?.[key]) el.textContent = t.util[key];
  });

  document.querySelectorAll('[data-i18n-lang-short]').forEach((el) => {
    el.textContent = lang.toUpperCase();
  });
}

function syncRutaActiva() {
  const path = window.location.pathname;
  document.querySelectorAll('[data-nav-link]').forEach((el) => {
    const base = el.getAttribute('data-base-href') || el.getAttribute('href') || '/';
    el.classList.toggle('active', esRutaActiva(base, path));
  });
}

function toggleTema() {
  const actual = document.documentElement.dataset.theme || TEMA_DEFECTO;
  const siguiente = actual === 'noche' ? 'luz' : 'noche';
  document.documentElement.dataset.theme = siguiente;
  try { localStorage.setItem(KEY_TEMA, siguiente); } catch {}
  syncTemaUI();
}

function toggleIdioma() {
  const actual = getIdioma(window.location.pathname);
  const siguiente = getNextIdioma(actual);
  const destino = resolverRutaIdioma(window.location.pathname, siguiente);
  navigate(destino);
}

function toggleSidebar() {
  const colapsado = document.documentElement.classList.toggle('dv-collapsed');
  try { localStorage.setItem(KEY_SB, colapsado ? '1' : '0'); } catch {}
}

function setAcerca(abierto) {
  const modal = document.getElementById('dvModalAcerca');
  if (!modal) return;
  modal.hidden = !abierto;
  modal.setAttribute('aria-hidden', String(!abierto));
}

if (!window.__dvPrincipalReady) {
  window.__dvPrincipalReady = true;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      const accion = btn.getAttribute('data-action');
      if (accion === 'toggle-tema') return toggleTema();
      if (accion === 'toggle-idioma') return toggleIdioma();
      if (accion === 'toggle-sidebar') return toggleSidebar();
      if (accion === 'open-acerca') return setAcerca(true);
      if (accion === 'close-acerca') return setAcerca(false);
    }

    const modal = document.getElementById('dvModalAcerca');
    if (modal && !modal.hidden && e.target === modal) {
      setAcerca(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setAcerca(false);
  });

  document.addEventListener('astro:after-swap', () => {
    try {
      const t = localStorage.getItem(KEY_TEMA) || TEMA_DEFECTO;
      document.documentElement.dataset.theme = t;
      document.documentElement.classList.toggle('dv-collapsed', localStorage.getItem(KEY_SB) === '1');
    } catch {}
  });

  document.addEventListener('astro:page-load', () => {
    syncIdiomaUI();
    syncTemaUI();
    syncRutaActiva();
  });
}
