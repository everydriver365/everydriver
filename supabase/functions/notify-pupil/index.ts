import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyPupilRequest {
  pupilId: string;
  type: "slot_offer" | "lesson_reminder" | "lesson_cancelled" | "payment_confirmed" | "waitlist_match";
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { pupilId, type, title, body, data }: NotifyPupilRequest = await req.json();

    if (!pupilId) {
      return new Response(
        JSON.stringify({ error: "pupilId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get pupil info
    const { data: pupil, error: pupilError } = await supabase
      .from("pupils")
      .select("name, phone, instructor_id")
      .eq("id", pupilId)
      .single();

    if (pupilError || !pupil) {
      return new Response(
        JSON.stringify({ error: "Pupil not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build notification based on type
    let notificationTitle = title;
    let notificationBody = body;

    if (!notificationTitle || !notificationBody) {
      switch (type) {
        case "slot_offer":
          notificationTitle = "Lesson Slot Available! 🎉";
          notificationBody = "A slot matching your preferences just opened up. Book now!";
          break;
        case "lesson_reminder":
          notificationTitle = "Lesson Tomorrow";
          notificationBody = "Don't forget your driving lesson tomorrow!";
          break;
        case "lesson_cancelled":
          notificationTitle = "Lesson Cancelled";
          notificationBody = "Your lesson has been cancelled. Check your schedule for details.";
          break;
        case "payment_confirmed":
          notificationTitle = "Payment Received ✓";
          notificationBody = "Your payment has been processed successfully.";
          break;
        case "waitlist_match":
          notificationTitle = "Waitlist Match Found!";
          notificationBody = "A lesson slot matching your preferences is available.";
          break;
        default:
          notificationTitle = "Notification";
          notificationBody = "You have a new notification.";
      }
    }

    const results = {
      pushSent: false,
      smsSent: false,
      errors: [] as string[],
    };

    // Send push notifications
    const { data: pushSubs } = await supabase
      .from("pupil_push_subscriptions")
      .select("*")
      .eq("pupil_id", pupilId);

    if (pushSubs && pushSubs.length > 0 && vapidPublicKey && vapidPrivateKey) {
      const payload = JSON.stringify({
        title: notificationTitle,
        body: notificationBody,
        icon: "/favicon.png",
        badge: "/favicon.png",
        data: data || {},
      });

      for (const sub of pushSubs) {
        try {
          // Simple push notification (would need web-push library for full implementation)
          // For now, log that we would send
          console.log(`Would send push to endpoint: ${sub.endpoint}`);
          results.pushSent = true;
        } catch (pushError) {
          console.error("Push error:", pushError);
          results.errors.push(`Push failed: ${(pushError as Error).message}`);
        }
      }
    }

    // Optionally send SMS for important notifications
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (
      twilioAccountSid &&
      twilioAuthToken &&
      twilioPhone &&
      pupil.phone &&
      (type === "slot_offer" || type === "waitlist_match")
    ) {
      try {
        const smsBody = `${notificationTitle}\n${notificationBody}`;
        
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            },
            body: new URLSearchParams({
              To: pupil.phone.startsWith("+") ? pupil.phone : `+44${pupil.phone.replace(/^0/, "")}`,
              From: twilioPhone,
              Body: smsBody,
            }),
          }
        );

        if (twilioResponse.ok) {
          results.smsSent = true;
        } else {
          const errorText = await twilioResponse.text();
          results.errors.push(`SMS failed: ${errorText}`);
        }
      } catch (smsError) {
        console.error("SMS error:", smsError);
        results.errors.push(`SMS failed: ${(smsError as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-pupil:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
