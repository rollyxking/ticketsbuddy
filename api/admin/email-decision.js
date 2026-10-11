// GET  /api/admin/email-decision?id=TB-XXXXXXXX&action=approve|reject&sig=...  -> confirmation page
// POST (same params, from the page's button) -> applies the decision.
// The link in the admin email is signed, so no login is needed. GET never changes anything
// (mail scanners pre-open links); only the button press (POST) does.
import { ORDER_ID_RE } from "../_lib/http.js";
import { checkEmailSig } from "../_lib/adminAuth.js";
import { dbPatch } from "../_lib/supabase.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const page = (res, status, title, body) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<body style="font-family:system-ui,sans-serif;max-width:440px;margin:12vh auto;padding:0 20px;text-align:center">
<h2>${esc(title)}</h2>${body}</body>`);
};

export default async function handler(req, res) {
  const q = req.query || {};
  const { id, action, sig } = q;
  if (!ORDER_ID_RE.test(id || "") || !["approve", "reject"].includes(action) || !checkEmailSig(id, action, sig)) {
    return page(res, 403, "Link not valid", "<p>This link is invalid or has been altered.</p>");
  }
  const word = action === "approve" ? "Approve" : "Reject";

  if (req.method === "GET") {
    return page(res, 200, `${word} order ${id}?`,
      `<p>This updates the customer's ticket status right away.</p>
<form method="POST" action="/api/admin/email-decision?id=${esc(id)}&action=${esc(action)}&sig=${esc(sig)}">
<button style="font-size:18px;padding:12px 28px;border:0;border-radius:8px;color:#fff;background:${action === "approve" ? "#16a34a" : "#dc2626"}">${word} order</button></form>`);
  }
  if (req.method !== "POST") return page(res, 405, "Not allowed", "");

  try {
    const rows = await dbPatch("orders", `id=eq.${id}&status=eq.${encodeURIComponent("Pending Verification")}`, {
      status: action === "approve" ? "Approved" : "Rejected",
      admin_note: null,
      decided_at: new Date().toISOString(),
    });
    if (!rows.length) return page(res, 409, "Already decided", `<p>Order ${esc(id)} has already been decided (or doesn't exist).</p>`);
    return page(res, 200, action === "approve" ? "Order approved \u2705" : "Order rejected", `<p>Order ${esc(id)} is now <b>${esc(rows[0].status)}</b>. The customer's page will update within about 15 seconds.</p>`);
  } catch {
    return page(res, 500, "Something went wrong", "<p>Could not update the order. Try again or use the admin dashboard.</p>");
  }
}
