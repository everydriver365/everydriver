export function rfc1738Encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) =>
      "%" + c.charCodeAt(0).toString(16).toUpperCase()
    );
}

export async function createCardstreamSignature(
  data: Record<string, string>,
  secretKey: string
): Promise<string> {
  const keys = Object.keys(data).sort();

  const queryString = keys
    .map((k) => `${rfc1738Encode(k)}=${rfc1738Encode(data[k] ?? "")}`)
    .join("&");

  const normalized = queryString
    .replace(/%0D%0A/g, "%0A")
    .replace(/%0A%0D/g, "%0A")
    .replace(/%0D/g, "%0A");

  const signatureInput = normalized + secretKey;

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(signatureInput);

  const hash = await crypto.subtle.digest("SHA-512", dataBuffer);

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyCardstreamSignature(
  fields: Record<string, string>,
  secretKey: string
): Promise<boolean> {
  const sig = fields.signature || fields.Signature;

  if (!sig) return false;

  const payload: Record<string, string> = {};

  for (const [k, v] of Object.entries(fields)) {
    if (k === "signature" || k === "Signature") continue;
    payload[k] = v ?? "";
  }

  const expected = await createCardstreamSignature(payload, secretKey);

  return expected === sig;
}
