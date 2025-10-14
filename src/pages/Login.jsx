import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Paper, Stack, TextField, Button, Typography, Alert } from "@mui/material";
import { authApi } from "../api/authApi";

export default function Login() {
  const [orgId, setOrgId] = useState(localStorage.getItem("lll_orgId") || "3fa85f64-5717-4562-b3fc-2c963f66afa6");
  const [email, setEmail] = useState("you@example.com");
  const [error, setError] = useState("");
  const nav = useNavigate();
  const loc = useLocation();

  const doLogin = async () => {
    setError("");
    try {
      const token = await authApi.devToken(orgId, email);
      localStorage.setItem("lll_token", token);
      localStorage.setItem("lll_orgId", orgId);
      const to = (loc.state && loc.state.from?.pathname) || "/dashboard";
      nav(to, { replace: true });
    } catch (e) {
      setError(e?.response?.data?.title || e.message);
    }
  };

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <Paper sx={{ p: 3, width: 420 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in (Dev)</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          <TextField label="OrgId (GUID)" value={orgId} onChange={e => setOrgId(e.target.value)} />
          <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Button onClick={doLogin} variant="contained">Get Token</Button>
          <Typography variant="body2" color="text.secondary">
            Tip: Ensure this OrgId exists in <code>tblLLLOrg</code>.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
