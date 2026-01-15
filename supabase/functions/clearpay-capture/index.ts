import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClearpayConfirmRequest {
  token: string;
  merchantReference: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("CLEARPAY_MERCHANT_ID");
    const secretKey = Deno.env.get("CLEARPAY_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!merchantId || !secretKey) {
      console.error("Clearpay credentials not configured");
      return new Response(
        JSON.stringify({ error: "Clearpay not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data: ClearpayConfirmRequest = await req.json();
    
    console.log("Clearpay capture request:", data);

    if (!data.token) {
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isSandbox = Deno.env.get("CLEARPAY_SANDBOX") === "true";
    const baseUrl = isSandbox 
      ? "https://global.api-sandbox.afterpay.com"
      : "https://api.eu.afterpay.com";

    const authHeader = btoa(`${merchantId}:${secretKey}`);

    // Capture the payment (immediate capture)
    const capturePayload = {
      token: data.token,
      merchantReference: data.merchantReference,
    };

    console.log("Capturing Clearpay payment:", capturePayload);

    const response = await fetch(`${baseUrl}/v2/payments/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/json",
        "User-Agent": "EveryDriver/1.0",
      },
      body: JSON.stringify(capturePayload),
    });

    const result = await response.json();
    console.log("Clearpay capture response:", response.status, JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("Clearpay capture error:", result);
      return new Response(
        JSON.stringify({ 
          error: result.message || "Payment capture failed",
          details: result 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment successful - log it
    console.log("Clearpay payment captured successfully:", result.id);

    // Optionally store payment record
    if (data.merchantReference) {
      try {
        await supabase
          .from("payment_history")
          .insert({
            instructor_id: data.merchantReference.split("-")[0], // Assumes format: instructorId-timestamp
            pupil_id: data.merchantReference.split("-")[1] || null,
            amount: parseFloat(result.amount?.amount || "0"),
            payment_method: "clearpay",
            notes: `Clearpay payment ${result.id}`,
          });
      } catch (dbError) {
        console.log("Could not log payment to history:", dbError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: result.id,
        status: result.status,
        amount: result.amount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in clearpay-capture:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
