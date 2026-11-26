// src/core/layouts/principal.js
// ⚡ Orquestador global de dev.seowii.com (ClientRouter + Tema + Sidebar + Modal Acerca)

import { configurar } from '@semillas';
import { esRutaActiva } from '@core/rutas.js';

const { tema: KEY_TEMA, sidebar: KEY_SB } = configurar.storageKeys;
const TEMA_DEFECTO = configurar.temaDefecto || 'luz';

function syncTemaUI() {
  const tema = document.documentElement.dataset.theme || TEMA_DEFECTO;
  const esNoche = tema === 'noche';

  document.querySelectorAll('[data-tema-lbl]').forEach((el) => {
    el.textContent = esNoche ? 'Tema Luz' : 'Tema Noche';
  });

  document.querySelectorAll('[data-tema-ico]').forEach((ico) => {
    ico.className = esNoche ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  });
}

function syncRutaActiva() {
  const path = window.location.pathname;
  document.querySelectorAll('[data-nav-link]').forEach((el) => {
    const href = el.getAttribute('data-href') || el.getAttribute('href') || '/';
    el.classList.toggle('active', esRutaActiva(href, path));
  });
}

function toggleTema() {
  const actual = document.documentElement.dataset.theme || TEMA_DEFECTO;
  const siguiente = actual === 'noche' ? 'luz' : 'noche';
  document.documentElement.dataset.theme = siguiente;
  try { localStorage.setItem(KEY_TEMA, siguiente); } catch {}
  syncTemaUI();
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
    syncTemaUI();
    syncRutaActiva();
  });
}
