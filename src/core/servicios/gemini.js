// src/core/servicios/gemini.js
// Cliente general de Inteligencia Artificial con Google Gemini (Cascada Auto-Fallback Multimodelo)
// Resolución dinámica de API Key: Bóveda de Servicios (Local-First 0ms -> Firestore) con fallback a .env

import { getls, savels, descifrar } from '@widev';

const MODELOS_CANDIDATOS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash'
];
let _modeloActivo = MODELOS_CANDIDATOS[0];

/**
 * Obtiene la API Key activa para Google Gemini siguiendo una estrategia de 3 niveles:
 * 1. Local-First Cifrado (0 ms) en localStorage ('wi_seguridad_gemini')
 * 2. Colección Firestore: seguridad/gemini (si activo !== false)
 * 3. Fallback: Variable de entorno PUBLIC_GEMINI_KEY (.env)
 */
export async function obtenerApiKeyGemini() {
  // 1. Local-First Cifrado (0 ms)
  try {
    const localKey = getls('wi_seguridad_gemini');
    if (localKey && typeof localKey === 'string') {
      const dec = await descifrar(localKey);
      if (dec && dec.trim().length > 10) {
        return dec.trim();
      }
    }
  } catch (e) {
    console.warn('[gemini] Error al descifrar clave local:', e);
  }

  // 2. Consulta Firestore seguridad/gemini
  try {
    const { db } = await import('@core/servicios/firebase.js');
    if (db) {
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'seguridad', 'gemini'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.activo !== false && data.keyServicio) {
          const dec = await descifrar(data.keyServicio);
          if (dec && dec.trim().length > 10) {
            try {
              savels('wi_seguridad_gemini', data.keyServicio, false);
            } catch (_) {}
            return dec.trim();
          }
        }
      }
    }
  } catch (err) {
    console.warn('[gemini] Error al consultar Firestore para clave Gemini:', err?.message || err);
  }

  // 3. Fallback a entorno .env
  return import.meta.env.PUBLIC_GEMINI_KEY || '';
}

/**
 * Consulta general a Gemini con cascada de auto-fallback multimodelo
 * Soporta tanto objeto ({ prompt, systemInstruction }) como string directo (prompt)
 */
export async function consultarGemini(arg) {
  const apiKey = await obtenerApiKeyGemini();
  if (!apiKey) {
    throw new Error('No se encontró ninguna clave de acceso para Google Gemini (configúrala en tu Bóveda de Servicios en Mi Perfil).');
  }

  const options = typeof arg === 'string' ? { prompt: arg } : (arg || {});
  const { prompt = '', systemInstruction = '', responseMimeType = 'text/plain' } = options;

  const textoPrompt = String(prompt || '').trim();
  if (!textoPrompt) {
    throw new Error('El prompt enviado a Gemini no puede estar vacío');
  }

  const payload = {
    contents: [
      {
        parts: [{ text: textoPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: responseMimeType
    }
  };

  if (systemInstruction && String(systemInstruction).trim()) {
    payload.systemInstruction = {
      parts: [{ text: String(systemInstruction).trim() }]
    };
  }

  // Cascada inteligente: arranca con el modelo activo y prueba los demás si falla
  const modelosAProbar = [_modeloActivo, ...MODELOS_CANDIDATOS.filter(m => m !== _modeloActivo)];
  let ultimoError = null;

  for (const modelo of modelosAProbar) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const mensaje = errorData?.error?.message || response.statusText;
        throw new Error(`HTTP ${response.status}: ${mensaje}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini no devolvió ninguna respuesta válida');
      }

      // Recordar que este modelo funciona para las siguientes peticiones
      _modeloActivo = modelo;
      return rawText.trim();
    } catch (err) {
      console.warn(`[gemini] Falló modelo "${modelo}": ${err?.message || err}. Probando siguiente fallback...`);
      ultimoError = err;
    }
  }

  throw new Error(`Todos los modelos de Gemini fallaron. Último error: ${ultimoError?.message || ultimoError}`);
}

/**
 * Consulta a Gemini forzando y parseando respuesta en formato JSON estructurado
 * Soporta tanto objeto ({ prompt, systemInstruction }) como string directo (prompt)
 */
export async function consultarJsonGemini(arg) {
  const options = typeof arg === 'string' ? { prompt: arg } : (arg || {});
  const { prompt = '', systemInstruction = '' } = options;

  const rawJsonText = await consultarGemini({
    prompt,
    systemInstruction,
    responseMimeType: 'application/json'
  });

  try {
    return JSON.parse(rawJsonText);
  } catch (err) {
    // Limpieza por si contiene bloques markdown ```json ... ```
    const cleaned = rawJsonText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned);
  }
}

/**
 * Helper universal y ultracorto para traducción estructurada con IA.
 * Recibe un objeto con los datos a traducir y devuelve el mismo objeto traducido.
 */
export async function traducirJson(datos = {}, idiomaDestino = 'en', contexto = '') {
  return consultarJsonGemini({
    prompt: `Traduce los siguientes valores al idioma "${idiomaDestino}". Mantén estrictamente los nombres de las claves JSON originales (no traduzcas las claves, solo traduce sus valores de texto) y conserva intacto el formato Markdown si contiene encabezados (##, ###), citas o listas:\n\n${JSON.stringify(datos, null, 2)}`,
    systemInstruction: `Eres un traductor técnico y especialista SEO de Seowii Studio. ${contexto} Responde EXCLUSIVAMENTE con el objeto JSON traducido conservando exactamente las mismas claves JSON originales.`
  });
}
