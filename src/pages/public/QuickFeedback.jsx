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
  CircularProgress,
} from "@mui/material";
import { feedbackApi } from "../../api/feedbackApi";

export default function QuickFeedback() {
  const { orgId, promptId } = useParams();
  const { search } = useLocation();
  const qs = useMemo(() => new URLSearchParams(search), [search]);

  // Embed/theming
  const isEmbed = qs.get("embed") === "1";
  const theme = (qs.get("theme") || "auto").toLowerCase();
  const sourceParam = qs.get("source");
  const source = sourceParam || (isEmbed ? "embed" : "web");

  // IMPORTANT: disable child->parent resizes by default for plain iframes
  const allowResizePings = qs.get("resize") === "1";

  // State
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const rootRef = useRef(null);

  // Safe, opt-in resize (off by default)
  const postResize = useCallback(() => {
    if (!isEmbed || !allowResizePings) return;
    const h =
      (rootRef.current?.scrollHeight ?? 0) ||
      document.body.scrollHeight ||
      document.documentElement.scrollHeight ||
      520;
    // parent won’t receive this unless you add a listener,
    // but we keep the code gated for future use.
    window.parent?.postMessage?.({ type: "lll:resize", height: h }, "*");
  }, [isEmbed, allowResizePings]);

  // One mild resize after mount (only if allowed)
  useEffect(() => {
    if (!isEmbed || !allowResizePings) return;
    const t = setTimeout(postResize, 120);
    return () => clearTimeout(t);
  }, [isEmbed, allowResizePings, postResize]);

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
      await feedbackApi.create({
        orgId,
        promptId,
        rating: Number(rating) || 0,
        text: text?.trim() || null,
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

  // Submit on Ctrl+Enter / Cmd+Enter
  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
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
      <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
        How was your experience?
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack spacing={2} onKeyDown={onKeyDown}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "center" }}>
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
          placeholder="What went great? What could be better?"
          multiline
          minRows={3}
          key="opttext"
          value={text}
          onChange={(e) => setText(e.target.value)}
          // No focus/blur handlers needed now that resizes are disabled.
          inputProps={{ dir: "ltr" }}
          InputProps={{
            sx: {
              "& .MuiInputBase-inputMultiline": {
                overflow: "auto",
                maxHeight: 220, // keeps inner scrolling neat
              },
              "& input, & textarea": { direction: "ltr", textAlign: "left" },
            },
          }}
        />

        <Button
          variant="contained"
          onClick={submit}
          disabled={submitting}
          endIcon={submitting ? <CircularProgress size={18} /> : null}
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>

        {!isEmbed && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            Org: {orgId} • Prompt: {promptId}
          </Typography>
        )}
      </Stack>
    </Shell>
  );
}
