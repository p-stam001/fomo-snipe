const fs = require("fs");
const path = require("path");
const { handleRecover } = require("./recover");
const { handleReport } = require("./report");

const PUBLIC = path.join(__dirname, "..", "public");

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

async function handleRequest(request, env, assets) {
  const url = new URL(request.url);

  if (url.pathname === "/api/recover") {
    return handleRecover(request);
  }
  if (url.pathname === "/api/report") {
    return handleReport(request, env);
  }

  let filePath = safePath(url.pathname === "/" ? "/index.html" : url.pathname);
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (assets) {
    return assets.fetch(request);
  }

  const staticResponse = filePath ? serveStatic(filePath) : null;
  if (staticResponse) return staticResponse;

  const fallback = serveStatic(path.join(PUBLIC, "index.html"));
  return fallback || new Response("Not found", { status: 404 });
}

module.exports = { handleRequest, PUBLIC, MIME };
