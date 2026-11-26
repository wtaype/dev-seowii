// src/core/widev/tema.js
// 🎨 Gestor Minimalista de Tema (Luz / Noche) — Seowii Studio
// Fuente única de verdad · Clave limpia en minúsculas: 'witema'

const CLAVE = 'witema';

export function obtenerTema() {
  if (typeof localStorage === 'undefined') return 'luz';
  return localStorage.getItem(CLAVE) || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'noche' : 'luz');
}

export function aplicarTema(tema) {
  const t = tema === 'noche' ? 'noche' : 'luz';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.dataset.theme = t;
    if (t === 'noche') {
      document.documentElement.classList.add('noche');
    } else {
      document.documentElement.classList.remove('noche');
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === 'noche' ? '#080d1a' : '#fcfbf7';

    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.className = t === 'noche' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
  }
  try {
    localStorage.setItem(CLAVE, t);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('witema-changed', { detail: t }));
  }
  return t;
}

export function alternarTema() {
  return aplicarTema(obtenerTema() === 'noche' ? 'luz' : 'noche');
}

export const obtenerTemaPreferido = obtenerTema;
export const setTema = aplicarTema;
export const witema = { get: obtenerTema, set: aplicarTema, toggle: alternarTema };
export const wiTema = witema;
export const witemas = witema;
export default witema;
