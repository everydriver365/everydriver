// =============================================================================
// reconcile-google-calendar/index.ts
// =============================================================================
// Hourly safety-net. For every active Google calendar connection:
//   1. Refresh the inbound mirror (fetchExternalEvents) so deletions in Google
//      are reflected in instructor_calendar_events.
//   2. Cancel any scheduled_lessons (lookback 7 days) whose google_event_id
//      is gone upstream.
//   3. Delete any future instructor_manual_blocks whose google_event_id is
//      gone upstream.
//
// Covers the case where a push notification was missed (channel rotated,
// transient 5xx, etc.) — without this, a Google-side delete can be stranded
// in the schedule indefinitely.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: connections, error } = await supabase
      .from("instructor_google_service_calendar")
      .select("instructor_id")
      .eq("is_active", true);

    if (error) throw error;

    let lessonsCancelled = 0;
    let blocksDeleted = 0;
    let fetched = 0;
    let failed = 0;

    for (const row of connections ?? []) {
      const instructorId = row.instructor_id;
      try {
        // 1. Refresh inbound mirror
        const res = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-service`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ action: "fetchExternalEvents", instructorId }),
          },
        );
        if (!res.ok) {
          failed++;
          continue;
        }
        fetched++;

        // 2. Pull external mirror once for both reconcile passes
        const { data: externals } = await supabase
          .from("instructor_calendar_events")
          .select("external_event_id")
          .eq("instructor_id", instructorId);
        const externalIds = new Set(
          (externals ?? []).map((r: any) => r.external_event_id),
        );

        // 3. Lessons reconcile (look back 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("id, google_event_id")
          .eq("instructor_id", instructorId)
          .not("google_event_id", "is", null)
          .neq("status", "cancelled")
          .is("deleted_at", null)
          .gte("lesson_date", sevenDaysAgo);

        for (const l of lessons ?? []) {
          if (!externalIds.has(l.google_event_id)) {
            await supabase
              .from("scheduled_lessons")
              .update({
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
                cancelled_by: "google_calendar",
                cancellation_reason: "Deleted in Google Calendar",
                deleted_at: new Date().toISOString(),
              })
              .eq("id", l.id);
            lessonsCancelled++;
          }
        }

        // 4. Manual block reconcile (future only)
        const { data: blocks } = await supabase
          .from("instructor_manual_blocks")
          .select("id, google_event_id")
          .eq("instructor_id", instructorId)
          .not("google_event_id", "is", null)
          .gte("end_datetime", new Date().toISOString());

        const blockIdsToDelete = (blocks ?? [])
          .filter((b: any) => !externalIds.has(b.google_event_id))
          .map((b: any) => b.id);

        if (blockIdsToDelete.length > 0) {
          await supabase
            .from("instructor_manual_blocks")
            .delete()
            .in("id", blockIdsToDelete);
          blocksDeleted += blockIdsToDelete.length;
        }
      } catch (e) {
        console.error(`[reconcile] failed for ${instructorId}:`, e);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        connections: connections?.length ?? 0,
        fetched,
        failed,
        lessonsCancelled,
        blocksDeleted,
      }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("reconcile-google-calendar fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
