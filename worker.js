// worker.js
// ⚡ Cloudflare Worker para dev.seowii.com: /api/meta (sin CORS) + Assets estáticos (./dist)

function decodeHtml(str = '') {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function pickMeta(html, attr, val) {
  const re1 = new RegExp(`<meta[^>]+${attr}=["']${val}["'][^>]+content=["']([^"']*)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${val}["']`, 'i');
  return decodeHtml((html.match(re1) || html.match(re2))?.[1] || '');
}

function extractMeta(html = '') {
  const title = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const desc = pickMeta(html, 'name', 'description');
  const ogImage = pickMeta(html, 'property', 'og:image');
  const canonical = decodeHtml(
    (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i))?.[1] || ''
  );
  const h1 = decodeHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '') || '');
  const h2Count = (html.match(/<h2\b/gi) || []).length;
  return { title, desc, canonical, ogImage, h1, h2Count };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/meta') {
      const target = url.searchParams.get('url') || '';
      if (!/^https?:\/\/.+\..+/i.test(target)) {
        return Response.json({ ok: false, error: 'URL inválida' }, { status: 400 });
      }
      try {
        const res = await fetch(target, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SeowiiBot/1.0)' },
          redirect: 'follow'
        });
        const html = await res.text();
        return Response.json({ ok: true, status: res.status, ...extractMeta(html) });
      } catch (err) {
        return Response.json({ ok: false, error: err?.message || 'Fetch error' }, { status: 502 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
