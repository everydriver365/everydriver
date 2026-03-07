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
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

    // Today's lessons
    const { data: todayLessons } = await supabase
      .from("scheduled_lessons")
      .select("id, start_time, duration_minutes, status, pupils!inner(name)")
      .eq("instructor_id", instructor_id)
      .eq("lesson_date", today)
      .neq("status", "cancelled")
      .order("start_time");

    // Instructor rate
    const { data: instructor } = await supabase
      .from("instructors")
      .select("hourly_rate, name")
      .eq("id", instructor_id)
      .maybeSingle();

    // Today's mileage
    const { data: mileage } = await supabase
      .from("mileage_logs")
      .select("distance_km")
      .eq("instructor_id", instructor_id)
      .eq("log_date", today);

    // Tomorrow's lessons
    const { data: tomorrowLessons } = await supabase
      .from("scheduled_lessons")
      .select("id, start_time, pupils!inner(name)")
      .eq("instructor_id", instructor_id)
      .eq("lesson_date", tomorrow)
      .neq("status", "cancelled")
      .order("start_time")
      .limit(3);

    const rate = instructor?.hourly_rate || 35;
    const completed = todayLessons?.filter(l => l.status === "completed") || [];
    const totalMinutes = todayLessons?.reduce((s, l) => s + (l.duration_minutes || 60), 0) || 0;
    const earnings = Math.round((totalMinutes / 60) * rate);
    const totalMiles = Math.round(((mileage || []).reduce((s, m) => s + (m.distance_km || 0), 0)) * 0.621371);

    const context = {
      date: format(new Date(), "EEEE d MMMM"),
      lessonsCompleted: completed.length,
      totalLessons: todayLessons?.length || 0,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      earnings,
      milesDriven: totalMiles,
      tomorrowLessons: (tomorrowLessons || []).map(l => ({
        time: l.start_time,
        pupil: (l.pupils as any)?.name,
      })),
      instructorName: instructor?.name?.split(" ")[0] || "there",
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let summaryText = "";

    if (LOVABLE_API_KEY) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are ED, a friendly driving instructor assistant. Write a brief end-of-day summary (3-5 sentences). Be warm and encouraging. Mention what was accomplished, mileage if available, and preview tomorrow. Keep it under 80 words. Do NOT use markdown.`
            },
            { role: "user", content: JSON.stringify(context) }
          ],
        }),
      });
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        summaryText = aiData.choices?.[0]?.message?.content || "";
      }
    }

    return new Response(JSON.stringify({ summary: summaryText, data: context }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("EOD summary error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
