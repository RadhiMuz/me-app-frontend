import { useState, useEffect, useRef } from "react";
import {
  fetchParts, fetchCategories, createPart, updatePart, deletePart, uploadImage,
  fetchStockOuts, createStockOut, deleteStockOut,
  exportInventoryToSheets, exportStockOutToSheets,
  importInventoryFromSheets, importStockOutFromSheets, syncAllToSheets,
} from "../api/sparePartsApi.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const inputStyle = { width: "100%", padding: "9px 11px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, color: "#111", background: "#fff", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" };

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
      <div style={{ width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function StockBadge({ part }) {
  const cfg = part.status === "critical" ? { bg: "#fee2e2", color: "#7f1d1d", dot: "#ef4444", label: "Critical" }
    : part.status === "low" ? { bg: "#ffedd5", color: "#7c2d12", dot: "#f97316", label: "Low" }
    : { bg: "#d1fae5", color: "#065f46", dot: "#10b981", label: "OK" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, color: cfg.color, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />{cfg.label}</span>;
}

function ExportButton({ onExport, label }) {
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");
  const handle = async () => {
    setState("loading");
    try { const res = await onExport(); setMsg(`✓ ${res.message || `Exported ${res.count} rows`}`); setState("success"); setTimeout(() => setState("idle"), 4000); }
    catch (e) { setMsg(e.message); setState("error"); setTimeout(() => setState("idle"), 4000); }
  };
  const colors = { idle: { bg: "#fff", color: "#374151", border: "#e5e7eb" }, loading: { bg: "#f9fafb", color: "#9ca3af", border: "#e5e7eb" }, success: { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" }, error: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" } };
  const c = colors[state];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button onClick={handle} disabled={state === "loading"} style={{ padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${c.border}`, background: c.bg, color: c.color, fontWeight: 700, fontSize: 12, cursor: state === "loading" ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
        <span>{state === "loading" ? "⏳" : state === "success" ? "✓" : state === "error" ? "✗" : "📊"}</span>
        {state === "loading" ? "Working..." : label || "Export to Sheets"}
      </button>
      {(state === "success" || state === "error") && <div style={{ fontSize: 11, color: c.color, fontWeight: 600, maxWidth: 200, textAlign: "right" }}>{msg}</div>}
    </div>
  );
}

// ── Part Form Modal ──────────────────────────────────────────────────────────
function PartForm({ part, categories, onSave, onClose }) {
  const [form, setForm] = useState(part ? { product_name: part.product_name, product_id: part.product_id, available_stock: part.available_stock, minimum_stock: part.minimum_stock, category: part.category, rack: part.rack } : { product_name: "", product_id: "", available_stock: 0, minimum_stock: 1, category: "", rack: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(part?.image_url ? BASE_URL + part.image_url : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.product_name.trim() && form.product_id.trim();
  const handleImage = (e) => { const f = e.target.files[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); };
  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      let saved = part ? await updatePart(part.id, form) : await createPart(form);
      if (imageFile) saved = await uploadImage(saved.id, imageFile);
      onSave(saved);
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>{part ? "Edit Part" : "Add New Part"}</span>
          <button onClick={onClose} style={{ border: "none", background: "#f5f5f5", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 18, color: "#555" }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          {error && <div style={{ background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <div onClick={() => fileRef.current.click()} style={{ width: "100%", height: 140, border: "1.5px dashed #c7d2fe", borderRadius: 10, background: "#f8f9ff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {imagePreview ? <img src={imagePreview} alt="preview" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} /> : <div style={{ textAlign: "center", color: "#9ca3af" }}><div style={{ fontSize: 28, marginBottom: 4 }}>📷</div><div style={{ fontSize: 13, fontWeight: 600 }}>Click to upload image</div></div>}
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleImage} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ gridColumn: "1/-1" }}><label style={labelStyle}>Product Name *</label><input style={inputStyle} value={form.product_name} onChange={e => set("product_name", e.target.value)} /></div>
            <div><label style={labelStyle}>Product ID *</label><input style={inputStyle} value={form.product_id} onChange={e => set("product_id", e.target.value)} /></div>
            <div><label style={labelStyle}>Category</label><input style={inputStyle} list="cat-list" value={form.category} onChange={e => set("category", e.target.value)} /><datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist></div>
            <div><label style={labelStyle}>Available Stock</label><input type="number" min="0" style={inputStyle} value={form.available_stock} onChange={e => set("available_stock", parseInt(e.target.value) || 0)} /></div>
            <div><label style={labelStyle}>Minimum Stock</label><input type="number" min="0" style={inputStyle} value={form.minimum_stock} onChange={e => set("minimum_stock", parseInt(e.target.value) || 0)} /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={labelStyle}>Rack Location</label><input style={inputStyle} value={form.rack} onChange={e => set("rack", e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
            <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
            <button onClick={handleSave} disabled={!valid || saving} style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: valid && !saving ? "#1d4ed8" : "#c7d2fe", color: "#fff", fontWeight: 700, cursor: valid && !saving ? "pointer" : "not-allowed", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{saving ? "Saving..." : part ? "Update Part" : "Add Part"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StockEditor({ part, onSave, onClose }) {
  const [val, setVal] = useState(part.available_stock);
  const [saving, setSaving] = useState(false);
  const handleSave = async () => { setSaving(true); try { const updated = await updatePart(part.id, { available_stock: val }); onSave(updated); } finally { setSaving(false); } };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, width: 280, boxShadow: "0 16px 32px rgba(0,0,0,0.16)" }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#111", marginBottom: 4 }}>Update Stock</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>{part.product_name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <button onClick={() => setVal(v => Math.max(0, v - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#f9fafb", fontSize: 18, cursor: "pointer", fontWeight: 700, color: "#374151" }}>−</button>
          <input type="number" min="0" style={{ ...inputStyle, textAlign: "center", fontSize: 18, fontWeight: 800 }} value={val} onChange={e => setVal(parseInt(e.target.value) || 0)} />
          <button onClick={() => setVal(v => v + 1)} style={{ width: 36, height: 36, borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#f9fafb", fontSize: 18, cursor: "pointer", fontWeight: 700, color: "#374151" }}>+</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{saving ? "..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function StockOutPage({ parts, onStockOut }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ part_id: "", quantity: 1, usage: "", user: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedPart = parts.find(p => p.id === parseInt(form.part_id));
  const valid = form.part_id && form.quantity > 0 && form.usage.trim() && form.user.trim();

  useEffect(() => { fetchStockOuts().then(setRecords).finally(() => setLoading(false)); }, []);

  const handleSubmit = async () => {
    setSaving(true); setFormError("");
    try {
      const rec = await createStockOut({ part_id: parseInt(form.part_id), quantity: form.quantity, usage: form.usage, user: form.user });
      setRecords(rs => [rec, ...rs]);
      onStockOut();
      setForm({ part_id: "", quantity: 1, usage: "", user: "" });
      setShowForm(false);
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => { if (!confirm("Delete this record?")) return; await deleteStockOut(id); setRecords(rs => rs.filter(r => r.id !== id)); };
  const filtered = records.filter(r => !search || r.product_name.toLowerCase().includes(search.toLowerCase()) || r.user.toLowerCase().includes(search.toLowerCase()) || r.usage.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: "16px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div><h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111" }}>Stock Out</h2><p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Record parts taken from inventory</p></div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input style={{ ...inputStyle, width: 220 }} placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} />
          <ExportButton onExport={exportStockOutToSheets} label="Export to Sheets" />
          <ExportButton onExport={importStockOutFromSheets} label="Import from Sheets" />
          <button onClick={() => setShowForm(true)} style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ Record Take</button>
        </div>
      </div>
      {showForm && (
        <div style={{ background: "#fff", border: "1.5px solid #e0e7ff", borderRadius: 12, padding: 18, marginBottom: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#111", marginBottom: 14 }}>New Stock Out Record</div>
          {formError && <div style={{ background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 12 }}>⚠ {formError}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Product Name *</label><select style={inputStyle} value={form.part_id} onChange={e => setF("part_id", e.target.value)}><option value="">Select part...</option>{parts.map(p => <option key={p.id} value={p.id}>{p.product_name} (Stock: {p.available_stock})</option>)}</select></div>
            <div><label style={labelStyle}>Product ID</label><input style={{ ...inputStyle, background: "#f9fafb", color: "#6b7280" }} value={selectedPart?.product_id || ""} readOnly /></div>
            <div><label style={labelStyle}>Quantity *</label><input type="number" min="1" max={selectedPart?.available_stock || 999} style={inputStyle} value={form.quantity} onChange={e => setF("quantity", parseInt(e.target.value) || 1)} /></div>
            <div><label style={labelStyle}>User *</label><input style={inputStyle} value={form.user} onChange={e => setF("user", e.target.value)} /></div>
            <div style={{ gridColumn: "span 2" }}><label style={labelStyle}>Usage / Purpose *</label><input style={inputStyle} value={form.usage} onChange={e => setF("usage", e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={!valid || saving} style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: valid && !saving ? "#1d4ed8" : "#c7d2fe", color: "#fff", fontWeight: 700, cursor: valid && !saving ? "pointer" : "not-allowed", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{saving ? "Saving..." : "Submit"}</button>
          </div>
        </div>
      )}
      {loading ? <Spinner /> : filtered.length === 0 ? <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}><div style={{ fontSize: 36, marginBottom: 8 }}>📦</div><p style={{ fontWeight: 600 }}>No stock out records yet</p></div> : (
        <div style={{ background: "#fff", border: "1.5px solid #f0f0f0", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f9fafb" }}>{["Timestamp", "Product Name", "Product ID", "Quantity", "Usage", "User", ""].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #f0f0f0" }}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>{new Date(r.timestamp).toLocaleString()}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: "#111" }}>{r.product_name}</td>
                <td style={{ padding: "10px 12px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{r.product_id}</td>
                <td style={{ padding: "10px 12px" }}><span style={{ background: "#fee2e2", color: "#7f1d1d", padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>−{r.quantity}</span></td>
                <td style={{ padding: "10px 12px", color: "#374151" }}>{r.usage}</td>
                <td style={{ padding: "10px 12px" }}><span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.user}</span></td>
                <td style={{ padding: "10px 12px" }}><button onClick={() => handleDelete(r.id)} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "1px solid #fecaca", borderRadius: 6, background: "#fff", color: "#ef4444", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SparePartsPage() {
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editPart, setEditPart] = useState(null);
  const [stockPart, setStockPart] = useState(null);
  const [view, setView] = useState("table");
  const [page, setPage] = useState("inventory");

  const load = async () => {
    setLoading(true);
    try { const [p, c] = await Promise.all([fetchParts(), fetchCategories()]); setParts(p); setCategories(c); }
    catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = parts.filter(p => !filterCat || p.category === filterCat).filter(p => !filterStatus || p.status === filterStatus).filter(p => !search || p.product_name.toLowerCase().includes(search.toLowerCase()) || p.product_id.toLowerCase().includes(search.toLowerCase()));
  const stats = { total: parts.length, critical: parts.filter(p => p.status === "critical").length, low: parts.filter(p => p.status === "low").length, ok: parts.filter(p => p.status === "ok").length };

  const handleSave = (saved) => {
    setParts(ps => ps.find(p => p.id === saved.id) ? ps.map(p => p.id === saved.id ? saved : p) : [...ps, saved]);
    setCategories(cats => saved.category && !cats.includes(saved.category) ? [...cats, saved.category].sort() : cats);
    setShowForm(false); setEditPart(null);
  };
  const handleDelete = async (id) => { if (!confirm("Delete this part?")) return; await deletePart(id); setParts(ps => ps.filter(p => p.id !== id)); };
  const handleStockSave = async (updated) => { setParts(ps => ps.map(p => p.id === updated.id ? updated : p)); setStockPart(null); const refreshed = await fetchParts(); setParts(refreshed); };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1.5px solid #f0f0f0", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div><div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>Spare Parts</div><div style={{ fontSize: 11, color: "#9ca3af" }}>Inventory Management</div></div>
        <div style={{ display: "flex", gap: 0, borderRadius: 9, overflow: "hidden", border: "1.5px solid #e5e7eb" }}>
          {[["inventory", "📦 Inventory"], ["stockout", "📤 Stock Out"]].map(([id, label]) => (
            <button key={id} onClick={() => setPage(id)} style={{ padding: "7px 16px", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: page === id ? "#1d4ed8" : "#fff", color: page === id ? "#fff" : "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>{label}</button>
          ))}
        </div>
        <ExportButton onExport={syncAllToSheets} label="🔄 Sync to Sheets" />
        {page === "inventory" && <>
          <div style={{ flex: 1, maxWidth: 280 }}><input style={inputStyle} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 3, background: "#f5f5f5", padding: 3, borderRadius: 8 }}>
              {["table", "grid"].map(v => <button key={v} onClick={() => setView(v)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: view === v ? "#fff" : "transparent", fontWeight: 600, fontSize: 12, cursor: "pointer", color: view === v ? "#111" : "#9ca3af" }}>{v === "table" ? "☰" : "⊞"}</button>)}
            </div>
            <ExportButton onExport={importInventoryFromSheets} label="Import" />
            <ExportButton onExport={exportInventoryToSheets} label="Export" />
            <button onClick={() => { setEditPart(null); setShowForm(true); }} style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Add Part</button>
          </div>
        </>}
      </div>

      {page === "stockout" ? <StockOutPage parts={parts} onStockOut={load} /> : (
      <div style={{ padding: "16px 24px" }}>
        {error && <div style={{ background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>⚠️ {error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 10, marginBottom: 16 }}>
          {[{ label: "Total Parts", value: stats.total, color: "#1d4ed8", bg: "#eff6ff" }, { label: "OK", value: stats.ok, color: "#059669", bg: "#ecfdf5" }, { label: "Low Stock", value: stats.low, color: "#d97706", bg: "#fffbeb" }, { label: "Critical", value: stats.critical, color: "#dc2626", bg: "#fef2f2" }].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: "12px 14px", border: `1.5px solid ${c.color}22` }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{loading ? "—" : c.value}</div>
              <div style={{ fontSize: 11, color: c.color, fontWeight: 600 }}>{c.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={() => setFilterCat("")} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, border: "1.5px solid " + (!filterCat ? "#1d4ed8" : "#e5e7eb"), background: !filterCat ? "#eff6ff" : "#fff", color: !filterCat ? "#1d4ed8" : "#6b7280", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>All</button>
          {categories.map(c => <button key={c} onClick={() => setFilterCat(filterCat === c ? "" : c)} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, border: "1.5px solid " + (filterCat === c ? "#1d4ed8" : "#e5e7eb"), background: filterCat === c ? "#eff6ff" : "#fff", color: filterCat === c ? "#1d4ed8" : "#6b7280", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{c}</button>)}
        </div>
        {loading ? <Spinner /> : filtered.length === 0 ? <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>No parts found</div> : view === "table" ? (
          <div style={{ background: "#fff", border: "1.5px solid #f0f0f0", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: "#f9fafb" }}>{["Image", "Product Name", "Product ID", "Category", "Available", "Minimum", "Rack", "Status", ""].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #f0f0f0" }}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                  <td style={{ padding: "8px 12px" }}>{p.image_url ? <img src={BASE_URL + p.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} /> : <div style={{ width: 40, height: 40, borderRadius: 6, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>🔧</div>}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 700, color: "#111" }}>{p.product_name}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{p.product_id}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{p.category || "—"}</td>
                  <td style={{ padding: "8px 12px" }}><button onClick={() => setStockPart(p)} style={{ fontWeight: 800, fontSize: 15, color: p.status === "critical" ? "#dc2626" : p.status === "low" ? "#d97706" : "#059669", background: "none", border: "none", cursor: "pointer" }}>{p.available_stock}</button></td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{p.minimum_stock}</td>
                  <td style={{ padding: "8px 12px", color: "#6b7280" }}>{p.rack || "—"}</td>
                  <td style={{ padding: "8px 12px" }}><StockBadge part={p} /></td>
                  <td style={{ padding: "8px 12px" }}><div style={{ display: "flex", gap: 4 }}><button onClick={() => { setEditPart(p); setShowForm(true); }} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Edit</button><button onClick={() => handleDelete(p.id)} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "1px solid #fecaca", borderRadius: 6, background: "#fff", color: "#ef4444", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 }}>
            {filtered.map(p => (
              <div key={p.id} style={{ background: "#fff", border: `1.5px solid ${p.status === "critical" ? "#fecaca" : p.status === "low" ? "#fed7aa" : "#f0f0f0"}`, borderRadius: 12, overflow: "hidden", borderTop: `3px solid ${p.status === "critical" ? "#ef4444" : p.status === "low" ? "#f97316" : "#10b981"}` }}>
                <div style={{ height: 120, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>{p.image_url ? <img src={BASE_URL + p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <div style={{ fontSize: 36, color: "#d1d5db" }}>🔧</div>}</div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.product_name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", marginBottom: 6 }}>{p.product_id}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}><button onClick={() => setStockPart(p)} style={{ fontSize: 18, fontWeight: 800, color: p.status === "critical" ? "#dc2626" : p.status === "low" ? "#d97706" : "#059669", background: "none", border: "none", cursor: "pointer" }}>{p.available_stock}</button><StockBadge part={p} /></div>
                  <div style={{ display: "flex", gap: 5 }}><button onClick={() => { setEditPart(p); setShowForm(true); }} style={{ flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600, border: "1.5px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#374151", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Edit</button><button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600, border: "1.5px solid #fecaca", borderRadius: 7, background: "#fff", color: "#ef4444", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
      {(showForm || editPart) && <PartForm part={editPart} categories={categories} onSave={handleSave} onClose={() => { setShowForm(false); setEditPart(null); }} />}
      {stockPart && <StockEditor part={stockPart} onSave={handleStockSave} onClose={() => setStockPart(null)} />}
    </div>
  );
}
