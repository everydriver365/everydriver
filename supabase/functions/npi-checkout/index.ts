import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NPICheckoutRequest {
  amount: number;
  currency: string;
  orderReference: string;
  customerEmail: string;
  customerName: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  instructorId?: string;
  pupilId?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("NPI_MERCHANT_ID");
    const merchantSecret = Deno.env.get("NPI_MERCHANT_SECRET");

    if (!merchantId || !merchantSecret) {
      console.error("NPI credentials not configured");
      return new Response(
        JSON.stringify({ error: "NPI Payments not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: NPICheckoutRequest = await req.json();
    console.log("NPI Checkout request:", { 
      amount: body.amount, 
      orderReference: body.orderReference,
      customerEmail: body.customerEmail 
    });

    const {
      amount,
      currency = "GBP",
      orderReference,
      customerEmail,
      customerName,
      description,
      returnUrl,
      cancelUrl,
    } = body;

    // Validate required fields
    if (!amount || !orderReference || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, orderReference, returnUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // NPI Payments UK HPP expects amount in pence/cents
    const amountInPence = Math.round(amount * 100);

    // Generate timestamp for the request
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];

    // Create signature for the request
    // NPI typically uses: merchantId + orderReference + amount + currency + secret
    const signatureData = `${merchantId}${orderReference}${amountInPence}${currency}${merchantSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureData);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // NPI Payments UK HPP endpoint (production)
    // Note: Replace with sandbox URL for testing
    const npiBaseUrl = "https://payments.npipaymentsuk.com/hpp";

    // Build the HPP form data
    const hppParams = new URLSearchParams({
      merchant_id: merchantId,
      order_reference: orderReference,
      amount: amountInPence.toString(),
      currency: currency,
      customer_email: customerEmail || "",
      customer_name: customerName || "",
      description: description || `Payment for ${orderReference}`,
      return_url: returnUrl,
      cancel_url: cancelUrl || returnUrl,
      timestamp: timestamp,
      signature: signature,
    });

    // Construct the redirect URL
    const redirectUrl = `${npiBaseUrl}?${hppParams.toString()}`;

    console.log("NPI HPP redirect URL generated for order:", orderReference);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: redirectUrl,
        orderReference: orderReference,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("NPI Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create NPI checkout session";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
