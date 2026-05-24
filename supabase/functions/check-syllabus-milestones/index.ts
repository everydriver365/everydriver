// check-syllabus-milestones
// Triggered after pupil_syllabus_progress upserts. For the given pupil, group
// competencies by DVSA category; for any category where all competencies are
// now level 5 AND no milestone row exists yet, insert a milestone and fire a
// SYLLABUS_CATEGORY_COMPLETE push.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mirror of src/constants/dvsaSyllabus.ts (id + category only).
// Kept in sync manually — when the syllabus changes, update both.
const DVSA_SYLLABUS: { id: string; category: string }[] = [
  { id: "precautions", category: "Controls" },
  { id: "cockpit_drill", category: "Controls" },
  { id: "controls", category: "Controls" },
  { id: "moving_off", category: "Controls" },
  { id: "stopping", category: "Controls" },
  { id: "mirrors", category: "Road Procedure" },
  { id: "signals", category: "Road Procedure" },
  { id: "response_signs", category: "Road Procedure" },
  { id: "use_of_speed", category: "Road Procedure" },
  { id: "following_distance", category: "Road Procedure" },
  { id: "progress", category: "Road Procedure" },
  { id: "junctions_turning", category: "Junctions" },
  { id: "junctions_emerging", category: "Junctions" },
  { id: "crossroads", category: "Junctions" },
  { id: "roundabouts", category: "Junctions" },
  { id: "meeting_traffic", category: "Judgement" },
  { id: "crossing_traffic", category: "Judgement" },
  { id: "overtaking", category: "Judgement" },
  { id: "pedestrian_crossings", category: "Judgement" },
  { id: "positioning", category: "Judgement" },
  { id: "awareness_planning", category: "Judgement" },
  { id: "reverse_park_road", category: "Manoeuvres" },
  { id: "reverse_park_bay", category: "Manoeuvres" },
  { id: "pull_up_right", category: "Manoeuvres" },
  { id: "independent_driving", category: "Test Ready" },
  { id: "show_me_tell_me", category: "Test Ready" },
  { id: "emergency_stop", category: "Test Ready" },
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const pupilId: string | undefined = body?.pupilId;
    if (!pupilId) {
      return new Response(JSON.stringify({ error: "pupilId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull pupil's current progress + their instructor (for milestone row)
    const [progressRes, pupilRes] = await Promise.all([
      supabase
        .from("pupil_syllabus_progress")
        .select("competency_id, level")
        .eq("pupil_id", pupilId),
      supabase.from("pupils").select("instructor_id").eq("id", pupilId).maybeSingle(),
    ]);

    if (progressRes.error) throw progressRes.error;
    const progress = progressRes.data ?? [];
    const instructorId = (pupilRes.data as { instructor_id: string } | null)?.instructor_id;
    if (!instructorId) {
      return new Response(JSON.stringify({ completed: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const levelById = new Map<string, number>();
    for (const r of progress as { competency_id: string; level: number }[]) {
      levelById.set(r.competency_id, r.level ?? 0);
    }

    // Group competencies by category
    const byCategory = new Map<string, string[]>();
    for (const c of DVSA_SYLLABUS) {
      const arr = byCategory.get(c.category) ?? [];
      arr.push(c.id);
      byCategory.set(c.category, arr);
    }

    // Existing milestones for this pupil — avoid re-firing
    const { data: existingMilestones } = await supabase
      .from("pupil_milestones")
      .select("title")
      .eq("pupil_id", pupilId)
      .eq("milestone_type", "category_complete");
    const existingTitles = new Set(
      (existingMilestones ?? []).map((m: { title: string }) => m.title),
    );

    const completedNow: string[] = [];

    for (const [category, compIds] of byCategory.entries()) {
      const allMastered = compIds.every((id) => (levelById.get(id) ?? 0) >= 5);
      if (!allMastered) continue;
      const milestoneTitle = `Category complete: ${category}`;
      if (existingTitles.has(milestoneTitle)) continue;

      const { error: insErr } = await supabase.from("pupil_milestones").insert({
        pupil_id: pupilId,
        instructor_id: instructorId,
        milestone_type: "category_complete",
        title: milestoneTitle,
        description: `All competencies in ${category} mastered to Independent level.`,
        icon_name: "trophy",
      });
      if (insErr) {
        console.error("Milestone insert failed:", category, insErr);
        continue;
      }

      // Fire push (non-blocking)
      try {
        await supabase.functions.invoke("notify-pupil", {
          body: {
            pupilId,
            type: "syllabus_category_complete",
            data: {
              type: "syllabus_category_complete",
              category,
              categoryName: category,
            },
          },
        });
      } catch (e) {
        console.error("notify-pupil failed for milestone:", e);
      }

      completedNow.push(category);
    }

    return new Response(JSON.stringify({ completed: completedNow }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("check-syllabus-milestones error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
