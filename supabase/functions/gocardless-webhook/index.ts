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
    const mandateId = event.links?.mandate;
    const customerId = event.links?.customer;
    const paymentId = event.links?.payment;

    // Check if this is an instructor subscription billing request
    const { data: instructorSub } = await supabase
      .from("instructor_subscriptions")
      .select("*")
      .eq("gocardless_billing_request_id", billingRequestId)
      .maybeSingle();

    if (instructorSub && mandateId) {
      await supabase
        .from("instructor_subscriptions")
        .update({
          gocardless_mandate_id: mandateId,
          gocardless_customer_id: customerId,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("gocardless_billing_request_id", billingRequestId);

      console.log("Instructor subscription activated:", instructorSub.instructor_id);
      await createGoCardlessSubscription(supabase, { ...instructorSub, gocardless_mandate_id: mandateId });
      return;
    }

    // Check if this is a pupil mandate billing request
    const { data: pupilSub } = await supabase
      .from("pupil_subscriptions")
      .select("*")
      .eq("gocardless_customer_id", billingRequestId)
      .maybeSingle();

    if (pupilSub && mandateId) {
      await supabase
        .from("pupil_subscriptions")
        .update({
          gocardless_mandate_id: mandateId,
          gocardless_customer_id: customerId,
        } as any)
        .eq("id", pupilSub.id);

      console.log("Pupil DD mandate activated for subscription:", pupilSub.id);
      return;
    }

    // Check if this is an Instant Bank Pay payment
    if (paymentId) {
      const { data: paymentIntent } = await supabase
        .from("payment_intents")
        .select("*")
        .eq("gocardless_payment_id", billingRequestId)
        .eq("payment_method", "gocardless_instant_bank_pay")
        .maybeSingle();

      if (paymentIntent) {
        await supabase
          .from("payment_intents")
          .update({
            status: "completed",
            gocardless_payment_id: paymentId,
          })
          .eq("id", paymentIntent.id);

        // Increment pupil balance
        if (paymentIntent.pupil_id && paymentIntent.amount) {
          await supabase.rpc("increment_pupil_balance", {
            p_pupil_id: paymentIntent.pupil_id,
            p_amount: paymentIntent.amount,
          });
        }

        // Record in payment_history
        await supabase.from("payment_history").insert({
          pupil_id: paymentIntent.pupil_id,
          amount: paymentIntent.amount,
          payment_method: "GoCardless Bank Pay",
          notes: `Instant Bank Pay - ${paymentId}`,
        });

        console.log("Instant Bank Pay completed:", paymentId, "for pupil:", paymentIntent.pupil_id);

        // Trigger confirm-booking
        const metadata = paymentIntent.metadata as any;
        if (metadata?.booking_ref && paymentIntent.pupil_id) {
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            await fetch(`${supabaseUrl}/functions/v1/confirm-booking`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ pupilId: paymentIntent.pupil_id }),
            });
          } catch (err) {
            console.error("confirm-booking trigger error:", err);
          }
        }
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

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("price_monthly, name")
    .eq("id", subscription.plan_id)
    .single();

  if (!plan || plan.price_monthly === 0) return;

  const amount = Math.round(plan.price_monthly * 100);

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
          amount,
          currency: "GBP",
          name: `${plan.name} Plan - Monthly`,
          interval_unit: "monthly",
          interval: 1,
          day_of_month: new Date().getDate(),
          links: { mandate: subscription.gocardless_mandate_id },
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
    // Update instructor subscriptions
    await supabase
      .from("instructor_subscriptions")
      .update({
        status: action === "failed" ? "payment_failed" : "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("gocardless_mandate_id", mandateId);

    // Also clear pupil subscription mandates
    await supabase
      .from("pupil_subscriptions")
      .update({ gocardless_mandate_id: null } as any)
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

  // Handle standalone payments (Instant Bank Pay confirmations)
  if (action === "confirmed" && !subscriptionId) {
    const { data: intent } = await supabase
      .from("payment_intents")
      .select("*")
      .eq("gocardless_payment_id", paymentId)
      .maybeSingle();

    if (intent && intent.status !== "completed") {
      await supabase
        .from("payment_intents")
        .update({ status: "completed" })
        .eq("id", intent.id);

      console.log(`Standalone payment ${paymentId} confirmed`);
    }
  }
}
