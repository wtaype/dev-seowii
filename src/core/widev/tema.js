// src/core/widev/tema.js
// 🎨 Gestor Automático de Tema (Luz / Noche) — Clave única 'witema'

export const CLAVE_TEMA = 'witema';

export const temaSistema = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'noche'
    : 'luz';

export function obtenerTema(defecto = 'luz') {
  if (typeof localStorage === 'undefined') return defecto;
  return localStorage.getItem(CLAVE_TEMA) || temaSistema() || defecto;
}

export function aplicarTema(tema, guardar = true) {
  const t = tema === 'noche' ? 'noche' : 'luz';
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = t;
  }
  if (guardar) {
    try { localStorage.setItem(CLAVE_TEMA, t); } catch {}
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('witema-changed', { detail: t }));
  }
  return t;
}

export function alternarTema() {
  return aplicarTema(obtenerTema() === 'noche' ? 'luz' : 'noche', true);
}

export function escucharTemaSistema(cb) {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    if (!localStorage.getItem(CLAVE_TEMA)) {
      const t = aplicarTema(temaSistema(), false);
      cb?.(t);
    }
  });
}

export const witema = { get: obtenerTema, set: aplicarTema, toggle: alternarTema };
export default witema;
