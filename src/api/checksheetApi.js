const BASE = import.meta.env.VITE_API_URL;
const APP_ID = 1;

export async function fetchLines() {
  const res = await fetch(`${BASE}/api/apps/${APP_ID}`);
  const data = await res.json();
  return data.schema_fields
    .filter(f => f.type === "line")
    .map(f => ({ id: f.key, name: f.label, sub: f.options?.[0] || "Line" }));
}

export async function saveLines(lines) {
  const fields = lines.map(l => ({
    key: l.id, label: l.name, type: "line",
    options: [l.sub], required: false,
  }));
  const res = await fetch(`${BASE}/api/apps/${APP_ID}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schema_fields: fields }),
  });
  return res.json();
}

export async function fetchRecords(lineId = null) {
  let url = `${BASE}/api/apps/${APP_ID}/records/?page_size=100`;
  if (lineId) url += `&filter_field=lineId&filter_value=${lineId}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items.map(item => ({ id: String(item.id), ...item.data }));
}

export async function createRecord(data) {
  const res = await fetch(`${BASE}/api/apps/${APP_ID}/records/`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(await res.text());
  const item = await res.json();
  return { id: String(item.id), ...item.data };
}

export async function updateRecord(recordId, data) {
  const res = await fetch(`${BASE}/api/apps/${APP_ID}/records/${recordId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(await res.text());
  const item = await res.json();
  return { id: String(item.id), ...item.data };
}

export async function deleteRecord(recordId) {
  await fetch(`${BASE}/api/apps/${APP_ID}/records/${recordId}`, { method: "DELETE" });
}
