import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("lll_token");
  const orgId = localStorage.getItem("lll_orgId");
  const loc = useLocation();

  if (!token || !orgId) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return <Outlet />;
}
