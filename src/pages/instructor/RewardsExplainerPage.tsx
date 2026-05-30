import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  GraduationCap,
  Car,
  ShieldCheck,
  AlertTriangle,
  Info,
  Check,
  Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import {
  POINT_RULES,
  TIER_THRESHOLDS,
  TIER_ORDER,
  tierForPoints,
  type Tier,
} from "@/constants/rewardsConfig";

const DSM_BLUE = "#1E4D9B";
const DSM_BLUE_DARK = "#0A3070";
const GOLD = "#FCD34D";
const RED = "#D12E2E";
const GREEN = "#059669";
const AMBER = "#B45309";
const DSM_RED = "#C0271F";

const HERO_GRADIENT = `linear-gradient(135deg, ${DSM_BLUE} 0%, ${DSM_BLUE_DARK} 100%)`;

interface PointsRow {
  total_points: number;
  tier: Tier;
}

type RowDef = { label: string; points: string };

const COURSE_ROWS: RowDef[] = [
  { label: "Course delivered (full attendance)", points: `+${POINT_RULES.COURSE_FULL_ATTENDANCE} pts` },
  { label: "Course delivered (partial attendance)", points: `+${POINT_RULES.COURSE_PARTIAL_ATTENDANCE} pts` },
  { label: "Course report submitted same day", points: `+${POINT_RULES.COURSE_REPORT_SAME_DAY} pts` },
  { label: "100% completion rate (month)", points: `+${POINT_RULES.COURSE_100_PERCENT_MONTH} pts` },
];

const LESSON_ROWS: RowDef[] = [
  { label: "Lesson completed with EOL", points: `+${POINT_RULES.LESSON_WITH_EOL} pts` },
  { label: "Lesson completed without EOL", points: `+${POINT_RULES.LESSON_WITHOUT_EOL} pts` },
  { label: "Pupil passes their test", points: `+${POINT_RULES.LESSON_PUPIL_PASS} pts` },
  { label: "Syllabus updated after lesson", points: `+${POINT_RULES.LESSON_SYLLABUS_UPDATED} pts` },
  { label: "Consecutive weeks with lessons", points: `+${POINT_RULES.LESSON_CONSECUTIVE_WEEK} pts/week` },
  { label: "Pupil retained 3+ months", points: `+${POINT_RULES.PUPIL_RETAINED_3_MONTHS} pts/pupil/month` },
];

const COMPLIANCE_ROWS: RowDef[] = [
  { label: "ADI badge valid", points: `+${POINT_RULES.ADI_VALID} pts/week` },
  { label: "DBS valid", points: `+${POINT_RULES.DBS_VALID} pts/week` },
  { label: "Insurance valid", points: `+${POINT_RULES.INSURANCE_VALID} pts/week` },
  { label: "Profile fully complete", points: `+${POINT_RULES.PROFILE_COMPLETE} pts (once)` },
  { label: "Referred an instructor", points: `+${POINT_RULES.REFERRAL_INSTRUCTOR} pts` },
  { label: "Referred a pupil", points: `+${POINT_RULES.REFERRAL_PUPIL} pts` },
  { label: "1 year on DSM", points: `+${POINT_RULES.LOYALTY_1_YEAR} pts (once)` },
  { label: "2 years on DSM", points: `+${POINT_RULES.LOYALTY_2_YEAR} pts (once)` },
  { label: "3+ years on DSM", points: `+${POINT_RULES.LOYALTY_3_PLUS_YEAR} pts/year` },
  { label: "CPD hour logged", points: `+${POINT_RULES.CPD_HOUR_LOGGED} pts/hour` },
];

const DEDUCTION_ROWS: RowDef[] = [
  { label: "Formal complaint received", points: `${POINT_RULES.COMPLAINT_RECEIVED} pts` },
  { label: "Complaint upheld after investigation", points: `${POINT_RULES.COMPLAINT_UPHELD} pts` },
  { label: "Chargeback raised", points: `${POINT_RULES.CHARGEBACK_RAISED} pts` },
  { label: "Negative review (1–2 stars)", points: `${POINT_RULES.REVIEW_1_2_STAR} pts` },
  { label: "Negative review (3 stars)", points: `${POINT_RULES.REVIEW_3_STAR} pts` },
  { label: "No-show", points: `${POINT_RULES.NO_SHOW} pts` },
  { label: "Late cancellation (under 24hrs)", points: `${POINT_RULES.LATE_CANCELLATION} pts` },
  { label: "Compliance document expired", points: `${POINT_RULES.DOCUMENT_EXPIRED} pts/week` },
  { label: "Two complaints in one month", points: `${POINT_RULES.TWO_COMPLAINTS_MONTH} pts` },
];

const TIER_REWARDS_COPY: Record<Exclude<Tier, "suspended">, string[]> = {
  bronze: ["Listed in DSM instructor directory", "Access to core tools"],
  silver: [
    "Priority pupil matching",
    "Featured on DSM social media quarterly",
    "Monthly earnings summary",
  ],
  gold: [
    "Free CPD course per year",
    "Tax-ready annual income report",
    "5% reduced DSM fee",
    "Priority listing in directory",
  ],
  platinum: [
    "Free profile website (yourname.dsm.co.uk)",
    "2× CPD courses paid per year",
    "Google Business Profile set up",
    "10% reduced DSM fee",
    "Featured trainer to new pupils",
  ],
  elite: [
    "Full professional website build",
    "Monthly SEO management",
    "Zero DSM platform fee for the year",
    "Local radio advertising feature",
    "Regional TV advertising (Sky AdSmart)",
    "Press release to local media",
    "VIP dedicated account manager",
    "Annual DSM awards dinner invitation",
  ],
};

const PRIZE_ROWS: { position: string; prize: string }[] = [
  { position: "🥇 1st place", prize: "£1,000 cash" },
  { position: "🥈 2nd place", prize: "£500 cash" },
  { position: "🥉 3rd place", prize: "£250 cash" },
  { position: "4th–10th place", prize: "£50 Amazon voucher" },
  { position: "Top course instructor", prize: "£500 cash" },
  { position: "Top lesson instructor", prize: "£500 cash" },
  { position: "Most improved", prize: "£250 cash" },
  { position: "Most consistent", prize: "£250 cash" },
];

const FAIRNESS_ROWS = [
  "Complaints are investigated before any points are deducted",
  "Points are never deducted below zero",
  "Tier changes are reviewed monthly — no surprise mid-month drops",
  "All leaderboard names are anonymised unless you opt in to show yours",
];

export default function RewardsExplainerPage() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;

  const [points, setPoints] = useState<PointsRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      const seasonYear = new Date().getUTCFullYear();
      const { data } = await supabase
        .from("instructor_points")
        .select("total_points, tier")
        .eq("instructor_id", instructorId)
        .eq("season_year", seasonYear)
        .maybeSingle();
      if (!cancelled) {
        setPoints((data as PointsRow | null) ?? null);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  const currentTier: Exclude<Tier, "suspended"> =
    points && points.tier !== "suspended"
      ? (points.tier as Exclude<Tier, "suspended">)
      : tierForPoints(points?.total_points ?? 0);
  const currentPoints = points?.total_points ?? 0;
  const tierDef = TIER_THRESHOLDS[currentTier];

  return (
    <div
      className="min-h-screen pb-10"
      style={{ background: "var(--color-background-secondary, #F4F7F6)" }}
    >
      {/* 1. Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 bg-white"
        style={{ padding: "14px 16px", borderBottom: `3px solid ${DSM_RED}` }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex items-center justify-center"
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
          DSM Pro Rewards
        </h1>
        <Trophy size={20} style={{ color: AMBER }} />
      </header>

      {/* 2. Hero */}
      <section
        style={{
          background: HERO_GRADIENT,
          padding: "24px 20px",
          textAlign: "center",
        }}
      >
        <Trophy size={32} style={{ color: GOLD, margin: "0 auto 10px" }} />
        <h2
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          DSM Pro Rewards
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 13,
            lineHeight: 1.6,
            maxWidth: 280,
            margin: "0 auto",
          }}
        >
          Earn points for everything you do. Unlock rewards, climb the leaderboard, and win the
          year-end £1,000 prize.
        </p>
        {loaded && (
          <div
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 20,
              padding: "6px 16px",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <span>{tierDef.emoji}</span>
            <span>
              {tierDef.label} · {currentPoints.toLocaleString("en-GB")} pts
            </span>
          </div>
        )}
      </section>

      {/* 3. How you earn points */}
      <SectionHeading>How you earn points</SectionHeading>
      <RowCard
        icon={<GraduationCap size={16} style={{ color: DSM_BLUE }} />}
        title="Course track"
        rows={COURSE_ROWS}
      />
      <RowCard
        icon={<Car size={16} style={{ color: DSM_BLUE }} />}
        title="Lesson track"
        rows={LESSON_ROWS}
      />
      <RowCard
        icon={<ShieldCheck size={16} style={{ color: DSM_BLUE }} />}
        title="Compliance & loyalty"
        rows={COMPLIANCE_ROWS}
      />

      {/* 4. Deductions */}
      <SectionHeading>Points deductions</SectionHeading>
      <RowCard
        icon={<AlertTriangle size={16} style={{ color: RED }} />}
        title="When points are deducted"
        rows={DEDUCTION_ROWS}
        pointsColor={RED}
        footer={
          <div
            style={{
              padding: "10px 14px",
              background: "var(--color-background-secondary, #F4F7F6)",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Info
              size={13}
              style={{
                color: "var(--color-text-secondary, #6B7280)",
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary, #6B7280)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Complaints are investigated before points are deducted. Points are restored if a
              complaint is dismissed.
            </p>
          </div>
        }
      />

      {/* 5. Tiers */}
      <SectionHeading>Your tiers</SectionHeading>
      {TIER_ORDER.map((t) => {
        const tier = t as Exclude<Tier, "suspended">;
        const def = TIER_THRESHOLDS[tier];
        const isActive = loaded && tier === currentTier;
        return (
          <div
            key={tier}
            style={{
              background: "#fff",
              border: isActive
                ? `2px solid ${DSM_BLUE}`
                : "0.5px solid var(--color-border-tertiary, #E5E7EB)",
              borderRadius: 12,
              overflow: "hidden",
              margin: "0 16px 8px",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>{def.emoji}</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--color-text-primary, #111827)",
                }}
              >
                {def.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--color-text-secondary, #6B7280)",
                }}
              >
                {def.min.toLocaleString("en-GB")}+ pts
              </span>
              {isActive && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#DBEAFE",
                    color: DSM_BLUE,
                    fontSize: 10,
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}
                >
                  Current
                </span>
              )}
            </div>
            <div
              style={{
                padding: "10px 14px",
                background: "var(--color-background-secondary, #F4F7F6)",
                borderTop: "0.5px solid var(--color-border-tertiary, #E5E7EB)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {TIER_REWARDS_COPY[tier].map((reward) => (
                <div
                  key={reward}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                >
                  <Check
                    size={12}
                    style={{ color: GREEN, flexShrink: 0, marginTop: 3 }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary, #6B7280)",
                      lineHeight: 1.5,
                    }}
                  >
                    {reward}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 6. Year-end prize */}
      <SectionHeading>Year-end prize</SectionHeading>
      <div
        style={{
          background: HERO_GRADIENT,
          borderRadius: 12,
          padding: "20px 16px",
          margin: "0 16px 10px",
        }}
      >
        {PRIZE_ROWS.map((row, i) => (
          <div
            key={row.position}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom:
                i === PRIZE_ROWS.length - 1
                  ? "none"
                  : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 500 }}>
              {row.position}
            </span>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
              {row.prize}
            </span>
          </div>
        ))}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
          }}
        >
          <Calendar
            size={11}
            style={{ color: "rgba(255,255,255,0.6)", flexShrink: 0, marginTop: 2 }}
          />
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Season runs 1 January – 31 December. Prizes paid via GoCardless on 1 January.
          </p>
        </div>
      </div>

      {/* 7. Fairness */}
      <SectionHeading>How it's kept fair</SectionHeading>
      <div
        style={{
          background: "#fff",
          border: "0.5px solid var(--color-border-tertiary, #E5E7EB)",
          borderRadius: 12,
          margin: "0 16px 10px",
          overflow: "hidden",
        }}
      >
        {FAIRNESS_ROWS.map((row, i) => (
          <div
            key={row}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "10px 14px",
              borderBottom:
                i === FAIRNESS_ROWS.length - 1
                  ? "none"
                  : "0.5px solid var(--color-border-tertiary, #E5E7EB)",
            }}
          >
            <Check size={14} style={{ color: GREEN, flexShrink: 0, marginTop: 2 }} />
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary, #6B7280)",
                lineHeight: 1.5,
              }}
            >
              {row}
            </span>
          </div>
        ))}
      </div>

      {/* 8. CTA */}
      <div style={{ padding: "20px 16px 40px" }}>
        <button
          onClick={() => navigate("/instructor/rewards/leaderboard")}
          style={{
            width: "100%",
            background: DSM_BLUE,
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            padding: 14,
            borderRadius: 12,
            border: "none",
          }}
        >
          View leaderboard
        </button>
        <button
          onClick={() => navigate("/instructor/help")}
          style={{
            display: "block",
            width: "100%",
            background: "transparent",
            border: "none",
            fontSize: 12,
            color: "var(--color-text-secondary, #6B7280)",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Questions? Contact DSM support
        </button>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 16,
        fontWeight: 500,
        color: "var(--color-text-primary, #111827)",
        padding: "20px 16px 10px",
        margin: 0,
      }}
    >
      {children}
    </h3>
  );
}

function RowCard({
  icon,
  title,
  rows,
  pointsColor,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  rows: RowDef[];
  pointsColor?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid var(--color-border-tertiary, #E5E7EB)",
        borderRadius: 12,
        margin: "0 16px 10px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "0.5px solid var(--color-border-tertiary, #E5E7EB)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-text-primary, #111827)",
          }}
        >
          {title}
        </span>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.label}
          style={{
            padding: "10px 14px",
            borderBottom:
              i === rows.length - 1
                ? "none"
                : "0.5px solid var(--color-border-tertiary, #E5E7EB)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
          }}
        >
          <span style={{ color: "var(--color-text-primary, #111827)", flex: 1 }}>
            {row.label}
          </span>
          <span
            style={{
              color: pointsColor ?? "var(--color-text-primary, #111827)",
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {row.points}
          </span>
        </div>
      ))}
      {footer}
    </div>
  );
}
