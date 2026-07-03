import { Link } from "react-router-dom";

const APPS = [
  { id: "checksheet", title: "PM Checksheet", subtitle: "Preventive Maintenance", description: "Conduct inspections, log OK/NG results and track history across production lines.", path: "/checksheet", icon: "📋", color: "#1d4ed8", light: "#eff6ff", features: ["Line inspections", "OK/NG tracking", "Measurement records"] },
  { id: "spareparts", title: "Spare Parts", subtitle: "Inventory Management", description: "Track stock levels, receive low stock alerts and record parts taken from inventory.", path: "/spareparts", icon: "🔧", color: "#059669", light: "#ecfdf5", features: ["Stock tracking", "Low stock alerts", "Stock out records"] },
  { id: "machines", title: "Machine List", subtitle: "Asset Reference", description: "Browse all factory machines with specs, location, maker, and installation details.", path: "/machines", icon: "🛠️", color: "#7c3aed", light: "#f5f3ff", features: ["351 machines", "Search & filter", "Full specs"] },
];

function AppCard({ app }) {
  return (
    <Link to={app.path} style={{ textDecoration: "none" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 22, border: "1.5px solid #f0f0f0", cursor: "pointer", borderTop: `3px solid ${app.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", transition: "all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: app.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{app.icon}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#111", letterSpacing: "-0.02em" }}>{app.title}</div>
            <div style={{ fontSize: 12, color: app.color, fontWeight: 600 }}>{app.subtitle}</div>
          </div>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{app.description}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
          {app.features.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#374151" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: app.color, flexShrink: 0 }} />{f}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: app.light, borderRadius: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: app.color }}>Open {app.title}</span>
          <span style={{ color: app.color, fontWeight: 700 }}>→</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage({ user }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111", letterSpacing: "-0.03em" }}>
          Welcome back, {user.full_name?.split(" ")[0] || user.username} 👋
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280" }}>Select an application to get started</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {APPS.map(app => <AppCard key={app.id} app={app} />)}
      </div>
    </div>
  );
}
