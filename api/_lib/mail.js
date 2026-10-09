// Admin notification through Resend's REST API. Returns false (never throws) so a mail
// outage can't lose an order; the order still appears in the admin dashboard.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const oneLine = (s) => String(s).replace(/[\r\n]+/g, " ").slice(0, 120);

export async function notifyAdmin({ orderId, name, amountCents, ticketLine, link }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL || "emmanuelabioye67@gmail.com";
  // onboarding@resend.dev works without a verified domain (Resend then only delivers to the account owner's email).
  const from = process.env.MAIL_FROM || "TicketBubby <onboarding@resend.dev>";
  if (!key) { console.error("[mail] RESEND_API_KEY is not set; admin email not sent"); return false; }
  const amount = "$" + (amountCents / 100).toFixed(2);
  const text = `New token image submitted for verification.\n\nOrder ID: ${orderId}\nCustomer: ${oneLine(name)}\nAmount: ${amount}\nTickets: ${ticketLine}\n\nReview (admin login required): ${link}\n`;
  const html = `<p>New token image submitted for verification.</p>
<table cellpadding="4" style="font-family:sans-serif">
<tr><td><b>Order ID</b></td><td>${esc(orderId)}</td></tr>
<tr><td><b>Customer</b></td><td>${esc(oneLine(name))}</td></tr>
<tr><td><b>Amount</b></td><td>${esc(amount)}</td></tr>
<tr><td><b>Tickets</b></td><td>${esc(ticketLine)}</td></tr></table>
<p><a href="${esc(link)}">Review the token image</a> (admin login required)</p>`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: to.split(",").map((s) => s.trim()), subject: `Token verification needed: ${orderId} (${amount})`, text, html }),
    });
    if (!r.ok) console.error("[mail] Resend rejected the email:", r.status, await r.text().catch(() => ""));
    return r.ok;
  } catch (e) { console.error("[mail] send failed:", e.message); return false; }
}
