import { useEffect, useState } from "react";
import { feedbackApi } from "../api/feedbackApi";
import { Card, CardContent, Grid, Typography } from "@mui/material";
import dayjs from "dayjs";

export default function Dashboard() {
  const [stats, setStats] = useState({ count: 0, avg: 0 });

  useEffect(() => {
    (async () => {
      const to = dayjs().toISOString();
      const from = dayjs().subtract(7, "day").toISOString();
      const res = await feedbackApi.query({ fromUtc: from, toUtc: to, page: 1, pageSize: 200 });
      const items = (res?.items ?? res?.Items) ?? [];
      const count = items.length;
      const avg = count ? (items.reduce((s, x) => s + (x.rating || x.Rating || 0), 0) / count).toFixed(2) : 0;
      setStats({ count, avg });
    })();
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Card><CardContent>
          <Typography variant="h6">Feedback (7 days)</Typography>
          <Typography variant="h3">{stats.count}</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card><CardContent>
          <Typography variant="h6">Avg Rating (7 days)</Typography>
          <Typography variant="h3">{stats.avg}</Typography>
        </CardContent></Card>
      </Grid>
    </Grid>
  );
}
