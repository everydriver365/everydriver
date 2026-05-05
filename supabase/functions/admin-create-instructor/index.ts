// Edge function to create a new instructor user (auth + instructors row)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email, password, home_postcode } = await req.json();
    if (!name || !email) {
      return new Response(JSON.stringify({ error: "name and email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create auth user (auto-confirm so they can sign in immediately)
    const tempPassword = password || crypto.randomUUID().slice(0, 12) + "Aa1!";
    const { data: userData, error: userErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name },
    });
    if (userErr) throw userErr;

    const authUserId = userData.user!.id;

    // Insert instructor row (no demo/mock data)
    const { data: instructor, error: insErr } = await admin
      .from("instructors")
      .insert({
        auth_user_id: authUserId,
        name,
        email,
        home_postcode: home_postcode || "SW1A 1AA",
        radius_miles: 10,
        car_type: "Manual",
        is_active: true,
        buffer_minutes: 10,
        preferred_lesson_length: 60,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return new Response(
      JSON.stringify({
        success: true,
        instructor_id: instructor.id,
        auth_user_id: authUserId,
        email,
        temp_password: tempPassword,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
