import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KlarnaOrderRequest {
  authorization_token: string;
  order_amount: number;
  order_lines: Array<{
    type: string;
    reference: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    tax_rate: number;
    total_tax_amount: number;
  }>;
  merchant_reference: string;
  purchase_country?: string;
  purchase_currency?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: KlarnaOrderRequest = await req.json();
    console.log("Creating Klarna order with authorization_token:", data.authorization_token?.substring(0, 20) + "...");

    const username = Deno.env.get("KLARNA_API_USERNAME");
    const password = Deno.env.get("KLARNA_API_PASSWORD");
    const sandboxMode = Deno.env.get("KLARNA_SANDBOX") === "true";

    if (!username || !password) {
      console.error("Missing Klarna credentials");
      return new Response(
        JSON.stringify({ error: "Klarna credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.authorization_token) {
      return new Response(
        JSON.stringify({ error: "Missing authorization_token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = "Basic " + btoa(`${username}:${password}`);
    const currency = data.purchase_currency || "GBP";
    const country = data.purchase_country || "GB";

    // Build the order capture payload
    const orderPayload = {
      purchase_country: country,
      purchase_currency: currency,
      order_amount: data.order_amount,
      order_tax_amount: 0,
      order_lines: data.order_lines,
      merchant_reference1: data.merchant_reference,
    };

    console.log("Order payload:", JSON.stringify(orderPayload, null, 2));

    // Try regional endpoints - EU first for UK
    const baseUrls = sandboxMode
      ? ["https://api.playground.klarna.com"]
      : ["https://api.klarna.com", "https://api-na.klarna.com", "https://api-oc.klarna.com"];

    let lastError = null;
    let lastResponse = null;
    let lastStatus = 0;

    for (const baseUrl of baseUrls) {
      const endpoint = `${baseUrl}/payments/v1/authorizations/${data.authorization_token}/order`;
      console.log(`Trying Klarna order endpoint: ${endpoint}`);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderPayload),
        });

        const responseText = await response.text();
        console.log(`Response from ${baseUrl}:`, response.status, responseText);
        lastStatus = response.status;

        if (response.ok) {
          const result = JSON.parse(responseText);
          console.log("Klarna order created successfully:", result.order_id);
          
          return new Response(
            JSON.stringify({
              success: true,
              order_id: result.order_id,
              fraud_status: result.fraud_status,
              redirect_url: result.redirect_url,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        lastResponse = responseText;
        lastError = `${response.status}: ${responseText}`;
        
        // If we get a 401/403, credentials are wrong - don't try other regions
        if (response.status === 401 || response.status === 403) {
          console.error("Authentication failed, stopping region attempts");
          break;
        }

        // If 404, the authorization token may be invalid or expired
        if (response.status === 404) {
          console.error("Authorization token not found or expired");
          break;
        }
      } catch (fetchError) {
        console.error(`Error calling ${baseUrl}:`, fetchError);
        lastError = String(fetchError);
      }
    }

    // All attempts failed
    console.error("All Klarna order endpoints failed:", lastError);
    
    let errorMessage = "Failed to capture Klarna order";
    if (lastStatus === 401 || lastStatus === 403) {
      errorMessage = "Klarna authentication failed. Please check credentials.";
    } else if (lastStatus === 404) {
      errorMessage = "Payment authorization expired or invalid. Please try again.";
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: lastError,
        sandbox: sandboxMode,
      }),
      { status: lastStatus || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Klarna order error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
