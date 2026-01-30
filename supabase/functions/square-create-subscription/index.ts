import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  instructor_id: string;
  plan_id: string;
  card_nonce: string;
  instructor_name: string;
  instructor_email: string;
  domain_name?: string;
  domain_tld?: string;
  domain_price?: number;
}

async function squareRequest(endpoint: string, method: string, body?: unknown) {
  const accessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
  const environment = Deno.env.get("SQUARE_ENVIRONMENT") || "sandbox";
  const baseUrl = environment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      "Square-Version": "2024-01-18",
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Square API error:", data);
    throw new Error(data.errors?.[0]?.detail || "Square API error");
  }

  return data;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      instructor_id,
      plan_id,
      card_nonce,
      instructor_name,
      instructor_email,
      domain_name,
      domain_tld,
      domain_price,
    }: RequestBody = await req.json();

    // Validate required fields
    if (!instructor_id || !plan_id || !card_nonce) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get plan details including Square plan variation ID
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if instructor already has a Square customer ID
    const { data: existingSub } = await supabase
      .from("instructor_subscriptions")
      .select("square_customer_id")
      .eq("instructor_id", instructor_id)
      .maybeSingle();

    let squareCustomerId = existingSub?.square_customer_id;

    // Step 1: Create Square Customer (if not exists)
    if (!squareCustomerId) {
      console.log("Creating Square customer for:", instructor_email);
      
      const customerResult = await squareRequest("/v2/customers", "POST", {
        idempotency_key: `customer-${instructor_id}`,
        given_name: instructor_name?.split(" ")[0] || "Instructor",
        family_name: instructor_name?.split(" ").slice(1).join(" ") || "",
        email_address: instructor_email,
        reference_id: instructor_id,
      });

      squareCustomerId = customerResult.customer.id;
      console.log("Created Square customer:", squareCustomerId);
    }

    // Step 2: Create Card on File using the nonce
    console.log("Creating card on file with nonce");
    const locationId = Deno.env.get("SQUARE_LOCATION_ID");
    
    const cardResult = await squareRequest("/v2/cards", "POST", {
      idempotency_key: `card-${instructor_id}-${Date.now()}`,
      source_id: card_nonce,
      card: {
        customer_id: squareCustomerId,
      },
    });

    const squareCardId = cardResult.card.id;
    console.log("Created card on file:", squareCardId);

    // Step 3: Create Subscription
    // Note: For now, we'll create a simple payment if no plan variation exists
    // In production, you should have Square catalog plan variation IDs set up
    let squareSubscriptionId: string | null = null;
    let subscriptionStatus = "active";

    if (plan.square_plan_variation_id) {
      // Create actual subscription with Square Subscriptions API
      console.log("Creating Square subscription with plan:", plan.square_plan_variation_id);
      
      const subscriptionResult = await squareRequest("/v2/subscriptions", "POST", {
        idempotency_key: `sub-${instructor_id}-${Date.now()}`,
        location_id: locationId,
        customer_id: squareCustomerId,
        plan_variation_id: plan.square_plan_variation_id,
        card_id: squareCardId,
        start_date: new Date().toISOString().split("T")[0], // Today
      });

      squareSubscriptionId = subscriptionResult.subscription.id;
      subscriptionStatus = subscriptionResult.subscription.status?.toLowerCase() || "active";
      console.log("Created Square subscription:", squareSubscriptionId);
    } else {
      // No plan variation configured - charge immediately and set up manual tracking
      console.log("No Square plan variation configured, charging initial payment");
      
      const amountInPence = Math.round((plan.price_monthly + (domain_price || 0)) * 100);
      
      const paymentResult = await squareRequest("/v2/payments", "POST", {
        idempotency_key: `payment-${instructor_id}-${Date.now()}`,
        source_id: squareCardId,
        amount_money: {
          amount: amountInPence,
          currency: "GBP",
        },
        location_id: locationId,
        customer_id: squareCustomerId,
        note: `${plan.name} subscription - first payment${domain_name ? ` + domain: ${domain_name}${domain_tld}` : ""}`,
      });

      console.log("Payment processed:", paymentResult.payment.id);
      squareSubscriptionId = `manual-${paymentResult.payment.id}`;
    }

    // Step 4: Update instructor_subscriptions table
    const { error: upsertError } = await supabase
      .from("instructor_subscriptions")
      .upsert({
        instructor_id,
        plan_id,
        status: subscriptionStatus,
        square_customer_id: squareCustomerId,
        square_subscription_id: squareSubscriptionId,
        square_card_id: squareCardId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
      }, {
        onConflict: "instructor_id",
      });

    if (upsertError) {
      console.error("Error updating subscription:", upsertError);
      throw new Error("Failed to save subscription");
    }

    // Step 5: Save domain order if provided
    if (domain_name && domain_tld) {
      await supabase
        .from("domain_orders")
        .upsert({
          instructor_id,
          domain_name,
          tld: domain_tld,
          order_type: "registration",
          status: "pending",
          price_amount: domain_price || 12.99,
          currency: "GBP",
          period_years: 1,
          auto_renew: true,
        }, {
          onConflict: "instructor_id,domain_name,tld",
          ignoreDuplicates: true,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: squareSubscriptionId,
        customer_id: squareCustomerId,
        card_id: squareCardId,
        status: subscriptionStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error creating subscription:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create subscription";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
