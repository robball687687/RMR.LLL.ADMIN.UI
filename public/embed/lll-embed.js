// src/pages/public/QuickFeedback.jsx
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  TextField,
  Rating,
  Alert,
  Collapse,
  FormControlLabel,
  Checkbox,
  MenuItem,
} from "@mui/material";
import { feedbackApi } from "../../api/feedbackApi";

const reasons = [
  "Food quality",
  "Wait time",
  "Service",
  "Cleanliness",
  "Pricing",
  "Order accuracy",
  "Other",
];

export default function QuickFeedback() {
  const { orgId, promptId } = useParams();
  const { search } = useLocation();
  const qs = useMemo(() => new URLSearchParams(search), [search]);

  const isEmbed = qs.get("embed") === "1";
  const theme = (qs.get("theme") || "auto").toLowerCase();
  const sourceParam = qs.get("source");
  const source = sourceParam || (isEmbed ? "embed" : "web");

  // State
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef(null);

  // Contact info
  const [okToContact, setOkToContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [preferred, setPreferred] = useState("email");
  const [bestTime, setBestTime] = useState("");
  const [reason, setReason] = useState("");

  const showContact = Number(rating) !== 5;

  // --- Focus guard ---
  const typingRef = useRef(false);
  const idleTimerRef = useRef(0);

  // Auto-resize for embeds (pause during typing)
  useEffect(() => {
    if (!isEmbed) return;

    const send = () => {
      const h =
        (rootRef.current?.scrollHeight ?? 0) ||
        document.body.scrollHeight ||
        document.documentElement.scrollHeight ||
        520;
      window.parent.postMessage({ type: "lll:resize", height: h }, "*");
    };

    const debouncedSend = () => {
      if (typingRef.current) return;
      if (send._busy) return;
      send._busy = true;
      requestAnimationFrame(() => {
        send();
        send._busy = false;
      });
    };

    const ro = new ResizeObserver(() => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(debouncedSend, 250);
    });

    if (rootRef.current) ro.observe(rootRef.current);

    const t1 = setTimeout(send, 60);
    const t2 = setTimeout(send, 220);
    const t3 = setTimeout(send, 600);

    return () => {
      ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(idleTimerRef.current);
    };
  }, [isEmbed, done, showContact]);

  // --- Build contact object ---
  const buildContactObject = () => {
    if (!okToContact) return undefined;
    const any =
      contactName ||
      contactEmail ||
      contactPhone ||
      preferred ||
      bestTime ||
      reason;
    if (!any) return undefined;
    return {
      okToContact: true,
      name: contactName || null,
      email: contactEmail || null,
      phone: contactPhone || null,
      preferred: preferred || null,
      bestTime: bestTime || null,
      reason: reason || null,
    };
  };

  const submit = async () => {
    setError("");
    const contact = buildContactObject();

    const payload = {
      orgId,
      promptId,
      rating: Number(rating),
      text: text?.trim() || null,
      source,
      contact,
    };

    try {
      await feedbackApi.create(payload);
      afterSubmit();
    } catch (e1) {
      try {
        const mergedText =
          (text?.trim() || "") +
          (contact
            ? `\n\n---\nContact opt-in:\nName: ${contact.name || "-"}\nEmail: ${
                contact.email || "-"
              }\nPhone: ${contact.phone || "-"}\nPreferred: ${
                contact.preferred || "-"
              }\nBest time: ${contact.bestTime || "-"}\nReason: ${
                contact.reason || "-"
              }`
            : "");
        await feedbackApi.create({
          orgId,
          promptId,
          rating: Number(rating),
          text: mergedText || null,
          source,
        });
        afterSubmit();
      } catch (e2) {
        const d = e2?.response?.data;
        setError(d?.detail || d?.title || e2.message);
      }
    }
  };

  const afterSubmit = () => {
    setDone(true);
    if (isEmbed) {
      window.parent.postMessage({ type: "lll:submitted", ok: true }, "*");
      setTimeout(() => {
        window.parent.postMessage(
          { type: "lll:resize", height: document.body.scrollHeight || 520 },
          "*"
        );
      }, 60);
    }
  };

  const Shell = ({ children }) => (
    <Box
      ref={rootRef}
      data-embed={isEmbed ? "1" : "0"}
      data-theme={theme}
      sx={{
        display: "grid",
        placeItems: "center",
        minHeight: isEmbed ? "unset" : "100vh",
        py: isEmbed ? 0 : 4,
      }}
    >
      <Paper
        elevation={isEmbed ? 0 : 1}
        sx={{
          p: isEmbed ? 2 : 3,
          width: "100%",
          maxWidth: 520,
          border: isEmbed ? "1px solid" : "none",
          borderColor: isEmbed ? "divider" : "transparent",
          borderRadius: 2,
          boxShadow: isEmbed ? "none" : undefined,
        }}
      >
        {children}
      </Paper>
    </Box>
  );

  if (done) {
    return (
      <Shell>
        <Typography variant="h5" sx={{ mb: 1, textAlign: "center" }}>
          Thanks for your feedback!
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center" }}
        >
          We really appreciate it.
        </Typography>
      </Shell>
    );
  }

  // ----------------------- Render Form -----------------------
  return (
    <Shell>
      <Typography variant="h6" sx={{ mb: 2 }}>
        How was your experience?
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body1">Rating:</Typography>
          <Rating
            value={rating}
            onChange={(_, v) => setRating(v || 0)}
            max={5}
            getLabelText={(value) => `${value} Star${value !== 1 ? "s" : ""}`}
          />
        </Stack>

        <TextField
          label="Tell us more (optional)"
          multiline
          minRows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => (typingRef.current = true)}
          onBlur={() => {
            typingRef.current = false;
            if (isEmbed) {
              const h =
                (rootRef.current?.scrollHeight ?? 0) ||
                document.body.scrollHeight ||
                document.documentElement.scrollHeight ||
                520;
              window.parent.postMessage({ type: "lll:resize", height: h }, "*");
            }
          }}
          inputProps={{ dir: "ltr" }}
          InputProps={{
            sx: {
              "& input, & textarea": { direction: "ltr", textAlign: "left" },
            },
          }}
        />

        {/* Contact section */}
        <Collapse in={showContact} unmountOnExit>
          <Stack
            spacing={1.5}
            sx={{
              mt: 1.5,
              p: 1.5,
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1.5,
            }}
          >
            <Typography variant="subtitle2">Help us make this right</Typography>
            <Typography variant="body2" color="text.secondary">
              If you’d like, leave your info and the best way to reach you. We’ll
              follow up to fix things.
            </Typography>

            <TextField
              select
              label="What could be better? (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              size="small"
              onFocus={() => (typingRef.current = true)}
              onBlur={() => (typingRef.current = false)}
            >
              {reasons.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Name (optional)"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                fullWidth
                size="small"
                onFocus={() => (typingRef.current = true)}
                onBlur={() => (typingRef.current = false)}
              />
              <TextField
                label="Email (optional)"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                fullWidth
                size="small"
                onFocus={() => (typingRef.current = true)}
                onBlur={() => (typingRef.current = false)}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Phone (optional)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                fullWidth
                size="small"
                onFocus={() => (typingRef.current = true)}
                onBlur={() => (typingRef.current = false)}
              />
              <TextField
                label="Preferred contact (email/phone/sms)"
                value={preferred}
                onChange={(e) => setPreferred(e.target.value)}
                size="small"
                onFocus={() => (typingRef.current = true)}
                onBlur={() => (typingRef.current = false)}
              />
            </Stack>

            <TextField
              label="Best time to reach you (optional)"
              value={bestTime}
              onChange={(e) => setBestTime(e.target.value)}
              size="small"
              fullWidth
              onFocus={() => (typingRef.current = true)}
              onBlur={() => (typingRef.current = false)}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={okToContact}
                  onChange={(e) => setOkToContact(e.target.checked)}
                />
              }
              label="It’s okay to contact me about this feedback"
            />
          </Stack>
        </Collapse>

        <Button variant="contained" onClick={submit}>
          Submit
        </Button>

        {!isEmbed && (
          <Typography variant="caption" color="text.secondary">
            Org: {orgId} • Prompt: {promptId}
          </Typography>
        )}
      </Stack>
    </Shell>
  );
}
