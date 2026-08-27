const fs = require("node:fs");
const path = require("node:path");
const { injectIndex } = require("./inject-index");

const PUBLIC = path.join(__dirname, "..", "public");
const BOOKMARK_SOURCE = fs.readFileSync(path.join(PUBLIC, "bookmark.js"), "utf8");
const INDEX_TEMPLATE = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".json": "application/json",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC, normalized);
  if (!filePath.startsWith(PUBLIC)) return null;
  return filePath;
}

function serveStatic(filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return null;
  }
  const ext = path.extname(filePath).toLowerCase();
  const body = fs.readFileSync(filePath);
  return new Response(body, {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600",
    },
  });
}

function serveIndex(origin) {
  const html = injectIndex(INDEX_TEMPLATE, origin, BOOKMARK_SOURCE);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

async function serveStaticRequest(request) {
  const url = new URL(request.url);

  if (url.pathname === "/" || url.pathname === "/index.html") {
    return serveIndex(url.origin);
  }

  let filePath = safePath(url.pathname);

  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  const staticResponse = filePath ? serveStatic(filePath) : null;
  if (staticResponse) return staticResponse;

  return serveIndex(url.origin);
}

module.exports = { serveStaticRequest, PUBLIC, MIME };
