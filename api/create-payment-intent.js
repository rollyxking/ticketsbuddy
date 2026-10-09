// Vercel serverless function. The amount is calculated here from your own price list,
// never trusted from the browser. Requires STRIPE_SECRET_KEY in your environment.
import Stripe from "stripe";
import { ALL, PRICES, VIPS, VIP_PRICES } from "../src/data.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Payments are not configured" });

  const { eventId, ticket, qty, name, email } = req.body || {};
  const ev = ALL.find((e) => e.id === eventId);
  const options = [...PRICES, ...VIPS.map((v, i) => ({ id: "vip" + i, label: "VIP: " + v[0], price: VIP_PRICES[i] }))];
  const opt = options.find((o) => o.id === ticket);
  const q = Number(qty);
  if (!ev || !opt || !Number.isInteger(q) || q < 1 || q > 6 || !/^\S+@\S+\.\S+$/.test(email || "")) {
    return res.status(400).json({ error: "Invalid order" });
  }

  const amount = Math.round(opt.price * q * 110); // price x qty + 10% service fee, in cents
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const pi = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      receipt_email: email,
      description: `Oasis Live '27 · ${ev.city} · ${ev.date} · ${q} x ${opt.label}`,
      metadata: { eventId, ticket, qty: String(q), name: String(name || "").slice(0, 100) },
    });
    return res.status(200).json({ clientSecret: pi.client_secret });
  } catch (err) {
    return res.status(500).json({ error: "Could not create payment" });
  }
}
