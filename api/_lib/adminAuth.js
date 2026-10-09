import crypto from "node:crypto";
import { safeEqual } from "./http.js";

const COOKIE = "tb_admin";
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const secret = () => process.env.ADMIN_SESSION_SECRET || "";
const sign = (v) => crypto.createHmac("sha256", secret()).update(v).digest("hex");

export const adminConfigured = () => !!(process.env.ADMIN_PASSWORD && secret().length >= 16);
export const checkPassword = (pw) => adminConfigured() && safeEqual(pw || "", process.env.ADMIN_PASSWORD);

function cookieFlags(req) {
  const https = (req.headers["x-forwarded-proto"] || "").split(",")[0] === "https";
  return `Path=/api; HttpOnly; SameSite=Strict; ${https ? "Secure; " : ""}`;
}

export function startSession(req, res) {
  const exp = String(Date.now() + TTL_MS);
  res.setHeader("Set-Cookie", `${COOKIE}=${exp}.${sign(exp)}; ${cookieFlags(req)}Max-Age=${TTL_MS / 1000}`);
}

export function endSession(req, res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; ${cookieFlags(req)}Max-Age=0`);
}

export function isAdmin(req) {
  if (!adminConfigured()) return false;
  const raw = (req.headers.cookie || "").split(";").map((s) => s.trim()).find((s) => s.startsWith(COOKIE + "="));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}
