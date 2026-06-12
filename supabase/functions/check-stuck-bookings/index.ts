import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STUCK_THRESHOLD_MINUTES = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60_000).toISOString();

    const { data: stuck, error } = await supabase
      .from("scheduled_lessons")
      .select("id, instructor_id, pupil_id, start_time, created_at")
      .eq("awaiting_initial_payment", true)
      .is("deleted_at", null)
      .is("stuck_payment_alerted_at", null)
      .lte("created_at", cutoff)
      .limit(500);

    if (error) throw error;
    if (!stuck || stuck.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pupilIds = [...new Set(stuck.map((l) => l.pupil_id).filter(Boolean))];
    const instructorIds = [...new Set(stuck.map((l) => l.instructor_id).filter(Boolean))];

    const [{ data: pupils }, { data: instructors }, { data: settings }] = await Promise.all([
      pupilIds.length
        ? supabase.from("pupils").select("id, name").in("id", pupilIds)
        : Promise.resolve({ data: [] as any[] }),
      instructorIds.length
        ? supabase.from("instructors").select("id, name").in("id", instructorIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("site_settings").select("admin_notification_emails").limit(1).maybeSingle(),
    ]);

    const pupilMap = new Map((pupils ?? []).map((p: any) => [p.id, p.name]));
    const instructorMap = new Map((instructors ?? []).map((i: any) => [i.id, i.name]));
    const adminEmails: string[] = (settings as any)?.admin_notification_emails ?? [];

    let alerted = 0;
    for (const lesson of stuck) {
      const pupilName = pupilMap.get(lesson.pupil_id) ?? "Unknown pupil";
      const instructorName = instructorMap.get(lesson.instructor_id) ?? "Unknown instructor";
      const ageMins = Math.round(
        (Date.now() - new Date(lesson.created_at).getTime()) / 60_000
      );
      const message = `Booking stuck awaiting initial payment for ${ageMins} mins — ${pupilName} with ${instructorName} (lesson ${lesson.id})`;

      await supabase.from("admin_alerts").insert({
        alert_type: "stuck_initial_payment",
        instructor_id: lesson.instructor_id,
        message,
        metadata: {
          lesson_id: lesson.id,
          pupil_id: lesson.pupil_id,
          start_time: lesson.start_time,
          created_at: lesson.created_at,
          age_minutes: ageMins,
          threshold_minutes: STUCK_THRESHOLD_MINUTES,
        },
      });

      if (lesson.instructor_id) {
        await supabase.from("instructor_notifications").insert({
          instructor_id: lesson.instructor_id,
          title: "Booking awaiting payment",
          message: `${pupilName}'s booking has been waiting ${ageMins} minutes for initial payment.`,
          type: "warning",
          action_url: `/instructor-app/pupils/${lesson.pupil_id ?? ""}`,
          metadata: { lesson_id: lesson.id },
        });
      }

      if (adminEmails.length > 0) {
        try {
          await sendBrandedEmail({
            to: adminEmails,
            subject: `Stuck booking — ${pupilName} (${ageMins}m)`,
            heading: "Booking stuck awaiting initial payment",
            preview: `${pupilName} booking waiting ${ageMins} minutes for payment`,
            intro: `A booking has been waiting ${ageMins} minutes for the initial payment.`,
            details: [
              { label: "Pupil", value: pupilName },
              { label: "Instructor", value: instructorName },
              { label: "Lesson start", value: String(lesson.start_time) },
              { label: "Created", value: String(lesson.created_at) },
              { label: "Age", value: `${ageMins} minutes` },
              { label: "Lesson ID", value: lesson.id },
            ],
            idempotencyKey: `stuck-booking-${lesson.id}`,
          }, supabase);
        } catch (e) {
          console.error("admin email failed", lesson.id, e);
        }
      }

      await supabase
        .from("scheduled_lessons")
        .update({ stuck_payment_alerted_at: new Date().toISOString() })
        .eq("id", lesson.id);

      alerted++;
    }

    return new Response(
      JSON.stringify({ ok: true, processed: alerted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("check-stuck-bookings error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
