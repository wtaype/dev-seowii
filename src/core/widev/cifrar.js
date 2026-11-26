// src/core/widev/cifrar.js
// Cifrado AES-256 GCM + Hashing SHA-256 nativo Web Crypto (Ultra-compacto · 100% Reutilizable)
import { savels, getls } from './storage.js';
import { id as wiiId, app as wiiApp } from '@wii';

const getSubtle = () => (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) ? globalThis.crypto.subtle : null;

// Derivar clave criptográfica AES-GCM desde el identificador dinámico del proyecto (wii.js)
async function getKey() {
  const subtle = getSubtle();
  if (!subtle) return null;
  const seed = `${wiiId || wiiApp || 'wi'}_vault_secure`;
  const hash = await subtle.digest('SHA-256', new TextEncoder().encode(seed));
  return subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

// Cifra un texto en plano devolviendo 'ENC:v1:' + Base64 (IV 12B + Ciphertext + Tag)
export async function cifrar(txt) {
  if (!txt || typeof txt !== 'string') return '';
  if (txt.startsWith('ENC:v1:')) return txt;
  try {
    const subtle = getSubtle();
    const key = await getKey();
    if (!subtle || !key) return txt;
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const buf = await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(txt));
    const combined = new Uint8Array(iv.length + buf.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(buf), iv.length);
    return 'ENC:v1:' + btoa(String.fromCharCode(...combined));
  } catch (e) {
    return txt;
  }
}

// Descifra de 'ENC:v1:' + Base64 a texto plano original
export async function descifrar(txt) {
  if (!txt || typeof txt !== 'string' || !txt.startsWith('ENC:v1:')) return txt || '';
  try {
    const subtle = getSubtle();
    const key = await getKey();
    if (!subtle || !key) return txt;
    const raw = Uint8Array.from(atob(txt.slice(7)), c => c.charCodeAt(0));
    const iv = raw.slice(0, 12);
    const data = raw.slice(12);
    const buf = await subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(buf);
  } catch (e) {
    return txt;
  }
}

// Genera digest irreversible SHA-256 (64 hex) para validación de PIN
export async function hashPin(pin) {
  if (!pin) return '';
  try {
    const subtle = getSubtle();
    if (!subtle) return String(pin);
    const buf = await subtle.digest('SHA-256', new TextEncoder().encode(String(pin)));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return String(pin);
  }
}

// Helpers de almacenamiento local seguro con cifrado transparente (0 ms)
export async function saveSecure(k, v) {
  return savels(k, await cifrar(v), false);
}

export async function getSecure(k, f = '') {
  const r = getls(k);
  return r ? ((await descifrar(r)) || f) : f;
}
