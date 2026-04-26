import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, subDays, addDays } from "https://esm.sh/date-fns@3";

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
    const nudges: any[] = [];

    // 1. Dormant pupils (no lesson in 14+ days)
    const { data: allPupils } = await supabase
      .from("pupils")
      .select("id, name, account_balance, profile_image_url")
      .eq("instructor_id", instructor_id)
      .is("deleted_at", null)
      .eq("status", "active");

    if (allPupils) {
      const cutoff = format(subDays(new Date(), 14), "yyyy-MM-dd");
      for (const pupil of allPupils.slice(0, 20)) {
        const { data: recentLessons } = await supabase
          .from("scheduled_lessons")
          .select("id")
          .eq("pupil_id", pupil.id)
          .gte("lesson_date", cutoff)
          .limit(1);

        if (!recentLessons || recentLessons.length === 0) {
          nudges.push({
            id: `dormant-${pupil.id}`,
            type: "dormant_pupil",
            icon: "UserMinus",
            title: `${pupil.name} hasn't booked in 2+ weeks`,
            action_label: "Send check-in",
            action_route: `/instructor/messages?pupil=${pupil.id}`,
            priority: 2,
            pupil_id: pupil.id,
            pupil_name: pupil.name,
            pupil_image: pupil.profile_image_url || null,
          });
        }
      }
    }

    // 2. Overdue payments
    const overdue = (allPupils || []).filter(p => (p.account_balance || 0) < -10);
    if (overdue.length > 0) {
      const totalOwed = overdue.reduce((s, p) => s + Math.abs(p.account_balance || 0), 0);
      nudges.push({
        id: "overdue-payments",
        type: "overdue_payments",
        icon: "PoundSterling",
        title: `${overdue.length} pupil${overdue.length > 1 ? "s" : ""} owe £${Math.round(totalOwed)}`,
        action_label: "Send reminders",
        action_route: "/instructor/payments",
        priority: 1,
      });
    }

    // 3. Upcoming tests (within 7 days)
    const weekAhead = format(addDays(new Date(), 7), "yyyy-MM-dd");
    const { data: testPupils } = await supabase
      .from("pupils")
      .select("id, name, test_date, profile_image_url")
      .eq("instructor_id", instructor_id)
      .is("deleted_at", null)
      .gte("test_date", today)
      .lte("test_date", weekAhead);

    if (testPupils) {
      for (const p of testPupils) {
        const daysUntil = Math.ceil((new Date(p.test_date!).getTime() - Date.now()) / 86400000);
        nudges.push({
          id: `test-${p.id}`,
          type: "upcoming_test",
          icon: "Award",
          title: `${p.name}'s test is in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
          action_label: "Schedule mock",
          action_route: "/instructor/diary",
          priority: daysUntil <= 3 ? 1 : 2,
          pupil_id: p.id,
          pupil_name: p.name,
          pupil_image: p.profile_image_url || null,
        });
      }
    }

    // 4. Schedule gaps today
    const { data: todayLessons } = await supabase
      .from("scheduled_lessons")
      .select("start_time, duration_minutes")
      .eq("instructor_id", instructor_id)
      .eq("lesson_date", today)
      .neq("status", "cancelled")
      .order("start_time");

    if (todayLessons && todayLessons.length >= 2) {
      for (let i = 0; i < todayLessons.length - 1; i++) {
        const endMinutes = timeToMinutes(todayLessons[i].start_time) + (todayLessons[i].duration_minutes || 60);
        const nextStart = timeToMinutes(todayLessons[i + 1].start_time);
        const gap = nextStart - endMinutes;
        if (gap >= 90) {
          nudges.push({
            id: `gap-${i}`,
            type: "schedule_gap",
            icon: "Clock",
            title: `${Math.round(gap / 60)}hr gap in your schedule today`,
            action_label: "Fill gap",
            action_route: "/instructor/gaps",
            priority: 3,
          });
          break;
        }
      }
    }

    // Sort by priority
    nudges.sort((a, b) => a.priority - b.priority);

    return new Response(JSON.stringify({ nudges: nudges.slice(0, 5) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Nudges error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}
