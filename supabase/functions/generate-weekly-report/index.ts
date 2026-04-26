import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, startOfWeek, endOfWeek, subWeeks } from "https://esm.sh/date-fns@3";

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

    const now = new Date();
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const prevWeekStart = format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const prevWeekEnd = format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");

    // This week's lessons
    const { data: thisWeekLessons } = await supabase
      .from("scheduled_lessons")
      .select("id, lesson_date, duration_minutes, status")
      .eq("instructor_id", instructor_id)
      .gte("lesson_date", weekStart)
      .lte("lesson_date", weekEnd);

    // Last week's lessons
    const { data: lastWeekLessons } = await supabase
      .from("scheduled_lessons")
      .select("id, duration_minutes, status")
      .eq("instructor_id", instructor_id)
      .gte("lesson_date", prevWeekStart)
      .lte("lesson_date", prevWeekEnd);

    // Instructor rate
    const { data: instructor } = await supabase
      .from("instructors")
      .select("hourly_rate, name")
      .eq("id", instructor_id)
      .maybeSingle();

    // This week's expenses
    const { data: expenses } = await supabase
      .from("instructor_expenses")
      .select("amount")
      .eq("instructor_id", instructor_id)
      .gte("expense_date", weekStart)
      .lte("expense_date", weekEnd);

    // Mileage this week
    const { data: mileage } = await supabase
      .from("mileage_logs")
      .select("distance_km")
      .eq("instructor_id", instructor_id)
      .gte("log_date", weekStart)
      .lte("log_date", weekEnd);

    const rate = instructor?.hourly_rate || 35;
    const thisWeekAll = thisWeekLessons || [];
    const completed = thisWeekAll.filter(l => l.status === "completed" || l.status !== "cancelled");
    const cancelled = thisWeekAll.filter(l => l.status === "cancelled");
    const totalMinutes = completed.reduce((s, l) => s + (l.duration_minutes || 60), 0);
    const revenue = Math.round((totalMinutes / 60) * rate);

    const lastWeekAll = lastWeekLessons || [];
    const lastWeekCompleted = lastWeekAll.filter(l => l.status !== "cancelled");
    const lastWeekMinutes = lastWeekCompleted.reduce((s, l) => s + (l.duration_minutes || 60), 0);
    const lastWeekRevenue = Math.round((lastWeekMinutes / 60) * rate);

    const totalExpenses = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
    const totalMiles = Math.round(((mileage || []).reduce((s, m) => s + (m.distance_km || 0), 0)) * 0.621371);

    // Group by day
    const dayBreakdown: Record<string, number> = {};
    for (const l of completed) {
      const day = l.lesson_date;
      dayBreakdown[day] = (dayBreakdown[day] || 0) + 1;
    }

    const context = {
      weekOf: weekStart,
      lessonCount: completed.length,
      cancelledCount: cancelled.length,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      revenue,
      lastWeekRevenue,
      revenueChange: lastWeekRevenue > 0 ? Math.round(((revenue - lastWeekRevenue) / lastWeekRevenue) * 100) : 0,
      totalExpenses: Math.round(totalExpenses),
      totalMiles,
      dayBreakdown,
      instructorName: instructor?.name?.split(" ")[0] || "there",
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let reportText = "";

    if (LOVABLE_API_KEY) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are ED, a business analytics assistant for UK driving instructors. Write a concise weekly business report (4-6 sentences). Include revenue comparison vs last week, busiest day insight, and one actionable tip. Be encouraging but data-driven. Keep under 100 words. No markdown. Always use £ (GBP) for currency, never $ or USD.`
            },
            { role: "user", content: JSON.stringify(context) }
          ],
        }),
      });
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        reportText = aiData.choices?.[0]?.message?.content || "";
      }
    }

    // Store the report
    await supabase.from("instructor_weekly_reports").upsert({
      instructor_id,
      week_start: weekStart,
      report_text: reportText,
      lesson_count: completed.length,
      cancelled_count: cancelled.length,
      total_hours: Math.round((totalMinutes / 60) * 10) / 10,
      revenue,
      expenses: Math.round(totalExpenses),
      mileage_miles: totalMiles,
    }, { onConflict: "instructor_id,week_start" });

    return new Response(JSON.stringify({ report: reportText, data: context }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Weekly report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
