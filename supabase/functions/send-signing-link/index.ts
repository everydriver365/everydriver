import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSigningLinkRequest {
  instructorId: string;
  pupilId: string;
  termsId: string;
  instructorName: string;
  // Optional: override the SMS recipient (e.g. parent_phone for under-18 co-signature)
  recipientPhone?: string | null;
  recipientName?: string | null;
  // Optional: mark the resulting agreement as requiring parent signature
  requiresParentSignature?: boolean;
}

function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const siteUrl = Deno.env.get("SITE_URL") || "https://everydriver.co.uk";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data: SendSigningLinkRequest = await req.json();

    console.log("Send signing link request:", data);

    // Fetch pupil details
    const { data: pupil, error: pupilError } = await supabase
      .from("pupils")
      .select("name, phone, date_of_birth, parent_name")
      .eq("id", data.pupilId)
      .single();

    if (pupilError) {
      console.error("Error fetching pupil:", pupilError);
      throw new Error("Pupil not found");
    }

    // Determine recipient: explicit override (e.g. parent) or pupil phone
    const recipientPhone = (data.recipientPhone && data.recipientPhone.trim()) || pupil.phone;
    const recipientName = (data.recipientName && data.recipientName.trim()) || pupil.name;

    if (!recipientPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "No phone number available for recipient" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique token
    const token = generateToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days

    // Create token record
    const { data: tokenData, error: tokenError } = await supabase
      .from("remote_signing_tokens")
      .insert({
        token,
        instructor_id: data.instructorId,
        pupil_id: data.pupilId,
        terms_id: data.termsId,
        expires_at: expiresAt.toISOString(),
        sms_sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      throw new Error("Failed to create signing token");
    }

    const signingLink = `${siteUrl}/sign/${token}${data.requiresParentSignature ? "?parent=1" : ""}`;
    const greetingName = recipientName || "there";
    const subject = data.requiresParentSignature
      ? `please co-sign the Terms & Conditions for ${pupil.name}`
      : `please review and sign the Terms & Conditions`;
    const message = `Hi ${greetingName}, ${subject} from ${data.instructorName}. Click here: ${signingLink}\n\nThis link expires in 7 days.`;

    console.log(`Sending signing link to ${greetingName} at ${recipientPhone}`);

    // Check if Twilio is configured
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log("Twilio not configured - returning link only");
      return new Response(
        JSON.stringify({
          success: true,
          smsSent: false,
          reason: "Twilio not configured",
          signingLink,
          token: tokenData.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send SMS via Twilio
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: recipientPhone,
          From: twilioPhoneNumber,
          Body: message,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log("SMS sent successfully:", result.sid);
      return new Response(
        JSON.stringify({
          success: true,
          smsSent: true,
          signingLink,
          token: tokenData.id,
          sid: result.sid,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error("Twilio error:", result);
      return new Response(
        JSON.stringify({
          success: true,
          smsSent: false,
          signingLink,
          token: tokenData.id,
          error: result.message,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-signing-link:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
