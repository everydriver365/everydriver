// Refresh a Ryft sub-account's onboarding/payout status for the calling instructor.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    if (!secret) return new Response(JSON.stringify({ error: "Not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: instructorId } = await admin.rpc("get_instructor_id_for_user", { _user_id: claims.claims.sub });
    const { data: instructor } = await admin.from("instructors").select("ryft_account_id").eq("id", instructorId).maybeSingle();
    const accountId = instructor?.ryft_account_id;
    if (!accountId) {
      return new Response(JSON.stringify({ status: "not_started" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const res = await fetch(`${ryftBase(env)}/accounts/${accountId}`, {
      headers: { "Authorization": secret },
    });
    const text = await res.text();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Ryft account lookup failed", details: text }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = JSON.parse(text);
    const verified = data.status === "Verified" || data.verificationStatus === "Verified";
    const payoutsEnabled = !!(data.payoutsEnabled ?? data.capabilities?.payouts === "enabled");

    await admin.from("instructors").update({
      ryft_account_status: data.status || (verified ? "verified" : "pending"),
      ryft_payouts_enabled: payoutsEnabled,
    }).eq("id", instructorId);

    return new Response(JSON.stringify({ status: data.status, payoutsEnabled, verified }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
