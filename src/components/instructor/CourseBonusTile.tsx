import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, ChevronUp, Trophy, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIER_THRESHOLDS, nextTier, tierForPoints, type Tier } from "@/constants/rewardsConfig";

interface CourseBonusTileProps {
  instructorId: string;
}

const ROUTE = "/instructor/payments?tab=bonus";
const REWARDS_ROUTE = "/instructor/rewards";

interface LoyaltyData {
  total_points: number;
  tier: Tier;
}

// Tier badge palette (per spec)
const TIER_BADGE: Record<string, { bg: string; fg: string; label: string }> = {
  bronze:   { bg: "#FEF3C7", fg: "#92400E", label: "Bronze" },
  silver:   { bg: "#F3F4F6", fg: "#374151", label: "Silver" },
  gold:     { bg: "#FEF9C3", fg: "#713F12", label: "Gold" },
  platinum: { bg: "#EDE9FE", fg: "#4C1D95", label: "Platinum" },
  elite:    { bg: "#0A3070", fg: "#FFFFFF", label: "Elite" },
  suspended:{ bg: "#F3F4F6", fg: "#6B7280", label: "Suspended" },
};

// Design tokens with fallbacks
const C = {
  bgPrimary:   "var(--color-background-primary, #FFFFFF)",
  bgSecondary: "var(--color-background-secondary, #F9FAFB)",
  textPrimary: "var(--color-text-primary, #111827)",
  textSecondary: "var(--color-text-secondary, #6B7280)",
  borderTertiary: "var(--color-border-tertiary, #E5E7EB)",
  radiusLg: "var(--border-radius-lg, 12px)",
};

export function CourseBonusTile({ instructorId }: CourseBonusTileProps) {
  const navigate = useNavigate();
  const [count, setCount] = useState<number | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    let active = true;

    const fetchCount = async () => {
      const { count: c, error } = await supabase
        .from("pupils")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .eq("course_status", "completed");
      if (!active) return;
      if (error) {
        setCount(0);
        return;
      }
      setCount(c ?? 0);
    };

    const fetchLoyalty = async () => {
      const seasonYear = new Date().getUTCFullYear();
      const { data } = await supabase
        .from("instructor_points")
        .select("total_points, tier")
        .eq("instructor_id", instructorId)
        .eq("season_year", seasonYear)
        .maybeSingle();
      if (!active) return;
      setLoyalty((data as LoyaltyData) ?? null);
    };

    fetchCount();
    fetchLoyalty();

    const channel = supabase
      .channel(`course-bonus-${instructorId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "pupils",
        filter: `instructor_id=eq.${instructorId}`,
      }, () => fetchCount())
      .on("postgres_changes", {
        event: "*", schema: "public", table: "instructor_points",
        filter: `instructor_id=eq.${instructorId}`,
      }, () => fetchLoyalty())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [instructorId]);

  const go = () => navigate(ROUTE);
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  // Loyalty calc
  const totalPts = loyalty?.total_points ?? 0;
  const currentTier: Tier = loyalty?.tier ?? tierForPoints(totalPts);
  const tierKey = currentTier in TIER_BADGE ? currentTier : "bronze";
  const badge = TIER_BADGE[tierKey];
  const next = currentTier === "suspended" ? null : nextTier(currentTier);
  const baseMin = currentTier === "suspended" ? 0 : (TIER_THRESHOLDS[currentTier as Exclude<Tier, "suspended">]?.min ?? 0);
  const nextDef = next ? TIER_THRESHOLDS[next] : null;
  const progressPct = nextDef
    ? Math.min(100, Math.max(0, ((totalPts - baseMin) / (nextDef.min - baseMin)) * 100))
    : 100;
  const ptsToNext = nextDef ? Math.max(0, nextDef.min - totalPts) : 0;
  const isElite = currentTier === "elite";

  return (
    <div
      style={{
        background: C.bgPrimary,
        borderRadius: C.radiusLg,
        border: `0.5px solid ${C.borderTertiary}`,
        overflow: "hidden",
        boxShadow: "none",
      }}
    >
      {/* ── Top row: title + chevron-right (navigates) ── */}
      <button
        onClick={go}
        aria-label="Course and loyalty bonus"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Trophy size={20} color="#B45309" style={{ flexShrink: 0 }} strokeWidth={1.75} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, lineHeight: 1.2 }}>
            Course &amp; loyalty bonus
          </div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 1, lineHeight: 1.3 }}>
            £50 per course · Plus rewards points
          </div>
        </div>
        <ChevronRight size={16} color={C.textSecondary} style={{ flexShrink: 0 }} />
      </button>

      {/* ── Tier row: medal + label + badge + toggle chevron ── */}
      <button
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls="loyalty-drawer"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "transparent",
          border: "none",
          borderTop: `0.5px solid ${C.borderTertiary}`,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Medal size={14} color="#B45309" strokeWidth={1.75} />
          <span style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary }}>
            DSM Pro Rewards
          </span>
          <span
            style={{
              background: badge.bg,
              color: badge.fg,
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 20,
              lineHeight: 1.4,
            }}
          >
            {badge.label}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={16} color={C.textSecondary} />
        ) : (
          <ChevronDown size={16} color={C.textSecondary} />
        )}
      </button>

      {/* ── Expandable drawer ── */}
      {expanded && (
        <div
          id="loyalty-drawer"
          style={{
            background: C.bgSecondary,
            borderTop: `0.5px solid ${C.borderTertiary}`,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Current points */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: C.textSecondary }}>Current points</span>
            <span style={{ color: C.textPrimary, fontWeight: 500 }}>
              {totalPts.toLocaleString()} pts
            </span>
          </div>

          {/* Next tier */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: C.textSecondary }}>Next tier</span>
            {isElite ? (
              <span style={{ color: "#059669", fontWeight: 500 }}>
                You've reached Elite — top tier!
              </span>
            ) : nextDef ? (
              <span style={{ color: "#B45309", fontWeight: 500 }}>
                {nextDef.label} — {ptsToNext.toLocaleString()} pts away
              </span>
            ) : (
              <span style={{ color: C.textSecondary }}>—</span>
            )}
          </div>

          {/* Progress bar */}
          <div
            style={{
              background: C.borderTertiary,
              borderRadius: 4,
              height: 4,
              overflow: "hidden",
              marginTop: 2,
            }}
          >
            <div
              style={{
                background: "#D97706",
                height: "100%",
                width: `${progressPct}%`,
                borderRadius: 4,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseBonusTile;
