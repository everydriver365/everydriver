import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Get pupil info
    const { data: pupil } = await supabase
      .from("pupils")
      .select("name, test_date, experience_level, lesson_notes")
      .eq("id", pupil_id)
      .maybeSingle();

    // Get last 3 completed lessons with notes
    const { data: recentLessons } = await supabase
      .from("scheduled_lessons")
      .select("lesson_date, start_time, notes, status, lesson_plan_notes")
      .eq("pupil_id", pupil_id)
      .eq("instructor_id", instructor_id)
      .eq("status", "completed")
      .order("lesson_date", { ascending: false })
      .limit(3);

    // Get any syllabus recommendations
    const { data: recommendations } = await supabase
      .from("pupil_recommendations")
      .select("topic, notes, priority")
      .eq("pupil_id", pupil_id)
      .eq("is_completed", false)
      .order("priority", { ascending: false })
      .limit(5);

    const context = {
      pupilName: pupil?.name || "Unknown",
      testDate: pupil?.test_date || null,
      experienceLevel: pupil?.experience_level || "unknown",
      recentLessons: (recentLessons || []).map(l => ({
        date: l.lesson_date,
        notes: l.notes || l.lesson_plan_notes || "No notes",
      })),
      recommendations: (recommendations || []).map(r => ({
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
              content: `You are ED, a driving instructor assistant. Write a 3-bullet lesson prep guide for the upcoming lesson. Each bullet should be actionable and specific. Include: what to build on from last time, what to focus on today, and any test prep if a test date is approaching. Keep each bullet under 20 words. Do NOT use markdown formatting, just plain numbered points.`
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

    return new Response(JSON.stringify({ prep: prepText, data: context }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Lesson prep error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
