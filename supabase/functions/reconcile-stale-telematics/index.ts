import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Find open telematics rows whose lesson has finished and last GPS point is stale
    const { data: openRows, error } = await supabase
      .from("lesson_telematics")
      .select("id, lesson_id, started_at, scheduled_lessons!inner(start_time, duration_minutes, lesson_date, status)")
      .is("ended_at", null);

    if (error) throw error;

    const now = Date.now();
    const closed: string[] = [];

    for (const row of openRows ?? []) {
      const lesson = (row as any).scheduled_lessons;
      if (!lesson) continue;

      // Lesson scheduled end time (London time stored as plain dates/times; treat as UTC offset-naive)
      const lessonEndMs = new Date(
        `${lesson.lesson_date}T${lesson.start_time}Z`,
      ).getTime() + (lesson.duration_minutes ?? 60) * 60_000;

      if (lessonEndMs > now) continue; // lesson not finished yet

      // Check last GPS point age
      const { data: lastPoint } = await supabase
        .from("telematics_gps_points")
        .select("recorded_at")
        .eq("telematics_id", row.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastTs = lastPoint?.recorded_at ? new Date(lastPoint.recorded_at).getTime() : new Date(row.started_at).getTime();
      const idleMin = (now - lastTs) / 60_000;
      if (idleMin < 20) continue;

      const { error: rpcErr } = await supabase.rpc("close_lesson_telematics", { p_lesson_id: row.lesson_id });
      if (!rpcErr) closed.push(row.id);
    }

    return new Response(
      JSON.stringify({ scanned: openRows?.length ?? 0, closed: closed.length, closed_ids: closed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[reconcile-stale-telematics] error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
