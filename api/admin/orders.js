// GET /api/admin/orders  (admin only). Never returns image paths or token hashes.
import { json } from "../_lib/http.js";
import { isAdmin } from "../_lib/adminAuth.js";
import { dbSelect } from "../_lib/supabase.js";

const COLS = "id,status,customer_name,customer_email,amount_cents,qty,ticket_label,event_city,event_venue,event_date,event_time,admin_note,created_at,decided_at";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  if (!isAdmin(req)) return json(res, 401, { error: "Not signed in" });
  try {
    const orders = await dbSelect("orders", `select=${COLS}&order=created_at.desc&limit=300`);
    return json(res, 200, { orders });
  } catch {
    return json(res, 500, { error: "Could not load orders" });
  }
}
