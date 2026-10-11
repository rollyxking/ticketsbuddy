// Server-side price calculation. The browser's total is never trusted.
import { ALL, PRICES, VIPS, VIP_PRICES, FEE_PER_TICKET } from "../../src/data.js";

export function priceOrder({ eventId, ticket, qty }) {
  const ev = ALL.find((e) => e.id === eventId);
  const options = [...PRICES, ...VIPS.map((v, i) => ({ id: "vip" + i, label: "VIP: " + v[0], price: VIP_PRICES[i] }))];
  const opt = options.find((o) => o.id === ticket);
  const q = Number(qty);
  if (!ev || !opt || !Number.isInteger(q) || q < 1 || q > 6) return null;
  return { ev, opt, qty: q, amountCents: Math.round((opt.price + FEE_PER_TICKET) * q * 100) }; // (price + $10 fee) x qty, in cents
}
