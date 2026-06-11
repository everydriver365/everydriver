// Create a Ryft sub-account for the calling instructor and return a hosted onboarding link.
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
    if (!secret) {
      return new Response(JSON.stringify({ error: "Not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: instructorId } = await admin.rpc("get_instructor_id_for_user", { _user_id: claims.claims.sub });
    if (!instructorId) {
      return new Response(JSON.stringify({ error: "No instructor record" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: instructor } = await admin
      .from("instructors")
      .select("id, name, email, ryft_account_id")
      .eq("id", instructorId)
      .maybeSingle();
    if (!instructor) {
      return new Response(JSON.stringify({ error: "Instructor not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const base = ryftBase(env);
    let accountId = instructor.ryft_account_id;

    if (!accountId) {
      const createRes = await fetch(`${base}/accounts`, {
        method: "POST",
        headers: { "Authorization": secret, "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: instructor.name,
          email: instructor.email,
          country: "GB",
          entityType: "Individual",
        }),
      });
      const createText = await createRes.text();
      console.log("[ryft-onboard] create", createRes.status, createText.slice(0, 400));
      if (!createRes.ok) {
        return new Response(JSON.stringify({ error: "Ryft account creation failed", details: createText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      accountId = JSON.parse(createText).id;
      await admin.from("instructors").update({ ryft_account_id: accountId, ryft_account_status: "pending" }).eq("id", instructorId);
    }

    const linkRes = await fetch(`${base}/accounts/${accountId}/onboarding-links`, {
      method: "POST",
      headers: { "Authorization": secret, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const linkText = await linkRes.text();
    if (!linkRes.ok) {
      return new Response(JSON.stringify({ error: "Onboarding link failed", details: linkText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const linkData = JSON.parse(linkText);
    const url = linkData.url || linkData.onboardingUrl;
    await admin.from("instructors").update({ ryft_onboarding_url: url }).eq("id", instructorId);

    return new Response(JSON.stringify({ accountId, onboardingUrl: url }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[ryft-onboard] error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
