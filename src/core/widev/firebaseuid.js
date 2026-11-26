// src/core/widev/firebaseuid.js
// wiFirebaseUID v2.0.0: Generador y validador universal de UIDs estilo Firebase (Web Crypto API)
// - 20 chars: Firestore Document Auto-ID inmutable (ej. ZrLM3CAJvJxq0oSDCwLH, q8F2mP9qLx3vRt5wY1aZ)
// - 28 chars: Firebase Auth User UID (ej. OMXWyQusOeY0WILaB4Je7cNVBnP2)
// 100% agnóstico, nativo y reutilizable (0 dependencias externas)

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function wiFirebaseUID(longitud = 20) {
  const len = Number(longitud) > 0 ? Math.floor(Number(longitud)) : 20;
  const bytes = new Uint8Array(len);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let uid = '';
  for (let i = 0; i < len; i++) {
    uid += ALFABETO.charAt(bytes[i] % ALFABETO.length);
  }
  return uid;
}

/**
 * Valida si un string es un UID auténtico de Firestore (exactamente 20 caracteres alfanuméricos)
 */
export function esFirebaseUID(str) {
  return typeof str === 'string' && /^[A-Za-z0-9]{20}$/.test(str.trim());
}

/**
 * Garantiza que un ID de documento sea un UID inmutable de 20 caracteres estilo Firebase.
 * Si ya es un UID de 20 caracteres válido, lo preserva; si es nulo, slug o inválido, genera uno nuevo.
 */
export function asegurarDocUID(docId) {
  return esFirebaseUID(docId) ? docId.trim() : wiFirebaseUID(20);
}

export const firebaseUID = wiFirebaseUID;
