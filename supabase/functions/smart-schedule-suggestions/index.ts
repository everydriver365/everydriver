import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, addDays } from "https://esm.sh/date-fns@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { instructor_id } = await req.json();
    if (!instructor_id) throw new Error("instructor_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = format(new Date(), "yyyy-MM-dd");
    const twoWeeks = format(addDays(new Date(), 14), "yyyy-MM-dd");

    // Fetch data in parallel
    const [lessonsRes, hoursRes, pupilsRes] = await Promise.all([
      supabase.from("scheduled_lessons")
        .select("lesson_date, start_time, duration_minutes, status, pupils!inner(name)")
        .eq("instructor_id", instructor_id)
        .gte("lesson_date", today)
        .lte("lesson_date", twoWeeks)
        .neq("status", "cancelled")
        .order("lesson_date"),
      supabase.from("instructor_working_hours")
        .select("day_of_week, start_time, end_time, is_active")
        .eq("instructor_id", instructor_id),
      supabase.from("pupils")
        .select("id, name, phone")
        .eq("instructor_id", instructor_id)
        .is("deleted_at", null)
        .eq("is_active", true)
        .limit(50),
    ]);

    const lessons = lessonsRes.data || [];
    const workingHours = hoursRes.data || [];
    const pupils = pupilsRes.data || [];

    // Find pupils without upcoming bookings
    const bookedPupilNames = new Set(lessons.map(l => (l.pupils as any)?.name));
    const unbookedPupils = pupils.filter(p => !bookedPupilNames.has(p.name));

    // Find gap days (days with working hours but few lessons)
    const lessonsByDay: Record<string, number> = {};
    for (const l of lessons) {
      lessonsByDay[l.lesson_date] = (lessonsByDay[l.lesson_date] || 0) + 1;
    }

    const context = {
      workingDays: workingHours.filter(h => h.is_active).map(h => ({
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][h.day_of_week],
        hours: `${h.start_time?.slice(0, 5)}-${h.end_time?.slice(0, 5)}`,
      })),
      upcomingLessons: lessons.slice(0, 20).map(l => ({
        date: l.lesson_date,
        time: l.start_time,
        pupil: (l.pupils as any)?.name,
        duration: l.duration_minutes,
      })),
      unbookedPupils: unbookedPupils.slice(0, 10).map(p => p.name),
      lessonsByDay,
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a scheduling assistant for a driving instructor. Analyze their diary and suggest 3-5 actionable scheduling improvements. Each suggestion should have an icon emoji, a short title (max 8 words), and a description (max 20 words). Focus on: gaps to fill, pupils who need rebooking, busy/quiet patterns. Return JSON only.`,
          },
          { role: "user", content: JSON.stringify(context) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_suggestions",
            description: "Return scheduling suggestions",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      icon: { type: "string" },
                      title: { type: "string" },
                      description: { type: "string" },
                      pupilName: { type: "string" },
                      suggestedDay: { type: "string" },
                    },
                    required: ["icon", "title", "description"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_suggestions" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let suggestions: any[] = [];
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        suggestions = parsed.suggestions || [];
      }
    } catch (e) {
      console.error("Parse error:", e);
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Smart schedule error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
