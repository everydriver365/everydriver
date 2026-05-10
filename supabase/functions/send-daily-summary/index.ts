// Sends the per-instructor "Daily Summary" push. Triggered every 15 minutes by
// pg_cron; selects instructors whose `daily_summary_time` matches the current
// UK quarter-hour and `daily_summary_enabled = true`, then builds a digest
// from their include flags and dispatches one push + one inbox row.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function ukHHmmQuarter(): string {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", hour12: false, hour: "2-digit", minute: "2-digit",
  });
  const [hh, mm] = f.format(new Date()).split(":").map(Number);
  const q = Math.floor(mm / 15) * 15;
  return `${String(hh).padStart(2, "0")}:${String(q).padStart(2, "0")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const forced = url.searchParams.get("now"); // override for testing, format HH:mm
  const targetHHmm = (forced ?? ukHHmmQuarter()).slice(0, 5);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Match a 15-minute window to tolerate cron drift
  const [h, m] = targetHHmm.split(":").map(Number);
  const lower = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  const upper = `${String(h).padStart(2, "0")}:${String(m + 14).padStart(2, "0")}:59`;

  const { data: settings, error } = await supabase
    .from("instructor_notification_settings")
    .select("instructor_id,daily_summary_include,daily_summary_time")
    .eq("daily_summary_enabled", true)
    .gte("daily_summary_time", lower)
    .lte("daily_summary_time", upper);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!settings || settings.length === 0) {
    return new Response(JSON.stringify({ matched: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const todayUk = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrowUk = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(tomorrowDate);

  let sent = 0;
  for (const row of settings) {
    const include = (row.daily_summary_include as Record<string, boolean>) ?? {};
    const parts: string[] = [];

    if (include.tomorrow_lessons) {
      const { count } = await supabase
        .from("scheduled_lessons")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", row.instructor_id)
        .in("lesson_date", [todayUk, tomorrowUk])
        .neq("status", "cancelled")
        .is("deleted_at", null);
      if ((count ?? 0) > 0) parts.push(`${count} lesson${count === 1 ? "" : "s"} scheduled`);
    }

    if (include.payments_due) {
      const { count } = await supabase
        .from("pupils")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", row.instructor_id)
        .lt("account_balance", 0)
        .is("deleted_at", null);
      if ((count ?? 0) > 0) parts.push(`${count} pupil${count === 1 ? "" : "s"} owe payment`);
    }

    if (include.pupil_messages) {
      const { count } = await supabase
        .from("instructor_notifications")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", row.instructor_id)
        .eq("type", "message")
        .eq("is_read", false);
      if ((count ?? 0) > 0) parts.push(`${count} unread message${count === 1 ? "" : "s"}`);
    }

    if (include.job_offers) {
      const { count } = await supabase
        .from("instructor_notifications")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", row.instructor_id)
        .eq("type", "job")
        .eq("is_read", false);
      if ((count ?? 0) > 0) parts.push(`${count} job offer${count === 1 ? "" : "s"}`);
    }

    if (include.test_swaps) {
      const { count } = await supabase
        .from("instructor_notifications")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", row.instructor_id)
        .eq("type", "test_swap")
        .eq("is_read", false);
      if ((count ?? 0) > 0) parts.push(`${count} test swap${count === 1 ? "" : "s"}`);
    }

    const body = parts.length > 0 ? parts.join(" • ") : "Nothing pending today.";
    const title = "Daily summary";

    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          instructorId: row.instructor_id,
          bypassGate: true,
          notification: { title, body, tag: "daily-summary", data: { type: "daily_summary" } },
        }),
      });
    } catch (e) {
      console.error("daily summary push failed", row.instructor_id, e);
    }

    await supabase.from("instructor_notifications").insert({
      instructor_id: row.instructor_id,
      title,
      message: body,
      type: "system",
      metadata: { source: "daily_summary" } as never,
    } as never);

    sent++;
  }

  return new Response(JSON.stringify({ matched: settings.length, sent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
