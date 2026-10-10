// Minimal Supabase REST client (Postgres + private Storage) using fetch. No SDK needed.
// Uses the SERVICE ROLE / SECRET key, which must only ever exist on the server.
function cfg() {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "").replace(/\/(rest|storage)\/v1$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) throw new Error("not_configured");
  return { url, key, bucket: process.env.TOKEN_BUCKET || "token-images" };
}

// Legacy keys are JWTs (eyJ...) and go in both headers. New-style secret keys (sb_secret_...)
// are NOT JWTs and must only be sent in the apikey header, or Supabase rejects the request.
const isJwt = (k) => k.split(".").length === 3;
const auth = (key, extra = {}) => ({ apikey: key, ...(isJwt(key) ? { Authorization: `Bearer ${key}` } : {}), ...extra });

async function fail(prefix, r) {
  const e = new Error(prefix + "_" + r.status);
  e.detail = (await r.text().catch(() => "")).slice(0, 300);
  return e;
}

export async function dbInsert(table, row) {
  const { url, key } = cfg();
  const r = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: auth(key, { "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify(row),
  });
  if (!r.ok) throw await fail("db_insert", r);
}

export async function dbSelect(table, query) {
  const { url, key } = cfg();
  const r = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: auth(key) });
  if (!r.ok) throw await fail("db_select", r);
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
  if (!r.ok) throw await fail("db_patch", r);
  return r.json();
}

// Creates the PRIVATE bucket if it doesn't exist yet (so a missed SQL step can't break uploads).
export async function storageEnsureBucket() {
  const { url, key, bucket } = cfg();
  const r = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: auth(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ id: bucket, name: bucket, public: false }),
  });
  return r.ok || r.status === 409;
}

export async function storageBucketInfo() {
  const { url, key, bucket } = cfg();
  const r = await fetch(`${url}/storage/v1/bucket/${bucket}`, { headers: auth(key) });
  if (!r.ok) throw await fail("bucket_get", r);
  return r.json();
}

export async function storagePut(path, buffer, contentType) {
  const { url, key, bucket } = cfg();
  const send = () =>
    fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: auth(key, { "Content-Type": contentType, "x-upsert": "false" }),
      body: buffer,
    });
  let r = await send();
  if (!r.ok) {
    const body = await r.clone().text().catch(() => "");
    if (/bucket not found/i.test(body) && (await storageEnsureBucket())) r = await send();
  }
  if (!r.ok) throw await fail("storage_put", r);
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
