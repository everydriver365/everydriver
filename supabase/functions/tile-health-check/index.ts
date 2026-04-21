// Daily/hot health check for instructor dashboard tile data sources.
// Writes pass/fail/latency rows to tile_health_checks and manages
// instructor_health_alerts (open on fail, auto-resolve on ok).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Status = "ok" | "warn" | "fail";
type CheckResult = {
  source: string;
  status: Status;
  latency_ms: number;
  details?: Record<string, unknown>;
  message?: string;
};

const TIMEOUT_MS = 5000;

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T | null; ms: number; error: string | null }> {
  const start = Date.now();
  try {
    const value = await Promise.race([
      fn(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), TIMEOUT_MS)),
    ]);
    return { value, ms: Date.now() - start, error: null };
  } catch (e) {
    return { value: null, ms: Date.now() - start, error: (e as Error).message };
  }
}

function isoWeekStart(d = new Date()): string {
  const date = new Date(d);
  const day = (date.getUTCDay() + 6) % 7; // Mon=0
  date.setUTCDate(date.getUTCDate() - day);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

async function runInstructorChecks(svc: ReturnType<typeof createClient>, instructorId: string, mode: "full" | "hot"): Promise<CheckResult[]> {
  const today = new Date().toISOString().slice(0, 10);
  const checks: CheckResult[] = [];

  // 1. Scheduled lessons today
  const lessons = await timed(() => svc.from("scheduled_lessons")
    .select("id", { count: "exact", head: true })
    .eq("instructor_id", instructorId)
    .eq("lesson_date", today));
  checks.push({
    source: "scheduled_lessons",
    status: lessons.error ? "fail" : "ok",
    latency_ms: lessons.ms,
    message: lessons.error ?? undefined,
  });

  // 4. Messages (unread)
  const msgs = await timed(() => svc.from("messages")
    .select("id", { count: "exact", head: true })
    .eq("instructor_id", instructorId)
    .is("read_at", null));
  checks.push({
    source: "messages",
    status: msgs.error ? "fail" : "ok",
    latency_ms: msgs.ms,
    message: msgs.error ?? undefined,
  });

  // 3. Payments this week
  const paymts = await timed(() => svc.from("payment_history")
    .select("amount")
    .eq("instructor_id", instructorId)
    .gte("created_at", isoWeekStart()));
  checks.push({
    source: "payment_history",
    status: paymts.error ? "fail" : "ok",
    latency_ms: paymts.ms,
    message: paymts.error ?? undefined,
  });

  if (mode === "full") {
    // 2. Pupils + balances
    const pupils = await timed(() => svc.from("pupils")
      .select("id, account_balance")
      .eq("instructor_id", instructorId)
      .is("deleted_at", null));
    checks.push({
      source: "pupils",
      status: pupils.error ? "fail" : "ok",
      latency_ms: pupils.ms,
      message: pupils.error ?? undefined,
    });

    // 5. Job offers
    const jobs = await timed(() => svc.from("course_enquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"));
    checks.push({
      source: "course_enquiries",
      status: jobs.error ? "fail" : "ok",
      latency_ms: jobs.ms,
      message: jobs.error ?? undefined,
    });

    // 7. Calendar sync queue backlog
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const queue = await timed(() => svc.from("calendar_sync_queue")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorId)
      .is("processed_at", null)
      .lt("created_at", oneHourAgo));
    const backlog = (queue.value as any)?.count ?? 0;
    checks.push({
      source: "calendar_sync_queue",
      status: queue.error ? "fail" : backlog > 50 ? "warn" : "ok",
      latency_ms: queue.ms,
      details: { backlog },
      message: queue.error ?? undefined,
    });
  }

  return checks;
}

async function runGlobalChecks(svc: ReturnType<typeof createClient>): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  // 9. Payment gateways (uses existing function)
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-health`;
  const ph = await timed(async () => {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        "Content-Type": "application/json",
      },
    });
    return await r.json();
  });
  checks.push({
    source: "payment_gateways",
    status: ph.error ? "fail" : "ok",
    latency_ms: ph.ms,
    details: ph.value as any,
    message: ph.error ?? undefined,
  });

  // 10. Telematics poller — last GPS point within 10 min globally
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const tel = await timed(() => svc.from("telematics_gps_points")
    .select("recorded_at")
    .gte("recorded_at", tenMinAgo)
    .order("recorded_at", { ascending: false })
    .limit(1));
  // warn only if there are active sessions but no recent points
  const activeSessions = await timed(() => svc.from("lesson_telematics")
    .select("id", { count: "exact", head: true })
    .is("ended_at", null));
  const hasActive = ((activeSessions.value as any)?.count ?? 0) > 0;
  const hasRecent = ((tel.value as any)?.data?.length ?? (tel.value as any)?.length ?? 0) > 0;
  checks.push({
    source: "telematics_poller",
    status: tel.error ? "fail" : hasActive && !hasRecent ? "warn" : "ok",
    latency_ms: tel.ms,
    details: { hasActive, hasRecent },
    message: tel.error ?? undefined,
  });

  return checks;
}

async function persist(svc: ReturnType<typeof createClient>, instructorId: string | null, results: CheckResult[]) {
  if (results.length === 0) return;
  await svc.from("tile_health_checks").insert(
    results.map((r) => ({
      instructor_id: instructorId,
      source: r.source,
      status: r.status,
      latency_ms: r.latency_ms,
      details: r.details ?? null,
    })),
  );

  for (const r of results) {
    if (r.status === "ok") {
      await svc.from("instructor_health_alerts")
        .update({ resolved_at: new Date().toISOString() })
        .eq("source", r.source)
        .is("resolved_at", null)
        .filter("instructor_id", instructorId === null ? "is" : "eq", instructorId === null ? null : instructorId);
    } else {
      // open new alert if none exists
      const { data: existing } = await svc.from("instructor_health_alerts")
        .select("id")
        .eq("source", r.source)
        .is("resolved_at", null)
        .filter("instructor_id", instructorId === null ? "is" : "eq", instructorId === null ? null : instructorId)
        .limit(1);
      if (!existing || existing.length === 0) {
        await svc.from("instructor_health_alerts").insert({
          instructor_id: instructorId,
          source: r.source,
          severity: r.status,
          message: r.message ?? `${r.source} check returned ${r.status}`,
        });
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const mode: "full" | "hot" = body.mode === "hot" ? "hot" : "full";
    const targetInstructorId: string | undefined = body.instructorId;

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let instructorIds: string[] = [];
    if (targetInstructorId) {
      instructorIds = [targetInstructorId];
    } else {
      const sinceDays = mode === "hot" ? 1 : 30;
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await svc.from("instructors")
        .select("id")
        .gte("updated_at", since);
      instructorIds = (data ?? []).map((r: any) => r.id);
    }

    let totalChecks = 0;
    // batches of 25
    for (let i = 0; i < instructorIds.length; i += 25) {
      const batch = instructorIds.slice(i, i + 25);
      await Promise.all(batch.map(async (id) => {
        const results = await runInstructorChecks(svc, id, mode);
        totalChecks += results.length;
        await persist(svc, id, results);
      }));
    }

    if (mode === "full") {
      const globalResults = await runGlobalChecks(svc);
      totalChecks += globalResults.length;
      await persist(svc, null, globalResults);
    }

    return new Response(
      JSON.stringify({ ok: true, mode, instructors: instructorIds.length, checks: totalChecks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
