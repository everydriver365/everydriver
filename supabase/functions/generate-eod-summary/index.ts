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
    const todayStart = `${today}T00:00:00`;
    const todayEnd = `${today}T23:59:59`;

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

    // Today's telematics alerts (speeding, harsh braking, etc.)
    const { data: telematicsSessions } = await supabase
      .from("lesson_telematics")
      .select("id")
      .eq("instructor_id", instructor_id)
      .gte("started_at", todayStart)
      .lte("started_at", todayEnd);

    let alertCounts = { speeding: 0, harsh_brake: 0, harsh_accel: 0, sharp_turn: 0 };
    if (telematicsSessions && telematicsSessions.length > 0) {
      const sessionIds = telematicsSessions.map(s => s.id);
      const { data: alerts } = await supabase
        .from("telematics_alerts")
        .select("alert_type")
        .in("telematics_id", sessionIds);

      if (alerts) {
        for (const a of alerts) {
          if (a.alert_type in alertCounts) {
            alertCounts[a.alert_type as keyof typeof alertCounts]++;
          }
        }
      }
    }
    const totalAlerts = Object.values(alertCounts).reduce((a, b) => a + b, 0);

    // Vehicle service/MOT reminders (upcoming within 30 days)
    const { data: vehicles } = await supabase
      .from("instructor_vehicles")
      .select("registration, mot_expiry_date, service_due_date, insurance_expiry_date, tax_due_date")
      .eq("instructor_id", instructor_id);

    const serviceReminders: string[] = [];
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (vehicles) {
      for (const v of vehicles) {
        const reg = v.registration || "Vehicle";
        if (v.mot_expiry_date && new Date(v.mot_expiry_date) <= in30Days) {
          serviceReminders.push(`MOT due ${format(new Date(v.mot_expiry_date), "d MMM")} (${reg})`);
        }
        if (v.service_due_date && new Date(v.service_due_date) <= in30Days) {
          serviceReminders.push(`Service due ${format(new Date(v.service_due_date), "d MMM")} (${reg})`);
        }
        if (v.insurance_expiry_date && new Date(v.insurance_expiry_date) <= in30Days) {
          serviceReminders.push(`Insurance due ${format(new Date(v.insurance_expiry_date), "d MMM")} (${reg})`);
        }
        if (v.tax_due_date && new Date(v.tax_due_date) <= in30Days) {
          serviceReminders.push(`Tax due ${format(new Date(v.tax_due_date), "d MMM")} (${reg})`);
        }
      }
    }

    // Unpaid pupil balances
    const { data: unpaidPupils } = await supabase
      .from("pupils")
      .select("name, account_balance")
      .eq("instructor_id", instructor_id)
      .lt("account_balance", 0)
      .is("deleted_at", null);

    const outstandingBalance = Math.abs(
      (unpaidPupils || []).reduce((s, p) => s + (p.account_balance || 0), 0)
    );
    const unpaidCount = unpaidPupils?.length || 0;

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
      alertCounts,
      totalAlerts,
      serviceReminders,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      unpaidPupilCount: unpaidCount,
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
              content: `You are ED, a friendly driving instructor assistant. Write a brief end-of-day summary (4-6 sentences). Be warm and encouraging. Mention lessons completed, miles driven, earnings, and any driving alerts if present. If there are service reminders or outstanding balances, mention them briefly. Preview tomorrow if lessons exist. Keep it under 100 words. Do NOT use markdown.`
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
