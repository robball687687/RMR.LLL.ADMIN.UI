// src/pages/Prompts.jsx
import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Rating,
  IconButton,
  Tooltip,
  Link
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { Link as RouterLink } from "react-router-dom";
import QRCode from "react-qr-code";
import { promptsApi } from "../api/promptsApi";
import PromptEmbedButton from "../components/PromptEmbedButton";

const channels = ["qr", "web", "pos", "link", "kiosk"];

export default function Prompts() {
  // data
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  // dialog
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("qr");

  // date filter for stats (default 30d)
  const [fromUtc, setFromUtc] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  });
  const [toUtc, setToUtc] = useState(() => new Date().toISOString());

  // Build base + org fallbacks (avoid empty orgId in generated URLs)
  const FALLBACK_ORG =
    import.meta.env.VITE_LLL_ORG_ID ||
    localStorage.getItem("lll_orgId") ||
    "";

  const publicBase = (import.meta.env.VITE_PUBLIC_BASE || window.location.origin).replace(
    /\/+$/,
    ""
  );

  const load = async () => {
    setErr("");
    try {
      // Try stats endpoint first
      const stats = await promptsApi.listWithStats({ fromUtc, toUtc });
      setRows(stats || []);
    } catch (e1) {
      // Fallback: plain list (no stats)
      try {
        const list = await promptsApi.list();
        setRows(
          (list || []).map((p) => ({
            promptId: p.promptId,
            name: p.name,
            channel: p.channel,
            orgId: p.orgId || p.OrgId || FALLBACK_ORG,
            feedbackCount: 0,
            avgRating: 0,
          }))
        );
      } catch (e2) {
        const d = e2?.response?.data;
        setErr(d?.detail || d?.title || e2.message);
        setRows([]);
      }
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = async () => {
    await load();
  };

  const onCreate = async () => {
    if (!name.trim()) return;
    setErr("");
    try {
      await promptsApi.create(name.trim(), channel);
      setOpen(false);
      setName("");
      setChannel("qr");
      await load();
    } catch (e) {
      const d = e?.response?.data;
      setErr(d?.detail || d?.title || e.message);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
              spacing={2}
            >
              <Typography variant="h6">Prompts</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <TextField
                  label="From (ISO UTC)"
                  value={fromUtc}
                  onChange={(e) => setFromUtc(e.target.value)}
                  size="small"
                  sx={{ minWidth: 280 }}
                />
                <TextField
                  label="To (ISO UTC)"
                  value={toUtc}
                  onChange={(e) => setToUtc(e.target.value)}
                  size="small"
                  sx={{ minWidth: 280 }}
                />
                <Button onClick={applyFilter} variant="outlined">
                  Apply
                </Button>
                <Button onClick={() => setOpen(true)} variant="contained">
                  Create Prompt
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Channel</TableCell>
                    <TableCell align="right">Feedbacks</TableCell>
                    <TableCell align="center">Avg Rating</TableCell>
                    <TableCell>Public Link</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => {
                    const orgForLink = (r.orgId || r.OrgId || FALLBACK_ORG || "").trim();
                    const promptId = (r.promptId || r.PromptId || "").trim();

                    const link =
                      orgForLink && promptId
                        ? `${publicBase}/f/${encodeURIComponent(orgForLink)}/${encodeURIComponent(
                            promptId
                          )}`
                        : "";

                    return (
                      <TableRow key={r.promptId || r.PromptId}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.channel}</TableCell>
                        <TableCell align="right">
                          {Number(r.feedbackCount ?? 0)}
                        </TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Rating
                              value={Number(r.avgRating || 0)}
                              precision={0.1}
                              readOnly
                              max={5}
                            />
                            <Typography variant="body2">
                              {Number(r.avgRating || 0).toFixed(1)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 440, wordBreak: "break-all" }}>
                          {link ? (
                            <Link
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link}
                            </Link>
                          ) : (
                            <Typography variant="body2" color="error">
                              Missing orgId/promptId
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Tooltip title="Open public page">
                              <span>
                                <IconButton
                                  href={link || undefined}
                                  target="_blank"
                                  disabled={!link}
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="View feedback">
                              <Button
                                size="small"
                                component={RouterLink}
                                to={`/feedback?promptId=${promptId}`}
                                variant="outlined"
                                disabled={!promptId}
                              >
                                View Feedback
                              </Button>
                            </Tooltip>

                            <PromptQrButton url={link} />

                            <PromptEmbedButton
                              publicBase={publicBase}
                              orgId={orgForLink}
                              promptId={promptId}
                              promptName={r.name}
                            />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!rows.length && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: "text.secondary" }}>
                        No prompts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
            {err && (
              <Typography color="error" sx={{ mt: 2 }}>
                {err}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Create Prompt Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Prompt</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              select
              label="Channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              {channels.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={onCreate} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/** Small QR helper dialog */
function PromptQrButton({ url }) {
  const [open, setOpen] = useState(false);
  const safeUrl = (url || "").trim();

  return (
    <>
      <Tooltip title="Show QR">
        <span>
          <IconButton onClick={() => setOpen(true)} disabled={!safeUrl}>
            <QrCode2Icon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>QR Code</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2, bgcolor: "#fff" }}>
            {/* react-qr-code wants a non-empty string */}
            <QRCode value={safeUrl || "about:blank"} style={{ width: 240, height: 240 }} />
          </Box>
          <Typography variant="body2" sx={{ mt: 1, wordBreak: "break-all" }}>
            {safeUrl || "Missing link"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
