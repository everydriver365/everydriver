import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LessonEvent {
  lessonId: string;
  date: string;
  startTime: string;
  endTime: string;
  pupilName: string;
  pickupLocation: string;
  duration: number;
}

async function getGrantId(supabase: any, instructorId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("instructor_nylas_grants")
    .select("grant_id")
    .eq("instructor_id", instructorId)
    .maybeSingle();

  if (error || !data) {
    console.log("No Nylas grant found for instructor");
    return null;
  }

  return data.grant_id;
}

async function createCalendarEvent(
  nylasApiUri: string,
  nylasApiKey: string,
  grantId: string,
  event: LessonEvent
): Promise<string | null> {
  const startDateTime = new Date(`${event.date}T${event.startTime}:00`);
  const endDateTime = new Date(`${event.date}T${event.endTime}:00`);

  const calendarEvent = {
    title: `🚗 Lesson: ${event.pupilName}`,
    description: `Driving lesson with ${event.pupilName}\nDuration: ${event.duration} minutes\nPickup: ${event.pickupLocation}`,
    location: event.pickupLocation,
    when: {
      start_time: Math.floor(startDateTime.getTime() / 1000),
      end_time: Math.floor(endDateTime.getTime() / 1000),
      start_timezone: "Europe/London",
      end_timezone: "Europe/London",
    },
    busy: true,
    reminders: {
      use_default: false,
      overrides: [
        { reminder_minutes: 60, reminder_method: "popup" },
        { reminder_minutes: 15, reminder_method: "popup" },
      ],
    },
  };

  try {
    const response = await fetch(`${nylasApiUri}/v3/grants/${grantId}/events?calendar_id=primary`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${nylasApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(calendarEvent),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create calendar event:", errorText);
      return null;
    }

    const createdEvent = await response.json();
    return createdEvent.data?.id;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}

async function updateCalendarEvent(
  nylasApiUri: string,
  nylasApiKey: string,
  grantId: string,
  eventId: string,
  event: LessonEvent
): Promise<boolean> {
  const startDateTime = new Date(`${event.date}T${event.startTime}:00`);
  const endDateTime = new Date(`${event.date}T${event.endTime}:00`);

  const calendarEvent = {
    title: `🚗 Lesson: ${event.pupilName}`,
    description: `Driving lesson with ${event.pupilName}\nDuration: ${event.duration} minutes\nPickup: ${event.pickupLocation}`,
    location: event.pickupLocation,
    when: {
      start_time: Math.floor(startDateTime.getTime() / 1000),
      end_time: Math.floor(endDateTime.getTime() / 1000),
      start_timezone: "Europe/London",
      end_timezone: "Europe/London",
    },
    busy: true,
  };

  try {
    const response = await fetch(
      `${nylasApiUri}/v3/grants/${grantId}/events/${eventId}?calendar_id=primary`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${nylasApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to update calendar event:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return false;
  }
}

async function deleteCalendarEvent(
  nylasApiUri: string,
  nylasApiKey: string,
  grantId: string,
  eventId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${nylasApiUri}/v3/grants/${grantId}/events/${eventId}?calendar_id=primary`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${nylasApiKey}`,
        },
      }
    );

    return response.ok || response.status === 404;
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return false;
  }
}

async function fetchExternalEvents(
  supabase: any,
  nylasApiUri: string,
  nylasApiKey: string,
  grantId: string,
  instructorId: string
): Promise<{ synced: number; deleted: number }> {
  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const startTime = Math.floor(now.getTime() / 1000);
  const endTime = Math.floor(oneYearLater.getTime() / 1000);

  console.log(`Fetching free/busy for instructor ${instructorId} from ${now.toISOString()} to ${oneYearLater.toISOString()}`);

  try {
    // Use Nylas Free/Busy API - privacy-first approach
    const response = await fetch(`${nylasApiUri}/v3/grants/${grantId}/calendars/free-busy`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${nylasApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start_time: startTime,
        end_time: endTime,
        emails: [], // Empty means use the grant's email
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch free/busy times:", errorText);
      throw new Error("Failed to fetch free/busy times");
    }

    const data = await response.json();
    const busyPeriods: Array<{ start_time: number; end_time: number }> = [];

    // Extract busy periods from response
    for (const calendar of data.data || []) {
      for (const slot of calendar.time_slots || []) {
        if (slot.status === "busy") {
          busyPeriods.push({
            start_time: slot.start_time,
            end_time: slot.end_time,
          });
        }
      }
    }

    console.log(`Fetched ${busyPeriods.length} busy periods from Nylas`);

    // Get existing external events for this instructor
    const { data: existingExternalEvents } = await supabase
      .from("instructor_calendar_events")
      .select("id, start_time, end_time")
      .eq("instructor_id", instructorId);

    const existingPeriods = new Map<string, string>();
    for (const event of existingExternalEvents || []) {
      const key = `${event.start_time}_${event.end_time}`;
      existingPeriods.set(key, event.id);
    }

    // Track which periods we're seeing in this sync
    const currentPeriodKeys = new Set<string>();

    let syncedCount = 0;

    // Upsert busy periods as blocking events
    for (let i = 0; i < busyPeriods.length; i++) {
      const period = busyPeriods[i];
      const startIso = new Date(period.start_time * 1000).toISOString();
      const endIso = new Date(period.end_time * 1000).toISOString();
      const periodKey = `${startIso}_${endIso}`;
      currentPeriodKeys.add(periodKey);

      // Generate a consistent ID based on the time period
      const syntheticEventId = `freebusy_${instructorId}_${i}_${period.start_time}`;

      const eventData = {
        instructor_id: instructorId,
        external_event_id: syntheticEventId,
        title: "Busy", // FreeBusy API doesn't provide event titles (privacy)
        start_time: startIso,
        end_time: endIso,
        is_busy: true,
        synced_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("instructor_calendar_events")
        .upsert(eventData, {
          onConflict: "instructor_id,external_event_id",
        });

      if (error) {
        console.error("Error upserting busy period:", error);
      } else {
        syncedCount++;
      }
    }

    // Delete stale events that no longer match any busy period
    let deletedCount = 0;
    for (const [key, id] of existingPeriods) {
      if (!currentPeriodKeys.has(key)) {
        await supabase
          .from("instructor_calendar_events")
          .delete()
          .eq("id", id);
        deletedCount++;
      }
    }

    // Update last sync timestamp
    await supabase
      .from("instructor_nylas_grants")
      .update({ last_sync: new Date().toISOString() })
      .eq("instructor_id", instructorId);

    console.log(`Synced ${syncedCount} busy periods, deleted ${deletedCount} stale entries`);

    return { synced: syncedCount, deleted: deletedCount };
  } catch (error) {
    console.error("Error fetching busy times:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, instructorId, lessons, lessonId, lesson } = await req.json();

    const nylasApiKey = Deno.env.get("NYLAS_API_KEY");
    const nylasApiUri = Deno.env.get("NYLAS_API_URI") || "https://api.us.nylas.com";

    if (!nylasApiKey) {
      return new Response(
        JSON.stringify({ error: "Nylas not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get grant ID for this instructor
    const grantId = await getGrantId(supabase, instructorId);

    if (!grantId) {
      // No calendar connected, skip silently
      return new Response(
        JSON.stringify({ success: true, message: "No calendar connected, skipping sync" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "fetchExternalEvents") {
      const result = await fetchExternalEvents(supabase, nylasApiUri, nylasApiKey, grantId, instructorId);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "syncLessons") {
      // Sync multiple lessons to calendar
      const results = [];

      for (const lessonItem of lessons as LessonEvent[]) {
        // Check if already synced
        const { data: existingEvent } = await supabase
          .from("calendar_events")
          .select("google_event_id")
          .eq("lesson_id", lessonItem.lessonId)
          .maybeSingle();

        if (existingEvent) {
          results.push({ lessonId: lessonItem.lessonId, status: "already_synced" });
          continue;
        }

        const eventId = await createCalendarEvent(nylasApiUri, nylasApiKey, grantId, lessonItem);

        if (eventId) {
          // Store the event mapping
          await supabase.from("calendar_events").insert({
            instructor_id: instructorId,
            lesson_id: lessonItem.lessonId,
            google_event_id: eventId, // Keep column name for backward compatibility
            event_type: "lesson",
          });

          results.push({ lessonId: lessonItem.lessonId, status: "synced", eventId });
        } else {
          results.push({ lessonId: lessonItem.lessonId, status: "failed" });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "updateLesson") {
      // Get existing event ID
      const { data: existingEvent } = await supabase
        .from("calendar_events")
        .select("google_event_id")
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (!existingEvent) {
        return new Response(
          JSON.stringify({ success: false, message: "No synced event found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const success = await updateCalendarEvent(
        nylasApiUri,
        nylasApiKey,
        grantId,
        existingEvent.google_event_id,
        lesson
      );

      return new Response(
        JSON.stringify({ success }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "deleteLesson") {
      // Get existing event ID
      const { data: existingEvent } = await supabase
        .from("calendar_events")
        .select("google_event_id")
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (!existingEvent) {
        return new Response(
          JSON.stringify({ success: true, message: "No synced event found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const success = await deleteCalendarEvent(
        nylasApiUri,
        nylasApiKey,
        grantId,
        existingEvent.google_event_id
      );

      if (success) {
        await supabase
          .from("calendar_events")
          .delete()
          .eq("lesson_id", lessonId);
      }

      return new Response(
        JSON.stringify({ success }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
