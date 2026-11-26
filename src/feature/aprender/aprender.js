// src/feature/aprender/aprender.js
import { savels, getls, toast, copiar } from '@widev/widev.js';

const LS_KEY = 'dev_aprender_tab';

export function initAprender() {
  const root = document.getElementById('dvAprenderView');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';

  const i18n = JSON.parse(root.dataset.i18nAp || '{}');
  const navBtns = [...root.querySelectorAll('[data-ap-tab]')];
  const panels = [...root.querySelectorAll('[data-ap-panel]')];
  const goldEl = document.getElementById('dvApGoldText');
  const searchInput = document.getElementById('dvApSearch');
  const clearBtn = document.getElementById('dvApClearSearch');
  const emptyBox = document.getElementById('dvApEmpty');

  let activeTab = getls(LS_KEY) || 'recursos';
  if (!panels.some((p) => p.dataset.apPanel === activeTab)) {
    activeTab = 'recursos';
  }

  const activarTab = (tabId) => {
    activeTab = tabId;
    savels(LS_KEY, tabId);

    navBtns.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.apTab === tabId);
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.apPanel !== tabId;
    });

    if (goldEl && i18n.goldMap?.[tabId]) {
      goldEl.textContent = i18n.goldMap[tabId];
    }
    aplicarFiltro();
  };

  const aplicarFiltro = () => {
    const q = (searchInput?.value || '').trim().toLowerCase();
    if (clearBtn) clearBtn.hidden = !q;

    let totalMatchesInActive = 0;
    let firstMatchingPanel = null;

    panels.forEach((panel) => {
      const pid = panel.dataset.apPanel;
      const items = [...panel.querySelectorAll('[data-ap-item]')];
      let panelMatches = 0;

      items.forEach((item) => {
        const hay = item.dataset.search || '';
        const match = !q || hay.includes(q);
        item.hidden = !match;
        if (match) panelMatches += 1;
      });

      // Ocultar grupos vacíos dentro de Recursos
      panel.querySelectorAll('[data-ap-group]').forEach((grp) => {
        const hasVisible = [...grp.querySelectorAll('[data-ap-item]')].some((el) => !el.hidden);
        grp.hidden = !hasVisible;
      });

      const navBtn = navBtns.find((b) => b.dataset.apTab === pid);
      if (navBtn) {
        navBtn.classList.toggle('has-match', Boolean(q && panelMatches > 0));
      }

      if (panelMatches > 0 && !firstMatchingPanel) {
        firstMatchingPanel = pid;
      }
      if (pid === activeTab) {
        totalMatchesInActive = panelMatches;
      }
    });

    // Si la pestaña activa no tiene resultados pero otra sí, saltar automáticamente a la primera con coincidencias
    if (q && totalMatchesInActive === 0 && firstMatchingPanel) {
      activarTab(firstMatchingPanel);
      return;
    }

    if (emptyBox) {
      emptyBox.hidden = !(q && totalMatchesInActive === 0);
    }
  };

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => activarTab(btn.dataset.apTab));
  });

  searchInput?.addEventListener('input', aplicarFiltro);

  clearBtn?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    aplicarFiltro();
  });

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.dv-ap-copy');
    if (!btn) return;
    const text = btn.dataset.copy;
    if (!text) return;
    copiar(text);
    toast(i18n.copiedMsg || 'Copiado', 'success');
  });

  activarTab(activeTab);
}

initAprender();
document.addEventListener('astro:page-load', initAprender);
