import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  instructorId: string;
  type: "new_booking" | "cancellation" | "reschedule";
  pupilName: string;
  lessonDate: string;
  lessonTime: string;
  durationMinutes?: number;
  oldDate?: string;
  oldTime?: string;
  chargeApplied?: boolean;
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
        JSON.stringify({ success: false, reason: "Twilio not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: NotifyRequest = await req.json();
    console.log("Notify instructor request:", data);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch instructor details
    const { data: instructor, error: instructorError } = await supabase
      .from("instructors")
      .select("name, phone")
      .eq("id", data.instructorId)
      .single();

    if (instructorError || !instructor) {
      console.error("Error fetching instructor:", instructorError);
      return new Response(
        JSON.stringify({ success: false, reason: "Instructor not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!instructor.phone) {
      console.log("Instructor has no phone number");
      return new Response(
        JSON.stringify({ success: false, reason: "No phone number" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formatTime = (time: string) => {
      const [h, m] = time.slice(0, 5).split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "pm" : "am";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${m}${ampm}`;
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    };

    let message = "";

    switch (data.type) {
      case "new_booking":
        message = `📅 New booking! ${data.pupilName} has booked a ${data.durationMinutes || 60}-min lesson on ${formatDate(data.lessonDate)} at ${formatTime(data.lessonTime)}. Check your schedule for details.`;
        break;

      case "cancellation":
        message = `❌ Cancellation: ${data.pupilName}'s lesson on ${formatDate(data.lessonDate)} at ${formatTime(data.lessonTime)} has been cancelled.${data.chargeApplied ? " Cancellation fee applied." : ""}`;
        break;

      case "reschedule":
        message = `🔄 Reschedule: ${data.pupilName}'s lesson moved from ${formatDate(data.oldDate!)} at ${formatTime(data.oldTime!)} → ${formatDate(data.lessonDate)} at ${formatTime(data.lessonTime)}.`;
        break;

      default:
        message = `📱 Update for ${data.pupilName}'s lesson on ${formatDate(data.lessonDate)}.`;
    }

    // Send SMS
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: instructor.phone,
          From: twilioPhoneNumber,
          Body: message,
        }),
      }
    );

    if (response.ok) {
      console.log(`SMS sent to instructor ${instructor.name}`);
      return new Response(
        JSON.stringify({ success: true, message: "SMS sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errorData = await response.json();
      console.error("Twilio error:", errorData);
      return new Response(
        JSON.stringify({ success: false, reason: errorData.message || "SMS failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in notify-instructor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
