const { handleApi } = require("./lib/api");
const { injectIndex } = require("./lib/inject-index");

async function serveIndex(request, env) {
  const origin = new URL(request.url).origin;
  const base = new URL(request.url);

  const [indexRes, bookmarkRes] = await Promise.all([
    env.ASSETS.fetch(new URL("/index.html", base)),
    env.ASSETS.fetch(new URL("/bookmark.js", base)),
  ]);

  const html = injectIndex(
    await indexRes.text(),
    origin,
    await bookmarkRes.text()
  );

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export default {
  async fetch(request, env) {
    const apiResponse = await handleApi(request, env);
    if (apiResponse) return apiResponse;

    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return serveIndex(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
