import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Prompts from "./pages/Prompts";
import Tasks from "./pages/Tasks";
import Feedback from "./pages/Feedback";
import QuickFeedback from "./pages/public/QuickFeedback";

export default function App() {
  return (
    <Routes>
      {/* Public micro app for feedback (no auth) */}
      <Route path="/f/:orgId/:promptId" element={<QuickFeedback />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* Redirect bare root to dashboard (will be protected) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected area */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/feedback" element={<Feedback />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
