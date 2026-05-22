import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initVapidKeys, sendPush } from "../_shared/webpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyPupilRequest {
  pupilId: string;
  type:
    | "slot_offer"
    | "slot_offer_cancelled"
    | "lesson_reminder"
    | "lesson_cancelled"
    | "booking_confirmed"
    | "test_booking_confirmed"
    | "payment_confirmed"
    | "waitlist_match"
    | "en_route"
    | "arrived"
    | "running_late"
    | "payment_reminder";
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
        case "slot_offer_cancelled":
          notificationTitle = "Slot offer withdrawn";
          notificationBody = "A lesson slot you were offered has been withdrawn.";
          break;
        case "lesson_reminder":
          notificationTitle = "Lesson Tomorrow";
          notificationBody = "Don't forget your driving lesson tomorrow!";
          break;
        case "lesson_cancelled":
          notificationTitle = "Lesson Cancelled";
          notificationBody = "Your lesson has been cancelled. Check your schedule for details.";
          break;
        case "booking_confirmed":
          notificationTitle = "Lesson Booked ✓";
          notificationBody = "Your driving lesson has been added to your schedule.";
          break;
        case "test_booking_confirmed":
          notificationTitle = "Driving Test Booked ✓";
          notificationBody = "Your driving test has been added to your schedule.";
          break;
        case "payment_confirmed":
          notificationTitle = "Payment Received ✓";
          notificationBody = "Your payment has been processed successfully.";
          break;
        case "waitlist_match":
          notificationTitle = "Waitlist Match Found!";
          notificationBody = "A lesson slot matching your preferences is available.";
          break;
        case "en_route":
          notificationTitle = "Your instructor is on the way! 🚗";
          notificationBody = "Get ready — your driving lesson is about to begin.";
          break;
        case "arrived":
          notificationTitle = "Your instructor has arrived 🚗";
          notificationBody = "Your instructor is outside and ready for your lesson.";
          break;
        case "running_late":
          notificationTitle = "Instructor running late";
          notificationBody = "Your instructor is running a few minutes behind. Updated ETA coming shortly.";
          break;
        case "payment_reminder":
          notificationTitle = "Payment reminder";
          notificationBody = "You have an outstanding balance with your instructor.";
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
    if (vapidPublicKey && vapidPrivateKey) {
      await initVapidKeys(vapidPublicKey, vapidPrivateKey);

      const { data: pushSubs } = await supabase
        .from("pupil_push_subscriptions")
        .select("*")
        .eq("pupil_id", pupilId);

      if (pushSubs && pushSubs.length > 0) {
        const staleIds: string[] = [];

        for (const sub of pushSubs) {
          const result = await sendPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            {
              title: notificationTitle,
              body: notificationBody,
              icon: "/favicon.png",
              badge: "/favicon.png",
              data: data || {},
            }
          );

          if (result.success) {
            results.pushSent = true;
          } else if (result.stale) {
            staleIds.push(sub.id);
          } else {
            results.errors.push(`Push failed: ${result.error}`);
          }
        }

        // Clean up stale subscriptions
        if (staleIds.length > 0) {
          await supabase.from("pupil_push_subscriptions").delete().in("id", staleIds);
        }
      }
    }

    // SMS for important notifications
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (
      twilioAccountSid && twilioAuthToken && twilioPhone && pupil.phone &&
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
        results.errors.push(`SMS failed: ${(smsError as Error).message}`);
      }
    }

    // Native (Despia / OneSignal) push fan-out — runs in parallel with web push.
    // The edge function is a no-op when the pupil has no native binding.
    try {
      const rawUrl = (data as any)?.url as string | undefined;
      const offerId = (data as any)?.offer_id as string | undefined;
      const appBase =
        Deno.env.get("PUPIL_APP_URL") ?? "https://drive365.co.uk";
      let absoluteUrl: string | undefined;
      if (rawUrl) {
        absoluteUrl = rawUrl.startsWith("http")
          ? rawUrl
          : `${appBase}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
      } else if (offerId) {
        absoluteUrl = `${appBase}/?offer_id=${offerId}`;
      }

      const despiaResp = await supabase.functions.invoke("send-despia-push", {
        body: {
          pupil_id: pupilId,
          title: notificationTitle,
          body: notificationBody,
          url: absoluteUrl,
          data: { type, ...(data ?? {}) },
        },
      });
      if (despiaResp.error) {
        results.errors.push(`Despia push failed: ${despiaResp.error.message}`);
      }
    } catch (despiaErr) {
      results.errors.push(`Despia push failed: ${(despiaErr as Error).message}`);
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
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
