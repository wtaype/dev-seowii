// src/core/servicios/r2Storage.js
// Conector global nativo a Cloudflare R2 con firma AWS SigV4 pura (0 dependencias npm / Web Crypto API)
// Soporta: Subida con conversión WebP automática por Canvas, ListObjectsV2 y Borrado Físico (DELETE)
// Arquitectura DRY con firmador criptográfico unificado

const ACCOUNT_ID = import.meta.env.PUBLIC_R2_ACCOUNT_ID;
const ACCESS_KEY_ID = import.meta.env.PUBLIC_R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = import.meta.env.PUBLIC_R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = import.meta.env.PUBLIC_R2_BUCKET_NAME || '';
const PUBLIC_R2_URL = import.meta.env.PUBLIC_R2_URL || '';

const EMPTY_PAYLOAD_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

// ── Utilidades criptográficas nativas usando Web Crypto API ──
async function hmacSha256(key, data) {
  const cryptoKey = typeof key === 'string'
    ? await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    : await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, typeof data === 'string' ? new TextEncoder().encode(data) : data);
  return new Uint8Array(signature);
}

async function sha256Hex(data) {
  const hash = await crypto.subtle.digest('SHA-256', typeof data === 'string' ? new TextEncoder().encode(data) : data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hex(buffer) {
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Motor Criptográfico Unificado AWS SigV4 para Cloudflare R2
 * Construye la petición canónica, calcula el StringToSign y retorna URL y headers firmados
 * @param {object} params
 * @param {string} params.method - 'GET' | 'PUT' | 'DELETE' | 'HEAD'
 * @param {string} params.canonicalUri - Ruta del objeto, ej: `/${BUCKET_NAME}/${fileName}`
 * @param {string} [params.queryString=''] - Cadena de parámetros de consulta ya ordenada
 * @param {string} [params.payloadHash=EMPTY_PAYLOAD_HASH] - SHA256 hex del payload
 * @param {string} [params.contentType] - Tipo de contenido opcional
 * @returns {Promise<{ url: string, headers: Record<string, string> }>}
 */
async function firmarPeticionSigV4({
  method = 'GET',
  canonicalUri = `/${BUCKET_NAME}`,
  queryString = '',
  payloadHash = EMPTY_PAYLOAD_HASH,
  contentType = ''
}) {
  if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !ACCOUNT_ID) {
    throw new Error('Faltan credenciales de Cloudflare R2 en las variables de entorno (.env)');
  }

  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const headersMap = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  };
  if (contentType) {
    headersMap['content-type'] = contentType;
  }

  // Ordenar cabeceras alfabéticamente
  const sortedHeaderKeys = Object.keys(headersMap).sort();
  const signedHeaders = sortedHeaderKeys.join(';');
  const canonicalHeaders = sortedHeaderKeys.map(k => `${k}:${headersMap[k]}\n`).join('');

  const canonicalRequest = [
    method,
    canonicalUri,
    queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const canonicalRequestHash = await sha256Hex(canonicalRequest);

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');

  const kDate = await hmacSha256(`AWS4${SECRET_ACCESS_KEY}`, dateStamp);
  const kRegion = await hmacSha256(kDate, 'auto');
  const kService = await hmacSha256(kRegion, 's3');
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signatureBytes = await hmacSha256(kSigning, stringToSign);
  const signature = hex(signatureBytes);

  const authHeader = `${algorithm} Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const requestHeaders = {
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    'Authorization': authHeader
  };
  if (contentType) {
    requestHeaders['Content-Type'] = contentType;
  }

  const fullUrl = `https://${host}${canonicalUri}${queryString ? `?${queryString}` : ''}`;
  return { url: fullUrl, headers: requestHeaders };
}

/**
 * Convierte cualquier imagen a formato .webp en el navegador usando HTML5 Canvas
 * Sin librerías externas · Redimensiona si el ancho supera maxAncho (default 1920px)
 * @param {File|Blob} file - Archivo original
 * @param {number} [maxAncho=1920] - Ancho máximo permitido en píxeles
 * @param {number} [calidad=0.85] - Calidad de compresión WebP (0 a 1)
 * @returns {Promise<{ file: File, dimensiones: string, pesoKb: number }>}
 */
export async function convertirAWebP(file, maxAncho = 1920, calidad = 0.85) {
  if (!file) throw new Error('No se proporcionó ningún archivo para procesar');

  if (file.type && !file.type.startsWith('image/')) {
    return {
      file,
      dimensiones: 'Original',
      pesoKb: Math.max(1, Math.round(file.size / 1024))
    };
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxAncho) {
        height = Math.round((height * maxAncho) / width);
        width = maxAncho;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Fallo al comprimir la imagen en WebP'));
          }
          const baseName = (file.name || 'imagen').replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
          const webpFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' });
          resolve({
            file: webpFile,
            dimensiones: `${width}x${height}`,
            pesoKb: Math.max(1, Math.round(webpFile.size / 1024))
          });
        },
        'image/webp',
        calidad
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo decodificar la imagen en el navegador'));
    };

    img.src = url;
  });
}

/**
 * Sube cualquier archivo directamente a Cloudflare R2 mediante firma SigV4 nativa
 * Incluye conversión automática a WebP y redimensionamiento previo a 1920px
 * @param {File|Blob} file - Archivo seleccionado
 * @param {string} [slug] - Nombre base o prefijo sugerido (ej. "consulta-individual")
 * @param {object} [opciones] - Opciones de compresión ({ autoWebP: true, maxAncho: 1920, calidad: 0.85 })
 * @returns {Promise<{ ok: boolean, url: string, key: string, size: number, dimensiones: string, pesoKb: number }>}
 */
export async function subirImagenR2(file, slug = '', opciones = {}) {
  if (!file) throw new Error('No se ha proporcionado ningún archivo para subir');

  const { autoWebP = true, maxAncho = 1920, calidad = 0.85 } = opciones;

  let archivoFinal = file;
  let dimensionesDetectadas = 'Optimizado WebP';
  let pesoFinalKb = Math.max(1, Math.round(file.size / 1024));

  if (autoWebP && file.type && file.type.startsWith('image/') && !file.type.includes('svg')) {
    try {
      const resWebP = await convertirAWebP(file, maxAncho, calidad);
      archivoFinal = resWebP.file;
      dimensionesDetectadas = resWebP.dimensiones;
      pesoFinalKb = resWebP.pesoKb;
    } catch (e) {
      console.warn('[r2Storage] Conversión a WebP fallida, usando archivo original:', e);
    }
  }

  const ext = archivoFinal.name ? archivoFinal.name.split('.').pop().toLowerCase() : 'webp';
  const baseLimpia = slug
    ? slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-')
    : 'media';
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const fileName = opciones.fileName || `${baseLimpia}-${Date.now().toString().slice(-4)}-${randomSuffix}.${ext}`;
  const contentType = archivoFinal.type || 'image/webp';

  const fileBuffer = await archivoFinal.arrayBuffer();
  const payloadHash = await sha256Hex(fileBuffer);

  const { url, headers } = await firmarPeticionSigV4({
    method: 'PUT',
    canonicalUri: `/${BUCKET_NAME}/${fileName}`,
    payloadHash,
    contentType
  });

  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: fileBuffer
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('Error Cloudflare R2 Upload:', res.status, errBody);
    throw new Error(`Cloudflare R2 respondió con error (${res.status}): ${errBody || res.statusText}`);
  }

  const publicUrl = `${PUBLIC_R2_URL.replace(/\/$/, '')}/${fileName}`;
  return {
    ok: true,
    url: publicUrl,
    key: fileName,
    size: archivoFinal.size,
    pesoKb: pesoFinalKb,
    dimensiones: dimensionesDetectadas
  };
}

/**
 * Consulta la lista de objetos almacenados directamente en Cloudflare R2 vía S3 ListObjectsV2
 * Cero costo en Firebase · Firma AWS SigV4 pura · Parseo XML nativo con DOMParser
 * @param {string} [prefijo=''] - Prefijo de filtrado opcional
 * @returns {Promise<Array<{ id: string, key: string, url: string, nombre: string, pesoKb: number, fecha: string, dimensiones: string, categoria: string }>>}
 */
export async function listarObjetosR2(prefijo = '') {
  if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !ACCOUNT_ID || !BUCKET_NAME) {
    console.warn('[r2Storage] Credenciales de R2 incompletas para listar objetos');
    return [];
  }

  const queryParams = new URLSearchParams();
  queryParams.set('list-type', '2');
  if (prefijo) queryParams.set('prefix', prefijo);
  queryParams.sort();

  const { url, headers } = await firmarPeticionSigV4({
    method: 'GET',
    canonicalUri: `/${BUCKET_NAME}`,
    queryString: queryParams.toString(),
    payloadHash: EMPTY_PAYLOAD_HASH
  });

  const res = await fetch(url, { method: 'GET', headers });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[r2Storage] Error en ListObjectsV2:', res.status, errText);
    throw new Error(`Cloudflare R2 ListObjectsV2 falló (${res.status}): ${errText}`);
  }

  const xmlText = await res.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  const contentsNodes = xmlDoc.querySelectorAll('Contents');
  const baseUrl = PUBLIC_R2_URL.replace(/\/$/, '');

  return Array.from(contentsNodes).map(node => {
    const key = node.querySelector('Key')?.textContent || '';
    const size = parseInt(node.querySelector('Size')?.textContent || '0', 10);
    const lastModified = node.querySelector('LastModified')?.textContent || '';

    let categoria = 'general';
    const keyLower = key.toLowerCase();
    if (keyLower.includes('proyecto') || keyLower.includes('gaswii') || keyLower.includes('pos') || keyLower.includes('contabilidad')) {
      categoria = 'proyectos';
    } else if (keyLower.includes('servicio') || keyLower.includes('redes') || keyLower.includes('consultoria')) {
      categoria = 'servicios';
    } else if (keyLower.includes('logo') || keyLower.includes('banner') || keyLower.includes('brand')) {
      categoria = 'branding';
    }

    return {
      id: key,
      key,
      url: `${baseUrl}/${key}`,
      nombre: key,
      pesoKb: Math.max(1, Math.round(size / 1024)),
      dimensiones: 'Optimizado WebP',
      categoria,
      fecha: lastModified ? lastModified.slice(0, 10).replace(/-/g, '/') : new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
      actualizado: lastModified
    };
  });
}

/**
 * Elimina físicamente un objeto almacenado en Cloudflare R2 vía AWS SigV4 DELETE
 * @param {string} key - Clave o nombre del archivo en el bucket
 * @returns {Promise<{ ok: boolean, key: string }>}
 */
export async function eliminarObjetoR2(key) {
  if (!key) throw new Error('Se requiere el nombre o key del objeto para eliminar');
  if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !ACCOUNT_ID || !BUCKET_NAME) {
    throw new Error('Credenciales de Cloudflare R2 incompletas');
  }

  const cleanKey = encodeURIComponent(key).replace(/%2F/g, '/');
  const { url, headers } = await firmarPeticionSigV4({
    method: 'DELETE',
    canonicalUri: `/${BUCKET_NAME}/${cleanKey}`,
    payloadHash: EMPTY_PAYLOAD_HASH
  });

  const res = await fetch(url, { method: 'DELETE', headers });

  if (!res.ok && res.status !== 204 && res.status !== 200) {
    const errText = await res.text();
    console.error('[r2Storage] Error en DELETE objeto R2:', res.status, errText);
    throw new Error(`Cloudflare R2 DELETE falló (${res.status}): ${errText || res.statusText}`);
  }

  return { ok: true, key };
}
