import React from "react";
import { Card, CardContent, CardHeader, Box, Typography, Divider, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

/**
 * props:
 *  - title: string  (prompt name)
 *  - promptId: string
 *  - totals: { count: number, avg: number }
 *  - data: [{ day: 'YYYY-MM-DD', count: number, avg: number }]
 *  - height?: number
 */
export default function PromptChartCard({ title, promptId, totals, data, height = 240 }) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap title={title}>
              {title || "Untitled Prompt"}
            </Typography>
            {promptId && (
              <MuiLink
                component={RouterLink}
                to={`/feedback?promptId=${promptId}`}
                underline="hover"
                sx={{ fontSize: 13 }}
              >
                View feedback →
              </MuiLink>
            )}
          </Box>
        }
        subheader={
          <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {totals.count} responses
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg {Number(totals.avg || 0).toFixed(2)}
            </Typography>
          </Box>
        }
        sx={{ pb: 0.5 }}
      />

      <CardContent sx={{ pt: 1.5, flex: 1, minHeight: height }}>
        <Box sx={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                tickMargin={8}
                hide={data.length > 21} // keep small; hide if long range
              />
              <YAxis
                yAxisId="left"
                allowDecimals={false}
                width={30}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 5]}
                width={30}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(val, name) => (name === "avg" ? Number(val).toFixed(2) : val)}
                labelFormatter={(v) => `Date: ${v}`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="count" name="Feedback Count" />
              <Line yAxisId="right" type="monotone" dataKey="avg" name="Avg Rating" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>

      <Divider />
      <Box sx={{ px: 2, py: 1.25 }}>
        <Typography variant="caption" color="text.secondary">
          Bars = # feedback; Line = avg rating (0–5)
        </Typography>
      </Box>
    </Card>
  );
}
