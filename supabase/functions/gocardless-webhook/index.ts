import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  PushDataType,
  NotifyCategory,
  NotifyImportance,
  PupilNotifyType,
} from "../_shared/notification-types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-signature",
};

async function verifyGoCardlessSignature(body: string, signatureHeader: string, secret: string): Promise<boolean> {
  // GoCardless sends: Webhook-Signature header as hex-encoded HMAC-SHA256
  const key = new TextEncoder().encode(secret);
  const data = new TextEncoder().encode(body);
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === signatureHeader;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawBody = await req.text();

    // HMAC signature verification
    const WEBHOOK_SECRET = Deno.env.get("GOCARDLESS_WEBHOOK_SECRET");
    if (WEBHOOK_SECRET) {
      const signature = req.headers.get("webhook-signature") || "";
      const isValid = await verifyGoCardlessSignature(rawBody, signature, WEBHOOK_SECRET);
      if (!isValid) {
        console.error("GoCardless webhook signature verification FAILED");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("GoCardless webhook signature verified ✓");
    } else {
      console.warn("GOCARDLESS_WEBHOOK_SECRET not set — skipping signature verification");
    }

    const body = JSON.parse(rawBody);
    const { events } = body;

    // Log webhook delivery (best-effort)
    try {
      await supabase.from("webhook_delivery_log").insert({
        provider: "gocardless",
        event_id: events?.[0]?.id ?? null,
        event_type: events?.map((e: any) => `${e.resource_type}.${e.action}`).join(",") ?? null,
        signature_valid: !!Deno.env.get("GOCARDLESS_WEBHOOK_SECRET"),
        processed: true,
        processed_at: new Date().toISOString(),
        response_status: 200,
        payload: body,
      });
    } catch (e) { console.warn("webhook log insert failed", e); }

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
    try {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await sb.from("webhook_delivery_log").insert({
        provider: "gocardless", processed: false, response_status: 500,
        error: String((error as Error)?.message ?? error),
      });
    } catch {}
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
    const paymentId = event.links?.payment;
    const mandateId = event.links?.mandate;

    // Look up the payment intent by billing request ID
    const { data: intent } = await supabase
      .from("payment_intents")
      .select("*")
      .eq("gocardless_billing_request_id", billingRequestId)
      .maybeSingle();

    if (!intent) {
      console.warn("No payment intent found for billing request:", billingRequestId);
      return;
    }

    // Update intent to confirmed
    await supabase
      .from("payment_intents")
      .update({ status: "confirmed", gocardless_payment_id: paymentId })
      .eq("id", intent.id);

    // Record in payment_history
    const amountPounds = Number(intent.amount ?? 0) / 100;
    if (intent.instructor_id && intent.pupil_id) {
      await supabase.from("payment_history").insert({
        pupil_id: intent.pupil_id,
        instructor_id: intent.instructor_id,
        amount: amountPounds,
        payment_method: "GoCardless",
        payment_type: "lesson_payment",
        payout_status: "pending",
        notes: `GoCardless Instant Bank Pay — ${paymentId}`,
      });
    }

    // Notify instructor
    if (intent.instructor_id) {
      await pushToInstructor(intent.instructor_id, {
        title: "💰 Payment Received",
        body: `£${amountPounds.toFixed(2)} received via GoCardless`,
        tag: `ibp-confirmed-${paymentId}`,
        dataType: PushDataType.PAYMENT_RECEIVED,
        extra: { paymentId, pupilId: intent.pupil_id, amount: amountPounds, source: "gocardless_ibp" },
        category: NotifyCategory.PAYMENT,
        importance: NotifyImportance.NORMAL,
      });
    }
  }
}

async function createGoCardlessSubscription(supabase: any, subscription: any) {
  const GOCARDLESS_ACCESS_TOKEN = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
  const GOCARDLESS_ENVIRONMENT = Deno.env.get("GOCARDLESS_ENVIRONMENT") || "sandbox";
  
  if (!GOCARDLESS_ACCESS_TOKEN || !subscription) return;

  const env = (GOCARDLESS_ENVIRONMENT || "").toLowerCase();
  const isLive = env === "live" || env === "production" || env === "prod";
  const baseUrl = isLive
    ? "https://api.gocardless.com"
    : "https://api-sandbox.gocardless.com";

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("price_monthly, name")
    .eq("id", subscription.plan_id)
    .single();

  if (!plan || plan.price_monthly === 0) return;

  const amount = Math.round(plan.price_monthly * 100);

  // Check for first-month-free promo in metadata
  let startDate: string | undefined;
  if (subscription.metadata?.promo === "first-month-free" && subscription.metadata?.subscription_start_date) {
    startDate = subscription.metadata.subscription_start_date;
  }

  try {
    const subscriptionPayload: any = {
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
    };

    if (startDate) {
      subscriptionPayload.subscriptions.start_date = startDate;
    }

    const response = await fetch(`${baseUrl}/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOCARDLESS_ACCESS_TOKEN}`,
        "GoCardless-Version": "2015-07-06",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionPayload),
    });

    if (response.ok) {
      const data = await response.json();
      const gcSubscriptionId = data.subscriptions.id;

      await supabase
        .from("instructor_subscriptions")
        .update({
          gocardless_subscription_id: gcSubscriptionId,
          current_period_start: new Date().toISOString(),
          current_period_end: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString(); })(),
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

async function pushToInstructor(
  instructorId: string,
  payload: {
    title: string;
    body: string;
    tag: string;
    dataType: string;
    extra?: Record<string, unknown>;
    category: NotifyCategory;
    importance: NotifyImportance;
  },
) {
  if (!instructorId) return;
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
      body: JSON.stringify({
        instructorId,
        category: payload.category,
        importance: payload.importance,
        notification: {
          title: payload.title,
          body: payload.body,
          tag: payload.tag,
          data: { type: payload.dataType, ...(payload.extra ?? {}) },
        },
      }),
    });
  } catch (e) {
    console.error("[gocardless-webhook] push fire failed:", e);
  }
}

async function handleMandate(supabase: any, event: any) {
  const mandateId = event.links?.mandate;
  const action = event.action;

  if (action === "cancelled" || action === "failed" || action === "expired") {
    // Resolve affected instructor before updating so we can notify.
    const { data: affectedSub } = await supabase
      .from("instructor_subscriptions")
      .select("instructor_id")
      .eq("gocardless_mandate_id", mandateId)
      .maybeSingle();

    await supabase
      .from("instructor_subscriptions")
      .update({
        status: action === "failed" ? "payment_failed" : "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("gocardless_mandate_id", mandateId);

    await supabase
      .from("pupil_subscriptions")
      .update({ gocardless_mandate_id: null } as any)
      .eq("gocardless_mandate_id", mandateId);

    if (affectedSub?.instructor_id && action === "failed") {
      await pushToInstructor(affectedSub.instructor_id, {
        title: "⚠️ Direct Debit mandate failed",
        body: "Your Direct Debit mandate has failed. Please update your bank details to keep your subscription active.",
        tag: `mandate-failed-${mandateId}`,
        dataType: PushDataType.PAYMENT_FAILED,
        extra: { mandateId, reason: "mandate_failed" },
        category: NotifyCategory.SYSTEM,
        importance: NotifyImportance.IMPORTANT,
      });
    } else if (affectedSub?.instructor_id && (action === "cancelled" || action === "expired")) {
      await pushToInstructor(affectedSub.instructor_id, {
        title: `Direct Debit mandate ${action}`,
        body: `Your Direct Debit mandate was ${action}. Set up a new mandate to continue your subscription.`,
        tag: `mandate-${action}-${mandateId}`,
        dataType: PushDataType.SYSTEM,
        extra: { mandateId, reason: `mandate_${action}` },
        category: NotifyCategory.SYSTEM,
        importance: NotifyImportance.IMPORTANT,
      });
    }

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
    // Find the subscription
    const { data: sub } = await supabase
      .from("instructor_subscriptions")
      .select("id, instructor_id, plan_id")
      .eq("gocardless_subscription_id", subscriptionId)
      .maybeSingle();

    const newPeriodStart = new Date();
    let newPeriodEnd = new Date(newPeriodStart);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1); // default 1 month

    // Record the payment
    let paymentAmount = 0;
    let planName = "Unknown";
    if (sub) {
      try {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("price_monthly, name, billing_interval_months")
          .eq("id", sub.plan_id)
          .single();
        if (plan) {
          paymentAmount = Math.round(plan.price_monthly * 100);
          planName = plan.name;
          const intervalMonths = (plan as any)?.billing_interval_months ?? 1;
          newPeriodEnd = new Date(newPeriodStart);
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + intervalMonths);
        }
      } catch (e) {
        console.error("Error fetching plan:", e);
      }
    }

    // Update subscription period
    await supabase
      .from("instructor_subscriptions")
      .update({
        current_period_end: newPeriodEnd.toISOString(),
        current_period_start: newPeriodStart.toISOString(),
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("gocardless_subscription_id", subscriptionId);

    if (sub) {
      await supabase.from("subscription_payments").insert({
        instructor_id: sub.instructor_id,
        subscription_id: sub.id,
        amount: paymentAmount / 100,
        currency: "GBP",
        status: "confirmed",
        gocardless_payment_id: paymentId,
        payment_date: newPeriodStart.toISOString().split("T")[0],
        period_start: newPeriodStart.toISOString().split("T")[0],
        period_end: newPeriodEnd.toISOString().split("T")[0],
      });

      // Send receipt
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        await fetch(`${supabaseUrl}/functions/v1/send-subscription-receipt`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instructor_id: sub.instructor_id,
            amount: paymentAmount,
            plan_name: planName,
            period_start: newPeriodStart.toISOString(),
            period_end: newPeriodEnd.toISOString(),
            payment_reference: paymentId,
            payment_id: paymentId,
          }),
        });
      } catch (receiptErr) {
        console.error("Failed to send receipt:", receiptErr);
      }
    }

    console.log(`Payment ${paymentId} confirmed, period extended, receipt sent`);

    // Push instructor about successful subscription payment.
    if (sub?.instructor_id) {
      await pushToInstructor(sub.instructor_id, {
        title: "💰 Subscription Payment Received",
        body: `£${(paymentAmount / 100).toFixed(2)} ${planName} payment confirmed.`,
        tag: `sub-payment-${paymentId}`,
        dataType: PushDataType.PAYMENT_RECEIVED,
        extra: { paymentId, subscriptionId, amount: paymentAmount / 100, source: "gocardless_subscription" },
        category: NotifyCategory.PAYMENT,
        importance: NotifyImportance.NORMAL,
      });
    }
  } else if (action === "failed" && subscriptionId) {
    // Find the subscription
    const { data: sub } = await supabase
      .from("instructor_subscriptions")
      .select("id, instructor_id, plan_id")
      .eq("gocardless_subscription_id", subscriptionId)
      .maybeSingle();

    await supabase
      .from("instructor_subscriptions")
      .update({
        status: "payment_failed",
        updated_at: new Date().toISOString(),
      })
      .eq("gocardless_subscription_id", subscriptionId);

    // Record failed payment
    if (sub) {
      let paymentAmount = 0;
      try {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("price_monthly")
          .eq("id", sub.plan_id)
          .single();
        if (plan) paymentAmount = plan.price_monthly;
      } catch (e) { /* ignore */ }

      await supabase.from("subscription_payments").insert({
        instructor_id: sub.instructor_id,
        subscription_id: sub.id,
        amount: paymentAmount,
        currency: "GBP",
        status: "failed",
        gocardless_payment_id: paymentId,
        payment_date: new Date().toISOString().split("T")[0],
      });

      // Create admin alert
      await supabase.from("admin_alerts").insert({
        alert_type: "payment_failed",
        instructor_id: sub.instructor_id,
        subscription_id: sub.id,
        message: `Subscription payment failed (GoCardless: ${paymentId})`,
        metadata: { gocardless_payment_id: paymentId, plan_id: sub.plan_id },
      });

      // Notify admin via SMS
      const ADMIN_PHONE = Deno.env.get("ADMIN_PHONE_NUMBER");
      if (ADMIN_PHONE) {
        try {
          await supabase.functions.invoke("send-sms", {
            body: {
              to: ADMIN_PHONE,
              message: `[EveryDriver] Payment failed for instructor ${sub.instructor_id.slice(0, 8)}. Check admin alerts.`,
            },
          });
        } catch (smsErr) {
          console.error("Failed to send admin SMS:", smsErr);
        }
      }

      // Push the affected instructor as well — admin SMS alone wasn't reaching them.
      await pushToInstructor(sub.instructor_id, {
        title: "⚠️ Subscription Payment Failed",
        body: "Your subscription payment didn't go through. Please check your bank details — we'll retry automatically.",
        tag: `sub-payment-failed-${paymentId}`,
        dataType: PushDataType.PAYMENT_FAILED,
        extra: { paymentId, subscriptionId, source: "gocardless_subscription" },
        category: NotifyCategory.SYSTEM,
        importance: NotifyImportance.IMPORTANT,
      });
    }

    console.log(`Payment ${paymentId} failed, alert created`);
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

      if (intent.instructor_id && intent.pupil_id) {
        const amountPounds = Number(intent.amount ?? 0) / 100;
        await supabase.from("payment_history").insert({
          pupil_id: intent.pupil_id,
          instructor_id: intent.instructor_id,
          amount: amountPounds,
          payment_method: "GoCardless",
          payment_type: "lesson_payment",
          payout_status: "pending",
          notes: `GoCardless payment — ${paymentId}`,
        });
      }

      console.log(`Standalone payment ${paymentId} confirmed`);

      // Resolve instructor from the intent and push.
      const instructorIdFromIntent: string | null =
        (intent as any).instructor_id ?? null;
      const pupilIdFromIntent: string | null =
        (intent as any).pupil_id ?? null;
      const amountPounds: number = Number((intent as any).amount ?? 0) / 100;
      if (instructorIdFromIntent) {
        await pushToInstructor(instructorIdFromIntent, {
          title: "💰 Payment Received",
          body: `£${amountPounds.toFixed(2)} received via GoCardless (Instant Bank Pay)`,
          tag: `ibp-confirmed-${paymentId}`,
          dataType: PushDataType.PAYMENT_RECEIVED,
          extra: { paymentId, pupilId: pupilIdFromIntent, amount: amountPounds, source: "gocardless_ibp" },
          category: NotifyCategory.PAYMENT,
          importance: NotifyImportance.NORMAL,
        });
      }
      // Notify pupil that their payment confirmed.
      if (pupilIdFromIntent) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          await fetch(`${supabaseUrl}/functions/v1/notify-pupil`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({
              pupilId: pupilIdFromIntent,
              type: PupilNotifyType.PAYMENT_CONFIRMED,
              data: { type: PushDataType.PAYMENT_CONFIRMED, amount: amountPounds, method: "GoCardless" },
            }),
          });
        } catch (e) {
          console.error("[gocardless-webhook] pupil notify failed:", e);
        }
      }
    }
  }

  // Handle standalone payment failures (Instant Bank Pay failures).
  if (action === "failed") {
    const { data: intent } = await supabase
      .from("payment_intents")
      .select("*")
      .eq("gocardless_payment_id", paymentId)
      .maybeSingle();

    if (intent) {
      await supabase
        .from("payment_intents")
        .update({ status: "failed" })
        .eq("id", intent.id);

      const instructorIdFromIntent: string | null =
        (intent as any).instructor_id ?? null;
      const amountPounds: number = Number((intent as any).amount ?? 0) / 100;
      if (instructorIdFromIntent) {
        await pushToInstructor(instructorIdFromIntent, {
          title: "⚠️ Payment Failed",
          body: `A £${amountPounds.toFixed(2)} GoCardless payment didn't go through.`,
          tag: `ibp-failed-${paymentId}`,
          dataType: PushDataType.PAYMENT_FAILED,
          extra: { paymentId, amount: amountPounds, source: "gocardless_ibp" },
          category: NotifyCategory.SYSTEM,
          importance: NotifyImportance.IMPORTANT,
        });
      }
      console.log(`Standalone payment ${paymentId} failed`);
    }
  }
}
