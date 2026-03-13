import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initVapidKeys, sendPush } from "../_shared/webpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyParentRequest {
  pupilId: string;
  type: "booking_confirmed" | "payment_received" | "lesson_scheduled" | "lesson_cancelled";
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { pupilId, type, title, body, data }: NotifyParentRequest = await req.json();

    if (!pupilId) {
      return new Response(
        JSON.stringify({ error: "pupilId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get pupil with parent info
    const { data: pupil, error: pupilError } = await supabase
      .from("pupils")
      .select("name, parent_phone, parent_email, parent_name, instructor_id")
      .eq("id", pupilId)
      .single();

    if (pupilError || !pupil) {
      return new Response(
        JSON.stringify({ error: "Pupil not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no parent linked, skip silently
    if (!pupil.parent_phone && !pupil.parent_email) {
      console.log(`No parent linked for pupil ${pupilId}, skipping notification`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "no_parent_linked" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build notification content based on type
    let notificationTitle = title;
    let notificationBody = body;

    if (!notificationTitle || !notificationBody) {
      const childName = pupil.name || "your child";
      switch (type) {
        case "booking_confirmed":
          notificationTitle = "📚 Booking Confirmed";
          notificationBody = `A driving course has been booked for ${childName}. Check the parent portal for details.`;
          break;
        case "payment_received":
          notificationTitle = "💰 Payment Confirmed";
          notificationBody = `A payment has been processed for ${childName}'s driving lessons.`;
          break;
        case "lesson_scheduled":
          notificationTitle = "📅 Lesson Scheduled";
          notificationBody = `A new lesson has been scheduled for ${childName}.`;
          break;
        case "lesson_cancelled":
          notificationTitle = "❌ Lesson Cancelled";
          notificationBody = `A lesson for ${childName} has been cancelled.`;
          break;
        default:
          notificationTitle = "🚗 Update";
          notificationBody = `There's an update regarding ${childName}'s driving lessons.`;
      }
    }

    let pushSent = 0;
    let smsSent = false;

    // 1. Send web push notification to parent (if they have push subscriptions)
    if (pupil.parent_phone && vapidPublicKey && vapidPrivateKey) {
      try {
        await initVapidKeys(vapidPublicKey, vapidPrivateKey);

        const { data: subscriptions } = await supabase
          .from("parent_push_subscriptions")
          .select("*")
          .eq("parent_phone", pupil.parent_phone);

        if (subscriptions && subscriptions.length > 0) {
          const staleIds: string[] = [];

          for (const sub of subscriptions) {
            const result = await sendPush(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              {
                title: notificationTitle!,
                body: notificationBody!,
                tag: `parent-${type}-${Date.now()}`,
                data: { type, pupilId, ...data },
              }
            );
            if (result.success) {
              pushSent++;
            } else if (result.stale) {
              staleIds.push(sub.id);
            }
          }

          if (staleIds.length > 0) {
            await supabase.from("parent_push_subscriptions").delete().in("id", staleIds);
            console.log(`Removed ${staleIds.length} stale parent push subscriptions`);
          }
        }
      } catch (pushError) {
        console.error("Parent push notification error:", pushError);
      }
    }

    // 2. Send SMS to parent (if configured and Twilio available)
    if (pupil.parent_phone) {
      try {
        const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioMessagingSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

        if (twilioSid && twilioAuth && twilioMessagingSid) {
          // Get instructor notification preferences
          const { data: instructor } = await supabase
            .from("instructors")
            .select("notification_preferences")
            .eq("id", pupil.instructor_id)
            .single();

          const prefs = instructor?.notification_preferences as Record<string, unknown> | null;
          const parentSmsEnabled = prefs?.parent_sms !== false; // Default enabled

          if (parentSmsEnabled) {
            const smsBody = `${notificationTitle}\n${notificationBody}`;
            const formData = new URLSearchParams();
            formData.append("MessagingServiceSid", twilioMessagingSid);
            formData.append("To", pupil.parent_phone);
            formData.append("Body", smsBody);

            const smsResponse = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  "Authorization": `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
              }
            );

            if (smsResponse.ok) {
              smsSent = true;
              console.log(`Parent SMS sent to ${pupil.parent_phone}`);
            } else {
              const smsError = await smsResponse.text();
              console.error("Parent SMS failed:", smsError);
            }
          }
        }
      } catch (smsError) {
        console.error("Parent SMS error:", smsError);
      }
    }

    console.log(`Parent notification for pupil ${pupilId}: push=${pushSent}, sms=${smsSent}`);

    return new Response(
      JSON.stringify({ success: true, pushSent, smsSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notify-parent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
