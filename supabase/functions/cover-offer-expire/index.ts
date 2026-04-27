/**
 * cover-offer-expire — cron job (every 5 minutes)
 * Marks open offers as 'expired' once expires_at has passed.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = { "Access-Control-Allow-Origin": "*" };

Deno.serve(async (_req) => {
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await admin
      .from("cover_offers")
      .update({ status: "expired" })
      .lt("expires_at", new Date().toISOString())
      .eq("status", "open")
      .select("id");
    if (error) throw error;
    return new Response(JSON.stringify({ expired: data?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
