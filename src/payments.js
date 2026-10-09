// DEMO payment layer. No money moves and nothing is sent anywhere.
// Card numbers are validated in the browser and only brand + last 4 digits are kept.
// To take real payments, replace pay() with a call to your backend that creates a
// Stripe Checkout Session (or PaymentIntent) and redirect to it. See README.

export function luhn(num) {
  let sum = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = +num[i];
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return num.length > 0 && sum % 10 === 0;
}

export function cardBrand(num) {
  if (/^4/.test(num)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  return "Card";
}

export async function pay({ amount, method, card }) {
  await new Promise((r) => setTimeout(r, 1200));
  if (method === "card") {
    const n = card.number.replace(/\s/g, "");
    return { ok: true, label: `${card.cardType} ${cardBrand(n)} •••• ${n.slice(-4)}` };
  }
  return { ok: true, label: method === "apple" ? "Apple Pay" : "Google Pay" };
}
