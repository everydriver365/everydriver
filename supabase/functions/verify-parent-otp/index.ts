import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+44" + cleaned.substring(1);
  } else if (!cleaned.startsWith("+")) {
    cleaned = "+44" + cleaned;
  }
  return cleaned;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanPhone = cleanPhoneNumber(phone);

    // Look up OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from("parent_otp_codes")
      .select("*")
      .eq("phone", cleanPhone)
      .single();

    if (otpError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "No verification code found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Verification code expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check code
    if (otpRecord.code !== code) {
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as verified
    await supabase
      .from("parent_otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Get children linked to this parent (only those with parent portal enabled)
    const phoneWithoutCountry = cleanPhone.replace(/^\+44/, "0");
    const { data: children, error: childError } = await supabase
      .from("pupils")
      .select("id, name, instructor_id")
      .or(`parent_phone.eq.${cleanPhone},parent_phone.eq.${phoneWithoutCountry}`)
      .neq("parent_portal_enabled", false);

    if (childError) throw childError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: true,
        children: children || []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-parent-otp:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
