import { useState, useEffect } from "react";
import { fetchLines, saveLines, fetchRecords, createRecord, deleteRecord } from "../api/checksheetApi.js";
import { CHECKLIST_ITEMS, CATEGORIES } from "./checklistData.js";

function genId() { return Math.random().toString(36).slice(2, 9); }
function nowDT() { return new Date().toISOString().slice(0, 16); }

const inputStyle = { width: "100%", padding: "9px 11px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, color: "#111", background: "#fff", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" };

const INITIAL_LINES = [
  { id: "l1", name: "Line 5", sub: "Production A" },
  { id: "l2", name: "Line 5_1", sub: "Sub-line 1" },
  { id: "l3", name: "Line 5_2", sub: "Sub-line 2" },
  { id: "l4", name: "Line 8", sub: "Production B" },
  { id: "l5", name: "Line 8_2", sub: "Sub-line 2" },
];

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
      <div style={{ width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function OkNgToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
      {["OK", "NG"].map(v => (
        <button key={v} onClick={() => onChange(value === v ? "" : v)} style={{
          width: 48, padding: "5px 0", borderRadius: 7, border: "1.5px solid",
          borderColor: value === v ? (v === "OK" ? "#10b981" : "#ef4444") : "#e5e7eb",
          background: value === v ? (v === "OK" ? "#d1fae5" : "#fee2e2") : "#fff",
          color: value === v ? (v === "OK" ? "#065f46" : "#7f1d1d") : "#9ca3af",
          fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.1s",
        }}>{v}</button>
      ))}
    </div>
  );
}

// ── Inspection Form ──────────────────────────────────────────────────────────
function InspectionForm({ line, onSave, onCancel }) {
  const initItems = () => Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.id, {
    result: "",
    remarks: "",
    measurements: i.measurements ? Object.fromEntries(Object.keys(i.measurements).map(k => [k, ""])) : null,
  }]));
  const [header, setHeader] = useState({ dateTime: nowDT(), checkedBy: "", approvedBy: "" });
  const [items, setItems] = useState(initItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setH = (k, v) => setHeader(h => ({ ...h, [k]: v }));
  const setResult = (id, v) => setItems(s => ({ ...s, [id]: { ...s[id], result: v } }));
  const setRemarks = (id, v) => setItems(s => ({ ...s, [id]: { ...s[id], remarks: v } }));
  const setMeasurement = (id, key, v) => setItems(s => ({ ...s, [id]: { ...s[id], measurements: { ...s[id].measurements, [key]: v } } }));

  const okCount = Object.values(items).filter(i => i.result === "OK").length;
  const ngCount = Object.values(items).filter(i => i.result === "NG").length;
  const totalItems = CHECKLIST_ITEMS.length;
  const allFilled = header.checkedBy.trim() && Object.values(items).every(i => i.result !== "");
  const progress = Math.round(((okCount + ngCount) / totalItems) * 100);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      await onSave({ lineId: line.id, lineName: line.name, ...header, items, okCount, ngCount });
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "14px 22px", borderBottom: "1px solid #f0f0f0", background: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>
              New Inspection — {line.name}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{line.sub} · {totalItems} items</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ background: "#d1fae5", color: "#065f46", borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 700 }}>OK: {okCount}</div>
            <div style={{ background: ngCount > 0 ? "#fee2e2" : "#f3f4f6", color: ngCount > 0 ? "#7f1d1d" : "#9ca3af", borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 700 }}>NG: {ngCount}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 5, background: "#f0f0f0", borderRadius: 99, marginBottom: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: progress + "%", background: ngCount > 0 ? "#f97316" : "#10b981", borderRadius: 99, transition: "width 0.3s" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 8 }}>
          {[
            { label: "Date & Time", key: "dateTime", type: "datetime-local" },
            { label: "Checked By *", key: "checkedBy", type: "text", placeholder: "Inspector name" },
            { label: "Approved By", key: "approvedBy", type: "text", placeholder: "Supervisor name" },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input type={f.type} style={inputStyle} placeholder={f.placeholder || ""} value={header[f.key]} onChange={e => setH(f.key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px" }}>
        {error && <div style={{ background: "#fee2e2", color: "#7f1d1d", borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        {CATEGORIES.map(cat => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.04em", padding: "5px 10px", background: "#eff6ff", borderRadius: 7, marginBottom: 6 }}>
              {cat}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {CHECKLIST_ITEMS.filter(i => i.category === cat).map((item, idx) => {
                const state = items[item.id];
                const isNG = state.result === "NG";
                return (
                  <div key={item.id} style={{
                    border: "1.5px solid " + (isNG ? "#fecaca" : "#f0f0f0"),
                    borderRadius: 9, padding: "9px 12px",
                    background: isNG ? "#fff5f5" : idx % 2 === 0 ? "#fff" : "#fafafa",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", minWidth: 30, flexShrink: 0, paddingTop: 2 }}>{item.id}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: item.image ? 8 : 0 }}>{item.criteria}</div>
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.label}
                            style={{ maxWidth: 180, maxHeight: 120, borderRadius: 6, border: "1px solid #e5e7eb", objectFit: "contain", background: "#f9fafb", cursor: "pointer" }}
                            onClick={e => { e.currentTarget.style.maxWidth = e.currentTarget.style.maxWidth === "180px" ? "100%" : "180px"; e.currentTarget.style.maxHeight = e.currentTarget.style.maxHeight === "120px" ? "none" : "120px"; }}
                            title="Click to enlarge"
                          />
                        )}
                        {item.measurements && (
                          <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {Object.entries(item.measurements).map(([key, spec]) => {
                              const val = parseFloat(state.measurements?.[key]);
                              const min = spec.nominal - spec.tolerance;
                              const max = spec.nominal + spec.tolerance;
                              const outOfRange = !isNaN(val) && (val < min || val > max);
                              return (
                                <div key={key} style={{ minWidth: 160, background: "#f8fafc", border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "8px 10px" }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4338ca", marginBottom: 4 }}>{spec.label}</div>
                                  <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
                                    <span>Min: <strong style={{ color: "#374151" }}>{min.toFixed(2)}</strong></span>
                                    <span>Nom: <strong style={{ color: "#374151" }}>{spec.nominal.toFixed(2)}</strong></span>
                                    <span>Max: <strong style={{ color: "#374151" }}>{max.toFixed(2)}</strong></span>
                                  </div>
                                  <input
                                    type="number" step="0.01"
                                    placeholder="Enter value"
                                    style={{ ...inputStyle, borderColor: outOfRange ? "#ef4444" : "#c7d2fe", background: outOfRange ? "#fff5f5" : "#fff", fontSize: 13 }}
                                    value={state.measurements?.[key] || ""}
                                    onChange={e => setMeasurement(item.id, key, e.target.value)}
                                  />
                                  {outOfRange && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>⚠ Out of range!</div>}
                                  {!isNaN(val) && !outOfRange && val !== "" && <div style={{ fontSize: 11, color: "#059669", marginTop: 4, fontWeight: 600 }}>✓ Within spec</div>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <OkNgToggle value={state.result} onChange={v => setResult(item.id, v)} />
                    </div>
                    {isNG && (
                      <div style={{ marginTop: 8, paddingLeft: 40 }}>
                        <label style={{ ...labelStyle, color: "#dc2626" }}>Remarks (required for NG)</label>
                        <input type="text" style={{ ...inputStyle, borderColor: "#fca5a5" }}
                          placeholder="Describe issue and action taken..."
                          value={state.remarks}
                          onChange={e => setRemarks(item.id, e.target.value)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 22px", borderTop: "1px solid #f0f0f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: allFilled ? "#059669" : "#9ca3af", fontWeight: allFilled ? 600 : 400 }}>
          {allFilled ? "✓ All items completed — ready to submit" : `${okCount + ngCount} / ${totalItems} items filled`}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          <button onClick={handleSave} disabled={!allFilled || saving} style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: allFilled && !saving ? "#1d4ed8" : "#c7d2fe", color: "#fff", fontWeight: 700, cursor: allFilled && !saving ? "pointer" : "not-allowed", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            {saving ? "Saving..." : "Submit Inspection"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Record Detail ─────────────────────────────────────────────────────────────
function RecordDetail({ record, onClose }) {
  const ngItems = CHECKLIST_ITEMS.filter(i => record.items?.[i.id]?.result === "NG");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 48px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>{record.lineName} — Inspection</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{record.dateTime?.replace("T", " ")} · Checked by: {record.checkedBy}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f5f5f5", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 18, color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ background: "#d1fae5", color: "#065f46", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>OK: {record.okCount}</div>
            <div style={{ background: record.ngCount > 0 ? "#fee2e2" : "#f3f4f6", color: record.ngCount > 0 ? "#7f1d1d" : "#9ca3af", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>NG: {record.ngCount}</div>
            {record.approvedBy && <div style={{ background: "#f5f3ff", color: "#4338ca", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>Approved: {record.approvedBy}</div>}
          </div>

          {ngItems.length > 0 && (
            <div style={{ background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", marginBottom: 8, textTransform: "uppercase" }}>⚠ NG Items ({ngItems.length})</div>
              {ngItems.map(item => (
                <div key={item.id} style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 4 }}>
                  <strong>{item.id} {item.label}</strong>
                  {record.items[item.id]?.remarks && <span style={{ color: "#9ca3af", marginLeft: 8 }}>— {record.items[item.id].remarks}</span>}
                </div>
              ))}
            </div>
          )}

          {CATEGORIES.map(cat => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{cat}</div>
              {CHECKLIST_ITEMS.filter(i => i.category === cat).map(item => {
                const state = record.items?.[item.id] || {};
                const isNG = state.result === "NG";
                return (
                  <div key={item.id} style={{ padding: "8px 0", borderBottom: "1px solid #f9f9f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 30 }}>{item.id}</span>
                      <span style={{ flex: 1, fontSize: 13, color: "#374151" }}>{item.label}</span>
                      {isNG && state.remarks && <span style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>{state.remarks}</span>}
                      <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: isNG ? "#fee2e2" : "#d1fae5", color: isNG ? "#7f1d1d" : "#065f46" }}>
                        {state.result || "—"}
                      </span>
                    </div>
                    {item.measurements && state.measurements && (
                      <div style={{ display: "flex", gap: 8, marginTop: 6, paddingLeft: 40, flexWrap: "wrap" }}>
                        {Object.entries(item.measurements).map(([key, spec]) => {
                          const val = state.measurements[key];
                          const numVal = parseFloat(val);
                          const min = spec.nominal - spec.tolerance;
                          const max = spec.nominal + spec.tolerance;
                          const outOfRange = !isNaN(numVal) && (numVal < min || numVal > max);
                          return (
                            <div key={key} style={{ background: outOfRange ? "#fff5f5" : "#f8fafc", border: `1.5px solid ${outOfRange ? "#fecaca" : "#e5e7eb"}`, borderRadius: 8, padding: "5px 10px", fontSize: 12 }}>
                              <span style={{ color: "#4338ca", fontWeight: 700 }}>{spec.label}: </span>
                              <span style={{ fontWeight: 700, color: outOfRange ? "#ef4444" : "#111" }}>{val || "—"}</span>
                              <span style={{ color: "#9ca3af", marginLeft: 6 }}>({min.toFixed(2)} ~ {max.toFixed(2)})</span>
                              {outOfRange && <span style={{ color: "#ef4444", marginLeft: 4, fontWeight: 700 }}>⚠ OOR</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Line View ─────────────────────────────────────────────────────────────────
function LineView({ line, records, onNewInspection, onDelete, loading }) {
  const [selected, setSelected] = useState(null);
  const lineRecords = records.filter(r => r.lineId === line.id).sort((a, b) => (b.dateTime || "").localeCompare(a.dateTime || ""));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>{line.name}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>{line.sub}</p>
        </div>
        <button onClick={onNewInspection} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          + New Inspection
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 22px" }}>
        {loading ? <Spinner /> : lineRecords.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
            <p style={{ fontWeight: 600 }}>No inspections yet</p>
            <p style={{ fontSize: 13 }}>Click "+ New Inspection" to start</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lineRecords.map(r => {
              const hasNG = r.ngCount > 0;
              return (
                <div key={r.id} onClick={() => setSelected(r)} style={{
                  border: "1.5px solid " + (hasNG ? "#fecaca" : "#f0f0f0"),
                  borderLeft: "4px solid " + (hasNG ? "#ef4444" : "#10b981"),
                  borderRadius: 10, padding: "12px 16px", background: "#fff", cursor: "pointer",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{r.dateTime?.replace("T", " ")}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                        Checked by: <strong>{r.checkedBy}</strong>
                        {r.approvedBy && <> · Approved by: <strong>{r.approvedBy}</strong></>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ background: "#d1fae5", color: "#065f46", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>OK {r.okCount}</span>
                      {hasNG && <span style={{ background: "#fee2e2", color: "#7f1d1d", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>NG {r.ngCount}</span>}
                      <button onClick={e => { e.stopPropagation(); onDelete(r.id); }} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "1px solid #fecaca", borderRadius: 6, background: "#fff", color: "#ef4444", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {selected && <RecordDetail record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ lines, records, loading, onSelectLine }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>Dashboard</h2>
      <p style={{ margin: "0 0 20px", color: "#9ca3af", fontSize: 14 }}>PM Inspection Overview</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Inspections", value: records.length, color: "#1d4ed8", bg: "#eff6ff" },
          { label: "Today", value: records.filter(r => r.dateTime?.startsWith(today)).length, color: "#059669", bg: "#ecfdf5" },
          { label: "With NG Items", value: records.filter(r => r.ngCount > 0).length, color: "#dc2626", bg: "#fef2f2" },
          { label: "Total Lines", value: lines.length, color: "#7c3aed", bg: "#f5f3ff" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: 16, border: `1.5px solid ${c.color}22` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color, letterSpacing: "-0.03em" }}>{loading ? "—" : c.value}</div>
            <div style={{ fontSize: 12, color: c.color, fontWeight: 600, marginTop: 2, opacity: 0.8 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Lines</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
        {lines.map(line => {
          const recs = records.filter(r => r.lineId === line.id);
          const hasNG = recs.some(r => r.ngCount > 0);
          const last = recs.sort((a, b) => (b.dateTime || "").localeCompare(a.dateTime || ""))[0];
          return (
            <div key={line.id} onClick={() => onSelectLine(line.id)} style={{
              border: "1.5px solid #f0f0f0", borderRadius: 12, padding: "14px 16px", background: "#fff", cursor: "pointer",
              borderLeft: `4px solid ${recs.length === 0 ? "#e5e7eb" : hasNG ? "#ef4444" : "#10b981"}`,
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ""}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>{line.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>{line.sub}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{recs.length === 0 ? "No inspections yet" : `${recs.length} inspection${recs.length > 1 ? "s" : ""}`}</div>
              {last && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Last: {last.dateTime?.slice(0, 10)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Manage Lines ──────────────────────────────────────────────────────────────
function ManageLines({ lines, onLinesChange }) {
  const [newName, setNewName] = useState("");
  const [newSub, setNewSub] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSub, setEditSub] = useState("");
  const [saving, setSaving] = useState(false);

  const persist = async (updated) => {
    setSaving(true);
    try { await saveLines(updated); onLinesChange(updated); }
    finally { setSaving(false); }
  };

  const add = () => {
    if (!newName.trim()) return;
    persist([...lines, { id: genId(), name: newName.trim(), sub: newSub.trim() || "Line" }]);
    setNewName(""); setNewSub("");
  };

  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>Manage Lines</h2>
      <p style={{ margin: "0 0 20px", color: "#9ca3af", fontSize: 14 }}>Add, edit or remove production lines</p>

      <div style={{ border: "1.5px dashed #c7d2fe", borderRadius: 12, padding: 16, background: "#f8f9ff", marginBottom: 20 }}>
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#4338ca" }}>+ Add New Line</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...inputStyle, flex: "1 1 140px" }} placeholder="Line name (e.g. Line 9)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
          <input style={{ ...inputStyle, flex: "1 1 140px" }} placeholder="Sub-label (optional)" value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
          <button onClick={add} disabled={saving} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#4338ca", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{saving ? "..." : "Add"}</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lines.map(line => (
          <div key={line.id} style={{ border: "1.5px solid #f0f0f0", borderRadius: 10, padding: "11px 14px", background: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
            {editId === line.id ? (
              <>
                <input style={{ ...inputStyle, flex: 1 }} value={editName} onChange={e => setEditName(e.target.value)} />
                <input style={{ ...inputStyle, flex: 1 }} value={editSub} onChange={e => setEditSub(e.target.value)} />
                <button onClick={() => { persist(lines.map(l => l.id === editId ? { ...l, name: editName, sub: editSub } : l)); setEditId(null); }} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Save</button>
                <button onClick={() => setEditId(null)} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              </>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#111", fontSize: 14 }}>{line.name}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{line.sub}</div>
                </div>
                <button onClick={() => { setEditId(line.id); setEditName(line.name); setEditSub(line.sub); }} style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, border: "1.5px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#374151", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                <button onClick={() => { if (!confirm("Delete this line?")) return; persist(lines.filter(l => l.id !== line.id)); }} style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, border: "1.5px solid #fecaca", borderRadius: 7, background: "#fff", color: "#ef4444", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function ChecksheetPage() {
  const [lines, setLines] = useState([]);
  const [records, setRecords] = useState([]);
  const [active, setActive] = useState("dashboard");
  const [inspecting, setInspecting] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [fetchedLines, fetchedRecords] = await Promise.all([fetchLines(), fetchRecords()]);
        setLines(fetchedLines.length > 0 ? fetchedLines : INITIAL_LINES);
        setRecords(fetchedRecords);
      } catch {
        setError("Cannot connect to server. Make sure the backend is running on localhost:8000.");
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSaveInspection = async (data) => {
    const rec = await createRecord(data);
    setRecords(rs => [...rs, rec]);
    setInspecting(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this inspection record?")) return;
    await deleteRecord(id);
    setRecords(rs => rs.filter(r => r.id !== id));
  };

  const activeLine = lines.find(l => l.id === active);

  const navItem = (id, label, icon, isLine = false) => {
    const isActive = active === id && !inspecting;
    const lineRecs = isLine ? records.filter(r => r.lineId === id) : [];
    const hasNG = lineRecs.some(r => r.ngCount > 0);
    return (
      <button key={id} onClick={() => { setActive(id); setInspecting(null); }} style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: isLine ? "6px 8px 6px 20px" : "8px 8px",
        border: "none", borderRadius: 8, textAlign: "left",
        background: isActive ? "#eff6ff" : "transparent",
        color: isActive ? "#1d4ed8" : isLine ? "#6b7280" : "#374151",
        fontWeight: isActive ? 700 : 600, fontSize: isLine ? 13 : 13.5,
        cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background 0.1s",
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        {sidebarOpen && <span style={{ flex: 1 }}>{label}</span>}
        {sidebarOpen && isLine && hasNG && <span style={{ fontSize: 10, fontWeight: 700, background: "#fee2e2", color: "#dc2626", padding: "1px 6px", borderRadius: 99 }}>NG</span>}
        {sidebarOpen && isLine && lineRecs.length > 0 && !hasNG && <span style={{ fontSize: 10, fontWeight: 700, background: "#d1fae5", color: "#065f46", padding: "1px 6px", borderRadius: 99 }}>{lineRecs.length}</span>}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 215 : 48, flexShrink: 0, background: "#fff", borderRight: "1.5px solid #f0f0f0", display: "flex", flexDirection: "column", transition: "width 0.2s", overflow: "hidden" }}>
        <div style={{ padding: sidebarOpen ? "16px 14px 12px" : "16px 10px 12px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#111", letterSpacing: "-0.02em" }}>PM Checksheet</div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Inspection System</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ border: "none", background: "#f5f5f5", borderRadius: 7, width: 26, height: 26, cursor: "pointer", fontSize: 14, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>≡</button>
        </div>
        <div style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
          {navItem("dashboard", "Dashboard", "📊")}
          {navItem("manage", "Manage Lines", "⚙️")}
          {sidebarOpen && lines.length > 0 && <div style={{ margin: "10px 6px 4px", fontSize: 9, fontWeight: 700, color: "#d1d5db", letterSpacing: "0.08em", textTransform: "uppercase" }}>Production Lines</div>}
          {lines.map(l => navItem(l.id, l.name, "🔧", true))}
        </div>
        {sidebarOpen && <div style={{ padding: "8px 12px", borderTop: "1px solid #f5f5f5", fontSize: 10, color: "#d1d5db" }}>v1.0 · {records.length} inspections</div>}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {error && <div style={{ background: "#fee2e2", color: "#7f1d1d", padding: "10px 20px", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #fecaca" }}>⚠️ {error}</div>}
        {inspecting ? (
          <InspectionForm line={lines.find(l => l.id === inspecting)} onSave={handleSaveInspection} onCancel={() => setInspecting(null)} />
        ) : active === "dashboard" ? (
          <Dashboard lines={lines} records={records} loading={loading} onSelectLine={id => setActive(id)} />
        ) : active === "manage" ? (
          <ManageLines lines={lines} onLinesChange={setLines} />
        ) : activeLine ? (
          <LineView line={activeLine} records={records} onNewInspection={() => setInspecting(active)} onDelete={handleDelete} loading={loading} />
        ) : null}
      </div>
    </div>
  );
}