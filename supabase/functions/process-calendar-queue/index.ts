import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppTemplate } from "../_shared/whatsapp-template.ts";
import {
  generateJWT,
  getAccessToken,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
} from "../_shared/googleCalendarSync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QueueItem {
  id: string;
  instructor_id: string;
  lesson_id: string;
  action: string;
}

interface LessonData {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_type: string;
  pickup_location?: string;
  pickup_postcode?: string;
  notes?: string;
  google_event_id?: string;
  status?: string;
  pupils?: { name: string; postcode?: string } | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!serviceEmail || !privateKey) {
      return new Response(
        JSON.stringify({ error: "Google service account not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get unprocessed queue items (limit to 10 per run)
    const { data: queueItems, error: queueError } = await supabase
      .from("calendar_sync_queue")
      .select("*")
      .is("processed_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (queueError) {
      console.error("Error fetching queue:", queueError);
      throw queueError;
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${queueItems.length} calendar sync items`);

    // Deduplicate: group by lesson_id, keep only the latest entry per lesson
    const latestByLesson = new Map<string, QueueItem>();
    const duplicateIds: string[] = [];

    for (const item of queueItems as QueueItem[]) {
      const existing = latestByLesson.get(item.lesson_id);
      if (existing) {
        // Mark the older one as a duplicate
        duplicateIds.push(existing.id);
      }
      latestByLesson.set(item.lesson_id, item);
    }

    // Mark duplicates as processed immediately
    if (duplicateIds.length > 0) {
      console.log(`Marking ${duplicateIds.length} duplicate queue entries as processed`);
      for (const dupId of duplicateIds) {
        await supabase
          .from("calendar_sync_queue")
          .update({ processed_at: new Date().toISOString(), error: "Deduplicated" })
          .eq("id", dupId);
      }
    }

    const deduplicatedItems = Array.from(latestByLesson.values());
    console.log(`Processing ${deduplicatedItems.length} unique lessons (deduplicated from ${queueItems.length})`);

    // Get service account access token once for all items
    const jwt = await generateJWT(serviceEmail, privateKey);
    const accessToken = await getAccessToken(jwt);

    let successCount = 0;
    let errorCount = 0;

    for (const item of deduplicatedItems) {
      try {
        // Look up instructor's calendar ID from service account table
        const { data: calendarConfig } = await supabase
          .from("instructor_google_service_calendar")
          .select("calendar_id")
          .eq("instructor_id", item.instructor_id)
          .eq("is_active", true)
          .maybeSingle();

        if (!calendarConfig) {
          await supabase
            .from("calendar_sync_queue")
            .update({ processed_at: new Date().toISOString(), error: "No calendar connected" })
            .eq("id", item.id);
          continue;
        }

        const calendarId = calendarConfig.calendar_id;

        if (item.action === "syncLesson") {
          const { data: lessonRaw } = await supabase
            .from("scheduled_lessons")
            .select(`*, pupils:pupil_id (id, name, phone, postcode, whatsapp_opt_in, whatsapp_confirmed_at)`)
            .eq("id", item.lesson_id)
            .maybeSingle();

          if (!lessonRaw) {
            await supabase
              .from("calendar_sync_queue")
              .update({ processed_at: new Date().toISOString(), error: "Lesson not found" })
              .eq("id", item.id);
            continue;
          }

          const lesson = lessonRaw as LessonData & { awaiting_initial_payment?: boolean };

          // Defer push to Google Calendar until the booking has been paid for.
          // Public-flow bookings start with awaiting_initial_payment = true and
          // get cleared on payment success. We leave the queue row unprocessed
          // so the next run picks it up — unless it's been pending too long.
          if ((lesson as any).awaiting_initial_payment === true) {
            const queuedAt = new Date((item as any).created_at || Date.now());
            const ageMs = Date.now() - queuedAt.getTime();
            const STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
            if (ageMs > STALE_MS) {
              await supabase
                .from("calendar_sync_queue")
                .update({ processed_at: new Date().toISOString(), error: "awaiting payment - timed out" })
                .eq("id", item.id);
            } else {
              console.log(`Skipping lesson ${item.lesson_id} — awaiting initial payment`);
            }
            continue;
          }

          // If lesson is cancelled, delete from Google Calendar instead of syncing
          if (lesson.status === "cancelled" && lesson.google_event_id) {
            try {
              await deleteGoogleEvent(accessToken, calendarId, lesson.google_event_id);
              await supabase
                .from("scheduled_lessons")
                .update({ google_event_id: null })
                .eq("id", item.lesson_id);
              console.log(`Deleted cancelled lesson ${item.lesson_id} from Google Calendar`);
            } catch (delErr) {
              console.error(`Failed to delete cancelled lesson ${item.lesson_id}:`, delErr);
            }
            await supabase
              .from("calendar_sync_queue")
              .update({ processed_at: new Date().toISOString() })
              .eq("id", item.id);
            continue;
          }

          const startDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
          const endDateTime = new Date(startDateTime.getTime() + lesson.duration_minutes * 60000);

          const eventDetails = {
            summary: `Driving Lesson - ${lesson.pupils?.name || "Pupil"}`,
            description: `Lesson Type: ${lesson.lesson_type}\nNotes: ${lesson.notes || "None"}`,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            location: lesson.pickup_location || lesson.pickup_postcode,
          };

          // Idempotency check: re-fetch google_event_id fresh to prevent race conditions
          const { data: freshLesson } = await supabase
            .from("scheduled_lessons")
            .select("google_event_id")
            .eq("id", item.lesson_id)
            .maybeSingle();

          let googleEventId = freshLesson?.google_event_id || lesson.google_event_id;

          if (googleEventId) {
            try {
              await updateGoogleEvent(accessToken, calendarId, googleEventId, eventDetails);
            } catch {
              googleEventId = await createGoogleEvent(accessToken, calendarId, eventDetails);
            }
          } else {
            googleEventId = await createGoogleEvent(accessToken, calendarId, eventDetails);
          }

          await supabase
            .from("scheduled_lessons")
            .update({ google_event_id: googleEventId })
            .eq("id", item.lesson_id);

          // Send WhatsApp lesson confirmation on first sync (new lesson) if pupil opted in
          const isNewLesson = !freshLesson?.google_event_id && !lesson.google_event_id;
          const pupil: any = (lesson as any).pupils;
          if (
            isNewLesson &&
            pupil?.phone &&
            pupil?.whatsapp_opt_in &&
            !pupil?.whatsapp_confirmed_at
          ) {
            try {
              const waResult = await sendWhatsAppTemplate({
                supabase,
                instructorId: item.instructor_id,
                to: pupil.phone,
                templateName: "lesson_confirmation",
                variables: [
                  pupil.name,
                  lesson.lesson_date,
                  lesson.start_time?.slice(0, 5) || "",
                  lesson.pickup_location || lesson.pickup_postcode || "your pickup point",
                ],
                pupilId: pupil.id,
              });
              if (waResult.ok) {
                await supabase
                  .from("pupils")
                  .update({ whatsapp_confirmed_at: new Date().toISOString() })
                  .eq("id", pupil.id);
                console.log(`Sent WhatsApp confirmation for lesson ${item.lesson_id}`);
              } else {
                console.log(`WhatsApp confirmation skipped: ${waResult.reason}`);
              }
            } catch (waErr) {
              console.warn(`WhatsApp confirmation failed for lesson ${item.lesson_id}:`, waErr);
            }
          }

          console.log(`Synced lesson ${item.lesson_id} to Google Calendar`);
        } else if (item.action === "deleteLesson") {
          const { data: lessonRaw } = await supabase
            .from("scheduled_lessons")
            .select("google_event_id")
            .eq("id", item.lesson_id)
            .maybeSingle();

          const lesson = lessonRaw as { google_event_id?: string } | null;

          if (lesson?.google_event_id) {
            try {
              await deleteGoogleEvent(accessToken, calendarId, lesson.google_event_id);
              console.log(`Deleted lesson ${item.lesson_id} from Google Calendar`);
            } catch (err) {
              console.log("Event already deleted:", err);
            }
          }
        }

        await supabase
          .from("calendar_sync_queue")
          .update({ processed_at: new Date().toISOString() })
          .eq("id", item.id);

        successCount++;
      } catch (err) {
        console.error(`Error processing queue item ${item.id}:`, err);
        await supabase
          .from("calendar_sync_queue")
          .update({
            processed_at: new Date().toISOString(),
            error: err instanceof Error ? err.message : "Unknown error",
          })
          .eq("id", item.id);
        errorCount++;
      }
    }

    // Clean up old processed items (older than 7 days)
    await supabase
      .from("calendar_sync_queue")
      .delete()
      .lt("processed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return new Response(
      JSON.stringify({ success: true, processed: successCount, errors: errorCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
