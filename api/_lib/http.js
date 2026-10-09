import crypto from "node:crypto";

export function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

export const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// Constant-time string compare (hashes both sides so lengths never leak).
export function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

export const ORDER_ID_RE = /^TB-[A-Z0-9]{8}$/;

export function newOrderId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[bytes[i] % alphabet.length];
  return "TB-" + s;
}

export const siteUrl = () =>
  (process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL : "http://localhost:3000")
  ).replace(/\/$/, "");
