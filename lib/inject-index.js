const PLACEHOLDER = "%%BOOKMARKLET%%";

function buildBookmarkletHref(origin, bookmarkSource) {
  const code = bookmarkSource.replace(/__DEPLOY_ORIGIN__/g, origin);
  return "javascript:" + encodeURIComponent(code);
}

function injectIndex(html, origin, bookmarkSource) {
  const href = buildBookmarkletHref(origin, bookmarkSource);
  if (!html.includes(PLACEHOLDER)) {
    throw new Error("index.html missing bookmark placeholder");
  }
  return html.replace(PLACEHOLDER, JSON.stringify(href));
}

module.exports = { injectIndex, buildBookmarkletHref, PLACEHOLDER };
