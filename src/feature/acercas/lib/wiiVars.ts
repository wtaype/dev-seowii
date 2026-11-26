// src/feature/acercas/lib/wiiVars.ts
// Reemplaza placeholders ({app}, {slogan}, {by}, {version}, {linkweb}, {correo}) usando @wii
import { app, slogan, by, version, linkweb } from '@wii';

export const WII_INFO = {
  app,
  slogan,
  by,
  version,
  linkweb,
  correo: 'contacto@seowii.com'
};

export function rellenarWii<T>(valor: T): T {
  if (typeof valor === 'string') {
    return valor
      .replaceAll('{app}', WII_INFO.app)
      .replaceAll('{slogan}', WII_INFO.slogan)
      .replaceAll('{by}', WII_INFO.by)
      .replaceAll('{version}', WII_INFO.version)
      .replaceAll('{linkweb}', WII_INFO.linkweb)
      .replaceAll('{correo}', WII_INFO.correo) as T;
  }
  if (Array.isArray(valor)) return valor.map(rellenarWii) as T;
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, rellenarWii(v)])
    ) as T;
  }
  return valor;
}
