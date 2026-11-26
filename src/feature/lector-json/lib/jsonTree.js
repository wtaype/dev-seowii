// src/feature/lector-json/lib/jsonTree.js
// 🌳 Parser seguro, estadísticas y renderizado HTML de árbol JSON colapsable

export const SAMPLE_JSON = JSON.stringify(
  {
    proyecto: 'dev.seowii.com',
    version: '2.1.0',
    bilingue: true,
    herramientas: ['General', 'ImgWii', 'Lector JSON', 'Lector MD'],
    tema: { claro: 'luz', oscuro: 'Navy Matte', radio: '1vh' },
    servidor: null
  },
  null,
  2
);

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parseJsonSeguro(raw = '') {
  try {
    const data = JSON.parse(raw);
    return { ok: true, data, error: '' };
  } catch (err) {
    return { ok: false, data: null, error: err?.message || 'JSON Error' };
  }
}

export function contarStats(data) {
  let keys = 0;
  let nodes = 0;
  const walk = (val) => {
    nodes++;
    if (val && typeof val === 'object') {
      const entries = Array.isArray(val) ? val : Object.keys(val);
      keys += Array.isArray(val) ? 0 : entries.length;
      const children = Array.isArray(val) ? val : Object.values(val);
      for (const child of children) walk(child);
    }
  };
  walk(data);
  return { keys, nodes };
}

function renderValue(val) {
  if (val === null) return '<span class="dv-jt-val" data-type="null">null</span>';
  if (typeof val === 'boolean') return `<span class="dv-jt-val" data-type="bool">${val}</span>`;
  if (typeof val === 'number') return `<span class="dv-jt-val" data-type="num">${val}</span>`;
  return `<span class="dv-jt-val" data-type="str">"${escapeHtml(val)}"</span>`;
}

export function renderJsonTree(data, query = '', path = 'root') {
  const q = query.trim().toLowerCase();

  const buildNode = (val, keyLabel, curPath, depth) => {
    const isObj = val !== null && typeof val === 'object';
    const isArr = Array.isArray(val);

    if (!isObj) {
      const textMatch = `${keyLabel} ${String(val)}`.toLowerCase();
      const hidden = q && !textMatch.includes(q) ? ' dv-jt-hidden' : '';
      const keyHtml = keyLabel !== null
        ? `<button type="button" class="dv-jt-key" data-json-path="${escapeHtml(curPath)}" title="${escapeHtml(curPath)}">${escapeHtml(keyLabel)}:</button>`
        : '';
      return `<div class="dv-jt-leaf${hidden}">${keyHtml}${renderValue(val)}</div>`;
    }

    const entries = isArr ? val.map((v, i) => [String(i), v]) : Object.entries(val);
    const childrenHtml = entries
      .map(([k, v]) => {
        const nextPath = isArr ? `${curPath}[${k}]` : `${curPath}.${k}`;
        return buildNode(v, k, nextPath, depth + 1);
      })
      .join('');

    const countLabel = isArr ? `[${entries.length}]` : `{${entries.length}}`;
    const keyHtml = keyLabel !== null
      ? `<button type="button" class="dv-jt-key" data-json-path="${escapeHtml(curPath)}" title="${escapeHtml(curPath)}">${escapeHtml(keyLabel)}</button>`
      : `<span class="dv-jt-root">root</span>`;

    const openAttr = depth < 2 || q ? ' open' : '';
    return `
      <details class="dv-jt-node"${openAttr}>
        <summary class="dv-jt-sum">
          ${keyHtml}
          <span class="dv-jt-count">${countLabel}</span>
        </summary>
        <div class="dv-jt-children">${childrenHtml}</div>
      </details>
    `;
  };

  return buildNode(data, null, path, 0);
}
