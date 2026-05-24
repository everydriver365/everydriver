// Backfills lesson_id on lesson_telematics rows that ended without a link.
// For each orphan session, attempts to find exactly ONE scheduled lesson on the
// same date for the same instructor+pupil whose [start_time, end_time] overlaps
// [started_at - 30min, ended_at + 30min]. If multiple match → skip (ambiguous).
//
// Admin-only. Service-role DB writes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    let body: { limit?: number; offset?: number } = {};
    try { body = await req.json(); } catch { /* empty body ok */ }
    const limit = Math.min(Math.max(body.limit ?? 500, 1), 2000);
    const offset = Math.max(body.offset ?? 0, 0);

    const { data: orphans, error: orphErr } = await supabase
      .from("lesson_telematics")
      .select("id, instructor_id, pupil_id, started_at, ended_at")
      .is("lesson_id", null)
      .not("ended_at", "is", null)
      .not("instructor_id", "is", null)
      .not("pupil_id", "is", null)
      .order("started_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (orphErr) throw orphErr;

    let matched = 0;
    let ambiguous = 0;
    let no_match = 0;
    const errors: string[] = [];

    for (const s of orphans ?? []) {
      try {
        const started = new Date(s.started_at);
        const ended = new Date(s.ended_at);
        const date = started.toISOString().slice(0, 10);
        const winStartMs = started.getTime() - 30 * 60 * 1000;
        const winEndMs = ended.getTime() + 30 * 60 * 1000;

        const { data: candidates, error: candErr } = await supabase
          .from("scheduled_lessons")
          .select("id, start_time, duration_minutes, lesson_date")
          .eq("instructor_id", s.instructor_id)
          .eq("pupil_id", s.pupil_id)
          .eq("lesson_date", date)
          .is("deleted_at", null)
          .neq("status", "cancelled");

        if (candErr) throw candErr;

        const overlapping = (candidates ?? []).filter((l: any) => {
          const lessonStart = new Date(`${l.lesson_date}T${l.start_time}`).getTime();
          const lessonEnd = lessonStart + (l.duration_minutes ?? 60) * 60 * 1000;
          return lessonStart <= winEndMs && lessonEnd >= winStartMs;
        });

        if (overlapping.length === 1) {
          const { error: updErr } = await supabase
            .from("lesson_telematics")
            .update({ lesson_id: overlapping[0].id })
            .eq("id", s.id);
          if (updErr) throw updErr;
          matched++;
        } else if (overlapping.length === 0) {
          no_match++;
        } else {
          ambiguous++;
        }
      } catch (e) {
        errors.push(`${s.id}: ${(e as Error).message}`);
      }
    }

    const scanned = orphans?.length ?? 0;
    const next_offset = scanned === limit ? offset + limit : null;

    return new Response(
      JSON.stringify({
        ok: true,
        scanned,
        matched,
        ambiguous,
        no_match,
        errors: errors.length,
        next_offset,
        done: next_offset === null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("backfill-telematics-lesson-ids error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
