import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KlarnaPaymentRequest {
  amount: number;
  currency?: string;
  merchantReference: string;
  consumer: {
    givenName: string;
    familyName: string;
    email: string;
    phone?: string;
  };
  billing?: {
    streetAddress: string;
    postalCode: string;
    city: string;
    country: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  redirectUrls: {
    confirmUrl: string;
    cancelUrl: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiUsername = Deno.env.get("KLARNA_API_USERNAME");
    const apiPassword = Deno.env.get("KLARNA_API_PASSWORD");
    const isSandbox = Deno.env.get("KLARNA_SANDBOX") === "true";

    console.log("Klarna environment:", isSandbox ? "SANDBOX/PLAYGROUND" : "PRODUCTION");

    if (!apiUsername || !apiPassword) {
      console.error("Klarna credentials not configured");
      return new Response(
        JSON.stringify({ error: "Klarna not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: KlarnaPaymentRequest = await req.json();
    console.log("Klarna payment request:", JSON.stringify(data, null, 2));

    if (!data.amount || !data.merchantReference || !data.consumer || !data.redirectUrls) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Klarna Payments API endpoints - try multiple regions
    const baseUrls = isSandbox
      ? ["https://api.playground.klarna.com"]
      : [
          "https://api.klarna.com", // EU/UK
          "https://api-na.klarna.com", // North America
          "https://api-oc.klarna.com", // Oceania
        ];

    const authHeader = btoa(`${apiUsername}:${apiPassword}`);
    const currency = data.currency || "GBP";
    const country = data.billing?.country || "GB";
    const locale = country === "GB" ? "en-GB" : "en-US";

    // Convert amount to minor units (pence)
    const orderAmount = Math.round(data.amount * 100);

    // Build order lines for Payments API
    const orderLines = data.items.map((item) => ({
      type: "physical",
      name: item.name,
      quantity: item.quantity,
      unit_price: Math.round(item.unitPrice * 100),
      total_amount: Math.round(item.unitPrice * item.quantity * 100),
      tax_rate: 0,
      total_tax_amount: 0,
    }));

    // Klarna Payments API session payload - optimized for mobile with IN_APP channel
    const sessionPayload = {
      acquiring_channel: "IN_APP", // Changed from ECOMMERCE for better mobile support
      purchase_country: country,
      purchase_currency: currency,
      locale: locale,
      order_amount: orderAmount,
      order_tax_amount: 0,
      order_lines: orderLines,
      intent: "buy",
      merchant_reference1: data.merchantReference,
      merchant_urls: {
        confirmation: data.redirectUrls.confirmUrl,
        cancel: data.redirectUrls.cancelUrl,
        notification: data.redirectUrls.confirmUrl.replace(/\?.*$/, "") + "?klarna_notification=true",
      },
      billing_address: data.billing
        ? {
            given_name: data.consumer.givenName,
            family_name: data.consumer.familyName,
            email: data.consumer.email,
            phone: data.consumer.phone || "",
            street_address: data.billing.streetAddress,
            postal_code: data.billing.postalCode,
            city: data.billing.city,
            country: country,
          }
        : undefined,
    };

    console.log("Sending to Klarna Payments API:", JSON.stringify(sessionPayload, null, 2));

    let lastStatus = 0;
    let lastBaseUrl = baseUrls[0];
    let lastResult: any = null;

    for (const baseUrl of baseUrls) {
      lastBaseUrl = baseUrl;

      // Create a Klarna Payments session
      const response = await fetch(`${baseUrl}/payments/v1/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionPayload),
      });

      lastStatus = response.status;
      lastResult = await response.json().catch(() => ({}));

      console.log("Klarna response status:", response.status, "baseUrl:", baseUrl);
      console.log("Klarna response:", JSON.stringify(lastResult, null, 2));

      if (response.ok) {
        // Return session data for frontend to load Klarna SDK
        return new Response(
          JSON.stringify({
            sessionId: lastResult.session_id,
            clientToken: lastResult.client_token,
            paymentMethodCategories: lastResult.payment_method_categories,
            // Include order details for the frontend
            orderDetails: {
              amount: orderAmount,
              currency: currency,
              merchantReference: data.merchantReference,
              confirmUrl: data.redirectUrls.confirmUrl,
              cancelUrl: data.redirectUrls.cancelUrl,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If unauthorized or not found, try the next region endpoint
      if (response.status !== 401 && response.status !== 404) break;
    }

    console.error("Klarna API error:", lastResult);

    let errorMessage = lastResult?.error_message || lastResult?.error_messages?.[0] || "Klarna payment session failed";
    if (lastStatus === 401) {
      errorMessage = "Klarna authorization failed. Please verify: 1) Credentials are for PRODUCTION (not Playground), 2) Payments API is enabled, 3) Credentials are active and not expired.";
    } else if (lastStatus === 404) {
      errorMessage = "Klarna endpoint not found. The credentials may be for a different region or the Payments API may not be enabled.";
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        environment: isSandbox ? "sandbox" : "production",
        details: {
          tried_base_urls: baseUrls,
          last_base_url: lastBaseUrl,
          klarna_response: lastResult,
        },
      }),
      { status: lastStatus || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in klarna-checkout:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
