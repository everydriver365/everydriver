// send-mtd-deadline-reminders
// Daily cron. Finds MTD quarterly periods whose `deadline` is exactly 30, 7,
// or 1 day from today (Europe/London), and sends a push reminder via
// notify-instructor. Idempotent: a unique (period_id, tier) row in
// mtd_deadline_reminders_sent prevents double-sends.
//
// Mirrors send-deletion-reminders.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIERS = [30, 7, 1] as const;
type Tier = (typeof TIERS)[number];

function londonTodayISO(): string {
  // YYYY-MM-DD in Europe/London
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA returns YYYY-MM-DD
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00Z`).getTime();
  const b = new Date(`${toISO}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

function quarterLabel(taxYear: number, quarter: number): string {
  const yy = String((taxYear + 1) % 100).padStart(2, "0");
  return `Q${quarter} ${taxYear}/${yy}`;
}

interface PeriodRow {
  id: string;
  instructor_id: string;
  tax_year: number;
  quarter: number;
  deadline: string; // date as YYYY-MM-DD
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = londonTodayISO();
    const horizon = addDaysISO(today, 31);

    const { data: periods, error } = await admin
      .from("mtd_quarterly_periods")
      .select("id, instructor_id, tax_year, quarter, deadline")
      .eq("status", "open")
      .gt("deadline", today)
      .lte("deadline", horizon);

    if (error) {
      console.error("[send-mtd-deadline-reminders] query failed:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = (periods as PeriodRow[] | null) ?? [];
    let sent = 0;
    let skipped = 0;
    const details: { period_id: string; tier: number; status: string; detail?: string }[] = [];

    const tasks = rows.map(async (p) => {
      const days = daysBetween(today, p.deadline);
      if (!(TIERS as readonly number[]).includes(days)) {
        skipped++;
        return;
      }
      const tier = days as Tier;

      const { data: already } = await admin
        .from("mtd_deadline_reminders_sent")
        .select("id")
        .eq("period_id", p.id)
        .eq("tier", tier)
        .maybeSingle();
      if (already) {
        skipped++;
        details.push({ period_id: p.id, tier, status: "already_sent" });
        return;
      }

      const ql = quarterLabel(p.tax_year, p.quarter);
      let sentOk = true;
      let detail: string | undefined;

      try {
        const { error: notifyErr } = await admin.functions.invoke("notify-instructor", {
          body: {
            instructorId: p.instructor_id,
            type: "mtd_deadline_reminder",
            quarterLabel: ql,
            daysRemaining: tier,
            deadline: p.deadline,
            periodId: p.id,
          },
        });
        if (notifyErr) {
          sentOk = false;
          detail = notifyErr.message ?? String(notifyErr);
        }
      } catch (e) {
        sentOk = false;
        detail = e instanceof Error ? e.message : String(e);
      }

      // Always record the attempt — prevents retry storms even on failure.
      const { error: insertErr } = await admin
        .from("mtd_deadline_reminders_sent")
        .insert({ period_id: p.id, tier, sent_ok: sentOk, detail: detail ?? null });

      if (insertErr) {
        console.error("[send-mtd-deadline-reminders] log insert failed:", insertErr);
      }

      if (sentOk) sent++;
      details.push({ period_id: p.id, tier, status: sentOk ? "sent" : "failed", detail });
    });

    await Promise.allSettled(tasks);

    return new Response(
      JSON.stringify({ today, processed: rows.length, sent, skipped, details }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[send-mtd-deadline-reminders] fatal:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
