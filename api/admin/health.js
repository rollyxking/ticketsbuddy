// GET /api/admin/health  -> setup checklist (admin only)
// POST /api/admin/health {action:"test-mail"} -> sends a test email to the admin address
import { json } from "../_lib/http.js";
import { isAdmin } from "../_lib/adminAuth.js";
import { dbSelect, storageBucketInfo, keyKind, keyIsServerKey } from "../_lib/supabase.js";
import { sendMail, adminEmail } from "../_lib/mail.js";

export default async function handler(req, res) {
  if (!isAdmin(req)) return json(res, 401, { error: "Not signed in" });

  if (req.method === "POST") {
    if ((req.body || {}).action !== "test-mail") return json(res, 400, { error: "Unknown action" });
    const r = await sendMail({ subject: "TicketBuddy test email", text: "If you can read this, order alerts will reach you.", html: "<p>If you can read this, order alerts will reach you.</p>" });
    return json(res, 200, r.ok ? { ok: true, to: adminEmail() } : { ok: false, detail: r.detail, status: r.status });
  }
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const checks = [];
  const add = (name, ok, hint) => checks.push({ name, ok, hint: ok ? "" : hint });
  const url = process.env.SUPABASE_URL || "";
  add("SUPABASE_URL is set", !!url, "Add SUPABASE_URL (Supabase > Settings > API > Project URL) in Vercel and redeploy.");
  add("SUPABASE_SERVICE_ROLE_KEY is set", !!process.env.SUPABASE_SERVICE_ROLE_KEY, "Add the service_role (or secret) key in Vercel and redeploy.");

  add("Supabase URL looks right", !url || /^https:\/\/[a-z0-9-]+\.supabase\.(co|in|net)\/?$/i.test(url.trim()), "It should look like https://abcdxyz.supabase.co (Settings > API > Project URL), with nothing after .co");
  add("Key is a server key (service_role / secret)", keyIsServerKey(), `The key in SUPABASE_SERVICE_ROLE_KEY is the ${keyKind()} key. Copy the service_role (legacy) or secret key instead, update it in Vercel and redeploy.`);

  const code = (e) => `${e.message}${e.detail ? " – " + e.detail : ""}`;
  try {
    await dbSelect("orders", "select=id&limit=1");
    add("Database table 'orders' is reachable", true);
  } catch (e) {
    add("Database table 'orders' is reachable", false, /_40[13]/.test(e.message) ? `Supabase rejected the key (${code(e)}). Use the service_role / secret key, not the anon/publishable key.` : `Run supabase/schema.sql in the Supabase SQL editor. (${code(e)})`);
  }
  try {
    await dbSelect("orders", "select=token_back_image_path&limit=1");
    add("Front + back image column exists", true);
  } catch (e) {
    add("Front + back image column exists", false, "Run: alter table public.orders add column if not exists token_back_image_path text;");
  }
  try {
    const b = await storageBucketInfo();
    add("Storage bucket exists and is PRIVATE", b.public === false, "The bucket is public. Make it private in Supabase > Storage.");
  } catch (e) {
    add("Storage bucket exists and is PRIVATE", false, /_40[13]/.test(e.message) ? `Supabase rejected the key (${code(e)}).` : "Bucket missing. It is created automatically on the first upload, or run supabase/schema.sql.");
  }
  add("RESEND_API_KEY is set", !!process.env.RESEND_API_KEY, "Add RESEND_API_KEY in Vercel and redeploy.");
  return json(res, 200, { checks, notify: adminEmail() });
}
