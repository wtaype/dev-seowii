// src/feature/acercas/acercas.js
// Orquestador cliente ligero para Contacto y Feedback (100% local, sin dependencias externas)
import { savels, getls } from '@widev/storage.js';

function bindForm(formId, boxId, btnId, resetId, storageKey) {
  const form = document.getElementById(formId);
  const box = document.getElementById(boxId);
  const btnSubmit = document.getElementById(btnId);
  const btnReset = document.getElementById(resetId);

  if (!form || !box || form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  btnReset?.addEventListener('click', () => {
    form.reset();
    box.classList.remove('is-visible');
    form.style.display = 'grid';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (btnSubmit) btnSubmit.disabled = true;

    const fd = new FormData(form);
    const entry = Object.fromEntries(fd.entries());
    entry.fecha = new Date().toISOString();

    const prev = getls(storageKey);
    const list = Array.isArray(prev) ? prev : [];
    list.unshift(entry);
    savels(storageKey, list.slice(0, 20));

    form.style.display = 'none';
    box.classList.add('is-visible');
    if (btnSubmit) btnSubmit.disabled = false;
  });
}

export function initAcercas() {
  bindForm('formContactoDirecto', 'contactoSuccessBox', 'cntBtnSubmit', 'btnNuevoContacto', 'dv_contacto_msgs');
  bindForm('formFeedback', 'feedbackSuccessBox', 'fbBtnSubmit', 'btnNuevoFeedback', 'dv_feedback_msgs');
}

initAcercas();
document.addEventListener('astro:page-load', initAcercas);
