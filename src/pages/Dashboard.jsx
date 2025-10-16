import { useEffect, useMemo, useState } from "react";
import { feedbackApi } from "../api/feedbackApi";
import { Card, CardContent, Grid, Typography, Paper, Stack } from "@mui/material";
import dayjs from "dayjs";
import PromptChartCard from "../components/dashboard/PromptChartCard";
import { makeDayRange, aggregateByPrompt } from "../utils/feedbackAgg";

export default function Dashboard() {
  const [stats, setStats] = useState({ count: 0, avg: 0 });
  const [promptCharts, setPromptCharts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Range: last 14 days (nice for mini-charts). Adjust as you like.
  const toIso = useMemo(() => dayjs().toISOString(), []);
  const fromIso = useMemo(() => dayjs().subtract(14, "day").toISOString(), []);
  const dayKeys = useMemo(() => makeDayRange(fromIso, toIso), [fromIso, toIso]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Pull a generous page, adjust if you expect more
        const res = await feedbackApi.query({
          fromUtc: fromIso,
          toUtc: toIso,
          page: 1,
          pageSize: 1000,
        });

        const items = (res?.items ?? res?.Items) ?? [];
        const count = items.length;
        const avg = count
          ? (items.reduce((s, x) => s + (Number(x.rating ?? x.Rating ?? 0)), 0) / count).toFixed(2)
          : 0;

        setStats({ count, avg });

        // Build per-prompt aggregates
        const perPrompt = aggregateByPrompt(items, dayKeys);
        setPromptCharts(perPrompt);
      } catch (e) {
        console.error("Dashboard load error:", e);
        setStats({ count: 0, avg: 0 });
        setPromptCharts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [fromIso, toIso, dayKeys]);

  return (
    <Grid container spacing={2}>
      {/* Top KPI cards */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Feedback (last 14 days)</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {stats.count}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Avg Rating (last 14 days)</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {stats.avg}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Range</Typography>
            <Stack spacing={0.25}>
              <Typography variant="body2">{dayjs(fromIso).format("MMM D, YYYY")} → {dayjs(toIso).format("MMM D, YYYY")}</Typography>
              <Typography variant="caption" color="text.secondary">Daily bars + avg rating line</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Per-prompt mini charts */}
      <Grid item xs={12}>
        <Paper sx={{ p: 1.5, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
            Prompts Overview
          </Typography>

          <Grid container spacing={1.5}>
            {loading && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Loading…</Typography>
              </Grid>
            )}

            {!loading && promptCharts.length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  No feedback found for the selected range.
                </Typography>
              </Grid>
            )}

            {!loading &&
              promptCharts.map((p) => (
                <Grid key={p.promptId} item xs={12} md={6} lg={4}>
                  <PromptChartCard
                    title={p.promptName || p.promptId}
                    promptId={p.promptId !== "unknown" ? p.promptId : ""}
                    totals={p.totals}
                    data={p.days}
                  />
                </Grid>
              ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
}
