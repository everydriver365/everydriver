import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEVEL_LABELS: Record<number, string> = {
  0: "Not Started",
  1: "Introduced",
  2: "Under Guidance",
  3: "Prompted",
  4: "Seldom Prompted",
  5: "Independent",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { instructor_id, pupil_id } = await req.json();
    if (!instructor_id || !pupil_id) throw new Error("instructor_id and pupil_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all data in parallel
    const [pupilRes, lessonsRes, historyRes, recommendationsRes, syllabusRes] = await Promise.all([
      // Pupil info
      supabase
        .from("pupils")
        .select("name, test_date, experience_level, lesson_notes")
        .eq("id", pupil_id)
        .maybeSingle(),

      // Last 3 completed scheduled lessons with notes
      supabase
        .from("scheduled_lessons")
        .select("lesson_date, start_time, notes, status, lesson_plan_notes")
        .eq("pupil_id", pupil_id)
        .eq("instructor_id", instructor_id)
        .eq("status", "completed")
        .order("lesson_date", { ascending: false })
        .limit(3),

      // Last lesson from lesson_history (has richer notes + next_lesson_plan)
      supabase
        .from("lesson_history")
        .select("lesson_date, start_time, notes, next_lesson_plan, skills_practiced, duration_minutes")
        .eq("pupil_id", pupil_id)
        .eq("instructor_id", instructor_id)
        .is("deleted_at", null)
        .order("lesson_date", { ascending: false })
        .limit(3),

      // Syllabus recommendations
      supabase
        .from("pupil_recommendations")
        .select("topic, notes, priority")
        .eq("pupil_id", pupil_id)
        .eq("is_completed", false)
        .order("priority", { ascending: false })
        .limit(5),

      // DVSA syllabus progress
      supabase
        .from("pupil_syllabus_progress")
        .select("competency_id, level, instructor_notes, last_practiced")
        .eq("pupil_id", pupil_id),
    ]);

    const pupil = pupilRes.data;
    const recentLessons = lessonsRes.data || [];
    const lessonHistory = historyRes.data || [];
    const recommendations = recommendationsRes.data || [];
    const syllabusProgress = syllabusRes.data || [];

    // Build previous lesson notes summary
    const previousLessonNotes = lessonHistory.length > 0
      ? {
          date: lessonHistory[0].lesson_date,
          notes: lessonHistory[0].notes || null,
          nextPlan: lessonHistory[0].next_lesson_plan || null,
          skillsPracticed: lessonHistory[0].skills_practiced || [],
          duration: lessonHistory[0].duration_minutes,
        }
      : null;

    // Build syllabus summary
    const totalCompetencies = 27; // DVSA standard
    const tracked = syllabusProgress.length;
    const competenciesByLevel: Record<string, string[]> = {};
    const weakAreas: { id: string; level: number; levelLabel: string; notes: string | null }[] = [];
    const strongAreas: { id: string; level: number; levelLabel: string }[] = [];

    for (const sp of syllabusProgress) {
      const lvl = sp.level ?? 0;
      const label = LEVEL_LABELS[lvl] || `Level ${lvl}`;
      if (!competenciesByLevel[label]) competenciesByLevel[label] = [];
      competenciesByLevel[label].push(sp.competency_id);

      if (lvl <= 2) {
        weakAreas.push({ id: sp.competency_id, level: lvl, levelLabel: label, notes: sp.instructor_notes });
      }
      if (lvl >= 4) {
        strongAreas.push({ id: sp.competency_id, level: lvl, levelLabel: label });
      }
    }

    const syllabusSummary = {
      totalCompetencies,
      tracked,
      notStarted: totalCompetencies - tracked,
      levelBreakdown: competenciesByLevel,
      weakAreas: weakAreas.slice(0, 8),
      strongAreas: strongAreas.slice(0, 5),
      averageLevel: tracked > 0
        ? Math.round((syllabusProgress.reduce((s, p) => s + (p.level ?? 0), 0) / tracked) * 10) / 10
        : 0,
    };

    const context = {
      pupilName: pupil?.name || "Unknown",
      testDate: pupil?.test_date || null,
      experienceLevel: pupil?.experience_level || "unknown",
      recentLessons: recentLessons.map(l => ({
        date: l.lesson_date,
        notes: l.notes || l.lesson_plan_notes || "No notes",
      })),
      previousLessonNotes,
      syllabusSummary,
      recommendations: recommendations.map(r => ({
        topic: r.topic,
        notes: r.notes,
        priority: r.priority,
      })),
      generalNotes: pupil?.lesson_notes || null,
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let prepText = "";

    if (LOVABLE_API_KEY) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are ED, a UK driving instructor assistant. Write a lesson prep guide for the upcoming lesson. Structure it as:

1. PREVIOUS LESSON RECAP (1 bullet): What was covered last time and key observations. Reference specific notes if available.
2. TODAY'S FOCUS (1-2 bullets): What to work on today based on syllabus weak areas and recommendations. Be specific about DVSA competencies.
3. TEST PREP (1 bullet, only if test date within 30 days): Specific test preparation advice.

Keep each bullet under 25 words. Use plain numbered points, no markdown. Always use £ (GBP) for currency. Reference DVSA competency names where relevant.`
            },
            { role: "user", content: JSON.stringify(context) }
          ],
        }),
      });
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        prepText = aiData.choices?.[0]?.message?.content || "";
      }
    }

    return new Response(JSON.stringify({
      prep: prepText,
      previousLessonNotes,
      syllabusSummary,
      data: context,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Lesson prep error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
