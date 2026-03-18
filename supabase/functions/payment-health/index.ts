import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GatewayStatus {
  available: boolean;
  configured: boolean;
  error?: string;
}

interface HealthResponse {
  clearpay: GatewayStatus;
  klarna: GatewayStatus;
  npi: GatewayStatus;
  square: GatewayStatus;
  elavon: GatewayStatus;
  gocardless: GatewayStatus;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response: HealthResponse = {
      clearpay: { available: false, configured: false },
      klarna: { available: false, configured: false },
      npi: { available: false, configured: false },
      square: { available: false, configured: false },
      elavon: { available: false, configured: false },
      gocardless: { available: false, configured: false },
    };

    // Check Clearpay credentials
    const clearpayMerchantId = Deno.env.get("CLEARPAY_MERCHANT_ID");
    const clearpaySecretKey = Deno.env.get("CLEARPAY_SECRET_KEY");
    if (clearpayMerchantId && clearpaySecretKey) {
      response.clearpay.configured = true;
      response.clearpay.available = true;
    }

    // Check Klarna credentials
    const klarnaUsername = Deno.env.get("KLARNA_API_USERNAME");
    const klarnaPassword = Deno.env.get("KLARNA_API_PASSWORD");
    if (klarnaUsername && klarnaPassword) {
      response.klarna.configured = true;
      response.klarna.available = true;
    }

    // Check NPI credentials
    const npiMerchantId = Deno.env.get("NPI_MERCHANT_ID");
    const npiMerchantSecret = Deno.env.get("NPI_MERCHANT_SECRET");
    if (npiMerchantId && npiMerchantSecret) {
      response.npi.configured = true;
      response.npi.available = true;
    }

    // Check Square credentials
    const squareAccessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    const squareLocationId = Deno.env.get("SQUARE_LOCATION_ID");
    const squareAppId = Deno.env.get("SQUARE_APPLICATION_ID");
    if (squareAccessToken && squareLocationId && squareAppId) {
      response.square.configured = true;
      response.square.available = true;
    } else {
      response.square.configured = !!(squareAccessToken || squareLocationId);
      if (!squareAccessToken) response.square.error = "SQUARE_ACCESS_TOKEN not set";
      else if (!squareLocationId) response.square.error = "SQUARE_LOCATION_ID not set";
      else if (!squareAppId) response.square.error = "SQUARE_APPLICATION_ID not set";
    }

    // Check Elavon/Cardstream credentials
    const elavonMerchantAlias = Deno.env.get("NPI_MERCHANT_ID") || Deno.env.get("ELAVON_MERCHANT_ALIAS");
    const elavonSecretKey = Deno.env.get("NPI_MERCHANT_SECRET") || Deno.env.get("ELAVON_SECRET_KEY");
    if (elavonMerchantAlias && elavonSecretKey) {
      response.elavon.configured = true;
      response.elavon.available = true;
    }

    // Check GoCardless credentials
    const gocardlessToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    if (gocardlessToken) {
      response.gocardless.configured = true;
      response.gocardless.available = true;
    }

    console.log("Payment health check:", response);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Payment health check error:", error);
    return new Response(
      JSON.stringify({ error: "Health check failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
