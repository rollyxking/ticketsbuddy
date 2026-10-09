// GET /api/orders/status?id=TB-XXXXXXXX&token=<accessToken>
// Lets a customer see ONLY their own order's status (never the image).
import { json, sha256, safeEqual, ORDER_ID_RE } from "../_lib/http.js";
import { dbSelect } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  const { id, token } = req.query || {};
  if (!ORDER_ID_RE.test(id || "") || typeof token !== "string" || !token) return json(res, 404, { error: "Not found" });
  try {
    const rows = await dbSelect("orders", `id=eq.${id}&select=status,admin_note,access_token_hash&limit=1`);
    const o = rows[0];
    if (!o || !safeEqual(sha256(token), o.access_token_hash)) return json(res, 404, { error: "Not found" });
    return json(res, 200, { status: o.status, note: o.status === "Rejected" ? o.admin_note || "" : "" });
  } catch {
    return json(res, 500, { error: "Could not load status" });
  }
}
