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

async function getValidAccessToken(supabase: any, instructorId: string): Promise<string | null> {
  const { data: tokenData, error } = await supabase
    .from("instructor_calendar_tokens")
    .select("*")
    .eq("instructor_id", instructorId)
    .maybeSingle();

  if (error || !tokenData) {
    console.log("No calendar tokens found for instructor");
    return null;
  }

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(tokenData.token_expiry);
  const now = new Date(Date.now() + 5 * 60 * 1000);

  if (now >= expiresAt) {
    // Token expired, need to refresh
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.log("Google OAuth not configured");
      return null;
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error("Failed to refresh token:", tokens.error);
      return null;
    }

    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase
      .from("instructor_calendar_tokens")
      .update({
        access_token: tokens.access_token,
        token_expiry: newExpiresAt,
      })
      .eq("instructor_id", instructorId);

    return tokens.access_token;
  }

  return tokenData.access_token;
}

async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: LessonEvent
): Promise<string | null> {
  const startDateTime = `${event.date}T${event.startTime}:00`;
  const endDateTime = `${event.date}T${event.endTime}:00`;

  const calendarEvent = {
    summary: `🚗 Lesson: ${event.pupilName}`,
    description: `Driving lesson with ${event.pupilName}\nDuration: ${event.duration} minutes\nPickup: ${event.pickupLocation}`,
    location: event.pickupLocation,
    start: {
      dateTime: startDateTime,
      timeZone: "Europe/London",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Europe/London",
    },
    transparency: "opaque", // Shows as "Busy"
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 15 },
      ],
    },
  };

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create calendar event:", errorText);
      return null;
    }

    const createdEvent = await response.json();
    return createdEvent.id;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}

async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok || response.status === 404; // 404 means already deleted
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, instructorId, lessons, lessonId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if instructor has calendar connected
    const { data: tokenData } = await supabase
      .from("instructor_calendar_tokens")
      .select("calendar_id")
      .eq("instructor_id", instructorId)
      .maybeSingle();

    if (!tokenData) {
      // No calendar connected, skip silently
      return new Response(
        JSON.stringify({ success: true, message: "No calendar connected, skipping sync" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getValidAccessToken(supabase, instructorId);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Failed to get valid access token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendarId = tokenData.calendar_id || "primary";

    if (action === "syncLessons") {
      // Sync multiple lessons to calendar
      const results = [];

      for (const lesson of lessons as LessonEvent[]) {
        // Check if already synced
        const { data: existingEvent } = await supabase
          .from("calendar_events")
          .select("google_event_id")
          .eq("lesson_id", lesson.lessonId)
          .maybeSingle();

        if (existingEvent) {
          results.push({ lessonId: lesson.lessonId, status: "already_synced" });
          continue;
        }

        const eventId = await createCalendarEvent(accessToken, calendarId, lesson);

        if (eventId) {
          // Store the event mapping
          await supabase.from("calendar_events").insert({
            instructor_id: instructorId,
            lesson_id: lesson.lessonId,
            google_event_id: eventId,
            event_type: "lesson",
          });

          results.push({ lessonId: lesson.lessonId, status: "synced", eventId });
        } else {
          results.push({ lessonId: lesson.lessonId, status: "failed" });
        }
      }

      // Update last sync time
      await supabase
        .from("instructors")
        .update({ last_calendar_sync: new Date().toISOString() })
        .eq("id", instructorId);

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "deleteLesson") {
      // Delete a lesson from calendar
      const { data: eventData } = await supabase
        .from("calendar_events")
        .select("google_event_id")
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (eventData) {
        await deleteCalendarEvent(accessToken, calendarId, eventData.google_event_id);
        await supabase.from("calendar_events").delete().eq("lesson_id", lessonId);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "checkConnection") {
      // Verify calendar connection is working
      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (response.ok) {
          const calendar = await response.json();
          return new Response(
            JSON.stringify({ 
              connected: true, 
              calendarName: calendar.summary,
              calendarId: calendar.id 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ connected: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
