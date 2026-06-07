// Sync Health Stats — aggregates Google Calendar sync status across all
// connected instructors plus cron job health, in a single call.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authn: require an admin user
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdminRow } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdminRow) return json({ error: "Forbidden" }, 403);

    // 1) Per-instructor connection rows
    const { data: cals, error: calsErr } = await admin
      .from("instructor_google_service_calendar")
      .select(
        "instructor_id, is_active, last_sync, sync_error, webhook_channel_id, webhook_expires_at, webhook_last_error, calendar_id, updated_at",
      );
    if (calsErr) throw calsErr;

    const instructorIds = (cals ?? []).map((c) => c.instructor_id);
    const { data: instructors } = instructorIds.length
      ? await admin
          .from("instructors")
          .select("id, name")
          .in("id", instructorIds)
      : { data: [] as any[] };
    const nameById = new Map((instructors ?? []).map((i: any) => [i.id, i.name]));

    // 2) Queue counts per instructor
    const { data: queueRows } = await admin
      .from("calendar_sync_queue")
      .select("instructor_id, processed_at, error")
      .limit(5000);

    const queueByInstructor = new Map<string, { pending: number; failed: number }>();
    for (const q of queueRows ?? []) {
      const k = q.instructor_id as string;
      const cur = queueByInstructor.get(k) ?? { pending: 0, failed: 0 };
      if (!q.processed_at) cur.pending++;
      else if (q.error && q.error !== "Deduplicated") cur.failed++;
      queueByInstructor.set(k, cur);
    }

    const now = Date.now();
    const rows = (cals ?? []).map((c) => {
      const lastSyncMs = c.last_sync ? new Date(c.last_sync).getTime() : null;
      const webhookExpMs = c.webhook_expires_at
        ? new Date(c.webhook_expires_at).getTime()
        : null;
      const q = queueByInstructor.get(c.instructor_id) ?? { pending: 0, failed: 0 };
      return {
        instructor_id: c.instructor_id,
        instructor_name: nameById.get(c.instructor_id) ?? "Unknown",
        is_active: c.is_active,
        calendar_id: c.calendar_id,
        last_sync: c.last_sync,
        last_sync_age_minutes: lastSyncMs
          ? Math.round((now - lastSyncMs) / 60000)
          : null,
        sync_error: c.sync_error,
        webhook_channel_id: c.webhook_channel_id,
        webhook_expires_at: c.webhook_expires_at,
        webhook_hours_to_expiry: webhookExpMs
          ? Math.round((webhookExpMs - now) / 3600000)
          : null,
        webhook_last_error: c.webhook_last_error,
        queue_pending: q.pending,
        queue_failed: q.failed,
      };
    });

    // 3) Summary
    const summary = {
      total: rows.length,
      stale: rows.filter((r) => r.last_sync_age_minutes != null && r.last_sync_age_minutes > 30).length,
      webhook_expiring: rows.filter(
        (r) => r.webhook_hours_to_expiry != null && r.webhook_hours_to_expiry < 24,
      ).length,
      with_error: rows.filter((r) => r.sync_error || r.webhook_last_error).length,
      queue_pending_total: rows.reduce((a, r) => a + r.queue_pending, 0),
      queue_failed_total: rows.reduce((a, r) => a + r.queue_failed, 0),
    };

    // 4) Cron job health (via SECURITY DEFINER RPC; falls back to empty)
    let cron: any[] = [];
    try {
      const { data: cronData } = await admin.rpc("get_sync_cron_health");
      if (Array.isArray(cronData)) cron = cronData;
    } catch (_) { /* RPC may not exist yet */ }

    return json({ summary, rows, cron, generated_at: new Date().toISOString() });
  } catch (e) {
    console.error("[sync-health-stats] error:", e);
    return json({ error: (e as Error)?.message || "Internal error" }, 500);
  }
});
