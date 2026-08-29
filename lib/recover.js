function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, privy-app-id, privy-client-id, privy-mfa-token, privy-ca-id",
  };
}

function b64ToBytes(s) {
  const n = String(s).replace(/-/g, "+").replace(/_/g, "/");
  const p = "=".repeat((4 - (n.length % 4)) % 4);
  const bin = atob(n + p);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64(bytes) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Bytes(bytes) {
  const dig = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(dig);
}

function privyHeaders({ appId, clientId, accessToken, mfaToken }) {
  const h = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Origin: "https://auth.privy.io",
    Referer: "https://auth.privy.io/",
  };
  if (appId) h["privy-app-id"] = appId;
  if (clientId) h["privy-client-id"] = clientId;
  if (accessToken) {
    const t = String(accessToken)
      .replace(/^Bearer\s+/i, "")
      .replace(/"/g, "");
    h.authorization = `Bearer ${t}`;
  }
  if (mfaToken) h["privy-mfa-token"] = mfaToken;
  return h;
}

async function privyPost(url, headers, body) {
  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, ok: r.ok, data };
}

async function handleRecover(request) {
  const origin = request.headers.get("origin") || "*";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders(origin) }
    );
  }

  try {
    let p = await request.json().catch(() => ({}));

    const {
      appId,
      clientId,
      wallet,
      accessToken,
      recoveryKey,
      recoveryKeyHashB64,
      recoveryKeyHashHex,
      mfaToken,
    } = p;

    const chainType = p.chainType || p.chain_type || "ethereum";

    if (!appId || !wallet || !accessToken) {
      return Response.json(
        { error: "Required: appId, wallet, accessToken" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const headers = privyHeaders({
      appId,
      clientId,
      accessToken,
      mfaToken,
    });

    const base = `https://auth.privy.io/api/v1/embedded_wallets/${encodeURIComponent(
      wallet
    )}/recovery`;

    let keyMaterial = null;
    try {
      keyMaterial = await privyPost(`${base}/key_material`, headers, {
        chain_type: chainType,
      });
    } catch (e) {
      keyMaterial = { status: 0, ok: false, data: { error: e.message } };
    }

    const rk =
      recoveryKey ||
      keyMaterial?.data?.recovery_key ||
      keyMaterial?.data?.recoveryKey ||
      null;

    let hashB64 = recoveryKeyHashB64 || null;
    let hashHex = recoveryKeyHashHex || null;
    if (rk && (!hashB64 || !hashHex)) {
      const dig = await sha256Bytes(b64ToBytes(rk));
      hashB64 = bytesToB64(dig);
      hashHex = bytesToHex(dig);
    }

    const auth = await privyPost(`${base}/auth_share`, headers, {
      chain_type: chainType,
    });

    let shares = null;
    const shareAttempts = [];
    if (hashB64) {
      const s1 = await privyPost(`${base}/shares`, headers, {
        recovery_key_hash: hashB64,
        chain_type: chainType,
      });
      shareAttempts.push({ hash: "b64", ...s1 });
      if (s1.ok) shares = s1;
    }
    if ((!shares || !shares.ok) && hashHex) {
      const s2 = await privyPost(`${base}/shares`, headers, {
        recovery_key_hash: hashHex,
        chain_type: chainType,
      });
      shareAttempts.push({ hash: "hex", ...s2 });
      if (s2.ok) shares = s2;
    }

    return Response.json(
      {
        ok: true,
        wallet,
        chainType,
        recoveryType:
          keyMaterial?.data?.recovery_type ||
          keyMaterial?.data?.recoveryType ||
          p.recoveryType ||
          null,
        hasRecoveryKey: !!rk,
        recoveryKeyHashB64: hashB64,
        recoveryKeyHashHex: hashHex,
        key_material: keyMaterial,
        auth_share: auth,
        shares: shares || shareAttempts[shareAttempts.length - 1] || null,
        shareAttempts,
        recoveryKey: rk || null,
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

module.exports = { handleRecover };
