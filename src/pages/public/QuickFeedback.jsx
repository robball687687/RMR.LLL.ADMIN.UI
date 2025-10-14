// src/pages/public/QuickFeedback.jsx
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
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

  // Embed/theming
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

  // Contact (optional, shown when rating !== 5)
  const [okToContact, setOkToContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [preferred, setPreferred] = useState("email"); // email|phone|sms
  const [bestTime, setBestTime] = useState(""); // free text
  const [reason, setReason] = useState("");

  // Helper: whether contact section is visible
  const showContact = Number(rating) !== 5;

  // --- STRICT: Only send height on mount / section toggle / after submit
  const postResize = () => {
    if (!isEmbed) return;
    const h =
      (rootRef.current?.scrollHeight ?? 0) ||
      document.body.scrollHeight ||
      document.documentElement.scrollHeight ||
      520;
    window.parent.postMessage({ type: "lll:resize", height: h }, "*");
  };

  // Initial paints only (no observers)
  useEffect(() => {
    if (!isEmbed) return;
    const t1 = setTimeout(postResize, 60);
    const t2 = setTimeout(postResize, 220);
    const t3 = setTimeout(postResize, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isEmbed]);

  // When contact section shows/hides or thanks screen appears, resize once
  useEffect(() => {
    if (!isEmbed) return;
    const t = setTimeout(postResize, 120);
    return () => clearTimeout(t);
  }, [isEmbed, showContact, done]);

  // Build contact object only if opted-in and any field present
  const buildContactObject = () => {
    if (!okToContact) return undefined;
    const any =
      contactName || contactEmail || contactPhone || preferred || bestTime || reason;
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

    // Primary attempt: include contact/meta fields (backend may ignore/accept)
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
      // Fallback: merge contact into text if API doesn't accept extra fields
      try {
        const mergedText =
          (text?.trim() || "") +
          (contact
            ? `\n\n---\nContact opt-in:\nName: ${contact.name || "-"}\nEmail: ${contact.email || "-"}\nPhone: ${contact.phone || "-"}\nPreferred: ${contact.preferred || "-"}\nBest time: ${contact.bestTime || "-"}\nReason: ${contact.reason || "-"}`
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
      setTimeout(postResize, 60); // one more after thanks screen
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
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
          We really appreciate it.
        </Typography>
      </Shell>
    );
  }

  return (
    <Shell>
      <Typography variant="h6" sx={{ mb: 2 }}>
        How was your experience?
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
          // Let the textarea grow internally and scroll; do NOT trigger outer resize
          // (no onFocus/onBlur handlers; no resize posts during typing)
          value={text}
          onChange={(e) => setText(e.target.value)}
          inputProps={{ dir: "ltr" }}
          InputProps={{
            sx: {
              "& .MuiInputBase-inputMultiline": {
                overflow: "auto",
                // Optional: limit visual growth to keep iframe stable
                maxHeight: 220,
              },
              "& input, & textarea": { direction: "ltr", textAlign: "left" },
            },
          }}
        />

        {/* Contact section for non-5-star ratings (triggers a single resize via effect) */}
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
              If you’d like, leave your info and the best way to reach you. We’ll follow up to fix things.
            </Typography>

            <TextField
              select
              label="What could be better? (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              size="small"
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
              />
              <TextField
                label="Email (optional)"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                fullWidth
                size="small"
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Phone (optional)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Preferred contact (email/phone/sms)"
                value={preferred}
                onChange={(e) => setPreferred(e.target.value)}
                size="small"
              />
            </Stack>

            <TextField
              label="Best time to reach you (optional)"
              value={bestTime}
              onChange={(e) => setBestTime(e.target.value)}
              size="small"
              fullWidth
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

        <Button variant="contained" onClick={submit}>Submit</Button>

        {!isEmbed && (
          <Typography variant="caption" color="text.secondary">
            Org: {orgId} • Prompt: {promptId}
          </Typography>
        )}
      </Stack>
    </Shell>
  );
}
