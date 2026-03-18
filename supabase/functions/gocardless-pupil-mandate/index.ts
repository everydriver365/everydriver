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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { subscriptionId, pupilName, pupilEmail, redirectUrl } = await req.json();

    if (!subscriptionId || !pupilEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: subscriptionId, pupilEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from("pupil_subscriptions")
      .select("*, pupils(name, email)")
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nameParts = (pupilName || subscription.pupils?.name || "").split(" ");
    const givenName = nameParts[0] || "Pupil";
    const familyName = nameParts.slice(1).join(" ") || givenName;
    const email = pupilEmail || subscription.pupils?.email;

    // Step 1: Create a billing request with mandate_request only (BACS Direct Debit)
    const brResponse = await fetch(`${baseUrl}/billing_requests`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOCARDLESS_ACCESS_TOKEN}`,
        "GoCardless-Version": "2015-07-06",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing_requests: {
          mandate_request: {
            scheme: "bacs",
            currency: "GBP",
          },
          metadata: {
            subscription_id: subscriptionId,
            pupil_id: subscription.pupil_id,
            instructor_id: subscription.instructor_id,
          },
        },
      }),
    });

    if (!brResponse.ok) {
      const errData = await brResponse.json();
      console.error("GoCardless billing request error:", errData);
      return new Response(
        JSON.stringify({ error: "Failed to create mandate request", details: errData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const brData = await brResponse.json();
    const billingRequestId = brData.billing_requests.id;

    // Step 2: Create billing request flow
    const origin = redirectUrl || "https://everydriver.lovable.app";
    const flowResponse = await fetch(`${baseUrl}/billing_request_flows`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOCARDLESS_ACCESS_TOKEN}`,
        "GoCardless-Version": "2015-07-06",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing_request_flows: {
          redirect_uri: origin,
          exit_uri: origin,
          links: {
            billing_request: billingRequestId,
          },
          prefilled_customer: {
            email,
            given_name: givenName,
            family_name: familyName,
          },
          lock_customer_details: false,
          show_redirect_buttons: true,
          show_success_redirect_button: true,
        },
      }),
    });

    if (!flowResponse.ok) {
      const errData = await flowResponse.json();
      console.error("GoCardless flow error:", errData);
      return new Response(
        JSON.stringify({ error: "Failed to create mandate flow", details: errData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const flowData = await flowResponse.json();
    const authorisationUrl = flowData.billing_request_flows.authorisation_url;

    // Update subscription with billing request ID for webhook tracking
    await supabase
      .from("pupil_subscriptions")
      .update({
        gocardless_customer_id: billingRequestId, // temporary - will be replaced by webhook
      } as any)
      .eq("id", subscriptionId);

    console.log("Created GoCardless pupil mandate flow:", billingRequestId);

    return new Response(
      JSON.stringify({
        authorisationUrl,
        billingRequestId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("gocardless-pupil-mandate error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
