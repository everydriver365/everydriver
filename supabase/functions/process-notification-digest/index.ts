// Processes deferred notifications from `notification_outbox`. Groups pending
// rows by instructor and sends one combined push + one inbox row per group.
// Designed to be triggered by pg_cron every 15 minutes.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const nowIso = new Date().toISOString();
  const { data: pending, error } = await supabase
    .from("notification_outbox")
    .select("id,instructor_id,category,title,body,payload")
    .lte("deliver_at", nowIso)
    .is("sent_at", null)
    .order("instructor_id")
    .limit(500);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Group by instructor
  const byInstructor = new Map<string, typeof pending>();
  for (const row of pending) {
    const arr = byInstructor.get(row.instructor_id) ?? [];
    arr.push(row);
    byInstructor.set(row.instructor_id, arr);
  }

  let groups = 0;
  for (const [instructorId, rows] of byInstructor.entries()) {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.category] = (counts[r.category] || 0) + 1;
    const summary = Object.entries(counts)
      .map(([cat, n]) => `${n} ${labelFor(cat, n)}`)
      .join(", ");
    const title = rows.length === 1 ? (rows[0].title ?? "New notification") : `${rows.length} new updates`;
    const body = rows.length === 1 ? (rows[0].body ?? summary) : summary;

    // Send combined push (bypass gate to avoid re-deferring)
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          instructorId,
          bypassGate: true,
          notification: { title, body, tag: "digest", data: { type: "digest" } },
        }),
      });
    } catch (e) {
      console.error("digest push failed", instructorId, e);
    }

    // Inbox row
    await supabase.from("instructor_notifications").insert({
      instructor_id: instructorId,
      title,
      message: body,
      type: "digest",
      metadata: { count: rows.length, categories: counts } as never,
    } as never);

    // Mark rows sent
    await supabase
      .from("notification_outbox")
      .update({ sent_at: nowIso } as never)
      .in("id", rows.map(r => r.id));

    groups++;
  }

  return new Response(JSON.stringify({ processed: pending.length, groups }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function labelFor(cat: string, n: number): string {
  const map: Record<string, [string, string]> = {
    test_swap: ["test swap match", "test swap matches"],
    message: ["message", "messages"],
    job: ["job offer", "job offers"],
    system: ["alert", "alerts"],
    lesson: ["lesson update", "lesson updates"],
  };
  const [s, p] = map[cat] ?? [cat, cat];
  return n === 1 ? s : p;
}
