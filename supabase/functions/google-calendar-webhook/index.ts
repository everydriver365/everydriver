// =============================================================================
// google-calendar-webhook/index.ts
// =============================================================================
//
// Receives Google Calendar push notifications (events.watch channel).
// ALWAYS returns 200 (Google retries aggressively on non-2xx).
//
// Headers from Google:
//   X-Goog-Channel-ID, X-Goog-Channel-Token, X-Goog-Resource-ID,
//   X-Goog-Resource-State (sync | exists | not_exists), X-Goog-Resource-URI
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { raiseSyncAlert } from "../_shared/raiseSyncAlert.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-channel-token, x-goog-resource-id, x-goog-resource-state, x-goog-resource-uri, x-goog-message-number",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const channelId = req.headers.get("x-goog-channel-id");
    const channelToken = req.headers.get("x-goog-channel-token");
    const resourceState = req.headers.get("x-goog-resource-state");

    if (!channelId) return ok();

    // Look up the connection by channel id
    const { data: conn } = await supabase
      .from("instructor_google_service_calendar")
      .select("instructor_id, calendar_id, webhook_channel_token, last_sync")
      .eq("webhook_channel_id", channelId)
      .maybeSingle();

    if (!conn) {
      console.warn("[gcal-webhook] unknown channel", channelId);
      return ok();
    }

    // Verify token
    if (!channelToken || channelToken !== conn.webhook_channel_token) {
      void raiseSyncAlert({
        category: "webhook", severity: "critical",
        title: "Webhook token mismatch",
        message: `Channel ${channelId} provided a bad token. Possible spoofing or stale channel.`,
        instructorId: conn.instructor_id,
        metadata: { channelId },
        supabase,
      });
      return ok();
    }

    // "sync" message arrives once at channel creation. Acknowledge only.
    if (resourceState === "sync") return ok();

    // Trigger pull-side sync (the existing external-event sync handles the heavy lifting).
    // We invoke fetchExternalEvents async so this webhook returns fast.
    void (async () => {
      try {
        await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-service`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              action: "fetchExternalEvents",
              instructorId: conn.instructor_id,
            }),
          },
        );

        // Reconcile lessons: any scheduled_lesson with google_event_id where the
        // matching external event is gone → mark cancelled.
        await reconcileLessons(supabase, conn.instructor_id);
      } catch (e) {
        console.error("[gcal-webhook] async sync failed:", e);
        void raiseSyncAlert({
          category: "webhook", severity: "high",
          title: "Webhook-triggered sync failed",
          message: String(e),
          instructorId: conn.instructor_id,
          supabase,
        });
      }
    })();

    return ok();
  } catch (err) {
    console.error("[gcal-webhook] fatal:", err);
    // Still 200 to Google.
    return ok();
  }
});

async function reconcileLessons(supabase: any, instructorId: string) {
  // Pull all future lessons with a google_event_id
  const { data: lessons } = await supabase
    .from("scheduled_lessons")
    .select("id, google_event_id, lesson_date, start_time, status")
    .eq("instructor_id", instructorId)
    .not("google_event_id", "is", null)
    .neq("status", "cancelled")
    .is("deleted_at", null)
    .gte("lesson_date", new Date().toISOString().slice(0, 10));

  if (!lessons?.length) return;

  // Pull external event IDs we currently know about
  const { data: externals } = await supabase
    .from("instructor_calendar_events")
    .select("external_event_id")
    .eq("instructor_id", instructorId);

  const externalIds = new Set((externals ?? []).map((r: any) => r.external_event_id));

  // Any lesson whose google_event_id is no longer present externally AND
  // whose external_event_id appears nowhere → assume deleted in Google.
  // Note: instructor_calendar_events is the inbound mirror, so a missing id
  // after a fresh fetch is a strong signal.
  for (const l of lessons) {
    if (!externalIds.has(l.google_event_id)) {
      await supabase.from("scheduled_lessons")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: "google_calendar",
          cancellation_reason: "Deleted in Google Calendar",
        })
        .eq("id", l.id);

      // Notify pupil + instructor (best-effort)
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-pupil`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ event: "LESSON_CANCELLED", lessonId: l.id, source: "google_calendar" }),
        });
      } catch { /* non-fatal */ }
    }
  }
}

function ok(): Response {
  return new Response("ok", { status: 200, headers: CORS });
}
