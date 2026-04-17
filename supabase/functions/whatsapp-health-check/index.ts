import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: instructor } = await service
      .from("instructors").select("id").eq("auth_user_id", userId).maybeSingle();

    let token = Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
    let phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    let scope: "global" | "instructor" = "global";

    if (instructor) {
      const { data: acct } = await service
        .from("instructor_whatsapp_accounts")
        .select("access_token, phone_number_id")
        .eq("instructor_id", instructor.id)
        .maybeSingle();
      if (acct?.access_token && acct?.phone_number_id) {
        token = acct.access_token;
        phoneId = acct.phone_number_id;
        scope = "instructor";
      }
    }

    if (!token || !phoneId) {
      return new Response(JSON.stringify({
        connected: false,
        scope,
        error: "WhatsApp not configured",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Hit Meta to verify token + phone number
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    const result = {
      connected: res.ok,
      scope,
      status: res.status,
      phone_number_id: phoneId,
      verified_name: data?.verified_name ?? null,
      display_phone_number: data?.display_phone_number ?? null,
      quality_rating: data?.quality_rating ?? null,
      code_verification_status: data?.code_verification_status ?? null,
      error: res.ok ? null : (data?.error?.message ?? "Unknown error"),
      checked_at: new Date().toISOString(),
    };

    if (instructor && scope === "instructor") {
      await service.from("instructor_whatsapp_accounts")
        .update({
          last_health_check_at: result.checked_at,
          last_health_status: result,
          quality_rating: result.quality_rating,
          verified_name: result.verified_name,
        })
        .eq("instructor_id", instructor.id);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
