// src/semillas/general.js
// 🌱 Datos técnicos universales para el módulo General (0 duplicación por idioma)

export const HTTP_STATUS = [
  { code: '200', tipo: 'ok' },
  { code: '201', tipo: 'ok' },
  { code: '301', tipo: 'warn' },
  { code: '302', tipo: 'warn' },
  { code: '304', tipo: 'ok' },
  { code: '400', tipo: 'err' },
  { code: '401', tipo: 'err' },
  { code: '403', tipo: 'err' },
  { code: '404', tipo: 'err' },
  { code: '410', tipo: 'err' },
  { code: '500', tipo: 'err' },
  { code: '502', tipo: 'err' },
  { code: '503', tipo: 'err' }
];

export const BREAKPOINTS_CSS = [
  { px: '360px', label: 'Mobile S' },
  { px: '480px', label: 'Mobile L' },
  { px: '768px', label: 'Tablet' },
  { px: '980px', label: 'Dock Break' },
  { px: '1280px', label: 'Laptop' },
  { px: '1440px', label: 'Desktop' }
];

export const TOKEN_MODES = [
  { id: 'uuid', label: 'UUID v4' },
  { id: 'secret', label: 'Secret 32' },
  { id: 'pass', label: 'Password' }
];

export const DEFAULT_TEXT = 'Tour Sandboard Pro en Huacachina 2026: Dunas Gigantes & Atardecer Dorado';
export const DEFAULT_JSON = '{"proyecto":"dev.seowii.com","estilo":"Navy Matte","stack":"Astro 7","bd":false}';
export const DEFAULT_COLOR = '#06b6d4';
