// GET = am I signed in?  POST {password} = sign in.  DELETE = sign out.
import { json } from "../_lib/http.js";
import { adminConfigured, checkPassword, startSession, endSession, isAdmin } from "../_lib/adminAuth.js";

export default async function handler(req, res) {
  if (req.method === "GET") return isAdmin(req) ? json(res, 200, { ok: true }) : json(res, 401, { error: "Not signed in" });
  if (req.method === "DELETE") { endSession(req, res); return json(res, 200, { ok: true }); }
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  if (!adminConfigured()) return json(res, 503, { error: "Admin sign-in isn't configured." });
  if (!checkPassword(String((req.body || {}).password || ""))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return json(res, 401, { error: "Incorrect password." });
  }
  startSession(req, res);
  return json(res, 200, { ok: true });
}
