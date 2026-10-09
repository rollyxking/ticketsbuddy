// Browser-side helpers for the Token Image flow.
export const MAX_BYTES = 1.5 * 1024 * 1024; // per image; must match the server limit (front + back share one request)
const HARD_LIMIT = 15 * 1024 * 1024;      // refuse to even try shrinking anything bigger
export const ACCEPT = ".jpg,.jpeg,.png,image/jpeg,image/png";
export const PENDING = "Pending Verification";

async function call(url, opts) {
  let r;
  try { r = await fetch(url, { credentials: "same-origin", ...opts }); }
  catch { throw new Error("Can't reach the server. Check your internet connection and try again."); }
  let body = null;
  try { body = await r.json(); } catch {}
  if (!r.ok) {
    // /api answered with a non-JSON page (usually a 404): the serverless functions aren't running.
    const msg = body && body.error
      ? body.error
      : r.status === 404 || r.status === 405
        ? "The order server isn't running. Locally use `npx vercel dev` (not `npm run dev`); on the live site, redeploy to Vercel."
        : "Something went wrong. Please try again.";
    const e = new Error(msg); e.status = r.status; throw e;
  }
  return body || {};
}
const post = (url, data, method = "POST") => call(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Couldn't read that file."));
    r.readAsDataURL(blob);
  });
}

// Phone photos are often several MB, so oversized images are scaled down automatically.
async function shrink(file) {
  const bmp = await createImageBitmap(file).catch(() => { throw new Error("That image couldn't be read."); });
  for (const maxSide of [2200, 1600, 1200, 900]) {
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    for (let q = 0.85; q >= 0.5; q -= 0.1) {
      const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", q));
      if (blob && blob.size <= MAX_BYTES) return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  }
  throw new Error("That image is too large. Please choose a smaller one.");
}

export async function prepareImage(file) {
  if (!["image/jpeg", "image/png"].includes(file.type) || !/\.(jpe?g|png)$/i.test(file.name)) throw new Error("Please choose a JPG, JPEG or PNG image.");
  if (file.size > HARD_LIMIT) throw new Error("That image is too large. Please choose one under 15 MB.");
  return file.size <= MAX_BYTES ? file : shrink(file);
}

export async function submitTokenOrder({ eventId, ticket, qty, name, email, front, back }) {
  const [fd, bd] = await Promise.all([toBase64(front), toBase64(back)]);
  return post("/api/orders/create", {
    eventId, ticket, qty, name, email,
    images: { front: { type: front.type, data: fd }, back: { type: back.type, data: bd } },
  });
}

export const fetchStatus = (id, token) => call(`/api/orders/status?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`);

export const adminApi = {
  me: () => call("/api/admin/session"),
  login: (password) => post("/api/admin/session", { password }),
  logout: () => call("/api/admin/session", { method: "DELETE" }),
  list: () => call("/api/admin/orders"),
  decide: (id, decision, note) => post("/api/admin/decision", { id, decision, note }),
  imageUrl: (id, side = "front") => `/api/admin/image?id=${encodeURIComponent(id)}&side=${side}`,
};
