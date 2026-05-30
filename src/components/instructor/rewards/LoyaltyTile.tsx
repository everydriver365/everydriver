import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TIER_THRESHOLDS, TIER_REWARDS, nextTier, tierForPoints, type Tier } from "@/constants/rewardsConfig";
import { cn } from "@/lib/utils";

interface Props {
  instructorId: string;
  className?: string;
}

interface PointsRow {
  total_points: number;
  tier: Tier;
}

/**
 * DSM Pro Rewards — at-a-glance tile for the instructor dashboard.
 * Tappable: navigates to /rewards. Live data only — renders an empty state
 * when no row exists yet (instructor has earned 0 confirmed points).
 */
export function LoyaltyTile({ instructorId, className }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<PointsRow | null>(null);
  const [monthDelta, setMonthDelta] = useState<{ pos: number; neg: number } | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const seasonYear = new Date().getUTCFullYear();
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);

      // Points + tier
      const { data: pts } = await supabase
        .from("instructor_points")
        .select("total_points, tier")
        .eq("instructor_id", instructorId)
        .eq("season_year", seasonYear)
        .maybeSingle();

      // Month transactions for delta
      const { data: txs } = await supabase
        .from("instructor_point_transactions")
        .select("points")
        .eq("instructor_id", instructorId)
        .eq("status", "confirmed")
        .gte("created_at", monthStart.toISOString());

      // Rank — count of real instructors above this total
      let myRank: number | null = null;
      if (pts) {
        const { count } = await supabase
          .from("instructor_points")
          .select("instructor_id, instructors!inner(is_network_placeholder)", { count: "exact", head: true })
          .eq("season_year", seasonYear)
          .gt("total_points", pts.total_points)
          .eq("instructors.is_network_placeholder", false);
        myRank = (count ?? 0) + 1;
      }

      if (cancelled) return;
      setData((pts as PointsRow) ?? null);
      if (txs) {
        const pos = txs.filter((t: any) => t.points > 0).reduce((s: number, t: any) => s + t.points, 0);
        const neg = txs.filter((t: any) => t.points < 0).reduce((s: number, t: any) => s + t.points, 0);
        setMonthDelta({ pos, neg });
      }
      setRank(myRank);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [instructorId]);

  if (loading) {
    return (
      <div className={cn("rounded-2xl p-4 h-32 animate-pulse", className)}
           style={{ background: "linear-gradient(135deg, #1E4D9B 0%, #0A3070 100%)" }} />
    );
  }

  const total = data?.total_points ?? 0;
  const currentTier = data?.tier ?? tierForPoints(total);
  const next = currentTier === "suspended" ? null : nextTier(currentTier);
  const tierDef = currentTier === "suspended"
    ? { emoji: "⏸️", label: "Suspended" }
    : TIER_THRESHOLDS[currentTier as Exclude<Tier, "suspended">];
  const nextDef = next ? TIER_THRESHOLDS[next] : null;
  const progressPct = nextDef
    ? Math.min(100, Math.max(0, ((total - (TIER_THRESHOLDS[currentTier as Exclude<Tier, "suspended">]?.min ?? 0)) /
        (nextDef.min - (TIER_THRESHOLDS[currentTier as Exclude<Tier, "suspended">]?.min ?? 0))) * 100))
    : 100;
  const ptsToNext = nextDef ? Math.max(0, nextDef.min - total) : 0;
  const nextRewardsPreview = next ? TIER_REWARDS[next].slice(0, 2).join(" • ") : "Top tier — keep it up!";

  return (
    <button
      onClick={() => navigate("/rewards")}
      className={cn(
        "w-full text-left rounded-2xl p-4 transition-transform active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-white/30",
        className,
      )}
      style={{ background: "linear-gradient(135deg, #1E4D9B 0%, #0A3070 100%)" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-white font-extrabold text-lg leading-tight">
          {tierDef.emoji} {tierDef.label}
        </div>
        <div className="text-white/80 text-xs font-semibold">
          {total.toLocaleString()} pts
        </div>
      </div>

      <div className="mt-3 h-[5px] w-full rounded-full bg-white/20 overflow-hidden">
        <div className="h-full bg-white rounded-full transition-all"
             style={{ width: `${progressPct}%` }} />
      </div>

      <div className="mt-2 text-white/65 text-[10px] leading-snug">
        {next
          ? `${ptsToNext.toLocaleString()} pts to ${TIER_THRESHOLDS[next].label} — unlocks: ${nextRewardsPreview}`
          : nextRewardsPreview}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-white">
        <div className="opacity-90">
          <span className="opacity-60">This month: </span>
          <span className="font-semibold">{monthDelta ? `+${monthDelta.pos}` : "—"}</span>
        </div>
        <div className="opacity-90">
          <span className="opacity-60">Rank: </span>
          <span className="font-semibold">{rank ? `#${rank}` : "—"}</span>
        </div>
        <div className="opacity-90">
          <span className="opacity-60">Deductions: </span>
          <span className="font-semibold">{monthDelta ? `${monthDelta.neg}` : "—"}</span>
        </div>
      </div>
    </button>
  );
}
