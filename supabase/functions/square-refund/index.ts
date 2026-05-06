import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RefundRequest {
  paymentHistoryId: string; // payment_history.id of original Square payment
  amount: number; // pounds, may be partial
  reason?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth – ensure caller is the owning instructor
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Not authenticated" }, 401);
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Not authenticated" }, 401);

    const body: RefundRequest = await req.json();
    const { paymentHistoryId, amount, reason } = body;

    if (!paymentHistoryId || !amount || amount <= 0) {
      return json({ error: "Missing paymentHistoryId or invalid amount" }, 400);
    }

    // Load original payment
    const { data: original, error: origErr } = await supabase
      .from("payment_history")
      .select("id, instructor_id, pupil_id, amount, payment_method, notes, payout_status")
      .eq("id", paymentHistoryId)
      .maybeSingle();

    if (origErr || !original) return json({ error: "Original payment not found" }, 404);

    // Verify caller owns this instructor row
    const { data: instructor } = await supabase
      .from("instructors")
      .select("id, auth_user_id, square_merchant_id, square_access_token_encrypted")
      .eq("id", original.instructor_id)
      .maybeSingle();
    if (!instructor || instructor.auth_user_id !== userData.user.id) {
      return json({ error: "Not authorised" }, 403);
    }

    if (!String(original.payment_method || "").toLowerCase().startsWith("square")) {
      return json({ error: "This payment was not made via Square" }, 400);
    }

    // Extract Square payment id from notes (format: "... ID: <id> ...")
    const match = String(original.notes || "").match(/ID:\s*([A-Za-z0-9_-]+)/);
    const squarePaymentId = match?.[1];
    if (!squarePaymentId) {
      return json({ error: "Could not locate Square payment id on this transaction" }, 400);
    }

    if (amount > Number(original.amount) + 0.001) {
      return json({ error: "Refund exceeds original payment amount" }, 400);
    }

    const platformToken = Deno.env.get("SQUARE_ACCESS_TOKEN")?.trim();
    const environment = Deno.env.get("SQUARE_ENVIRONMENT")?.trim() || "sandbox";
    const env = environment.toLowerCase();
    const isProduction = env === "production" || env === "prod" || env === "live";
    const baseUrl = isProduction
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

    // Use instructor's OAuth token if connected, otherwise platform token
    const accessToken =
      instructor.square_merchant_id && instructor.square_access_token_encrypted
        ? instructor.square_access_token_encrypted
        : platformToken;

    if (!accessToken) {
      return json({ error: "Square not configured" }, 500);
    }

    const idempotencyKey = `refund-${paymentHistoryId}-${Date.now()}`;
    const amountInPence = Math.round(amount * 100);

    const refundRes = await fetch(`${baseUrl}/v2/refunds`, {
      method: "POST",
      headers: {
        "Square-Version": "2024-01-18",
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        payment_id: squarePaymentId,
        amount_money: { amount: amountInPence, currency: "GBP" },
        reason: reason || "Instructor-initiated refund",
      }),
    });

    const text = await refundRes.text();
    if (!refundRes.ok) {
      console.error("[square-refund] API error:", text);
      let userMessage = "Square refund failed";
      try {
        const errData = JSON.parse(text);
        const first = errData?.errors?.[0];
        if (first) userMessage = first.detail || first.code || userMessage;
      } catch { /* ignore */ }
      return json({ error: userMessage }, 400);
    }

    const refundData = JSON.parse(text);
    const refundId = refundData?.refund?.id;
    const status = refundData?.refund?.status; // PENDING / COMPLETED

    // Optimistically record the refund row now (webhook idempotency will skip duplicate)
    const fullRefund = Math.abs(Number(original.amount) - amount) < 0.01;

    const { error: insErr } = await supabase.from("payment_history").insert({
      instructor_id: original.instructor_id,
      pupil_id: original.pupil_id,
      amount: -Math.abs(amount),
      payment_method: "Square Refund",
      payout_status: "refunded",
      notes: `Refund ${refundId} for payment ${squarePaymentId}${fullRefund ? " (full)" : " (partial)"}${reason ? ` — ${reason}` : ""}`,
    });
    if (insErr) console.error("[square-refund] insert err", insErr);

    await supabase.rpc("increment_pupil_balance", {
      p_pupil_id: original.pupil_id,
      p_amount: -Math.abs(amount),
    });

    await supabase
      .from("payment_history")
      .update({ payout_status: fullRefund ? "refunded" : "partially_refunded" })
      .eq("id", original.id);

    return json({ success: true, refundId, status });
  } catch (e) {
    console.error("[square-refund] error:", e);
    return json({ error: (e as Error).message || "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
