// Minimal Supabase REST client (Postgres + private Storage) using fetch. No SDK needed.
// Uses the SERVICE ROLE key, which must only ever exist on the server.
function cfg() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("not_configured");
  return { url, key, bucket: process.env.TOKEN_BUCKET || "token-images" };
}
const auth = (key, extra = {}) => ({ apikey: key, Authorization: `Bearer ${key}`, ...extra });

export async function dbInsert(table, row) {
  const { url, key } = cfg();
  const r = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: auth(key, { "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error("db_insert_" + r.status);
}

export async function dbSelect(table, query) {
  const { url, key } = cfg();
  const r = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: auth(key) });
  if (!r.ok) throw new Error("db_select_" + r.status);
  return r.json();
}

// Returns the updated rows (empty array if the filter matched nothing).
export async function dbPatch(table, query, patch) {
  const { url, key } = cfg();
  const r = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: auth(key, { "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error("db_patch_" + r.status);
  return r.json();
}

export async function storagePut(path, buffer, contentType) {
  const { url, key, bucket } = cfg();
  const r = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: auth(key, { "Content-Type": contentType, "x-upsert": "false" }),
    body: buffer,
  });
  if (!r.ok) throw new Error("storage_put_" + r.status);
}

export async function storageGet(path) {
  const { url, key, bucket } = cfg();
  const r = await fetch(`${url}/storage/v1/object/authenticated/${bucket}/${path}`, { headers: auth(key) });
  if (!r.ok) return null;
  return { buffer: Buffer.from(await r.arrayBuffer()), contentType: r.headers.get("content-type") };
}

export async function storageDelete(path) {
  try {
    const { url, key, bucket } = cfg();
    await fetch(`${url}/storage/v1/object/${bucket}/${path}`, { method: "DELETE", headers: auth(key) });
  } catch { /* best effort cleanup */ }
}
