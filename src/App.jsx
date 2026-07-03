import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import MachinePage from "./pages/MachinePage.jsx";
import ChecksheetPage from "./pages/ChecksheetPage.jsx";
import SparePartsPage from "./pages/SparePartsPage.jsx";
import TopNav from "./components/TopNav.jsx";

const API = import.meta.env.VITE_API_URL + "/api/auth";

export const ROLE_BADGE = {
  superadmin: { bg: "#fef3c7", color: "#92400e", label: "Super Admin" },
  admin:      { bg: "#ede9fe", color: "#5b21b6", label: "Admin" },
  user:       { bg: "#f0fdf4", color: "#166534", label: "User" },
};

function ProtectedLayout({ user, onLogout, children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <TopNav user={user} onLogout={onLogout} />
      {children}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    if (token && username) {
      fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => data ? setUser({ username: data.username, full_name: data.full_name, email: data.email || "", role: data.role }) : handleLogout())
        .catch(() => handleLogout())
        .finally(() => setChecking(false));
    } else { setChecking(false); }
  }, []);

  const handleLogin = (data) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("full_name", data.full_name);
    localStorage.setItem("email", data.email || "");
    localStorage.setItem("role", data.role);
    setUser({ username: data.username, full_name: data.full_name, email: data.email || "", role: data.role });
  };

  const handleLogout = () => {
    ["token", "username", "full_name", "email", "role"].forEach(k => localStorage.removeItem(k));
    setUser(null);
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: "#9ca3af", fontSize: 14 }}>Loading...</div>
    </div>
  );

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const token = localStorage.getItem("token");
  const isUser = user.role === "user";
  const isAdmin = user.role === "admin" || user.role === "superadmin";

  return (
    <BrowserRouter>
      <ProtectedLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={isUser ? <Navigate to="/reports" replace /> : <HomePage user={user} />} />
          <Route path="/reports" element={<ReportPage token={token} username={user.username} role={user.role} />} />
          {isAdmin && <Route path="/machines" element={<MachinePage />} />}
          {isAdmin && <Route path="/checksheet" element={<ChecksheetPage />} />}
          {isAdmin && <Route path="/spareparts/*" element={<SparePartsPage />} />}
          <Route path="*" element={<Navigate to={isUser ? "/reports" : "/"} replace />} />
        </Routes>
      </ProtectedLayout>
    </BrowserRouter>
  );
}
