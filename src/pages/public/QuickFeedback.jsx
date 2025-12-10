// src/pages/public/QuickFeedback.jsx
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { feedbackApi } from "../../api/feedbackApi";

const FOLLOWUP_SHOWS_WHEN = "lt5";
const REASONS = ["Food quality","Wait time","Service","Cleanliness","Pricing","Order accuracy","Other"];
const STAR = "★";
const EMPTY = "☆";

const showFollowupFor = (r) =>
  FOLLOWUP_SHOWS_WHEN === "not4" ? Number(r) !== 4 :
  FOLLOWUP_SHOWS_WHEN === "lt5"  ? Number(r) < 5  :
  FOLLOWUP_SHOWS_WHEN === "lte3" ? Number(r) <= 3 : false;

export default function QuickFeedback() {
  const { orgId, promptId } = useParams();
  const { search } = useLocation();
  const qs = useMemo(() => new URLSearchParams(search), [search]);

  const isEmbed = qs.get("embed") === "1";
  const theme = (qs.get("theme") || "auto").toLowerCase();
  const source = (qs.get("source")) || (isEmbed ? "embed" : "web");
  const allowResizePings = qs.get("resize") === "1";

  // Keep re-renders to a minimum
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // 👇 Uncontrolled textarea: no state – no rerenders while typing
  const textRef = useRef(null);

  // Follow-up (these *do* re-render, but much less frequently than typing)
  const [fuReason, setFuReason] = useState("");
  const [fuName, setFuName] = useState("");
  const [fuEmail, setFuEmail] = useState("");
  const [fuPhone, setFuPhone] = useState("");
  const [fuPref, setFuPref] = useState("email");
  const [fuTime, setFuTime] = useState("");

  const rootRef = useRef(null);

  const postResize = useCallback(() => {
    if (!isEmbed || !allowResizePings) return;
    const h =
      (rootRef.current?.scrollHeight ?? 0) ||
      document.body.scrollHeight ||
      document.documentElement.scrollHeight ||
      520;
    window.parent?.postMessage?.({ type: "lll:resize", height: h }, "*");
  }, [isEmbed, allowResizePings]);

  useEffect(() => {
    if (!isEmbed || !allowResizePings) return;
    const t = setTimeout(postResize, 120);
    return () => clearTimeout(t);
  }, [isEmbed, allowResizePings, postResize]);

  // Resize only when follow-up visibility toggles
  useEffect(() => {
    if (!isEmbed || !allowResizePings) return;
    const t = setTimeout(postResize, 60);
    return () => clearTimeout(t);
  }, [rating, isEmbed, allowResizePings, postResize]);

  const mergeFollowupIntoText = (base) => {
    const any = fuReason || fuName || fuEmail || fuPhone || fuPref || fuTime;
    if (!showFollowupFor(rating) || !any) return (base || "").trim();
    return (
      `${(base || "").trim()}\n\n---\nFollow-up details:\n` +
      `Reason: ${fuReason || "-"}\n` +
      `Name: ${fuName || "-"}\n` +
      `Email: ${fuEmail || "-"}\n` +
      `Phone: ${fuPhone || "-"}\n` +
      `Preferred: ${fuPref || "-"}\n` +
      `Best time: ${fuTime || "-"}`
    );
  };

  const afterSubmit = () => {
    setDone(true);
    if (isEmbed && allowResizePings) {
      window.parent?.postMessage?.({ type: "lll:submitted", ok: true }, "*");
      setTimeout(postResize, 60);
    }
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");

    if (!orgId || !promptId) {
      setError("Missing org or prompt information.");
      setSubmitting(false);
      return;
    }

    try {
      const rawText = textRef.current?.value ?? "";
      const mergedText = mergeFollowupIntoText(rawText);
      await feedbackApi.create({
        orgId,
        promptId,
        rating: Number(rating) || 0,
        text: mergedText || null,
        source,
      });
      afterSubmit();
    } catch (e) {
      const d = e?.response?.data;
      setError(d?.detail || d?.title || e.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const Shell = ({ children }) => (
    <div
      ref={rootRef}
      data-theme={theme}
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: isEmbed ? "unset" : "100vh",
        padding: isEmbed ? 0 : 16,
      }}
    >
      <style>{BASE_STYLES}</style>
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 520,
          border: isEmbed ? "1px solid var(--line)" : "none",
          borderRadius: 16,
          padding: isEmbed ? 16 : 24,
          boxShadow: isEmbed ? "none" : "0 10px 30px rgba(0,0,0,.06)",
          background: "var(--bg)",
          color: "var(--fg)",
        }}
      >
        {children}
      </div>
    </div>
  );

  // Done screen
  if (done) {
    return (
      <Shell>
        <div className="stack">
          <div className="title">Thanks for your feedback!</div>
          <div className="subtitle">We really appreciate it. 🙏</div>
          {rating === 5 && (
          <div className="review-section">
            <div className="review-heading">
              Have a minute to leave a public review?
            </div>

            <div className="review-links">
              <a
                href="https://www.tripadvisor.com/Restaurant_Review-g41773-d23626374-Reviews-The_Mea_Thai_Cuisine-Plymouth_Massachusetts.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                🧭 Tripadvisor
              </a>
              <a
                href="https://www.yelp.com/biz/the-mea-thai-cuisine-plymouth"
                target="_blank"
                rel="noopener noreferrer"
              >
                🧡 Yelp
              </a>
              <a
                href="https://www.google.com/search?q=the+mea+thai+cuisine+plymouth"
                target="_blank"
                rel="noopener noreferrer"
              >
                🔍 Google
              </a>
              <a
                href="https://www.happycow.net/reviews/the-mea-plymouth-237894"
                target="_blank"
                rel="noopener noreferrer"
              >
                🌱 HappyCow
              </a>
            </div>

            <div className="review-note">
              🥟 Email a screenshot of your posted review to{" "}
              <a href="mailto:robball687@gmail.com">robball687@gmail.com</a> and
              we&apos;ll send you a coupon code for a <strong>free appetizer</strong>.
              One free appetizer per review, limit one free app per visit/order.
            </div>
          </div>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="header">
        <div>
          <div className="title">How was your experience?</div>
          <div className="subtitle">Your feedback helps us improve.</div>
        </div>
      </div>
      <div className="hr" />

      {error ? <div className="alert">{error}</div> : null}

      <div className="stack">
        {/* Rating (plain buttons, minimal state) */}
        <div className="row">
          <div className="badge">Rating: {rating}/5</div>
          <div className="stars" aria-label="Rating">
            {Array.from({ length: 5 }).map((_, i) => {
              const val = i + 1;
              const filled = val <= rating;
              return (
                <button
                  key={val}
                  type="button"
                  className="star"
                  aria-pressed={filled ? "true" : "false"}
                  aria-label={`${val} star`}
                  onClick={() => { setRating(val); setError(""); }}
                >
                  {filled ? STAR : EMPTY}
                </button>
              );
            })}
          </div>
        </div>

        {/* Uncontrolled textarea — focus stays rock solid */}
        <textarea
          ref={textRef}
          placeholder="Tell us more (optional)"
          onFocus={() => setError("")}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />

        {/* Follow-up (collapsible). Changing these can re-render, but not on every keystroke */}
        <div className={`collapse ${showFollowupFor(rating) ? "open" : ""}`}>
          <div className="helper">Help us make this right</div>

          <div className="grid grid-2">
            <label>
              <div className="helper" style={{ marginBottom: 6 }}>
                What could be better? (optional)
              </div>
              <select className="input" value={fuReason} onChange={(e) => setFuReason(e.target.value)}>
                <option value=""></option>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label>
              <div className="helper" style={{ marginBottom: 6 }}>Preferred contact (email/phone/sms)</div>
              <input className="input" placeholder="email" value={fuPref} onChange={(e) => setFuPref(e.target.value)} />
            </label>
          </div>

          <div className="grid grid-2">
            <label>
              <div className="helper" style={{ marginBottom: 6 }}>Name (optional)</div>
              <input className="input" value={fuName} onChange={(e) => setFuName(e.target.value)} />
            </label>
            <label>
              <div className="helper" style={{ marginBottom: 6 }}>Email (optional)</div>
              <input className="input" type="email" value={fuEmail} onChange={(e) => setFuEmail(e.target.value)} />
            </label>
          </div>

          <div className="grid grid-2">
            <label>
              <div className="helper" style={{ marginBottom: 6 }}>Phone (optional)</div>
              <input className="input" value={fuPhone} onChange={(e) => setFuPhone(e.target.value)} />
            </label>
            <label>
              <div className="helper" style={{ marginBottom: 6 }}>Best time to reach you (optional)</div>
              <input className="input" placeholder="e.g., afternoons" value={fuTime} onChange={(e) => setFuTime(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              if (textRef.current) textRef.current.value = "";
              setRating(5);
              setFuReason(""); setFuName(""); setFuEmail(""); setFuPhone(""); setFuPref("email"); setFuTime("");
              setError("");
            }}
          >
            Cancel
          </button>
          <button type="button" className="btn" disabled={submitting} onClick={submit}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>

        {!isEmbed && (
          <div className="helper" style={{ textAlign: "center", marginTop: 8 }}>
            Org: {orgId} • Prompt: {promptId}
          </div>
        )}
      </div>
    </Shell>
  );
}

const BASE_STYLES = `
:root{--fg:#0f172a;--muted:#64748b;--line:#e5e7eb;--bg:#fff}
*[data-theme="dark"]{--fg:#e5e5e5;--muted:#9aa3ad;--line:#333;--bg:#111}
*{box-sizing:border-box} body{margin:0}
.card{border:1px solid var(--line);border-radius:16px;background:var(--bg);color:var(--fg)}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.title{font-weight:700;font-size:18px;letter-spacing:.2px}
.subtitle{font-size:13px;color:var(--muted)}
.hr{height:1px;background:linear-gradient(90deg,#0000,var(--line),#0000);margin:10px 0 14px}
.stack{display:flex;flex-direction:column;gap:12px}
.row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.stars {
  display: flex;
  gap: 6px;
  user-select: none;
}

.star {
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 4px 6px;
  border-radius: 8px;
  transition: transform 0.08s ease, background-color 0.12s ease;
  color: #facc15; /* <-- bright yellow (Tailwind amber-400) */
  text-shadow: 0 0 3px rgba(0,0,0,0.2);
}

.star:hover {
  transform: translateY(-1px);
  background: rgba(250, 204, 21, 0.15);
}

*[data-theme="dark"] .star {
  color: #fde047; /* slightly lighter for dark mode */
}

*[data-theme="dark"] .star:hover {
  background: rgba(253, 224, 71, 0.15);
}

textarea{width:100%;min-height:104px;resize:vertical;padding:12px;border:1px solid var(--line);border-radius:12px;font:inherit;line-height:1.5;background:var(--bg);color:var(--fg)}
textarea::placeholder{color:#94a3b8}
.input, select{width:100%;height:38px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--bg);font:inherit;color:var(--fg)}
select{height:40px}
.grid{display:grid;grid-template-columns:1fr;gap:10px}
@media (min-width: 520px){ .grid-2{grid-template-columns:1fr 1fr} }
.helper{font-size:12px;color:var(--muted)}
.badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#475569;background:#f1f5f9;padding:4px 8px;border-radius:9999px}
*[data-theme="dark"] .badge{ background:#1f2937; color:#cbd5e1 }
.alert{padding:10px;border-radius:12px;border:1px solid #fecaca;background:#fff1f2;color:#991b1b;font-size:14px;margin-bottom:8px}
*[data-theme="dark"] .alert{border-color:#7f1d1d;background:#450a0a;color:#fecaca}
.collapse{overflow:hidden;transition:max-height .18s ease;max-height:0}
.collapse.open{max-height:700px}
.actions{display:flex;gap:8px;justify-content:flex-end;margin-top:4px}
.btn{border-radius:9999px;padding:10px 14px;border:1px solid var(--line);background:#111;color:#fff;cursor:pointer;min-width:100px}
.btn[disabled]{opacity:.7;cursor:not-allowed}
.btn-outline{background:var(--bg);color:#111}
*[data-theme="dark"] .btn{ background:#fff; color:#111; border-color:#333 }
*[data-theme="dark"] .btn-outline{ background:#111; color:#e5e5e5; border-color:#333 }

/* Small review callout on thank-you screen */
.review-section{
  margin-top:8px;
  padding:8px 10px;
  border-radius:12px;
  background:#f8fafc;
}
*[data-theme="dark"] .review-section{
  background:#020617;
}
.review-heading{
  font-size:12px;
  font-weight:500;
  margin-bottom:4px;
}
.review-links{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  font-size:12px;
}
.review-links a{
  text-decoration:underline;
}
.review-note{
  font-size:11px;
  color:var(--muted);
  margin-top:4px;
  line-height:1.4;
}
`;
