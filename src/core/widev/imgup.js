// src/core/widev/imgup.js
// 🚀 Servicio Inteligente de Captura de Portapapeles (Ctrl + V) -> WebP -> Cloudflare R2 + Auto-Registro en Galería
// 100% Cero Fricción · Reutilizable en todo Seowii Studio

import { timewii } from './fecha.js';
import { Notificacion } from './mensajes.js';
import { wiSpin } from './spin.js';

/**
 * Procesa y sube una imagen de portapapeles o archivo a Cloudflare R2 y la registra en la Galería
 */
export async function procesarPegadoImagen(fileOrBlob, opciones = {}) {
  const prefijo = opciones.prefijo || 'seowii-proyecto';
  const timestamp = timewii();
  const fileName = `${prefijo}-${timestamp}.webp`;
  const alt = opciones.alt || prefijo;
  const categoria = opciones.categoria || 'proyectos';

  const file = fileOrBlob instanceof File 
    ? fileOrBlob 
    : new File([fileOrBlob], fileName, { type: fileOrBlob.type || 'image/png' });

  const { procesarSubidaImagen } = await import('@feature/personal/modulos/galeria/dataGaleria.js');
  const res = await procesarSubidaImagen(file, categoria, prefijo, {
    fileName,
    alt,
    autoWebP: true,
    maxAncho: 1920,
    calidad: 0.85
  });

  return {
    ok: true,
    url: res.url,
    fileName,
    alt: res.alt
  };
}

/**
 * Conecta el portapapeles (Ctrl + V) y el clic en la vista previa de imagen para subida instantánea
 */
export function activarPegadoR2(config = {}) {
  if (typeof document === 'undefined') return;

  const contenedor = typeof config.contenedor === 'string' ? document.querySelector(config.contenedor) : config.contenedor;
  const previewWrap = typeof config.previewWrap === 'string' ? document.querySelector(config.previewWrap) : config.previewWrap;
  const inputRuta = typeof config.inputRuta === 'string' ? document.querySelector(config.inputRuta) : config.inputRuta;
  const previewImg = typeof config.previewImg === 'string' ? document.querySelector(config.previewImg) : config.previewImg;

  if (!contenedor || !inputRuta) return;

  const prefijo = config.prefijo || 'seowii-proyecto';
  const categoria = config.categoria || 'proyectos';
  const obtenerAlt = typeof config.obtenerAlt === 'function' ? config.obtenerAlt : () => '';

  const procesarArchivo = async (archivo) => {
    if (!archivo || !archivo.type.startsWith('image/')) {
      Notificacion?.aviso?.('El contenido no es una imagen válida.');
      return;
    }

    const spinTarget = previewWrap || previewImg;
    const spin = spinTarget ? wiSpin(spinTarget, 'Subiendo WebP...') : null;

    try {
      const altCalculado = obtenerAlt() || prefijo;
      const res = await procesarPegadoImagen(archivo, { prefijo, alt: altCalculado, categoria });
      if (res && res.url) {
        inputRuta.value = res.url;
        inputRuta.dispatchEvent(new Event('input', { bubbles: true }));
        if (previewImg) previewImg.src = res.url;
        Notificacion?.exito?.('¡Imagen WebP guardada en Cloudflare R2 y Galería!');
      }
    } catch (err) {
      console.error('[imgup] Error al subir captura:', err);
      Notificacion?.error?.(`Error al subir a Cloudflare R2: ${err.message || 'Fallo de red'}`);
    } finally {
      if (spin && typeof spin.restaurar === 'function') spin.restaurar();
      else if (spinTarget) wiSpin(spinTarget, false);
    }
  };

  const onPaste = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData?.items) return;

    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        e.stopPropagation();
        const blob = item.getAsFile();
        if (blob) {
          procesarArchivo(blob);
          break;
        }
      }
    }
  };

  contenedor.addEventListener('paste', onPaste);

  if (previewWrap) {
    let fileInput = contenedor.querySelector('.imgup-file-input-hidden');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.className = 'imgup-file-input-hidden';
      fileInput.style.display = 'none';
      contenedor.appendChild(fileInput);

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          procesarArchivo(file);
          fileInput.value = '';
        }
      });
    }

    previewWrap.style.cursor = 'pointer';
    previewWrap.setAttribute('title', 'Haz clic para seleccionar imagen o pega directo con Ctrl + V');
    previewWrap.setAttribute('tabindex', '0');

    previewWrap.addEventListener('click', (e) => {
      if (e.target.closest('.py-chip-badge')) return;
      fileInput.click();
    });

    previewWrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
  }

  return {
    destruir: () => {
      contenedor.removeEventListener('paste', onPaste);
    }
  };
}

export default {
  procesarPegadoImagen,
  activarPegadoR2
};
