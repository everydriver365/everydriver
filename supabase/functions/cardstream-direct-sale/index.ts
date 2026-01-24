import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function rfc1738Encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

async function createSignature(
  fields: Record<string, string>,
  secretKey: string
): Promise<string> {
  const sortedKeys = Object.keys(fields).sort();
  const queryString = sortedKeys
    .map((k) => `${rfc1738Encode(k)}=${rfc1738Encode(fields[k] ?? "")}`)
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

interface SaleRequest {
  orderRef: string;
  amount: number; // pounds
  paymentToken: string;
  customerName?: string;
  customerEmail?: string;
  pupilId?: string;
  instructorId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantID = Deno.env.get("NPI_MERCHANT_ID");
    const secret = Deno.env.get("NPI_MERCHANT_SECRET");
    const directUrl =
      Deno.env.get("NPI_DIRECT_URL") || "https://gateway.cardstream.com/direct/";

    if (!merchantID || !secret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Cardstream not configured (missing env vars)",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: SaleRequest = await req.json();
    if (!body.orderRef || !body.amount || !body.paymentToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing orderRef, amount, paymentToken",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const amountPence = Math.round(body.amount * 100);
    const transactionUnique = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const fields: Record<string, string> = {
      merchantID,
      action: "SALE",
      type: "1",
      countryCode: "826",
      currencyCode: "826",
      amount: String(amountPence),
      orderRef: body.orderRef,
      transactionUnique,
      paymentToken: body.paymentToken,
    };

    if (body.customerName) fields.customerName = body.customerName;
    if (body.customerEmail) fields.customerEmail = body.customerEmail;

    fields.signature = await createSignature(fields, secret);

    // x-www-form-urlencoded body
    const formBody = Object.keys(fields)
      .sort()
      .map((k) => `${rfc1738Encode(k)}=${rfc1738Encode(fields[k] ?? "")}`)
      .join("&");

    const resp = await fetch(directUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    const raw = await resp.text();
    const params = new URLSearchParams(raw);

    const responseCode =
      params.get("responseCode") || params.get("ResponseCode") || "999";
    const responseMessage =
      params.get("responseMessage") || params.get("ResponseMessage") || "Unknown response";
    const success = responseCode === "0";

    return new Response(
      JSON.stringify({
        success,
        responseCode,
        responseMessage,
        raw,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e?.message || "Direct sale failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
