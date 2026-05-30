import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BADGES = [
  { key: 'five_star',     label: '5-Star Rated',    emoji: '⭐', permanent: false },
  { key: 'pass_machine',  label: 'Pass Machine',    emoji: '🎓', permanent: false },
  { key: 'on_a_roll',     label: 'On a Roll',       emoji: '🔥', permanent: false },
  { key: 'compliant',     label: 'Fully Compliant', emoji: '✅', permanent: false },
  { key: 'syllabus_pro',  label: 'Syllabus Pro',    emoji: '📚', permanent: false },
  { key: 'course_master', label: 'Course Master',   emoji: '🎯', permanent: false },
  { key: 'loyal_pro',     label: 'Loyal Pro',       emoji: '💎', permanent: false },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { instructor_id } = await req.json();
    if (!instructor_id) {
      return new Response(JSON.stringify({ error: "instructor_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: instructor } = await supabase
      .from('instructors')
      .select('id, created_at, adi_badge_expiry, dbs_certificate_expiry, car_insurance_expiry, is_network_placeholder, notify_badge_earned')
      .eq('id', instructor_id)
      .maybeSingle();

    if (!instructor || instructor.is_network_placeholder) {
      return new Response(JSON.stringify({ skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const seasonYear = new Date().getUTCFullYear();
    const seasonStart = `${seasonYear}-01-01`;

    // Already-earned set
    const { data: earned } = await supabase
      .from('instructor_badges')
      .select('badge_key')
      .eq('instructor_id', instructor_id)
      .eq('season_year', seasonYear);
    const earnedKeys = new Set((earned ?? []).map((b: any) => b.badge_key));

    const checks: Record<string, () => Promise<boolean>> = {
      five_star: async () => {
        const { count } = await supabase
          .from('course_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('instructor_id', instructor_id)
          .gte('rating', 4)
          .gte('created_at', seasonStart);
        return (count ?? 0) >= 50;
      },
      pass_machine: async () => {
        const { count } = await supabase
          .from('driving_test_results')
          .select('id', { count: 'exact', head: true })
          .eq('instructor_id', instructor_id)
          .eq('result', 'pass')
          .gte('test_date', seasonStart);
        return (count ?? 0) >= 20;
      },
      on_a_roll: async () => {
        // 12 consecutive weeks with at least one lesson
        const { data } = await supabase
          .from('lesson_history')
          .select('lesson_date')
          .eq('instructor_id', instructor_id)
          .gte('lesson_date', seasonStart)
          .order('lesson_date', { ascending: false })
          .limit(500);
        if (!data || data.length === 0) return false;
        const weeks = new Set<string>();
        for (const row of data) {
          const d = new Date(row.lesson_date);
          // ISO week key (year-week)
          const onejan = new Date(d.getUTCFullYear(), 0, 1);
          const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getUTCDay() + 1) / 7);
          weeks.add(`${d.getUTCFullYear()}-${week}`);
        }
        // Build sorted weeks and find longest consecutive run
        const sorted = Array.from(weeks).sort();
        let best = 0, run = 0, prev: number | null = null;
        for (const w of sorted) {
          const [, ws] = w.split('-');
          const n = parseInt(ws, 10);
          if (prev !== null && n === prev + 1) run++; else run = 1;
          best = Math.max(best, run);
          prev = n;
        }
        return best >= 12;
      },
      compliant: async () => {
        const now = Date.now();
        const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;
        const docs = [instructor.adi_badge_expiry, instructor.dbs_certificate_expiry, instructor.car_insurance_expiry];
        // Each must be valid AND have been valid for 3+ months (expiry > now + 0 AND created/instructor age > 3mo)
        const allValid = docs.every((d: any) => d && new Date(d).getTime() > now);
        const ageOk = new Date(instructor.created_at).getTime() < now - threeMonthsMs;
        return allValid && ageOk;
      },
      syllabus_pro: async () => {
        const { count: lessons } = await supabase
          .from('lesson_history')
          .select('id', { count: 'exact', head: true })
          .eq('instructor_id', instructor_id)
          .gte('lesson_date', seasonStart);
        if (!lessons || lessons < 10) return false;
        const { count: updates } = await supabase
          .from('lesson_syllabus_updates')
          .select('id', { count: 'exact', head: true })
          .eq('instructor_id', instructor_id)
          .gte('created_at', seasonStart);
        return ((updates ?? 0) / lessons) >= 0.9;
      },
      course_master: async () => {
        const { count } = await supabase
          .from('instructor_courses')
          .select('id', { count: 'exact', head: true })
          .eq('instructor_id', instructor_id)
          .eq('is_active', true);
        return (count ?? 0) >= 10;
      },
      loyal_pro: async () => {
        const threeYearsMs = 3 * 365 * 24 * 60 * 60 * 1000;
        return new Date(instructor.created_at).getTime() < Date.now() - threeYearsMs;
      },
    };

    const awarded: string[] = [];

    for (const def of BADGES) {
      if (earnedKeys.has(def.key)) continue;
      let met = false;
      try { met = await checks[def.key](); } catch (e) { console.error(`badge ${def.key} check failed`, e); }
      if (!met) continue;

      const { error } = await supabase.from('instructor_badges').insert({
        instructor_id,
        badge_key: def.key,
        badge_label: def.label,
        badge_emoji: def.emoji,
        season_year: seasonYear,
        is_permanent: def.permanent,
      });
      if (!error) {
        awarded.push(def.key);
        if (instructor.notify_badge_earned) {
          supabase.functions.invoke('notify-rewards', {
            body: {
              instructor_id,
              type: 'BADGE_EARNED',
              context: { emoji: def.emoji, badge_label: def.label },
            },
          }).catch((e) => console.error('notify failed', e));
        }
      }
    }

    return new Response(JSON.stringify({ awarded }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error('check-instructor-badges error', err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
