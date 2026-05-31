// Public, token-gated quote decline. Captures optional reason.
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
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null;
    if (!token || token.length < 8) return json({ error: "invalid_token" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: q, error } = await supabase.rpc("decline_quote_by_token", {
      p_token: token,
      p_reason: reason,
    });
    if (error) {
      const msg = error.message || "decline_failed";
      const status = msg.includes("not_found") ? 404
        : msg.includes("not_declinable") ? 409
        : 500;
      return json({ error: msg }, status);
    }

    try {
      await supabase.functions.invoke("send-push-notification", {
        body: {
          instructorId: q.instructor_id,
          notification: {
            title: "Quote declined",
            body: `${q.pupil_name} declined their quote${reason ? `: ${reason.slice(0, 80)}` : ""}.`,
            tag: "quote-declined",
            data: { type: "quote_declined", quote_id: q.id },
          },
          category: "booking",
          importance: "normal",
        },
      });
    } catch (_) { /* swallow */ }

    return json({ ok: true }, 200);
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
