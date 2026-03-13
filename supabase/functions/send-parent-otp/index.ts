import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanPhone = cleanPhoneNumber(phone);
    const phoneWithoutCountry = cleanPhone.replace(/^\+44/, "0");

    // Check if this phone is linked to any pupils as parent
    const { data: pupils, error: pupilError } = await supabase
      .from("pupils")
      .select("id, name, parent_portal_enabled")
      .or(`parent_phone.eq.${cleanPhone},parent_phone.eq.${phoneWithoutCountry},parent_phone.ilike.%${phone.replace(/\s+/g, "").slice(-9)}`);

    if (pupilError) throw pupilError;

    if (!pupils || pupils.length === 0) {
      return new Response(
        JSON.stringify({ error: "No children found linked to this phone number" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out pupils who have disabled parent portal access
    const enabledPupils = pupils.filter(p => p.parent_portal_enabled !== false);

    if (enabledPupils.length === 0) {
      return new Response(
        JSON.stringify({ error: "Access has been restricted by the learner" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    const { error: otpError } = await supabase
      .from("parent_otp_codes")
      .upsert({
        phone: cleanPhone,
        code: otp,
        expires_at: expiresAt.toISOString(),
        verified: false,
      }, { onConflict: "phone" });

    if (otpError) throw otpError;

    // Send SMS via Twilio
    if (twilioAccountSid && twilioAuthToken && twilioPhone) {
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          },
          body: new URLSearchParams({
            To: cleanPhone,
            From: twilioPhone,
            Body: `Your Parent Portal verification code is: ${otp}. This code expires in 10 minutes.`,
          }),
        }
      );

      if (!twilioResponse.ok) {
        const errorText = await twilioResponse.text();
        console.error("Twilio error:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to send SMS" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log(`[DEV] Parent OTP for ${cleanPhone}: ${otp}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent",
        childCount: enabledPupils.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-parent-otp:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
