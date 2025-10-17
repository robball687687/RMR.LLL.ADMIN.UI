(() => {
  // ----------------------- Config helpers -----------------------
  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  const PUBLIC_BASE = SCRIPT_SRC.replace(/\/embed\/quickfeedback-noiframe\.js(\?.*)?$/, "");
  const DEFAULT_API_BASE = PUBLIC_BASE.replace(/\/embed$/, ""); // assume your app root

  const STAR = "★";
  const EMPTY = "☆";

  // When should the follow-up form appear?
  // 'not4' => show when rating !== 4
  // 'lt5'  => show when rating < 5
  // 'lte3' => show when rating <= 3
  const FOLLOWUP_SHOWS_WHEN = "lt5"; // <- matches your request

  const REASONS = [
    "Food quality",
    "Wait time",
    "Service",
    "Cleanliness",
    "Pricing",
    "Order accuracy",
    "Other",
  ];

  // Avoid double-registering
  if (customElements.get("lll-feedback")) return;

  // ----------------------- Styles -----------------------
  const STYLE = `
:host{all:initial;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#0f172a}
*{box-sizing:border-box}
button{font:inherit}
a{color:inherit}

.card{
  width:100%;max-width:520px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;
  box-shadow:0 10px 30px rgba(0,0,0,.06); padding:18px;
}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.title{font-weight:700;font-size:18px;letter-spacing:.2px}
.subtitle{font-size:13px;color:#64748b}
.hr{height:1px;background:linear-gradient(90deg,#0000,#e5e7eb,#0000);margin:10px 0 14px}

.stack{display:flex;flex-direction:column;gap:12px}
.row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

.stars{display:flex;gap:6px;user-select:none}

.star{
  font-size:24px;
  line-height:1;
  cursor:pointer;
  border:none;
  background:transparent;
  padding:4px 6px;
  border-radius:8px;
  transition:transform .08s ease, background-color .12s ease;
  color:#facc15;              /* ← yellow stars */
  text-shadow:0 0 3px rgba(0,0,0,.2);
}

.star:hover{
  transform:translateY(-1px);
  background:rgba(250,204,21,.15);  /* subtle amber hover */
}

:host([theme="dark"]) .star{
  color:#fde047;              /* slightly lighter yellow for dark mode */
}

:host([theme="dark"]) .star:hover{
  background:rgba(253,224,71,.15);
}

textarea{
  width:100%;min-height:104px;resize:vertical;padding:12px 12px;border:1px solid #e5e7eb;border-radius:12px;
  font:inherit;line-height:1.5; background:#fff; color:#0f172a;
}
textarea::placeholder{color:#94a3b8}
.input, select{
  width:100%;height:38px;padding:8px 10px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;font:inherit;color:#0f172a;
}
select{height:40px}

.grid{display:grid;grid-template-columns:1fr;gap:10px}
@media (min-width: 520px){ .grid-2{grid-template-columns:1fr 1fr} }

.helper{font-size:12px;color:#64748b}
.badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#475569;background:#f1f5f9;padding:4px 8px;border-radius:9999px}

.alert{padding:10px;border-radius:12px;border:1px solid #fecaca;background:#fff1f2;color:#991b1b;font-size:14px}
.hidden{display:none !important}

.actions{display:flex;gap:8px;justify-content:flex-end;margin-top:4px}
.btn{
  border-radius:9999px;padding:10px 14px;border:1px solid #e5e7eb;background:#111;color:#fff;cursor:pointer;min-width:100px;
}
.btn[disabled]{opacity:.7;cursor:not-allowed}
.btn-outline{background:#fff;color:#111}

.fab{position:fixed;right:20px;bottom:20px;z-index:99999}
.fab > .btn{box-shadow:0 10px 30px rgba(0,0,0,.18)}

.backdrop{
  position:fixed;inset:0;background:rgba(0,0,0,.38);display:flex;align-items:center;justify-content:center;z-index:99998
}
.modal{ width:min(92vw,520px); border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.2); padding:18px }

/* Collapse (follow-up) */
.collapse{overflow:hidden;transition:max-height .18s ease;max-height:0}
.collapse.open{max-height:700px}

/* Dark */
:host([theme="dark"]){color:#e5e5e5}
:host([theme="dark"]) .card,
:host([theme="dark"]) .modal{ background:#111; border-color:#333; box-shadow: 0 20px 60px rgba(0,0,0,.6) }
:host([theme="dark"]) .subtitle{ color:#9aa3ad }
:host([theme="dark"]) .hr{ background:linear-gradient(90deg,#0000,#252525,#0000) }
:host([theme="dark"]) textarea,
:host([theme="dark"]) .input,
:host([theme="dark"]) select{ background:#0f0f0f; color:#e5e5e5; border-color:#333 }
:host([theme="dark"]) .star:hover{ background:#151515 }
:host([theme="dark"]) .badge{ background:#1f2937; color:#cbd5e1 }
:host([theme="dark"]) .btn{ background:#fff; color:#111; border-color:#333 }
:host([theme="dark"]) .btn-outline{ background:#111; color:#e5e5e5; border-color:#333 }
:host([theme="dark"]) .alert{ border-color:#7f1d1d; background:#450a0a; color:#fecaca }
`;

  // ----------------------- Utilities -----------------------
  const showFollowupFor = (rating) => {
    if (FOLLOWUP_SHOWS_WHEN === "not4") return Number(rating) !== 4;
    if (FOLLOWUP_SHOWS_WHEN === "lt5")  return Number(rating) < 5;
    if (FOLLOWUP_SHOWS_WHEN === "lte3") return Number(rating) <= 3;
    return false;
  };

  // ----------------------- Component -----------------------
  class LLLFeedback extends HTMLElement {
    static get observedAttributes() {
      return ["org-id","prompt-id","api-base","mode","theme","source","button-label"];
    }

    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: "open" });

      // state
      this._rating = 5;
      this._text = "";
      this._submitting = false;
      this._done = false;

      // follow-up fields
      this._fu_reason = "";
      this._fu_name = "";
      this._fu_email = "";
      this._fu_phone = "";
      this._fu_pref = "email";
      this._fu_time = "";

      // config
      this._cfg = {
        orgId: "",
        promptId: "",
        apiBase: "",
        mode: "inline", // "inline" | "button"
        theme: "auto",
        source: "web",
        buttonLabel: "💬 Feedback",
      };
    }

    connectedCallback() {
      this._readAttributes();
      this._applyThemeAttr();
      this._render();
    }

    attributeChangedCallback() {
      this._readAttributes();
      this._applyThemeAttr();
      this._render();
    }

    _readAttributes() {
      const a = (n, d = "") => (this.getAttribute(n) ?? d);
      this._cfg.orgId = a("org-id", this._cfg.orgId);
      this._cfg.promptId = a("prompt-id", this._cfg.promptId);
      this._cfg.apiBase = (a("api-base", this._cfg.apiBase || DEFAULT_API_BASE) || "").replace(/\/+$/,"");
      this._cfg.mode = (a("mode", this._cfg.mode) || "inline").toLowerCase();
      this._cfg.theme = (a("theme", this._cfg.theme) || "auto").toLowerCase();
      this._cfg.source = a("source", this._cfg.source) || "web";
      this._cfg.buttonLabel = a("button-label", this._cfg.buttonLabel) || "💬 Feedback";
    }

    _applyThemeAttr() {
      const th = this._cfg.theme;
      if (th === "dark") this.setAttribute("theme","dark");
      else this.removeAttribute("theme");
    }

    _setRating(v) { this._rating = Number(v) || 0; this._updateStars(); this._toggleFollowup(); }
    _setText(v) { this._text = v; }

    _apiUrl() { return `${this._cfg.apiBase}/api/feedback`; }

    _mergeFollowupIntoText(rawText) {
      const any =
        this._fu_reason || this._fu_name || this._fu_email || this._fu_phone || this._fu_pref || this._fu_time;
      if (!showFollowupFor(this._rating) || !any) return (rawText || "").trim();

      const block =
        `\n\n---\nFollow-up details:\n` +
        `Reason: ${this._fu_reason || "-"}\n` +
        `Name: ${this._fu_name || "-"}\n` +
        `Email: ${this._fu_email || "-"}\n` +
        `Phone: ${this._fu_phone || "-"}\n` +
        `Preferred: ${this._fu_pref || "-"}\n` +
        `Best time: ${this._fu_time || "-"}`;

      return `${(rawText || "").trim()}${block}`;
    }

    async _submit() {
      if (this._submitting) return;
      this._submitting = true; this._updateSubmitState();

      const { orgId, promptId, source } = this._cfg;
      if (!orgId || !promptId) {
        this._showError("Missing org or prompt information.");
        this._submitting = false; this._updateSubmitState();
        return;
      }

      // Combine base text + follow-up block (per your request)
      const mergedText = this._mergeFollowupIntoText(this._text);

      try {
        const res = await fetch(this._apiUrl(), {
          method: "POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify({
            orgId,
            promptId,
            rating: Number(this._rating) || 0,
            text: mergedText || null,
            source
          }),
          credentials: "omit"
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          const msg = d?.detail || d?.title || `${res.status} ${res.statusText}`;
          throw new Error(msg);
        }
        this._done = true;
        this._render();
      } catch (e) {
        this._showError(e.message || "Failed to submit feedback.");
      } finally {
        this._submitting = false; this._updateSubmitState();
      }
    }

    _showError(msg) {
      const el = this._shadow.querySelector(".alert");
      if (!el) return;
      el.textContent = msg || "";
      el.classList.remove("hidden");
    }
    _clearError() {
      const el = this._shadow.querySelector(".alert");
      if (!el) return;
      el.textContent = "";
      el.classList.add("hidden");
    }

    _updateSubmitState() {
      const btn = this._shadow.querySelector(".btn-submit");
      if (btn) {
        btn.disabled = !!this._submitting;
        btn.textContent = this._submitting ? "Submitting…" : "Submit";
      }
    }

    _updateStars() {
      const stars = this._shadow.querySelectorAll(".star");
      if (!stars.length) return;
      for (let i=0;i<stars.length;i++) {
        const idx = i+1;
        stars[i].textContent = (idx <= this._rating) ? STAR : EMPTY;
        stars[i].setAttribute("aria-pressed", (idx <= this._rating) ? "true":"false");
      }
      const label = this._shadow.querySelector(".rating-label");
      if (label) label.textContent = `Rating: ${this._rating}/5`;
    }

    _toggleFollowup() {
      const c = this._shadow.querySelector(".collapse");
      if (!c) return;
      if (showFollowupFor(this._rating)) c.classList.add("open");
      else c.classList.remove("open");
    }

    // ---------- UI ----------
    _renderCard(container) {
      const card = document.createElement("div");
      card.className = "card";

      const alert = document.createElement("div");
      alert.className = "alert hidden";
      card.appendChild(alert);

      // Done screen
      if (this._done) {
        const wrap = document.createElement("div");
        wrap.className = "stack";
        wrap.innerHTML = `
          <div class="title">Thanks for your feedback!</div>
          <div class="subtitle">We really appreciate it.</div>
        `;
        card.appendChild(wrap);
        container.appendChild(card);
        return;
      }

      const header = document.createElement("div");
      header.className = "header";
      header.innerHTML = `<div>
        <div class="title">How was your experience?</div>
        <div class="subtitle">Your feedback helps us improve.</div>
      </div>`;
      card.appendChild(header);
      card.appendChild(el("div",{class:"hr"}));

      const stack = document.createElement("div");
      stack.className = "stack";

      // Rating row
      const row = document.createElement("div");
      row.className = "row";
      const label = document.createElement("div");
      label.className = "badge rating-label";
      label.textContent = `Rating: ${this._rating}/5`;
      const stars = document.createElement("div");
      stars.className = "stars";
      for (let i=1;i<=5;i++){
        const b = document.createElement("button");
        b.type = "button";
        b.className = "star";
        b.setAttribute("aria-label", `${i} star`);
        b.textContent = (i <= this._rating) ? STAR : EMPTY;
        b.addEventListener("click", () => { this._setRating(i); this._clearError(); });
        stars.appendChild(b);
      }
      row.appendChild(label);
      row.appendChild(stars);
      stack.appendChild(row);

      // Comment
      const ta = document.createElement("textarea");
      ta.placeholder = "Tell us more (optional)";
      ta.value = this._text;
      ta.addEventListener("input", () => { this._setText(ta.value); });
      ta.addEventListener("focus", () => this._clearError());
      stack.appendChild(ta);

      // Follow-up (collapsible)
      const follow = document.createElement("div");
      follow.className = "collapse";
      follow.innerHTML = `
        <div class="helper">Help us make this right</div>
        <div class="grid grid-2">
          <label>
            <div class="helper" style="margin-bottom:6px">What could be better? (optional)</div>
            <select class="input fu-reason">
              <option value=""></option>
              ${REASONS.map(r=>`<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("")}
            </select>
          </label>
          <label>
            <div class="helper" style="margin-bottom:6px">Preferred contact (email/phone/sms)</div>
            <input class="input fu-pref" placeholder="email" value="${escapeAttr(this._fu_pref)}" />
          </label>
        </div>
        <div class="grid grid-2">
          <label>
            <div class="helper" style="margin-bottom:6px">Name (optional)</div>
            <input class="input fu-name" />
          </label>
          <label>
            <div class="helper" style="margin-bottom:6px">Email (optional)</div>
            <input class="input fu-email" type="email" />
          </label>
        </div>
        <div class="grid grid-2">
          <label>
            <div class="helper" style="margin-bottom:6px">Phone (optional)</div>
            <input class="input fu-phone" />
          </label>
          <label>
            <div class="helper" style="margin-bottom:6px">Best time to reach you (optional)</div>
            <input class="input fu-time" placeholder="e.g., afternoons" />
          </label>
        </div>
      `;
      stack.appendChild(follow);

      // Bind follow-up inputs
      follow.querySelector(".fu-reason").addEventListener("change", (e) => this._fu_reason = e.target.value);
      follow.querySelector(".fu-name").addEventListener("input", (e) => this._fu_name = e.target.value);
      follow.querySelector(".fu-email").addEventListener("input", (e) => this._fu_email = e.target.value);
      follow.querySelector(".fu-phone").addEventListener("input", (e) => this._fu_phone = e.target.value);
      follow.querySelector(".fu-pref").addEventListener("input", (e) => this._fu_pref = e.target.value);
      follow.querySelector(".fu-time").addEventListener("input", (e) => this._fu_time = e.target.value);

      // Open/close based on current rating
      if (showFollowupFor(this._rating)) follow.classList.add("open");

      // Actions
      const actions = document.createElement("div");
      actions.className = "actions";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "btn btn-outline";
      cancel.textContent = "Cancel";
      cancel.addEventListener("click", () => {
        this._text = ""; this._rating = 5;
        this._fu_reason = this._fu_name = this._fu_email = this._fu_phone = "";
        this._fu_pref = "email"; this._fu_time = "";
        this._clearError(); this._render();
      });
      const submit = document.createElement("button");
      submit.type = "button";
      submit.className = "btn btn-submit";
      submit.textContent = this._submitting ? "Submitting…" : "Submit";
      submit.disabled = !!this._submitting;
      submit.addEventListener("click", () => this._submit());
      actions.appendChild(cancel);
      actions.appendChild(submit);

      stack.appendChild(actions);

      card.appendChild(stack);
      container.appendChild(card);
    }

    _renderInline() {
      const root = document.createElement("div");
      this._renderCard(root);
      return root;
    }

    _renderButton() {
      const wrap = document.createElement("div");
      wrap.className = "fab";
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = this._cfg.buttonLabel || "💬 Feedback";
      btn.addEventListener("click", () => this._openModal());
      wrap.appendChild(btn);
      return wrap;
    }

    _openModal() {
      if (this._modalHost) return;
      const host = document.createElement("div");
      this._modalHost = host;
      const close = () => { host.remove(); this._modalHost = null; };

      const backdrop = document.createElement("div");
      backdrop.className = "backdrop";
      backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });

      const modal = document.createElement("div");
      modal.className = "modal";

      const tmpSelfDone = this._done;
      this._done = false; // keep form visible even if already done, until closed
      this._renderCard(modal);
      this._done = tmpSelfDone;

      backdrop.appendChild(modal);
      host.appendChild(backdrop);
      document.body.appendChild(host);

      const onKey = (e) => { if (e.key === "Escape") close(); };
      window.addEventListener("keydown", onKey, { once: true });
    }

    _render() {
      const s = this._shadow;
      s.innerHTML = "";
      const style = document.createElement("style");
      style.textContent = STYLE;
      s.appendChild(style);

      if (this._cfg.mode === "button") s.appendChild(this._renderButton());
      else s.appendChild(this._renderInline());
    }
  }

  function el(tag, attrs) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  customElements.define("lll-feedback", LLLFeedback);
})();
