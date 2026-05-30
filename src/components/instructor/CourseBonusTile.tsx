import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TileCard } from "@/components/instructor/ui";
import { Icon3D, hasIcon3D } from "@/components/Icon3D";
import { TIER_THRESHOLDS, nextTier, tierForPoints, type Tier } from "@/constants/rewardsConfig";

interface CourseBonusTileProps {
  instructorId: string;
}

const FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';
const ROUTE = "/instructor/payments?tab=bonus";
const REWARDS_ROUTE = "/instructor/rewards";
const BONUS_PER_COURSE = 50;

const INNER: React.CSSProperties = { padding: 14, fontFamily: FONT };

const eyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.6,
  color: "#8a93a4",
  textTransform: "uppercase",
};

interface LoyaltyData {
  total_points: number;
  tier: Tier;
}

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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pupils",
          filter: `instructor_id=eq.${instructorId}`,
        },
        () => fetchCount(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "instructor_points",
          filter: `instructor_id=eq.${instructorId}`,
        },
        () => fetchLoyalty(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [instructorId]);

  const go = () => navigate(ROUTE);
  const goRewards = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(REWARDS_ROUTE);
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  // Expandable loyalty section — collapsed by default, opens on tap
  const renderLoyaltySection = () => {
    const total = loyalty?.total_points ?? 0;
    const currentTier = loyalty?.tier ?? tierForPoints(total);
    const next = currentTier === "suspended" ? null : nextTier(currentTier);
    const tierDef = currentTier === "suspended"
      ? { emoji: "⏸️", label: "Suspended" }
      : TIER_THRESHOLDS[currentTier as Exclude<Tier, "suspended">];
    const nextDef = next ? TIER_THRESHOLDS[next] : null;
    const baseMin = TIER_THRESHOLDS[currentTier as Exclude<Tier, "suspended">]?.min ?? 0;
    const progressPct = nextDef
      ? Math.min(100, Math.max(0, ((total - baseMin) / (nextDef.min - baseMin)) * 100))
      : 100;
    const ptsToNext = nextDef ? Math.max(0, nextDef.min - total) : 0;

    return (
      <div style={{ marginTop: 10, borderTop: "1px solid #F0F1F4", paddingTop: 10 }}>
        <button
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-controls="loyalty-panel"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#1E4D9B" }}>
            <Trophy size={12} color="#1E4D9B" />
            DSM Pro Rewards · {tierDef.emoji} {tierDef.label}
          </span>
          <ChevronDown
            size={14}
            color="#8a93a4"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms ease",
            }}
          />
        </button>

        {expanded && (
          <button
            id="loyalty-panel"
            onClick={goRewards}
            style={{
              marginTop: 10,
              width: "100%",
              textAlign: "left",
              background: "linear-gradient(135deg, #1E4D9B 0%, #0A3070 100%)",
              borderRadius: 12,
              padding: "10px 12px",
              border: "none",
              cursor: "pointer",
              fontFamily: FONT,
            }}
            aria-label={`Open DSM Pro Rewards — ${tierDef.label}, ${total} points`}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {tierDef.emoji} {tierDef.label}
              </span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 600 }}>
                {total.toLocaleString()} pts
              </span>
            </div>
            <div
              style={{
                marginTop: 6,
                height: 4,
                width: "100%",
                background: "rgba(255,255,255,0.2)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "#fff",
                  borderRadius: 999,
                  transition: "width 200ms ease",
                }}
              />
            </div>
            <div style={{ marginTop: 4, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
              {nextDef
                ? `${ptsToNext.toLocaleString()} pts to ${nextDef.label}`
                : "Top tier — keep it up!"}
            </div>
          </button>
        )}
      </div>
    );
  };


  // ─── Loading ─────────────────────────────────────────────
  if (count === null) {
    return (
      <TileCard ariaLabel="Course bonus loading">
        <div style={INNER} aria-busy="true">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={eyebrow}>Course &amp; Loyalty Bonus</span>
            <span style={{ fontSize: 10, color: "#8a93a4" }}>&nbsp;</span>
          </div>
          <div style={{ height: 22, marginTop: 8, background: "#F2F4F8", borderRadius: 6, width: "60%" }} />
          <div style={{ height: 10, marginTop: 8, background: "#F2F4F8", borderRadius: 4, width: "45%" }} />
        </div>
      </TileCard>
    );
  }

  const total = count * BONUS_PER_COURSE;

  // ─── Empty bonus state ───────────────────────────────────
  if (count === 0) {
    return (
      <TileCard onClick={go} ariaLabel="Course and loyalty bonus">
        <div style={INNER}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: hasIcon3D("trophy") ? 0 : 10,
                  background: hasIcon3D("trophy") ? "transparent" : "#FEF3C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {hasIcon3D("trophy") ? (
                  <Icon3D name="trophy" size={44} />
                ) : (
                  <Trophy size={18} color="#92400e" />
                )}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>
                  Course &amp; Loyalty Bonus
                </div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>
                  Earn £50 per course · plus DSM Pro Rewards points
                </div>
              </div>
            </div>
            <ChevronRight size={16} color="#9CA3AF" />
          </div>
          {renderLoyaltyStrip()}
        </div>
      </TileCard>
    );
  }

  // ─── Earned ──────────────────────────────────────────────
  return (
    <TileCard onClick={go} accentColor="green" ariaLabel={`${count} course bonuses earned, total £${total}`}>
      <div style={INNER}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...eyebrow, color: "#2d8a4e" }}>Course &amp; Loyalty Bonus</span>
          <ChevronRight size={16} color="#2d8a4e" />
        </div>
        <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#1F2937", letterSpacing: -0.3 }}>
          £{total.toLocaleString("en-GB")}
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
          {count} course{count === 1 ? "" : "s"} completed · £{BONUS_PER_COURSE} each
        </div>
        {renderLoyaltyStrip()}
      </div>
    </TileCard>
  );
}

export default CourseBonusTile;
