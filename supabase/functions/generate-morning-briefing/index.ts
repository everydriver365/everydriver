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
    const weekEnd = format(addDays(new Date(), 7), "yyyy-MM-dd");

    // Fetch today's lessons
    const { data: lessons } = await supabase
      .from("scheduled_lessons")
      .select("id, start_time, duration_minutes, status, pupil_id, pickup_postcode, pupils!inner(id, name)")
      .eq("instructor_id", instructor_id)
      .eq("lesson_date", today)
      .neq("status", "cancelled")
      .order("start_time");

    // Fetch instructor rate
    const { data: instructor } = await supabase
      .from("instructors")
      .select("hourly_rate, name")
      .eq("id", instructor_id)
      .maybeSingle();

    // Fetch pupils with negative balance (overdue)
    const { data: overduePupils } = await supabase
      .from("pupils")
      .select("name, account_balance")
      .eq("instructor_id", instructor_id)
      .is("deleted_at", null)
      .lt("account_balance", 0);

    // Fetch tests this week
    const { data: upcomingTests } = await supabase
      .from("pupils")
      .select("name, test_date")
      .eq("instructor_id", instructor_id)
      .is("deleted_at", null)
      .gte("test_date", today)
      .lte("test_date", weekEnd)
      .order("test_date");

    // Fetch last lesson plan per pupil for today's lessons
    const todayLessons = await Promise.all(
      (lessons || []).map(async (lesson) => {
        const pupil = (lesson as any).pupils;
        let plan: string | null = null;
        const { data: lastReview } = await supabase
          .from("lesson_history")
          .select("next_lesson_plan")
          .eq("instructor_id", instructor_id)
          .eq("pupil_id", pupil.id)
          .not("next_lesson_plan", "is", null)
          .order("lesson_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastReview?.next_lesson_plan) plan = lastReview.next_lesson_plan;
        return {
          time: lesson.start_time?.slice(0, 5),
          pupilName: pupil.name,
          plan,
        };
      })
    );

    const rate = instructor?.hourly_rate || 35;
    const lessonCount = lessons?.length || 0;
    const totalMinutes = lessons?.reduce((s, l) => s + (l.duration_minutes || 60), 0) || 0;
    const totalHours = totalMinutes / 60;
    const earnings = Math.round(totalHours * rate);

    // Build context for AI summary
    const context = {
      date: format(new Date(), "EEEE d MMMM yyyy"),
      lessonCount,
      totalHours: Math.round(totalHours * 10) / 10,
      earnings,
      todayLessons,
      overduePupils: (overduePupils || []).map(p => ({ name: p.name, owed: Math.abs(p.account_balance || 0) })),
      upcomingTests: (upcomingTests || []).map(t => ({ name: t.name, date: t.test_date })),
      instructorName: instructor?.name?.split(" ")[0] || "there",
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Return raw data without AI summary
      return new Response(JSON.stringify({ briefing: null, data: context }), {
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
            content: `You are ED, a friendly driving instructor assistant. Write a brief, warm morning briefing (3-5 sentences max). Be conversational and encouraging. Use the instructor's first name. Mention key facts: lessons, earnings, any overdue payments, upcoming tests. For each lesson, mention the pupil's name and time. If a lesson plan exists, briefly mention the focus area. Do NOT invent or guess lesson content when no plan is provided. Keep it under 100 words. Do NOT use markdown.`
          },
          { role: "user", content: JSON.stringify(context) }
        ],
      }),
    });

    let briefingText = "";
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      briefingText = aiData.choices?.[0]?.message?.content || "";
    }

    return new Response(JSON.stringify({ briefing: briefingText, data: context }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Morning briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
