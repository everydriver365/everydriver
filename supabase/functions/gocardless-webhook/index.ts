import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return new Response(
        JSON.stringify({ message: "No events to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const event of events) {
      console.log("Processing GoCardless event:", event.resource_type, event.action);

      switch (event.resource_type) {
        case "billing_requests":
          await handleBillingRequest(supabase, event);
          break;
        case "mandates":
          await handleMandate(supabase, event);
          break;
        case "subscriptions":
          await handleSubscription(supabase, event);
          break;
        case "payments":
          await handlePayment(supabase, event);
          break;
        default:
          console.log("Unhandled event type:", event.resource_type);
      }
    }

    return new Response(
      JSON.stringify({ message: "Events processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in gocardless-webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleBillingRequest(supabase: any, event: any) {
  const billingRequestId = event.links?.billing_request;
  const action = event.action;

  if (action === "fulfilled") {
    // Billing request completed - mandate was set up
    const mandateId = event.links?.mandate;
    const customerId = event.links?.customer;

    if (mandateId) {
      // Find the subscription by billing request ID and update it
      const { data: subscription, error } = await supabase
        .from("instructor_subscriptions")
        .update({
          gocardless_mandate_id: mandateId,
          gocardless_customer_id: customerId,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("gocardless_billing_request_id", billingRequestId)
        .select()
        .single();

      if (error) {
        console.error("Error updating subscription:", error);
      } else {
        console.log("Subscription activated for instructor:", subscription?.instructor_id);

        // Now create the recurring subscription in GoCardless
        await createGoCardlessSubscription(supabase, subscription);
      }
    }
  }
}

async function createGoCardlessSubscription(supabase: any, subscription: any) {
  const GOCARDLESS_ACCESS_TOKEN = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
  const GOCARDLESS_ENVIRONMENT = Deno.env.get("GOCARDLESS_ENVIRONMENT") || "sandbox";
  
  if (!GOCARDLESS_ACCESS_TOKEN || !subscription) return;

  const baseUrl = GOCARDLESS_ENVIRONMENT === "live" 
    ? "https://api.gocardless.com"
    : "https://api-sandbox.gocardless.com";

  // Get the plan details
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("price_monthly, name")
    .eq("id", subscription.plan_id)
    .single();

  if (!plan || plan.price_monthly === 0) return;

  const amount = Math.round(plan.price_monthly * 100); // Convert to pence

  try {
    const response = await fetch(`${baseUrl}/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOCARDLESS_ACCESS_TOKEN}`,
        "GoCardless-Version": "2015-07-06",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriptions: {
          amount: amount,
          currency: "GBP",
          name: `${plan.name} Plan - Monthly`,
          interval_unit: "monthly",
          interval: 1,
          day_of_month: new Date().getDate(), // Same day each month
          links: {
            mandate: subscription.gocardless_mandate_id,
          },
          metadata: {
            instructor_id: subscription.instructor_id,
            plan_id: subscription.plan_id,
          },
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const gcSubscriptionId = data.subscriptions.id;

      // Update with subscription ID
      await supabase
        .from("instructor_subscriptions")
        .update({
          gocardless_subscription_id: gcSubscriptionId,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", subscription.id);

      console.log("Created GoCardless subscription:", gcSubscriptionId);
    } else {
      const errorData = await response.json();
      console.error("Failed to create GoCardless subscription:", errorData);
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
  }
}

async function handleMandate(supabase: any, event: any) {
  const mandateId = event.links?.mandate;
  const action = event.action;

  if (action === "cancelled" || action === "failed" || action === "expired") {
    // Mandate cancelled - update subscription status
    await supabase
      .from("instructor_subscriptions")
      .update({
        status: action === "failed" ? "payment_failed" : "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("gocardless_mandate_id", mandateId);

    console.log(`Mandate ${mandateId} ${action}`);
  }
}

async function handleSubscription(supabase: any, event: any) {
  const subscriptionId = event.links?.subscription;
  const action = event.action;

  const statusMap: Record<string, string> = {
    "cancelled": "cancelled",
    "finished": "expired",
    "paused": "paused",
    "resumed": "active",
  };

  if (statusMap[action]) {
    await supabase
      .from("instructor_subscriptions")
      .update({
        status: statusMap[action],
        updated_at: new Date().toISOString(),
      })
      .eq("gocardless_subscription_id", subscriptionId);

    console.log(`Subscription ${subscriptionId} ${action}`);
  }
}

async function handlePayment(supabase: any, event: any) {
  const paymentId = event.links?.payment;
  const subscriptionId = event.links?.subscription;
  const action = event.action;

  if (action === "confirmed" && subscriptionId) {
    // Payment confirmed - extend the period
    const newPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    await supabase
      .from("instructor_subscriptions")
      .update({
        current_period_end: newPeriodEnd,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("gocardless_subscription_id", subscriptionId);

    console.log(`Payment ${paymentId} confirmed, period extended`);
  } else if (action === "failed" && subscriptionId) {
    await supabase
      .from("instructor_subscriptions")
      .update({
        status: "payment_failed",
        updated_at: new Date().toISOString(),
      })
      .eq("gocardless_subscription_id", subscriptionId);

    console.log(`Payment ${paymentId} failed`);
  }
}
