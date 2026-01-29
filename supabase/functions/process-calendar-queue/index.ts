import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

interface TokenData {
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  email?: string;
}

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
  pupils?: { name: string } | null;
}

// deno-lint-ignore no-explicit-any
async function getValidAccessToken(
  supabase: any,
  instructorId: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; calendarEmail: string } | null> {
  const { data: tokenData, error } = await supabase
    .from("instructor_calendar_tokens")
    .select("access_token, refresh_token, token_expiry, email")
    .eq("instructor_id", instructorId)
    .eq("provider", "google")
    .maybeSingle();

  if (error || !tokenData) {
    return null;
  }

  const typedTokenData = tokenData as TokenData;
  const isExpired = new Date(typedTokenData.token_expiry) < new Date();

  if (isExpired && typedTokenData.refresh_token) {
    const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: typedTokenData.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const refreshData = await refreshResponse.json();

    if (refreshData.error) {
      console.error("Token refresh failed:", refreshData);
      return null;
    }

    const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();

    await supabase
      .from("instructor_calendar_tokens")
      .update({
        access_token: refreshData.access_token,
        token_expiry: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("instructor_id", instructorId)
      .eq("provider", "google");

    return { 
      accessToken: refreshData.access_token, 
      calendarEmail: typedTokenData.email || "primary" 
    };
  }

  return { 
    accessToken: typedTokenData.access_token, 
    calendarEmail: typedTokenData.email || "primary" 
  };
}

async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
  }
): Promise<string> {
  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: { dateTime: event.start, timeZone: "Europe/London" },
        end: { dateTime: event.end, timeZone: "Europe/London" },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create event: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

async function updateGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
    location?: string;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  
  if (event.summary) updateData.summary = event.summary;
  if (event.description) updateData.description = event.description;
  if (event.location) updateData.location = event.location;
  if (event.start) {
    updateData.start = { dateTime: event.start, timeZone: "Europe/London" };
  }
  if (event.end) {
    updateData.end = { dateTime: event.end, timeZone: "Europe/London" };
  }

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update event: ${error}`);
  }
}

async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete event: ${error}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Google OAuth not configured" }),
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
      .limit(10);

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

    let successCount = 0;
    let errorCount = 0;

    for (const item of queueItems as QueueItem[]) {
      try {
        const tokenInfo = await getValidAccessToken(supabase, item.instructor_id, clientId, clientSecret);
        
        if (!tokenInfo) {
          // No calendar connected, mark as processed
          await supabase
            .from("calendar_sync_queue")
            .update({ processed_at: new Date().toISOString(), error: "No calendar connected" })
            .eq("id", item.id);
          continue;
        }

        if (item.action === "syncLesson") {
          // Fetch lesson details
          const { data: lessonRaw } = await supabase
            .from("scheduled_lessons")
            .select(`*, pupils:pupil_id (name)`)
            .eq("id", item.lesson_id)
            .maybeSingle();

          if (!lessonRaw) {
            await supabase
              .from("calendar_sync_queue")
              .update({ processed_at: new Date().toISOString(), error: "Lesson not found" })
              .eq("id", item.id);
            continue;
          }

          const lesson = lessonRaw as LessonData;

          const startDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
          const endDateTime = new Date(startDateTime.getTime() + lesson.duration_minutes * 60000);

          const eventDetails = {
            summary: `Driving Lesson - ${lesson.pupils?.name || "Pupil"}`,
            description: `Lesson Type: ${lesson.lesson_type}\nNotes: ${lesson.notes || "None"}`,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            location: lesson.pickup_location || lesson.pickup_postcode,
          };

          let googleEventId = lesson.google_event_id;

          if (googleEventId) {
            try {
              await updateGoogleEvent(tokenInfo.accessToken, tokenInfo.calendarEmail, googleEventId, eventDetails);
            } catch {
              googleEventId = await createGoogleEvent(tokenInfo.accessToken, tokenInfo.calendarEmail, eventDetails);
            }
          } else {
            googleEventId = await createGoogleEvent(tokenInfo.accessToken, tokenInfo.calendarEmail, eventDetails);
          }

          // Save Google event ID
          await supabase
            .from("scheduled_lessons")
            .update({ google_event_id: googleEventId })
            .eq("id", item.lesson_id);

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
              await deleteGoogleEvent(tokenInfo.accessToken, tokenInfo.calendarEmail, lesson.google_event_id);
              console.log(`Deleted lesson ${item.lesson_id} from Google Calendar`);
            } catch (err) {
              console.log("Event already deleted:", err);
            }
          }
        }

        // Mark as processed
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
            error: err instanceof Error ? err.message : "Unknown error" 
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
