// Shared notification gate. Every server-side push/notification sender should
// run through `shouldSendToInstructor` so per-instructor preferences (cadence,
// quiet hours, category mutes, smart filters) actually take effect.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type NotifyCategory = "test_swap" | "message" | "job" | "system" | "lesson";
export type NotifyChannel = "push" | "email" | "sms";
export type NotifyImportance = "normal" | "important";

export interface GateInput {
  category: NotifyCategory;
  channel?: NotifyChannel;
  importance?: NotifyImportance;
  pupilId?: string;
  jobValue?: number;
}

export interface GateResult {
  allow: boolean;
  reason?: string;
  defer_until?: string; // ISO timestamp
}

interface Settings {
  delivery_cadence: "real_time" | "hourly" | "daily" | "important_only";
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:mm or HH:mm:ss
  quiet_hours_end: string;
  category_mutes: Record<string, boolean>;
  notification_rules: {
    job_min_value_enabled?: boolean;
    job_min_value_pounds?: number;
    dedupe_repeat_sender?: boolean;
  };
}

const cache = new Map<string, { settings: Settings | null; at: number }>();
const TTL_MS = 30_000;

async function loadSettings(supabase: SupabaseClient, instructorId: string): Promise<Settings | null> {
  const hit = cache.get(instructorId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.settings;
  const { data } = await supabase
    .from("instructor_notification_settings")
    .select("delivery_cadence,quiet_hours_enabled,quiet_hours_start,quiet_hours_end,category_mutes,notification_rules")
    .eq("instructor_id", instructorId)
    .maybeSingle();
  const s = (data as Settings | null) ?? null;
  cache.set(instructorId, { settings: s, at: Date.now() });
  return s;
}

function ukNowParts(): { mins: number } {
  // Render the current UTC instant in Europe/London and turn HH:mm into mins.
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const [hh, mm] = f.format(new Date()).split(":").map(Number);
  return { mins: hh * 60 + mm };
}

function hhmmToMins(s: string): number {
  const [h, m] = s.slice(0, 5).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function inQuietWindow(startStr: string, endStr: string): boolean {
  const now = ukNowParts().mins;
  const start = hhmmToMins(startStr);
  const end = hhmmToMins(endStr);
  if (start === end) return false;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end; // wraps midnight
}

function nextDeliverAt(cadence: "hourly" | "daily"): string {
  const d = new Date();
  if (cadence === "hourly") {
    d.setUTCMinutes(0, 0, 0);
    d.setUTCHours(d.getUTCHours() + 1);
  } else {
    // Next 07:00 UK → approximate to UTC (DST handled approximately; cron
    // worker re-checks against `deliver_at <= now()` so drift is harmless).
    d.setUTCHours(7, 0, 0, 0);
    if (d.getTime() <= Date.now()) d.setUTCDate(d.getUTCDate() + 1);
  }
  return d.toISOString();
}

export async function shouldSendToInstructor(
  supabase: SupabaseClient,
  instructorId: string,
  input: GateInput,
): Promise<GateResult> {
  if (!instructorId) return { allow: true };
  const settings = await loadSettings(supabase, instructorId);
  if (!settings) return { allow: true }; // no row = defaults = real-time, allow

  const channel = input.channel ?? "push";
  const importance = input.importance ?? "normal";

  // Category mute
  if (settings.category_mutes?.[input.category]) {
    return { allow: false, reason: "category_muted" };
  }

  // Smart: minimum job value
  if (
    input.category === "job" &&
    settings.notification_rules?.job_min_value_enabled &&
    typeof input.jobValue === "number" &&
    input.jobValue < (settings.notification_rules.job_min_value_pounds ?? 0)
  ) {
    return { allow: false, reason: "job_below_min_value" };
  }

  // Smart: dedupe repeat sender (messages from same pupil within 60 min)
  if (
    input.category === "message" &&
    settings.notification_rules?.dedupe_repeat_sender !== false &&
    input.pupilId
  ) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("instructor_notifications")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorId)
      .eq("type", "message")
      .gte("created_at", since)
      .contains("metadata", { pupil_id: input.pupilId });
    if ((count ?? 0) > 0) return { allow: false, reason: "deduped_repeat_sender" };
  }

  // Important-only cadence: drop normal-importance messages
  if (settings.delivery_cadence === "important_only" && importance !== "important") {
    return { allow: false, reason: "important_only" };
  }

  // Hourly / daily cadence: defer non-important sends
  if (
    (settings.delivery_cadence === "hourly" || settings.delivery_cadence === "daily") &&
    importance !== "important"
  ) {
    return { allow: false, reason: "deferred", defer_until: nextDeliverAt(settings.delivery_cadence) };
  }

  // Quiet hours: silence push only (other channels still send; inbox row should
  // still be written by callers).
  if (channel === "push" && settings.quiet_hours_enabled && importance !== "important") {
    if (inQuietWindow(settings.quiet_hours_start, settings.quiet_hours_end)) {
      return { allow: false, reason: "quiet_hours" };
    }
  }

  return { allow: true };
}

// Convenience helper for callers that want to enqueue a deferred send.
export async function enqueueOutbox(
  supabase: SupabaseClient,
  row: {
    instructor_id: string;
    category: NotifyCategory;
    importance?: NotifyImportance;
    title?: string;
    body?: string;
    payload?: Record<string, unknown>;
    deliver_at: string;
  },
): Promise<void> {
  await supabase.from("notification_outbox").insert({
    instructor_id: row.instructor_id,
    category: row.category,
    importance: row.importance ?? "normal",
    title: row.title,
    body: row.body,
    payload: row.payload ?? {},
    deliver_at: row.deliver_at,
  });
}

export function makeServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
