import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { TIER_THRESHOLDS, type Tier } from "@/constants/rewardsConfig";
import { cn } from "@/lib/utils";

const DSM_RED = "#C0271F";
const AMBER = "#B45309";

interface LeaderRow {
  instructor_id: string;
  total_points: number;
  tier: Tier;
  rank: number;
  instructor_name: string | null;
  avatar_url: string | null;
}

export default function RewardsLeaderboardPage() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;

  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seasonYear = new Date().getUTCFullYear();
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

      if (cancelled) return;
      setLeaders(
        ((data as any[]) ?? []).map((r, i) => ({
          instructor_id: r.instructor_id,
          total_points: r.total_points,
          tier: r.tier,
          rank: i + 1,
          instructor_name: r.instructors?.name ?? null,
          avatar_url: r.instructors?.profile_image_url ?? null,
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="min-h-screen pb-10"
      style={{ background: "var(--color-background-secondary, #F4F7F6)" }}
    >
      <header
        className="sticky top-0 z-10 flex items-center gap-3 bg-white"
        style={{ padding: "14px 16px", borderBottom: `3px solid ${DSM_RED}` }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{ color: "var(--color-text-primary, #111827)" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="flex-1 text-center"
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: "var(--color-text-primary, #111827)",
          }}
        >
          Leaderboard
        </h1>
        <Trophy size={20} style={{ color: AMBER }} />
      </header>

      <p
        style={{
          fontSize: 11,
          color: "var(--color-text-secondary, #6B7280)",
          padding: "12px 16px 4px",
          margin: 0,
        }}
      >
        Season {new Date().getUTCFullYear()} · Top 50
      </p>

      <div
        style={{
          background: "#fff",
          border: "0.5px solid var(--color-border-tertiary, #E5E7EB)",
          borderRadius: 12,
          margin: "8px 16px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div className="p-6 text-center text-xs" style={{ color: "var(--color-text-secondary, #6B7280)" }}>
            Loading…
          </div>
        ) : leaders.length === 0 ? (
          <div className="p-8 text-center text-xs" style={{ color: "var(--color-text-secondary, #6B7280)" }}>
            No instructors on the leaderboard yet this season.
          </div>
        ) : (
          <ul>
            {leaders.map((l, i) => {
              const isMe = l.instructor_id === instructorId;
              const tierEmoji =
                l.tier !== "suspended"
                  ? TIER_THRESHOLDS[l.tier as Exclude<Tier, "suspended">]?.emoji
                  : "⏸️";
              return (
                <li
                  key={l.instructor_id}
                  className={cn("flex items-center gap-3 px-4 py-3")}
                  style={{
                    borderBottom:
                      i === leaders.length - 1
                        ? "none"
                        : "0.5px solid var(--color-border-tertiary, #E5E7EB)",
                    background: isMe ? "#DBEAFE" : "transparent",
                  }}
                >
                  <div className="w-7 text-center text-sm font-semibold tabular-nums">
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
                    <div className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary, #111827)" }}>
                      {l.instructor_name ?? "Instructor"}
                      {isMe && (
                        <span className="ml-2 text-[10px] font-semibold" style={{ color: "#1E4D9B" }}>
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--color-text-secondary, #6B7280)" }}>
                      {tierEmoji} {l.tier}
                    </div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-text-primary, #111827)" }}>
                    {l.total_points.toLocaleString("en-GB")}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
