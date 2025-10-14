// public/embed/lll-embed.js
(() => {
  // ----------------------- Helpers & Constants -----------------------
  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  const PUBLIC_BASE = SCRIPT_SRC.replace(/\/embed\/lll-embed\.js(\?.*)?$/, "");
  const SEL = ".lll-prompt";
  const EVENT_RESIZE = "lll:resize";
  const EVENT_SUBMITTED = "lll:submitted";
  const EVENT_TYPING = "lll:typing"; // NEW: child says user is typing

  // Singleton guard
  if (window.__LLL_EMBED_ACTIVE__) return;
  window.__LLL_EMBED_ACTIVE__ = true;

  // Styles (scoped in Shadow DOM)
  const STYLE = `
    :host { all: initial; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
    .lll-btn {
      position: fixed; inset: auto 20px 20px auto;
      padding: 12px 16px; border-radius: 9999px; border: 1px solid #e5e7eb;
      background: #111; color: #fff; cursor: pointer; font-weight: 600;
      box-shadow: 0 10px 30px rgba(0,0,0,.15);
    }
    .pos-bottom-left { inset: auto auto 20px 20px; }
    .pos-bottom-right { inset: auto 20px 20px auto; }
    .inline-wrap {
      width: 100%; border-radius: 12px; overflow: hidden;
      border: 1px solid #e5e7eb; box-shadow: 0 8px 24px rgba(0,0,0,.08);
    }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.38);
      display: flex; align-items: center; justify-content: center;
    }
    .modal-card {
      width: min(92vw, var(--lll-modal-w, 520px));
      border-radius: 12px; overflow: hidden;
      background: #fff; border: 1px solid #e5e7eb; box-shadow: 0 20px 60px rgba(0,0,0,.2);
    }
    .modal-header {
      display:flex; align-items:center; justify-content:space-between;
      padding: 10px 14px; border-bottom:1px solid #eee; background:#fafafa;
    }
    .close-x { border:none; background:transparent; font-size:20px; cursor:pointer; line-height:1; }
    iframe { width:100%; border:0; display:block; }
    @media (prefers-color-scheme: dark) {
      .lll-btn { background:#fff; color:#111; border-color:#333; }
      .inline-wrap, .modal-card { background:#111; border-color:#333; box-shadow: 0 20px 60px rgba(0,0,0,.6); }
      .modal-header { background:#0f0f0f; border-color:#1f1f1f; color:#e5e5e5; }
    }
  `;

  // Throttle util
  const rafThrottle = (fn, gap = 120) => {
    let raf = 0, last = 0;
    const runner = () => {
      const now = Date.now();
      if (now - last < gap) { raf = requestAnimationFrame(runner); return; }
      last = now; raf = 0; fn();
    };
    return () => { if (!raf) raf = requestAnimationFrame(runner); };
  };

  const num = (v, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  function buildSrc({ orgId, promptId, theme, source }) {
    const url = new URL(`${PUBLIC_BASE}/f/${orgId}/${promptId}`);
    url.searchParams.set("embed", "1");
    if (theme) url.searchParams.set("theme", theme);
    if (source) url.searchParams.set("source", source);
    return url.toString();
  }

  // ----------------------- Renderers -----------------------
  function renderInline(el, cfg) {
    if (el.dataset.lllInited) return; el.dataset.lllInited = "1";
    const { orgId, promptId, theme, source, maxWidth, height, z, borderless } = cfg;

    const root = el.attachShadow({ mode: "open" });
    const styleTag = document.createElement("style"); styleTag.textContent = STYLE;

    const wrap = document.createElement("div");
    wrap.className = "inline-wrap";
    wrap.style.maxWidth = `${maxWidth}px`;
    if (z != null) wrap.style.zIndex = String(z);
    if (borderless) { wrap.style.border = "none"; wrap.style.boxShadow = "none"; }

    const iframe = document.createElement("iframe");
    iframe.title = "Feedback";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups";
    iframe.src = buildSrc({ orgId, promptId, theme, source });
    iframe.style.height = `${height}px`;

    wrap.appendChild(iframe);
    root.appendChild(styleTag);
    root.appendChild(wrap);

    trackRoot(root);
  }

  function renderButton(el, cfg) {
    if (el.dataset.lllInited) return; el.dataset.lllInited = "1";
    const { orgId, promptId, theme, source, position, z, btnLabel, btnBg, btnText, modalWidth } = cfg;

    const root = el.attachShadow({ mode: "open" });
    const styleTag = document.createElement("style"); styleTag.textContent = STYLE;

    const btn = document.createElement("button");
    btn.className = `lll-btn ${position === "bottom-left" ? "pos-bottom-left" : "pos-bottom-right"}`;
    btn.textContent = btnLabel || "💬 Feedback";
    if (z != null) btn.style.zIndex = String(z);
    if (btnBg) btn.style.background = btnBg;
    if (btnText) btn.style.color = btnText;
    btn.addEventListener("click", () => openModal({ orgId, promptId, theme, source, modalWidth }));

    root.appendChild(styleTag);
    root.appendChild(btn);

    trackRoot(root);
  }

  function openModal({ orgId, promptId, theme, source, modalWidth }) {
    const host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });

    const styleTag = document.createElement("style"); styleTag.textContent = STYLE;

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    const card = document.createElement("div");
    card.className = "modal-card";
    if (modalWidth) card.style.setProperty("--lll-modal-w", `${modalWidth}px`);

    const header = document.createElement("div");
    header.className = "modal-header";
    header.innerHTML = `<div>Share quick feedback</div>`;

    const closeX = document.createElement("button");
    closeX.className = "close-x";
    closeX.setAttribute("aria-label", "Close");
    closeX.textContent = "×";
    closeX.addEventListener("click", () => host.remove());

    const iframe = document.createElement("iframe");
    iframe.title = "Feedback";
    iframe.loading = "eager";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups";
    iframe.src = buildSrc({ orgId, promptId, theme, source });
    iframe.style.height = "520px";

    header.appendChild(closeX);
    card.appendChild(header);
    card.appendChild(iframe);
    backdrop.appendChild(card);

    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) host.remove(); });
    const onKey = (e) => { if (e.key === "Escape") host.remove(); };
    window.addEventListener("keydown", onKey);

    const onMsg = (ev) => {
      const data = ev?.data || {};
      if (data && data.type === EVENT_SUBMITTED) {
        host.remove();
        window.removeEventListener("message", onMsg);
        window.removeEventListener("keydown", onKey);
      }
    };
    window.addEventListener("message", onMsg);

    root.appendChild(styleTag);
    root.appendChild(backdrop);
    document.body.appendChild(host);

    trackRoot(root);
  }

  // ----------------------- Resize plumbing -----------------------
  const ROOTS = new Set();
  const LAST_H = new WeakMap(); // root -> last height
  let TYPING_LOCK = false;      // NEW: set by child via postMessage

  function trackRoot(root) { ROOTS.add(root); }

  const applyHeight = (h) => {
    // Never resize while typing is active (prevents textarea blur in child)
    if (TYPING_LOCK) return;

    // Some browsers blur if iframe is focused and height changes
    const ae = document.activeElement;
    if (ae && ae.tagName && ae.tagName.toUpperCase() === "IFRAME") return;

    ROOTS.forEach((root) => {
      const last = LAST_H.get(root) || 0;
      if (Math.abs(h - last) < 1) return;
      root.querySelectorAll("iframe").forEach((f) => { f.style.height = `${h}px`; });
      LAST_H.set(root, h);
    });
  };

  const onResizeMessage = (() => {
    const run = rafThrottle(() => {
      if (pendingHeight == null) return;
      applyHeight(pendingHeight);
    }, 120);
    let pendingHeight = null;

    return (ev) => {
      const data = ev?.data || {};
      if (!data) return;

      // NEW: typing lock messages from child
      if (data.type === EVENT_TYPING) {
        TYPING_LOCK = !!data.on;
        return;
      }

      if (data.type !== EVENT_RESIZE) return;

      // Optional: origin validation
      // const allowed = new URL(PUBLIC_BASE).origin;
      // if (ev.origin !== allowed) return;

      pendingHeight = Math.max(320, Number(data.height || 0));
      run();
    };
  })();

  window.addEventListener("message", onResizeMessage, { passive: true });

  // ----------------------- Init & Observe -----------------------
  function parseConfig(el) {
    const orgId = el.getAttribute("data-org-id");
    const promptId = el.getAttribute("data-prompt-id");
    const mode = (el.getAttribute("data-mode") || "button").toLowerCase();
    const theme = (el.getAttribute("data-theme") || "auto").toLowerCase();
    const position = (el.getAttribute("data-position") || "bottom-right").toLowerCase();
    const maxWidth = num(el.getAttribute("data-max-width"), 520);
    const height = num(el.getAttribute("data-height"), 520);
    const z = el.hasAttribute("data-z") ? num(el.getAttribute("data-z"), null) : null;
    const btnLabel = el.getAttribute("data-button-label") || "";
    const btnBg = el.getAttribute("data-button-bg") || "";
    const btnText = el.getAttribute("data-button-text") || "";
    const modalWidth = num(el.getAttribute("data-modal-width"), 520);
    const source = el.getAttribute("data-source") || "";
    const borderless = el.getAttribute("data-borderless") === "true";
    return { orgId, promptId, mode, theme, position, maxWidth, height, z, btnLabel, btnBg, btnText, modalWidth, source, borderless };
  }

  function initNode(el) {
    const cfg = parseConfig(el);
    if (!cfg.orgId || !cfg.promptId) return;
    if (cfg.mode === "inline") renderInline(el, cfg);
    else renderButton(el, cfg);
  }

  function initAll() { document.querySelectorAll(SEL).forEach(initNode); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll);
  else initAll();

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes && m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches && n.matches(SEL)) initNode(n);
        n.querySelectorAll && n.querySelectorAll(SEL).forEach(initNode);
      });
    }
  });
  mo.observe(document.documentElement || document.body, { childList: true, subtree: true });

  // Public API (optional)
  window.LLLEmbed = { refresh() { initAll(); }, version: "1.3.0" };
})();
