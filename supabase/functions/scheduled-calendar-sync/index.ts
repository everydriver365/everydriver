import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

function googleColorIdToHex(colorId?: string): string | null {
  if (!colorId) return null;
  const map: Record<string, string> = {
    '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
    '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '8': '#616161',
    '9': '#3f51b5', '10': '#0b8043', '11': '#d50000',
  };
  return map[colorId] || null;
}

// Base64url encode
function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  let normalizedKey = pemKey.replace(/\\n/g, "\n");
  const pemContents = normalizedKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, "")
    .replace(/-----END RSA PRIVATE KEY-----/g, "")
    .replace(/\r?\n/g, "")
    .replace(/\s/g, "")
    .trim();

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );
}

async function generateJWT(serviceEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceEmail,
    sub: serviceEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/calendar",
  };

  const encodedHeader = base64urlEncode(stringToUint8Array(JSON.stringify(header)));
  const encodedClaims = base64urlEncode(stringToUint8Array(JSON.stringify(claims)));
  const signatureInput = `${encodedHeader}.${encodedClaims}`;

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    stringToUint8Array(signatureInput).buffer as ArrayBuffer
  );

  return `${signatureInput}.${base64urlEncode(new Uint8Array(signature))}`;
}

async function getAccessToken(jwt: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Fetch events from Google Calendar
async function fetchGoogleEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<Array<{ id: string; summary: string; start: string; end: string; color: string | null }>> {
  const allEvents: Array<{ id: string; summary: string; start: string; end: string; color: string | null }> = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch events: ${error}`);
    }

    const data = await response.json();

    const pageEvents = (data.items || [])
      .filter((item: { start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }) =>
        (item.start?.dateTime || item.start?.date) && (item.end?.dateTime || item.end?.date)
      )
      .map((item: { id: string; summary?: string; colorId?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }) => ({
        id: item.id,
        summary: item.summary || "Busy",
        start: item.start.dateTime || `${item.start.date}T00:00:00`,
        end: item.end.dateTime || `${item.end.date}T23:59:59`,
        color: googleColorIdToHex(item.colorId),
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
    const serviceEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceEmail || !privateKey) {
      return new Response(
        JSON.stringify({ error: "Google service account not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    console.log("Starting scheduled calendar sync for all connected instructors...");

    // Get all instructors with service account calendar connected
    const { data: connections, error: connError } = await supabase
      .from("instructor_google_service_calendar")
      .select("instructor_id, calendar_id")
      .eq("is_active", true);

    if (connError) {
      console.error("Error fetching connections:", connError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch connected calendars" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!connections || connections.length === 0) {
      console.log("No instructors with Google Calendar connected");
      return new Response(
        JSON.stringify({ success: true, synced: 0, message: "No connected calendars" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${connections.length} instructors with Google Calendar connected`);

    // Get service account access token once for all instructors
    const jwt = await generateJWT(serviceEmail, privateKey);
    const accessToken = await getAccessToken(jwt);

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    let successCount = 0;
    let errorCount = 0;

    for (const conn of connections) {
      try {
        // Fetch events from Google
        const events = await fetchGoogleEvents(accessToken, conn.calendar_id, timeMin, timeMax);

        // Clear existing external events for this instructor in this time range
        await supabase
          .from("instructor_calendar_events")
          .delete()
          .eq("instructor_id", conn.instructor_id)
          .gte("start_time", timeMin)
          .lte("end_time", timeMax);

        // Insert new events
        if (events.length > 0) {
          const eventsToInsert = events.map((event) => ({
            instructor_id: conn.instructor_id,
            external_event_id: event.id,
            title: event.summary,
            start_time: event.start,
            end_time: event.end,
            is_busy: true,
            color: event.color || null,
            synced_at: new Date().toISOString(),
          }));

          const { error: upsertError } = await supabase
            .from("instructor_calendar_events")
            .upsert(eventsToInsert, { onConflict: 'instructor_id,external_event_id' });

          if (upsertError) {
            console.error(`Upsert error for instructor ${conn.instructor_id}:`, upsertError);
          }
        }

        // Update last sync time
        await supabase
          .from("instructor_google_service_calendar")
          .update({ last_sync: new Date().toISOString(), sync_error: null })
          .eq("instructor_id", conn.instructor_id);

        console.log(`Synced ${events.length} events for instructor ${conn.instructor_id}`);
        successCount++;
      } catch (err) {
        console.error(`Error syncing for instructor ${conn.instructor_id}:`, err);
        
        // Record the error
        await supabase
          .from("instructor_google_service_calendar")
          .update({ sync_error: err instanceof Error ? err.message : "Unknown error" })
          .eq("instructor_id", conn.instructor_id);

        errorCount++;
      }
    }

    console.log(`Scheduled sync complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: successCount,
        errors: errorCount,
        total: connections.length,
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
