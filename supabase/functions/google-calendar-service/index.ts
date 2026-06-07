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

// ---------------------------------------------------------------------------
// Import Google Calendar events as scheduled_lessons
// ---------------------------------------------------------------------------
// Matches event title to a pupil name for this instructor:
//   - Exact case-insensitive match -> use that pupil
//   - Single fuzzy match (title contains pupil name) -> use that pupil
//   - Zero / multiple matches -> skip, record in unmatched_google_events,
//     and create an instructor notification (only when first seen).
//
// All-day "busy" blocks (holiday / leave) are NOT imported as lessons.
// Events already linked to a lesson via google_event_id are updated in place.
// ---------------------------------------------------------------------------
interface ExternalEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  is_busy: boolean;
  location: string | null;
}

function toLondonDateTime(iso: string): { date: string; time: string; minutes: number } {
  const d = new Date(iso);
  // en-GB en gives dd/mm/yyyy; use ISO via sv-SE locale which yields yyyy-mm-dd
  const date = d.toLocaleDateString("sv-SE", { timeZone: "Europe/London" });
  const time = d.toLocaleTimeString("en-GB", {
    timeZone: "Europe/London",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time: `${time}:00`, minutes: d.getTime() / 60000 };
}

function normalizeName(s: string | null | undefined): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

async function importExternalEventsAsLessons(
  supabase: any,
  instructorId: string,
  externalEvents: ExternalEvent[],
): Promise<{ imported: number; updated: number; unmatched: number; skipped: number }> {
  const stats = { imported: 0, updated: 0, unmatched: 0, skipped: 0 };

  // Only consider timed, non-all-day, non-blocking events
  const candidates = externalEvents.filter((e) => {
    if (!e.is_busy) return false;
    // All-day events look like 2026-01-01T00:00:00 with end at 23:59:59 -> treat as not a lesson
    const isAllDayish = /T00:00:00$/.test(e.start) && /T23:59:59$/.test(e.end);
    return !isAllDayish;
  });

  if (candidates.length === 0) return stats;

  // Pupils + existing lesson links + dismissed/resolved unmatched in parallel
  const [pupilsRes, lessonsRes, unmatchedRes] = await Promise.all([
    supabase
      .from("pupils")
      .select("id, name")
      .eq("instructor_id", instructorId)
      .is("deleted_at", null),
    supabase
      .from("scheduled_lessons")
      .select("id, google_event_id, lesson_date, start_time, duration_minutes, pickup_location, status, deleted_at")
      .eq("instructor_id", instructorId)
      .not("google_event_id", "is", null),
    supabase
      .from("unmatched_google_events")
      .select("external_event_id, status")
      .eq("instructor_id", instructorId),
  ]);

  const pupils: Array<{ id: string; name: string; n: string }> = (pupilsRes.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    n: normalizeName(p.name),
  }));

  const lessonByEventId = new Map<string, any>();
  for (const l of lessonsRes.data || []) {
    if (l.google_event_id) lessonByEventId.set(l.google_event_id, l);
  }

  const unmatchedByEventId = new Map<string, string>();
  for (const u of unmatchedRes.data || []) {
    unmatchedByEventId.set(u.external_event_id, u.status);
  }

  for (const ev of candidates) {
    // Skip events the instructor has already dismissed or manually resolved.
    // Google is availability truth, not CRM truth: new external events must not
    // silently create DSM lessons just because a title resembles a pupil name.
    const knownUnmatchedStatus = unmatchedByEventId.get(ev.id);
    if (knownUnmatchedStatus === "dismissed" || knownUnmatchedStatus === "resolved") {
      stats.skipped++;
      continue;
    }

    const existing = lessonByEventId.get(ev.id);

    const london = toLondonDateTime(ev.start);
    const endLondon = toLondonDateTime(ev.end);
    const duration = Math.max(15, Math.round(endLondon.minutes - london.minutes));

    // -- Existing lesson: update mutable fields, never duplicate --
    if (existing && existing.status !== "cancelled" && !existing.deleted_at) {
      const needsUpdate =
        existing.lesson_date !== london.date ||
        String(existing.start_time).slice(0, 5) !== london.time.slice(0, 5) ||
        existing.duration_minutes !== duration ||
        (existing.pickup_location || null) !== (ev.location || null);
      if (needsUpdate) {
        await supabase
          .from("scheduled_lessons")
          .update({
            lesson_date: london.date,
            start_time: london.time,
            duration_minutes: duration,
            pickup_location: ev.location,
          })
          .eq("id", existing.id);
        stats.updated++;
      } else {
        stats.skipped++;
      }
      continue;
    }

    // No existing lesson: record for manual review. A matched title can be a
    // suggestion in the UI later, but it is not authority to create a CRM row.
    const wasKnown = unmatchedByEventId.has(ev.id);
    const { error: upErr } = await supabase
      .from("unmatched_google_events")
      .upsert(
        {
          instructor_id: instructorId,
          external_event_id: ev.id,
          title: ev.summary,
          start_time: ev.start,
          end_time: ev.end,
          location: ev.location,
          status: "pending",
        },
        { onConflict: "instructor_id,external_event_id" },
      );
    if (upErr) {
      console.error("[importExternalEvents] upsert unmatched failed:", upErr);
    }
    stats.unmatched++;

    if (!wasKnown) {
      try {
        await supabase.from("instructor_notifications").insert({
          instructor_id: instructorId,
          title: "Google event needs a pupil",
          message: `"${ev.summary}" (${london.date} ${london.time.slice(0, 5)}) couldn't be matched to a pupil.`,
          type: "google_event_unmatched",
          action_url: "/instructor-app/unmatched-google-events",
          metadata: { external_event_id: ev.id, title: ev.summary, start: ev.start },
        });
      } catch (e) {
        console.error("[importExternalEvents] notification insert failed:", e);
      }
    }
  }

  return stats;
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

    const reqBody = await req.json();
    const { action, instructorId, calendarId, event, eventId, timeMin, timeMax, fromDate, toDate } = reqBody as Record<string, any>;
    // syncManualBlock-specific fields
    const op: string | undefined = reqBody?.op;
    const blockId: string | undefined = reqBody?.blockId;
    const block: any = reqBody?.block;
    const googleEventIdParam: string | undefined = reqBody?.googleEventId;

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

      // Register Google Calendar push webhook (best-effort, non-fatal)
      try {
        const channelId = crypto.randomUUID();
        const channelToken = crypto.randomUUID();
        const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-webhook`;
        const ttlSeconds = 7 * 24 * 60 * 60;
        const watchRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              id: channelId, type: "web_hook", address: webhookUrl,
              token: channelToken, params: { ttl: String(ttlSeconds) },
            }),
          }
        );
        if (watchRes.ok) {
          const watch = await watchRes.json();
          const expiresAt = watch?.expiration
            ? new Date(Number(watch.expiration)).toISOString()
            : new Date(Date.now() + ttlSeconds * 1000).toISOString();
          await supabase.from("instructor_google_service_calendar").update({
            webhook_channel_id: channelId,
            webhook_resource_id: watch?.resourceId ?? null,
            webhook_channel_token: channelToken,
            webhook_expires_at: expiresAt,
            webhook_last_error: null,
          }).eq("instructor_id", instructorId);
        } else {
          const errText = await watchRes.text();
          console.error("Webhook registration failed (non-fatal):", errText);
          await supabase.from("instructor_google_service_calendar")
            .update({ webhook_last_error: errText.slice(0, 500) })
            .eq("instructor_id", instructorId);
        }
      } catch (whErr) {
        console.error("Webhook registration threw (non-fatal):", whErr);
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

        // SAFE REPLACE: upsert fresh events, then prune only those that are
        // missing from this page. Never DELETE the whole mirror first — that
        // race-window caused reconcileLessons() to cancel real DSM lessons.
        const freshIds = allEvents.map((e: any) => e.id).filter(Boolean);

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

          // Prune rows that did NOT come back in this fetch. Only run when we
          // actually got events — an empty page may indicate a transient
          // upstream failure and must NOT wipe the mirror.
          if (freshIds.length > 0) {
            const { error: pruneError } = await supabase
              .from("instructor_calendar_events")
              .delete()
              .eq("instructor_id", instructorId)
              .not("external_event_id", "in", `(${freshIds.map((id: string) => `"${id}"`).join(",")})`);
            if (pruneError) console.error("Prune events error:", pruneError);
          }
        } else {
          console.warn(`[fetchExternalEvents] empty page for ${instructorId} — mirror left intact (safety guard).`);
        }

        // Import matching events as DSM lessons (skip + notify on unmatched name)
        let importStats = { imported: 0, updated: 0, unmatched: 0, skipped: 0 };
        try {
          importStats = await importExternalEventsAsLessons(
            supabase,
            instructorId,
            allEvents.map((e) => ({
              id: e.id,
              summary: e.summary,
              start: e.start,
              end: e.end,
              is_busy: e.is_busy ?? true,
              location: e.location,
            })),
          );
          console.log(`[fetchExternalEvents] import stats:`, importStats);
        } catch (e) {
          console.error("[fetchExternalEvents] import as lessons failed:", e);
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
          JSON.stringify({ success: true, synced: allEvents.length, import: importStats }),
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

          // SAFE REPLACE for cron path: upsert + prune, never full-delete.
          // An upstream blip must not blank the mirror and let reconcile()
          // mass-cancel real lessons.
          const freshIds = allEvents.map((e: any) => e.id).filter(Boolean);

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

            if (freshIds.length > 0) {
              await supabase
                .from("instructor_calendar_events")
                .delete()
                .eq("instructor_id", conn.instructor_id)
                .not("external_event_id", "in", `(${freshIds.map((id: string) => `"${id}"`).join(",")})`);
            }
          } else {
            console.warn(`[syncAllInstructors] empty page for ${conn.instructor_id} — mirror left intact (safety guard).`);
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
    // ========== syncManualBlock — push instructor_manual_blocks to Google ==========
    if (action === "syncManualBlock") {
      try {
        if (!instructorId) {
          return new Response(JSON.stringify({ error: "instructorId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: connection } = await supabase
          .from("instructor_google_service_calendar")
          .select("calendar_id, is_active")
          .eq("instructor_id", instructorId)
          .eq("is_active", true)
          .maybeSingle();

        if (!connection) {
          return new Response(JSON.stringify({ skipped: true, reason: "No Google Calendar connected" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const jwt = await generateJWT(serviceEmail, privateKey);
        const accessToken = await getAccessToken(jwt);

        const summary = `[Block] ${block?.title || block?.block_type || "Unavailable"}`;
        const description = block?.notes || `Manual block (${block?.block_type ?? "manual"})`;

        if (op === "delete") {
          if (googleEventIdParam) {
            try {
              await deleteEvent(accessToken, connection.calendar_id, googleEventIdParam);
            } catch (e) {
              console.error("[syncManualBlock] delete failed:", e);
              const { raiseSyncAlert } = await import("../_shared/raiseSyncAlert.ts");
              void raiseSyncAlert({
                category: "other", severity: "medium",
                title: "Manual block delete failed",
                message: String(e),
                instructorId, metadata: { blockId, googleEventId: googleEventIdParam, op: "delete" },
                supabase,
              });
            }
          }
          return new Response(JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (!block?.start_datetime || !block?.end_datetime) {
          return new Response(JSON.stringify({ error: "block.start_datetime and end_datetime required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (op === "update" && block.google_event_id) {
          try {
            await updateEvent(accessToken, connection.calendar_id, block.google_event_id, {
              summary, description,
              start: block.start_datetime, end: block.end_datetime,
            });
            return new Response(JSON.stringify({ success: true, eventId: block.google_event_id }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          } catch (e) {
            console.error("[syncManualBlock] update failed, falling back to create:", e);
            // fall through to create
          }
        }

        // create
        const newEventId = await createEvent(accessToken, connection.calendar_id, {
          summary, description,
          start: block.start_datetime, end: block.end_datetime,
        });

        await supabase
          .from("instructor_manual_blocks")
          .update({ google_event_id: newEventId })
          .eq("id", blockId);

        return new Response(JSON.stringify({ success: true, eventId: newEventId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err) {
        console.error("syncManualBlock error:", err);
        const { raiseSyncAlert } = await import("../_shared/raiseSyncAlert.ts");
        void raiseSyncAlert({
          category: "other", severity: "medium",
          title: "Manual block sync failed",
          message: String(err),
          instructorId: instructorId ?? null,
          metadata: { blockId, op },
          supabase,
        });
        return new Response(JSON.stringify({ error: String(err) }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ========== registerWebhook — events.watch for an instructor ==========
    if (action === "registerWebhook" || action === "renewWebhook") {
      try {
        if (!instructorId) {
          return new Response(JSON.stringify({ error: "instructorId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: connection } = await supabase
          .from("instructor_google_service_calendar")
          .select("calendar_id, webhook_channel_id, webhook_resource_id")
          .eq("instructor_id", instructorId)
          .eq("is_active", true)
          .maybeSingle();

        if (!connection) {
          return new Response(JSON.stringify({ skipped: true, reason: "Not connected" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const jwt = await generateJWT(serviceEmail, privateKey);
        const accessToken = await getAccessToken(jwt);

        // Best-effort stop existing channel
        if (connection.webhook_channel_id && connection.webhook_resource_id) {
          try {
            await fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({ id: connection.webhook_channel_id, resourceId: connection.webhook_resource_id }),
            });
          } catch { /* ignore */ }
        }

        const channelId = crypto.randomUUID();
        const channelToken = crypto.randomUUID();
        const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-webhook`;
        const ttlSeconds = 7 * 24 * 60 * 60; // 7 days

        const watchRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events/watch`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              id: channelId,
              type: "web_hook",
              address: webhookUrl,
              token: channelToken,
              params: { ttl: String(ttlSeconds) },
            }),
          }
        );

        if (!watchRes.ok) {
          const errText = await watchRes.text();
          const { raiseSyncAlert } = await import("../_shared/raiseSyncAlert.ts");
          void raiseSyncAlert({
            category: "webhook",
            severity: action === "renewWebhook" ? "critical" : "high",
            title: "Google Calendar webhook registration failed",
            message: errText.slice(0, 1500),
            instructorId,
            metadata: { status: watchRes.status },
            supabase,
          });
          await supabase.from("instructor_google_service_calendar")
            .update({ webhook_last_error: errText.slice(0, 500) })
            .eq("instructor_id", instructorId);
          return new Response(JSON.stringify({ success: false, error: errText }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const watch = await watchRes.json();
        const expiresAt = watch?.expiration
          ? new Date(Number(watch.expiration)).toISOString()
          : new Date(Date.now() + ttlSeconds * 1000).toISOString();

        await supabase.from("instructor_google_service_calendar")
          .update({
            webhook_channel_id: channelId,
            webhook_resource_id: watch?.resourceId ?? null,
            webhook_channel_token: channelToken,
            webhook_expires_at: expiresAt,
            webhook_last_error: null,
          })
          .eq("instructor_id", instructorId);

        return new Response(JSON.stringify({ success: true, channelId, expiresAt }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err) {
        console.error("registerWebhook error:", err);
        return new Response(JSON.stringify({ error: String(err) }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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