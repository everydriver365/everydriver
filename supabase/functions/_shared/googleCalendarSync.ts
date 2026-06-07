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
import { raiseSyncAlert } from "./raiseSyncAlert.ts";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// ---------------------------------------------------------------------------
// JWT / token helpers
// ---------------------------------------------------------------------------

function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function importPrivateKey(raw: string): Promise<CryptoKey> {
  let key = (raw ?? "").replace(/^\uFEFF/, "").trim();

  // Strip wrapping quotes (single or double).
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  // Accept a full service-account JSON blob.
  if (key.startsWith("{")) {
    try { key = (JSON.parse(key) as { private_key?: string }).private_key ?? key; } catch { /* ignore */ }
  }

  // Some hosts/UIs base64-encode the whole PEM. Detect and unwrap one layer.
  if (!key.includes("BEGIN") && /^[A-Za-z0-9+/=\s]+$/.test(key) && key.length > 200) {
    try {
      const decoded = atob(key.replace(/\s/g, ""));
      if (decoded.includes("BEGIN") && decoded.includes("PRIVATE KEY")) key = decoded;
    } catch { /* ignore */ }
  }

  const pem = key
    .replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/^"|"$/g, "").trim()
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, "")
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  if (!pem) throw new Error("GOOGLE_PRIVATE_KEY is empty — paste the service-account JSON or PEM block in Lovable Cloud secrets");

  const padded = pem + "=".repeat((4 - (pem.length % 4)) % 4);

  let der: Uint8Array;
  try {
    der = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  } catch {
    const msg = "GOOGLE_PRIVATE_KEY appears malformed — re-paste the service-account JSON or PEM block (escaped \\n and surrounding quotes are stripped automatically)";
    void raiseSyncAlert({
      category: "key_decode",
      severity: "critical",
      title: "GOOGLE_PRIVATE_KEY decode failed",
      message: msg,
      metadata: { keyLength: key.length, hasBegin: key.includes("BEGIN") },
    });
    throw new Error(msg);
  }

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
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) {
      void raiseSyncAlert({
        category: "auth_401",
        severity: "critical",
        title: "Google token exchange returned 401",
        message: body.slice(0, 1000),
      });
    } else if (res.status === 429) {
      void raiseSyncAlert({
        category: "rate_limit_429",
        severity: "high",
        title: "Google token exchange rate-limited",
        message: body.slice(0, 1000),
        metadata: { retryAfter: res.headers.get("Retry-After") },
      });
    }
    throw new Error(`Google token exchange failed (${res.status}): ${body}`);
  }
  return ((await res.json()) as { access_token: string }).access_token;
}

// In-memory token cache (one per Deno isolate). Avoids minting a new token
// on every request — tokens are valid 60 min, we cache for 50.
let _cached: { token: string; expiresAt: number } | null = null;

export function invalidateGoogleTokenCache(): void {
  _cached = null;
}

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

/**
 * fetch() wrapper that uses the service-account token and transparently
 * recovers from a 401 by invalidating the cache, re-minting once, and
 * retrying exactly once. Never loops.
 */
async function googleAuthedFetch(
  accessToken: string,
  url: string,
  init: RequestInit,
): Promise<{ res: Response; tokenUsed: string }> {
  const buildInit = (token: string): RequestInit => ({
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  });

  let res = await fetch(url, buildInit(accessToken));

  if (res.status === 429) {
    // Honour Retry-After (seconds), default 60s, cap at 120s to bound queue time.
    const ra = parseInt(res.headers.get("Retry-After") ?? "60", 10);
    const waitMs = Math.min(Math.max(Number.isFinite(ra) ? ra : 60, 1), 120) * 1000;
    await new Promise((r) => setTimeout(r, waitMs));

    res = await fetch(url, buildInit(accessToken));
    if (res.status === 429) {
      void raiseSyncAlert({
        category: "rate_limit_429",
        severity: "medium",
        title: "Google Calendar still 429 after backoff",
        message: `URL: ${url} — waited ${waitMs}ms then got 429 again.`,
        metadata: { retryAfter: res.headers.get("Retry-After"), url, waitMs },
      });
    }
    return { res, tokenUsed: accessToken };
  }


  if (res.status !== 401) return { res, tokenUsed: accessToken };

  // Force re-mint and retry exactly once.
  invalidateGoogleTokenCache();
  const fresh = await getServiceAccountAccessToken();
  res = await fetch(url, buildInit(fresh));

  if (res.status === 401) {
    void raiseSyncAlert({
      category: "auth_401",
      severity: "critical",
      title: "Google Calendar 401 after token refresh",
      message: `URL: ${url}. Service account may be revoked or calendar lost access.`,
      metadata: { url },
    });
  }

  return { res, tokenUsed: fresh };
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
  const { res } = await googleAuthedFetch(
    accessToken,
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  const { res } = await googleAuthedFetch(
    accessToken,
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
  const { res } = await googleAuthedFetch(
    accessToken,
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: "DELETE" },
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
      "google_event_id, deleted_at, pupils:pupil_id(name)",
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
    deleted_at: string | null;
    pupils: { name: string } | null;
  };

  const isRemoved = lesson.status === "cancelled" || lesson.deleted_at != null;

  if (lesson.awaiting_initial_payment && !isRemoved) {
    return { ok: false, skipped: true, reason: "awaiting-payment" };
  }
  if (isRemoved && !lesson.google_event_id) {
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

  // ── 3. Handle cancellation / soft-delete → delete on Google ────────────
  if (isRemoved && lesson.google_event_id) {
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
  //
  // CRITICAL: DSM stores lesson_date (YYYY-MM-DD) and start_time (HH:MM:SS)
  // as Europe/London wall-clock values. We must send them to Google as
  // *naive local datetime strings* + timeZone: "Europe/London". Sending a
  // UTC-converted ISO (with a `Z`) caused +1h drift on every BST sync cycle
  // because the next import reads back the shifted London-local time and
  // overwrites DSM.
  const startLocal = toLocalDateTimeString(lesson.lesson_date, lesson.start_time);
  const endLocal   = addMinutesToLocalDateTime(startLocal, Number(lesson.duration_minutes));
  const summary = `Driving Lesson - ${lesson.pupils?.name ?? "Pupil"}`;
  const description = [
    `Type: ${lesson.lesson_type ?? "driving"}`,
    lesson.notes ? `Notes: ${lesson.notes}` : null,
  ].filter(Boolean).join("\n");
  const location = lesson.pickup_location || lesson.pickup_postcode || undefined;

  const payload = { summary, description, start: startLocal, end: endLocal, location };

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
  // Mirror table is timestamptz — convert the London-local datetime to the
  // correct UTC instant for the storage column.
  const startUtcIso = londonLocalToUtcIso(startLocal);
  const endUtcIso   = londonLocalToUtcIso(endLocal);

  await supabase
    .from("scheduled_lessons")
    .update({ google_event_id: eventId, calendar_sync_status: "synced" })
    .eq("id", lessonId);

  await supabase.from("instructor_calendar_events").upsert(
    {
      instructor_id:    lesson.instructor_id,
      external_event_id: eventId,
      title:            summary,
      start_time:       startUtcIso,
      end_time:         endUtcIso,
      is_busy:          true,
      location:         location ?? null,
      description,
      synced_at:        new Date().toISOString(),
    },
    { onConflict: "instructor_id,external_event_id" },
  );

  return { ok: true, eventId };
}

// ---------------------------------------------------------------------------
// Local datetime helpers (Europe/London-safe, BST/GMT aware)
// ---------------------------------------------------------------------------

/** Build a naive local datetime string "YYYY-MM-DDTHH:MM:SS" from DSM
 *  lesson_date ("YYYY-MM-DD") and start_time ("HH:MM" or "HH:MM:SS"). */
function toLocalDateTimeString(lessonDate: string, startTime: string): string {
  const date = String(lessonDate).slice(0, 10);
  let time = String(startTime).slice(0, 8);
  if (time.length === 5) time = `${time}:00`;
  return `${date}T${time}`;
}

/** Add `minutes` to a naive local datetime string, preserving the
 *  "YYYY-MM-DDTHH:MM:SS" shape. Uses UTC math purely for arithmetic — the
 *  result is still a naive local string, not a UTC instant. */
function addMinutesToLocalDateTime(local: string, minutes: number): string {
  const [datePart, timePart] = local.split("T");
  const [Y, M, D] = datePart.split("-").map(Number);
  const [h, m, s] = timePart.split(":").map(Number);
  const base = Date.UTC(Y, (M ?? 1) - 1, D ?? 1, h ?? 0, m ?? 0, s ?? 0);
  const next = new Date(base + minutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}T${pad(next.getUTCHours())}:${pad(next.getUTCMinutes())}:${pad(next.getUTCSeconds())}`;
}

/** Convert a London-local naive datetime ("YYYY-MM-DDTHH:MM:SS") to the
 *  correct UTC ISO instant, honouring BST/GMT automatically. */
function londonLocalToUtcIso(local: string): string {
  const [datePart, timePart] = local.split("T");
  const [Y, M, D] = datePart.split("-").map(Number);
  const [h, m, s] = timePart.split(":").map(Number);
  const utcGuess = Date.UTC(Y, (M ?? 1) - 1, D ?? 1, h ?? 0, m ?? 0, s ?? 0);
  // Ask Intl what wall-clock London sees at `utcGuess`. The delta to the
  // requested local clock is London's UTC offset at that moment.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date(utcGuess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  let lH = get("hour"); if (lH === 24) lH = 0;
  const londonMs = Date.UTC(get("year"), get("month") - 1, get("day"), lH, get("minute"), get("second"));
  const offsetMs = londonMs - utcGuess; // London is ahead of UTC by this many ms
  return new Date(utcGuess - offsetMs).toISOString();
}
