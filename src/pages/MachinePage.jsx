import { useState, useMemo } from "react";
import { MACHINES } from "./machineData.js";

const CAT_COLORS = {
  "Robot":                { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  "Controller":           { bg: "#f5f3ff", color: "#6d28d9", dot: "#8b5cf6" },
  "Spot Welding":         { bg: "#fff7ed", color: "#c2410c", dot: "#f97316" },
  "Press Machine":        { bg: "#fef9c3", color: "#92400e", dot: "#eab308" },
  "Compressor":           { bg: "#ecfdf5", color: "#065f46", dot: "#10b981" },
  "Overhead Crane":       { bg: "#fdf2f8", color: "#86198f", dot: "#d946ef" },
  "Electrical Supply":    { bg: "#fef2f2", color: "#991b1b", dot: "#ef4444" },
  "Water Supply":         { bg: "#e0f2fe", color: "#075985", dot: "#0ea5e9" },
  "Power Supply":         { bg: "#fef9c3", color: "#713f12", dot: "#f59e0b" },
  "LEV":                  { bg: "#f0fdf4", color: "#166534", dot: "#22c55e" },
  "Autolator":            { bg: "#fdf4ff", color: "#7e22ce", dot: "#a855f7" },
  "Uncoiler":             { bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e" },
  "Straightener Feeder":  { bg: "#f0fdfa", color: "#134e4a", dot: "#14b8a6" },
  "Feeder":               { bg: "#fefce8", color: "#854d0e", dot: "#ca8a04" },
  "Pacer":                { bg: "#f8fafc", color: "#475569", dot: "#64748b" },
};

function getCatStyle(cat) {
  return CAT_COLORS[cat] || { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
}

function CatBadge({ category }) {
  const s = getCatStyle(category);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
      {category || "—"}
    </span>
  );
}

export default function MachinePage() {
  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(null);

  const locations  = [...new Set(MACHINES.map(m => m.location).filter(Boolean))].sort();
  const sections   = [...new Set(MACHINES.map(m => m.section).filter(Boolean))].sort();
  const categories = [...new Set(MACHINES.map(m => m.category).filter(Boolean))].sort();

  const filtered = useMemo(() => MACHINES.filter(m => {
    if (filterLocation && m.location !== filterLocation) return false;
    if (filterSection  && m.section  !== filterSection)  return false;
    if (filterCategory && m.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.model.toLowerCase().includes(q) ||
        m.serial.toLowerCase().includes(q) || m.maker.toLowerCase().includes(q) || m.line.toLowerCase().includes(q);
    }
    return true;
  }), [search, filterLocation, filterSection, filterCategory]);

  const selStyle = { padding: "7px 11px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#111", background: "#fff", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" };
  const clearActive = search || filterLocation || filterSection || filterCategory;

  return (
    <div style={{ padding: "20px 24px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Detail modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{selected.location} · {selected.section} · Line {selected.line}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ border: "none", background: "#f5f5f5", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 18, color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <CatBadge category={selected.category} />
                {selected.subCategory && <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: 99 }}>{selected.subCategory}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                {[["Model", selected.model||"—"], ["Serial Number", selected.serial||"—"], ["Maker", selected.maker||"—"], ["Line", selected.line||"—"], ["Installation Date", selected.installed||"—"], ["Made of Year", selected.made||"—"]].map(([k,v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, color: "#111", fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>Machine List</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>{filtered.length} of {MACHINES.length} machines</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "#f5f5f5", padding: 3, borderRadius: 8 }}>
          {[["table", "☰ Table"], ["card", "⊞ Cards"]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: view===v?"#fff":"transparent", fontWeight: 700, fontSize: 12, cursor: "pointer", color: view===v?"#111":"#9ca3af", boxShadow: view===v?"0 1px 3px rgba(0,0,0,0.08)":"none", fontFamily: "'DM Sans', sans-serif" }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input style={{ ...selStyle, flex: "1 1 200px", minWidth: 180 }} placeholder="🔍 Search name, model, serial, maker..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select style={selStyle} value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
          <option value="">All Locations</option>
          {locations.map(l => <option key={l}>{l}</option>)}
        </select>
        <select style={selStyle} value={filterSection} onChange={e => setFilterSection(e.target.value)}>
          <option value="">All Sections</option>
          {sections.map(s => <option key={s}>{s}</option>)}
        </select>
        <select style={selStyle} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        {clearActive && (
          <button onClick={() => { setSearch(""); setFilterLocation(""); setFilterSection(""); setFilterCategory(""); }}
            style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff", color: "#ef4444", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Clear
          </button>
        )}
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {categories.filter(c => filtered.some(m => m.category === c)).map(cat => {
          const count = filtered.filter(m => m.category === cat).length;
          const s = getCatStyle(cat);
          return (
            <button key={cat} onClick={() => setFilterCategory(filterCategory===cat?"":cat)} style={{
              padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              border: `1.5px solid ${filterCategory===cat?s.dot:"#e5e7eb"}`,
              background: filterCategory===cat?s.bg:"#fff",
              color: filterCategory===cat?s.color:"#6b7280",
            }}>{cat} ({count})</button>
          );
        })}
      </div>

      {/* Table view */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔧</div>
          <p style={{ fontWeight: 600 }}>No machines match your filter</p>
        </div>
      ) : view === "table" ? (
        <div style={{ background: "#fff", border: "1.5px solid #f0f0f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Machine Name","Model","Serial No.","Line","Section","Location","Maker","Installed","Category"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={i} onClick={() => setSelected(m)} style={{ borderBottom: "1px solid #f9f9f9", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background=""}>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>{m.name}</td>
                    <td style={{ padding: "9px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>{m.model||"—"}</td>
                    <td style={{ padding: "9px 12px", color: "#6b7280", fontFamily: "monospace", fontSize: 11 }}>{m.serial||"—"}</td>
                    <td style={{ padding: "9px 12px", color: "#374151" }}>{m.line}</td>
                    <td style={{ padding: "9px 12px", color: "#374151" }}>{m.section}</td>
                    <td style={{ padding: "9px 12px", color: "#374151" }}>{m.location}</td>
                    <td style={{ padding: "9px 12px", color: "#374151" }}>{m.maker||"—"}</td>
                    <td style={{ padding: "9px 12px", color: "#374151", whiteSpace: "nowrap" }}>{m.installed||"—"}</td>
                    <td style={{ padding: "9px 12px" }}><CatBadge category={m.category} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card view */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 10 }}>
          {filtered.map((m, i) => {
            const s = getCatStyle(m.category);
            return (
              <div key={i} onClick={() => setSelected(m)} style={{ background: "#fff", borderRadius: 11, border: "1.5px solid #f0f0f0", padding: "14px 16px", cursor: "pointer", borderTop: `3px solid ${s.dot}`, transition: "box-shadow 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow=""}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#111", marginBottom: 4, lineHeight: 1.3 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>{m.location} · Line {m.line}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 12, marginBottom: 10 }}>
                  {[["Model",m.model||"—"],["Maker",m.maker||"—"],["Serial",m.serial||"—"],["Installed",m.installed||"—"]].map(([k,v]) => (
                    <div key={k}><div style={{ color: "#9ca3af", marginBottom: 1 }}>{k}</div><div style={{ color: "#374151", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div></div>
                  ))}
                </div>
                <CatBadge category={m.category} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
