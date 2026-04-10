import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOCARDLESS_ACCESS_TOKEN = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    const GOCARDLESS_ENVIRONMENT = Deno.env.get("GOCARDLESS_ENVIRONMENT") || "sandbox";

    if (!GOCARDLESS_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ error: "GoCardless not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const env = (GOCARDLESS_ENVIRONMENT || "").toLowerCase();
    const isLive = env === "live" || env === "production" || env === "prod";
    const baseUrl = isLive
      ? "https://api.gocardless.com"
      : "https://api-sandbox.gocardless.com";

    console.log(`[GoCardless IBP] Environment: "${GOCARDLESS_ENVIRONMENT}" → resolved: "${env}", isLive: ${isLive}, baseUrl: ${baseUrl}`);

    const { amount, pupilId, bookingRef, redirectUrl, cancelUrl, customerEmail, customerName } = await req.json();

    if (!amount || !pupilId || !redirectUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, pupilId, redirectUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount < 0.50) {
      return new Response(
        JSON.stringify({ error: "Minimum payment amount is £0.50" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountInPence = Math.round(amount * 100);

    // Step 1: Create a billing request with payment_request only (one-off, no mandate)
    const brResponse = await fetch(`${baseUrl}/billing_requests`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOCARDLESS_ACCESS_TOKEN}`,
        "GoCardless-Version": "2015-07-06",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing_requests: {
          payment_request: {
            description: `Driving course booking`,
            amount: amountInPence,
            currency: "GBP",
            scheme: "faster_payments",
          },
          metadata: {
            pupil_id: pupilId,
            booking_ref: bookingRef || "",
          },
        },
      }),
    });

    if (!brResponse.ok) {
      const errData = await brResponse.json();
      console.error("GoCardless billing request error:", errData);
      return new Response(
        JSON.stringify({ error: "Failed to create billing request", details: errData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const brData = await brResponse.json();
    const billingRequestId = brData.billing_requests.id;

    // Step 2: Create a billing request flow (hosted page) with redirect
    const flowResponse = await fetch(`${baseUrl}/billing_request_flows`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOCARDLESS_ACCESS_TOKEN}`,
        "GoCardless-Version": "2015-07-06",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing_request_flows: {
          redirect_uri: redirectUrl,
          exit_uri: cancelUrl || redirectUrl,
          links: {
            billing_request: billingRequestId,
          },
          prefilled_customer: {
            email: customerEmail || undefined,
            given_name: customerName?.split(" ")[0] || undefined,
            family_name: customerName?.split(" ").slice(1).join(" ") || undefined,
          },
          lock_customer_details: false,
          lock_bank_account: false,
          show_redirect_buttons: true,
          show_success_redirect_button: true,
        },
      }),
    });

    if (!flowResponse.ok) {
      const errData = await flowResponse.json();
      console.error("GoCardless flow error:", errData);
      return new Response(
        JSON.stringify({ error: "Failed to create billing request flow", details: errData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const flowData = await flowResponse.json();
    const authorisationUrl = flowData.billing_request_flows.authorisation_url;

    // Step 3: Record payment intent in DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("payment_intents").insert({
      pupil_id: pupilId,
      amount: amount,
      currency: "GBP",
      status: "pending",
      payment_method: "gocardless_instant_bank_pay",
      gocardless_payment_id: billingRequestId,
      metadata: {
        billing_request_id: billingRequestId,
        booking_ref: bookingRef,
        type: "instant_bank_pay",
      },
    });

    console.log("Created GoCardless Instant Bank Pay flow:", billingRequestId);

    return new Response(
      JSON.stringify({
        authorisationUrl,
        billingRequestId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("gocardless-instant-bank-pay error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
