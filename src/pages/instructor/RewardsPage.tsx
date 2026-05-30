import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Award, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoyaltyTile } from "@/components/instructor/rewards/LoyaltyTile";
import { PointsActivity } from "@/components/instructor/rewards/PointsActivity";
import {
  BADGE_DEFINITIONS,
  TIER_REWARDS,
  TIER_THRESHOLDS,
  TIER_ORDER,
  type Tier,
} from "@/constants/rewardsConfig";
import { cn } from "@/lib/utils";

interface LeaderRow {
  instructor_id: string;
  total_points: number;
  tier: Tier;
  rank: number;
  instructor_name: string | null;
  avatar_url: string | null;
}

interface BadgeRow {
  badge_key: string;
  earned_at: string;
  is_permanent: boolean;
}

export default function RewardsPage() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;

  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [myBadges, setMyBadges] = useState<BadgeRow[]>([]);
  const [loadingLb, setLoadingLb] = useState(true);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      const seasonYear = new Date().getUTCFullYear();
      // Leaderboard — top 50, exclude placeholders, exclude opted-out
      const { data } = await supabase
        .from("instructor_points")
        .select(
          "instructor_id, total_points, tier, instructors!inner(name, profile_image_url, is_network_placeholder, show_on_leaderboard)",
        )
        .eq("season_year", seasonYear)
        .eq("instructors.is_network_placeholder", false)
        .eq("instructors.show_on_leaderboard", true)
        .order("total_points", { ascending: false })
        .limit(50);

      if (!cancelled && data) {
        setLeaders(
          (data as any[]).map((r, i) => ({
            instructor_id: r.instructor_id,
            total_points: r.total_points,
            tier: r.tier,
            rank: i + 1,
            instructor_name: r.instructors?.name ?? null,
            avatar_url: r.instructors?.profile_image_url ?? null,
          })),
        );
        setLoadingLb(false);
      }

      const { data: badges } = await supabase
        .from("instructor_badges")
        .select("badge_key, earned_at, is_permanent")
        .eq("instructor_id", instructorId)
        .eq("season_year", seasonYear);
      if (!cancelled) setMyBadges((badges as BadgeRow[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  if (!instructorId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  const earnedSet = new Set(myBadges.map((b) => b.badge_key));

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-base font-bold text-slate-900">DSM Pro Rewards</h1>
          <p className="text-[11px] text-slate-500">
            Season {new Date().getUTCFullYear()} — points reset annually
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <LoyaltyTile instructorId={instructorId} />

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white rounded-2xl p-1 h-auto">
            <TabsTrigger value="leaderboard" className="rounded-xl py-2">
              <Trophy className="w-4 h-4 mr-1.5" /> Leaderboard
            </TabsTrigger>
            <TabsTrigger value="badges" className="rounded-xl py-2">
              <Award className="w-4 h-4 mr-1.5" /> Badges
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl py-2">
              <History className="w-4 h-4 mr-1.5" /> History
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard */}
          <TabsContent value="leaderboard" className="mt-4">
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              {loadingLb ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading…</div>
              ) : leaders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No instructors on the leaderboard yet this season.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {leaders.map((l) => {
                    const isMe = l.instructor_id === instructorId;
                    const tierEmoji =
                      l.tier !== "suspended"
                        ? TIER_THRESHOLDS[l.tier as Exclude<Tier, "suspended">]?.emoji
                        : "⏸️";
                    return (
                      <li
                        key={l.instructor_id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3",
                          isMe && "bg-blue-50",
                        )}
                      >
                        <div className="w-7 text-center font-bold text-slate-900 text-sm tabular-nums">
                          {l.rank === 1 ? "🥇" : l.rank === 2 ? "🥈" : l.rank === 3 ? "🥉" : l.rank}
                        </div>
                        {l.avatar_url ? (
                          <img
                            src={l.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {l.instructor_name ?? "Instructor"}
                            {isMe && (
                              <span className="ml-2 text-[10px] text-blue-600 font-semibold">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {tierEmoji} {l.tier}
                          </div>
                        </div>
                        <div className="text-sm font-bold tabular-nums text-slate-900">
                          {l.total_points.toLocaleString()}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Tier rewards reference */}
            <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Tier rewards</h3>
              <div className="space-y-3">
                {TIER_ORDER.map((t) => {
                  const def = TIER_THRESHOLDS[t as Exclude<Tier, "suspended">];
                  const rewards = TIER_REWARDS[t as Exclude<Tier, "suspended">];
                  if (rewards.length === 0) return null;
                  return (
                    <details key={t} className="rounded-xl border border-slate-100">
                      <summary className="px-3 py-2 text-xs font-semibold text-slate-900 cursor-pointer flex justify-between">
                        <span>
                          {def.emoji} {def.label}
                        </span>
                        <span className="text-slate-500">{def.min.toLocaleString()}+ pts</span>
                      </summary>
                      <ul className="px-4 pb-3 pt-1 space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                        {rewards.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </details>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {BADGE_DEFINITIONS.map((b) => {
                const earned = earnedSet.has(b.key);
                return (
                  <div
                    key={b.key}
                    className={cn(
                      "rounded-2xl border p-4 text-center",
                      earned
                        ? "bg-white border-amber-200 shadow-sm"
                        : "bg-slate-50 border-slate-200 opacity-60",
                    )}
                  >
                    <div className="text-3xl mb-1">{b.emoji}</div>
                    <div className="text-xs font-bold text-slate-900">{b.label}</div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                      {b.condition}
                    </div>
                    {earned && (
                      <div className="text-[9px] text-amber-700 mt-2 font-semibold uppercase tracking-wide">
                        Earned
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="mt-4">
            <PointsActivity instructorId={instructorId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
