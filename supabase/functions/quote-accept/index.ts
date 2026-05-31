// Public, token-gated quote acceptance. Calls accept_quote_by_token RPC
// then best-effort instructor push notification.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : null;
    if (!token || token.length < 8) return json({ error: "invalid_token" }, 400);

    const meta = typeof body.metadata === "object" && body.metadata
      ? body.metadata
      : {};

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: booking, error } = await supabase.rpc("accept_quote_by_token", {
      p_token: token,
      p_metadata: meta,
    });
    if (error) {
      const msg = error.message || "accept_failed";
      const status = msg.includes("not_found") ? 404
        : msg.includes("expired") ? 410
        : msg.includes("not_acceptable") ? 409
        : 500;
      return json({ error: msg }, status);
    }

    // Best-effort push notification to instructor
    try {
      await supabase.functions.invoke("send-push-notification", {
        body: {
          instructorId: booking.instructor_id,
          notification: {
            title: "Quote accepted",
            body: `${booking.pupil_name} accepted their quote. Tap to schedule lessons.`,
            tag: "quote-accepted",
            data: { type: "quote_accepted", quote_id: booking.quote_id, quote_booking_id: booking.id },
          },
          category: "booking",
          importance: "high",
        },
      });
    } catch (_) { /* swallow */ }

    return json({ ok: true, quote_booking: booking }, 200);
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
