// src/feature/lector-md/lib/mdUtils.js
// 📝 Utilidades puras para Lector MD

export const SAMPLE_MD = `# dev.seowii.com · Guía Rápida

Bienvenido al **Lector Markdown en Vivo** impulsado por \`wiMd\`.

## Características
- **100% Cliente:** Sin servidores ni dependencias pesadas.
- **Tablas & Código:** Listo para revisar \`README.md\` o \`AGENTS.md\`.
- **Exportación:** Copia el HTML limpio o descarga tu \`.md\`.

> Tip: Puedes arrastrar o subir cualquier archivo \`.md\` desde el botón superior.

| Módulo | Ruta | Estado |
| :--- | :--- | :--- |
| General | \`/\` | Listo |
| ImgWii | \`/imgwii\` | Listo |
| Lector JSON | \`/lector-json\` | Listo |
| Lector MD | \`/lector-md\` | En vivo |

\`\`\`js
const app = 'dev.seowii.com';
console.log('Hola desde', app);
\`\`\`
`;

export function calcMdStats(raw = '') {
  const txt = String(raw || '');
  const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
  const lines = txt ? txt.split(/\r?\n/).length : 0;
  const mins = Math.max(1, Math.ceil(words / 200));
  return { words, lines, mins };
}
