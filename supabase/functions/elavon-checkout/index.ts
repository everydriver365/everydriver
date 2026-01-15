import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ElavonCheckoutRequest {
  amount: number;
  orderReference: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
  instructorId?: string;
  pupilId?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Elavon credentials from environment
    const processorId = Deno.env.get("ELAVON_PROCESSOR_ID");
    const publicKey = Deno.env.get("ELAVON_PUBLIC_KEY");
    const secretKey = Deno.env.get("ELAVON_SECRET_KEY");
    const merchantAlias = Deno.env.get("ELAVON_MERCHANT_ALIAS");

    if (!processorId || !publicKey || !secretKey || !merchantAlias) {
      console.error("Missing Elavon credentials");
      return new Response(
        JSON.stringify({ error: "Elavon payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ElavonCheckoutRequest = await req.json();
    console.log("Elavon checkout request received:", {
      amount: body.amount,
      orderReference: body.orderReference,
      customerEmail: body.customerEmail,
    });

    const {
      amount,
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

    // Elavon Converge expects amount in decimal format (e.g., "10.00")
    const formattedAmount = amount.toFixed(2);

    // Generate unique transaction ID
    const txnId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Build HPP (Hosted Payment Page) request for Elavon Converge
    // Using the Converge HPP API
    const hppData = {
      ssl_merchant_id: merchantAlias,
      ssl_user_id: processorId,
      ssl_pin: secretKey,
      ssl_transaction_type: "ccsale",
      ssl_amount: formattedAmount,
      ssl_invoice_number: orderReference,
      ssl_description: description || `Course booking ${orderReference}`,
      ssl_customer_code: body.pupilId || "",
      ssl_email: customerEmail || "",
      ssl_cardholder_name: customerName || "",
      ssl_result_format: "HTML",
      ssl_receipt_link_method: "REDG",
      ssl_receipt_link_url: returnUrl,
      ssl_error_url: cancelUrl,
      ssl_decline_post_url: cancelUrl,
      ssl_show_form: "true",
    };

    // Elavon Converge HPP endpoint
    // Production: https://api.convergepay.com/hosted-payments/transaction_token
    // Demo/Sandbox: https://api.demo.convergepay.com/hosted-payments/transaction_token
    const isProduction = true; // Set based on environment
    const baseUrl = isProduction 
      ? "https://api.convergepay.com/hosted-payments"
      : "https://api.demo.convergepay.com/hosted-payments";

    // First, get a transaction token
    const tokenRequestData = new URLSearchParams();
    for (const [key, value] of Object.entries(hppData)) {
      if (value) {
        tokenRequestData.append(key, value);
      }
    }

    console.log("Requesting Elavon transaction token...");

    const tokenResponse = await fetch(`${baseUrl}/transaction_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenRequestData.toString(),
    });

    const tokenText = await tokenResponse.text();
    console.log("Token response status:", tokenResponse.status);

    if (!tokenResponse.ok) {
      console.error("Elavon token error:", tokenText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to initiate Elavon payment",
          details: tokenText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The response should be a session token
    const sessionToken = tokenText.trim();

    if (!sessionToken || sessionToken.includes("error")) {
      console.error("Invalid token response:", sessionToken);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from Elavon",
          details: sessionToken
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the redirect URL to the hosted payment page
    const redirectUrl = `${baseUrl}/pay?ssl_txn_auth_token=${encodeURIComponent(sessionToken)}`;

    console.log("Elavon HPP redirect URL generated for order:", orderReference);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: redirectUrl,
        transactionId: txnId,
        sessionToken: sessionToken,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Elavon checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: "Failed to process Elavon checkout",
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
