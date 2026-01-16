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

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  transparency?: string;
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

async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: LessonEvent
): Promise<boolean> {
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
    transparency: "opaque",
  };

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
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

async function setupWebhookChannel(
  supabase: any,
  accessToken: string,
  calendarId: string,
  instructorId: string,
  webhookUrl: string
): Promise<{ success: boolean; channelId?: string; expiration?: string }> {
  // Generate a unique channel ID
  const channelId = `instructor-${instructorId}-${Date.now()}`;
  
  // Watch channels expire after max 7 days, we'll set for 6 days to renew before expiry
  const expiration = Date.now() + 6 * 24 * 60 * 60 * 1000;

  console.log(`Setting up webhook channel ${channelId} for instructor ${instructorId}`);

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
          expiration: expiration.toString(),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to setup webhook channel:", errorText);
      return { success: false };
    }

    const watchData = await response.json();
    console.log("Webhook channel created:", watchData);

    // Store the channel info for later management
    const { error: upsertError } = await supabase
      .from("calendar_webhook_channels")
      .upsert({
        instructor_id: instructorId,
        channel_id: watchData.id,
        resource_id: watchData.resourceId,
        expiration: new Date(parseInt(watchData.expiration)).toISOString(),
      }, { onConflict: "instructor_id" });

    if (upsertError) {
      console.error("Error storing channel info:", upsertError);
    }

    return {
      success: true,
      channelId: watchData.id,
      expiration: new Date(parseInt(watchData.expiration)).toISOString(),
    };
  } catch (error) {
    console.error("Error setting up webhook:", error);
    return { success: false };
  }
}

async function stopWebhookChannel(
  accessToken: string,
  channelId: string,
  resourceId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/channels/stop",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          resourceId: resourceId,
        }),
      }
    );

    // 404 is okay - means channel already stopped
    return response.ok || response.status === 404;
  } catch (error) {
    console.error("Error stopping webhook channel:", error);
    return false;
  }
}

async function fetchExternalEvents(
  supabase: any,
  accessToken: string,
  calendarId: string,
  instructorId: string
): Promise<{ synced: number; deleted: number }> {
  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const timeMin = now.toISOString();
  const timeMax = oneYearLater.toISOString();

  console.log(`Fetching external events for instructor ${instructorId} from ${timeMin} to ${timeMax}`);

  try {
    // Fetch events from Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "2500",
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch calendar events:", errorText);
      throw new Error("Failed to fetch calendar events");
    }

    const data = await response.json();
    const events: GoogleCalendarEvent[] = data.items || [];

    console.log(`Fetched ${events.length} events from Google Calendar`);

    // Get existing platform-created events to exclude them
    const { data: platformEvents } = await supabase
      .from("calendar_events")
      .select("google_event_id")
      .eq("instructor_id", instructorId);

    const platformEventIds = new Set((platformEvents || []).map((e: any) => e.google_event_id));

    // Get existing external events for this instructor
    const { data: existingExternalEvents } = await supabase
      .from("instructor_calendar_events")
      .select("google_event_id")
      .eq("instructor_id", instructorId);

    const existingExternalIds = new Set<string>((existingExternalEvents || []).map((e: any) => e.google_event_id as string));

    // Filter to only external busy events (not created by our platform)
    const externalBusyEvents = events.filter((event) => {
      // Skip events we created
      if (platformEventIds.has(event.id)) return false;
      
      // Only include opaque (busy) events - transparent events show as "free"
      if (event.transparency === "transparent") return false;
      
      // Must have start and end times
      if (!event.start?.dateTime || !event.end?.dateTime) return false;
      
      return true;
    });

    console.log(`Found ${externalBusyEvents.length} external busy events`);

    // Track which event IDs we're seeing in this sync
    const currentEventIds = new Set<string>();

    let syncedCount = 0;

    // Upsert external events
    for (const event of externalBusyEvents) {
      currentEventIds.add(event.id);

      const eventData = {
        instructor_id: instructorId,
        google_event_id: event.id,
        title: event.summary || "Busy",
        start_time: event.start!.dateTime,
        end_time: event.end!.dateTime,
        is_busy: true,
        synced_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("instructor_calendar_events")
        .upsert(eventData, {
          onConflict: "instructor_id,google_event_id",
        });

      if (error) {
        console.error("Error upserting event:", error);
      } else {
        syncedCount++;
      }
    }

    // Delete events that no longer exist in Google Calendar
    let deletedCount = 0;
    for (const existingId of existingExternalIds) {
      if (!currentEventIds.has(existingId)) {
        await supabase
          .from("instructor_calendar_events")
          .delete()
          .eq("instructor_id", instructorId)
          .eq("google_event_id", existingId);
        deletedCount++;
      }
    }

    // Update last sync timestamp
    await supabase
      .from("instructor_calendar_tokens")
      .update({ last_external_sync: new Date().toISOString() })
      .eq("instructor_id", instructorId);

    console.log(`Synced ${syncedCount} events, deleted ${deletedCount} stale events`);

    return { synced: syncedCount, deleted: deletedCount };
  } catch (error) {
    console.error("Error fetching external events:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, instructorId, lessons, lessonId, lesson } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if instructor has calendar connected
    const { data: tokenData } = await supabase
      .from("instructor_calendar_tokens")
      .select("calendar_id, last_external_sync")
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

        const eventId = await createCalendarEvent(accessToken, calendarId, lessonItem);

        if (eventId) {
          // Store the event mapping
          await supabase.from("calendar_events").insert({
            instructor_id: instructorId,
            lesson_id: lessonItem.lessonId,
            google_event_id: eventId,
            event_type: "lesson",
          });

          results.push({ lessonId: lessonItem.lessonId, status: "synced", eventId });
        } else {
          results.push({ lessonId: lessonItem.lessonId, status: "failed" });
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

    if (action === "updateLesson") {
      // Update an existing lesson in Google Calendar
      const { data: eventData } = await supabase
        .from("calendar_events")
        .select("google_event_id")
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (eventData) {
        const updated = await updateCalendarEvent(accessToken, calendarId, eventData.google_event_id, lesson);
        return new Response(
          JSON.stringify({ success: updated }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // No existing event, create new one
        const eventId = await createCalendarEvent(accessToken, calendarId, lesson);
        if (eventId) {
          await supabase.from("calendar_events").insert({
            instructor_id: instructorId,
            lesson_id: lessonId,
            google_event_id: eventId,
            event_type: "lesson",
          });
        }
        return new Response(
          JSON.stringify({ success: !!eventId, eventId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

    if (action === "fetchExternalEvents") {
      // Fetch external events from Google Calendar and store them
      const result = await fetchExternalEvents(supabase, accessToken, calendarId, instructorId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced: result.synced, 
          deleted: result.deleted,
          lastSync: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "setupWebhook") {
      // Setup push notifications for real-time sync
      const webhookUrl = `${supabaseUrl}/functions/v1/google-calendar-webhook`;
      
      // First, stop any existing channel
      const { data: existingChannel } = await supabase
        .from("calendar_webhook_channels")
        .select("channel_id, resource_id")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (existingChannel) {
        await stopWebhookChannel(accessToken, existingChannel.channel_id, existingChannel.resource_id);
        await supabase
          .from("calendar_webhook_channels")
          .delete()
          .eq("instructor_id", instructorId);
      }

      const result = await setupWebhookChannel(supabase, accessToken, calendarId, instructorId, webhookUrl);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "stopWebhook") {
      // Stop push notifications
      const { data: existingChannel } = await supabase
        .from("calendar_webhook_channels")
        .select("channel_id, resource_id")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (existingChannel) {
        await stopWebhookChannel(accessToken, existingChannel.channel_id, existingChannel.resource_id);
        await supabase
          .from("calendar_webhook_channels")
          .delete()
          .eq("instructor_id", instructorId);
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
          
          // Get count of external events
          const { count } = await supabase
            .from("instructor_calendar_events")
            .select("*", { count: "exact", head: true })
            .eq("instructor_id", instructorId)
            .eq("is_busy", true);

          // Check if webhook is active
          const { data: webhookChannel } = await supabase
            .from("calendar_webhook_channels")
            .select("channel_id, expiration")
            .eq("instructor_id", instructorId)
            .maybeSingle();

          const webhookActive = webhookChannel && new Date(webhookChannel.expiration) > new Date();

          return new Response(
            JSON.stringify({ 
              connected: true, 
              calendarName: calendar.summary,
              calendarId: calendar.id,
              lastExternalSync: tokenData.last_external_sync,
              externalEventCount: count || 0,
              webhookActive,
              webhookExpiration: webhookChannel?.expiration || null
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