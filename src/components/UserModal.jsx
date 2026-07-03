import { useState, useEffect } from "react";

const API = "http://" + window.location.hostname + ":8000/api/auth";

async function apiGetUsers(token) {
  const res = await fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}
async function apiCreateUser(token, data) {
  const res = await fetch(`${API}/users`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed"); }
  return res.json();
}
async function apiToggleUser(token, id) {
  const res = await fetch(`${API}/users/${id}/toggle`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}
async function apiDeleteUser(token, id) {
  await fetch(`${API}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}
async function apiChangePassword(token, current_password, new_password) {
  const res = await fetch(`${API}/change-password`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ current_password, new_password }) });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed"); }
  return res.json();
}

const ROLE_BADGE = {
  superadmin: { bg: "#fef3c7", color: "#92400e", label: "Super Admin" },
  admin:      { bg: "#ede9fe", color: "#5b21b6", label: "Admin" },
  user:       { bg: "#f0fdf4", color: "#166534", label: "User" },
};

const input = {
  width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb",
  borderRadius: 10, fontSize: 14, color: "#111", background: "#fff",
  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none",
};

function ProfileTab({ token }) {
  const [form, setForm] = useState({
    full_name: localStorage.getItem("full_name") || "",
    email: localStorage.getItem("email") || "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSave = async () => {
    setSaving(true); setSuccess(false); setError("");
    try {
      const res = await fetch(`${API}/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: form.full_name, email: form.email }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      localStorage.setItem("full_name", form.full_name);
      localStorage.setItem("email", form.email);
      setSuccess(true);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {error && <div style={{ background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, padding: "9px 13px", fontSize: 13 }}>⚠ {error}</div>}
      {success && <div style={{ background: "#d1fae5", color: "#065f46", borderRadius: 8, padding: "9px 13px", fontSize: 13, fontWeight: 600 }}>✓ Profile updated successfully</div>}
      <div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>Full Name</label>
        <input style={input} placeholder="Your full name" value={form.full_name} onChange={e => set("full_name", e.target.value)} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>Email *</label>
        <input type="email" style={input} placeholder="your@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
      </div>
      <button onClick={handleSave} disabled={saving || !form.email} style={{ padding: "10px 0", borderRadius: 10, border: "none", background: !form.email ? "#c7d2fe" : "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 14, cursor: !form.email ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}

export default function UserModal({ token, role, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: "", full_name: "", email: "", password: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("password");
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const isSuperAdmin = role === "superadmin";

  useEffect(() => {
    if (isSuperAdmin) {
      setTab("users");
      apiGetUsers(token).then(setUsers).finally(() => setLoading(false));
    }
  }, []);

  const handleAdd = async () => {
    if (!newUser.username || !newUser.password) return;
    setSaving(true); setError("");
    try {
      const u = await apiCreateUser(token, newUser);
      setUsers(us => [...us, u]);
      setNewUser({ username: "", full_name: "", email: "", password: "", role: "user" });
      setTab("users");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => { const u = await apiToggleUser(token, id); setUsers(us => us.map(x => x.id === id ? u : x)); };
  const handleDelete = async (id) => { if (!confirm("Delete this user?")) return; await apiDeleteUser(token, id); setUsers(us => us.filter(x => x.id !== id)); };
  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords don't match"); return; }
    if (pwForm.next.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    setSaving(true); setPwError("");
    try { await apiChangePassword(token, pwForm.current, pwForm.next); setPwSuccess(true); setPwForm({ current: "", next: "", confirm: "" }); }
    catch (e) { setPwError(e.message); }
    finally { setSaving(false); }
  };

  const tabs = isSuperAdmin
    ? [["users", "Users"], ["add", "Add User"], ["profile", "My Profile"], ["password", "Change Password"]]
    : [["profile", "My Profile"], ["password", "Change Password"]];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Account Settings</span>
          <button onClick={onClose} style={{ border: "none", background: "#f5f5f5", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 18, color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0", overflowX: "auto" }}>
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: tab === id ? "#1d4ed8" : "#9ca3af", borderBottom: tab === id ? "2px solid #1d4ed8" : "2px solid transparent", whiteSpace: "nowrap", minWidth: 80 }}>{label}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          {tab === "users" && isSuperAdmin && (loading ? <div style={{ textAlign: "center", color: "#9ca3af", padding: 24 }}>Loading...</div> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {users.map(u => {
                const rb = ROLE_BADGE[u.role] || ROLE_BADGE.user;
                return (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1.5px solid #f0f0f0", borderRadius: 10, background: u.is_active ? "#fff" : "#f9fafb" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: u.is_active ? "#eff6ff" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: u.is_active ? "#1d4ed8" : "#9ca3af", flexShrink: 0 }}>{u.username[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: u.is_active ? "#111" : "#9ca3af" }}>{u.full_name || u.username}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        @{u.username}
                        {u.email && <span>· {u.email}</span>}
                        <span style={{ background: rb.bg, color: rb.color, padding: "1px 7px", borderRadius: 99, fontWeight: 700, fontSize: 10 }}>{rb.label}</span>
                        {!u.is_active && <span style={{ color: "#ef4444" }}>· Disabled</span>}
                      </div>
                    </div>
                    <button onClick={() => handleToggle(u.id)} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "1.5px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{u.is_active ? "Disable" : "Enable"}</button>
                    <button onClick={() => handleDelete(u.id)} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "1.5px solid #fecaca", borderRadius: 6, background: "#fff", color: "#ef4444", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>Delete</button>
                  </div>
                );
              })}
            </div>
          )}
          {tab === "add" && isSuperAdmin && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {error && <div style={{ background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, padding: "9px 13px", fontSize: 13 }}>⚠ {error}</div>}
              {[
                { label: "Username *", key: "username", type: "text", placeholder: "e.g. john" },
                { label: "Full Name", key: "full_name", type: "text", placeholder: "e.g. John Smith" },
                { label: "Email", key: "email", type: "email", placeholder: "e.g. john@company.com" },
                { label: "Password *", key: "password", type: "password", placeholder: "Min 6 characters" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{f.label}</label>
                  <input type={f.type} style={input} placeholder={f.placeholder} value={newUser[f.key]} onChange={e => setNewUser(u => ({ ...u, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>Role *</label>
                <select style={input} value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                  <option value="user">User — Submit & follow-up reports only</option>
                  <option value="admin">Admin — Review reports</option>
                  <option value="superadmin">Super Admin — Full access</option>
                </select>
              </div>
              <button onClick={handleAdd} disabled={saving || !newUser.username || !newUser.password} style={{ padding: "10px 0", borderRadius: 10, border: "none", background: !newUser.username || !newUser.password ? "#c7d2fe" : "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
                {saving ? "Creating..." : "Create User"}
              </button>
            </div>
          )}
          {tab === "profile" && <ProfileTab token={token} />}
          {tab === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pwError && <div style={{ background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, padding: "9px 13px", fontSize: 13 }}>⚠ {pwError}</div>}
              {pwSuccess && <div style={{ background: "#d1fae5", color: "#065f46", borderRadius: 8, padding: "9px 13px", fontSize: 13, fontWeight: 600 }}>✓ Password changed successfully</div>}
              {[
                { label: "Current Password", key: "current", val: pwForm.current },
                { label: "New Password", key: "next", val: pwForm.next },
                { label: "Confirm New Password", key: "confirm", val: pwForm.confirm },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{f.label}</label>
                  <input type="password" style={input} value={f.val} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <button onClick={handleChangePassword} disabled={saving} style={{ padding: "10px 0", borderRadius: 10, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
                {saving ? "Saving..." : "Change Password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
