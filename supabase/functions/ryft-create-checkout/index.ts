// Ryft hosted-checkout creator. Replaces square-checkout for platform-wide card payments.
// API docs: https://developer.ryftpay.com
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  amount: number;                // pounds
  orderReference: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  returnUrl: string;
  cancelUrl?: string;
  instructorId: string;          // required for sub-account routing
  pupilId?: string;
  serviceFeePence?: number;
  platformFeePence?: number;
  reservationId?: string;        // links the checkout to a course_reservations row
}

function ryftBase(env: string): string {
  const e = env.toLowerCase();
  return e === "production" || e === "live" || e === "prod"
    ? "https://api.ryftpay.com/v1"
    : "https://sandbox-api.ryftpay.com/v1";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const secret = Deno.env.get("RYFT_SECRET_KEY")?.trim();
    const env = Deno.env.get("RYFT_ENVIRONMENT")?.trim() || "production";
    if (!secret) {
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Body;
    const { amount, orderReference, customerEmail, customerName, customerPhone, description, returnUrl, cancelUrl, instructorId, pupilId } = body;

    if (!amount || !orderReference || !returnUrl || !instructorId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (amount < 0.5) {
      return new Response(
        JSON.stringify({ error: "Minimum payment amount is £0.50" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up instructor sub-account
    const { data: instructor } = await supabase
      .from("instructors")
      .select("ryft_account_id, ryft_payouts_enabled, name")
      .eq("id", instructorId)
      .maybeSingle();

    if (!instructor?.ryft_account_id || !instructor.ryft_payouts_enabled) {
      return new Response(
        JSON.stringify({
          error: "Instructor has not completed Ryft payout onboarding.",
          userMessage: "This instructor isn't set up to take card payments yet. Please contact them.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const amountPence = Math.round(amount * 100);
    const serviceFeePence = Math.max(0, body.serviceFeePence ?? 0);
    const platformFeePence = Math.max(0, body.platformFeePence ?? 0);
    const platformShare = serviceFeePence + platformFeePence;

    const payload: Record<string, unknown> = {
      amount: amountPence,
      currency: "GBP",
      customerDetails: {
        email: customerEmail || undefined,
        firstName: customerName?.split(" ")[0] || undefined,
        lastName: customerName?.split(" ").slice(1).join(" ") || undefined,
      },
      metadata: {
        orderReference,
        instructorId,
        pupilId: pupilId || "",
        serviceFeePence: String(serviceFeePence),
        platformFeePence: String(platformFeePence),
        reservationId: body.reservationId || "",
      },
      returnUrl,
      // Sub-account split: instructor receives net of platformShare
      splits: platformShare > 0
        ? [{ accountId: instructor.ryft_account_id, amount: amountPence - platformShare }]
        : [{ accountId: instructor.ryft_account_id, amount: amountPence }],
      statementDescriptor: (description || "Driving lesson").slice(0, 22),
    };

    const base = ryftBase(env);
    const response = await fetch(`${base}/payment-sessions`, {
      method: "POST",
      headers: {
        "Authorization": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("[ryft-create-checkout] status", response.status, responseText.slice(0, 500));

    if (!response.ok) {
      let detail = "";
      try { detail = JSON.parse(responseText)?.errors?.[0]?.message || ""; } catch { /* ignore */ }
      return new Response(
        JSON.stringify({
          error: detail || "Ryft rejected the request",
          userMessage: detail || "We couldn't create the payment link. Please try again.",
          status: response.status,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = JSON.parse(responseText);
    const sessionId = data.id;
    const checkoutUrl = data.redirectUrl || data.checkoutUrl || data.hostedPaymentUrl;

    if (!checkoutUrl) {
      return new Response(
        JSON.stringify({ error: "Ryft did not return a checkout URL", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase.from("ryft_payment_intents").insert({
      ryft_payment_session_id: sessionId,
      instructor_id: instructorId,
      pupil_id: pupilId || null,
      amount_pence: amountPence,
      service_fee_pence: serviceFeePence,
      platform_fee_pence: platformFeePence,
      currency: "GBP",
      status: "pending",
      checkout_url: checkoutUrl,
      metadata: { orderReference, reservationId: body.reservationId || null },
    });

    return new Response(
      JSON.stringify({ success: true, checkoutUrl, sessionId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[ryft-create-checkout] error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
