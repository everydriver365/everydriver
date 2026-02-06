import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

interface TokenData {
  instructor_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  email?: string;
}

// Get valid access token, refreshing if needed
async function getValidAccessToken(
  supabase: SupabaseClient,
  tokenData: TokenData,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const isExpired = new Date(tokenData.token_expiry) < new Date();

  if (isExpired && tokenData.refresh_token) {
    console.log(`Token expired for instructor ${tokenData.instructor_id}, refreshing...`);
    
    const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const refreshData = await refreshResponse.json();

    if (refreshData.error) {
      console.error(`Token refresh failed for ${tokenData.instructor_id}:`, refreshData);
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
      .eq("instructor_id", tokenData.instructor_id)
      .eq("provider", "google");

    return refreshData.access_token;
  }

  return tokenData.access_token;
}

// Fetch events from Google Calendar
async function fetchGoogleEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<Array<{ id: string; summary: string; start: string; end: string }>> {
  const allEvents: Array<{ id: string; summary: string; start: string; end: string }> = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch events: ${error}`);
    }

    const data = await response.json();

    const pageEvents = (data.items || [])
      .filter((item: { start?: { dateTime?: string }; end?: { dateTime?: string } }) => 
        item.start?.dateTime && item.end?.dateTime
      )
      .map((item: { id: string; summary?: string; start: { dateTime: string }; end: { dateTime: string } }) => ({
        id: item.id,
        summary: item.summary || "Busy",
        start: item.start.dateTime,
        end: item.end.dateTime,
      }));

    allEvents.push(...pageEvents);
    console.log(`Fetched page: ${pageEvents.length} events (total: ${allEvents.length})`);

    pageToken = data.nextPageToken;
  } while (pageToken);

  return allEvents;
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

    console.log("Starting scheduled calendar sync for all connected instructors...");

    // Get all instructors with Google Calendar connected
    const { data: tokens, error: tokensError } = await supabase
      .from("instructor_calendar_tokens")
      .select("instructor_id, access_token, refresh_token, token_expiry, email")
      .eq("provider", "google");

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch connected calendars" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log("No instructors with Google Calendar connected");
      return new Response(
        JSON.stringify({ success: true, synced: 0, message: "No connected calendars" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${tokens.length} instructors with Google Calendar connected`);

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    let successCount = 0;
    let errorCount = 0;

    for (const tokenData of tokens as TokenData[]) {
      try {
        const accessToken = await getValidAccessToken(supabase, tokenData, clientId, clientSecret);
        
        if (!accessToken) {
          console.log(`Skipping instructor ${tokenData.instructor_id} - token refresh failed`);
          errorCount++;
          continue;
        }

        const calendarEmail = tokenData.email || "primary";

        // Fetch events from Google
        const events = await fetchGoogleEvents(accessToken, calendarEmail, timeMin, timeMax);

        // Clear existing external events for this instructor in this time range
        await supabase
          .from("instructor_calendar_events")
          .delete()
          .eq("instructor_id", tokenData.instructor_id)
          .gte("start_time", timeMin)
          .lte("end_time", timeMax);

        // Insert new events
        if (events.length > 0) {
          const eventsToInsert = events.map((event) => ({
            instructor_id: tokenData.instructor_id,
            external_event_id: event.id,
            title: event.summary,
            start_time: event.start,
            end_time: event.end,
            is_busy: true,
            synced_at: new Date().toISOString(),
          }));

          const { error: upsertError } = await supabase.from("instructor_calendar_events").upsert(eventsToInsert, { onConflict: 'instructor_id,external_event_id' });
          if (upsertError) {
            console.error(`Upsert error for instructor ${tokenData.instructor_id}:`, upsertError);
          }
        }

        // Update last sync time
        await supabase
          .from("instructor_calendar_tokens")
          .update({ 
            last_external_sync: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("instructor_id", tokenData.instructor_id)
          .eq("provider", "google");

        console.log(`Synced ${events.length} events for instructor ${tokenData.instructor_id}`);
        successCount++;

      } catch (err) {
        console.error(`Error syncing for instructor ${tokenData.instructor_id}:`, err);
        errorCount++;
      }
    }

    console.log(`Scheduled sync complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: successCount,
        errors: errorCount,
        total: tokens.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
