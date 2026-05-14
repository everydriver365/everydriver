import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SquarePaymentRequest {
  sourceId: string; // payment token/nonce from Square Web Payments SDK
  amount: number; // in pounds
  orderReference: string;
  customerEmail?: string;
  customerName?: string;
  pupilId?: string;
  instructorId?: string;
  idempotencyKey: string;
  description?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("SQUARE_ACCESS_TOKEN")?.trim();
    const locationId = Deno.env.get("SQUARE_LOCATION_ID")?.trim();
    const environment = Deno.env.get("SQUARE_ENVIRONMENT")?.trim() || "sandbox";

    if (!accessToken || !locationId) {
      console.error("Missing Square credentials");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SquarePaymentRequest = await req.json();
    const { sourceId, amount, orderReference, customerEmail, customerName, pupilId, instructorId, idempotencyKey, description } = body;

    if (!sourceId || !amount || !orderReference || !idempotencyKey) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sourceId, amount, orderReference, idempotencyKey" }),
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
    const env = environment.toLowerCase();
    const isProduction = env === "production" || env === "prod" || env === "live";
    const baseUrl = isProduction
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

    // Check if instructor has connected Square OAuth
    let effectiveAccessToken = accessToken;
    let useInstructorToken = false;
    let appFeeAmountPence = 0;

    if (instructorId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supa = createClient(supabaseUrl, serviceRoleKey);

        const { data: instructor } = await supa
          .from("instructors")
          .select("square_merchant_id, square_access_token_encrypted")
          .eq("id", instructorId)
          .maybeSingle();

        if (instructor?.square_merchant_id && instructor?.square_access_token_encrypted) {
          useInstructorToken = true;
          effectiveAccessToken = instructor.square_access_token_encrypted;
          console.log(`[square-payment] Using instructor's Square OAuth token`);

          // Calculate platform fee from body
          if (body.platformFeePence && body.platformFeePence > 0) {
            appFeeAmountPence = body.platformFeePence;
          }
        }
      } catch (e) {
        console.error("[square-payment] Error checking instructor OAuth:", e);
      }
    }

    // Create payment via Square Payments API
    const payload: Record<string, unknown> = {
      idempotency_key: idempotencyKey,
      source_id: sourceId,
      amount_money: {
        amount: amountInPence,
        currency: "GBP",
      },
      location_id: locationId,
      reference_id: orderReference,
      note: description || `Payment ${orderReference}`,
      autocomplete: true,
    };

    // Add app_fee_money for instructor OAuth payments
    if (useInstructorToken && appFeeAmountPence > 0) {
      payload.app_fee_money = {
        amount: appFeeAmountPence,
        currency: "GBP",
      };
    }

    // Add buyer email if provided
    if (customerEmail) {
      payload.buyer_email_address = customerEmail;
    }

    console.log("[square-payment] Creating payment:", { orderReference, amount, sourceId: sourceId.substring(0, 10) + "..." });

    const response = await fetch(`${baseUrl}/v2/payments`, {
      method: "POST",
      headers: {
        "Square-Version": "2024-01-18",
        "Authorization": `Bearer ${effectiveAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("[square-payment] Square API response status:", response.status);

    if (!response.ok) {
      console.error("[square-payment] Square API error:", responseText);
      
      // Parse Square error for user-friendly message
      let userMessage = "Payment failed";
      try {
        const errData = JSON.parse(responseText);
        const errors = errData?.errors || [];
        const firstError = errors[0];
        if (firstError) {
          const code = firstError.code || "";
          const category = firstError.category || "";
          if (category === "PAYMENT_METHOD_ERROR" || code.includes("DECLINED") || code.includes("CVV") || code.includes("EXPIRATION") || code.includes("INSUFFICIENT_FUNDS")) {
            userMessage = "Payment declined — please check your card details and try again";
          } else if (code === "CARD_EXPIRED") {
            userMessage = "Card expired — please use a different card";
          } else if (code === "INVALID_CARD") {
            userMessage = "Invalid card — please check your card number";
          } else if (code === "CARD_DECLINED_VERIFICATION_REQUIRED") {
            userMessage = "Additional verification required by your bank";
          } else {
            userMessage = firstError.detail || "Payment was declined";
          }
        }
      } catch { /* keep default message */ }
      
      return new Response(
        JSON.stringify({ error: userMessage, declined: true }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(responseText);
    const payment = data.payment;

    if (!payment || payment.status !== "COMPLETED") {
      console.error("[square-payment] Payment not completed:", payment?.status);
      return new Response(
        JSON.stringify({ error: "Payment was not completed", status: payment?.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[square-payment] Payment completed:", payment.id);

    // Record payment in database if pupilId is provided
    if (pupilId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // Atomically increment balance first (most critical)
        const { error: rpcError } = await supabase.rpc("increment_pupil_balance", {
          p_pupil_id: pupilId,
          p_amount: amount,
        });
        if (rpcError) throw rpcError;

        // Record in payment_history
        const payoutStatus = useInstructorToken ? "auto_transferred" : "pending";
        await supabase.from("payment_history").insert({
          pupil_id: pupilId,
          instructor_id: instructorId || null,
          amount,
          payment_method: "Square",
          payout_status: payoutStatus,
          notes: `Square payment ${payment.id} — ${orderReference}${useInstructorToken ? ' (auto-paid via Square)' : ''}`,
        });

        // If auto-transferred, create instructor_payouts record
        if (useInstructorToken && instructorId) {
          await supabase.from("instructor_payouts").insert({
            instructor_id: instructorId,
            amount,
            payment_ids: [],
            notes: `Auto-paid via Square OAuth — ${payment.id}`,
          });
        }

        // Update payment_intents if exists
        await supabase
          .from("payment_intents")
          .update({
            status: "completed",
            gateway_reference: payment.id,
            completed_at: new Date().toISOString(),
          })
          .eq("order_reference", orderReference);

        console.log("[square-payment] Balance updated for pupil:", pupilId);
      } catch (dbError) {
        console.error("[square-payment] DB update error (payment still succeeded):", dbError);
        return new Response(
          JSON.stringify({
            success: true,
            paymentId: payment.id,
            status: payment.status,
            receiptUrl: payment.receipt_url,
            orderReference,
            dbError: "Balance update failed — please contact support",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        status: payment.status,
        receiptUrl: payment.receipt_url,
        orderReference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[square-payment] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Payment processing failed", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
