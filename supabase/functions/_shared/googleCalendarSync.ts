// Shared Google Calendar sync helper.
//
// Used by:
//   - process-calendar-queue (async cron retry path)
//   - create-booking         (synchronous push for £0 bookings)
//   - confirm-booking        (synchronous push after payment)
//   - sync-lesson-now        (synchronous push for manual inserts)
//
// Source of truth: per mem://constraints/google-calendar-source-of-truth the
// availability engine only consults Google Calendar + manual blocks. Every
// scheduled_lessons row MUST therefore exist in the instructor's Google
// Calendar before we report "success" to the caller. syncLessonNow throws on
// Google API failure so the caller can roll back.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

// ── Crypto helpers ──────────────────────────────────────────────────────────

function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export async function importPrivateKey(rawPrivateKey: string): Promise<CryptoKey> {
  let keyInput = rawPrivateKey?.trim() ?? "";

  if (keyInput.startsWith("{") && keyInput.includes("private_key")) {
    try {
      const parsed = JSON.parse(keyInput) as { private_key?: string };
      if (parsed.private_key) keyInput = parsed.private_key;
    } catch {
      // Ignore parse errors, treat as raw key
    }
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

export async function generateJWT(serviceEmail: string, privateKey: string): Promise<string> {
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

export async function getAccessToken(jwt: string): Promise<string> {
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
    throw new Error(`Failed to get Google access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

// ── Cached service-account token (avoids minting one per lesson) ───────────

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getServiceAccountAccessToken(): Promise<string> {
  const serviceEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
  if (!serviceEmail || !privateKey) {
    throw new Error("Google service account credentials are not configured");
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const jwt = await generateJWT(serviceEmail, privateKey);
  const token = await getAccessToken(jwt);
  // Tokens are valid 1h. Keep ours for 50 min.
  cachedToken = { token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return token;
}

// ── Google Calendar REST helpers ────────────────────────────────────────────

interface GoogleEventInput {
  summary: string;
  description?: string;
  start: string; // ISO
  end: string;   // ISO
  location?: string;
}

interface GoogleEventResponse {
  id: string;
  htmlLink?: string;
}

export async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleEventInput
): Promise<GoogleEventResponse> {
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
    throw new Error(`Google: failed to create event (${response.status}): ${error}`);
  }

  const data = await response.json();
  return { id: data.id, htmlLink: data.htmlLink };
}

export async function updateGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<GoogleEventInput>
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
    throw new Error(`Google: failed to update event (${response.status}): ${error}`);
  }
}

export async function deleteGoogleEvent(
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
    throw new Error(`Google: failed to delete event (${response.status}): ${error}`);
  }
}

// ── High-level: push a single lesson now ────────────────────────────────────

export type SyncLessonResult =
  | { ok: true; eventId: string; htmlLink?: string }
  | { ok: false; skipped: true; reason: "no-calendar" | "awaiting-payment" | "cancelled-no-event" | "lesson-not-found" };

/**
 * Push a scheduled_lessons row to the instructor's Google Calendar immediately.
 *
 * - Returns { ok: true } on success and writes google_event_id +
 *   calendar_sync_status='synced' on the lesson row.
 * - Returns { ok: false, skipped: true } for benign no-ops (no calendar,
 *   awaiting payment, cancelled lesson without an event).
 * - THROWS on Google API failure. Callers MUST roll back the lesson row when
 *   they catch (or, for paid bookings where money is taken, mark
 *   calendar_sync_status='failed' and enqueue retry).
 */
export async function syncLessonNow(
  supabase: SupabaseClient,
  lessonId: string
): Promise<SyncLessonResult> {
  const { data: lessonRaw, error: lessonErr } = await supabase
    .from("scheduled_lessons")
    .select(
      "id, instructor_id, lesson_date, start_time, duration_minutes, lesson_type, pickup_location, pickup_postcode, notes, status, awaiting_initial_payment, google_event_id, pupils:pupil_id (name)"
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonErr) throw lessonErr;
  if (!lessonRaw) {
    return { ok: false, skipped: true, reason: "lesson-not-found" };
  }

  const lesson = lessonRaw as unknown as {
    id: string;
    instructor_id: string;
    lesson_date: string;
    start_time: string;
    duration_minutes: number;
    lesson_type: string | null;
    pickup_location: string | null;
    pickup_postcode: string | null;
    notes: string | null;
    status: string | null;
    awaiting_initial_payment: boolean | null;
    google_event_id: string | null;
    pupils: { name: string } | null;
  };

  // Awaiting initial payment — defer to confirm-booking flow.
  if (lesson.awaiting_initial_payment === true) {
    return { ok: false, skipped: true, reason: "awaiting-payment" };
  }

  // Cancelled lesson without an event — nothing to do.
  if (lesson.status === "cancelled" && !lesson.google_event_id) {
    return { ok: false, skipped: true, reason: "cancelled-no-event" };
  }

  // Locate instructor's calendar.
  const { data: calendarConfig } = await supabase
    .from("instructor_google_service_calendar")
    .select("calendar_id")
    .eq("instructor_id", lesson.instructor_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!calendarConfig?.calendar_id) {
    // Instructor has not connected Google. Record state and skip — there is
    // no Google data for them so the availability engine has nothing to
    // contradict.
    await supabase
      .from("scheduled_lessons")
      .update({ calendar_sync_status: "no-calendar" })
      .eq("id", lessonId);
    return { ok: false, skipped: true, reason: "no-calendar" };
  }

  const calendarId = calendarConfig.calendar_id as string;
  const accessToken = await getServiceAccountAccessToken();

  // Cancellation → delete event.
  if (lesson.status === "cancelled" && lesson.google_event_id) {
    await deleteGoogleEvent(accessToken, calendarId, lesson.google_event_id);
    await supabase
      .from("scheduled_lessons")
      .update({ google_event_id: null, calendar_sync_status: "synced" })
      .eq("id", lessonId);
    await supabase
      .from("instructor_calendar_events")
      .delete()
      .eq("instructor_id", lesson.instructor_id)
      .eq("external_event_id", lesson.google_event_id);
    return { ok: true, eventId: lesson.google_event_id };
  }

  // Build event payload.
  const startDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
  const endDateTime = new Date(startDateTime.getTime() + Number(lesson.duration_minutes) * 60000);
  const summary = `Driving Lesson - ${lesson.pupils?.name || "Pupil"}`;
  const description = `Lesson Type: ${lesson.lesson_type ?? "driving"}\nNotes: ${lesson.notes ?? "None"}`;
  const location = lesson.pickup_location || lesson.pickup_postcode || undefined;

  const eventDetails: GoogleEventInput = {
    summary,
    description,
    start: startDateTime.toISOString(),
    end: endDateTime.toISOString(),
    location,
  };

  // Idempotency: re-fetch event id at the last moment.
  const { data: fresh } = await supabase
    .from("scheduled_lessons")
    .select("google_event_id")
    .eq("id", lessonId)
    .maybeSingle();
  let eventId = fresh?.google_event_id || lesson.google_event_id;

  if (eventId) {
    try {
      await updateGoogleEvent(accessToken, calendarId, eventId, eventDetails);
    } catch {
      // Event vanished upstream — recreate.
      const created = await createGoogleEvent(accessToken, calendarId, eventDetails);
      eventId = created.id;
    }
  } else {
    const created = await createGoogleEvent(accessToken, calendarId, eventDetails);
    eventId = created.id;
  }

  // Persist mapping and mark synced.
  await supabase
    .from("scheduled_lessons")
    .update({ google_event_id: eventId, calendar_sync_status: "synced" })
    .eq("id", lessonId);

  // Mirror into instructor_calendar_events so the availability engine sees
  // this slot as busy immediately, without waiting for the next pull-sync.
  await supabase.from("instructor_calendar_events").upsert(
    {
      instructor_id: lesson.instructor_id,
      external_event_id: eventId,
      title: summary,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      is_busy: true,
      location: location ?? null,
      description,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "instructor_id,external_event_id" }
  );

  return { ok: true, eventId };
}
