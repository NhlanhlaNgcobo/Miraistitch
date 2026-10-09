import crypto from "crypto";

// PayFast integration helpers.
// Docs: https://developers.payfast.co.za/docs — verify field order & encoding against the
// current spec before going live. Signature = md5 of the URL-encoded "key=value&..." string
// (spaces as "+"), in the ORDER the fields are added, with the passphrase appended last.

const MODE = process.env.PAYFAST_MODE ?? "sandbox";

export const PAYFAST_PROCESS_URL =
  MODE === "live" ? "https://www.payfast.co.za/eng/process" : "https://sandbox.payfast.co.za/eng/process";

const PAYFAST_VALIDATE_URL =
  MODE === "live" ? "https://www.payfast.co.za/eng/query/validate" : "https://sandbox.payfast.co.za/eng/query/validate";

function pfEncode(value: string): string {
  // PayFast expects application/x-www-form-urlencoded with spaces as "+" and uppercase hex.
  return encodeURIComponent(value.trim()).replace(/%20/g, "+").replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase());
}

export function signature(fields: Record<string, string>, passphrase?: string): string {
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${pfEncode(String(v))}`);
  let str = parts.join("&");
  if (passphrase && passphrase.length) str += `&passphrase=${pfEncode(passphrase)}`;
  return crypto.createHash("md5").update(str).digest("hex");
}

export type CheckoutInput = {
  orderId: string; // our m_payment_id
  amountCents: number;
  itemName: string;
  firstName: string;
  email: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
};

// Build the ordered field set + signature for the redirect form.
export function buildCheckoutFields(i: CheckoutInput): Record<string, string> {
  const passphrase = process.env.PAYFAST_PASSPHRASE || "";
  // Order matters and must match PayFast's expected sequence.
  const fields: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: i.returnUrl,
    cancel_url: i.cancelUrl,
    notify_url: i.notifyUrl,
    name_first: i.firstName,
    email_address: i.email,
    m_payment_id: i.orderId,
    amount: (i.amountCents / 100).toFixed(2),
    item_name: i.itemName,
  };
  fields.signature = signature(fields, passphrase);
  return fields;
}

// Recompute the signature from a received ITN body (raw order preserved) and compare.
export function verifyItnSignature(rawBody: string): boolean {
  const passphrase = process.env.PAYFAST_PASSPHRASE || "";
  const pairs = rawBody.split("&").filter(Boolean);
  let received = "";
  const kept: string[] = [];
  for (const p of pairs) {
    const [k, ...rest] = p.split("=");
    const v = rest.join("=");
    if (k === "signature") {
      received = v;
      continue;
    }
    kept.push(`${k}=${v}`); // keep PayFast's own encoding/order verbatim
  }
  let str = kept.join("&");
  if (passphrase.length) str += `&passphrase=${pfEncode(passphrase)}`;
  const expected = crypto.createHash("md5").update(str).digest("hex");
  return expected === received;
}

// Server-to-server confirmation that PayFast actually sent this ITN (recommended, defence in depth).
export async function validateItnWithPayfast(rawBody: string): Promise<boolean> {
  try {
    const res = await fetch(PAYFAST_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const text = (await res.text()).trim();
    return text === "VALID";
  } catch {
    return false;
  }
}
