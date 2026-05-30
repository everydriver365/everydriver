import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIER_THRESHOLDS = { bronze: 0, silver: 1000, gold: 2500, platinum: 5000, elite: 10000 };
function tierForPoints(p: number) {
  if (p >= TIER_THRESHOLDS.elite) return 'elite';
  if (p >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (p >= TIER_THRESHOLDS.gold) return 'gold';
  if (p >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

async function award(supabase: any, instructor_id: string, points: number, reason: string, category: string, opts: { one_off?: boolean } = {}) {
  return supabase.functions.invoke('award-instructor-points', {
    body: { instructor_id, points, reason, category, one_off: opts.one_off },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const isFirstOfMonth = now.getUTCDate() === 1;

    // 1. Load every real, active instructor (placeholder filter is mandatory)
    const { data: instructors, error } = await supabase
      .from('instructors')
      .select('id, created_at, adi_badge_expiry, dbs_certificate_expiry, car_insurance_expiry')
      .eq('is_network_placeholder', false)
      .eq('is_active', true);
    if (error) throw error;

    let processed = 0;
    let downgraded = 0;

    for (const inst of instructors ?? []) {
      processed++;

      // === Compliance (weekly) — run on Mondays ===
      if (now.getUTCDay() === 1) {
        const docs = [
          { field: 'adi_badge_expiry',         valid: 'ADI_VALID',         expired: 'ADI_EXPIRED',         pts_valid: 5,  pts_expired: -10, val: inst.adi_badge_expiry },
          { field: 'dbs_certificate_expiry',   valid: 'DBS_VALID',         expired: 'DBS_EXPIRED',         pts_valid: 5,  pts_expired: -10, val: inst.dbs_certificate_expiry },
          { field: 'car_insurance_expiry',     valid: 'INSURANCE_VALID',   expired: 'INSURANCE_EXPIRED',   pts_valid: 5,  pts_expired: -10, val: inst.car_insurance_expiry },
        ];
        for (const d of docs) {
          if (!d.val) continue;
          const isValid = new Date(d.val).getTime() > now.getTime();
          await award(supabase, inst.id, isValid ? d.pts_valid : d.pts_expired,
            isValid ? `Compliance: ${d.field} valid (weekly)` : `Compliance: ${d.field} expired (weekly)`,
            'compliance');
        }
      }

      // === Loyalty milestones (idempotent via one_off) ===
      const age = now.getTime() - new Date(inst.created_at).getTime();
      const years = age / (365 * 24 * 60 * 60 * 1000);
      if (years >= 1) await award(supabase, inst.id, 100, 'Loyalty: 1 year on DSM', 'loyalty', { one_off: true });
      if (years >= 2) await award(supabase, inst.id, 200, 'Loyalty: 2 years on DSM', 'loyalty', { one_off: true });
      if (years >= 3) await award(supabase, inst.id, 50,  'Loyalty: 3+ years on DSM', 'loyalty', { one_off: true });

      // === Monthly tier downgrade pass (1st of month, after grace) ===
      if (isFirstOfMonth) {
        const { data: pts } = await supabase
          .from('instructor_points')
          .select('id, total_points, tier, tier_drop_grace_period_until')
          .eq('instructor_id', inst.id)
          .eq('season_year', now.getUTCFullYear())
          .maybeSingle();
        if (pts && pts.tier !== 'suspended') {
          const natural = tierForPoints(pts.total_points);
          const grace = pts.tier_drop_grace_period_until ? new Date(pts.tier_drop_grace_period_until).getTime() : 0;
          if (natural !== pts.tier && grace > 0 && grace <= now.getTime()) {
            await supabase.from('instructor_points').update({
              tier: natural,
              tier_updated_at: now.toISOString(),
              tier_drop_grace_period_until: null,
            }).eq('id', pts.id);
            downgraded++;
            supabase.functions.invoke('notify-rewards', {
              body: { instructor_id: inst.id, type: 'TIER_DOWNGRADE',
                      context: { tier: natural, previous_tier: pts.tier, points: 0 } },
            }).catch(() => {});
          }
        }
      }

      // === Badge check ===
      supabase.functions.invoke('check-instructor-badges', { body: { instructor_id: inst.id } })
        .catch((e: any) => console.error('badge check failed', e));
    }

    return new Response(JSON.stringify({ processed, downgraded }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error('process-rewards-cron error', err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
