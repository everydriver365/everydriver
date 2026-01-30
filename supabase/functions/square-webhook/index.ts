import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const eventType = payload.type;
    const data = payload.data?.object;

    console.log("Received Square webhook:", eventType);

    switch (eventType) {
      case "subscription.created":
      case "subscription.updated": {
        const subscriptionId = data?.subscription?.id;
        const status = data?.subscription?.status?.toLowerCase();
        const customerId = data?.subscription?.customer_id;

        if (!subscriptionId) break;

        console.log(`Updating subscription ${subscriptionId} to status: ${status}`);

        // Find instructor by Square customer ID
        const { data: sub, error: findError } = await supabase
          .from("instructor_subscriptions")
          .select("id, instructor_id")
          .eq("square_customer_id", customerId)
          .maybeSingle();

        if (findError || !sub) {
          console.log("Subscription not found for customer:", customerId);
          break;
        }

        // Update subscription status
        const { error: updateError } = await supabase
          .from("instructor_subscriptions")
          .update({
            status: status === "active" ? "active" : status === "canceled" ? "canceled" : "pending",
            square_subscription_id: subscriptionId,
          })
          .eq("id", sub.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
        }
        break;
      }

      case "invoice.payment_made": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;
        const customerId = invoice?.primary_recipient?.customer_id;

        if (!subscriptionId) break;

        console.log(`Payment made for subscription: ${subscriptionId}`);

        // Find and update subscription
        const { data: sub } = await supabase
          .from("instructor_subscriptions")
          .select("id")
          .eq("square_subscription_id", subscriptionId)
          .maybeSingle();

        if (sub) {
          // Extend subscription period by 30 days
          await supabase
            .from("instructor_subscriptions")
            .update({
              status: "active",
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq("id", sub.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = data?.invoice;
        const subscriptionId = invoice?.subscription_id;

        if (!subscriptionId) break;

        console.log(`Payment failed for subscription: ${subscriptionId}`);

        // Find and update subscription
        const { data: sub } = await supabase
          .from("instructor_subscriptions")
          .select("id")
          .eq("square_subscription_id", subscriptionId)
          .maybeSingle();

        if (sub) {
          await supabase
            .from("instructor_subscriptions")
            .update({
              status: "past_due",
            })
            .eq("id", sub.id);
        }
        break;
      }

      case "subscription.canceled": {
        const subscriptionId = data?.subscription?.id;

        if (!subscriptionId) break;

        console.log(`Subscription canceled: ${subscriptionId}`);

        await supabase
          .from("instructor_subscriptions")
          .update({ status: "canceled" })
          .eq("square_subscription_id", subscriptionId);
        break;
      }

      case "customer.card.updated":
      case "customer.card.created": {
        const card = data?.card || data;
        const customerId = card?.customer_id;
        const cardId = card?.id;

        if (!customerId || !cardId) break;

        console.log(`Card updated for customer: ${customerId}`);

        await supabase
          .from("instructor_subscriptions")
          .update({ square_card_id: cardId })
          .eq("square_customer_id", customerId);
        break;
      }

      default:
        console.log("Unhandled event type:", eventType);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
