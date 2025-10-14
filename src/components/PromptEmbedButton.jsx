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
  const [tab, setTab] = useState("iframe"); // iframe | script
  const [snack, setSnack] = useState("");

  // Options for snippets
  const [height, setHeight] = useState(520);
  const [maxWidth, setMaxWidth] = useState(480);
  const [theme, setTheme] = useState("auto"); // auto|light|dark
  const [mode, setMode] = useState("button"); // button|inline
  const [position, setPosition] = useState("bottom-right"); // for button mode

  const link = useMemo(
    () => `${(publicBase || "").replace(/\/+$/, "")}/f/${orgId}/${promptId}`,
    [publicBase, orgId, promptId]
  );
  const scriptSrc = useMemo(
    () => `${(publicBase || "").replace(/\/+$/, "")}/embed/lll-embed.js`,
    [publicBase]
  );

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

  const scriptSnippet = useMemo(
    () =>
`<div class="lll-prompt"
     data-org-id="${orgId}"
     data-prompt-id="${promptId}"
     data-mode="${mode}"
     ${mode === "button" ? `data-position="${position}"` : ""}
     data-theme="${theme}"></div>
<script async src="${scriptSrc}"></script>`,
    [orgId, promptId, mode, position, theme, scriptSrc]
  );

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
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ mb: 2 }}
          >
            <Tab value="iframe" label="Iframe (simplest)" />
            <Tab value="script" label="Script (button/inline)" />
          </Tabs>

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
                  onChange={(e) => setMaxWidth(Math.max(280, Number(e.target.value) || 480))}
                  sx={{ width: 180 }}
                  size="small"
                />
                <TextField
                  label="Height (px)"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.max(320, Number(e.target.value) || 520))}
                  sx={{ width: 180 }}
                  size="small"
                />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Theme</InputLabel>
                  <Select label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
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

          {tab === "script" && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                This uses <code>lll-embed.js</code> that you host at <code>{scriptSrc}</code>. Choose a mode and theme, then paste the snippet.
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Mode</InputLabel>
                  <Select label="Mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <MenuItem value="button">button (floating)</MenuItem>
                    <MenuItem value="inline">inline (embedded)</MenuItem>
                  </Select>
                </FormControl>

                {mode === "button" && (
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Position</InputLabel>
                    <Select label="Position" value={position} onChange={(e) => setPosition(e.target.value)}>
                      <MenuItem value="bottom-right">bottom-right</MenuItem>
                      <MenuItem value="bottom-left">bottom-left</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Theme</InputLabel>
                  <Select label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <MenuItem value="auto">auto</MenuItem>
                    <MenuItem value="light">light</MenuItem>
                    <MenuItem value="dark">dark</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <CodeBox code={scriptSnippet} onCopy={() => handleCopy(scriptSnippet)} />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Live Preview
              </Typography>
              {mode === "inline" ? (
                <Box
                  sx={{
                    border: "1px dashed",
                    borderColor: "divider",
                    p: 1.5,
                    borderRadius: 2,
                    maxWidth: 560,
                  }}
                >
                  <iframe
                    title="Preview"
                    src={`${link}?embed=1&theme=${theme}`}
                    style={{ width: "100%", height: "520px", border: 0, display: "block" }}
                    loading="lazy"
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  The floating button opens a modal on the host site, so there’s no visual preview here.
                </Typography>
              )}

              <Typography variant="body2" color="text.secondary">
                Tip: If your public page posts <code>{`{ type: 'lll:resize', height }`}</code> messages, the script will auto-resize iframes.
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
        minRows={6}
        fullWidth
        InputProps={{ readOnly: true, sx: { fontFamily: "monospace" } }}
      />
    </Box>
  );
}

// Basic HTML escaping to keep snippet title attribute safe
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
