import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PupilPaymentRequest {
  pupilId: string;
  instructorId: string;
  amount: number;
  adminFee?: number;
  gateway: "npi" | "clearpay" | "klarna" | "elavon";
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl: string;
  cancelUrl: string;
}

// RFC 1738 encoding for Cardstream signature
function rfc1738Encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

// SHA-512 signature for NPI/Cardstream
async function createSignature(data: Record<string, string>, secretKey: string): Promise<string> {
  const sortedKeys = Object.keys(data).sort();
  const queryString = sortedKeys
    .map(key => `${rfc1738Encode(key)}=${rfc1738Encode(data[key] ?? '')}`)
    .join('&');

  const normalizedQueryString = queryString
    .replace(/%0D%0A/g, '%0A')
    .replace(/%0A%0D/g, '%0A')
    .replace(/%0D/g, '%0A');

  const signatureInput = normalizedQueryString + secretKey;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(signatureInput);
  const hashBuffer = await crypto.subtle.digest("SHA-512", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: PupilPaymentRequest = await req.json();
    const { pupilId, instructorId, amount, adminFee = 0, gateway, customerName, customerEmail, customerPhone, returnUrl, cancelUrl } = body;

    // Total to charge = base amount + admin fee
    const chargeAmount = Math.round((amount + adminFee) * 100) / 100;

    console.log(`Pupil payment checkout: pupil=${pupilId}, gateway=${gateway}, amount=${amount}, adminFee=${adminFee}, chargeTotal=${chargeAmount}`);

    if (!pupilId || !instructorId || !amount || !gateway || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Amount must be greater than 0" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique order reference for pupil payments
    const orderReference = `PUPIL-${pupilId.slice(0, 8)}-${Date.now()}`;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    
    // Build callback URL that routes back to payment-callback
    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback?provider=${gateway}&pupilId=${pupilId}&ref=${orderReference}&type=balance&baseAmount=${amount}&adminFee=${adminFee}`;

    // Handle each gateway
    switch (gateway) {
      case "npi": {
        const merchantId = Deno.env.get("NPI_MERCHANT_ID");
        const secretKey = Deno.env.get("NPI_MERCHANT_SECRET");

        if (!merchantId || !secretKey) {
          return new Response(
            JSON.stringify({ error: "NPI payment not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const amountInPence = Math.round(chargeAmount * 100);
        const transactionUnique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const formData: Record<string, string> = {
          merchantID: merchantId,
          action: "SALE",
          type: "1",
          countryCode: "826",
          currencyCode: "826",
          amount: amountInPence.toString(),
          orderRef: orderReference,
          transactionUnique,
          redirectURL: callbackUrl,
        };

        if (customerEmail) formData.customerEmail = customerEmail;
        if (customerName) formData.customerName = customerName;

        const signature = await createSignature(formData, secretKey);
        formData.signature = signature;

        return new Response(
          JSON.stringify({
            success: true,
            gateway: "npi",
            formAction: "https://gateway.cardstream.com/hosted/",
            formFields: formData,
            transactionId: transactionUnique,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "elavon": {
        const merchantId = Deno.env.get("NPI_MERCHANT_ID");
        const secretKey = Deno.env.get("NPI_MERCHANT_SECRET");

        if (!merchantId || !secretKey) {
          return new Response(
            JSON.stringify({ error: "Elavon payment not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const amountInPence = Math.round(chargeAmount * 100);
        const transactionUnique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const formData: Record<string, string> = {
          merchantID: merchantId,
          action: "SALE",
          type: "1",
          countryCode: "826",
          currencyCode: "826",
          amount: amountInPence.toString(),
          orderRef: orderReference,
          transactionUnique,
          redirectURL: callbackUrl,
        };

        if (customerEmail) formData.customerEmail = customerEmail;
        if (customerName) formData.customerName = customerName;

        const signature = await createSignature(formData, secretKey);
        formData.signature = signature;

        return new Response(
          JSON.stringify({
            success: true,
            gateway: "elavon",
            formAction: "https://gateway.cardstream.com/hosted/",
            formFields: formData,
            transactionId: transactionUnique,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "clearpay": {
        const merchantId = Deno.env.get("CLEARPAY_MERCHANT_ID");
        const secretKey = Deno.env.get("CLEARPAY_SECRET_KEY");

        if (!merchantId || !secretKey) {
          return new Response(
            JSON.stringify({ error: "Clearpay not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isSandbox = Deno.env.get("CLEARPAY_SANDBOX") === "true";
        const baseUrl = isSandbox 
          ? "https://global.api-sandbox.afterpay.com"
          : "https://api.eu.afterpay.com";

        const authHeader = btoa(`${merchantId}:${secretKey}`);

        const checkoutPayload = {
          amount: { amount: chargeAmount.toFixed(2), currency: "GBP" },
          consumer: {
            givenNames: customerName.split(" ")[0] || "Customer",
            surname: customerName.split(" ").slice(1).join(" ") || "User",
            email: customerEmail || "customer@example.com",
            phoneNumber: customerPhone,
          },
          merchant: { redirectConfirmUrl: callbackUrl, redirectCancelUrl: cancelUrl },
          merchantReference: orderReference,
          items: [{ name: "Lesson Balance Payment", quantity: 1, price: { amount: chargeAmount.toFixed(2), currency: "GBP" } }],
        };

        const response = await fetch(`${baseUrl}/v2/checkouts`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/json",
            "User-Agent": "EveryDriver/1.0",
          },
          body: JSON.stringify(checkoutPayload),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("Clearpay error:", result);
          return new Response(
            JSON.stringify({ error: result.message || "Clearpay checkout failed" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            gateway: "clearpay",
            redirectUrl: result.redirectCheckoutUrl,
            token: result.token,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "klarna": {
        const apiUsername = Deno.env.get("KLARNA_API_USERNAME");
        const apiPassword = Deno.env.get("KLARNA_API_PASSWORD");

        if (!apiUsername || !apiPassword) {
          return new Response(
            JSON.stringify({ error: "Klarna not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isSandbox = Deno.env.get("KLARNA_SANDBOX") === "true";
        const baseUrl = isSandbox 
          ? "https://api.playground.klarna.com"
          : "https://api.klarna.com";

        const amountInMinor = Math.round(chargeAmount * 100);
        const authHeader = btoa(`${apiUsername}:${apiPassword}`);

        const checkoutPayload = {
          purchase_country: "GB",
          purchase_currency: "GBP",
          locale: "en-GB",
          order_amount: amountInMinor,
          order_tax_amount: 0,
          order_lines: [{
            type: "digital",
            reference: orderReference,
            name: "Lesson Balance Payment",
            quantity: 1,
            unit_price: amountInMinor,
            tax_rate: 0,
            total_amount: amountInMinor,
            total_tax_amount: 0,
          }],
          merchant_urls: {
            terms: `${Deno.env.get("SITE_URL") || "https://everydriver.lovable.app"}/terms`,
            checkout: returnUrl,
            confirmation: callbackUrl,
            push: callbackUrl,
          },
          merchant_reference1: orderReference,
        };

        const response = await fetch(`${baseUrl}/checkout/v3/orders`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(checkoutPayload),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("Klarna error:", result);
          return new Response(
            JSON.stringify({ error: result.error_messages?.[0] || "Klarna checkout failed" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Klarna HPP returns an HTML snippet or redirect URL
        const redirectUrl = result.redirect_url || `https://pay.klarna.com/eu/hpp/payments/${result.order_id}`;

        return new Response(
          JSON.stringify({
            success: true,
            gateway: "klarna",
            redirectUrl,
            orderId: result.order_id,
            htmlSnippet: result.html_snippet,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unsupported payment gateway" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Pupil payment checkout error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process checkout", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
