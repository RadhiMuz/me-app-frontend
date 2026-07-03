import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { ROLE_BADGE } from "../App.jsx";
import UserModal from "./UserModal.jsx";

export default function TopNav({ user, onLogout }) {
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const isUser = user.role === "user";
  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const rb = ROLE_BADGE[user.role] || ROLE_BADGE.user;
  const token = localStorage.getItem("token");

  const navTabs = [
    ...(!isUser ? [["/", "🏠 Home"]] : []),
    ["/reports", "📝 Reports"],
    ...(isAdmin ? [["/checksheet", "📋 Checksheet"], ["/spareparts", "🔧 Spare Parts"], ["/machines", "🛠️ Machines"]] : []),
  ];

  return (
    <>
      <div style={{ background: "#fff", borderBottom: "1.5px solid #f0f0f0", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏭</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111", letterSpacing: "-0.02em" }}>Factory Apps</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Production Management System</div>
            </div>
          </div>
          {navTabs.length > 1 && (
            <div style={{ display: "flex", gap: 2, background: "#f5f5f5", padding: 3, borderRadius: 9, flexWrap: "wrap" }}>
              {navTabs.map(([path, label]) => {
                const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
                return (
                  <Link key={path} to={path} style={{ textDecoration: "none" }}>
                    <div style={{
                      padding: "6px 14px", borderRadius: 7,
                      background: active ? "#fff" : "transparent",
                      fontWeight: 700, fontSize: 12, cursor: "pointer",
                      color: active ? "#111" : "#9ca3af",
                      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                    }}>{label}</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowSettings(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 9, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#1d4ed8" }}>
              {(user.full_name || user.username)[0].toUpperCase()}
            </span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, lineHeight: 1.2 }}>{user.full_name || user.username}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: rb.color, background: rb.bg, padding: "1px 6px", borderRadius: 99, display: "inline-block", marginTop: 1 }}>{rb.label}</div>
            </div>
          </button>
          <button onClick={onLogout} style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid #fecaca", background: "#fff", color: "#ef4444", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Sign Out</button>
        </div>
      </div>
      {showSettings && <UserModal token={token} role={user.role} onClose={() => setShowSettings(false)} />}
    </>
  );
}
