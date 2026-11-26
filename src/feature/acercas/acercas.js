// src/feature/acercas/acercas.js
// Orquestador compacto para Contacto y Feedback -> correo-seowii (Resend) + respaldo LocalStorage
import { savels, getls } from '@widev/storage.js';

const CORREO_API = 'https://correo-seowii.seowii100.workers.dev';
const FORMS = [
  ['formContactoDirecto', 'contactoSuccessBox', 'cntBtnSubmit', 'btnNuevoContacto', 'dv_contacto_msgs', 'contacto'],
  ['formFeedback', 'feedbackSuccessBox', 'fbBtnSubmit', 'btnNuevoFeedback', 'dv_feedback_msgs', 'feedback']
];

export function initAcercas() {
  for (const [fId, bId, sId, rId, lsKey, tipo] of FORMS) {
    const form = document.getElementById(fId);
    const box = document.getElementById(bId);
    const btn = document.getElementById(sId);
    if (!form || !box || form.dataset.bound === '1') continue;
    form.dataset.bound = '1';

    document.getElementById(rId)?.addEventListener('click', () => {
      form.reset();
      box.classList.remove('is-visible');
      form.style.display = 'grid';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (btn) btn.disabled = true;

      const entry = { ...Object.fromEntries(new FormData(form).entries()), fecha: new Date().toISOString() };
      const prev = getls(lsKey);
      savels(lsKey, [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 20));

      await fetch(CORREO_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, ...entry, origen: window.location.host })
      }).catch((err) => console.warn('[correo-seowii]', err));

      form.style.display = 'none';
      box.classList.add('is-visible');
      if (btn) btn.disabled = false;
    });
  }
}

initAcercas();
document.addEventListener('astro:page-load', initAcercas);
