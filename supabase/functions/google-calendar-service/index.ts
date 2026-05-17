import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JWTClaims {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  scope: string;
}

// Detects "blocking" all-day events (holidays, leave, sickness, etc.) by title.
// Non-matching all-day events are treated as informational (is_busy=false)
// so a stray all-day note doesn't wipe out the instructor's whole working day.
const BLOCKING_TITLE_RE = /holiday|vacation|\bvac\b|\boff\b|leave|sick|away|closed|unavailable|annual leave|day off|out of office|\booo\b/i;
function computeIsBusy(item: any, title: string | null): boolean {
  const isAllDay = !item.start?.dateTime && !!item.start?.date;
  if (!isAllDay) return true;
  return BLOCKING_TITLE_RE.test(title || "");
}

// Base64url encode
function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Import PEM private key for signing
async function importPrivateKey(rawPrivateKey: string): Promise<CryptoKey> {
  let keyInput = rawPrivateKey?.trim() ?? "";

  // If a full service-account JSON was pasted, extract private_key from it
  if (keyInput.startsWith("{") && keyInput.includes("private_key")) {
    try {
      const parsed = JSON.parse(keyInput) as { private_key?: string };
      if (parsed.private_key) keyInput = parsed.private_key;
    } catch {
      // keep original input and continue normalization
    }
  }

  // Normalize common env/secret encodings
  const normalizedKey = keyInput
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/^"|"$/g, "")
    .trim();

  // Strip PEM envelope and keep only key body chars
  let pemContents = normalizedKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, "")
    .replace(/-----END RSA PRIVATE KEY-----/g, "")
    .replace(/\r?\n/g, "")
    .replace(/\s/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/[^A-Za-z0-9+/=]/g, "")
    .trim();

  if (!pemContents) {
    throw new Error("Google private key is empty or invalid after normalization");
  }

  // Normalize padding
  pemContents = pemContents.replace(/=+$/g, "");
  const paddedContents = pemContents + "=".repeat((4 - (pemContents.length % 4)) % 4);

  let binaryDer: Uint8Array;
  try {
    binaryDer = Uint8Array.from(atob(paddedContents), (c) => c.charCodeAt(0));
  } catch (error) {
    console.error("Private key decode failed. Length:", paddedContents.length);
    throw new Error(`Invalid private key encoding: ${(error as Error).message}`);
  }

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer.slice(binaryDer.byteOffset, binaryDer.byteOffset + binaryDer.byteLength) as ArrayBuffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign"]
  );
}

// Generate signed JWT for Google API
async function generateJWT(
  serviceEmail: string,
  privateKey: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claims: JWTClaims = {
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
  const signatureInputBytes = stringToUint8Array(signatureInput);
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    signatureInputBytes.buffer as ArrayBuffer
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${signatureInput}.${encodedSignature}`;
}

// Exchange JWT for access token
async function getAccessToken(jwt: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token exchange failed:", error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Fetch busy times from Google Calendar
async function fetchBusyTimes(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<{ start: string; end: string }[]> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("FreeBusy request failed:", error);
    throw new Error(`Failed to fetch busy times: ${error}`);
  }

  const data = await response.json();
  const busyPeriods = data.calendars?.[calendarId]?.busy || [];
  
  return busyPeriods.map((period: { start: string; end: string }) => ({
    start: period.start,
    end: period.end,
  }));
}

// Create event in Google Calendar
async function createEvent(
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
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
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
async function updateEvent(
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
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
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
async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
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

// Test calendar access
async function testConnection(
  accessToken: string,
  calendarId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Calendar access test failed:", error);
      
      if (response.status === 404) {
        return { success: false, error: "Calendar not found. Check your Calendar ID." };
      }
      if (response.status === 403) {
        return { success: false, error: "Access denied. Make sure you've shared your calendar with the service account." };
      }
      return { success: false, error: `Access test failed: ${error}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: `Connection error: ${err}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");

    const { action, instructorId, calendarId, event, eventId, timeMin, timeMax, fromDate, toDate } = await req.json();

    console.log(`Google Calendar Service: ${action} for instructor ${instructorId}`);

    // Action to get config (doesn't require secrets)
    if (action === "getConfig") {
      if (!serviceEmail) {
        return new Response(
          JSON.stringify({ 
            configured: false,
            error: "Service account not configured" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          configured: true,
          serviceAccountEmail: serviceEmail 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All other actions require secrets
    if (!serviceEmail || !privateKey) {
      console.error("Missing Google service account credentials");
      return new Response(
        JSON.stringify({ error: "Google Calendar service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Read-only preview: fetches events from Google Calendar and classifies
    // each one (timed vs all-day, duration, whether it WOULD block availability)
    // WITHOUT writing anything to the database. Lets the instructor inspect the
    // import before they commit.
    if (action === "previewExternalEvents") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: "Instructor ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { data: connection } = await supabase
        .from("instructor_google_service_calendar")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();
      if (!connection) {
        return new Response(
          JSON.stringify({ error: "No Google Calendar connected" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      try {
        const jwt = await generateJWT(serviceEmail, privateKey);
        const accessToken = await getAccessToken(jwt);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

        const events: any[] = [];
        let pageToken: string | undefined;
        do {
          const params = new URLSearchParams({
            timeMin: thirtyDaysAgo.toISOString(),
            timeMax: oneYearLater.toISOString(),
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: "2500",
          });
          if (pageToken) params.set("pageToken", pageToken);
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events?${params}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!response.ok) {
            const err = await response.text();
            throw new Error(`Failed to fetch events: ${err}`);
          }
          const data = await response.json();
          for (const item of (data.items || [])) {
            if (!(item.start?.dateTime || item.start?.date)) continue;
            if (!(item.end?.dateTime || item.end?.date)) continue;
            const title = item.summary || "Busy";
            const isAllDay = !item.start?.dateTime && !!item.start?.date;
            const startIso = item.start.dateTime || `${item.start.date}T00:00:00`;
            const endIso = item.end.dateTime || `${item.end.date}T23:59:59`;
            const durationMs = new Date(endIso).getTime() - new Date(startIso).getTime();
            const wouldBlock = computeIsBusy(item, title);
            events.push({
              id: item.id,
              title,
              isAllDay,
              start: startIso,
              end: endIso,
              durationMinutes: Math.max(0, Math.round(durationMs / 60000)),
              wouldBlock,
              location: item.location || null,
              htmlLink: item.htmlLink || null,
              status: item.status || "confirmed",
            });
          }
          pageToken = data.nextPageToken;
        } while (pageToken);

        return new Response(
          JSON.stringify({ success: true, events, calendarId: connection.calendar_id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("previewExternalEvents error:", err);
        return new Response(
          JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Test connection action
    if (action === "testConnection") {
      if (!calendarId) {
        return new Response(
          JSON.stringify({ error: "Calendar ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const jwt = await generateJWT(serviceEmail, privateKey);
        const accessToken = await getAccessToken(jwt);
        const result = await testConnection(accessToken, calendarId);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("Test connection error:", err);
        return new Response(
          JSON.stringify({ success: false, error: `Connection failed: ${err}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Save connection action
    if (action === "saveConnection") {
      if (!instructorId || !calendarId) {
        return new Response(
          JSON.stringify({ error: "Instructor ID and Calendar ID are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // First test the connection
      const jwt = await generateJWT(serviceEmail, privateKey);
      const accessToken = await getAccessToken(jwt);
      const testResult = await testConnection(accessToken, calendarId);

      if (!testResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: testResult.error }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save to database
      const { error } = await supabase
        .from("instructor_google_service_calendar")
        .upsert({
          instructor_id: instructorId,
          calendar_id: calendarId,
          is_active: true,
          last_sync: new Date().toISOString(),
          sync_error: null,
        }, { onConflict: "instructor_id" });

      if (error) {
        console.error("Save connection error:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to save connection" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check connection action
    if (action === "checkConnection") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: connection } = await supabase
        .from("instructor_google_service_calendar")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();

      if (!connection) {
        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Count external events
      const { count } = await supabase
        .from("instructor_calendar_events")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId);

      return new Response(
        JSON.stringify({
          connected: true,
          calendarId: connection.calendar_id,
          lastSync: connection.last_sync,
          externalEventCount: count || 0,
          provider: "google-service",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Disconnect action
    if (action === "disconnect") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: "Instructor ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete the connection
      await supabase
        .from("instructor_google_service_calendar")
        .delete()
        .eq("instructor_id", instructorId);

      // Also clean up synced events
      await supabase
        .from("instructor_calendar_events")
        .delete()
        .eq("instructor_id", instructorId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch external events action (busy times)
    if (action === "fetchExternalEvents") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: "Instructor ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the connection
      const { data: connection } = await supabase
        .from("instructor_google_service_calendar")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();

      if (!connection) {
        return new Response(
          JSON.stringify({ error: "No Google Calendar connected" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const jwt = await generateJWT(serviceEmail, privateKey);
        const accessToken = await getAccessToken(jwt);

        // Fetch actual events (with stable IDs) for the past 30 days + next 365 days using events.list with pagination
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        
        // Google Calendar event color map (colorId 1-11)
        const googleColorMap: Record<string, string> = {
          "1": "#7986CB", // Lavender
          "2": "#33B679", // Sage
          "3": "#8E24AA", // Grape
          "4": "#E67C73", // Flamingo
          "5": "#F6BF26", // Banana
          "6": "#F4511E", // Tangerine
          "7": "#039BE5", // Peacock
          "8": "#616161", // Graphite
          "9": "#3F51B5", // Blueberry
          "10": "#0B8043", // Basil
          "11": "#D50000", // Tomato
        };

        // Fetch the calendar's default background color
        let calendarDefaultColor = "#039BE5"; // Peacock fallback
        try {
          const calMeta = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (calMeta.ok) {
            const calData = await calMeta.json();
            if (calData.backgroundColor) {
              calendarDefaultColor = calData.backgroundColor;
            }
          }
        } catch (e) {
          console.warn("Could not fetch calendar metadata for default color:", e);
        }

        console.log(`Calendar default color: ${calendarDefaultColor}`);

        const allEvents: Array<{ id: string; summary: string; start: string; end: string; color: string | null; location: string | null; description: string | null; meeting_url: string | null; meeting_provider: string | null; html_link: string | null }> = [];
        let pageToken: string | undefined;

        // Helper: extract first http(s) URL from a string
        const extractFirstUrl = (text: string | null | undefined): string | null => {
          if (!text) return null;
          const m = text.match(/https?:\/\/[^\s<>"')]+/i);
          return m ? m[0] : null;
        };
        // Helper: pull video meeting URL from a Google event
        const extractMeetingInfo = (item: any): { url: string | null; provider: string | null } => {
          const cd = item.conferenceData;
          if (cd?.entryPoints && Array.isArray(cd.entryPoints)) {
            const video = cd.entryPoints.find((ep: any) => ep.entryPointType === "video");
            if (video?.uri) {
              return { url: video.uri, provider: cd.conferenceSolution?.name || "Video meeting" };
            }
          }
          if (item.hangoutLink) {
            return { url: item.hangoutLink, provider: "Google Meet" };
          }
          const fromDesc = extractFirstUrl(item.description);
          if (fromDesc) {
            const provider = /zoom\.us/i.test(fromDesc) ? "Zoom" :
              /teams\.microsoft/i.test(fromDesc) ? "Microsoft Teams" :
              /meet\.google/i.test(fromDesc) ? "Google Meet" :
              /webex/i.test(fromDesc) ? "Webex" : "Meeting link";
            return { url: fromDesc, provider };
          }
          return { url: null, provider: null };
        };

        do {
          const params = new URLSearchParams({
            timeMin: thirtyDaysAgo.toISOString(),
            timeMax: oneYearLater.toISOString(),
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: "2500",
            conferenceDataVersion: "1",
          });
          if (pageToken) {
            params.set("pageToken", pageToken);
          }

          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events?${params}`,
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
            .filter((item: any) =>
              (item.start?.dateTime || item.start?.date) && (item.end?.dateTime || item.end?.date)
            )
            .map((item: any) => {
              const meeting = extractMeetingInfo(item);
              const title = item.summary || "Busy";
              return {
                id: item.id,
                summary: title,
                start: item.start.dateTime || `${item.start.date}T00:00:00`,
                end: item.end.dateTime || `${item.end.date}T23:59:59`,
                is_busy: computeIsBusy(item, title),
                color: item.colorId ? (googleColorMap[item.colorId] || calendarDefaultColor) : calendarDefaultColor,
                location: item.location || null,
                description: item.description || null,
                meeting_url: meeting.url,
                meeting_provider: meeting.provider,
                html_link: item.htmlLink || null,
              };
            });

          allEvents.push(...pageEvents);
          console.log(`Service sync page: ${pageEvents.length} events (total: ${allEvents.length})`);
          pageToken = data.nextPageToken;
        } while (pageToken);

        // Delete existing events for this instructor then upsert with stable IDs
        const { error: deleteError } = await supabase
          .from("instructor_calendar_events")
          .delete()
          .eq("instructor_id", instructorId);

        if (deleteError) {
          console.error("Delete existing events error:", deleteError);
        }

        if (allEvents.length > 0) {
          const eventsToInsert = allEvents.map((event) => ({
            instructor_id: instructorId,
            external_event_id: event.id,
            title: event.summary,
            start_time: event.start,
            end_time: event.end,
            is_busy: event.is_busy ?? true,
            color: event.color,
            location: event.location,
            description: event.description,
            meeting_url: event.meeting_url,
            meeting_provider: event.meeting_provider,
            html_link: event.html_link,
            synced_at: new Date().toISOString(),
          }));

          const { error: upsertError } = await supabase
            .from("instructor_calendar_events")
            .upsert(eventsToInsert, { onConflict: 'instructor_id,external_event_id' });

          if (upsertError) {
            console.error("Upsert events error:", upsertError);
          }
        }

        // Update last sync time
        await supabase
          .from("instructor_google_service_calendar")
          .update({ 
            last_sync: new Date().toISOString(),
            sync_error: null,
          })
          .eq("instructor_id", instructorId);

        return new Response(
          JSON.stringify({ success: true, synced: allEvents.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("Fetch external events error:", err);
        
        // Update sync error
        await supabase
          .from("instructor_google_service_calendar")
          .update({ sync_error: String(err) })
          .eq("instructor_id", instructorId);

        return new Response(
          JSON.stringify({ error: `Failed to sync: ${err}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create event action
    if (action === "createEvent") {
      if (!instructorId || !event) {
        return new Response(
          JSON.stringify({ error: "Instructor ID and event are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: connection } = await supabase
        .from("instructor_google_service_calendar")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();

      if (!connection) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "No Google Calendar connected" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const jwt = await generateJWT(serviceEmail, privateKey);
        const accessToken = await getAccessToken(jwt);
        const googleEventId = await createEvent(accessToken, connection.calendar_id, event);

        return new Response(
          JSON.stringify({ success: true, eventId: googleEventId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("Create event error:", err);
        return new Response(
          JSON.stringify({ error: `Failed to create event: ${err}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update event action
    if (action === "updateEvent") {
      if (!instructorId || !eventId || !event) {
        return new Response(
          JSON.stringify({ error: "Instructor ID, event ID and event data are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: connection } = await supabase
        .from("instructor_google_service_calendar")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();

      if (!connection) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "No Google Calendar connected" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const jwt = await generateJWT(serviceEmail, privateKey);
        const accessToken = await getAccessToken(jwt);
        await updateEvent(accessToken, connection.calendar_id, eventId, event);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("Update event error:", err);
        return new Response(
          JSON.stringify({ error: `Failed to update event: ${err}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Delete event action
    if (action === "deleteEvent") {
      if (!instructorId || !eventId) {
        return new Response(
          JSON.stringify({ error: "Instructor ID and event ID are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: connection } = await supabase
        .from("instructor_google_service_calendar")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();

      if (!connection) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "No Google Calendar connected" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const jwt = await generateJWT(serviceEmail, privateKey);
        const accessToken = await getAccessToken(jwt);
        await deleteEvent(accessToken, connection.calendar_id, eventId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("Delete event error:", err);
        return new Response(
          JSON.stringify({ error: `Failed to delete event: ${err}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Sync ALL connected instructors (for cron usage)
    if (action === "syncAllInstructors") {
      const { data: connections, error: connErr } = await supabase
        .from("instructor_google_service_calendar")
        .select("instructor_id, calendar_id")
        .eq("is_active", true);

      if (connErr || !connections || connections.length === 0) {
        return new Response(
          JSON.stringify({ success: true, synced: 0, message: "No connected instructors" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let totalSynced = 0;
      let errors = 0;

      const googleColorMap: Record<string, string> = {
        "1": "#7986CB",
        "2": "#33B679",
        "3": "#8E24AA",
        "4": "#E67C73",
        "5": "#F6BF26",
        "6": "#F4511E",
        "7": "#039BE5",
        "8": "#616161",
        "9": "#3F51B5",
        "10": "#0B8043",
        "11": "#D50000",
      };

      for (const conn of connections) {
        try {
          const jwt = await generateJWT(serviceEmail, privateKey);
          const accessToken = await getAccessToken(jwt);

          let calendarDefaultColor = "#039BE5";
          try {
            const calMeta = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.calendar_id)}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (calMeta.ok) {
              const calData = await calMeta.json();
              if (calData.backgroundColor) {
                calendarDefaultColor = calData.backgroundColor;
              }
            }
          } catch (e) {
            console.warn(`Could not fetch calendar metadata for ${conn.instructor_id}:`, e);
          }

          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          const allEvents: Array<{ id: string; summary: string; start: string; end: string; color: string; location: string | null; description: string | null; meeting_url: string | null; meeting_provider: string | null; html_link: string | null }> = [];
          let pageToken: string | undefined;

          const extractFirstUrl = (text: string | null | undefined): string | null => {
            if (!text) return null;
            const m = text.match(/https?:\/\/[^\s<>"')]+/i);
            return m ? m[0] : null;
          };
          const extractMeetingInfo = (item: any): { url: string | null; provider: string | null } => {
            const cd = item.conferenceData;
            if (cd?.entryPoints && Array.isArray(cd.entryPoints)) {
              const video = cd.entryPoints.find((ep: any) => ep.entryPointType === "video");
              if (video?.uri) return { url: video.uri, provider: cd.conferenceSolution?.name || "Video meeting" };
            }
            if (item.hangoutLink) return { url: item.hangoutLink, provider: "Google Meet" };
            const fromDesc = extractFirstUrl(item.description);
            if (fromDesc) {
              const provider = /zoom\.us/i.test(fromDesc) ? "Zoom" :
                /teams\.microsoft/i.test(fromDesc) ? "Microsoft Teams" :
                /meet\.google/i.test(fromDesc) ? "Google Meet" :
                /webex/i.test(fromDesc) ? "Webex" : "Meeting link";
              return { url: fromDesc, provider };
            }
            return { url: null, provider: null };
          };

          do {
            const params = new URLSearchParams({
              timeMin: thirtyDaysAgo.toISOString(),
              timeMax: oneYearLater.toISOString(),
              singleEvents: "true",
              orderBy: "startTime",
              maxResults: "2500",
              conferenceDataVersion: "1",
            });
            if (pageToken) params.set("pageToken", pageToken);

            const response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.calendar_id)}/events?${params}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!response.ok) {
              const error = await response.text();
              throw new Error(`Failed to fetch events: ${error}`);
            }

            const data = await response.json();
            const pageEvents = (data.items || [])
              .filter((item: any) =>
                (item.start?.dateTime || item.start?.date) && (item.end?.dateTime || item.end?.date)
              )
              .map((item: any) => {
                const meeting = extractMeetingInfo(item);
                const title = item.summary || "Busy";
                return {
                  id: item.id,
                  summary: title,
                  start: item.start.dateTime || `${item.start.date}T00:00:00`,
                  end: item.end.dateTime || `${item.end.date}T23:59:59`,
                  is_busy: computeIsBusy(item, title),
                  color: item.colorId ? (googleColorMap[item.colorId] || calendarDefaultColor) : calendarDefaultColor,
                  location: item.location || null,
                  description: item.description || null,
                  meeting_url: meeting.url,
                  meeting_provider: meeting.provider,
                  html_link: item.htmlLink || null,
                };
              });

            allEvents.push(...pageEvents);
            pageToken = data.nextPageToken;
          } while (pageToken);

          await supabase
            .from("instructor_calendar_events")
            .delete()
            .eq("instructor_id", conn.instructor_id);

          if (allEvents.length > 0) {
            const eventsToInsert = allEvents.map((event) => ({
              instructor_id: conn.instructor_id,
              external_event_id: event.id,
              title: event.summary,
              start_time: event.start,
              end_time: event.end,
              is_busy: event.is_busy ?? true,
              color: event.color,
              location: event.location,
              description: event.description,
              meeting_url: event.meeting_url,
              meeting_provider: event.meeting_provider,
              html_link: event.html_link,
              synced_at: new Date().toISOString(),
            }));

            await supabase
              .from("instructor_calendar_events")
              .upsert(eventsToInsert, { onConflict: 'instructor_id,external_event_id' });
          }

          await supabase
            .from("instructor_google_service_calendar")
            .update({ last_sync: new Date().toISOString(), sync_error: null })
            .eq("instructor_id", conn.instructor_id);

          totalSynced += allEvents.length;
          console.log(`Synced ${allEvents.length} events for instructor ${conn.instructor_id}`);
        } catch (err) {
          errors++;
          console.error(`Sync error for instructor ${conn.instructor_id}:`, err);
          await supabase
            .from("instructor_google_service_calendar")
            .update({ sync_error: String(err) })
            .eq("instructor_id", conn.instructor_id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, instructors: connections.length, synced: totalSynced, errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Re-sync a specific date range and return added/removed diff
    if (action === "resyncRange") {
      if (!instructorId || !fromDate || !toDate) {
        return new Response(
          JSON.stringify({ error: "instructorId, fromDate and toDate are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const fromTs = new Date(fromDate);
      const toTs = new Date(toDate);
      if (isNaN(fromTs.getTime()) || isNaN(toTs.getTime()) || fromTs >= toTs) {
        return new Response(
          JSON.stringify({ error: "Invalid date range" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const rangeDays = (toTs.getTime() - fromTs.getTime()) / (24 * 60 * 60 * 1000);
      if (rangeDays > 366) {
        return new Response(
          JSON.stringify({ error: "Range cannot exceed 366 days" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: connection } = await supabase
        .from("instructor_google_service_calendar")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();

      if (!connection) {
        return new Response(
          JSON.stringify({ error: "No Google Calendar connected" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        // Snapshot current rows in the window
        const { data: snapshotRows } = await supabase
          .from("instructor_calendar_events")
          .select("external_event_id, title, start_time, end_time, location")
          .eq("instructor_id", instructorId)
          .gte("start_time", fromTs.toISOString())
          .lt("start_time", toTs.toISOString());

        const snapshot = new Map<string, any>();
        (snapshotRows || []).forEach((r: any) => {
          if (r.external_event_id) snapshot.set(r.external_event_id, r);
        });

        // Fetch fresh events from Google for the exact window
        const jwt = await generateJWT(serviceEmail, privateKey);
        const accessToken = await getAccessToken(jwt);

        const googleColorMap: Record<string, string> = {
          "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
          "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
          "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
        };

        let calendarDefaultColor = "#039BE5";
        try {
          const calMeta = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (calMeta.ok) {
            const calData = await calMeta.json();
            if (calData.backgroundColor) calendarDefaultColor = calData.backgroundColor;
          }
        } catch (_) { /* ignore */ }

        const fresh = new Map<string, any>();
        let pageToken: string | undefined;
        do {
          const params = new URLSearchParams({
            timeMin: fromTs.toISOString(),
            timeMax: toTs.toISOString(),
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: "2500",
            conferenceDataVersion: "1",
          });
          if (pageToken) params.set("pageToken", pageToken);

          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events?${params}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to fetch events: ${errText}`);
          }
          const data = await response.json();
          (data.items || []).forEach((item: any) => {
            if (!(item.start?.dateTime || item.start?.date)) return;
            if (!(item.end?.dateTime || item.end?.date)) return;
            const title = item.summary || "Busy";
            fresh.set(item.id, {
              id: item.id,
              title,
              start: item.start.dateTime || `${item.start.date}T00:00:00`,
              end: item.end.dateTime || `${item.end.date}T23:59:59`,
              is_busy: computeIsBusy(item, title),
              color: item.colorId ? (googleColorMap[item.colorId] || calendarDefaultColor) : calendarDefaultColor,
              location: item.location || null,
              description: item.description || null,
              html_link: item.htmlLink || null,
            });
          });
          pageToken = data.nextPageToken;
        } while (pageToken);

        // Diff
        const addedList: any[] = [];
        const removedList: any[] = [];
        let unchanged = 0;

        for (const [id, ev] of fresh) {
          if (snapshot.has(id)) unchanged++;
          else addedList.push({ id, title: ev.title, start: ev.start, end: ev.end, location: ev.location });
        }
        for (const [id, row] of snapshot) {
          if (!fresh.has(id)) {
            removedList.push({
              id,
              title: row.title,
              start: row.start_time,
              end: row.end_time,
              location: row.location,
            });
          }
        }

        // Apply: delete removed rows
        if (removedList.length > 0) {
          const removedIds = removedList.map((r) => r.id);
          const { error: delErr } = await supabase
            .from("instructor_calendar_events")
            .delete()
            .eq("instructor_id", instructorId)
            .in("external_event_id", removedIds);
          if (delErr) console.error("resyncRange delete error:", delErr);

          // Also soft-cancel any scheduled_lessons whose Google event was
          // deleted upstream. Without this, the CRM row stays "scheduled"
          // forever and (until the safety-net was removed) could falsely
          // block public availability. We mark cancelled + clear the now-dead
          // google_event_id so subsequent syncs don't try to update it.
          const { error: slErr } = await supabase
            .from("scheduled_lessons")
            .update({
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
              cancelled_by: "google_calendar_sync",
              cancellation_reason: "Event deleted in Google Calendar",
              calendar_sync_status: "deleted-from-google",
              google_event_id: null,
              deleted_at: new Date().toISOString(),
            })
            .eq("instructor_id", instructorId)
            .in("google_event_id", removedIds);
          if (slErr) console.error("resyncRange scheduled_lessons cancel error:", slErr);
        }

        // Upsert all fresh events (covers added + updates)
        if (fresh.size > 0) {
          const rows = Array.from(fresh.values()).map((ev) => ({
            instructor_id: instructorId,
            external_event_id: ev.id,
            title: ev.title,
            start_time: ev.start,
            end_time: ev.end,
            is_busy: ev.is_busy ?? true,
            color: ev.color,
            location: ev.location,
            description: ev.description,
            html_link: ev.html_link,
            synced_at: new Date().toISOString(),
          }));
          const { error: upErr } = await supabase
            .from("instructor_calendar_events")
            .upsert(rows, { onConflict: "instructor_id,external_event_id" });
          if (upErr) console.error("resyncRange upsert error:", upErr);
        }

        await supabase
          .from("instructor_google_service_calendar")
          .update({ last_sync: new Date().toISOString(), sync_error: null })
          .eq("instructor_id", instructorId);

        return new Response(
          JSON.stringify({
            success: true,
            range: { from: fromTs.toISOString(), to: toTs.toISOString() },
            counts: { added: addedList.length, removed: removedList.length, unchanged },
            added: addedList,
            removed: removedList,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error("resyncRange error:", err);
        await supabase
          .from("instructor_google_service_calendar")
          .update({ sync_error: String(err) })
          .eq("instructor_id", instructorId);
        return new Response(
          JSON.stringify({ error: `Failed to re-sync: ${err}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );


  } catch (err) {
    console.error("Google Calendar Service error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});