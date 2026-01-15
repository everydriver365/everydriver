import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClearpayCheckoutRequest {
  amount: number;
  currency?: string;
  merchantReference: string;
  consumer: {
    givenNames: string;
    surname: string;
    email: string;
    phoneNumber?: string;
  };
  billing?: {
    name: string;
    line1: string;
    postcode: string;
    countryCode: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  redirectUrls: {
    confirmUrl: string;
    cancelUrl: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("CLEARPAY_MERCHANT_ID");
    const secretKey = Deno.env.get("CLEARPAY_SECRET_KEY");

    if (!merchantId || !secretKey) {
      console.error("Clearpay credentials not configured");
      return new Response(
        JSON.stringify({ error: "Clearpay not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: ClearpayCheckoutRequest = await req.json();
    console.log("Clearpay checkout request:", JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.amount || !data.merchantReference || !data.consumer || !data.redirectUrls) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clearpay API - Create checkout
    // UK/EU uses api.eu.afterpay.com, sandbox uses global.api-sandbox.afterpay.com
    const isSandbox = Deno.env.get("CLEARPAY_SANDBOX") === "true";
    const baseUrl = isSandbox 
      ? "https://global.api-sandbox.afterpay.com"
      : "https://api.eu.afterpay.com";

    const authHeader = btoa(`${merchantId}:${secretKey}`);

    // Format amount for Clearpay (requires amount object with currency)
    const checkoutPayload = {
      amount: {
        amount: data.amount.toFixed(2),
        currency: data.currency || "GBP",
      },
      consumer: {
        givenNames: data.consumer.givenNames,
        surname: data.consumer.surname,
        email: data.consumer.email,
        phoneNumber: data.consumer.phoneNumber || "",
      },
      billing: data.billing ? {
        name: data.billing.name,
        line1: data.billing.line1,
        postcode: data.billing.postcode,
        countryCode: data.billing.countryCode || "GB",
      } : undefined,
      items: data.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: {
          amount: item.price.toFixed(2),
          currency: data.currency || "GBP",
        },
      })),
      merchant: {
        redirectConfirmUrl: data.redirectUrls.confirmUrl,
        redirectCancelUrl: data.redirectUrls.cancelUrl,
      },
      merchantReference: data.merchantReference,
    };

    console.log("Sending to Clearpay:", JSON.stringify(checkoutPayload, null, 2));

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
    console.log("Clearpay response status:", response.status);
    console.log("Clearpay response:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("Clearpay API error:", result);
      return new Response(
        JSON.stringify({ 
          error: result.message || "Clearpay checkout failed",
          details: result 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the checkout token and redirect URL
    return new Response(
      JSON.stringify({
        token: result.token,
        redirectUrl: result.redirectCheckoutUrl,
        expires: result.expires,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in clearpay-checkout:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
