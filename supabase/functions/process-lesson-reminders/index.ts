import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppTemplate } from "../_shared/whatsapp-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    // Get pending reminders that should be sent now
    const { data: reminders, error: fetchErr } = await supabase
      .from("lesson_reminders")
      .select(`
        *,
        pupils(id, name, phone, email, whatsapp_opt_in),
        instructors(id, name, phone),
        scheduled_lessons(lesson_date, start_time, duration_minutes)
      `)
      .eq("status", "pending")
      .lte("scheduled_for", fifteenMinutesFromNow.toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (fetchErr) {
      console.error("Fetch reminders error:", fetchErr);
      throw fetchErr;
    }

    if (!reminders?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    const hasTwilio = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER;

    for (const reminder of reminders) {
      try {
        const pupil = reminder.pupils as any;
        const lesson = reminder.scheduled_lessons as any;
        const instructor = reminder.instructors as any;

        if (!pupil || !lesson) {
          await supabase.from("lesson_reminders").update({ status: "skipped" }).eq("id", reminder.id);
          continue;
        }

        const lessonTime = lesson.start_time?.slice(0, 5) || "TBC";
        const lessonDate = lesson.lesson_date;

        // 1) Try WhatsApp template first if pupil opted in and we have a phone
        if (pupil.phone && pupil.whatsapp_opt_in && instructor?.id) {
          const templateName = reminder.reminder_type === "24h"
            ? "lesson_reminder_24h"
            : "lesson_reminder_1h";
          const variables = reminder.reminder_type === "24h"
            ? [pupil.name, lessonDate, lessonTime, instructor?.name || "your instructor"]
            : [pupil.name, lessonTime];

          const waResult = await sendWhatsAppTemplate({
            supabase,
            instructorId: instructor.id,
            to: pupil.phone,
            templateName,
            variables,
            pupilId: pupil.id,
          });

          if (waResult.ok) {
            await supabase.from("lesson_reminders").update({
              status: "sent",
              sent_at: new Date().toISOString(),
              channel: "whatsapp",
            }).eq("id", reminder.id);
            sent++;
            continue;
          }
          console.log(`WhatsApp template failed (${waResult.reason}), falling back to SMS for reminder ${reminder.id}`);
        }

        if (reminder.channel === "sms" && hasTwilio && pupil.phone) {
          const message = reminder.reminder_type === "24h"
            ? `Hi ${pupil.name}, reminder: you have a driving lesson tomorrow (${lessonDate}) at ${lessonTime} with ${instructor?.name || "your instructor"}. Reply CANCEL to cancel.`
            : `Hi ${pupil.name}, your driving lesson starts in about 1 hour at ${lessonTime}. See you soon!`;

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
          await fetch(twilioUrl, {
            method: "POST",
            headers: {
              Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: pupil.phone,
              From: TWILIO_PHONE_NUMBER!,
              Body: message,
            }),
          });

          await supabase.from("lesson_reminders").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", reminder.id);
          sent++;
        } else if (reminder.channel === "in_app") {
          // Mark as sent - the frontend will poll for these
          await supabase.from("lesson_reminders").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", reminder.id);
          sent++;
        } else {
          // No delivery channel available, skip
          await supabase.from("lesson_reminders").update({ status: "skipped" }).eq("id", reminder.id);
        }
      } catch (err) {
        console.error(`Reminder ${reminder.id} failed:`, err);
        await supabase.from("lesson_reminders").update({ status: "failed" }).eq("id", reminder.id);
      }
    }

    return new Response(JSON.stringify({ processed: sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Process reminders error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
