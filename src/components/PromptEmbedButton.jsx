import React, { useMemo, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, TextField, Typography, Tooltip, Tabs, Tab, MenuItem, Snackbar,
  IconButton, Select, FormControl, InputLabel
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

/**
 * PromptEmbedButton
 * Props:
 *  - publicBase: string (e.g., https://yourapp.com)
 *  - orgId: string (GUID)
 *  - promptId: string
 *  - promptName?: string
 *  - buttonVariant?: "text" | "outlined" | "contained"
 *  - size?: "small" | "medium" | "large"
 */
export default function PromptEmbedButton({
  publicBase,
  orgId,
  promptId,
  promptName = "Prompt",
  buttonVariant = "outlined",
  size = "small",
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("webc"); // webc | iframe | script
  const [snack, setSnack] = useState("");

  // Common options
  const [theme, setTheme] = useState("auto"); // auto|light|dark

  // Iframe options
  const [height, setHeight] = useState(520);
  const [maxWidth, setMaxWidth] = useState(480);

  // Legacy script options
  const [modeLegacy, setModeLegacy] = useState("button"); // button|inline
  const [position, setPosition] = useState("bottom-right"); // for button mode

  // Web component (no-iframe) options
  const [modeWebc, setModeWebc] = useState("inline"); // inline|button
  const [buttonLabel, setButtonLabel] = useState("💬 Feedback");
  const [apiBase, setApiBase] = useState(
    (publicBase || "").replace(/\/+$/, "")
  ); // usually your app root (must allow CORS)

  const baseTrimmed = useMemo(
    () => (publicBase || "").replace(/\/+$/, ""),
    [publicBase]
  );

  const link = useMemo(
    () => `${baseTrimmed}/f/${orgId}/${promptId}`,
    [baseTrimmed, orgId, promptId]
  );
  const legacyScriptSrc = useMemo(
    () => `${baseTrimmed}/embed/lll-embed.js`,
    [baseTrimmed]
  );
  const webcScriptSrc = useMemo(
    () => `${baseTrimmed}/embed/quickfeedback-noiframe.js`,
    [baseTrimmed]
  );

  // ---------- Snippets ----------
  const iframeSnippet = useMemo(
    () =>
`<iframe
  src="${link}?embed=1&theme=${theme}"
  style="width:100%;max-width:${maxWidth}px;height:${height}px;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.08)"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
  title="Feedback: ${escapeHtml(promptName)}"
></iframe>`,
    [link, theme, maxWidth, height, promptName]
  );

  const legacyScriptSnippet = useMemo(
    () =>
`<div class="lll-prompt"
     data-org-id="${orgId}"
     data-prompt-id="${promptId}"
     data-mode="${modeLegacy}"
     ${modeLegacy === "button" ? `data-position="${position}"` : ""}
     data-theme="${theme}"></div>
<script async src="${legacyScriptSrc}"></script>`,
    [orgId, promptId, modeLegacy, position, theme, legacyScriptSrc]
  );

  const webComponentSnippet = useMemo(() => {
    const attrs = [
      `org-id="${orgId}"`,
      `prompt-id="${promptId}"`,
      `api-base="${(apiBase || "").replace(/\/+$/, "")}"`,
      `mode="${modeWebc}"`,
      `theme="${theme}"`,
      `source="web"`,
    ];
    if (modeWebc === "button" && buttonLabel.trim()) {
      attrs.push(`button-label="${escapeAttr(buttonLabel)}"`);
    }
    return (
`<script src="${webcScriptSrc}" defer></script>

<lll-feedback
  ${attrs.join("\n  ")}
></lll-feedback>`
    );
  }, [orgId, promptId, apiBase, modeWebc, theme, buttonLabel, webcScriptSrc]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnack("Copied to clipboard");
    } catch {
      setSnack("Copy failed—select and copy manually");
    }
  };

  return (
    <>
      <Tooltip title="Embed widget">
        <Button variant={buttonVariant} size={size} onClick={() => setOpen(true)}>
          Embed
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Embed “{promptName}”</DialogTitle>

        <DialogContent dividers>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab value="webc" label="Web Component (Recommended)" />
            <Tab value="iframe" label="Iframe" />
            <Tab value="script" label="Legacy Script" />
          </Tabs>

          {/* Web Component */}
          {tab === "webc" && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                This embeds a <code>&lt;lll-feedback&gt;</code> web component—no iframe, professional styling, and no focus issues. Your API must allow CORS from the host site.
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Mode</InputLabel>
                  <Select
                    label="Mode"
                    value={modeWebc}
                    onChange={(e) => setModeWebc(e.target.value)}
                  >
                    <MenuItem value="inline">inline (embedded)</MenuItem>
                    <MenuItem value="button">button (floating)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    label="Theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <MenuItem value="auto">auto</MenuItem>
                    <MenuItem value="light">light</MenuItem>
                    <MenuItem value="dark">dark</MenuItem>
                  </Select>
                </FormControl>

                {modeWebc === "button" && (
                  <TextField
                    label="Button label"
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                    size="small"
                    sx={{ minWidth: 220 }}
                  />
                )}
              </Stack>

              <TextField
                label="API Base (must allow CORS)"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                size="small"
                fullWidth
                helperText="Usually your app root, e.g. https://your-app.example. The component posts to `${apiBase}/api/feedback`."
              />

              <CodeBox code={webComponentSnippet} onCopy={() => handleCopy(webComponentSnippet)} />

              <Typography variant="body2" color="text.secondary">
                Preview isn’t shown here because it depends on the host origin’s CORS. Paste the snippet into any site and it will render immediately.
              </Typography>
            </Stack>
          )}

          {/* Iframe */}
          {tab === "iframe" && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Copy and paste this anywhere (Squarespace, WordPress, Wix, etc.). You can tweak size and theme below.
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Max Width (px)"
                  type="number"
                  value={maxWidth}
                  onChange={(e) =>
                    setMaxWidth(Math.max(280, Number(e.target.value) || 480))
                  }
                  sx={{ width: 180 }}
                  size="small"
                />
                <TextField
                  label="Height (px)"
                  type="number"
                  value={height}
                  onChange={(e) =>
                    setHeight(Math.max(320, Number(e.target.value) || 520))
                  }
                  sx={{ width: 180 }}
                  size="small"
                />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    label="Theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <MenuItem value="auto">auto</MenuItem>
                    <MenuItem value="light">light</MenuItem>
                    <MenuItem value="dark">dark</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <CodeBox code={iframeSnippet} onCopy={() => handleCopy(iframeSnippet)} />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Preview
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  maxWidth: `${maxWidth}px`,
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <iframe
                  title="Preview"
                  src={`${link}?embed=1&theme=${theme}`}
                  style={{ width: "100%", height: `${height}px`, border: 0, display: "block" }}
                  loading="lazy"
                />
              </Box>
            </Stack>
          )}

          {/* Legacy Script */}
          {tab === "script" && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                This uses <code>lll-embed.js</code> hosted at <code>{legacyScriptSrc}</code>. Prefer the Web Component for best UX.
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Mode</InputLabel>
                  <Select
                    label="Mode"
                    value={modeLegacy}
                    onChange={(e) => setModeLegacy(e.target.value)}
                  >
                    <MenuItem value="button">button (floating)</MenuItem>
                    <MenuItem value="inline">inline (embedded)</MenuItem>
                  </Select>
                </FormControl>

                {modeLegacy === "button" && (
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Position</InputLabel>
                    <Select
                      label="Position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    >
                      <MenuItem value="bottom-right">bottom-right</MenuItem>
                      <MenuItem value="bottom-left">bottom-left</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    label="Theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <MenuItem value="auto">auto</MenuItem>
                    <MenuItem value="light">light</MenuItem>
                    <MenuItem value="dark">dark</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <CodeBox code={legacyScriptSnippet} onCopy={() => handleCopy(legacyScriptSnippet)} />

              <Typography variant="body2" color="text.secondary">
                Tip: If your public page posts <code>{`{ type: 'lll:resize', height }`}</code> messages, the legacy script will auto-resize iframes.
              </Typography>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={2200}
        onClose={() => setSnack("")}
        message={snack}
      />
    </>
  );
}

function CodeBox({ code, onCopy }) {
  return (
    <Box
      sx={{
        position: "relative",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <IconButton
        aria-label="Copy"
        size="small"
        onClick={onCopy}
        sx={{ position: "absolute", right: 6, top: 6 }}
      >
        <ContentCopyIcon fontSize="inherit" />
      </IconButton>
      <TextField
        value={code}
        multiline
        minRows={8}
        fullWidth
        InputProps={{
          readOnly: true,
          sx: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
        }}
      />
    </Box>
  );
}

// Basic escaping for attributes/text inside snippets
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(s) {
  return escapeHtml(s);
}
