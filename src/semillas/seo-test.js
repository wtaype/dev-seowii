// src/semillas/seo-test.js
// 🌱 Reglas universales de auditoría SEO y plantilla _headers para Cloudflare

export const SEO_LIMITS = {
  titleMin: 30,
  titleMax: 60,
  descMin: 110,
  descMax: 160
};

export const SEO_DEFAULTS = {
  title: 'Mi Negocio Pro · Servicios Digitales en Lima 2026',
  desc: 'Soluciones web ultrarrápidas con Astro y Cloudflare. Solicita tu diagnóstico gratuito hoy mismo y mejora tu posicionamiento en Google.',
  url: 'https://mi-negocio.com/servicios',
  h1: 'Servicios Digitales de Alto Rendimiento',
  ogImage: 'https://mi-negocio.com/og-cover.webp',
  robots: 'index, follow'
};

export const CLOUDFLARE_HEADERS = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/fontawesome/*
  Cache-Control: public, max-age=31536000, immutable`;
