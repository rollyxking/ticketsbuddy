// GET /api/admin/image?id=TB-XXXXXXXX&side=front|back  (admin only)
// Streams the private token image through the server. There is no public URL for it.
import { json, ORDER_ID_RE } from "../_lib/http.js";
import { isAdmin } from "../_lib/adminAuth.js";
import { dbSelect, storageGet } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  if (!isAdmin(req)) return json(res, 401, { error: "Not signed in" });
  const { id, side } = req.query || {};
  if (!ORDER_ID_RE.test(id || "") || !["front", "back"].includes(side || "front")) return json(res, 404, { error: "Not found" });
  try {
    const rows = await dbSelect("orders", `id=eq.${id}&select=token_image_path,token_back_image_path&limit=1`);
    const path = rows[0] && (side === "back" ? rows[0].token_back_image_path : rows[0].token_image_path);
    const file = path && (await storageGet(path));
    if (!file) return json(res, 404, { error: "Not found" });
    const type = file.contentType === "image/png" ? "image/png" : "image/jpeg";
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Referrer-Policy", "no-referrer");
    return res.status(200).send(file.buffer);
  } catch {
    return json(res, 500, { error: "Could not load image" });
  }
}
