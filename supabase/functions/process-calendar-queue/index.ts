import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

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
  status?: string;
  pupils?: { name: string; postcode?: string } | null;
}

// Base64url encode
function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

async function importPrivateKey(rawPrivateKey: string): Promise<CryptoKey> {
  let keyInput = rawPrivateKey?.trim() ?? "";

  if (keyInput.startsWith("{") && keyInput.includes("private_key")) {
    try {
      const parsed = JSON.parse(keyInput) as { private_key?: string };
      if (parsed.private_key) keyInput = parsed.private_key;
    } catch { /* keep original */ }
  }

  const normalizedKey = keyInput
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/^"|"$/g, "")
    .trim();

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
    throw new Error("Google private key is empty or invalid");
  }

  pemContents = pemContents.replace(/=+$/g, "");
  const paddedContents = pemContents + "=".repeat((4 - (pemContents.length % 4)) % 4);

  const binaryDer = Uint8Array.from(atob(paddedContents), (c) => c.charCodeAt(0));

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

async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: { summary: string; description?: string; start: string; end: string; location?: string }
): Promise<string> {
  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
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
  event: { summary?: string; description?: string; start?: string; end?: string; location?: string }
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (event.summary) updateData.summary = event.summary;
  if (event.description) updateData.description = event.description;
  if (event.location) updateData.location = event.location;
  if (event.start) updateData.start = { dateTime: event.start, timeZone: "Europe/London" };
  if (event.end) updateData.end = { dateTime: event.end, timeZone: "Europe/London" };

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
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
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
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
    const serviceEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!serviceEmail || !privateKey) {
      return new Response(
        JSON.stringify({ error: "Google service account not configured" }),
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
      .limit(50);

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

    // Deduplicate: group by lesson_id, keep only the latest entry per lesson
    const latestByLesson = new Map<string, QueueItem>();
    const duplicateIds: string[] = [];

    for (const item of queueItems as QueueItem[]) {
      const existing = latestByLesson.get(item.lesson_id);
      if (existing) {
        // Mark the older one as a duplicate
        duplicateIds.push(existing.id);
      }
      latestByLesson.set(item.lesson_id, item);
    }

    // Mark duplicates as processed immediately
    if (duplicateIds.length > 0) {
      console.log(`Marking ${duplicateIds.length} duplicate queue entries as processed`);
      for (const dupId of duplicateIds) {
        await supabase
          .from("calendar_sync_queue")
          .update({ processed_at: new Date().toISOString(), error: "Deduplicated" })
          .eq("id", dupId);
      }
    }

    const deduplicatedItems = Array.from(latestByLesson.values());
    console.log(`Processing ${deduplicatedItems.length} unique lessons (deduplicated from ${queueItems.length})`);

    // Get service account access token once for all items
    const jwt = await generateJWT(serviceEmail, privateKey);
    const accessToken = await getAccessToken(jwt);

    let successCount = 0;
    let errorCount = 0;

    for (const item of deduplicatedItems) {
      try {
        // Look up instructor's calendar ID from service account table
        const { data: calendarConfig } = await supabase
          .from("instructor_google_service_calendar")
          .select("calendar_id")
          .eq("instructor_id", item.instructor_id)
          .eq("is_active", true)
          .maybeSingle();

        if (!calendarConfig) {
          await supabase
            .from("calendar_sync_queue")
            .update({ processed_at: new Date().toISOString(), error: "No calendar connected" })
            .eq("id", item.id);
          continue;
        }

        const calendarId = calendarConfig.calendar_id;

        if (item.action === "syncLesson") {
          const { data: lessonRaw } = await supabase
            .from("scheduled_lessons")
            .select(`*, pupils:pupil_id (name, postcode)`)
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

          // If lesson is cancelled, delete from Google Calendar instead of syncing
          if (lesson.status === "cancelled" && lesson.google_event_id) {
            try {
              await deleteGoogleEvent(accessToken, calendarId, lesson.google_event_id);
              await supabase
                .from("scheduled_lessons")
                .update({ google_event_id: null })
                .eq("id", item.lesson_id);
              console.log(`Deleted cancelled lesson ${item.lesson_id} from Google Calendar`);
            } catch (delErr) {
              console.error(`Failed to delete cancelled lesson ${item.lesson_id}:`, delErr);
            }
            await supabase
              .from("calendar_sync_queue")
              .update({ processed_at: new Date().toISOString() })
              .eq("id", item.id);
            continue;
          }

          const startDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
          let totalDuration = lesson.duration_minutes;
          let travelNote = "";

          // Check smart buffer settings to extend event with travel time
          try {
            const { data: instrSettings } = await supabase
              .from("instructors")
              .select("smart_buffer_enabled, smart_buffer_mode, smart_buffer_padding_minutes, buffer_minutes")
              .eq("id", item.instructor_id)
              .single();

            const s = instrSettings as any;
            if (s?.smart_buffer_enabled && s.smart_buffer_mode !== "flat" && lesson.pupils?.postcode) {
              // Find the next lesson on the same day to calculate travel buffer
              const { data: nextLessons } = await supabase
                .from("scheduled_lessons")
                .select("start_time, pupils:pupil_id (postcode)")
                .eq("instructor_id", item.instructor_id)
                .eq("lesson_date", lesson.lesson_date)
                .neq("id", lesson.id)
                .neq("status", "cancelled")
                .gt("start_time", lesson.start_time)
                .order("start_time")
                .limit(1);

              const nextLesson = nextLessons?.[0] as any;
              const nextPostcode = nextLesson?.pupils?.postcode;

              if (nextPostcode && lesson.pupils?.postcode) {
                const tomtomApiKey = Deno.env.get("TOMTOM_API_KEY");
                if (tomtomApiKey) {
                  // Geocode postcodes
                  const cleanFrom = lesson.pupils.postcode.replace(/\s+/g, "").toUpperCase();
                  const cleanTo = nextPostcode.replace(/\s+/g, "").toUpperCase();
                  const geoRes = await fetch("https://api.postcodes.io/postcodes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ postcodes: [cleanFrom, cleanTo] }),
                  });
                  if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    const fromResult = geoData.result?.[0]?.result;
                    const toResult = geoData.result?.[1]?.result;
                    if (fromResult && toResult) {
                      const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${fromResult.latitude},${fromResult.longitude}:${toResult.latitude},${toResult.longitude}/json?key=${tomtomApiKey}&traffic=true`;
                      const routeRes = await fetch(routeUrl);
                      if (routeRes.ok) {
                        const routeData = await routeRes.json();
                        const travelMins = Math.round((routeData.routes?.[0]?.summary?.travelTimeInSeconds || 0) / 60);
                        const padding = s.smart_buffer_mode === "travel_time_plus" ? (s.smart_buffer_padding_minutes || 0) : 0;
                        const bufferMins = travelMins + padding;
                        if (bufferMins > 0) {
                          totalDuration += bufferMins;
                          travelNote = `\n🚗 Travel buffer: ${bufferMins} min (${travelMins} min drive${padding ? ` + ${padding} min padding` : ""})`;
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (bufferErr) {
            console.error("Smart buffer calc error (non-fatal):", bufferErr);
          }

          const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000);

          const eventDetails = {
            summary: `Driving Lesson - ${lesson.pupils?.name || "Pupil"}`,
            description: `Lesson Type: ${lesson.lesson_type}\nNotes: ${lesson.notes || "None"}${travelNote}`,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            location: lesson.pickup_location || lesson.pickup_postcode,
          };

          // Idempotency check: re-fetch google_event_id fresh to prevent race conditions
          const { data: freshLesson } = await supabase
            .from("scheduled_lessons")
            .select("google_event_id")
            .eq("id", item.lesson_id)
            .maybeSingle();

          let googleEventId = freshLesson?.google_event_id || lesson.google_event_id;

          if (googleEventId) {
            try {
              await updateGoogleEvent(accessToken, calendarId, googleEventId, eventDetails);
            } catch {
              googleEventId = await createGoogleEvent(accessToken, calendarId, eventDetails);
            }
          } else {
            googleEventId = await createGoogleEvent(accessToken, calendarId, eventDetails);
          }

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
              await deleteGoogleEvent(accessToken, calendarId, lesson.google_event_id);
              console.log(`Deleted lesson ${item.lesson_id} from Google Calendar`);
            } catch (err) {
              console.log("Event already deleted:", err);
            }
          }
        }

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
            error: err instanceof Error ? err.message : "Unknown error",
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
