// Ryft webhook receiver: verifies HMAC, dedupes, updates pupil balance on approved payments.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ryftsignature",
};

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rawBody = await req.text();
  const signature = req.headers.get("RyftSignature") || req.headers.get("ryftsignature") || "";
  const secret = Deno.env.get("RYFT_WEBHOOK_SECRET")?.trim();
  if (!secret) {
    console.error("[ryft-webhook] missing RYFT_WEBHOOK_SECRET");
    return new Response("server misconfigured", { status: 500 });
  }

  const expected = await hmacHex(secret, rawBody);
  const valid = signature && signature.toLowerCase() === expected.toLowerCase();
  if (!valid) {
    console.warn("[ryft-webhook] invalid signature");
    return new Response("invalid signature", { status: 401 });
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch {
    return new Response("invalid json", { status: 400 });
  }

  const eventId = event.id || event.eventId || `${event.eventType}-${event.data?.id}-${event.createdTimestamp || Date.now()}`;
  const eventType = event.eventType || event.type || "unknown";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Idempotency
  const { data: existing } = await supabase
    .from("ryft_webhook_events")
    .select("id, processed_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing?.processed_at) {
    return new Response("already processed", { status: 200 });
  }

  if (!existing) {
    await supabase.from("ryft_webhook_events").insert({
      event_id: eventId,
      event_type: eventType,
      payload: event,
      signature_valid: true,
    });
  }

  try {
    const session = event.data || event.paymentSession || event;
    const sessionId = session.id;

    if (eventType.includes("PaymentSession.approved") || eventType === "payment.captured" || session.status === "Approved") {
      // Mark intent paid + credit pupil balance
      const { data: intent } = await supabase
        .from("ryft_payment_intents")
        .select("*")
        .eq("ryft_payment_session_id", sessionId)
        .maybeSingle();

      if (intent && intent.status !== "paid") {
        await supabase
          .from("ryft_payment_intents")
          .update({ status: "paid", payment_method: session.paymentMethod?.type || "card" })
          .eq("id", intent.id);

        if (intent.pupil_id) {
          const creditPence = intent.amount_pence - intent.service_fee_pence - intent.platform_fee_pence;
          await supabase.rpc("increment_pupil_balance", {
            p_pupil_id: intent.pupil_id,
            p_amount: creditPence / 100,
          });

          await supabase.from("payment_history").insert({
            pupil_id: intent.pupil_id,
            instructor_id: intent.instructor_id,
            amount: creditPence / 100,
            payment_method: "ryft_card",
            notes: `Ryft payment ${sessionId}`,
            recorded_at: new Date().toISOString(),
          });
        }
      }
    } else if (eventType.includes("PaymentSession.failed") || session.status === "Failed") {
      await supabase
        .from("ryft_payment_intents")
        .update({ status: "failed", last_error: session.lastError?.message || "unknown" })
        .eq("ryft_payment_session_id", sessionId);
    }

    await supabase
      .from("ryft_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", eventId);

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("[ryft-webhook] processing error", e);
    return new Response("processing error", { status: 500 });
  }
});
