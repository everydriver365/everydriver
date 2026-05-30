import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mirror of src/constants/rewardsConfig.ts thresholds (kept local — edge runtime can't import from src)
const TIER_THRESHOLDS = {
  bronze:   0,
  silver:   1000,
  gold:     2500,
  platinum: 5000,
  elite:    10000,
};
const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'elite'] as const;

function tierForPoints(points: number) {
  if (points >= TIER_THRESHOLDS.elite) return 'elite';
  if (points >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold) return 'gold';
  if (points >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

function isLowerTier(a: string, b: string) {
  return TIER_ORDER.indexOf(a as any) < TIER_ORDER.indexOf(b as any);
}

interface AwardPayload {
  instructor_id: string;
  points: number;
  reason: string;
  category: 'course' | 'lesson' | 'compliance' | 'review' | 'complaint' | 'loyalty' | 'referral' | 'manual';
  reference_id?: string;
  status?: 'confirmed' | 'pending';
  notes?: string;
  // Idempotency: skip insert if a confirmed transaction exists with the same
  // (instructor_id, category, reason) — used for one-off loyalty awards.
  one_off?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json() as AwardPayload;
    if (!body.instructor_id || typeof body.points !== 'number' || !body.reason || !body.category) {
      return new Response(JSON.stringify({ error: "instructor_id, points, reason and category are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify instructor exists AND is not a network placeholder
    const { data: instructor, error: instErr } = await supabase
      .from('instructors')
      .select('id, is_network_placeholder, notify_tier_change')
      .eq('id', body.instructor_id)
      .maybeSingle();

    if (instErr) throw instErr;
    if (!instructor) {
      return new Response(JSON.stringify({ error: "Instructor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (instructor.is_network_placeholder) {
      return new Response(JSON.stringify({ error: "Network placeholder instructors cannot earn points" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const seasonYear = new Date().getUTCFullYear();

    // Idempotency check for one-off awards (loyalty milestones, profile complete, etc.)
    if (body.one_off) {
      const { data: existing } = await supabase
        .from('instructor_point_transactions')
        .select('id')
        .eq('instructor_id', body.instructor_id)
        .eq('category', body.category)
        .eq('reason', body.reason)
        .eq('status', 'confirmed')
        .limit(1);
      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ skipped: true, reason: 'already_awarded' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // 1. Insert transaction
    const { error: txErr } = await supabase
      .from('instructor_point_transactions')
      .insert({
        instructor_id: body.instructor_id,
        points: body.points,
        reason: body.reason,
        category: body.category,
        reference_id: body.reference_id ?? null,
        status: body.status ?? 'confirmed',
        season_year: seasonYear,
        notes: body.notes ?? null,
      });
    if (txErr) throw txErr;

    // 2. Upsert instructor_points (pending tx contribute to display total via separate calc below — for the
    //    stored total we only count confirmed; that keeps the running total honest).
    const { data: currentRow } = await supabase
      .from('instructor_points')
      .select('id, total_points, tier, tier_drop_grace_period_until')
      .eq('instructor_id', body.instructor_id)
      .eq('season_year', seasonYear)
      .maybeSingle();

    const previousTotal = currentRow?.total_points ?? 0;
    const previousTier = currentRow?.tier ?? 'bronze';
    const isConfirmed = (body.status ?? 'confirmed') === 'confirmed';
    const newTotal = isConfirmed ? Math.max(0, previousTotal + body.points) : previousTotal;
    const naturalTier = tierForPoints(newTotal);

    // Fairness: do not downgrade instantly. If natural tier is lower than stored tier,
    // set/keep a 30-day grace window; the monthly cron handles the actual downgrade.
    let newTier = previousTier;
    let graceUntil = currentRow?.tier_drop_grace_period_until ?? null;
    let tierChanged = false;

    if (previousTier === 'suspended') {
      newTier = 'suspended';
    } else if (!isLowerTier(naturalTier, previousTier)) {
      // Upgrade or same tier — apply immediately and clear any grace window
      if (naturalTier !== previousTier) {
        newTier = naturalTier;
        tierChanged = true;
      }
      graceUntil = null;
    } else {
      // Natural tier is lower — start grace period if not already set
      if (!graceUntil) {
        graceUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    if (currentRow) {
      const { error: upErr } = await supabase
        .from('instructor_points')
        .update({
          total_points: newTotal,
          tier: newTier,
          tier_updated_at: tierChanged ? new Date().toISOString() : undefined,
          tier_drop_grace_period_until: graceUntil,
        })
        .eq('id', currentRow.id);
      if (upErr) throw upErr;
    } else {
      const { error: insErr } = await supabase
        .from('instructor_points')
        .insert({
          instructor_id: body.instructor_id,
          total_points: newTotal,
          season_year: seasonYear,
          tier: newTier,
          tier_updated_at: tierChanged ? new Date().toISOString() : null,
          tier_drop_grace_period_until: graceUntil,
        });
      if (insErr) throw insErr;
    }

    // 3. Trigger badge check (fire-and-forget)
    if (isConfirmed) {
      supabase.functions.invoke('check-instructor-badges', {
        body: { instructor_id: body.instructor_id },
      }).catch((e) => console.error('badge check failed', e));
    }

    // 4. Tier change notification (only if instructor opted in)
    if (tierChanged && instructor.notify_tier_change) {
      supabase.functions.invoke('notify-rewards', {
        body: {
          instructor_id: body.instructor_id,
          type: 'TIER_UPGRADE',
          context: { tier: newTier },
        },
      }).catch((e) => console.error('notify failed', e));
    }

    return new Response(JSON.stringify({
      success: true,
      total_points: newTotal,
      tier: newTier,
      tier_changed: tierChanged,
      grace_until: graceUntil,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error('award-instructor-points error', err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
