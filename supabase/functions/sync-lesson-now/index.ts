// sync-lesson-now: synchronous Google Calendar push for a single lesson.
//
// Used by manual-insert client paths (AddLessonSheet, VoiceQuickAddLessonSheet,
// StepBookNext, CoursePlannerForm). The client inserts the scheduled_lessons
// row, then immediately calls this endpoint. If we return non-2xx the client
// MUST delete the lesson row so the DB never holds a slot that isn't also on
// the instructor's Google Calendar.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { z } from "https://esm.sh/zod@3.25.76";
import { syncLessonNow } from "../_shared/googleCalendarSync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  lessonId: z.string().uuid("Invalid lesson id"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Resolve caller identity from JWT and verify they own the lesson's
    // instructor_id. We use an auth-bound client to read auth.uid() then a
    // service client to do the work.
    const authHeader = req.headers.get("Authorization") ?? "";
    const authedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await authedSupabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { lessonId } = parsed.data;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve caller's instructor id and verify it owns this lesson.
    const { data: instructorRow } = await supabase.rpc("get_instructor_id_for_user", {
      _user_id: userId,
    });
    const callerInstructorId = instructorRow as string | null;
    if (!callerInstructorId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: caller is not an instructor" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: lesson } = await supabase
      .from("scheduled_lessons")
      .select("instructor_id")
      .eq("id", lessonId)
      .maybeSingle();

    if (!lesson) {
      return new Response(
        JSON.stringify({ error: "Lesson not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (lesson.instructor_id !== callerInstructorId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: lesson belongs to another instructor" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const result = await syncLessonNow(supabase, lessonId);
      if (result.ok) {
        return new Response(
          JSON.stringify({ ok: true, eventId: result.eventId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Skipped (benign) — return ok:true with a reason so the client keeps the row.
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: result.reason }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (syncErr) {
      const message = syncErr instanceof Error ? syncErr.message : "Unknown sync error";
      console.error(`sync-lesson-now failed for ${lessonId}:`, message);
      // Mark failed and enqueue retry so cron picks it up — caller should
      // delete the lesson row to release the slot.
      await supabase
        .from("scheduled_lessons")
        .update({ calendar_sync_status: "failed" })
        .eq("id", lessonId);
      return new Response(
        JSON.stringify({ ok: false, error: "CALENDAR_SYNC_FAILED", message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("sync-lesson-now error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
