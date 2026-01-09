import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  pupilId: string;
  amount: number;
  instructorName: string;
  newBalance: number;
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

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log("Twilio credentials not configured - skipping SMS");
      return new Response(
        JSON.stringify({ success: true, smsSkipped: true, reason: "Twilio not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data: PaymentConfirmationRequest = await req.json();

    console.log("Payment confirmation request:", data);

    // Fetch pupil details
    const { data: pupil, error: pupilError } = await supabase
      .from("pupils")
      .select("name, phone")
      .eq("id", data.pupilId)
      .single();

    if (pupilError) {
      console.error("Error fetching pupil:", pupilError);
      throw pupilError;
    }

    if (!pupil?.phone) {
      console.log("Pupil has no phone number - skipping SMS");
      return new Response(
        JSON.stringify({ success: true, smsSkipped: true, reason: "No phone number" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format the message
    const formattedAmount = `£${data.amount.toFixed(2)}`;
    const formattedBalance = `£${data.newBalance.toFixed(2)}`;
    
    const message = `✅ Payment received! Hi ${pupil.name}, we've received your payment of ${formattedAmount}. Your new account balance is ${formattedBalance}. Thank you! - ${data.instructorName}`;

    console.log(`Sending SMS to ${pupil.name} at ${pupil.phone}`);

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
          To: pupil.phone,
          From: twilioPhoneNumber,
          Body: message,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log("SMS sent successfully:", result.sid);
      return new Response(
        JSON.stringify({ success: true, smsSent: true, sid: result.sid }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error("Twilio error:", result);
      return new Response(
        JSON.stringify({ success: true, smsSent: false, error: result.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-payment-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
