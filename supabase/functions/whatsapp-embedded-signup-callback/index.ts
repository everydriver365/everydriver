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

    const { code, waba_id, phone_number_id } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing auth code" }), { status: 400, headers: corsHeaders });
    }

    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
    if (!META_APP_ID || !META_APP_SECRET) {
      return new Response(JSON.stringify({
        error: "Meta app not configured. Add META_APP_ID secret and configure your app for Embedded Signup.",
      }), { status: 503, headers: corsHeaders });
    }

    // Exchange code → access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: "Token exchange failed", details: tokenData }), {
        status: 500, headers: corsHeaders,
      });
    }

    const accessToken: string = tokenData.access_token;

    // Fetch phone number details
    let displayPhone = null, verifiedName = null;
    if (phone_number_id) {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v18.0/${phone_number_id}?fields=display_phone_number,verified_name`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const phoneData = await phoneRes.json();
      if (phoneRes.ok) {
        displayPhone = phoneData.display_phone_number;
        verifiedName = phoneData.verified_name;
      }
    }

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: instructor } = await service
      .from("instructors").select("id").eq("auth_user_id", userId).maybeSingle();
    if (!instructor) {
      return new Response(JSON.stringify({ error: "Instructor not found" }), { status: 404, headers: corsHeaders });
    }

    await service.from("instructor_whatsapp_accounts")
      .upsert({
        instructor_id: instructor.id,
        waba_id,
        phone_number_id,
        display_phone: displayPhone,
        verified_name: verifiedName,
        access_token: accessToken,
        status: "connected",
        connected_at: new Date().toISOString(),
      }, { onConflict: "instructor_id" });

    return new Response(JSON.stringify({
      success: true,
      display_phone: displayPhone,
      verified_name: verifiedName,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
