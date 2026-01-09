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

interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
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

    let smsMessage = "";
    let pushNotification: PushNotification = { title: "", body: "" };

    switch (data.type) {
      case "new_booking":
        smsMessage = `📅 New booking! ${data.pupilName} has booked a ${data.durationMinutes || 60}-min lesson on ${formatDate(data.lessonDate)} at ${formatTime(data.lessonTime)}. Check your schedule for details.`;
        pushNotification = {
          title: "📅 New Booking",
          body: `${data.pupilName} booked ${formatDate(data.lessonDate)} at ${formatTime(data.lessonTime)}`,
          tag: "new-booking",
          data: { type: "new_booking", lessonDate: data.lessonDate }
        };
        break;

      case "cancellation":
        smsMessage = `❌ Cancellation: ${data.pupilName}'s lesson on ${formatDate(data.lessonDate)} at ${formatTime(data.lessonTime)} has been cancelled.${data.chargeApplied ? " Cancellation fee applied." : ""}`;
        pushNotification = {
          title: "❌ Lesson Cancelled",
          body: `${data.pupilName}'s lesson on ${formatDate(data.lessonDate)} at ${formatTime(data.lessonTime)} cancelled${data.chargeApplied ? " - fee applied" : ""}`,
          tag: "cancellation",
          data: { type: "cancellation", lessonDate: data.lessonDate }
        };
        break;

      case "reschedule":
        smsMessage = `🔄 Reschedule: ${data.pupilName}'s lesson moved from ${formatDate(data.oldDate!)} at ${formatTime(data.oldTime!)} → ${formatDate(data.lessonDate)} at ${formatTime(data.lessonTime)}.`;
        pushNotification = {
          title: "🔄 Lesson Rescheduled",
          body: `${data.pupilName}: ${formatDate(data.oldDate!)} → ${formatDate(data.lessonDate)} at ${formatTime(data.lessonTime)}`,
          tag: "reschedule",
          data: { type: "reschedule", lessonDate: data.lessonDate, oldDate: data.oldDate }
        };
        break;

      default:
        smsMessage = `📱 Update for ${data.pupilName}'s lesson on ${formatDate(data.lessonDate)}.`;
        pushNotification = {
          title: "📱 Lesson Update",
          body: `Update for ${data.pupilName}'s lesson on ${formatDate(data.lessonDate)}`,
          tag: "update",
          data: { type: "update", lessonDate: data.lessonDate }
        };
    }

    const results = {
      smsSent: false,
      pushSent: false,
      smsError: null as string | null,
      pushError: null as string | null
    };

    // Send Push Notification
    try {
      const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("instructor_id", data.instructorId);

      if (subError) {
        console.error("Error fetching push subscriptions:", subError);
        results.pushError = "Failed to fetch subscriptions";
      } else if (!subscriptions || subscriptions.length === 0) {
        console.log("No push subscriptions found for instructor");
        results.pushError = "No subscriptions";
      } else {
        console.log(`Found ${subscriptions.length} push subscription(s)`);
        
        // Send to all subscriptions
        for (const sub of subscriptions) {
          try {
            const encoder = new TextEncoder();
            const payloadBytes = encoder.encode(JSON.stringify(pushNotification));
            
            const pushResponse = await fetch(sub.endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/octet-stream",
                "Content-Encoding": "aes128gcm",
                "TTL": "86400",
              },
              body: payloadBytes,
            });

            if (pushResponse.ok || pushResponse.status === 201) {
              console.log(`Push notification sent to endpoint: ${sub.endpoint.slice(0, 50)}...`);
              results.pushSent = true;
            } else {
              console.log(`Push failed with status ${pushResponse.status} for endpoint: ${sub.endpoint.slice(0, 50)}...`);
            }
          } catch (pushErr) {
            console.error("Error sending individual push:", pushErr);
          }
        }
      }
    } catch (pushError) {
      console.error("Error in push notification flow:", pushError);
      results.pushError = pushError instanceof Error ? pushError.message : "Unknown error";
    }

    // Send SMS (if Twilio is configured and instructor has phone)
    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber && instructor.phone) {
      try {
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
              Body: smsMessage,
            }),
          }
        );

        if (response.ok) {
          console.log(`SMS sent to instructor ${instructor.name}`);
          results.smsSent = true;
        } else {
          const errorData = await response.json();
          console.error("Twilio error:", errorData);
          results.smsError = errorData.message || "SMS failed";
        }
      } catch (smsError) {
        console.error("Error sending SMS:", smsError);
        results.smsError = smsError instanceof Error ? smsError.message : "Unknown error";
      }
    } else {
      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        console.log("Twilio credentials not configured - skipping SMS");
        results.smsError = "Twilio not configured";
      } else if (!instructor.phone) {
        console.log("Instructor has no phone number - skipping SMS");
        results.smsError = "No phone number";
      }
    }

    const success = results.smsSent || results.pushSent;
    console.log("Notification results:", results);

    return new Response(
      JSON.stringify({ 
        success, 
        smsSent: results.smsSent,
        pushSent: results.pushSent,
        smsError: results.smsError,
        pushError: results.pushError
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-instructor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
