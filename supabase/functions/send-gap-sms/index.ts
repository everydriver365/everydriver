import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GapSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface SendGapSmsRequest {
  instructorId: string;
  instructorName: string;
  slots: GapSlot[];
  discountType: "percentage" | "fixed" | null;
  discountValue: number | null;
  customMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { instructorId, instructorName, slots, discountType, discountValue, customMessage }: SendGapSmsRequest = await req.json();

    console.log(`Sending gap SMS for instructor ${instructorId}, ${slots.length} slots`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all pupils for this instructor with phone numbers
    const { data: pupils, error: pupilsError } = await supabase
      .from("pupils")
      .select("id, name, phone")
      .eq("instructor_id", instructorId)
      .not("phone", "is", null);

    if (pupilsError) {
      console.error("Error fetching pupils:", pupilsError);
      throw new Error("Failed to fetch pupils");
    }

    if (!pupils || pupils.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No pupils with phone numbers found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format slots for message
    const slotsText = slots.slice(0, 5).map(slot => {
      const date = new Date(slot.date);
      const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
      const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return `${dayName} ${dateStr} ${slot.startTime}-${slot.endTime}`;
    }).join("\n");

    // Build discount text
    let discountText = "";
    if (discountType && discountValue) {
      if (discountType === "percentage") {
        discountText = `\n\n🎉 SPECIAL OFFER: ${discountValue}% OFF if you book now!`;
      } else {
        discountText = `\n\n🎉 SPECIAL OFFER: £${discountValue} OFF if you book now!`;
      }
    }

    // Send SMS to each pupil
    const results = [];
    for (const pupil of pupils) {
      if (!pupil.phone) continue;

      const message = customMessage || 
        `Hi ${pupil.name}! I have some lesson slots available:\n\n${slotsText}${discountText}\n\nReply to book! - ${instructorName}`;

      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: pupil.phone,
            From: twilioPhoneNumber,
            Body: message,
          }),
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log(`SMS sent to ${pupil.name}: ${result.sid}`);
          results.push({ pupilId: pupil.id, name: pupil.name, success: true });
        } else {
          console.error(`Failed to send SMS to ${pupil.name}:`, result);
          results.push({ pupilId: pupil.id, name: pupil.name, success: false, error: result.message });
        }
      } catch (smsError) {
        console.error(`Error sending SMS to ${pupil.name}:`, smsError);
        results.push({ pupilId: pupil.id, name: pupil.name, success: false, error: String(smsError) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`SMS batch complete: ${successCount}/${results.length} sent successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentCount: successCount,
        totalPupils: results.length,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-gap-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
