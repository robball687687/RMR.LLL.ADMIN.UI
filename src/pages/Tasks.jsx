import { useEffect, useState } from "react";
import { tasksApi } from "../api/tasksApi";
import { Box, Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";

const statuses = ["Open","InProgress","Done","Canceled"];

export default function Tasks() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const load = async () => {
    const res = await tasksApi.list({ status: statusFilter || undefined });
    setItems(res.items || res.Items || []);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const add = async () => {
    if (!newTitle.trim()) return;
    await tasksApi.create({ title: newTitle.trim() });
    setNewTitle("");
    await load();
  };

  const setStatus = async (id, status) => {
    await tasksApi.setStatus(id, status);
    await load();
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">New Task</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField label="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} fullWidth />
            <Button variant="contained" onClick={add}>Add</Button>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Tasks</Typography>
            <TextField select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="">All</MenuItem>
              {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack spacing={1}>
            {items.map(t => (
              <Paper key={t.taskId} sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ flexGrow: 1 }}>{t.title}</Typography>
                  <TextField size="small" select value={t.status} onChange={e => setStatus(t.taskId, e.target.value)} sx={{ minWidth: 160 }}>
                    {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
