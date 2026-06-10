import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get instructors with parent-reports toggle ON
    const { data: enabledInstructors } = await supabase
      .from("instructors")
      .select("id")
      .eq("ai_parent_reports_enabled", true);
    const enabledIds = new Set((enabledInstructors || []).map((i: any) => i.id));

    // Get all pupils with parent phones, then filter by enabled instructors
    const { data: pupilsRaw } = await supabase
      .from("pupils")
      .select("id, name, parent_phone, instructor_id, lessons_completed, progress, account_balance")
      .not("parent_phone", "is", null);

    const pupils = (pupilsRaw || []).filter((p: any) => enabledIds.has(p.instructor_id));

    if (!pupils || pupils.length === 0) {
      return new Response(JSON.stringify({ message: "No parents to notify (toggle off or no pupils)" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    let sent = 0;

    // Group by parent phone
    const parentMap = new Map<string, typeof pupils>();
    pupils.forEach((p) => {
      const phone = p.parent_phone!.replace(/\s+/g, "");
      if (!parentMap.has(phone)) parentMap.set(phone, []);
      parentMap.get(phone)!.push(p);
    });

    for (const [phone, children] of parentMap) {
      let summary = "📋 Weekly Driving Summary\n\n";

      for (const child of children) {
        // Get lessons this week
        const { data: lessons } = await supabase
          .from("lesson_history")
          .select("lesson_date, duration_minutes, skills_practiced")
          .eq("pupil_id", child.id)
          .gte("lesson_date", oneWeekAgo)
          .order("lesson_date", { ascending: true });

        const lessonsCount = lessons?.length || 0;
        const totalMins = lessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
        const skills = new Set<string>();
        lessons?.forEach((l) => {
          if (l.skills_practiced && Array.isArray(l.skills_practiced)) {
            l.skills_practiced.forEach((s: string) => skills.add(s));
          }
        });

        // Get upcoming lessons
        const today = new Date().toISOString().split("T")[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
        const { data: upcoming } = await supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time")
          .eq("pupil_id", child.id)
          .gte("lesson_date", today)
          .lte("lesson_date", nextWeek)
          .neq("status", "cancelled")
          .order("lesson_date", { ascending: true });

        summary += `🚗 ${child.name}\n`;
        summary += `• ${lessonsCount} lesson${lessonsCount !== 1 ? "s" : ""} this week (${totalMins} mins)\n`;
        summary += `• Overall progress: ${child.progress || 0}%\n`;
        if (skills.size > 0) {
          summary += `• Skills covered: ${Array.from(skills).slice(0, 3).join(", ")}\n`;
        }
        if ((child.account_balance || 0) < 0) {
          summary += `⚠️ Balance due: £${Math.abs(child.account_balance || 0).toFixed(2)}\n`;
        }
        if (upcoming && upcoming.length > 0) {
          summary += `📅 Next: ${upcoming[0].lesson_date} at ${upcoming[0].start_time}\n`;
        }
        summary += "\n";
      }

      // Send SMS
      try {
        await supabase.functions.invoke("send-sms", {
          body: { to: phone, message: summary.trim() },
        });
        sent++;
      } catch (e) {
        console.error(`Failed to send to ${phone}:`, e);
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Weekly summary error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
