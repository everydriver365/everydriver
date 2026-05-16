// =============================================================================
// googleCalendarSync.ts  —  Shared Google Calendar helper (Deno / Edge Functions)
// =============================================================================
//
// Deploy as: supabase/functions/_shared/googleCalendarSync.ts
//
// Used by:
//   - process-calendar-queue   (async cron retry path)
//   - create-booking           (sync push for £0 bookings)
//   - confirm-booking          (sync push after payment clears)
//   - sync-lesson-now          (sync push for manual inserts)
// =============================================================================

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// ---------------------------------------------------------------------------
// JWT / token helpers
// ---------------------------------------------------------------------------

function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function importPrivateKey(raw: string): Promise<CryptoKey> {
  let key = raw?.trim() ?? "";

  // Accept a full service-account JSON blob.
  if (key.startsWith("{")) {
    try { key = (JSON.parse(key) as { private_key?: string }).private_key ?? key; } catch { /* ignore */ }
  }

  const pem = key
    .replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/^"|"$/g, "").trim()
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, "")
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  if (!pem) throw new Error("Google private key is empty or invalid");

  const padded = pem + "=".repeat((4 - (pem.length % 4)) % 4);
  const der    = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8", der.buffer as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"],
  );
}

export async function generateJWT(email: string, privateKey: string): Promise<string> {
  const now     = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const header  = base64url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims  = base64url(encoder.encode(JSON.stringify({
    iss: email, sub: email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
    scope: "https://www.googleapis.com/auth/calendar",
  })));
  const toSign = `${header}.${claims}`;
  const key    = await importPrivateKey(privateKey);
  const sig    = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    encoder.encode(toSign).buffer as ArrayBuffer,
  );
  return `${toSign}.${base64url(new Uint8Array(sig))}`;
}

export async function getAccessToken(jwt: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

// In-memory token cache (one per Deno isolate). Avoids minting a new token
// on every request — tokens are valid 60 min, we cache for 50.
let _cached: { token: string; expiresAt: number } | null = null;

export async function getServiceAccountAccessToken(): Promise<string> {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const key   = Deno.env.get("GOOGLE_PRIVATE_KEY");
  if (!email || !key) throw new Error("Google service account credentials not configured");
  if (_cached && _cached.expiresAt > Date.now() + 60_000) return _cached.token;
  const jwt   = await generateJWT(email, key);
  const token = await getAccessToken(jwt);
  _cached = { token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return token;
}

// ---------------------------------------------------------------------------
// Calendar REST helpers
// ---------------------------------------------------------------------------

export interface GoogleEventInput {
  summary: string;
  description?: string;
  start: string;    // ISO
  end: string;      // ISO
  location?: string;
}

export async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleEventInput,
): Promise<{ id: string; htmlLink?: string }> {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary:     event.summary,
        description: event.description,
        location:    event.location,
        start: { dateTime: event.start, timeZone: "Europe/London" },
        end:   { dateTime: event.end,   timeZone: "Europe/London" },
      }),
    },
  );
  if (!res.ok) throw new Error(`Google create event failed (${res.status}): ${await res.text()}`);
  const d = await res.json() as { id: string; htmlLink?: string };
  return { id: d.id, htmlLink: d.htmlLink };
}

export async function updateGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<GoogleEventInput>,
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (event.summary)     body.summary     = event.summary;
  if (event.description) body.description = event.description;
  if (event.location)    body.location    = event.location;
  if (event.start)       body.start = { dateTime: event.start, timeZone: "Europe/London" };
  if (event.end)         body.end   = { dateTime: event.end,   timeZone: "Europe/London" };

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`Google update event failed (${res.status}): ${await res.text()}`);
}

export async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Google delete event failed (${res.status}): ${await res.text()}`);
  }
}

// ---------------------------------------------------------------------------
// High-level: push a single lesson to Google Calendar now
// ---------------------------------------------------------------------------

export type SyncLessonResult =
  | { ok: true;  eventId: string; htmlLink?: string }
  | { ok: false; skipped: true;   reason: "no-calendar" | "awaiting-payment" | "cancelled-no-event" | "lesson-not-found" };

/**
 * Push a scheduled_lessons row to the instructor's Google Calendar.
 *
 * - Returns { ok: true }  on success; writes google_event_id + status='synced'.
 * - Returns { ok: false, skipped: true } for benign no-ops.
 * - THROWS on Google API failure. Callers must roll back or mark 'failed'
 *   and enqueue a retry.
 */
export async function syncLessonNow(
  supabase: SupabaseClient,
  lessonId: string,
): Promise<SyncLessonResult> {
  // ── 1. Load lesson ──────────────────────────────────────────────────────
  const { data: raw, error } = await supabase
    .from("scheduled_lessons")
    .select(
      "id, instructor_id, lesson_date, start_time, duration_minutes, lesson_type, " +
      "pickup_location, pickup_postcode, notes, status, awaiting_initial_payment, " +
      "google_event_id, pupils:pupil_id(name)",
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (error) throw error;
  if (!raw)  return { ok: false, skipped: true, reason: "lesson-not-found" };

  const lesson = raw as {
    id: string; instructor_id: string; lesson_date: string; start_time: string;
    duration_minutes: number; lesson_type: string | null;
    pickup_location: string | null; pickup_postcode: string | null;
    notes: string | null; status: string | null;
    awaiting_initial_payment: boolean | null;
    google_event_id: string | null;
    pupils: { name: string } | null;
  };

  if (lesson.awaiting_initial_payment) return { ok: false, skipped: true, reason: "awaiting-payment" };
  if (lesson.status === "cancelled" && !lesson.google_event_id) {
    return { ok: false, skipped: true, reason: "cancelled-no-event" };
  }

  // ── 2. Find instructor calendar ─────────────────────────────────────────
  const { data: cal } = await supabase
    .from("instructor_google_service_calendar")
    .select("calendar_id")
    .eq("instructor_id", lesson.instructor_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!cal?.calendar_id) {
    await supabase
      .from("scheduled_lessons")
      .update({ calendar_sync_status: "no-calendar" })
      .eq("id", lessonId);
    return { ok: false, skipped: true, reason: "no-calendar" };
  }

  const calendarId   = cal.calendar_id as string;
  const accessToken  = await getServiceAccountAccessToken();

  // ── 3. Handle cancellation → delete ────────────────────────────────────
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

  // ── 4. Build event payload ──────────────────────────────────────────────
  const startDt = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
  const endDt   = new Date(startDt.getTime() + Number(lesson.duration_minutes) * 60_000);
  const summary = `Driving Lesson - ${lesson.pupils?.name ?? "Pupil"}`;
  const description = [
    `Type: ${lesson.lesson_type ?? "driving"}`,
    lesson.notes ? `Notes: ${lesson.notes}` : null,
  ].filter(Boolean).join("\n");
  const location = lesson.pickup_location || lesson.pickup_postcode || undefined;

  const payload = { summary, description, start: startDt.toISOString(), end: endDt.toISOString(), location };

  // ── 5. Re-fetch event id to guard against races ─────────────────────────
  const { data: fresh } = await supabase
    .from("scheduled_lessons").select("google_event_id").eq("id", lessonId).maybeSingle();
  let eventId = fresh?.google_event_id || lesson.google_event_id;

  if (eventId) {
    try {
      await updateGoogleEvent(accessToken, calendarId, eventId, payload);
    } catch {
      // Event was deleted upstream — recreate.
      const created = await createGoogleEvent(accessToken, calendarId, payload);
      eventId = created.id;
    }
  } else {
    const created = await createGoogleEvent(accessToken, calendarId, payload);
    eventId = created.id;
  }

  // ── 6. Persist mapping + mirror to availability table ──────────────────
  await supabase
    .from("scheduled_lessons")
    .update({ google_event_id: eventId, calendar_sync_status: "synced" })
    .eq("id", lessonId);

  await supabase.from("instructor_calendar_events").upsert(
    {
      instructor_id:    lesson.instructor_id,
      external_event_id: eventId,
      title:            summary,
      start_time:       startDt.toISOString(),
      end_time:         endDt.toISOString(),
      is_busy:          true,
      location:         location ?? null,
      description,
      synced_at:        new Date().toISOString(),
    },
    { onConflict: "instructor_id,external_event_id" },
  );

  return { ok: true, eventId };
}
