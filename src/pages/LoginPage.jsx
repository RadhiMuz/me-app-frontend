import { useState } from "react";

const API = "http://" + window.location.hostname + ":8000/api/auth";

async function apiLogin(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  const res = await fetch(`${API}/login`, { method: "POST", body: form });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Login failed"); }
  return res.json();
}

const input = {
  width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb",
  borderRadius: 10, fontSize: 14, color: "#111", background: "#fff",
  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none",
};

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true); setError("");
    try {
      const data = await apiLogin(username, password);
      onLogin(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0369a1 100%)", fontFamily: "'DM Sans', sans-serif", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏭</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>Factory Apps</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Sign in to continue</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
          {error && <div style={{ background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>⚠ {error}</div>}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Username</label>
              <input style={input} placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Password</label>
              <input style={input} type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading || !username || !password} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: loading ? "#93c5fd" : "#1d4ed8", color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Contact your administrator for access</p>
      </div>
    </div>
  );
}
