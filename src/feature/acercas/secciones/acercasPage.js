// src/feature/acercas/secciones/acercasClient.js
// Controlador cliente Wizard 5 pasos para Libro de Reclamaciones Virtual (INDECOPI)

import { db } from '@core/servicios/firebase.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
const getUsuarioActivo = () => null;

function generarCodigo(prefijo) {
  const anio = new Date().getFullYear();
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${prefijo}-${anio}-${rnd}`;
}

function escaparTexto(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function initLibroReclamaciones() {
  const form = document.getElementById('formLibroReclamaciones');
  const codEl = document.getElementById('recCodigoFinal');
  const btnWa = document.getElementById('recBtnWa');
  const btnSubmit = document.getElementById('recBtnSubmit');
  const btnPrint = document.getElementById('btnImprimirReclamo');
  const btnReset = document.getElementById('btnNuevoReclamo');
  const menorCheck = document.getElementById('recMenorCheck');
  const tutorGroup = document.getElementById('recTutorGroup');
  const tutorInput = document.getElementById('recTutor');
  const resumenGrid = document.getElementById('recResumenGrid');

  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  const panels = document.querySelectorAll('.reclamos-step-panel');
  const indicators = document.querySelectorAll('.reclamos-step-item');

  function irAPaso(numPaso) {
    panels.forEach((p) => {
      p.classList.toggle('is-active', Number(p.dataset.step) === numPaso);
    });
    indicators.forEach((ind) => {
      const n = Number(ind.dataset.stepIndicator);
      ind.classList.toggle('is-active', n === numPaso);
      ind.classList.toggle('is-done', n < numPaso);
      const numBox = ind.querySelector('.reclamos-step-num');
      if (numBox) {
        numBox.innerHTML = n < numPaso ? '<i class="fa-solid fa-check"></i>' : `0${n}`;
      }
    });
    if (numPaso === 4) construirResumen();
  }

  function validarPaso(numPaso) {
    const panel = document.querySelector(`.reclamos-step-panel[data-step="${numPaso}"]`);
    if (!panel) return true;
    const campos = panel.querySelectorAll('input, select, textarea');
    for (const el of campos) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  function construirResumen() {
    if (!resumenGrid) return;
    const fd = new FormData(form);
    const monto = String(fd.get('monto') || '').trim();
    const montoStr = monto ? `${fd.get('moneda')} ${monto}` : '—';

    const bloques = [
      {
        titulo: form.dataset.resConsumidor || 'Consumidor',
        lineas: [
          `${fd.get('nombre') || ''}`,
          `${fd.get('tipoDoc') || ''}: ${fd.get('documento') || ''}`,
          `${fd.get('telefono') || ''} · ${fd.get('correo') || ''}`,
          `${fd.get('direccion') || ''}`,
        ],
      },
      {
        titulo: form.dataset.resBien || 'Servicio',
        lineas: [
          `${fd.get('bienTipo') || ''} (${montoStr})`,
          `${fd.get('servicio') || ''}`,
        ],
      },
      {
        titulo: form.dataset.resReclamo || 'Detalle',
        lineas: [
          `${fd.get('tipoReclamo') || 'Reclamo'}`,
          `${fd.get('detalle') || ''}`,
          `${fd.get('pedido') || ''}`,
        ],
      },
    ];

    resumenGrid.innerHTML = bloques
      .map(
        (b) => `
        <div class="reclamos-resumen-box">
          <h3>${escaparTexto(b.titulo)}</h3>
          ${b.lineas.map((l) => `<p>${escaparTexto(String(l))}</p>`).join('')}
        </div>`
      )
      .join('');
  }

  form.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = Number(btn.dataset.next);
      if (validarPaso(target - 1)) {
        irAPaso(target);
      }
    });
  });

  form.querySelectorAll('[data-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      irAPaso(Number(btn.dataset.prev));
    });
  });

  if (menorCheck && tutorGroup) {
    menorCheck.addEventListener('change', () => {
      const activo = menorCheck.checked;
      tutorGroup.classList.toggle('reclamos-hidden', !activo);
      if (tutorInput) tutorInput.required = activo;
    });
  }

  if (btnPrint) {
    btnPrint.addEventListener('click', () => window.print());
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      form.reset();
      if (tutorGroup) tutorGroup.classList.add('reclamos-hidden');
      if (tutorInput) tutorInput.required = false;
      irAPaso(1);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarPaso(4)) return;
    if (btnSubmit) btnSubmit.disabled = true;

    const fd = new FormData(form);
    const codigo = generarCodigo('HR');
    const usuario = getUsuarioActivo();
    const userId = usuario?.uid || usuario?.userId || '';

    const payload = {
      codigo,
      userId,
      nombre: String(fd.get('nombre') || '').trim(),
      tipoDoc: String(fd.get('tipoDoc') || 'DNI').trim(),
      documento: String(fd.get('documento') || '').trim(),
      telefono: String(fd.get('telefono') || '').trim(),
      correo: String(fd.get('correo') || '').trim(),
      direccion: String(fd.get('direccion') || '').trim(),
      esMenor: Boolean(fd.get('esMenor')),
      tutor: String(fd.get('tutor') || '').trim(),
      bienTipo: String(fd.get('bienTipo') || 'Servicio').trim(),
      moneda: String(fd.get('moneda') || 'PEN').trim(),
      monto: Number(fd.get('monto') || 0),
      servicio: String(fd.get('servicio') || '').trim(),
      tipo: String(fd.get('tipoReclamo') || 'Reclamo').trim(),
      detalle: String(fd.get('detalle') || '').trim(),
      pedido: String(fd.get('pedido') || '').trim(),
      estado: 'pendiente',
      creado: serverTimestamp(),
      actualizado: serverTimestamp(),
    };

    try {
      await setDoc(
        doc(db, 'soporte', 'reclamaciones'),
        {
          items: { [codigo]: { ...payload, creado: new Date().toISOString() } },
          actualizado: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error al registrar hoja de reclamación en Firestore:', err);
    }

    if (codEl) codEl.textContent = codigo;
    const cel = String(form.dataset.cel || '').replace(/\D/g, '');
    const waTpl = String(form.dataset.watpl || '').replace('{codigo}', codigo);
    if (btnWa && cel) {
      btnWa.href = `https://wa.me/${cel}?text=${encodeURIComponent(waTpl)}`;
      btnWa.style.display = 'inline-flex';
    } else if (btnWa) {
      btnWa.style.display = 'none';
    }

    if (btnSubmit) btnSubmit.disabled = false;
    irAPaso(5);
  });
}

export function initContactoForm() {
  const form = document.getElementById('formContactoDirecto');
  const box = document.getElementById('contactoSuccessBox');
  const btnSubmit = document.getElementById('cntBtnSubmit');
  const btnReset = document.getElementById('btnNuevoContacto');

  if (!form || !box || form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      form.reset();
      box.classList.remove('is-visible');
      form.style.display = 'grid';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btnSubmit) btnSubmit.disabled = true;

    const fd = new FormData(form);
    const usuario = getUsuarioActivo();
    const userId = usuario?.uid || usuario?.userId || '';

    const itemId = `cnt_${Date.now()}`;
    try {
      await setDoc(
        doc(db, 'soporte', 'contacto'),
        {
          items: {
            [itemId]: {
              id: itemId,
              userId,
              nombre: String(fd.get('nombre') || '').trim(),
              correo: String(fd.get('correo') || '').trim(),
              asunto: String(fd.get('asunto') || '').trim(),
              mensaje: String(fd.get('mensaje') || '').trim(),
              estado: 'nuevo',
              creado: new Date().toISOString(),
            },
          },
          actualizado: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error al registrar consulta de contacto:', err);
    }

    form.style.display = 'none';
    box.classList.add('is-visible');
    if (btnSubmit) btnSubmit.disabled = false;
  });
}

export function initFeedbackForm() {
  const form = document.getElementById('formFeedback');
  const box = document.getElementById('feedbackSuccessBox');
  const btnSubmit = document.getElementById('fbBtnSubmit');
  const btnReset = document.getElementById('btnNuevoFeedback');

  if (!form || !box || form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      form.reset();
      box.classList.remove('is-visible');
      form.style.display = 'grid';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btnSubmit) btnSubmit.disabled = true;

    const fd = new FormData(form);
    const usuario = getUsuarioActivo();
    const userId = usuario?.uid || usuario?.userId || '';

    const itemId = `rev_${Date.now()}`;
    try {
      await setDoc(
        doc(db, 'soporte', 'reviews'),
        {
          items: {
            [itemId]: {
              id: itemId,
              userId,
              rating: Number(fd.get('rating') || 5),
              categoria: String(fd.get('categoria') || '').trim(),
              nombre: String(fd.get('nombre') || '').trim(),
              comentario: String(fd.get('comentario') || '').trim(),
              creado: new Date().toISOString(),
            },
          },
          actualizado: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Error al registrar feedback:', err);
    }

    form.style.display = 'none';
    box.classList.add('is-visible');
    if (btnSubmit) btnSubmit.disabled = false;
  });
}

function initAcercasAll() {
  initLibroReclamaciones();
  initContactoForm();
  initFeedbackForm();
}

document.addEventListener('astro:page-load', initAcercasAll);
initAcercasAll();
