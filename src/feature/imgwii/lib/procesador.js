// src/feature/imgwii/lib/procesador.js
// 🖼️ Compresión y redimensionado 100% en navegador mediante Canvas

export function formatearBytes(bytes = 0) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function cargarImagen(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) return resolve(blob);
        canvas.toBlob((fallback) => resolve(fallback), 'image/webp', quality);
      },
      mime,
      quality
    );
  });
}

/** Procesa un File según formato, ancho máximo y calidad (0..1) */
export async function procesarImagen(file, { format = 'image/webp', maxWidth = 0, quality = 0.82 } = {}) {
  const { img, url } = await cargarImagen(file);
  try {
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;

    let targetW = origW;
    let targetH = origH;
    if (maxWidth > 0 && origW > maxWidth) {
      targetW = maxWidth;
      targetH = Math.max(1, Math.round((origH * maxWidth) / origW));
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await canvasToBlob(canvas, format, quality);
    const outUrl = URL.createObjectURL(blob);

    return {
      origW,
      origH,
      outW: targetW,
      outH: targetH,
      origSize: file.size,
      outSize: blob.size,
      blob,
      outUrl
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
