import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pupilId, instructorId } = await req.json();

    if (!pupilId || !instructorId) {
      return new Response(
        JSON.stringify({ error: "pupilId and instructorId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Toggle gate
    const { data: instructorToggle } = await supabase
      .from("instructors")
      .select("ai_lesson_plans_enabled")
      .eq("id", instructorId)
      .maybeSingle();
    if (instructorToggle && instructorToggle.ai_lesson_plans_enabled === false) {
      return new Response(
        JSON.stringify({ error: "AI lesson plans are not enabled for this instructor." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all data in parallel
    const [progressRes, historyRes, telematicsRes, updatesRes, pupilRes] = await Promise.all([
      supabase
        .from("pupil_syllabus_progress")
        .select("competency_id, level, updated_at")
        .eq("pupil_id", pupilId),
      supabase
        .from("lesson_history")
        .select("id, lesson_date, notes, next_lesson_plan, rating, skills_practiced")
        .eq("pupil_id", pupilId)
        .order("lesson_date", { ascending: false })
        .limit(10),
      supabase
        .from("lesson_telematics")
        .select("total_distance_km, average_speed_kmh, max_speed_kmh, speeding_percentage, harsh_braking_count, harsh_acceleration_count, started_at")
        .eq("pupil_id", pupilId)
        .order("started_at", { ascending: false })
        .limit(5),
      supabase
        .from("lesson_syllabus_updates")
        .select("competency_id, previous_level, new_level, created_at")
        .eq("pupil_id", pupilId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("pupils")
        .select("name, experience_level, total_hours")
        .eq("id", pupilId)
        .single(),
    ]);

    const progress = progressRes.data || [];
    const history = historyRes.data || [];
    const telematics = telematicsRes.data || [];
    const updates = updatesRes.data || [];
    const pupil = pupilRes.data;

    // Build the DVSA syllabus context
    const syllabusItems = [
      { id: "precautions", name: "Safety Precautions", category: "Controls" },
      { id: "cockpit_drill", name: "Cockpit Drill", category: "Controls" },
      { id: "controls", name: "Controls & Instruments", category: "Controls" },
      { id: "moving_off", name: "Moving Off", category: "Controls" },
      { id: "stopping", name: "Making Progress / Stopping", category: "Controls" },
      { id: "mirrors", name: "Use of Mirrors", category: "Road Procedure" },
      { id: "signals", name: "Signals", category: "Road Procedure" },
      { id: "response_signs", name: "Response to Signs & Signals", category: "Road Procedure" },
      { id: "use_of_speed", name: "Use of Speed", category: "Road Procedure" },
      { id: "following_distance", name: "Following Distance", category: "Road Procedure" },
      { id: "progress", name: "Progress & Hesitancy", category: "Road Procedure" },
      { id: "junctions_turning", name: "Junctions - Turning", category: "Junctions" },
      { id: "junctions_emerging", name: "Junctions - Emerging", category: "Junctions" },
      { id: "crossroads", name: "Crossroads", category: "Junctions" },
      { id: "roundabouts", name: "Roundabouts", category: "Junctions" },
      { id: "meeting_traffic", name: "Meeting Traffic", category: "Judgement" },
      { id: "crossing_traffic", name: "Crossing Traffic", category: "Judgement" },
      { id: "overtaking", name: "Overtaking", category: "Judgement" },
      { id: "pedestrian_crossings", name: "Pedestrian Crossings", category: "Judgement" },
      { id: "positioning", name: "Positioning", category: "Judgement" },
      { id: "awareness_planning", name: "Awareness & Planning", category: "Judgement" },
      { id: "reverse_park_road", name: "Reverse Park (Road)", category: "Manoeuvres" },
      { id: "reverse_park_bay", name: "Reverse Park (Bay)", category: "Manoeuvres" },
      { id: "pull_up_right", name: "Pull Up on Right", category: "Manoeuvres" },
      { id: "independent_driving", name: "Independent Driving", category: "Test Ready" },
      { id: "show_me_tell_me", name: "Show Me / Tell Me", category: "Test Ready" },
      { id: "emergency_stop", name: "Emergency Stop", category: "Test Ready" },
    ];

    const progressMap: Record<string, number> = {};
    progress.forEach((p: any) => { progressMap[p.competency_id] = p.level; });

    const syllabusContext = syllabusItems
      .map((s) => `${s.name} (${s.category}): Level ${progressMap[s.id] || 0}/5`)
      .join("\n");

    // Recent downgrades
    const downgrades = updates.filter((u: any) => u.new_level < u.previous_level);
    const downgradeContext = downgrades.length > 0
      ? "\n\nRecently downgraded skills:\n" + downgrades.map((d: any) => {
          const name = syllabusItems.find((s) => s.id === d.competency_id)?.name || d.competency_id;
          return `- ${name}: ${d.previous_level} → ${d.new_level}`;
        }).join("\n")
      : "";

    // Telematics summary
    let telematicsContext = "";
    if (telematics.length > 0) {
      const avgSpeed = telematics.reduce((s: number, t: any) => s + (t.average_speed_kmh || 0), 0) / telematics.length;
      const totalBraking = telematics.reduce((s: number, t: any) => s + (t.harsh_braking_count || 0), 0);
      const totalAccel = telematics.reduce((s: number, t: any) => s + (t.harsh_acceleration_count || 0), 0);
      const avgSpeeding = telematics.reduce((s: number, t: any) => s + (t.speeding_percentage || 0), 0) / telematics.length;
      telematicsContext = `\n\nTELEMATICS (last ${telematics.length} sessions):
- Avg speed: ${avgSpeed.toFixed(1)} km/h
- Speeding: ${avgSpeeding.toFixed(1)}% of time
- Harsh braking events: ${totalBraking}
- Harsh acceleration events: ${totalAccel}`;
    }

    // Recent lesson notes
    const notesContext = history
      .filter((h: any) => h.notes)
      .slice(0, 5)
      .map((h: any) => `- ${h.lesson_date}: ${h.notes}`)
      .join("\n");

    const prompt = `You are a DVSA-qualified driving instructor AI. Based on this pupil's current syllabus progress, recent lesson history, and telematics data, suggest a lesson plan for their next session.

PUPIL: ${pupil?.name || "Learner"} (${pupil?.experience_level || "unknown"} level, ${pupil?.total_hours || 0} hours completed)

CURRENT SYLLABUS PROGRESS (Level 0=Not Started, 1=Introduced, 2=Under Guidance, 3=Prompted, 4=Seldom Prompted, 5=Independent):
${syllabusContext}
${downgradeContext}
${telematicsContext}

${notesContext ? `RECENT LESSON NOTES:\n${notesContext}` : ""}

Consider:
- Skills at level 0-1 that haven't been introduced yet
- Skills at level 2-3 that need more practice
- Skills that were recently downgraded
- Any telematics issues (harsh braking = work on "Following Distance", speeding = "Use of Speed")
- Logical skill progression (don't teach roundabouts before junctions)
- The pupil's experience level and hours completed`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a DVSA driving instructor AI. Generate practical, structured lesson plans.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_lesson_plan",
              description: "Return a structured lesson plan suggestion",
              parameters: {
                type: "object",
                properties: {
                  recommended_competencies: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 DVSA competency IDs to focus on",
                  },
                  lesson_structure: {
                    type: "string",
                    description: "Lesson breakdown e.g. '30 min residential, 20 min dual carriageway, 10 min manoeuvres'",
                  },
                  key_focus: {
                    type: "string",
                    description: "The main thing to work on this lesson",
                  },
                  reasoning: {
                    type: "string",
                    description: "Why these skills were chosen (2-3 sentences)",
                  },
                  plan_text: {
                    type: "string",
                    description: "A short readable lesson plan paragraph the instructor can save as notes (3-5 sentences)",
                  },
                },
                required: ["recommended_competencies", "lesson_structure", "key_focus", "reasoning", "plan_text"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_lesson_plan" } },
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded, please try again shortly" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await aiResponse.text();
      console.error("AI gateway error:", status, text);
      return new Response(
        JSON.stringify({ error: "Failed to generate lesson plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "AI did not return a structured plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const plan = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-lesson-plan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
