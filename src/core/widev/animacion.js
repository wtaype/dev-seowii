// src/lib/widev/animacion.js
// Funciones de animación e IntersectionObservers optimizadas para Astro ClientRouter

import { wiInit } from './wiinit.js';

// ── 1. wiVista v13.1: Observador de entrada general ──────────────────
export const wiVista = (sel, fn, { stagger = 0, anim = '', threshold = 0.1, once = true, root = null, onExit = null, delay = 0 } = {}) => {
  if (typeof document === 'undefined') return null;
  const els = typeof sel === 'string' ? [...document.querySelectorAll(sel)] : [].concat(sel).filter(Boolean);
  if (!els.length) return null;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const idx = els.indexOf(e.target);
      if (e.isIntersecting) {
        setTimeout(() => {
          if (anim) e.target.classList.add('wi_visible');
          fn?.(e.target, idx);
        }, delay + stagger * idx);
        if (once) obs.unobserve(e.target);
      } else {
        onExit?.(e.target, idx);
      }
    });
  }, { rootMargin: '20px', threshold, root });

  els.forEach((el) => {
    if (anim) el.classList.add(anim);
    obs.observe(el);
  });
  return obs;
};

// ── 2. herowi v10.1: Animación de entrada escalonada para cabeceras ──────────────────
export const herowi = (sel = '[data-herowi]', defSt = 45) => {
  if (typeof document === 'undefined') return;

  const nodes = typeof sel === 'string' ? [...document.querySelectorAll(sel)] : [].concat(sel).filter(Boolean);
  nodes.forEach((t) => {
    const els = (t.hasAttribute('data-herowi') && t.children.length ? [...t.children] : [t]).filter((e) => !e.dataset.hi);
    if (els.length) {
      const st = parseInt(t.dataset.herowi) || defSt;
      els.forEach((e, i) => {
        e.style.animationDelay = `${Math.min(i * st, 800)}ms`;
        e.classList.add('hwi');
        e.dataset.hi = '1';
      });
    }
  });
};

// ── 3. showi v16.1: Animación Cascada en Viewport para Grillas y Listados (Fail-Safe PRO) ──────
export const showi = (sel = '[data-showi]', defSt = 500) => {
  if (typeof document === 'undefined') return;

  const containers = typeof sel === 'string' ? [...document.querySelectorAll(sel)] : [].concat(sel).filter(Boolean);
  if (!containers.length) return;

  const triggerAnimation = (container) => {
    if (!container) return;
    const step = parseInt(container.dataset.showi || '') || defSt;
    container.style.setProperty('--swi-step', `${step}ms`);

    // Asignar retardo escalonado ordenado: 1° 0s, 2° 0.25s, y aumento de +0.50s por cada item
    let visibleIdx = 0;
    const children = [...container.children];
    children.forEach((child) => {
      if (child.style.display !== 'none') {
        const idx = visibleIdx++;
        child.style.setProperty('--swi-idx', String(idx));
        // Cadencia exacta: 1° = 0s, 2° = 0.25s (250ms), a partir de ahí +0.50s (500ms) por tarjeta
        const delay = idx === 0 ? 0 : Math.round(250 + (idx - 1) * 500);
        child.style.setProperty('--swi-delay', `${delay}ms`);
      }
    });

    container.classList.remove('is-showi');
    void container.offsetWidth; // Reflow limpio garantizado
    container.classList.add('is-showi');
  };

  containers.forEach((container) => {
    // Si ya está animado o listo en esta navegación, evitar dobles observadores
    if (container.classList.contains('is-showi')) return;

    // Marcado progresivo fail-safe: solo oculta tarjetas si JS está activo y ejecutando
    container.classList.add('swi-ready');

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            // Protección Viewport Hero: Si el usuario aún está en Hero (scrollY < 80)
            // y el contenedor está ubicado hacia el fondo, no disparar prematuramente
            const rect = e.boundingClientRect;
            if (window.scrollY < 80 && rect.top > window.innerHeight * 0.75) {
              return;
            }
            triggerAnimation(e.target);
            obs.unobserve(e.target);
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -80px 0px' // Margen de seguridad: requiere scroll real hacia la sección
      });

      obs.observe(container);

      // Listener de scroll de respaldo si se pausó la activación inicial en Hero
      const onScrollHeroCheck = () => {
        if (window.scrollY >= 80) {
          window.removeEventListener('scroll', onScrollHeroCheck);
          const rect = container.getBoundingClientRect();
          if (rect.top <= window.innerHeight - 80 && rect.bottom >= 0) {
            triggerAnimation(container);
            obs.unobserve(container);
          }
        }
      };
      window.addEventListener('scroll', onScrollHeroCheck, { passive: true });
    } else {
      triggerAnimation(container);
    }
  });
};

// Re-animación en cascada suave al filtrar elementos
showi.reanimar = (sel = '[data-showi]', defSt = 500) => {
  if (typeof document === 'undefined') return;
  const els = typeof sel === 'string' ? [...document.querySelectorAll(sel)] : [].concat(sel).filter(Boolean);
  els.forEach((el) => {
    const step = parseInt(el.dataset.showi || '') || defSt;
    el.style.setProperty('--swi-step', `${step}ms`);
    let idx = 0;
    [...el.children].forEach((child) => {
      if (child.style.display !== 'none') {
        const i = idx++;
        child.style.setProperty('--swi-idx', String(i));
        const delay = i === 0 ? 0 : Math.round(250 + (i - 1) * 500);
        child.style.setProperty('--swi-delay', `${delay}ms`);
      }
    });
    el.classList.remove('is-showi');
    void el.offsetWidth;
    el.classList.add('is-showi');
  });
};

// ── 4. wiFade v12.1: Transición de opacidad suave para inserciones ──────────────────
export const wiFade = async (sel, html, dur = 50) => {
  if (typeof document === 'undefined') return;
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if (!el) return;

  el.style.willChange = 'opacity';
  el.style.transition = `opacity ${dur}ms ease`;
  el.style.opacity = '0';
  
  await new Promise((r) => setTimeout(r, dur));
  el.innerHTML = html;
  el.style.opacity = '1';
  
  await new Promise((r) => setTimeout(r, dur));
  el.style.transition = '';
  el.style.willChange = '';
};

// Auto-inicialización via wiInit (elimina triple listener duplicado)
wiInit(() => {
  herowi();
  showi();
});