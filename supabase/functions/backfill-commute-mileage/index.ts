// Backfill HMRC-claimable commute mileage (home→first lesson / last lesson→home)
// for completed lesson telematics sessions since the start of the current tax
// year (6 Apr 2026). Idempotent — protected by the partial unique index
// `mileage_logs_commute_unique` and a pre-check on (instructor_id, log_date, purpose).
//
// Returns a summary { processed, inserted, skipped, errors }. Safe to invoke
// multiple times.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TAX_YEAR_START = "2026-04-06";
const BATCH_SIZE = 50;

interface SessionRow {
  id: string;
  instructor_id: string;
  lesson_id: string | null;
  started_at: string;
}

interface LessonRow {
  id: string;
  pickup_postcode: string | null;
  dropoff_postcode: string | null;
  start_time: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let offset = 0;
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    offset = Number(body?.offset ?? url.searchParams.get("offset") ?? 0) || 0;
  } catch {
    // ignore
  }

  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const callRoute = async (from: string, to: string) => {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/calculate-route-distance`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ from_postcode: from, to_postcode: to }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`calculate-route-distance ${res.status}: ${txt}`);
    }
    return await res.json() as { one_way_miles?: number; success?: boolean };
  };

  try {
    // Pull eligible sessions with a linked lesson, ordered for stable pagination
    const { data: sessions, error: sessErr } = await supabase
      .from("lesson_telematics")
      .select("id, instructor_id, lesson_id, started_at")
      .not("ended_at", "is", null)
      .not("lesson_id", "is", null)
      .gte("started_at", `${TAX_YEAR_START}T00:00:00Z`)
      .order("started_at", { ascending: true });

    if (sessErr) throw sessErr;

    // Group by (instructor_id, YYYY-MM-DD) from started_at
    const groups = new Map<string, { instructor_id: string; date: string; sessions: SessionRow[] }>();
    for (const s of (sessions ?? []) as SessionRow[]) {
      const date = s.started_at.slice(0, 10);
      const key = `${s.instructor_id}|${date}`;
      const g = groups.get(key);
      if (g) g.sessions.push(s);
      else groups.set(key, { instructor_id: s.instructor_id, date, sessions: [s] });
    }

    const allGroups = Array.from(groups.values());
    const slice = allGroups.slice(offset, offset + BATCH_SIZE);

    // Cache instructor home postcodes within this batch
    const instructorIds = [...new Set(slice.map((g) => g.instructor_id))];
    const homeMap = new Map<string, string | null>();
    if (instructorIds.length) {
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, home_postcode")
        .in("id", instructorIds);
      for (const i of instructors ?? []) {
        homeMap.set(i.id, (i.home_postcode ?? "").trim() || null);
      }
    }

    for (const g of slice) {
      processed += 1;
      const homePc = homeMap.get(g.instructor_id);
      if (!homePc) {
        skipped += 1;
        continue;
      }

      try {
        // Pull all lessons referenced by this day's sessions to find first & last
        const lessonIds = g.sessions
          .map((s) => s.lesson_id)
          .filter((x): x is string => !!x);
        if (lessonIds.length === 0) {
          skipped += 1;
          continue;
        }

        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("id, pickup_postcode, dropoff_postcode, start_time")
          .in("id", lessonIds);

        const sorted = (lessons ?? [])
          .slice()
          .sort((a: LessonRow, b: LessonRow) =>
            String(a.start_time ?? "").localeCompare(String(b.start_time ?? "")),
          ) as LessonRow[];

        if (sorted.length === 0) {
          skipped += 1;
          continue;
        }

        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const tryInsert = async (
          from: string | null | undefined,
          to: string | null | undefined,
          purpose: "Home to first lesson" | "Last lesson to home",
        ) => {
          const fromPc = (from ?? "").trim();
          const toPc = (to ?? "").trim();
          if (!fromPc || !toPc) {
            skipped += 1;
            return;
          }

          // Idempotent pre-check
          const { data: existing } = await supabase
            .from("mileage_logs")
            .select("id")
            .eq("instructor_id", g.instructor_id)
            .eq("log_date", g.date)
            .eq("purpose", purpose)
            .is("telematics_id", null)
            .maybeSingle();
          if (existing) {
            skipped += 1;
            return;
          }

          let route;
          try {
            route = await callRoute(fromPc, toPc);
          } catch (e) {
            console.warn(
              `route fail ${g.instructor_id} ${g.date} ${purpose}:`,
              (e as Error).message,
            );
            errors += 1;
            return;
          }

          const miles = Number(route?.one_way_miles);
          if (!route?.success || !isFinite(miles) || miles <= 0) {
            errors += 1;
            return;
          }
          const distanceKm = miles / 0.621371;

          const { error: insErr } = await supabase.from("mileage_logs").insert({
            instructor_id: g.instructor_id,
            telematics_id: null,
            vehicle_id: null,
            pupil_id: null,
            log_date: g.date,
            distance_km: distanceKm,
            trip_type: "business",
            purpose,
            start_location: fromPc,
            end_location: toPc,
            is_auto_logged: true,
          });
          if (insErr) {
            if (insErr.code === "23505") {
              skipped += 1;
            } else {
              console.error(
                `insert fail ${g.instructor_id} ${g.date} ${purpose}:`,
                insErr.message,
              );
              errors += 1;
            }
          } else {
            inserted += 1;
          }
        };

        await tryInsert(homePc, first.pickup_postcode, "Home to first lesson");
        await tryInsert(
          last.dropoff_postcode || last.pickup_postcode,
          homePc,
          "Last lesson to home",
        );
      } catch (perGroupErr) {
        const m = perGroupErr instanceof Error ? perGroupErr.message : String(perGroupErr);
        console.error(`group ${g.instructor_id} ${g.date}:`, m);
        errors += 1;
      }
    }

    const nextOffset = offset + slice.length;
    const done = nextOffset >= allGroups.length;

    return new Response(
      JSON.stringify({
        ok: true,
        processed,
        inserted,
        skipped,
        errors,
        offset,
        next_offset: done ? null : nextOffset,
        total_groups: allGroups.length,
        done,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("backfill-commute-mileage error:", msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg, processed, inserted, skipped, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
