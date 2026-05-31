// Public, token-gated quote fetcher used by /quote/:token.
// Returns sanitized quote + instructor branding, and stamps viewed_at.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? (req.method === "POST" ? (await req.json().catch(() => ({}))).token : null);
    if (!token || typeof token !== "string" || token.length < 8) {
      return json({ error: "invalid_token" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: q, error } = await supabase
      .from("quotes")
      .select(
        "id, quote_ref, pupil_name, email, phone, postcode, course_type, package_details, schedule_notes, terms, total_hours, price_pence, deposit_pence, status, valid_until, expires_at, accepted_at, declined_at, viewed_at, instructor_id"
      )
      .eq("token", token)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!q) return json({ error: "not_found" }, 404);

    // Best-effort: mark viewed.
    await supabase.rpc("mark_quote_viewed_by_token", { p_token: token });

    const { data: inst } = await supabase
      .from("instructors")
      .select("id, name, business_name, profile_image_url, brand_colour, phone, email, location_name, home_postcode")
      .eq("id", q.instructor_id)
      .maybeSingle();

    return json({
      quote: q,
      instructor: inst
        ? {
            id: inst.id,
            business_name: inst.business_name ?? inst.name,
            name: inst.name,
            profile_image_url: inst.profile_image_url,
            brand_colour: inst.brand_colour,
            phone: inst.phone,
            email: inst.email,
            location_name: inst.location_name,
          }
        : null,
    }, 200);
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
