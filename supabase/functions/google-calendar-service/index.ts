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
    binaryDer,
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

    const { action, instructorId, calendarId, event, eventId, timeMin, timeMax } = await req.json();

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

        const allEvents: Array<{ id: string; summary: string; start: string; end: string; color: string | null; location: string | null; description: string | null }> = [];
        let pageToken: string | undefined;

        do {
          const params = new URLSearchParams({
            timeMin: thirtyDaysAgo.toISOString(),
            timeMax: oneYearLater.toISOString(),
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: "2500",
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
            .filter((item: { start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }) =>
              (item.start?.dateTime || item.start?.date) && (item.end?.dateTime || item.end?.date)
            )
            .map((item: { id: string; summary?: string; colorId?: string; location?: string; description?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }) => ({
              id: item.id,
              summary: item.summary || "Busy",
              start: item.start.dateTime || `${item.start.date}T00:00:00`,
              end: item.end.dateTime || `${item.end.date}T23:59:59`,
              color: item.colorId ? (googleColorMap[item.colorId] || calendarDefaultColor) : calendarDefaultColor,
              location: item.location || null,
              description: item.description || null,
            }));

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
            is_busy: true,
            color: event.color,
            location: event.location,
            description: event.description,
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
          const allEvents: Array<{ id: string; summary: string; start: string; end: string; color: string }> = [];
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
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.calendar_id)}/events?${params}`,
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
                color: item.colorId ? (googleColorMap[item.colorId] || calendarDefaultColor) : calendarDefaultColor,
              }));

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
              is_busy: true,
              color: event.color,
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