# TicketBubby: Oasis artist page + checkout (React + Vite, Token Image payment)

## Pages (hash routes)
- `#/` artist page, `#/checkout?event=<id>&vip=<n>`, `#/confirmation/<orderId>`, `#/dashboard`
- `#/admin` and `#/admin/order/<orderId>`: admin review (password protected)

## Payment: Token Image only
Buy Ticket → checkout → the customer uploads the FRONT and the BACK of the token as JPG/JPEG/PNG images (previews shown, both required) →
**Upload Token & Submit Order**. The order is saved as **Pending Verification**, the image goes to a private
bucket, and the admin gets an email (order ID, customer name, amount, the front and back images attached, and a review link). Only an admin clicking
**Approve** sets **Approved**; **Reject** sets **Rejected** (optional reason), which the customer sees on
their ticket/dashboard page (auto-refreshes every 15 s). Card, Apple Pay, Google Pay and Stripe were removed.

## Setup
1. Supabase: create a project, run `supabase/schema.sql` in the SQL editor (creates `orders` + a PRIVATE `token-images` bucket). Settings > API gives you `SUPABASE_URL` and the `service_role` key. Upgrading from the single-image version? Run the `alter table` line at the bottom of that file.
2. Resend: create an API key. Order alerts go to emmanuelabioye67@gmail.com (change with `ADMIN_NOTIFY_EMAIL`). Without a verified domain, Resend only delivers to the email your Resend account was created with, so sign up with that address for testing.
3. Copy `.env.example` to `.env.local` and fill it in. On Vercel add the same variables, then redeploy.
4. Local testing needs the `/api` functions: run `npx vercel dev` (not `npm run dev`).
5. Open `#/admin`, sign in with `ADMIN_PASSWORD`, then press **Run check** and **Send test email** in the System check panel. It tells you exactly what is missing (database, private bucket, email).

## Security notes
- Both images are validated server-side (type, real file signature, max 1.5 MB each; larger photos are shrunk in the browser first).
- The bucket is private. Images are only streamed by `/api/admin/image` to a signed-in admin (HttpOnly, SameSite=Strict cookie).
- Customers get a per-order secret token (stored hashed) so they can check only their own order's status.
- The server recalculates the price; the browser total is never trusted.
- No card numbers, CVV, PINs or OTPs are requested or stored.
- Recommended next: add rate limiting / CAPTCHA on `/api/orders/create`, and email the customer on approve/reject.
