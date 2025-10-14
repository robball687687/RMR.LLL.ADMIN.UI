import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";

export default function AppLayout() {
  const nav = useNavigate();
  const loc = useLocation();

  const logout = () => {
    localStorage.removeItem("lll_token");
    // keep orgId? if multi-tenant, remove; for dev you can keep it
    // localStorage.removeItem("lll_orgId");
    nav("/login");
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Listen Learn Loop</Typography>
          <Stack direction="row" spacing={1}>
            <Button color="inherit" component={Link} to="/dashboard" disabled={loc.pathname.startsWith("/dashboard")}>Dashboard</Button>
            <Button color="inherit" component={Link} to="/prompts" disabled={loc.pathname.startsWith("/prompts")}>Prompts</Button>
            <Button color="inherit" component={Link} to="/tasks" disabled={loc.pathname.startsWith("/tasks")}>Tasks</Button>
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <div style={{ padding: 16 }}>
        <Outlet />
      </div>
    </>
  );
}
