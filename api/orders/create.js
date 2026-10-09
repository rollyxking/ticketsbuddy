// POST /api/orders/create
// Body: { eventId, ticket, qty, name, email, images: { front: {type,data}, back: {type,data} } }  (data = base64)
// Validates the order + BOTH images on the server, stores them in a PRIVATE bucket,
// saves the order as "Pending Verification" and emails the admin.
import crypto from "node:crypto";
import { json, sha256, newOrderId, siteUrl } from "../_lib/http.js";
import { priceOrder } from "../_lib/pricing.js";
import { dbInsert, storagePut, storageDelete } from "../_lib/supabase.js";
import { notifyAdmin } from "../_lib/mail.js";

// Two images share Vercel's 4.5 MB request limit, so each is capped at 1.5 MB (the browser shrinks bigger photos first).
const MAX_BYTES = 1.5 * 1024 * 1024;
const isJpeg = (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const isPng = (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

// Returns { buf, ext, contentType } or { status, error }.
function readImage(img, label) {
  if (!img || typeof img.data !== "string" || !["image/jpeg", "image/png"].includes(img.type)) {
    return { status: 400, error: `Upload the ${label} of your token as a JPG, JPEG or PNG image.` };
  }
  if (img.data.length > Math.ceil((MAX_BYTES * 4) / 3) + 8) return { status: 413, error: `The ${label} image is too large.` };
  const buf = Buffer.from(img.data, "base64");
  if (!buf.length) return { status: 400, error: `Upload the ${label} of your token as a JPG, JPEG or PNG image.` };
  if (buf.length > MAX_BYTES) return { status: 413, error: `The ${label} image is too large.` };
  const ext = isJpeg(buf) ? "jpg" : isPng(buf) ? "png" : null; // real file signature, not the declared type
  if (!ext) return { status: 400, error: `The ${label} file isn't a valid JPG or PNG image.` };
  return { buf, ext, contentType: ext === "jpg" ? "image/jpeg" : "image/png" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const { eventId, ticket, qty, name, email, images } = req.body || {};
  const priced = priceOrder({ eventId, ticket, qty });
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim();
  if (!priced || cleanName.length < 2 || cleanName.length > 100 || !/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 200) {
    return json(res, 400, { error: "Invalid order details." });
  }

  const front = readImage(images && images.front, "front");
  if (front.error) return json(res, front.status, { error: front.error });
  const back = readImage(images && images.back, "back");
  if (back.error) return json(res, back.status, { error: back.error });

  const orderId = newOrderId();
  const accessToken = crypto.randomBytes(24).toString("hex"); // lets the customer (only) check this order's status
  const frontPath = `orders/${orderId}/front-${crypto.randomBytes(16).toString("hex")}.${front.ext}`;
  const backPath = `orders/${orderId}/back-${crypto.randomBytes(16).toString("hex")}.${back.ext}`;

  try {
    await storagePut(frontPath, front.buf, front.contentType);
    await storagePut(backPath, back.buf, back.contentType);
  } catch (e) {
    await storageDelete(frontPath); await storageDelete(backPath);
    if (e.message === "not_configured") return json(res, 503, { error: "Orders aren't set up yet: the site owner must add the Supabase settings (see README)." });
    console.error("[orders] image upload failed:", e.message);
    return json(res, 500, { error: "We couldn't upload your images. Please try again." });
  }

  try {
    const { ev, opt, amountCents } = priced;
    await dbInsert("orders", {
      id: orderId,
      event_id: ev.id, event_city: ev.city, event_venue: ev.venue, event_date: ev.date, event_time: ev.time,
      ticket_label: opt.label, qty: priced.qty, amount_cents: amountCents,
      customer_name: cleanName, customer_email: cleanEmail,
      status: "Pending Verification",
      token_image_path: frontPath,
      token_back_image_path: backPath,
      access_token_hash: sha256(accessToken),
    });
  } catch (e) {
    console.error("[orders] saving order failed:", e.message);
    await storageDelete(frontPath); await storageDelete(backPath); // don't leave orphaned images behind
    return json(res, 500, { error: "We couldn't save your order. Please try again." });
  }

  await notifyAdmin({
    orderId, name: cleanName, amountCents: priced.amountCents,
    ticketLine: `${priced.qty} x ${priced.opt.label} · ${priced.ev.city} · ${priced.ev.date}`,
    link: `${siteUrl()}/#/admin/order/${orderId}`,
  });

  return json(res, 201, { orderId, accessToken, status: "Pending Verification", total: priced.amountCents / 100 });
}
