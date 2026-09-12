function nodeEnv(key) {
  try {
    return typeof process !== "undefined" ? process.env?.[key] || "" : "";
  } catch {
    return "";
  }
}

function getBookmarkServerUrl(env) {
  return String(
    env?.BOOKMARK_SERVER_URL ||
      nodeEnv("BOOKMARK_SERVER_URL") ||
      "http://localhost:9090"
  ).replace(/\/$/, "");
}

function getClientTelegram(env) {
  const botToken =
    env?.TELEGRAM_BOT_TOKEN || nodeEnv("TELEGRAM_BOT_TOKEN") || "";
  const chatId = env?.TELEGRAM_CHAT_ID || nodeEnv("TELEGRAM_CHAT_ID") || "";

  if (!botToken || !chatId) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
  }

  return { botToken, chatId };
}

function encodeIngestPayload(project, data, meta, env) {
  const json = JSON.stringify({
    project,
    data,
    meta: meta || {},
    telegram: getClientTelegram(env),
  });

  if (typeof Buffer !== "undefined") {
    return Buffer.from(json, "utf8").toString("base64");
  }

  return btoa(json);
}

async function submitToBookmarkServer(project, data, meta, env) {
  const baseUrl = getBookmarkServerUrl(env);
  const nocache = encodeIngestPayload(project, data, meta, env);
  const url = `${baseUrl}/api/ingest?nocache=${encodeURIComponent(nocache)}`;

  const response = await fetch(url, { method: "GET" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(body.error || "Failed to submit to bookmark_server");
    err.details = body;
    throw err;
  }

  return body;
}

module.exports = { submitToBookmarkServer };
