const OWNER = "girishthakur35720-creator";
const REPO = "Gold-intelligence-";
const REV = "e3600e6903fbeec45666e7cc24466719e97792d1";
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        app: "Gold Intelligence",
        source: "GitHub",
        revision: REV,
        mode: "phase-1-live-data",
        dataSources: ["Gold API XAU reference", "Hyperliquid public WebSocket", "Lighter public REST snapshots"],
      });
    }
    let path = decodeURIComponent(url.pathname);
    if (path === "/" || path.endsWith("/")) path += "index.html";
    if (path.includes("..") || path.includes(String.fromCharCode(92))) return new Response("Not found", { status: 404 });
    const extension = path.slice(path.lastIndexOf("."));
    const contentType = CONTENT_TYPES[extension];
    if (!contentType) return new Response("Not found", { status: 404 });
    const source = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${REV}${path}`;
    const upstream = await fetch(source, { cf: { cacheTtl: 60, cacheEverything: true } });
    if (!upstream.ok) return new Response("Asset unavailable", { status: upstream.status === 404 ? 404 : 502 });
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=15");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return new Response(upstream.body, { status: 200, headers });
  },
};