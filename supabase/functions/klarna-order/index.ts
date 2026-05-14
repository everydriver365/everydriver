import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KlarnaOrderRequest {
  authorization_token: string;
  order_amount: number;
  order_lines: Array<{
    type: string;
    reference: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    tax_rate: number;
    total_tax_amount: number;
  }>;
  merchant_reference: string;
  purchase_country?: string;
  purchase_currency?: string;
  // NEW — required for proper recording
  instructorId?: string;
  pupilId?: string;
  bookingRef?: string;
  notes?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: KlarnaOrderRequest = await req.json();
    console.log("Creating Klarna order with authorization_token:", data.authorization_token?.substring(0, 20) + "...");

    const username = Deno.env.get("KLARNA_API_USERNAME");
    const password = Deno.env.get("KLARNA_API_PASSWORD");
    const sandboxMode = Deno.env.get("KLARNA_SANDBOX") === "true";

    if (!username || !password) {
      console.error("Missing Klarna credentials");
      return new Response(
        JSON.stringify({ error: "Klarna credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.authorization_token) {
      return new Response(
        JSON.stringify({ error: "Missing authorization_token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = "Basic " + btoa(`${username}:${password}`);
    const currency = data.purchase_currency || "GBP";
    const country = data.purchase_country || "GB";

    const orderPayload = {
      purchase_country: country,
      purchase_currency: currency,
      order_amount: data.order_amount,
      order_tax_amount: 0,
      order_lines: data.order_lines,
      merchant_reference1: data.merchant_reference,
    };

    console.log("Order payload:", JSON.stringify(orderPayload, null, 2));

    const baseUrls = sandboxMode
      ? ["https://api.playground.klarna.com"]
      : ["https://api.klarna.com", "https://api-na.klarna.com", "https://api-oc.klarna.com"];

    let lastError: string | null = null;
    let lastStatus = 0;
    let successResult: { order_id: string; fraud_status?: string; redirect_url?: string } | null = null;

    for (const baseUrl of baseUrls) {
      const endpoint = `${baseUrl}/payments/v1/authorizations/${data.authorization_token}/order`;
      console.log(`Trying Klarna order endpoint: ${endpoint}`);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderPayload),
        });

        const responseText = await response.text();
        console.log(`Response from ${baseUrl}:`, response.status, responseText);
        lastStatus = response.status;

        if (response.ok) {
          successResult = JSON.parse(responseText);
          console.log("Klarna order created successfully:", successResult?.order_id);
          break;
        }

        lastError = `${response.status}: ${responseText}`;
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          break;
        }
      } catch (fetchError) {
        console.error(`Error calling ${baseUrl}:`, fetchError);
        lastError = String(fetchError);
      }
    }

    if (!successResult || !successResult.order_id) {
      let errorMessage = "Failed to capture Klarna order";
      if (lastStatus === 401 || lastStatus === 403) {
        errorMessage = "Klarna authentication failed. Please check credentials.";
      } else if (lastStatus === 404) {
        errorMessage = "Payment authorization expired or invalid. Please try again.";
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: lastError,
          sandbox: sandboxMode,
        }),
        { status: lastStatus || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === Capture succeeded — record to DB ===
    const orderId = successResult.order_id;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (data.instructorId && data.pupilId) {
      try {
        // Idempotency: prefer external_payment_ref, fall back to legacy notes match
        const externalRef = `klarna:${orderId}`;
        const { data: existingByRef } = await supabase
          .from("payment_history")
          .select("id")
          .eq("external_payment_ref", externalRef)
          .maybeSingle();

        const { data: existingLegacy, error: existErr } = existingByRef ? { data: null, error: null } : await supabase
          .from("payment_history")
          .select("id")
          .eq("pupil_id", data.pupilId)
          .ilike("notes", `%klarna_order_id:${orderId}%`)
          .limit(1)
          .maybeSingle();

        if (existErr) {
          console.error("Klarna idempotency check error:", existErr);
        }

        if (existingByRef || existingLegacy) {
          console.log("Klarna order already recorded, skipping insert:", orderId);
        } else {
          const amountGbp = Math.round(data.order_amount) / 100;
          const noteText = `${data.notes ? data.notes + " · " : ""}Klarna ${data.bookingRef || data.merchant_reference} · klarna_order_id:${orderId}`;

          const { error: insErr } = await supabase
            .from("payment_history")
            .insert({
              pupil_id: data.pupilId,
              instructor_id: data.instructorId,
              amount: amountGbp,
              payment_method: "Klarna",
              external_payment_ref: externalRef,
              notes: noteText,
            });

          if (insErr) {
            console.error("Klarna payment_history insert error:", insErr);
          } else {
            // Credit pupil balance atomically via RPC
            const { error: balErr } = await supabase.rpc("increment_pupil_balance", {
              p_pupil_id: data.pupilId,
              p_amount: amountGbp,
            });
            if (balErr) {
              console.error("Klarna increment_pupil_balance error:", balErr);
            } else {
              console.log(`Klarna recorded: £${amountGbp} for pupil ${data.pupilId}`);
            }
          }
        }
      } catch (dbError) {
        console.error("Klarna DB recording error:", dbError);
        // Do not fail the response — money is captured at Klarna; we log the error.
      }
    } else {
      console.warn(
        "Klarna order captured but instructorId/pupilId missing — payment_history NOT recorded.",
        { instructorId: data.instructorId, pupilId: data.pupilId, orderId }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        fraud_status: successResult.fraud_status,
        redirect_url: successResult.redirect_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Klarna order error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
