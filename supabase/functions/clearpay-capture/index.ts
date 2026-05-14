import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClearpayConfirmRequest {
  token: string;
  merchantReference?: string;
  // NEW — required for proper recording
  instructorId?: string;
  pupilId?: string;
  amount?: number; // GBP, optional override (capture response is source of truth if omitted)
  notes?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("CLEARPAY_MERCHANT_ID");
    const secretKey = Deno.env.get("CLEARPAY_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!merchantId || !secretKey) {
      console.error("Clearpay credentials not configured");
      return new Response(
        JSON.stringify({ error: "Clearpay not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data: ClearpayConfirmRequest = await req.json();

    console.log("Clearpay capture request:", {
      hasToken: !!data.token,
      merchantReference: data.merchantReference,
      instructorId: data.instructorId,
      pupilId: data.pupilId,
      amount: data.amount,
    });

    if (!data.token) {
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isSandbox = Deno.env.get("CLEARPAY_SANDBOX") === "true";
    const baseUrl = isSandbox
      ? "https://global.api-sandbox.afterpay.com"
      : "https://api.eu.afterpay.com";

    const authHeader = btoa(`${merchantId}:${secretKey}`);

    // === Idempotency: skip if a payment_history row already references this Clearpay token ===
    if (data.pupilId) {
      const { data: existing, error: existErr } = await supabase
        .from("payment_history")
        .select("id")
        .eq("pupil_id", data.pupilId)
        .ilike("notes", `%clearpay_token:${data.token}%`)
        .limit(1)
        .maybeSingle();
      if (existErr) console.error("Clearpay idempotency check error:", existErr);
      if (existing) {
        console.log("Clearpay token already captured & recorded, skipping:", data.token);
        return new Response(
          JSON.stringify({ success: true, alreadyCaptured: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Capture the payment (immediate capture)
    const capturePayload: Record<string, unknown> = {
      token: data.token,
    };
    if (data.merchantReference) capturePayload.merchantReference = data.merchantReference;

    console.log("Capturing Clearpay payment:", capturePayload);

    const response = await fetch(`${baseUrl}/v2/payments/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/json",
        "User-Agent": "EveryDriver/1.0",
      },
      body: JSON.stringify(capturePayload),
    });

    const result = await response.json();
    console.log("Clearpay capture response:", response.status, JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("Clearpay capture error:", result);
      return new Response(
        JSON.stringify({
          error: result.message || "Payment capture failed",
          details: result,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Clearpay payment captured successfully:", result.id);

    // === Record to DB ===
    if (data.instructorId && data.pupilId) {
      try {
        const capturedAmount =
          typeof data.amount === "number" && data.amount > 0
            ? Number(data.amount)
            : parseFloat(result.amount?.amount || "0");

        if (!capturedAmount || capturedAmount <= 0) {
          console.error("Clearpay: captured amount invalid, skipping DB write");
        } else {
          const noteText = `${data.notes ? data.notes + " · " : ""}Clearpay ${data.merchantReference || ""} · clearpay_token:${data.token} · clearpay_payment_id:${result.id}`.trim();

          const { error: insErr } = await supabase
            .from("payment_history")
            .insert({
              pupil_id: data.pupilId,
              instructor_id: data.instructorId,
              amount: capturedAmount,
              payment_method: "Clearpay",
              notes: noteText,
            });

          if (insErr) {
            console.error("Clearpay payment_history insert error:", insErr);
          } else {
            const { error: balErr } = await supabase.rpc("increment_pupil_balance", {
              p_pupil_id: data.pupilId,
              p_amount: capturedAmount,
            });
            if (balErr) {
              console.error("Clearpay increment_pupil_balance error:", balErr);
            } else {
              console.log(`Clearpay recorded: £${capturedAmount} for pupil ${data.pupilId}`);
            }
          }
        }
      } catch (dbError) {
        console.error("Clearpay DB recording error:", dbError);
      }
    } else {
      console.warn("Clearpay captured but instructorId/pupilId missing — payment_history NOT recorded.", {
        instructorId: data.instructorId,
        pupilId: data.pupilId,
        captureId: result.id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: result.id,
        status: result.status,
        amount: result.amount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in clearpay-capture:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
