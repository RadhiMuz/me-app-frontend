const HOST = window.location.hostname;
const BASE = `http://${HOST}:8000/api/spare-parts`;
const STOCK_OUT_BASE = `http://${HOST}:8000/api/stock-out`;
const EXPORT_BASE = `http://${HOST}:8000/api/export`;

export async function fetchParts({ category, status, search } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const res = await fetch(`${BASE}/?${params}`);
  if (!res.ok) throw new Error("Failed to fetch parts");
  return res.json();
}
export async function fetchCategories() {
  const res = await fetch(`${BASE}/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}
export async function createPart(data) {
  const res = await fetch(`${BASE}/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function updatePart(id, data) {
  const res = await fetch(`${BASE}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function deletePart(id) { await fetch(`${BASE}/${id}`, { method: "DELETE" }); }
export async function uploadImage(id, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/${id}/image`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function fetchStockOuts() {
  const res = await fetch(`${STOCK_OUT_BASE}/`);
  if (!res.ok) throw new Error("Failed to fetch stock out records");
  return res.json();
}
export async function createStockOut(data) {
  const res = await fetch(`${STOCK_OUT_BASE}/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to record stock out"); }
  return res.json();
}
export async function deleteStockOut(id) { await fetch(`${STOCK_OUT_BASE}/${id}`, { method: "DELETE" }); }
export async function exportInventoryToSheets() {
  const res = await fetch(`${EXPORT_BASE}/inventory`, { method: "POST" });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Export failed"); }
  return res.json();
}
export async function exportStockOutToSheets() {
  const res = await fetch(`${EXPORT_BASE}/stock-out`, { method: "POST" });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Export failed"); }
  return res.json();
}
export async function importInventoryFromSheets() {
  const res = await fetch(`${EXPORT_BASE}/import/inventory`, { method: "POST" });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Import failed"); }
  return res.json();
}
export async function importStockOutFromSheets() {
  const res = await fetch(`${EXPORT_BASE}/import/stock-out`, { method: "POST" });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Import failed"); }
  return res.json();
}
export async function syncAllToSheets() {
  const res = await fetch(`${EXPORT_BASE}/sync`, { method: "POST" });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Sync failed"); }
  return res.json();
}
