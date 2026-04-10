import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WalletPaymentRequest {
  token: string;
  amount: number;
  pupilId: string;
  instructorId: string;
  customerName?: string;
  customerEmail?: string;
  walletType: "apple" | "google";
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

    const body: WalletPaymentRequest = await req.json();
    const { token, amount, pupilId, instructorId, customerName, customerEmail, walletType } = body;

    if (!token || !amount || !pupilId || !instructorId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount < 0.50) {
      return new Response(
        JSON.stringify({ error: "Minimum payment amount is £0.50" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing wallet payment:", {
      walletType,
      amount,
      pupilId: pupilId.slice(0, 8),
    });

    // Square uses amount in smallest currency unit (pence for GBP)
    const amountInPence = Math.round(amount * 100);
    const ts = Date.now();
    const orderReference = `PUPIL-${pupilId.slice(0, 8)}-${ts}`;
    const idempotencyKey = orderReference;

    const env = environment.toLowerCase();
    const isProduction = env === "production" || env === "prod" || env === "live";
    const baseUrl = isProduction
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

    // Create payment using the token
    const paymentPayload = {
      idempotency_key: idempotencyKey,
      source_id: token,
      amount_money: {
        amount: amountInPence,
        currency: "GBP",
      },
      location_id: locationId,
      reference_id: orderReference,
      note: `Balance payment for ${customerName || "Pupil"}`,
      buyer_email_address: customerEmail || undefined,
    };

    console.log("Square payment payload:", JSON.stringify(paymentPayload, null, 2));

    const response = await fetch(`${baseUrl}/v2/payments`, {
      method: "POST",
      headers: {
        "Square-Version": "2024-01-18",
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentPayload),
    });

    const responseText = await response.text();
    console.log("Square API response status:", response.status);
    console.log("Square API response:", responseText);

    if (!response.ok) {
      console.error("Square API error:", responseText);
      const errorData = JSON.parse(responseText);
      const errorMessage = errorData.errors?.[0]?.detail || "Payment failed";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(responseText);
    
    if (data.payment?.status !== "COMPLETED") {
      console.error("Payment not completed:", data);
      return new Response(
        JSON.stringify({ error: "Payment was not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment successful - update pupil balance
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pupil name for notifications
    const { data: pupil } = await supabase
      .from("pupils")
      .select("name")
      .eq("id", pupilId)
      .single();

    // Atomically increment balance (no race condition)
    const { error: rpcError } = await supabase.rpc("increment_pupil_balance", {
      p_pupil_id: pupilId,
      p_amount: amount,
    });

    if (rpcError) {
      console.error("Failed to update balance via RPC:", rpcError);
    }

    // Record transaction in payment_history
    await supabase.from("payment_history").insert({
      pupil_id: pupilId,
      instructor_id: instructorId,
      amount: amount,
      payment_type: "payment",
      payment_method: walletType === "apple" ? "Apple Pay" : "Google Pay",
      transaction_reference: orderReference,
    });

    console.log(`Pupil balance incremented by ${amount}`);

    // Send payment receipt email
    try {
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          pupilId,
          instructorId,
          amount,
          paymentMethod: walletType === "apple" ? "Apple Pay" : "Google Pay",
          transactionReference: orderReference,
          receiptUrl: data.payment.receipt_url,
        }),
      });
      console.log("Payment receipt email triggered");
    } catch (emailError) {
      console.error("Failed to send receipt email:", emailError);
    }

    // Notify instructor of payment received
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          instructorId,
          notification: {
            title: "💰 Payment Received",
            body: `£${amount.toFixed(2)} received from ${pupil?.name || "a pupil"} via ${walletType === "apple" ? "Apple Pay" : "Google Pay"}`,
            tag: `payment-received-${Date.now()}`,
            data: { type: "payment_received", pupilId, amount },
          },
        }),
      });
      console.log("Instructor payment notification sent");
    } catch (notifyError) {
      console.error("Failed to notify instructor:", notifyError);
    }

    // Notify parent of wallet payment
    try {
      await fetch(`${supabaseUrl}/functions/v1/notify-parent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          pupilId,
          type: "payment_received",
          body: `£${amount.toFixed(2)} payment confirmed for ${pupil?.name || "your child"}'s driving lessons via ${walletType === "apple" ? "Apple Pay" : "Google Pay"}.`,
        }),
      });
    } catch (parentErr) {
      console.error("Parent notification error (non-fatal):", parentErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: data.payment.id,
        receiptUrl: data.payment.receipt_url,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Square wallet payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to process payment", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
