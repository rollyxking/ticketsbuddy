// POST /api/admin/decision  { id, decision: "approve" | "reject", note? }  (admin only)
// Only a "Pending Verification" order can be decided, and only a signed-in admin can do it.
import { json, ORDER_ID_RE } from "../_lib/http.js";
import { isAdmin } from "../_lib/adminAuth.js";
import { dbPatch } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!isAdmin(req)) return json(res, 401, { error: "Not signed in" });
  if (!String(req.headers["content-type"] || "").includes("application/json")) return json(res, 415, { error: "JSON only" });

  const { id, decision, note } = req.body || {};
  if (!ORDER_ID_RE.test(id || "") || !["approve", "reject"].includes(decision)) return json(res, 400, { error: "Invalid request" });
  const approve = decision === "approve";
  try {
    const rows = await dbPatch("orders", `id=eq.${id}&status=eq.${encodeURIComponent("Pending Verification")}`, {
      status: approve ? "Approved" : "Rejected",
      admin_note: approve ? null : String(note || "").trim().slice(0, 300) || null,
      decided_at: new Date().toISOString(),
    });
    if (!rows.length) return json(res, 409, { error: "This order has already been decided (or doesn't exist)." });
    return json(res, 200, { status: rows[0].status });
  } catch {
    return json(res, 500, { error: "Could not update the order" });
  }
}
