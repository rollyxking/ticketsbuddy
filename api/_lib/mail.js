// Email through Resend's REST API. Never throws, so a mail outage can't lose an order;
// the order is still saved and visible in the admin dashboard.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const oneLine = (s) => String(s).replace(/[\r\n]+/g, " ").slice(0, 120);

export const adminEmail = () => process.env.ADMIN_NOTIFY_EMAIL || "emmanuelabioye67@gmail.com";

// attachments: [{ filename, content (base64) }]
export async function sendMail({ subject, text, html, attachments }) {
  const key = process.env.RESEND_API_KEY;
  // onboarding@resend.dev works without a verified domain (Resend then only delivers to the account owner's email).
  const from = process.env.MAIL_FROM || "TicketBubby <onboarding@resend.dev>";
  if (!key) { console.error("[mail] RESEND_API_KEY is not set; email not sent"); return { ok: false, detail: "RESEND_API_KEY is not set on the server." }; }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: adminEmail().split(",").map((s) => s.trim()), subject, text, html, ...(attachments && attachments.length ? { attachments } : {}) }),
    });
    if (!r.ok) {
      const detail = (await r.text().catch(() => "")).slice(0, 300);
      console.error("[mail] Resend rejected the email:", r.status, detail);
      return { ok: false, status: r.status, detail };
    }
    return { ok: true };
  } catch (e) {
    console.error("[mail] send failed:", e.message);
    return { ok: false, detail: e.message };
  }
}

export async function notifyAdmin({ orderId, name, amountCents, ticketLine, link, attachments }) {
  const amount = "$" + (amountCents / 100).toFixed(2);
  const text = `New token submitted for verification (front and back images attached).\n\nOrder ID: ${orderId}\nCustomer: ${oneLine(name)}\nAmount: ${amount}\nTickets: ${ticketLine}\n\nReview and Approve/Reject (admin login required): ${link}\n`;
  const html = `<p>New token submitted for verification. The <b>front and back images are attached</b>.</p>
<table cellpadding="4" style="font-family:sans-serif">
<tr><td><b>Order ID</b></td><td>${esc(orderId)}</td></tr>
<tr><td><b>Customer</b></td><td>${esc(oneLine(name))}</td></tr>
<tr><td><b>Amount</b></td><td>${esc(amount)}</td></tr>
<tr><td><b>Tickets</b></td><td>${esc(ticketLine)}</td></tr></table>
<p><a href="${esc(link)}">Review and Approve / Reject</a> (admin login required)</p>`;
  const r = await sendMail({ subject: `Token verification needed: ${orderId} (${amount})`, text, html, attachments });
  return r.ok;
}
