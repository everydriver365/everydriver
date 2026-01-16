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
}

/**
 * Payment Health Check
 * 
 * Checks which payment gateways have their credentials configured
 * and returns their availability status.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response: HealthResponse = {
      clearpay: {
        available: false,
        configured: false,
      },
      klarna: {
        available: false,
        configured: false,
      },
      npi: {
        available: false,
        configured: false,
      },
      square: {
        available: false,
        configured: false,
      },
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
      // Klarna needs sandbox flag to work properly
      const klarnaSandbox = Deno.env.get("KLARNA_SANDBOX");
      if (klarnaSandbox !== undefined) {
        response.klarna.available = true;
      } else {
        response.klarna.error = "KLARNA_SANDBOX not set";
      }
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
    const squareEnvironment = Deno.env.get("SQUARE_ENVIRONMENT");
    if (squareAccessToken && squareLocationId) {
      response.square.configured = true;
      // Square token should start with EAAA for production
      if (squareEnvironment === "production" && !squareAccessToken.startsWith("EAAA")) {
        response.square.error = "Production token expected (EAAA prefix)";
      } else if (squareEnvironment === "sandbox" && !squareAccessToken.startsWith("EAAA")) {
        response.square.available = true;
      } else {
        response.square.available = true;
      }
    } else if (!squareLocationId) {
      response.square.error = "SQUARE_LOCATION_ID not set";
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
