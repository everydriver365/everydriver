// =============================================================================
// raiseSyncAlert.ts — Admin alerting for Google Calendar sync failures
// =============================================================================
//
// Wrapped in try/catch internally so a logging/alerting failure NEVER
// breaks the calling sync code. Calls public.raise_google_sync_alert which
// deduplicates unresolved alerts by (category, instructor_id, lesson_id)
// and increments occurrence_count on repeat.
//
// Side effects:
//   - critical + high → email admin via send-transactional-email
//   - critical        → push to admin via notify-instructor (admin user)
// =============================================================================

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AlertSeverity = "critical" | "high" | "medium";
export type AlertCategory =
  | "key_decode"
  | "auth_401"
  | "rate_limit_429"
  | "webhook"
  | "orphan_lesson"
  | "queue_stuck"
  | "service_account_missing"
  | "other";

export interface RaiseAlertArgs {
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  instructorId?: string | null;
  lessonId?: string | null;
  metadata?: Record<string, unknown>;
  /** Optional supabase client. If omitted, a service-role client is built from env. */
  supabase?: SupabaseClient;
}

const ADMIN_EMAIL = Deno.env.get("ADMIN_ALERT_EMAIL") ?? "";

function getServiceClient(): SupabaseClient | null {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return null;
    return createClient(url, key);
  } catch {
    return null;
  }
}

/**
 * Insert (or increment) an admin alert and dispatch email/push side-effects.
 * Never throws. Returns true if the alert row was upserted successfully.
 */
export async function raiseSyncAlert(args: RaiseAlertArgs): Promise<boolean> {
  try {
    const supabase = args.supabase ?? getServiceClient();
    if (!supabase) {
      console.error("[raiseSyncAlert] no supabase client available");
      return false;
    }

    const { data, error } = await supabase.rpc("raise_google_sync_alert", {
      p_category: args.category,
      p_severity: args.severity,
      p_title: args.title,
      p_message: args.message.slice(0, 2000),
      p_instructor_id: args.instructorId ?? null,
      p_lesson_id: args.lessonId ?? null,
      p_metadata: args.metadata ?? {},
    });

    if (error) {
      console.error("[raiseSyncAlert] rpc error:", error.message);
      return false;
    }

    const alertId = data as string | null;

    // ── Side effects: email + push ────────────────────────────────────────
    void dispatchSideEffects(args, alertId).catch((e) =>
      console.error("[raiseSyncAlert] side effect failed:", e),
    );

    return true;
  } catch (err) {
    console.error("[raiseSyncAlert] unexpected error:", err);
    return false;
  }
}

async function dispatchSideEffects(args: RaiseAlertArgs, alertId: string | null): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return;

  // Email for critical + high
  if ((args.severity === "critical" || args.severity === "high") && ADMIN_EMAIL) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          to: ADMIN_EMAIL,
          subject: `[${args.severity.toUpperCase()}] Google Calendar sync: ${args.title}`,
          html: `
            <h2>Google Calendar sync alert</h2>
            <p><strong>Severity:</strong> ${args.severity}</p>
            <p><strong>Category:</strong> ${args.category}</p>
            <p><strong>Title:</strong> ${escapeHtml(args.title)}</p>
            <p><strong>Message:</strong></p>
            <pre style="background:#f4f4f4;padding:12px;border-radius:6px;white-space:pre-wrap;">${escapeHtml(args.message)}</pre>
            ${args.instructorId ? `<p><strong>Instructor:</strong> ${args.instructorId}</p>` : ""}
            ${args.lessonId ? `<p><strong>Lesson:</strong> ${args.lessonId}</p>` : ""}
            ${alertId ? `<p><strong>Alert ID:</strong> ${alertId}</p>` : ""}
            <p><a href="https://everydriver.lovable.app/admin?section=google-sync-alerts">Open admin panel →</a></p>
          `,
          purpose: "transactional",
          template_name: "google-sync-alert",
          idempotency_key: alertId ? `google-sync-alert-${alertId}` : undefined,
        }),
      });
    } catch (e) {
      console.error("[raiseSyncAlert] email dispatch failed:", e);
    }
  }

  // Push for critical only — uses notify-instructor with admin user lookup
  if (args.severity === "critical") {
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          audience: "admins",
          title: `🚨 Google Calendar: ${args.title}`,
          body: args.message.slice(0, 200),
          data: { alertId, category: args.category, severity: args.severity },
        }),
      });
    } catch (e) {
      console.error("[raiseSyncAlert] push dispatch failed:", e);
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
