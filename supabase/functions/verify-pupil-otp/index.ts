import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clean the phone number
    const cleanPhone = phone.replace(/\D/g, "");

    // Look up the OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from("pupil_otp_codes")
      .select("*")
      .eq("phone", cleanPhone)
      .single();

    if (otpError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "No verification code found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Code expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already verified (prevent replay)
    if (otpRecord.verified) {
      return new Response(
        JSON.stringify({ error: "Code already used. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the code
    if (otpRecord.code !== code) {
      return new Response(
        JSON.stringify({ error: "Invalid code. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as verified
    await supabase
      .from("pupil_otp_codes")
      .update({ verified: true })
      .eq("phone", cleanPhone);

    // Look up the pupil details
    const { data: pupils } = await supabase
      .from("pupils")
      .select(`
        id,
        name,
        instructor:instructors!inner(
          id,
          app_slug,
          pupil_app_enabled
        )
      `)
      .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${cleanPhone.slice(-10)}%`)
      .limit(1);

    if (!pupils || pupils.length === 0) {
      return new Response(
        JSON.stringify({ error: "Pupil not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pupil = pupils[0] as any;
    const instructor = Array.isArray(pupil.instructor) ? pupil.instructor[0] : pupil.instructor;

    return new Response(
      JSON.stringify({ 
        success: true,
        verified: true,
        pupilName: pupil.name,
        instructorSlug: instructor.app_slug,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-pupil-otp:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
