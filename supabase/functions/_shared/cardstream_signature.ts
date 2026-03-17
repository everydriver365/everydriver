export function rfc1738Encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Create signature:
 * 1) sort keys
 * 2) query string (RFC1738-ish)
 * 3) normalize CRLF/CR to LF (%0A)
 * 4) append secret
 * 5) SHA-512 hex
 */
export async function createCardstreamSignature(
  data: Record<string, string>,
  secretKey: string,
): Promise<string> {
  const sortedKeys = Object.keys(data).sort();
  const queryString = sortedKeys
    .map((k) => `${rfc1738Encode(k)}=${rfc1738Encode(data[k] ?? "")}`)
    .join("&");

  const normalized = queryString
    .replace(/%0D%0A/g, "%0A")
    .replace(/%0A%0D/g, "%0A")
    .replace(/%0D/g, "%0A");

  const signatureInput = normalized + secretKey;

  const encoder = new TextEncoder();
  const buf = encoder.encode(signatureInput);
  const hash = await crypto.subtle.digest("SHA-512", buf);
  const bytes = Array.from(new Uint8Array(hash));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * Verify response signature by recomputing over fields excluding "signature".
 */
export async function verifyCardstreamSignature(
  fields: Record<string, string>,
  secretKey: string,
): Promise<boolean> {
  const sig = fields.signature || fields.Signature || "";
  if (!sig) return false;

  const cloned: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (k === "signature" || k === "Signature") continue;
    cloned[k] = v ?? "";
  }
  const expected = await createCardstreamSignature(cloned, secretKey);
  return timingSafeEqualHex(expected, sig);
}
