// src/pages/Feedback.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import Grid from "@mui/material/Grid";
import {
  Box, Paper, Stack, Typography, TextField, Button, Table, TableHead,
  TableBody, TableRow, TableCell, Pagination, Alert, Divider, Link
} from "@mui/material";
import { feedbackApi } from "../api/feedbackApi";

function toIsoOrNull(d) {
  return d ? new Date(d).toISOString() : null;
}

export default function Feedback() {
  const [sp, setSp] = useSearchParams();
  const promptId = sp.get("promptId") || null;

  // default range: last 30 days
  const [fromUtc, setFromUtc] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString();
  });
  const [toUtc, setToUtc] = useState(() => new Date().toISOString());

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");

  const pages = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize)), [total, pageSize]);

  const load = async () => {
    setErr("");
    try {
      const data = await feedbackApi.query({
        fromUtc,
        toUtc,
        promptId,
        page,
        pageSize,
      });
      const items = data?.items || data?.Items || [];
      setRows(items);
      setTotal(data?.total || data?.Total || items.length);
    } catch (e) {
      const d = e?.response?.data;
      setErr(d?.detail || d?.title || e.message);
      setRows([]);
      setTotal(0);
    }
  };

  // reload when filters change
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [promptId, fromUtc, toUtc, page]);

  const clearPromptFilter = () => {
    sp.delete("promptId");
    setSp(sp, { replace: true });
  };

  // Simple date inputs (UTC ISO). You can replace with MUI X Date Pickers later.
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Feedback {promptId ? "for Prompt" : ""} {promptId && <Typography component="span" color="text.secondary">({promptId})</Typography>}
            </Typography>
            <Stack direction="row" spacing={1}>
              {promptId && (
                <Button onClick={clearPromptFilter} variant="outlined">Clear Prompt Filter</Button>
              )}
              <Button component={RouterLink} to="/prompts" variant="outlined">Back to Prompts</Button>
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="From (ISO UTC)"
              value={fromUtc}
              onChange={(e) => setFromUtc(toIsoOrNull(e.target.value))}
              fullWidth
            />
            <TextField
              label="To (ISO UTC)"
              value={toUtc}
              onChange={(e) => setToUtc(toIsoOrNull(e.target.value))}
              fullWidth
            />
            <Button variant="contained" onClick={() => { setPage(1); load(); }}>
              Apply
            </Button>
          </Stack>

          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Created (UTC)</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Text</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Prompt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.feedbackId || r.id}>
                    <TableCell>{r.createdUtc || r.created || ""}</TableCell>
                    <TableCell>{r.rating}</TableCell>
                    <TableCell style={{ maxWidth: 520, whiteSpace: "normal" }}>{r.text}</TableCell>
                    <TableCell>{r.source}</TableCell>
                    <TableCell>{r.locationName || r.locationId || ""}</TableCell>
                    <TableCell>
                      {/* deep-link back to filtered view for this prompt */}
                      {r.promptId ? (
                        <Link component={RouterLink} to={`/feedback?promptId=${r.promptId}`}>
                          {r.promptName || r.promptId}
                        </Link>
                      ) : ""}
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={6} style={{ textAlign: "center", color: "#888" }}>
                      No feedback found for current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Pagination
              page={page}
              count={pages}
              onChange={(_, p) => setPage(p)}
              shape="rounded"
              color="primary"
            />
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
