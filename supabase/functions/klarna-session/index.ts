import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KlarnaSessionRequest {
  amount: number;
  currency?: string;
  merchantReference: string;
  orderDescription: string;
  instructorId?: string;
  consumer?: {
    givenName?: string;
    familyName?: string;
    email?: string;
    phone?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: KlarnaSessionRequest = await req.json();
    console.log("Creating Klarna session:", JSON.stringify(data, null, 2));

    // Instructor toggle gate (only enforced if instructorId is supplied)
    if (data.instructorId) {
      const supaUrl = Deno.env.get("SUPABASE_URL");
      const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supaUrl && supaKey) {
        const gateRes = await fetch(
          `${supaUrl}/rest/v1/instructors?id=eq.${data.instructorId}&select=klarna_enabled`,
          { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` } }
        );
        const rows = await gateRes.json().catch(() => []);
        if (Array.isArray(rows) && rows[0] && rows[0].klarna_enabled === false) {
          return new Response(
            JSON.stringify({ error: "Klarna is not enabled for this instructor." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const username = Deno.env.get("KLARNA_API_USERNAME");
    const password = Deno.env.get("KLARNA_API_PASSWORD");
    // Default to production since most merchants have live credentials
    // Set KLARNA_SANDBOX=true explicitly for sandbox testing
    const sandboxMode = Deno.env.get("KLARNA_SANDBOX") === "true";

    if (!username || !password) {
      console.error("Missing Klarna credentials");
      return new Response(
        JSON.stringify({ error: "Klarna credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = "Basic " + btoa(`${username}:${password}`);
    const currency = data.currency || "GBP";
    const amountInMinorUnits = Math.round(data.amount * 100);

    // Klarna Payments session payload
    const sessionPayload = {
      purchase_country: "GB",
      purchase_currency: currency,
      locale: "en-GB",
      order_amount: amountInMinorUnits,
      order_tax_amount: 0,
      order_lines: [
        {
          type: "digital",
          reference: data.merchantReference,
          name: data.orderDescription.substring(0, 255),
          quantity: 1,
          unit_price: amountInMinorUnits,
          tax_rate: 0,
          total_amount: amountInMinorUnits,
          total_tax_amount: 0,
        },
      ],
      intent: "buy",
      merchant_reference1: data.merchantReference,
    };

    console.log("Session payload:", JSON.stringify(sessionPayload, null, 2));

    // Try regional endpoints - EU first for UK
    const baseUrls = sandboxMode
      ? ["https://api.playground.klarna.com"]
      : ["https://api.klarna.com", "https://api-na.klarna.com", "https://api-oc.klarna.com"];

    let lastError = null;
    let lastResponse = null;

    for (const baseUrl of baseUrls) {
      const endpoint = `${baseUrl}/payments/v1/sessions`;
      console.log(`Trying Klarna endpoint: ${endpoint}`);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sessionPayload),
        });

        const responseText = await response.text();
        console.log(`Response from ${baseUrl}:`, response.status, responseText);

        if (response.ok) {
          const result = JSON.parse(responseText);
          console.log("Klarna session created successfully:", result.session_id);
          
          return new Response(
            JSON.stringify({
              success: true,
              session_id: result.session_id,
              client_token: result.client_token,
              payment_method_categories: result.payment_method_categories,
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
      } catch (fetchError) {
        console.error(`Error calling ${baseUrl}:`, fetchError);
        lastError = String(fetchError);
      }
    }

    // All attempts failed
    console.error("All Klarna endpoints failed:", lastError);
    return new Response(
      JSON.stringify({
        error: "Failed to create Klarna session",
        details: lastError,
        sandbox: sandboxMode,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Klarna session error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
