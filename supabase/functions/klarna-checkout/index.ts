import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KlarnaCheckoutRequest {
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

    const data: KlarnaCheckoutRequest = await req.json();
    console.log("Klarna checkout request:", JSON.stringify(data, null, 2));

    if (!data.amount || !data.merchantReference || !data.consumer || !data.redirectUrls) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Klarna Checkout API endpoints - region-specific
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

    // Convert amount to minor units (pence/cents)
    const orderAmount = Math.round(data.amount * 100);

    // Build order lines for Checkout API
    const orderLines = data.items.map((item) => ({
      type: "physical",
      name: item.name,
      quantity: item.quantity,
      unit_price: Math.round(item.unitPrice * 100),
      total_amount: Math.round(item.unitPrice * item.quantity * 100),
      tax_rate: 0,
      total_tax_amount: 0,
    }));

    // Klarna Checkout API order payload (Hosted Payment Page flow)
    const checkoutPayload = {
      purchase_country: country,
      purchase_currency: currency,
      locale: locale,
      order_amount: orderAmount,
      order_tax_amount: 0,
      order_lines: orderLines,
      merchant_reference1: data.merchantReference,
      merchant_urls: (() => {
        const confirm = new URL(data.redirectUrls.confirmUrl);
        const origin = confirm.origin;

        return {
          // Use a real, always-available terms page
          terms: `${origin}/terms-of-service`,
          checkout: data.redirectUrls.cancelUrl,
          confirmation: data.redirectUrls.confirmUrl,
          // Push URL must be HTTPS and reachable; booking-confirmation is an existing route
          push: `${data.redirectUrls.confirmUrl}${data.redirectUrls.confirmUrl.includes("?") ? "&" : "?"}klarna_push=true`,
        };
      })(),
      billing_address: {
        given_name: data.consumer.givenName,
        family_name: data.consumer.familyName,
        email: data.consumer.email,
        phone: data.consumer.phone || "",
        street_address: data.billing?.streetAddress || "",
        postal_code: data.billing?.postalCode || "",
        city: data.billing?.city || "",
        country: country,
      },
      options: {
        color_button: "#0072F5",
        color_button_text: "#FFFFFF",
      },
    };

    console.log("Sending to Klarna Checkout API:", JSON.stringify(checkoutPayload, null, 2));

    let lastStatus = 0;
    let lastBaseUrl = baseUrls[0];
    let lastResult: any = null;

    for (const baseUrl of baseUrls) {
      lastBaseUrl = baseUrl;

      // Create a Klarna Checkout order (returns hosted checkout URL)
      const response = await fetch(`${baseUrl}/checkout/v3/orders`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      });

      lastStatus = response.status;
      lastResult = await response.json().catch(() => ({}));

      console.log("Klarna response status:", response.status, "baseUrl:", baseUrl);
      console.log("Klarna response:", JSON.stringify(lastResult, null, 2));

      if (response.ok) {
        // Klarna Checkout returns html_snippet containing the checkout iframe/redirect
        // For redirect flow, we need the order_id and can construct the URL
        const orderId = lastResult.order_id;
        const htmlSnippet = lastResult.html_snippet;

        // Extract the checkout URL from the HTML snippet if present
        let checkoutUrl = null;
        if (htmlSnippet) {
          // The HTML snippet contains a script that loads Klarna checkout
          // We can extract the checkout URL or just return the snippet for iframe embedding
          const urlMatch = htmlSnippet.match(/src="([^"]+)"/);
          if (urlMatch) {
            checkoutUrl = urlMatch[1];
          }
        }

        // If we have a direct checkout URL in the response
        if (lastResult.checkout_url) {
          checkoutUrl = lastResult.checkout_url;
        }

        console.log("Klarna order created:", orderId);
        console.log("Checkout URL:", checkoutUrl);

        return new Response(
          JSON.stringify({
            success: true,
            orderId: orderId,
            redirectUrl: checkoutUrl,
            htmlSnippet: htmlSnippet,
            merchantReference: data.merchantReference,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If unauthorized or not found, try the next region endpoint
      if (response.status !== 401 && response.status !== 404) break;
    }

    console.error("Klarna API error:", lastResult);

    let errorMessage = lastResult?.error_message || lastResult?.error_messages?.[0] || "Klarna checkout failed";
    if (lastStatus === 401) {
      errorMessage = "Klarna authorization failed. Please verify credentials are valid and for the correct environment.";
    } else if (lastStatus === 404) {
      errorMessage = "Klarna endpoint not found. The credentials may be for a different region.";
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
