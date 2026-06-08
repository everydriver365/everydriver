import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Lessons stuck in awaiting_initial_payment for longer than this trigger an admin alert.
const STUCK_THRESHOLD_MINUTES = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
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

    // Look up pupil + instructor names in bulk
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

      // 1. admin_alerts row
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

      // 2. instructor notification so they can chase the pupil
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

      // 3. admin email
      if (resendApiKey && adminEmails.length > 0) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "EveryDriver <notifications@resend.dev>",
              to: adminEmails,
              subject: `⚠️ Stuck booking — ${pupilName} (${ageMins}m)`,
              html: `<h2>Booking stuck in awaiting_initial_payment</h2>
<p><strong>Pupil:</strong> ${pupilName}<br/>
<strong>Instructor:</strong> ${instructorName}<br/>
<strong>Lesson start:</strong> ${lesson.start_time}<br/>
<strong>Created:</strong> ${lesson.created_at}<br/>
<strong>Age:</strong> ${ageMins} minutes</p>
<p>Lesson ID: <code>${lesson.id}</code></p>`,
            }),
          });
        } catch (e) {
          console.error("admin email failed", lesson.id, e);
        }
      }

      // 4. mark as alerted so we don't fire again
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
