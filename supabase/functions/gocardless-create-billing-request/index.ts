import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BillingRequestBody {
  instructor_id: string;
  plan_id: string;
  redirect_url: string;
  domain_name?: string;
  domain_tld?: string;
  domain_price?: number;
  promo?: string;
  seat_count?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOCARDLESS_ACCESS_TOKEN = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    const GOCARDLESS_ENVIRONMENT = Deno.env.get("GOCARDLESS_ENVIRONMENT") || "sandbox";
    
    if (!GOCARDLESS_ACCESS_TOKEN) {
      throw new Error("GoCardless access token not configured");
    }

    const env = (GOCARDLESS_ENVIRONMENT || "").toLowerCase();
    const isLive = env === "live" || env === "production" || env === "prod";
    const baseUrl = isLive
      ? "https://api.gocardless.com"
      : "https://api-sandbox.gocardless.com";

    console.log(`[GoCardless Billing] Environment: "${GOCARDLESS_ENVIRONMENT}" → resolved: "${env}", isLive: ${isLive}, baseUrl: ${baseUrl}`);

    const { 
      instructor_id, 
      plan_id, 
      redirect_url,
      domain_name,
      domain_tld,
      domain_price,
      promo,
      seat_count,
    }: BillingRequestBody = await req.json();

    if (!instructor_id || !plan_id || !redirect_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get instructor details
    const { data: instructor, error: instructorError } = await supabase
      .from("instructors")
      .select("id, name, email, user_id")
      .eq("id", instructor_id)
      .single();

    if (instructorError || !instructor) {
      throw new Error("Instructor not found");
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id, name, price_monthly, gocardless_plan_id, is_per_seat, base_price_monthly, per_seat_price_monthly, min_seats")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      throw new Error("Plan not found");
    }

    // Check if instructor already has a GoCardless customer
    const { data: existingSub } = await supabase
      .from("instructor_subscriptions")
      .select("gocardless_customer_id")
      .eq("instructor_id", instructor_id)
      .maybeSingle();

    let customerId = existingSub?.gocardless_customer_id;

    // Create GoCardless customer if needed
    if (!customerId) {
      const customerResponse = await fetch(`${baseUrl}/customers`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GOCARDLESS_ACCESS_TOKEN}`,
          "GoCardless-Version": "2015-07-06",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customers: {
            email: instructor.email,
            given_name: instructor.name?.split(" ")[0] || "Instructor",
            family_name: instructor.name?.split(" ").slice(1).join(" ") || "",
            metadata: {
              instructor_id: instructor_id,
            },
          },
        }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        console.error("GoCardless customer creation failed:", errorData);
        throw new Error("Failed to create GoCardless customer");
      }

      const customerData = await customerResponse.json();
      customerId = customerData.customers.id;

      // Store customer ID
      await supabase
        .from("instructor_subscriptions")
        .upsert({
          instructor_id: instructor_id,
          plan_id: plan_id,
          status: "pending",
          gocardless_customer_id: customerId,
        }, { onConflict: "instructor_id" });
    }

    // Calculate plan amount (handle per-seat pricing)
    let planAmount: number;
    const seats = seat_count || plan.min_seats || 1;
    
    if (plan.is_per_seat) {
      const baseAmount = Math.round((plan.base_price_monthly || 0) * 100);
      const seatAmount = Math.round((plan.per_seat_price_monthly || 0) * seats * 100);
      planAmount = baseAmount + seatAmount;
      console.log(`[GoCardless Billing] Per-seat pricing: base=${baseAmount}p + ${seats} seats × ${Math.round((plan.per_seat_price_monthly || 0) * 100)}p = ${planAmount}p total`);
    } else {
      planAmount = Math.round(plan.price_monthly * 100);
    }
    
    const domainAmount = domain_price ? Math.round(domain_price * 100) : 0;

    // Calculate start date for promo
    const isFirstMonthFree = promo === "first-month-free";
    let subscriptionStartDate: string | undefined;
    if (isFirstMonthFree) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30);
      subscriptionStartDate = startDate.toISOString().split("T")[0]; // YYYY-MM-DD
      console.log(`[GoCardless Billing] First month free promo applied, start date: ${subscriptionStartDate}`);
    }

    // Create a billing request for mandate setup
    const billingRequestPayload: any = {
      billing_requests: {
        mandate_request: {
          scheme: "bacs", // UK Direct Debit
          currency: "GBP",
        },
        metadata: {
          instructor_id: instructor_id,
          plan_id: plan_id,
          plan_name: plan.name,
          plan_amount: planAmount.toString(),
          ...(plan.is_per_seat && { seat_count: seats.toString(), per_seat_price: Math.round((plan.per_seat_price_monthly || 0) * 100).toString() }),
          ...(isFirstMonthFree && { promo: "first-month-free", subscription_start_date: subscriptionStartDate }),
        },
      },
    };

    // Add payment request if there's an upfront charge (domain)
    if (domainAmount > 0 && domain_name) {
      billingRequestPayload.billing_requests.payment_request = {
        description: `Domain registration: ${domain_name}${domain_tld}`,
        amount: domainAmount,
        currency: "GBP",
      };
      billingRequestPayload.billing_requests.metadata.domain_name = domain_name;
      billingRequestPayload.billing_requests.metadata.domain_tld = domain_tld;
      billingRequestPayload.billing_requests.metadata.domain_amount = domainAmount.toString();
    }

    const billingRequestResponse = await fetch(`${baseUrl}/billing_requests`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOCARDLESS_ACCESS_TOKEN}`,
        "GoCardless-Version": "2015-07-06",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(billingRequestPayload),
    });

    if (!billingRequestResponse.ok) {
      const errorData = await billingRequestResponse.json();
      console.error("GoCardless billing request creation failed:", errorData);
      throw new Error("Failed to create billing request");
    }

    const billingRequestData = await billingRequestResponse.json();
    const billingRequestId = billingRequestData.billing_requests.id;

    // Create a billing request flow to get redirect URL
    const flowResponse = await fetch(`${baseUrl}/billing_request_flows`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOCARDLESS_ACCESS_TOKEN}`,
        "GoCardless-Version": "2015-07-06",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing_request_flows: {
          redirect_uri: redirect_url,
          exit_uri: redirect_url,
          links: {
            billing_request: billingRequestId,
          },
          prefilled_customer: {
            given_name: instructor.name?.split(" ")[0] || "",
            family_name: instructor.name?.split(" ").slice(1).join(" ") || "",
            email: instructor.email,
          },
          lock_customer_details: true,
        },
      }),
    });

    if (!flowResponse.ok) {
      const errorData = await flowResponse.json();
      console.error("GoCardless flow creation failed:", errorData);
      throw new Error("Failed to create billing request flow");
    }

    const flowData = await flowResponse.json();

    // Update subscription record with billing request ID
    await supabase
      .from("instructor_subscriptions")
      .update({
        gocardless_billing_request_id: billingRequestId,
        updated_at: new Date().toISOString(),
      })
      .eq("instructor_id", instructor_id);

    return new Response(
      JSON.stringify({
        success: true,
        authorisation_url: flowData.billing_request_flows.authorisation_url,
        billing_request_id: billingRequestId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in gocardless-create-billing-request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
