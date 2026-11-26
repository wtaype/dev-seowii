// src/core/servicios/googleApi.js
// 🔑 Gestor Unificado de APIs Google (PageSpeed Insights v5 + Gemini AI)
// Prioridad 1: Keys del usuario en /ajustes (sin límite)
// Prioridad 2: Keys en .env con freno wiRateLimit(3 por día)

import { getls, savels } from '@widev/storage.js';
import { wiRateLimit } from '@widev/ratelimit.js';

export const LS_AJUSTES_KEY = 'dv_ajustes_keys';
export const DAILY_LIMIT = 3;

export function getUserKeys() {
  const saved = getls(LS_AJUSTES_KEY);
  return {
    speedKey: String(saved?.speedKey || '').trim(),
    geminiKey: String(saved?.geminiKey || '').trim()
  };
}

export function saveUserKeys({ speedKey = '', geminiKey = '' } = {}) {
  return savels(
    LS_AJUSTES_KEY,
    { speedKey: String(speedKey).trim(), geminiKey: String(geminiKey).trim() },
    24 * 30
  );
}

export function getKeyStatus() {
  const user = getUserKeys();
  const envSpeed = String(import.meta.env.PUBLIC_GOOGLE_SPEED || '').trim();
  const envGemini = String(import.meta.env.PUBLIC_GOOGLE_GEMINI || '').trim();
  const rl = wiRateLimit('google_api_hoy', DAILY_LIMIT, 'dia');
  return {
    hasUserSpeed: Boolean(user.speedKey),
    hasUserGemini: Boolean(user.geminiKey),
    hasEnvSpeed: Boolean(envSpeed),
    hasEnvGemini: Boolean(envGemini),
    limitOk: rl.ok,
    waitMin: rl.min
  };
}

export async function ejecutarPageSpeed(urlRaw, strategy = 'mobile') {
  const url = String(urlRaw || '').trim();
  if (!/^https?:\/\/.+\..+/i.test(url)) {
    return { ok: false, errorCode: 'invalid_url', error: 'URL inválida' };
  }

  const user = getUserKeys();
  const envKey = String(import.meta.env.PUBLIC_GOOGLE_SPEED || '').trim();
  const usingUserKey = Boolean(user.speedKey);
  const apiKey = user.speedKey || envKey;

  if (!apiKey) {
    return { ok: false, errorCode: 'no_key', error: 'No API Key' };
  }

  const rl = wiRateLimit('google_api_hoy', DAILY_LIMIT, 'dia');
  if (!usingUserKey && !rl.ok) {
    return { ok: false, errorCode: 'rate_limit', waitMin: rl.min, error: 'Daily limit reached' };
  }

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${encodeURIComponent(apiKey)}&strategy=${encodeURIComponent(strategy)}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    if (!res.ok || data.error) {
      return { ok: false, errorCode: 'api_error', error: data?.error?.message || `HTTP ${res.status}` };
    }
    if (!usingUserKey) rl.fail();
    return { ok: true, data, usingUserKey };
  } catch (err) {
    return { ok: false, errorCode: 'network', error: err?.message || 'Network error' };
  }
}

export async function analizarConGemini(prompt) {
  const user = getUserKeys();
  const envKey = String(import.meta.env.PUBLIC_GOOGLE_GEMINI || '').trim();
  const usingUserKey = Boolean(user.geminiKey);
  const apiKey = user.geminiKey || envKey;

  if (!apiKey) {
    return { ok: false, errorCode: 'no_key', error: 'No Gemini API Key' };
  }

  const rl = wiRateLimit('google_gemini_hoy', DAILY_LIMIT, 'dia');
  if (!usingUserKey && !rl.ok) {
    return { ok: false, errorCode: 'rate_limit', waitMin: rl.min, error: 'Daily limit reached' };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      return { ok: false, errorCode: 'api_error', error: data?.error?.message || `HTTP ${res.status}` };
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!usingUserKey) rl.fail();
    return { ok: true, text, usingUserKey };
  } catch (err) {
    return { ok: false, errorCode: 'network', error: err?.message || 'Network error' };
  }
}
