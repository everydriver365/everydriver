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
    | "lesson_rescheduled"
    | "reschedule_declined"
    | "booking_confirmed"
    | "booking_declined"
    | "test_booking_confirmed"
    | "payment_confirmed"
    | "waitlist_match"
    | "en_route"
    | "arrived"
    | "running_late"
    | "payment_reminder"
    | "lesson_completed"
    | "syllabus_category_complete"
    | "test_passed"
    | "message";

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
      .select("name, phone, instructor_id, instructors(app_slug, custom_domain, custom_domain_verified)")
      .eq("id", pupilId)
      .single();

    if (pupilError || !pupil) {
      return new Response(
        JSON.stringify({ error: "Pupil not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const instructorRel = (pupil as any).instructors ?? null;
    const slug: string | null = instructorRel?.app_slug ?? null;
    const customDomain: string | null = instructorRel?.custom_domain ?? null;
    const customDomainVerified: boolean = !!instructorRel?.custom_domain_verified;

    const appBase = Deno.env.get("PUPIL_APP_URL") ?? "https://drive365.co.uk";

    const getPupilBaseUrl = (): string => {
      if (customDomain && customDomainVerified) return `https://${customDomain}`;
      if (slug) return `${appBase}/p/${slug}`;
      return `${appBase}/pupil`;
    };

    const buildDeepLinkUrl = (t: string, baseUrl: string, d: Record<string, unknown>): string => {
      switch (t) {
        case "lesson_completed":
          return `${baseUrl}?prompt=feedback`;
        case "syllabus_category_complete": {
          const cat = (d.category ?? d.categoryName) as string | undefined;
          return cat ? `${baseUrl}?category=${encodeURIComponent(cat)}` : baseUrl;
        }
        case "test_passed":
          return `${baseUrl}?celebrate=pass`;
        case "slot_offer":
        case "slot_offer_cancelled":
          return d.offer_id ? `${baseUrl}?offer_id=${d.offer_id}` : baseUrl;
        case "lesson_reminder":
          return d.lesson_id ? `${baseUrl}?lesson_id=${d.lesson_id}` : baseUrl;
        case "payment_reminder":
          return `${baseUrl}/payments`;
        case "message":
          return `${baseUrl}?section=messages`;
        default:
          return baseUrl;
      }
    };

    const brandedBaseUrl = getPupilBaseUrl();
    const deepLinkUrl = buildDeepLinkUrl(type, brandedBaseUrl, (data ?? {}) as Record<string, unknown>);
    const pushData: Record<string, unknown> = { ...(data ?? {}), type, url: deepLinkUrl };

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
        case "lesson_rescheduled":
          notificationTitle = "Lesson rescheduled";
          notificationBody = "Your instructor confirmed your new lesson time. Check your schedule.";
          break;
        case "reschedule_declined":
          notificationTitle = "Reschedule declined";
          notificationBody = "Your instructor couldn't accommodate the new time. Your original lesson stands.";
          break;
        case "booking_confirmed":
          notificationTitle = "Lesson Booked ✓";
          notificationBody = "Your driving lesson has been added to your schedule.";
          break;
        case "booking_declined":
          notificationTitle = "Lesson request declined";
          notificationBody = "Your instructor couldn't confirm the requested slot. Please pick another time.";
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
        case "lesson_completed": {
          const instructorName = (data as any)?.instructorName as string | undefined;
          notificationTitle = "Lesson complete 🎉";
          notificationBody = instructorName
            ? `How did it go? Rate your lesson with ${instructorName}.`
            : "How did it go? Rate your lesson.";
          break;
        }
        case "syllabus_category_complete": {
          const categoryName = (data as any)?.categoryName as string | undefined;
          notificationTitle = "Category complete! 🏆";
          notificationBody = categoryName
            ? `You've mastered ${categoryName} — great progress!`
            : "You've mastered a new category — great progress!";
          break;
        }
        case "test_passed":
          notificationTitle = "You passed! 🎉";
          notificationBody = "Congratulations — you've passed your driving test! Share the news!";
          break;
        case "message":
          notificationTitle = title ?? "New message";
          notificationBody = body ?? "You have a new message from your instructor.";
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
              data: pushData,
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
      const despiaResp = await supabase.functions.invoke("send-despia-push", {
        body: {
          pupil_id: pupilId,
          title: notificationTitle,
          body: notificationBody,
          url: deepLinkUrl,
          data: pushData,
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
