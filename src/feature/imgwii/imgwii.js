// src/feature/imgwii/imgwii.js
// ⚡ Orquestador de ImgWii (Bienvenida, savels/getls, Progreso en vivo, wiGaleria y .zip)

import { wiGaleria } from '@widev/galeria.js';
import { savels, getls } from '@widev/storage.js';
import { procesarImagen, formatearBytes } from './lib/procesador.js';
import { extDesdeMime, limpiarNombreSeo, nombreEnSerie, asegurarNombresUnicos } from './lib/renombrar.js';
import { crearZipBlob } from './lib/zip.js';

const LS_KEY = 'dv_imgwii';
const MAX_LS_BYTES = 3.5 * 1024 * 1024;

function getMsgs(root) {
  try {
    return JSON.parse(root?.dataset.i18nMsg || '{}');
  } catch {
    return {};
  }
}

function descargarBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function extEntrada(fileName = '') {
  const m = String(fileName).match(/\.([^.]+)$/);
  return m ? m[1].toLowerCase() : 'img';
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => resolve(null);
    fr.readAsDataURL(blob);
  });
}

function initImgwii() {
  const root = document.getElementById('dvImgwiiView');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';

  if (!window.__dvImgGaleria) {
    window.__dvImgGaleria = wiGaleria('.dv-img-thumb', { altFallback: 'ImgWii' });
  }

  const msg = getMsgs(root);
  const drop = document.getElementById('dvImg_drop');
  const input = document.getElementById('dvImg_input');
  const formatBtns = root.querySelectorAll('[data-format]');
  const renameBtns = root.querySelectorAll('[data-rename-mode]');
  const selWidth = document.getElementById('dvImg_width');
  const inpQuality = document.getElementById('dvImg_quality');
  const inpPrefix = document.getElementById('dvImg_prefix');
  const btnApply = document.getElementById('dvImg_btnApply');
  const btnClean = document.getElementById('dvImg_btnClean');
  const btnClear = document.getElementById('dvImg_btnClear');
  const btnZip = document.getElementById('dvImg_btnZip');
  const lblSummary = document.getElementById('dvImg_summary');
  const totalBadge = document.getElementById('dvImg_totalBadge');
  const progressBox = document.getElementById('dvImg_progressBox');
  const progressLabel = document.getElementById('dvImg_progressLabel');
  const progressPct = document.getElementById('dvImg_progressPct');
  const progressFill = document.getElementById('dvImg_progressFill');
  const welcomeCard = document.getElementById('dvImg_welcomeCard');
  const tableCard = document.getElementById('dvImg_tableCard');
  const tbody = document.getElementById('dvImg_tbody');

  let formatActivo = 'image/webp';
  let actualizarNombres = true;
  /** @type {Array<{id: string, file?: File, origName: string, nombreSeo: string, res: any}>} */
  let items = [];

  const getQuality = () => {
    const raw = Number(inpQuality?.value || 80);
    return Math.min(100, Math.max(10, Number.isNaN(raw) ? 80 : raw));
  };

  const getOpts = () => ({
    format: formatActivo,
    maxWidth: Number(selWidth?.value || 0),
    quality: getQuality() / 100
  });

  const guardarEstado = async () => {
    const config = {
      format: formatActivo,
      maxWidth: selWidth?.value || '0',
      quality: getQuality(),
      actualizarNombres,
      prefix: inpPrefix?.value || 'seowii-img'
    };

    let totalOut = 0;
    const savedItems = [];
    for (const item of items) {
      totalOut += item.res.outSize;
      if (totalOut > MAX_LS_BYTES) break;
      const dataUrl = await blobToDataUrl(item.res.blob);
      if (!dataUrl) continue;
      savedItems.push({
        id: item.id,
        origName: item.origName,
        nombreSeo: item.nombreSeo,
        origSize: item.res.origSize,
        outSize: item.res.outSize,
        origW: item.res.origW,
        origH: item.res.origH,
        outW: item.res.outW,
        outH: item.res.outH,
        dataUrl
      });
    }

    savels(LS_KEY, { config, items: savedItems }, 24);
  };

  const restaurarEstado = async () => {
    const data = getls(LS_KEY);
    if (!data) return;

    if (data.config) {
      formatActivo = data.config.format || 'image/webp';
      formatBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-format') === formatActivo));
      if (selWidth && data.config.maxWidth != null) selWidth.value = String(data.config.maxWidth);
      if (inpQuality && data.config.quality != null) inpQuality.value = String(data.config.quality);
      actualizarNombres = data.config.actualizarNombres !== false;
      renameBtns.forEach((b) =>
        b.classList.toggle('active', (b.getAttribute('data-rename-mode') !== 'no') === actualizarNombres)
      );
      if (inpPrefix) {
        inpPrefix.value = data.config.prefix || 'seowii-img';
        inpPrefix.disabled = !actualizarNombres;
      }
    }

    if (Array.isArray(data.items) && data.items.length) {
      for (const s of data.items) {
        try {
          const resp = await fetch(s.dataUrl);
          const blob = await resp.blob();
          const outUrl = URL.createObjectURL(blob);
          items.push({
            id: s.id,
            origName: s.origName,
            nombreSeo: s.nombreSeo,
            res: {
              origSize: s.origSize,
              outSize: s.outSize,
              origW: s.origW,
              origH: s.origH,
              outW: s.outW,
              outH: s.outH,
              blob,
              outUrl
            }
          });
        } catch {}
      }
    }
    render();
  };

  const setProgreso = (actual, total) => {
    const activo = total > 0 && actual <= total;
    progressBox?.classList.toggle('dv-img-hidden', !activo);
    if (!activo) return;
    const pct = Math.round((actual / total) * 100);
    if (progressLabel) progressLabel.textContent = `${msg.progressText || '...'} (${actual}/${total})`;
    if (progressPct) progressPct.textContent = `${pct}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;
  };

  const calcularNombre = (origName, index, total) => {
    if (!actualizarNombres) return limpiarNombreSeo(origName);
    const pref = inpPrefix?.value?.trim() || 'seowii-img';
    return nombreEnSerie(pref, index, total);
  };

  const aplicarNombresActuales = () => {
    items.forEach((item, i) => {
      item.nombreSeo = calcularNombre(item.origName, i, items.length);
    });
  };

  const render = () => {
    const ext = extDesdeMime(formatActivo);
    const hasItems = items.length > 0;
    welcomeCard?.classList.toggle('dv-img-hidden', hasItems);
    tableCard?.classList.toggle('dv-img-hidden', !hasItems);
    if (btnClear) btnClear.disabled = !hasItems;
    if (btnZip) btnZip.disabled = !hasItems;

    if (!hasItems) {
      if (lblSummary) lblSummary.textContent = msg.summaryEmpty || '';
      totalBadge?.classList.add('dv-img-hidden');
      if (tbody) tbody.innerHTML = '';
      return;
    }

    let totalOrig = 0;
    let totalOut = 0;
    if (tbody) tbody.innerHTML = '';

    items.forEach((item, index) => {
      totalOrig += item.res.origSize;
      totalOut += item.res.outSize;
      const pct = item.res.origSize > 0
        ? Math.round((1 - item.res.outSize / item.res.origSize) * 100)
        : 0;
      const state = pct >= 0 ? 'ok' : 'err';
      const barPct = Math.max(6, Math.min(100, Math.abs(pct)));
      const inExt = extEntrada(item.origName);
      const inName = item.origName.replace(/\.[^.]+$/, '');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="dv-img-num">${index + 1}</td>
        <td><img class="dv-img-thumb" src="${item.res.outUrl}" alt="${item.nombreSeo}.${ext}" /></td>
        <td>
          <div class="dv-img-now" title="${item.origName}">
            <span class="dv-img-now-txt">${inName}</span>
            <span class="dv-img-fmt-in">.${inExt}</span>
          </div>
        </td>
        <td>
          <div class="dv-img-name-cell">
            <input type="text" class="dv-input" data-edit-name="${item.id}" value="${item.nombreSeo}" />
            <span class="dv-img-ext">.${ext}</span>
          </div>
        </td>
        <td>
          <div class="dv-img-meta">
            <strong>${formatearBytes(item.res.origSize)}</strong>
            <small>${item.res.origW}×${item.res.origH}</small>
          </div>
        </td>
        <td>
          <div class="dv-img-meta">
            <strong>${formatearBytes(item.res.outSize)}</strong>
            <small>${item.res.outW}×${item.res.outH}</small>
          </div>
        </td>
        <td>
          <div class="dv-save-cell">
            <span class="dv-save-txt" data-state="${state}">${pct >= 0 ? `-${pct}%` : `+${Math.abs(pct)}%`}</span>
            <div class="dv-save-bar">
              <div class="dv-save-fill" data-state="${state}" style="width:${barPct}%"></div>
            </div>
          </div>
        </td>
        <td>
          <div class="dv-img-acts">
            <button type="button" class="dv-btn dv-btn-primary dv-btn-sm" data-dl-id="${item.id}" title="${msg.dlOne}">
              <i class="fa-solid fa-download"></i>
            </button>
            <button type="button" class="dv-btn dv-btn-sm" data-del-id="${item.id}" title="${msg.delOne}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody?.appendChild(tr);
    });

    const totalPct = totalOrig > 0 ? Math.round((1 - totalOut / totalOrig) * 100) : 0;
    const totalState = totalPct >= 0 ? 'ok' : 'err';
    if (lblSummary) {
      lblSummary.textContent = `${items.length} ${msg.summaryFiles} · ${formatearBytes(totalOrig)} → ${formatearBytes(totalOut)}`;
    }
    if (totalBadge) {
      totalBadge.classList.remove('dv-img-hidden');
      totalBadge.dataset.state = totalState;
      totalBadge.textContent = totalPct >= 0
        ? `-${totalPct}% ${msg.summarySaved}`
        : `+${Math.abs(totalPct)}%`;
    }
  };

  const agregarArchivos = async (fileList) => {
    const valid = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!valid.length) return;

    welcomeCard?.classList.add('dv-img-hidden');
    tableCard?.classList.add('dv-img-hidden');
    if (lblSummary) lblSummary.textContent = msg.processing || '...';

    const opts = getOpts();
    const totalPrev = items.length;
    const totalFinal = totalPrev + valid.length;

    for (let i = 0; i < valid.length; i++) {
      setProgreso(i + 1, valid.length);
      const file = valid[i];
      try {
        const res = await procesarImagen(file, opts);
        items.push({
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          file,
          origName: file.name,
          nombreSeo: calcularNombre(file.name, totalPrev + i, totalFinal),
          res
        });
      } catch {}
    }

    setProgreso(0, 0);
    render();
    guardarEstado();
  };

  const reprocesarTodo = async () => {
    if (!items.length) {
      guardarEstado();
      return;
    }
    tableCard?.classList.add('dv-img-hidden');
    if (lblSummary) lblSummary.textContent = msg.processing || '...';

    const opts = getOpts();
    for (let i = 0; i < items.length; i++) {
      setProgreso(i + 1, items.length);
      const fuente = items[i].file || items[i].res.blob;
      const oldUrl = items[i].res.outUrl;
      items[i].res = await procesarImagen(fuente, opts);
      URL.revokeObjectURL(oldUrl);
    }

    setProgreso(0, 0);
    render();
    guardarEstado();
  };

  drop?.addEventListener('click', () => input?.click());
  drop?.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('dragover');
  });
  drop?.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop?.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('dragover');
    agregarArchivos(e.dataTransfer?.files);
  });

  input?.addEventListener('change', () => {
    agregarArchivos(input.files);
    input.value = '';
  });

  document.addEventListener('paste', (e) => {
    if (!document.body.contains(root)) return;
    const files = e.clipboardData?.files;
    if (files?.length) agregarArchivos(files);
  });

  formatBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      formatBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      formatActivo = btn.getAttribute('data-format') || 'image/webp';
      reprocesarTodo();
    });
  });

  renameBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      renameBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      actualizarNombres = btn.getAttribute('data-rename-mode') !== 'no';
      if (inpPrefix) inpPrefix.disabled = !actualizarNombres;
      if (items.length) {
        aplicarNombresActuales();
        render();
      }
      guardarEstado();
    });
  });

  selWidth?.addEventListener('change', reprocesarTodo);
  inpQuality?.addEventListener('change', () => {
    if (inpQuality) inpQuality.value = String(getQuality());
    reprocesarTodo();
  });

  btnApply?.addEventListener('click', () => {
    aplicarNombresActuales();
    render();
    guardarEstado();
  });

  btnClean?.addEventListener('click', () => {
    items.forEach((item) => {
      item.nombreSeo = limpiarNombreSeo(item.origName);
    });
    render();
    guardarEstado();
  });

  tbody?.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-edit-name]');
    if (!inp) return;
    const item = items.find((x) => x.id === inp.getAttribute('data-edit-name'));
    if (item) {
      item.nombreSeo = inp.value;
      guardarEstado();
    }
  });

  tbody?.addEventListener('click', (e) => {
    const dlBtn = e.target.closest('[data-dl-id]');
    if (dlBtn) {
      const item = items.find((x) => x.id === dlBtn.getAttribute('data-dl-id'));
      if (item) {
        const ext = extDesdeMime(formatActivo);
        descargarBlob(item.res.blob, `${limpiarNombreSeo(item.nombreSeo)}.${ext}`);
      }
      return;
    }

    const delBtn = e.target.closest('[data-del-id]');
    if (delBtn) {
      const id = delBtn.getAttribute('data-del-id');
      const idx = items.findIndex((x) => x.id === id);
      if (idx >= 0) {
        URL.revokeObjectURL(items[idx].res.outUrl);
        items.splice(idx, 1);
        render();
        guardarEstado();
      }
    }
  });

  btnClear?.addEventListener('click', () => {
    items.forEach((item) => URL.revokeObjectURL(item.res.outUrl));
    items = [];
    render();
    guardarEstado();
  });

  btnZip?.addEventListener('click', async () => {
    if (!items.length) return;
    const ext = extDesdeMime(formatActivo);
    const nombres = asegurarNombresUnicos(items, ext);
    const archivos = items.map((item, i) => ({
      nombre: nombres[i],
      blob: item.res.blob
    }));
    const zipBlob = await crearZipBlob(archivos);
    descargarBlob(zipBlob, msg.zipName || 'seowii-img.zip');
  });

  restaurarEstado();
}

if (!window.__dvImgwiiReady) {
  window.__dvImgwiiReady = true;
  document.addEventListener('astro:page-load', initImgwii);
}
initImgwii();
