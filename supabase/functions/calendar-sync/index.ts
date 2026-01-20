import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Refresh access token if expired
async function getValidAccessToken(
  supabase: SupabaseClient,
  instructorId: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; calendarEmail: string } | null> {
  const { data: tokenData, error } = await supabase
    .from("instructor_calendar_tokens")
    .select("access_token, refresh_token, token_expiry, email")
    .eq("instructor_id", instructorId)
    .eq("provider", "google")
    .single();

  if (error || !tokenData) {
    console.log("No token found for instructor:", instructorId);
    return null;
  }

  const typedTokenData = tokenData as TokenData;
  const isExpired = new Date(typedTokenData.token_expiry) < new Date();

  if (isExpired && typedTokenData.refresh_token) {
    console.log("Token expired, refreshing...");
    
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

// Create event in Google Calendar
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
        start: {
          dateTime: event.start,
          timeZone: "Europe/London",
        },
        end: {
          dateTime: event.end,
          timeZone: "Europe/London",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Create event failed:", error);
    throw new Error(`Failed to create event: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Update event in Google Calendar
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
    console.error("Update event failed:", error);
    throw new Error(`Failed to update event: ${error}`);
  }
}

// Delete event from Google Calendar
async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    console.error("Delete event failed:", error);
    throw new Error(`Failed to delete event: ${error}`);
  }
}

// Fetch events from Google Calendar
async function fetchGoogleEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<Array<{
  id: string;
  summary: string;
  start: string;
  end: string;
}>> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Fetch events failed:", error);
    throw new Error(`Failed to fetch events: ${error}`);
  }

  const data = await response.json();
  
  return (data.items || [])
    .filter((item: { start?: { dateTime?: string }; end?: { dateTime?: string } }) => 
      item.start?.dateTime && item.end?.dateTime
    )
    .map((item: { id: string; summary?: string; start: { dateTime: string }; end: { dateTime: string } }) => ({
      id: item.id,
      summary: item.summary || "Busy",
      start: item.start.dateTime,
      end: item.end.dateTime,
    }));
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Google OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { action, instructorId, lessonId, timeMin, timeMax } = await req.json();

    console.log(`Calendar Sync: ${action} for instructor ${instructorId}`);

    // Sync a lesson to Google Calendar
    if (action === "syncLesson") {
      if (!instructorId || !lessonId) {
        return new Response(
          JSON.stringify({ error: "instructorId and lessonId are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenInfo = await getValidAccessToken(supabase, instructorId, clientId, clientSecret);
      if (!tokenInfo) {
        return new Response(
          JSON.stringify({ error: "Not connected to Google Calendar" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch lesson details
      const { data: lessonRaw, error: lessonError } = await supabase
        .from("scheduled_lessons")
        .select(`
          *,
          pupils:pupil_id (name)
        `)
        .eq("id", lessonId)
        .single();

      if (lessonError || !lessonRaw) {
        return new Response(
          JSON.stringify({ error: "Lesson not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const lesson = lessonRaw as LessonData;

      // Build event details
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
        // Update existing event
        try {
          await updateGoogleEvent(tokenInfo.accessToken, tokenInfo.calendarEmail, googleEventId, eventDetails);
        } catch {
          // Event might have been deleted, create new one
          googleEventId = await createGoogleEvent(tokenInfo.accessToken, tokenInfo.calendarEmail, eventDetails);
        }
      } else {
        // Create new event
        googleEventId = await createGoogleEvent(tokenInfo.accessToken, tokenInfo.calendarEmail, eventDetails);
      }

      // Save the Google event ID
      await supabase
        .from("scheduled_lessons")
        .update({ google_event_id: googleEventId })
        .eq("id", lessonId);

      return new Response(
        JSON.stringify({ success: true, googleEventId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete lesson from Google Calendar
    if (action === "deleteLesson") {
      if (!instructorId || !lessonId) {
        return new Response(
          JSON.stringify({ error: "instructorId and lessonId are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenInfo = await getValidAccessToken(supabase, instructorId, clientId, clientSecret);
      if (!tokenInfo) {
        return new Response(
          JSON.stringify({ success: true, message: "Not connected" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch lesson to get Google event ID
      const { data: lessonRaw } = await supabase
        .from("scheduled_lessons")
        .select("google_event_id")
        .eq("id", lessonId)
        .single();

      const lesson = lessonRaw as { google_event_id?: string } | null;

      if (lesson?.google_event_id) {
        try {
          await deleteGoogleEvent(tokenInfo.accessToken, tokenInfo.calendarEmail, lesson.google_event_id);
        } catch (err) {
          console.log("Event already deleted or not found:", err);
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sync all unsynced lessons
    if (action === "syncAllLessons") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: "instructorId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenInfo = await getValidAccessToken(supabase, instructorId, clientId, clientSecret);
      if (!tokenInfo) {
        return new Response(
          JSON.stringify({ error: "Not connected to Google Calendar" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch upcoming lessons without Google event ID
      const today = new Date().toISOString().split("T")[0];
      const { data: lessonsRaw } = await supabase
        .from("scheduled_lessons")
        .select(`*, pupils:pupil_id (name)`)
        .eq("instructor_id", instructorId)
        .is("google_event_id", null)
        .gte("lesson_date", today)
        .eq("status", "scheduled");

      const lessons = (lessonsRaw || []) as LessonData[];

      if (lessons.length === 0) {
        return new Response(
          JSON.stringify({ success: true, synced: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let synced = 0;
      for (const lesson of lessons) {
        try {
          const startDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
          const endDateTime = new Date(startDateTime.getTime() + lesson.duration_minutes * 60000);

          const googleEventId = await createGoogleEvent(
            tokenInfo.accessToken,
            tokenInfo.calendarEmail,
            {
              summary: `Driving Lesson - ${lesson.pupils?.name || "Pupil"}`,
              description: `Lesson Type: ${lesson.lesson_type}\nNotes: ${lesson.notes || "None"}`,
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
              location: lesson.pickup_location || lesson.pickup_postcode,
            }
          );

          await supabase
            .from("scheduled_lessons")
            .update({ google_event_id: googleEventId })
            .eq("id", lesson.id);

          synced++;
        } catch (err) {
          console.error(`Failed to sync lesson ${lesson.id}:`, err);
        }
      }

      return new Response(
        JSON.stringify({ success: true, synced }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Import busy times from Google Calendar
    if (action === "importBusyTimes") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: "instructorId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenInfo = await getValidAccessToken(supabase, instructorId, clientId, clientSecret);
      if (!tokenInfo) {
        return new Response(
          JSON.stringify({ error: "Not connected to Google Calendar" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Default to next 365 days if not specified
      const now = new Date();
      const defaultTimeMin = timeMin || now.toISOString();
      const defaultTimeMax = timeMax || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const events = await fetchGoogleEvents(
        tokenInfo.accessToken,
        tokenInfo.calendarEmail,
        defaultTimeMin,
        defaultTimeMax
      );

      // Clear existing external events for this period
      await supabase
        .from("instructor_calendar_events")
        .delete()
        .eq("instructor_id", instructorId)
        .gte("start_time", defaultTimeMin)
        .lte("end_time", defaultTimeMax);

      // Insert new events
      if (events.length > 0) {
        const eventsToInsert = events.map((event) => ({
          instructor_id: instructorId,
          external_event_id: event.id,
          title: event.summary,
          start_time: event.start,
          end_time: event.end,
          is_busy: true,
          synced_at: new Date().toISOString(),
        }));

        await supabase.from("instructor_calendar_events").insert(eventsToInsert);
      }

      // Update last sync time
      await supabase
        .from("instructor_calendar_tokens")
        .update({ 
          last_external_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("instructor_id", instructorId)
        .eq("provider", "google");

      return new Response(
        JSON.stringify({ success: true, imported: events.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Full bidirectional sync
    if (action === "fullSync") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: "instructorId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenInfo = await getValidAccessToken(supabase, instructorId, clientId, clientSecret);
      if (!tokenInfo) {
        return new Response(
          JSON.stringify({ error: "Not connected to Google Calendar" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Sync all unsynced lessons to Google
      const today = new Date().toISOString().split("T")[0];
      const { data: unsyncedLessonsRaw } = await supabase
        .from("scheduled_lessons")
        .select(`*, pupils:pupil_id (name)`)
        .eq("instructor_id", instructorId)
        .is("google_event_id", null)
        .gte("lesson_date", today)
        .eq("status", "scheduled");

      const unsyncedLessons = (unsyncedLessonsRaw || []) as LessonData[];

      let lessonsSynced = 0;
      for (const lesson of unsyncedLessons) {
        try {
          const startDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
          const endDateTime = new Date(startDateTime.getTime() + lesson.duration_minutes * 60000);

          const googleEventId = await createGoogleEvent(
            tokenInfo.accessToken,
            tokenInfo.calendarEmail,
            {
              summary: `Driving Lesson - ${lesson.pupils?.name || "Pupil"}`,
              description: `Lesson Type: ${lesson.lesson_type}`,
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
              location: lesson.pickup_location || lesson.pickup_postcode,
            }
          );

          await supabase
            .from("scheduled_lessons")
            .update({ google_event_id: googleEventId })
            .eq("id", lesson.id);

          lessonsSynced++;
        } catch (err) {
          console.error(`Failed to sync lesson ${lesson.id}:`, err);
        }
      }

      // 2. Import busy times from Google
      const now = new Date();
      const timeMinDefault = now.toISOString();
      const timeMaxDefault = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const events = await fetchGoogleEvents(
        tokenInfo.accessToken,
        tokenInfo.calendarEmail,
        timeMinDefault,
        timeMaxDefault
      );

      // Clear and re-import
      await supabase
        .from("instructor_calendar_events")
        .delete()
        .eq("instructor_id", instructorId)
        .gte("start_time", timeMinDefault)
        .lte("end_time", timeMaxDefault);

      if (events.length > 0) {
        const eventsToInsert = events.map((event) => ({
          instructor_id: instructorId,
          external_event_id: event.id,
          title: event.summary,
          start_time: event.start,
          end_time: event.end,
          is_busy: true,
          synced_at: new Date().toISOString(),
        }));

        await supabase.from("instructor_calendar_events").insert(eventsToInsert);
      }

      // Update last sync time
      await supabase
        .from("instructor_calendar_tokens")
        .update({ 
          last_external_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("instructor_id", instructorId)
        .eq("provider", "google");

      return new Response(
        JSON.stringify({ 
          success: true, 
          lessonsSynced, 
          busyTimesImported: events.length 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
