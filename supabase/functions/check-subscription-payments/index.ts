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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find all failed/overdue subscriptions
    const { data: failedSubs, error: fetchError } = await supabase
      .from("instructor_subscriptions")
      .select("id, instructor_id, plan_id, current_period_end, status, gocardless_subscription_id")
      .in("status", ["payment_failed", "overdue"]);

    if (fetchError) {
      console.error("Error fetching failed subscriptions:", fetchError);
      throw fetchError;
    }

    if (!failedSubs || failedSubs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No failed subscriptions to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the free plan ID
    const { data: freePlan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("slug", "free")
      .single();

    const freePlanId = freePlan?.id;

    let downgradedCount = 0;
    let reminderCount = 0;

    for (const sub of failedSubs) {
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;

      if (!periodEnd) continue;

      // If period ended > 7 days ago → downgrade
      if (periodEnd < sevenDaysAgo && freePlanId) {
        // Downgrade to free plan
        await supabase
          .from("instructor_subscriptions")
          .update({
            plan_id: freePlanId,
            status: "downgraded",
            updated_at: now.toISOString(),
          })
          .eq("id", sub.id);

        // Create admin alert
        await supabase.from("admin_alerts").insert({
          alert_type: "downgrade",
          instructor_id: sub.instructor_id,
          subscription_id: sub.id,
          message: `Instructor auto-downgraded to Free plan after 7+ days of failed payment`,
          metadata: {
            previous_plan_id: sub.plan_id,
            period_end: sub.current_period_end,
          },
        });

        // Send SMS notification to instructor
        try {
          const { data: instructor } = await supabase
            .from("instructors")
            .select("phone, name")
            .eq("id", sub.instructor_id)
            .single();

          if (instructor?.phone) {
            await supabase.functions.invoke("send-sms", {
              body: {
                to: instructor.phone,
                message: `Hi ${instructor.name || "there"}, your EveryDriver subscription has been downgraded to the Free plan due to a missed payment. Log in to update your payment details and restore your plan.`,
              },
            });
          }
        } catch (smsErr) {
          console.error("Failed to send downgrade SMS:", smsErr);
        }

        downgradedCount++;
        console.log(`Downgraded instructor ${sub.instructor_id} to free plan`);
      }
      // If period ended 1-7 days ago → send reminder
      else if (periodEnd < now && periodEnd >= sevenDaysAgo) {
        // Check if we already sent a reminder today
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const { data: existingAlert } = await supabase
          .from("admin_alerts")
          .select("id")
          .eq("alert_type", "payment_overdue")
          .eq("instructor_id", sub.instructor_id)
          .gte("created_at", todayStart.toISOString())
          .maybeSingle();

        if (!existingAlert) {
          await supabase.from("admin_alerts").insert({
            alert_type: "payment_overdue",
            instructor_id: sub.instructor_id,
            subscription_id: sub.id,
            message: `Payment overdue - will be downgraded in ${Math.ceil((periodEnd.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTime()) / (24 * 60 * 60 * 1000))} days`,
            metadata: {
              period_end: sub.current_period_end,
              days_overdue: Math.floor((now.getTime() - periodEnd.getTime()) / (24 * 60 * 60 * 1000)),
            },
          });

          // Send reminder SMS
          try {
            const { data: instructor } = await supabase
              .from("instructors")
              .select("phone, name")
              .eq("id", sub.instructor_id)
              .single();

            if (instructor?.phone) {
              await supabase.functions.invoke("send-sms", {
                body: {
                  to: instructor.phone,
                  message: `Hi ${instructor.name || "there"}, your EveryDriver subscription payment failed. Please update your payment details to avoid being downgraded to the Free plan.`,
                },
              });
            }
          } catch (smsErr) {
            console.error("Failed to send reminder SMS:", smsErr);
          }

          reminderCount++;
        }
      }
    }

    // Notify admin of any actions taken
    if (downgradedCount > 0 || reminderCount > 0) {
      const ADMIN_PHONE = Deno.env.get("ADMIN_PHONE_NUMBER");
      if (ADMIN_PHONE) {
        try {
          await supabase.functions.invoke("send-sms", {
            body: {
              to: ADMIN_PHONE,
              message: `[EveryDriver] Daily payment check: ${downgradedCount} downgraded, ${reminderCount} reminders sent.`,
            },
          });
        } catch (err) {
          console.error("Failed to send admin summary SMS:", err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: failedSubs.length,
        downgraded: downgradedCount,
        reminders: reminderCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-subscription-payments:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
