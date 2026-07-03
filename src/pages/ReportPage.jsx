import { useState, useEffect, useRef } from "react";
import { LOCATION_HIERARCHY } from "./reportLocationData.js";
import { DOWNTIME_CATEGORIES } from "./downtimeData.js";

const HOST = window.location.hostname;
const API = import.meta.env.VITE_API_URL + "/api/reports";

const inputStyle = {
  width: "100%", padding: "10px 13px", border: "1.5px solid #e5e7eb",
  borderRadius: 9, fontSize: 14, color: "#111", background: "#fff",
  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
};
const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em",
};

const STATUS_CFG = {
  pending:   { bg: "#fef9c3", color: "#713f12", dot: "#eab308", label: "Pending Review" },
  approved:  { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6", label: "Approved — Action Required" },
  rejected:  { bg: "#fee2e2", color: "#7f1d1d", dot: "#ef4444", label: "Rejected" },
  completed: { bg: "#d1fae5", color: "#065f46", dot: "#10b981", label: "Completed" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function ImagePicker({ images, previews, onAdd, onRemove, max = 4 }) {
  const ref = useRef();
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {previews.map((src, i) => (
        <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
          <img src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1.5px solid #e5e7eb" }} />
          <button onClick={() => onRemove(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#ef4444", color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      ))}
      {previews.length < max && (
        <div onClick={() => ref.current.click()} style={{ width: 80, height: 80, border: "1.5px dashed #c7d2fe", borderRadius: 8, background: "#f8f9ff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
          <span style={{ fontSize: 20 }}>📷</span>
          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Add</span>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => onAdd(Array.from(e.target.files))} />
    </div>
  );
}

// ── Submit Form (no time end) ─────────────────────────────────────────────────
function ReportForm({ token, onSubmitted }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today, location: "", section: "", line: "",
    time_start: "", issue: "", category: "", pic: ""
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setLocation = (v) => setForm(f => ({ ...f, location: v, section: "", line: "" }));
  const setSection  = (v) => setForm(f => ({ ...f, section: v, line: "" }));

  const sections = form.location ? Object.keys(LOCATION_HIERARCHY[form.location] || {}) : [];
  const lines    = form.location && form.section ? (LOCATION_HIERARCHY[form.location]?.[form.section] || []) : [];

  const valid = form.date && form.location && form.section && form.time_start && form.issue && form.category && form.pic;

  const addImages = (files) => {
    const a = files.slice(0, 4 - images.length);
    setImages(i => [...i, ...a].slice(0, 4));
    setPreviews(p => [...p, ...a.map(f => URL.createObjectURL(f))].slice(0, 4));
  };
  const removeImage = (i) => {
    setImages(imgs => imgs.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!valid) return;
    setSaving(true); setError("");
    try {
      const fd = new FormData();
      fd.append("date", form.date);
      fd.append("location", form.location);
      fd.append("section", form.section);
      fd.append("line", form.line || "");
      fd.append("time_start", form.time_start);
      fd.append("time_end", "");
      fd.append("issue", form.issue);
      fd.append("category", form.category);
      fd.append("pic", form.pic);
      images.forEach(img => fd.append("images", img));
      const res = await fetch(`${API}/`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed"); }
      setForm({ date: today, location: "", section: "", line: "", time_start: "", issue: "", category: "", pic: "" });
      setImages([]); setPreviews([]);
      onSubmitted();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #f0f0f0", padding: 22, marginBottom: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 16, color: "#111", marginBottom: 16 }}>📝 New Daily Maintenance Report</div>
      {error && <div style={{ background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Date *</label>
          <input type="date" style={inputStyle} value={form.date} onChange={e => set("date", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Location *</label>
          <select style={inputStyle} value={form.location} onChange={e => setLocation(e.target.value)}>
            <option value="">Select location...</option>
            {Object.keys(LOCATION_HIERARCHY).map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={{ ...labelStyle, color: form.location ? "#6b7280" : "#d1d5db" }}>Section *</label>
          <select style={{ ...inputStyle, opacity: form.location ? 1 : 0.5 }} value={form.section} onChange={e => setSection(e.target.value)} disabled={!form.location}>
            <option value="">{form.location ? "Select section..." : "Select location first"}</option>
            {sections.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ ...labelStyle, color: form.section ? "#6b7280" : "#d1d5db" }}>Line</label>
          <select style={{ ...inputStyle, opacity: form.section ? 1 : 0.5 }} value={form.line} onChange={e => set("line", e.target.value)} disabled={!form.section}>
            <option value="">{form.section ? "Select line (optional)" : "Select section first"}</option>
            {lines.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Time Start *</label>
          <input type="time" style={inputStyle} value={form.time_start} onChange={e => set("time_start", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Category *</label>
          <select style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)}>
            <option value="">Select...</option>
            {["Jig", "Robot", "Machineries", "Facilities"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>PIC *</label>
          <input style={inputStyle} placeholder="Person in charge" value={form.pic} onChange={e => set("pic", e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Issue / Description *</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="Describe the maintenance issue..." value={form.issue} onChange={e => set("issue", e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Photos (up to 4)</label>
          <ImagePicker images={images} previews={previews} onAdd={addImages} onRemove={removeImage} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
        <button onClick={handleSubmit} disabled={!valid || saving} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: valid && !saving ? "#1d4ed8" : "#c7d2fe", color: "#fff", fontWeight: 700, fontSize: 14, cursor: valid && !saving ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
          {saving ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </div>
  );
}

// ── Follow-up Form (has time end) ─────────────────────────────────────────────
function FollowUpForm({ report, token, onUpdated }) {
  const [form, setForm] = useState({ root_cause_category: "", root_cause: "", countermeasure: "", time_end: "" });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCategory = (v) => setForm(f => ({ ...f, root_cause_category: v, root_cause: "" }));
  const subcategories = form.root_cause_category ? (DOWNTIME_CATEGORIES[form.root_cause_category] || []) : [];
  const valid = form.root_cause_category && form.root_cause && form.countermeasure.trim() && form.time_end;

  const addImages = (files) => {
    const a = files.slice(0, 4 - images.length);
    setImages(i => [...i, ...a].slice(0, 4));
    setPreviews(p => [...p, ...a.map(f => URL.createObjectURL(f))].slice(0, 4));
  };
  const removeImage = (i) => {
    setImages(imgs => imgs.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!valid) return;
    setSaving(true); setError("");
    try {
      const fd = new FormData();
      fd.append("root_cause_category", form.root_cause_category);
      fd.append("root_cause", form.root_cause);
      fd.append("countermeasure", form.countermeasure);
      fd.append("time_end", form.time_end);
      images.forEach(img => fd.append("images", img));
      const res = await fetch(`${API}/${report.id}/followup`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Failed"); }
      onUpdated();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, padding: 16, marginTop: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: "#1d4ed8", marginBottom: 12 }}>✏️ Update Required — Add Root Cause & Countermeasure</div>
      {error && <div style={{ background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 10 }}>⚠ {error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ ...labelStyle, color: "#1e40af" }}>Time End *</label>
          <input type="time" style={inputStyle} value={form.time_end} onChange={e => set("time_end", e.target.value)} />
        </div>
        <div>
          <label style={{ ...labelStyle, color: "#1e40af" }}>Root Cause Category *</label>
          <select style={inputStyle} value={form.root_cause_category} onChange={e => setCategory(e.target.value)}>
            <option value="">Select category...</option>
            {Object.keys(DOWNTIME_CATEGORIES).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ ...labelStyle, color: form.root_cause_category ? "#1e40af" : "#d1d5db" }}>Root Cause *</label>
          <select style={{ ...inputStyle, opacity: form.root_cause_category ? 1 : 0.5 }} value={form.root_cause} onChange={e => set("root_cause", e.target.value)} disabled={!form.root_cause_category}>
            <option value="">{form.root_cause_category ? "Select root cause..." : "Select category first"}</option>
            {subcategories.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ ...labelStyle, color: "#1e40af" }}>Countermeasure *</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} placeholder="What action was taken to resolve and prevent recurrence?" value={form.countermeasure} onChange={e => set("countermeasure", e.target.value)} />
        </div>
        <div>
          <label style={{ ...labelStyle, color: "#1e40af" }}>Follow-up Photos (optional)</label>
          <ImagePicker images={images} previews={previews} onAdd={addImages} onRemove={removeImage} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleSubmit} disabled={!valid || saving} style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: valid && !saving ? "#1d4ed8" : "#c7d2fe", color: "#fff", fontWeight: 700, fontSize: 13, cursor: valid && !saving ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
            {saving ? "Submitting..." : "Submit Follow-up"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({ report, token, username, isAdmin, isSuperAdmin, onUpdated, onDelete }) {
  const [showReview, setShowReview] = useState(false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const canFollowUp = report.status === "approved" && report.submitted_by === username;

  const handleReview = async (action) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/${report.id}/review`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, comment }) });
      if (!res.ok) throw new Error("Failed");
      onUpdated(); setShowReview(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this report?")) return;
    await fetch(`${API}/${report.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    onDelete(report.id);
  };

  const catColors = { Jig: "#eff6ff", Robot: "#f5f3ff", Machineries: "#ecfdf5", Facilities: "#fff7ed" };

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #f0f0f0", padding: 18, marginBottom: 12, borderLeft: `4px solid ${STATUS_CFG[report.status]?.dot || "#e5e7eb"}` }}>
      {lightbox && <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setLightbox(null)}><img src={lightbox} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }} /></div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 3 }}>{report.issue}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {report.date} · {report.time_start}{report.time_end ? ` – ${report.time_end}` : ""} · {report.location}
            {report.section && ` · ${report.section}`}
            {report.line && ` · Line ${report.line}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <StatusBadge status={report.status} />
          <span style={{ fontSize: 11, fontWeight: 600, background: catColors[report.category] || "#f3f4f6", color: "#374151", padding: "3px 9px", borderRadius: 6 }}>{report.category}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 8, marginBottom: 12, fontSize: 12 }}>
        {[["PIC", report.pic], ["Submitted by", report.submitted_by], ["Reviewed by", report.reviewed_by || "—"]].map(([k, v]) => (
          <div key={k}><div style={{ color: "#9ca3af", marginBottom: 1 }}>{k}</div><div style={{ fontWeight: 700, color: "#374151" }}>{v}</div></div>
        ))}
      </div>

      {report.images.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {report.images.map((img, i) => <img key={i} src={`${import.meta.env.VITE_API_URL}${img}`} alt="" onClick={() => setLightbox(`${import.meta.env.VITE_API_URL}${img}`)} style={{ width: 68, height: 68, objectFit: "cover", borderRadius: 7, border: "1px solid #e5e7eb", cursor: "pointer" }} />)}
        </div>
      )}

      {report.admin_comment && (
        <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#374151", marginBottom: 10 }}>
          <span style={{ fontWeight: 700, color: "#6b7280" }}>Admin comment: </span>{report.admin_comment}
        </div>
      )}

      {report.status === "completed" && (
        <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#059669", marginBottom: 10 }}>✅ Follow-up Completed</div>
          {report.time_end && (
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
              <span style={{ fontWeight: 700 }}>Time End:</span> {report.time_end}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
            <div><div style={{ fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Root Cause Category</div><div style={{ color: "#111" }}>{report.root_cause_category || "—"}</div></div>
            <div><div style={{ fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Root Cause</div><div style={{ color: "#111" }}>{report.root_cause}</div></div>
            <div style={{ gridColumn: "1 / -1" }}><div style={{ fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Countermeasure</div><div style={{ color: "#111" }}>{report.countermeasure}</div></div>
          </div>
          {report.followup_images?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", marginBottom: 6 }}>Follow-up Photos</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {report.followup_images.map((img, i) => <img key={i} src={`${import.meta.env.VITE_API_URL}${img}`} alt="" onClick={() => setLightbox(`${import.meta.env.VITE_API_URL}${img}`)} style={{ width: 68, height: 68, objectFit: "cover", borderRadius: 7, border: "1px solid #bbf7d0", cursor: "pointer" }} />)}
              </div>
            </div>
          )}
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>Updated by {report.followup_by} · {report.followup_at ? new Date(report.followup_at).toLocaleString() : ""}</div>
        </div>
      )}

      {canFollowUp && <FollowUpForm report={report} token={token} onUpdated={onUpdated} />}

      {showReview && (
        <div style={{ border: "1.5px solid #e0e7ff", borderRadius: 9, padding: 12, marginBottom: 10, background: "#f8f9ff" }}>
          <label style={labelStyle}>Comment (optional)</label>
          <textarea style={{ ...inputStyle, minHeight: 60, marginBottom: 10 }} placeholder="Add a comment for the submitter..." value={comment} onChange={e => setComment(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleReview("approve")} disabled={saving} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✓ Approve</button>
            <button onClick={() => handleReview("reject")} disabled={saving} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✗ Reject</button>
            <button onClick={() => setShowReview(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        {isAdmin && report.status === "pending" && !showReview && (
          <button onClick={() => setShowReview(true)} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #c7d2fe", background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Review</button>
        )}
        {isSuperAdmin && <button onClick={handleDelete} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff", color: "#ef4444", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportPage({ token, username, role }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const isSuperAdmin = role === "superadmin";
  const isAdmin = role === "admin" || role === "superadmin";

  const load = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/`, { headers: { Authorization: `Bearer ${token}` } }); setReports(await res.json()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);
  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    approved: reports.filter(r => r.status === "approved").length,
    rejected: reports.filter(r => r.status === "rejected").length,
    completed: reports.filter(r => r.status === "completed").length,
  };
  const myPending = reports.filter(r => r.status === "approved" && r.submitted_by === username);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>Daily Maintenance Reports</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>Submit and track maintenance update reports</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: showForm ? "#f3f4f6" : "#1d4ed8", color: showForm ? "#374151" : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {showForm ? "✕ Cancel" : "+ New Report"}
        </button>
      </div>

      {myPending.length > 0 && (
        <div style={{ background: "#dbeafe", border: "1.5px solid #93c5fd", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: "#1e40af", fontSize: 14 }}>Action Required</div>
            <div style={{ fontSize: 13, color: "#1e40af" }}>You have {myPending.length} approved report{myPending.length > 1 ? "s" : ""} waiting for root cause & countermeasure.</div>
          </div>
          <button onClick={() => setFilter("approved")} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>View</button>
        </div>
      )}

      {showForm && <ReportForm token={token} onSubmitted={() => { load(); setShowForm(false); }} />}

      <div style={{ display: "flex", gap: 3, marginBottom: 16, background: "#f5f5f5", padding: 4, borderRadius: 10, flexWrap: "wrap" }}>
        {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["completed", "Completed"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: "6px 12px", borderRadius: 7, border: "none", fontWeight: 700, fontSize: 12, background: filter === val ? "#fff" : "transparent", color: filter === val ? "#111" : "#9ca3af", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: filter === val ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {label} ({counts[val]})
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Loading...</div>
        : filtered.length === 0 ? <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}><div style={{ fontSize: 36, marginBottom: 8 }}>📋</div><p style={{ fontWeight: 600 }}>No reports found</p></div>
        : filtered.map(r => <ReportCard key={r.id} report={r} token={token} username={username} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} onUpdated={load} onDelete={id => setReports(rs => rs.filter(x => x.id !== id))} />)
      }
    </div>
  );
}
