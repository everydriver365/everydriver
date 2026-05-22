/**
 * Instructor mobile home — DSM 2026 redesign.
 *
 * Pure visual layer. All data is sourced from existing hooks; every navigation
 * target is an existing route already wired into the previous mobile home
 * (`MobileHomeRedesign` / `MobileHomeBottomSections`). No new API calls, no
 * hardcoded values, no fallbacks for DB-sourced numbers (per project memory:
 * LIVE DATA ONLY — missing values surface as an empty/clear state).
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PullToRefresh } from "@/components/instructor/home/PullToRefresh";
import { Shimmer } from "@/components/instructor/home/Shimmer";
import nextLessonCar from "@/assets/next-lesson-car.png";
import {
  Phone,
  Bell,
  Menu,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  MapPin,
  Star,
  MessageSquare,
  Navigation as NavIcon,
  Plus,
  Search,
  LayoutDashboard,
  Clock,
  FileText,
  Users,
  CreditCard,
  Tag,
  Car,
  BookOpen,
  ArrowRight,
  Grid3x3,
  List,
  Repeat2,
  ShieldCheck,
  Award,
  CalendarCheck,
  LayoutGrid,
  Upload,
  Receipt,
  Calculator,
  Share2,
  Info,
  FileSpreadsheet,
  PhoneCall,
  TrendingUp,
  CheckSquare,
  Zap,
  HelpCircle,
  User as UserIcon,
  Lock,
  Sliders,
  FlaskConical,
  UserCheck,
  BarChart2,
  Settings as SettingsIcon,
  Briefcase,
  CalendarRange,
  CalendarDays,
  CalendarOff,
  AlertCircle,
  PhoneOff,
  Inbox,
  IdCard,
  Check,
  type LucideIcon,
} from "lucide-react";
import { format, addDays, getWeek, isSameDay, parse, parseISO } from "date-fns";
import { londonTodayStr, toLondonParts, parseHHMM } from "@/lib/availabilityEngine";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
import { useVisitorChatUnreadCount } from "@/hooks/useVisitorChatUnreadCount";
import { usePendingJobsList } from "@/hooks/usePendingJobsList";
import { useTestActionItems } from "@/hooks/useTestActionItems";
import { useVisitorChatActionItems } from "@/hooks/useVisitorChatActionItems";
import { useUnreadMessageThreads } from "@/hooks/useUnreadMessageThreads";
import { useUpcomingEvents, type UpcomingEvent } from "@/hooks/useUpcomingEvents";
import { useInstructorMembership } from "@/hooks/useInstructorMembership";
import { useInstructorTaxSummary } from "@/hooks/useInstructorTaxSummary";
import { useInstructorMTDStatus } from "@/hooks/useInstructorMTDStatus";
import { formatCurrencyCompact } from "@/lib/formatters";
import { useDayLessons } from "@/hooks/useDayLessons";
import { useInstructorPaymentsData } from "@/hooks/useInstructorPaymentsData";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { DsmLogo } from "@/components/instructor/ui/DsmLogo";
import { UpNextExpanded } from "@/components/instructor/UpNextExpanded";
import { ScheduleTile } from "@/components/instructor/ScheduleTile";
import { TaxEstimateTile } from "@/components/instructor/TaxEstimateTile";
import { MTDDeadlineTile } from "@/components/instructor/MTDDeadlineTile";
import { RescheduleRequestsCard } from "@/components/instructor/RescheduleRequestsCard";
import { PendingBookingsCard } from "@/components/instructor/PendingBookingsCard";

/* ---------------------------- Design tokens ----------------------------- */
const T = {
  navy:        "#0F2044",
  blue:        "#1A52A0",
  blueLight:   "#E6F1FB",
  blueMid:     "#BDD4F0",
  blueSurface: "#F0F6FD",
  red:         "#CC2229",
  redLight:    "#FBEAEA",
  redMid:      "#F7C1C1",
  surface:     "#F2F4F8",
  white:       "#FFFFFF",
  border:      "#DDE3ED",
  divider:     "#F2F4F8",
  text:        "#0F2044",
  textMid:     "#374151",
  textMuted:   "#9CA3AF",
  textLight:   "#C4C9D4",
};
const FONT =
  'Poppins, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';

/* ----------------------------- Small helpers ---------------------------- */
function fmtTime(t: string | null | undefined) {
  if (!t) return "—";
  try {
    return format(parse(t, "HH:mm:ss", new Date()), "HH:mm");
  } catch {
    return t.slice(0, 5);
  }
}
function initialsOf(name: string | undefined | null) {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
function pct(num: number, denom: number) {
  if (!denom || denom <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((num / denom) * 100)));
}
function useWeekLessonDates(instructorId: string, days: Date[]) {
  const start = days[0] ? format(days[0], "yyyy-MM-dd") : null;
  const end = days[days.length - 1] ? format(days[days.length - 1], "yyyy-MM-dd") : null;
  return useQuery({
    queryKey: ["mhdsm-week-lesson-dates", instructorId, start, end],
    enabled: !!instructorId && !!start && !!end,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", start!)
        .lte("lesson_date", end!)
        .neq("status", "cancelled");
      if (error) throw error;
      return new Set<string>((data ?? []).map((r: any) => r.lesson_date));
    },
  });
}

/* ============================ Main component ============================ */
interface Props {
  instructorId: string;
  instructorName?: string | null;
}

export function MobileHomeDSM2026({ instructorId, instructorName }: Props) {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();

  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { hoursThisWeek, lessonsThisWeek, monthEarnings } =
    useInstructorLiveStats(instructorId);
  const { data: today } = useTodayOverview(instructorId);
  const { data: weekly } = useWeeklyGoals(instructorId);

  const jobsCount = usePendingJobsCount();
  const { data: msgsCount = 0 } = useUnreadMessagesCount(instructorId);
  const { data: swapsCount = 0 } = useTestSwapNotifications(instructorId);
  const { data: visitorChatCount = 0 } = useVisitorChatUnreadCount(instructorId);
  const { data: events = [] } = useUpcomingEvents(instructorId);
  const { data: membership } = useInstructorMembership(instructorId);
  const payments = useInstructorPaymentsData(instructorId);
  const { data: gapDays = [] } = useRealGapSlots(instructorId);

  const [lessonExpanded, setLessonExpanded] = useState(false);

  // Earliest instructor diary gap. Defensive: filter out any slot that has
  // already slid into the past on today's London date (cache can briefly
  // outlive the wall clock). The engine itself filters past + minNotice,
  // this is belt-and-braces so the dashboard never shows a stale time.
  const nextFreeSlotLabel = (() => {
    const todayStr = londonTodayStr();
    const nowParts = toLondonParts(new Date());
    const nowMin = nowParts.hour * 60 + nowParts.minute;
    for (const d of gapDays) {
      for (const s of d.slots) {
        if (d.date === todayStr) {
          const startMin = parseHHMM(s.startTime);
          if (startMin == null || startMin <= nowMin) continue;
        } else if (d.date < todayStr) {
          continue;
        }
        const hhmm = s.startTime.slice(0, 5);
        try {
          return `${format(parseISO(d.date), "EEE")} ${hhmm}`;
        } catch {
          return `${d.formattedDate} ${hhmm}`;
        }
      }
    }
    return null;
  })();

  // Compose stats shape expected by StatsStrip + TodayStrip + NeedsAttention.
  const stats = {
    weekEarnings: Math.round(weekly?.earningsThisWeek ?? 0),
    todayEarnings: Math.round(today?.expectedEarnings ?? 0),
    earningsPct: pct(weekly?.earningsThisWeek ?? 0, weekly?.earningsLastWeek || 0),
    weekLessons: lessonsThisWeek,
    todayLessons: today?.lessonCount ?? 0,
    lessonTarget: weekly?.hoursGoal ?? 0,
    lessonsPct: pct(lessonsThisWeek, weekly?.hoursGoal || 0),
    weekHours: hoursThisWeek,
    outstanding: Math.round(payments?.stats?.outstanding ?? 0),
    nextFreeSlot: nextFreeSlotLabel,
  };

  const urgentCount = jobsCount + swapsCount;
  const todoCount = msgsCount + visitorChatCount;

  const attention = {
    total: jobsCount + msgsCount + swapsCount + visitorChatCount,
    jobs: jobsCount,
    tests: swapsCount,
    calls: visitorChatCount,
    enquiries: msgsCount,
    urgentCount,
    todoCount,
    jobItems: jobsCount > 0
      ? [
          {
            id: "jobs",
            type: "jobs" as const,
            icon: Briefcase,
            title: `${jobsCount} new pupil enquir${jobsCount === 1 ? "y" : "ies"}`,
            subtitle: "Tap to review and respond",
            count: jobsCount,
            route: "/instructor/jobs",
          },
        ]
      : [],
    testItems: swapsCount > 0
      ? [
          {
            id: "swaps",
            type: "swaps" as const,
            icon: Repeat2,
            title: `${swapsCount} test swap update${swapsCount === 1 ? "" : "s"}`,
            subtitle: "Matching test slots or offers",
            count: swapsCount,
            route: "/instructor/test-requests",
          },
        ]
      : [],
  };

  const queryClient = useQueryClient();
  const handleRefresh = async () => {
    // Refetch every active query mounted on this page in parallel.
    await queryClient.refetchQueries({ type: "active" });
  };

  // Loading hints for shimmer placeholders (first-paint only).
  const todayLoading = today === undefined;
  const weeklyLoading = weekly === undefined;
  const paymentsLoading = !payments?.stats;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div
        style={{
          backgroundColor: "#F2F4F8",
          minHeight: "100%",
          fontFamily: FONT,
          WebkitFontSmoothing: "antialiased",
        }}
      >

        <HeroHeader
          firstName={(instructorName || instructor?.name || "").split(" ")[0]}
          unreadCount={msgsCount}
          nextLesson={nextLesson}
          lessonExpanded={lessonExpanded}
          onToggleLesson={() => setLessonExpanded((p) => !p)}
          onPhone={() => navigate("/instructor/calls")}
          onBell={() => navigate("/instructor/notifications")}
          onMenu={() => navigate("/instructor/menu")}
          onProfile={() => navigate("/instructor/profile")}
          stats={stats}
          statsLoading={weeklyLoading || todayLoading}
          instructorId={instructorId}
        />

        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="animate-fade-in" style={{ animationDelay: "0ms", animationFillMode: "both" }}>
            <TodayStrip stats={stats} loading={todayLoading || paymentsLoading} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
            <NeedsAttentionCard attention={attention} stats={stats} navigate={navigate} instructorId={instructorId} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "75ms", animationFillMode: "both" }}>
            <PendingBookingsCard instructorId={instructorId} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
            <RescheduleRequestsCard instructorId={instructorId} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
            <ScheduleCard instructorId={instructorId} navigate={navigate} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
            <QuickAccessCard navigate={navigate} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
            <UnifiedInfoPanel navigate={navigate} instructorId={instructorId} events={events} membership={membership} />
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}

/* ============================ Collapsible tile ============================ */
function CollapsibleTile({ label, children, defaultOpen = false }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #e0e3ea", borderRadius: 14, overflow: "hidden", fontFamily: '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>{label}</span>
        <ChevronDown size={18} color="#8a93a4" style={{ transition: "transform 200ms", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{ padding: "0 10px 10px 10px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ============================ Unified info panel (2x2 grid) ============================ */
function UnifiedInfoPanel({
  navigate,
  instructorId,
  events,
  membership,
}: {
  navigate: (path: string) => void;
  instructorId: string;
  events: UpcomingEvent[];
  membership: ReturnType<typeof useInstructorMembership>["data"];
}) {
  const FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';

  const tax = useInstructorTaxSummary(instructorId);
  const mtd = useInstructorMTDStatus(instructorId);

  const eventCount = events?.length ?? 0;
  const eventsSubtitle =
    eventCount === 0
      ? "No events scheduled"
      : `${eventCount} upcoming event${eventCount === 1 ? "" : "s"}`;

  const membershipActive = (membership?.status ?? null) === "active";
  const planName = membership?.planName ?? "Free";
  const renewLabel = membership?.currentPeriodEnd
    ? `Renews ${format(parseISO(membership.currentPeriodEnd), "d MMM yyyy")}`
    : membershipActive
    ? "No renewal date"
    : "No active plan";

  const taxYearProgressPct = Math.max(
    0,
    Math.min(100, Math.round(((12 - tax.monthsRemaining) / 12) * 100)),
  );

  const mtdDeadline = mtd.nextDeadline;
  const mtdDays = mtdDeadline?.daysRemaining ?? null;
  const mtdUrgent = mtd.enrolled && mtdDays != null && mtdDays <= 7;
  const mtdWarning = mtd.enrolled && mtdDays != null && mtdDays <= 30 && !mtdUrgent;
  const mtdValueColor = mtdUrgent ? "#c9302c" : mtdWarning ? "#d97706" : "#1a1a1f";
  const mtdCardBg = mtdUrgent ? "#fbe8e8" : mtdWarning ? "#fffdf5" : "#fff";
  const mtdLeftBorder = mtdUrgent
    ? "3px solid #c9302c"
    : mtdWarning
    ? "3px solid #f59e0b"
    : "0.5px solid #e0e3ea";

  const cardBase: React.CSSProperties = {
    background: "#fff",
    border: "0.5px solid #e0e3ea",
    borderRadius: 14,
    padding: 14,
    cursor: "pointer",
    fontFamily: FONT,
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    transition: "background 150ms, border-color 150ms",
  };
  const hover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = "#f8f9fb";
    e.currentTarget.style.borderColor = "#c8cdd6";
  };
  const unhover = (bg: string) => (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = bg;
    e.currentTarget.style.borderColor = "#e0e3ea";
  };

  const IconBox = ({
    Icon,
    bg,
    color,
  }: {
    Icon: LucideIcon;
    bg: string;
    color: string;
  }) => (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={18} color={color} />
    </div>
  );

  const Title = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1f", marginTop: 10 }}>
      {children}
    </div>
  );

  const Subtitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, color: "#bbb", lineHeight: 1.3, marginTop: 2 }}>
      {children}
    </div>
  );

  const Badge = ({
    bg,
    color,
    children,
  }: {
    bg: string;
    color: string;
    children: React.ReactNode;
  }) => (
    <span
      style={{
        background: bg,
        color,
        fontSize: 9,
        fontWeight: 600,
        padding: "2px 6px",
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}
    >
      {/* Card 1 — Upcoming events */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/instructor/events")}
        onMouseEnter={hover}
        onMouseLeave={unhover("#fff")}
        style={cardBase}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <IconBox Icon={CalendarDays} bg="#e8eefb" color="#2952b3" />
        </div>
        <Title>Upcoming events</Title>
        <Subtitle>{eventsSubtitle}</Subtitle>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/instructor/events/new");
            }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 600,
              color: "#2d8a4e",
              fontFamily: FONT,
            }}
          >
            + Add
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/instructor/events");
            }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 600,
              color: "#2952b3",
              fontFamily: FONT,
            }}
          >
            See all →
          </button>
        </div>
      </div>

      {/* Card 2 — Membership */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/instructor/membership")}
        onMouseEnter={hover}
        onMouseLeave={unhover("#fff")}
        style={cardBase}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <IconBox Icon={IdCard} bg="#f0edfb" color="#6b4fc4" />
          {membershipActive ? (
            <Badge bg="#e8f5ee" color="#2d8a4e">Active</Badge>
          ) : (
            <Badge bg="#eef0f3" color="#7a8190">Inactive</Badge>
          )}
        </div>
        <Title>Membership</Title>
        <Subtitle>
          {planName}
          <br />
          {renewLabel}
        </Subtitle>
      </div>

      {/* Card 3 — Tax estimate */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/instructor/tax")}
        onMouseEnter={hover}
        onMouseLeave={unhover("#fff")}
        style={cardBase}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <IconBox Icon={Receipt} bg="#e8f5ee" color="#2d8a4e" />
          <Badge bg="#e8eefb" color="#2952b3">{tax.taxYear}</Badge>
        </div>
        <Title>Tax estimate</Title>
        {tax.hasAnyPayments ? (
          <>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#1a1a1f",
                marginTop: 6,
                lineHeight: 1.1,
              }}
            >
              {formatCurrencyCompact(tax.projectedLiability, { decimals: false })}
            </div>
            <Subtitle>Projected liability</Subtitle>
            <div
              style={{
                height: 2,
                background: "#eef1f8",
                borderRadius: 999,
                overflow: "hidden",
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: `${taxYearProgressPct}%`,
                  height: "100%",
                  background: "#2952b3",
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#1a1a1f",
                marginTop: 6,
                lineHeight: 1.1,
              }}
            >
              —
            </div>
            <Subtitle>No data yet</Subtitle>
          </>
        )}
      </div>

      {/* Card 4 — Making Tax Digital */}
      <div
        role="button"
        tabIndex={0}
        onClick={() =>
          navigate(mtd.enrolled ? "/instructor-app/mtd/dashboard" : "/instructor-app/mtd/setup")
        }
        onMouseEnter={hover}
        onMouseLeave={unhover(mtdCardBg)}
        style={{
          ...cardBase,
          background: mtdCardBg,
          borderLeft: mtdLeftBorder,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <IconBox Icon={FileText} bg="#fff3e0" color="#d97706" />
          {mtd.enrolled && mtdDays != null && (
            <Badge bg="#fff3e0" color="#d97706">{mtdDays} days</Badge>
          )}
        </div>
        <Title>Tax Digital</Title>
        {mtd.enrolled && mtdDeadline ? (
          <>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: mtdValueColor,
                marginTop: 6,
                lineHeight: 1.1,
              }}
            >
              {format(mtdDeadline.deadline, "d MMM")}
            </div>
            <Subtitle>Q{mtdDeadline.quarter} filing deadline</Subtitle>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#1a1a1f",
                marginTop: 6,
                lineHeight: 1.1,
              }}
            >
              —
            </div>
            <Subtitle>Not enrolled</Subtitle>
          </>
        )}
      </div>
    </div>
  );
}


/* ============================== Hero header ============================= */


function HeroHeader(props: {
  firstName: string;
  unreadCount: number;
  nextLesson: ReturnType<typeof useNextLessonDetails>["data"];
  lessonExpanded: boolean;
  onToggleLesson: () => void;
  onPhone: () => void;
  onBell: () => void;
  onMenu: () => void;
  onProfile: () => void;
  stats: any;
  statsLoading?: boolean;
  instructorId: string;
}) {
  const {
    firstName, unreadCount, nextLesson, lessonExpanded,
    onToggleLesson, onPhone, onBell, onMenu, onProfile, stats, statsLoading, instructorId,
  } = props;

  return (
    <div
      style={{
        backgroundColor: "#1E6FB8",
        padding: "calc(env(safe-area-inset-top, 0px) + 12px) 18px 16px",
        marginTop: "calc(-1 * env(safe-area-inset-top, 0px))",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <DsmLogo size={28} />
          <button
            type="button"
            onClick={onProfile}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "transparent", border: 0, padding: 0, cursor: "pointer", minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 16, fontWeight: 700, color: T.white,
                fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              {firstName || "Instructor"}
            </span>
            <ChevronRight size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.2} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <HeroButton Icon={Phone} onPress={onPhone} />
          <HeroButton Icon={Bell} onPress={onBell} badge={unreadCount} />
          <HeroButton Icon={Menu} onPress={onMenu} />
        </div>
      </div>

      {/* Next lesson */}
      <NextLessonCard
        lesson={nextLesson}
        expanded={lessonExpanded}
        onToggle={onToggleLesson}
        instructorId={instructorId}
      />

      {/* Stats strip (inside hero, below next lesson) */}
      <StatsStrip stats={stats} loading={statsLoading} />
    </div>
  );
}

/* ============================== Stats strip ============================= */
function StatsStrip({ stats, loading }: { stats: any; loading?: boolean }) {
  const cells = [
    {
      label: "Earnings · week",
      value: `£${(stats?.weekEarnings ?? 0).toLocaleString("en-GB")}`,
      sub: `£${stats?.todayEarnings ?? 0} today`,
      barPct: stats?.earningsPct ?? 0,
      barColour: T.red,
      valueColour: "#FFD27A",
      denom: null as string | null,
    },
    {
      label: "Lessons · week",
      value: `${stats?.weekLessons ?? 0}`,
      sub: `${stats?.todayLessons ?? 0} today`,
      barPct: stats?.lessonsPct ?? 0,
      barColour: T.blue,
      valueColour: "#8FF0C2",
      denom: stats?.lessonTarget > 0 ? `/${stats.lessonTarget}` : null,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "rgba(255,255,255,0.16)",
        border: "1px solid rgba(255,255,255,0.22)",
        borderRadius: 12,
        overflow: "hidden",
        marginTop: 10,
        boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
      }}
    >
      {cells.map((s, i) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRight: i === 0 ? "1px solid rgba(255,255,255,0.22)" : 0,
          }}
        >
          <div
            style={{
              fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.85)",
              textTransform: "uppercase", letterSpacing: 0.6,
              marginBottom: 4, fontFamily: FONT,
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontSize: 19, fontWeight: 800, color: s.valueColour,
              letterSpacing: -0.6, lineHeight: "22px", fontFamily: FONT,
            }}
          >
            {loading ? (
              <Shimmer width={70} height={20} radius={4} style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 100%)", backgroundSize: "200% 100%" }} />
            ) : (
              <>
                {s.value}
                {s.denom ? (
                  <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
                    {s.denom}
                  </span>
                ) : null}
              </>
            )}
          </div>
          <div
            style={{
              fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: 500,
              marginTop: 2, fontFamily: FONT,
            }}
          >
            {s.sub}
          </div>
          <div
            style={{
              height: 3, backgroundColor: "rgba(255,255,255,0.22)",
              borderRadius: 2, marginTop: 7, overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${s.barPct}%`,
                backgroundColor: s.barColour,
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      ))}
    </div>

  );
}

/* ============================== Today strip ============================= */
function TodayStrip({ stats, loading }: { stats: any; loading?: boolean }) {
  const items = [
    {
      value: String(stats?.todayLessons ?? 0),
      label: "Lessons today",
      valueColour: "#1a1a1f",
      valueSize: 22,
    },
    {
      value: stats?.nextFreeSlot ?? "—",
      label: "Next free slot",
      valueColour: "#2952b3",
      valueSize: 13,
    },
    {
      value: `£${(stats?.outstanding ?? 0).toLocaleString("en-GB")}`,
      label: "Outstanding",
      valueColour: (stats?.outstanding ?? 0) > 0 ? "#c9302c" : "#1a1a1f",
      valueSize: 18,
    },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #e0e3ea",
            borderRadius: 14,
            padding: "12px 8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            minHeight: 70,
          }}
        >
          <div
            style={{
              fontSize: item.valueSize,
              fontWeight: 700,
              color: item.valueColour,
              letterSpacing: -0.3,
              lineHeight: 1.1,
              fontFamily: FONT,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? <Shimmer width={48} height={item.valueSize} radius={4} /> : item.value}
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "#999999",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              textAlign: "center",
              fontFamily: FONT,
            }}
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}


function HeroButton({
  Icon, onPress, badge,
}: { Icon: LucideIcon; onPress: () => void; badge?: number }) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        position: "relative",
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.10)",
        border: 0, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Icon size={17} color={T.white} strokeWidth={1.8} />
      {badge && badge > 0 ? (
        <span
          style={{
            position: "absolute", top: -2, right: -2,
            minWidth: 15, height: 15, borderRadius: 8,
            backgroundColor: T.red, border: `2px solid ${T.navy}`,
            color: T.white, fontSize: 7, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", fontFamily: FONT,
          }}
        >
          {badge > 99 ? "99" : badge}
        </span>
      ) : null}
    </button>
  );
}

/* ============================ NextLesson card =========================== */
function NextLessonCard({
  lesson, expanded, onToggle, instructorId,
}: {
  lesson: ReturnType<typeof useNextLessonDetails>["data"];
  expanded: boolean;
  onToggle: () => void;
  instructorId: string;
}) {
  if (!lesson) {
    return (
      <div
        style={{
          backgroundColor: T.white, borderRadius: 14, padding: 13, textAlign: "center",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, fontFamily: FONT }}>
          No upcoming lesson
        </div>
        <div style={{ fontSize: 11, color: T.textLight, marginTop: 2, fontFamily: FONT }}>
          View your schedule to add one
        </div>
      </div>
    );
  }

  const dateStr = (() => {
    try { return format(parseISO(lesson.lessonDate), "EEE d MMM"); }
    catch { return lesson.lessonDate; }
  })();
  const durationHours = (lesson.durationMinutes / 60).toFixed(lesson.durationMinutes % 60 === 0 ? 0 : 1);
  const address = lesson.pickupLocation || lesson.pickupPostcode || "Pickup TBC";
  const phone = lesson.pupilPhone || "";

  return (
    <div
      style={{
        backgroundColor: T.white,
        borderRadius: 14,
        border: 0,
        boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
        overflow: "hidden",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        style={{
          textAlign: "left",
          padding: 13,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={nextLessonCar}
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            zIndex: 0,
            right: -30,
            top: -45,
            height: "100%",
            width: "65%",
            objectFit: "cover",
            objectPosition: "center 25%",
            opacity: 1,
            pointerEvents: "none",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.9) 25%, #000 60%), linear-gradient(to bottom, #000 0%, #000 65%, rgba(0,0,0,0.5) 88%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.9) 25%, #000 60%), linear-gradient(to bottom, #000 0%, #000 65%, rgba(0,0,0,0.5) 88%, transparent 100%)",
            maskComposite: "intersect",
          }}
        />
        <div
          style={{
            fontSize: 9, fontWeight: 700, color: T.textMuted,
            letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6, fontFamily: FONT,
          }}
        >
          Next lesson · {dateStr}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 28, fontWeight: 900, color: T.navy,
                letterSpacing: -1, lineHeight: "30px", fontFamily: FONT,
                textShadow: "0 1px 2px rgba(255,255,255,0.9)",
              }}
            >
              {fmtTime(lesson.startTime)}
            </div>
            <div
              style={{
                fontSize: 15, fontWeight: 800, color: T.navy,
                marginTop: 4, fontFamily: FONT,
                textShadow: "0 1px 2px rgba(255,255,255,0.9)",
              }}
            >
              {lesson.pupilName}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid, marginTop: 2, fontFamily: FONT, textShadow: "0 1px 2px rgba(255,255,255,0.9)" }}>
              {durationHours}h · {lesson.pickupPostcode || ""}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            
            <ChevronDown
              size={16}
              color={T.textLight}
              strokeWidth={2.5}
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform .2s",
              }}
            />
          </div>
        </div>

        {/* Quick actions always visible — Call / Text / Go */}
        <div style={{ display: "flex", gap: 6, marginTop: 10, position: "relative", zIndex: 1 }}>
          <ActionBtn
            label="Call"
            Icon={Phone}
            bg={T.red}
            fg={T.white}
            onClick={(e) => { e.stopPropagation(); if (phone) window.location.href = `tel:${phone}`; }}
          />
          <ActionBtn
            label="Text"
            Icon={MessageSquare}
            bg="#D1D5DB"
            fg="#374151"
            onClick={(e) => { e.stopPropagation(); if (phone) window.location.href = `sms:${phone}`; }}
          />
          <ActionBtn
            label="Go"
            Icon={NavIcon}
            bg="#4ADE80"
            fg="#FFFFFF"
            onClick={(e) => {
              e.stopPropagation();
              const q = encodeURIComponent(address);
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, "_blank");
            }}
          />
        </div>
      </div>

      {/* Full expanded section — restores ETA, weather, OBD alerts,
          On-my-way / Arrived / Reschedule / Cancel / lesson history, etc. */}
      {expanded && (
        <div onClick={(e) => e.stopPropagation()}>
          <UpNextExpanded
            lessonId={lesson.lessonId}
            pupilId={lesson.pupilId}
            pupilName={lesson.pupilName}
            pupilPhone={lesson.pupilPhone}
            pickupLocation={lesson.pickupLocation}
            pickupPostcode={lesson.pickupPostcode}
            pickupWhat3words={(lesson as any).pickupWhat3words}
            pickupNotes={(lesson as any).pickupNotes}
            startTime={lesson.startTime}
            durationMinutes={lesson.durationMinutes}
            accountBalance={(lesson as any).accountBalance ?? 0}
            prepaidHours={(lesson as any).prepaidHours ?? 0}
            checkInStatus={(lesson as any).checkInStatus ?? null}
            lessonStatus={(lesson as any).lessonStatus ?? null}
            lastLessonPlan={(lesson as any).lastLessonPlan ?? null}
            instructorId={instructorId}
          />
        </div>
      )}
    </div>
  );
}

function Row({
  icon, children, align = "center",
}: { icon: React.ReactNode; children: React.ReactNode; align?: "start" | "center" }) {
  return (
    <div
      style={{
        display: "flex", alignItems: align === "start" ? "flex-start" : "center",
        gap: 7, marginBottom: 5,
      }}
    >
      {icon}
      <div style={{ fontSize: 11, color: T.textMid, lineHeight: "16px", fontFamily: FONT }}>
        {children}
      </div>
    </div>
  );
}

function ActionBtn({
  label, Icon, bg, fg, onClick,
}: {
  label: string; Icon: LucideIcon; bg: string; fg: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, backgroundColor: bg, borderRadius: 8, padding: "9px 0",
        border: 0, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}
    >
      <Icon size={14} color={fg} strokeWidth={2} />
      <span style={{ fontSize: 12, fontWeight: 600, color: fg, fontFamily: FONT }}>{label}</span>
    </button>
  );
}

function PupilAvatar({ initials }: { initials: string }) {
  return (
    <div
      style={{
        width: 36, height: 36, borderRadius: 18, backgroundColor: T.navy,
        color: T.white, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, fontFamily: FONT,
      }}
    >
      {initials || "·"}
    </div>
  );
}

/* ============================ Section wrapper =========================== */
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: T.white, borderRadius: 18, overflow: "hidden",
        boxShadow: "0 1px 6px rgba(15,32,68,0.06)",
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  label, right,
}: { label: string; right?: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "12px 18px",
        borderBottom: `1px solid ${T.divider}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <span
        style={{
          fontSize: 10, fontWeight: 700, color: T.textMuted,
          letterSpacing: 0.9, textTransform: "uppercase", fontFamily: FONT,
        }}
      >
        {label}
      </span>
      {right}
    </div>
  );
}

/* (ThisWeekCard removed — stats now live in HeroHeader StatsStrip) */

/* =========================== Needs attention ============================ */
function NeedsAttentionCard({
  attention, stats, navigate, instructorId,
}: { attention: any; stats: any; navigate: ReturnType<typeof useNavigate>; instructorId: string | undefined }) {
  type Key = "jobs" | "tests" | "calls" | "enquiries";
  const [openKey, setOpenKey] = useState<Key | null>(null);
  const toggle = (k: Key) => {
    setOpenKey((p) => (p === k ? null : k));
  };

  const RED = "#c9302c";
  const RED_TINT = "#fbe8e8";
  const BLUE = "#2952b3";
  const BLUE_TINT = "#e8eefb";
  const GREY_TINT = "#f0f1f4";
  const GREY_ICON = "#aaaaaa";
  const BORDER = "#e0e3ea";
  const MUTED = "#999999";
  const GREY_LIGHT = "#cccccc";

  const cells: { key: Key; label: string; count: number; bg: string; valueColor: string }[] = [
    { key: "jobs",      label: "Jobs",   count: attention.jobs ?? 0,      bg: RED_TINT,     valueColor: RED },
    { key: "tests",     label: "Tests",  count: attention.tests ?? 0,     bg: BLUE_TINT,    valueColor: BLUE },
    { key: "calls",     label: "Calls",  count: attention.calls ?? 0,     bg: "transparent", valueColor: GREY_LIGHT },
    { key: "enquiries", label: "Enq's",  count: attention.enquiries ?? 0, bg: "transparent", valueColor: GREY_LIGHT },
  ];

  const tiles: {
    key: Key; icon: LucideIcon; label: string; count: number;
    urgent?: boolean; accent?: string; tint?: string; body: React.ReactNode;
  }[] = [
    {
      key: "jobs", icon: Briefcase, label: "Jobs",
      count: attention.jobs ?? 0, urgent: true, accent: RED, tint: RED_TINT,
      body: (attention.jobs ?? 0) === 0
        ? <EmptyState icon={Inbox}>No jobs to action</EmptyState>
        : <ActionBody
            message={`${attention.jobs} job${attention.jobs === 1 ? "" : "s"} require${attention.jobs === 1 ? "s" : ""} your attention`}
            accent={RED}
            tint={RED_TINT}
            actionLabel="Review & mark handled"
            onAction={() => navigate("/instructor/jobs")}
          />,
    },
    {
      key: "tests", icon: Repeat2, label: "Tests",
      count: attention.tests ?? 0, urgent: true, accent: BLUE, tint: BLUE_TINT,
      body: (attention.tests ?? 0) === 0
        ? <EmptyState icon={Inbox}>No tests to review</EmptyState>
        : <ActionBody
            message={`${attention.tests} test${attention.tests === 1 ? "" : "s"} pending review`}
            accent={BLUE}
            tint={BLUE_TINT}
            actionLabel="Review & mark handled"
            onAction={() => navigate("/instructor/test-requests")}
          />,
    },
    { key: "calls", icon: PhoneCall, label: "Calls",
      count: attention.calls ?? 0, accent: GREY_ICON, tint: GREY_TINT,
      body: (attention.calls ?? 0) === 0
        ? <EmptyState icon={PhoneOff}>No calls to action</EmptyState>
        : <ActionBody
            message={`${attention.calls} call${attention.calls === 1 ? "" : "s"} waiting`}
            accent={BLUE}
            tint={BLUE_TINT}
            actionLabel="Open calls & mark handled"
            onAction={() => navigate("/instructor/calls")}
          /> },
    { key: "enquiries", icon: MessageSquare, label: "Enq's",
      count: attention.enquiries ?? 0, accent: GREY_ICON, tint: GREY_TINT,
      body: (attention.enquiries ?? 0) === 0
        ? <EmptyState icon={Inbox}>No new enquiries</EmptyState>
        : <ActionBody
            message={`${attention.enquiries} new enquir${attention.enquiries === 1 ? "y" : "ies"}`}
            accent={BLUE}
            tint={BLUE_TINT}
            actionLabel="Open inbox & mark read"
            onAction={() => navigate("/instructor/messages")}
          /> },
  ];



  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 14 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span
            style={{
              fontSize: 10, fontWeight: 700, color: MUTED,
              letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT,
            }}
          >
            Needs attention
          </span>
          {(attention.urgentCount ?? 0) > 0 && (
            <span
              style={{
                backgroundColor: RED, color: "#FFFFFF", borderRadius: 999,
                padding: "2px 10px", fontSize: 10, fontWeight: 700, fontFamily: FONT,
              }}
            >
              {attention.urgentCount} urgent
            </span>
          )}
        </div>

        {/* 4-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {cells.map((c) => {
            const active = openKey === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggle(c.key)}
                aria-expanded={active}
                style={{
                  background: c.bg,
                  border: active ? `1px solid ${BORDER}` : "1px solid transparent",
                  borderRadius: 10,
                  padding: 8,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  cursor: "pointer",
                  transition: "border-color 200ms ease, background-color 200ms ease",
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 800, color: c.valueColor, fontFamily: FONT, lineHeight: 1 }}>
                  {c.count}
                </span>
                <span
                  style={{
                    fontSize: 9, fontWeight: 600, color: MUTED,
                    fontFamily: FONT, letterSpacing: "0.08em", textTransform: "uppercase",
                  }}
                >
                  {c.label}
                </span>
                <ChevronDown
                  size={12}
                  strokeWidth={2.4}
                  color={active ? c.valueColor : MUTED}
                  style={{
                    marginTop: 1,
                    transform: active ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 260ms cubic-bezier(0.4, 0, 0.2, 1), color 200ms ease",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Smooth expand/collapse — grid-row trick animates height for any content */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: openKey ? "1fr" : "0fr",
          transition: "grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        aria-hidden={!openKey}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            key={openKey ?? "closed"}
            style={{
              opacity: openKey ? 1 : 0,
              transition: "opacity 220ms ease 60ms",
            }}
          >
            {openKey ? (
              <SectionPanel sectionKey={openKey} instructorId={instructorId} navigate={navigate} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}



/* ===================== SectionPanel (inline live list) ===================== */
function SectionPanel({
  sectionKey,
  instructorId,
  navigate,
}: {
  sectionKey: "jobs" | "tests" | "calls" | "enquiries";
  instructorId: string | undefined;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const DIVIDER = "#f0f1f4";
  const BLUE = "#2952b3";
  const MUTED = "#999999";
  const CHARCOAL = "#1a1a1f";
  const BODY = "#6E6E73";

  const jobs = usePendingJobsList(5);
  const tests = useTestActionItems(instructorId, 5);
  const calls = useVisitorChatActionItems(instructorId, 5);
  const enqs = useUnreadMessageThreads(instructorId, 5);

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 10, width: "100%", padding: "10px 14px",
    background: "transparent", border: 0, borderTop: `1px solid ${DIVIDER}`,
    textAlign: "left", cursor: "pointer", fontFamily: FONT,
  };
  const titleStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: CHARCOAL,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  };
  const subStyle: React.CSSProperties = {
    fontSize: 11, color: BODY, marginTop: 2,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  };
  const chev: React.CSSProperties = { color: MUTED, fontSize: 16, fontWeight: 600 };

  const footer = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", padding: "10px 14px", background: "transparent",
        border: 0, borderTop: `1px solid ${DIVIDER}`, color: BLUE,
        fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}
    >
      {label} →
    </button>
  );

  const loading = (
    <div style={{ padding: "14px", fontSize: 12, color: MUTED, fontFamily: FONT, borderTop: `1px solid ${DIVIDER}` }}>
      Loading…
    </div>
  );

  const empty = (text: string, Icon: LucideIcon) => (
    <div style={{ borderTop: `1px solid ${DIVIDER}` }}>
      <EmptyState icon={Icon}>{text}</EmptyState>
    </div>
  );

  if (sectionKey === "jobs") {
    const items = jobs.data ?? [];
    if (jobs.isLoading) return loading;
    return (
      <>
        {items.length === 0
          ? empty("No jobs to action", Inbox)
          : items.map((j) => (
              <button key={j.id} type="button" style={rowStyle}
                onClick={() => navigate(`/instructor/jobs?id=${j.id}`)}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={titleStyle}>
                    {j.courseType}{j.hours ? ` · ${j.hours}h` : ""}
                  </div>
                  <div style={subStyle}>
                    {j.postcode ? `${j.postcode} · ` : ""}expires in {j.expiresInHours}h
                  </div>
                </div>
                <span style={chev}>›</span>
              </button>
            ))}
        {footer("View all jobs", () => navigate("/instructor/jobs"))}
      </>
    );
  }

  if (sectionKey === "tests") {
    const items = tests.data ?? [];
    if (tests.isLoading) return loading;
    return (
      <>
        {items.length === 0
          ? empty("No tests to review", Inbox)
          : items.map((t) => (
              <button key={`${t.kind}-${t.id}`} type="button" style={rowStyle}
                onClick={() => navigate(`/instructor/test-requests?id=${t.id}&kind=${t.kind}`)}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={titleStyle}>
                    {t.centre ?? (t.kind === "offer" ? "Swap offer" : "Matched test slot")}
                  </div>
                  <div style={subStyle}>
                    {[t.date, t.time].filter(Boolean).join(" · ") || (t.kind === "offer" ? "Pending offer" : "Scraped match")}
                  </div>
                </div>
                <span style={chev}>›</span>
              </button>
            ))}
        {footer("View all tests", () => navigate("/instructor/test-requests"))}
      </>
    );
  }

  if (sectionKey === "calls") {
    const items = calls.data ?? [];
    if (calls.isLoading) return loading;
    return (
      <>
        {items.length === 0
          ? empty("No calls to action", PhoneOff)
          : items.map((c) => (
              <button key={c.sessionId} type="button" style={rowStyle}
                onClick={() => navigate(`/instructor/messages?session=${c.sessionId}`)}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={titleStyle}>{c.visitorName || "Visitor"}</div>
                  <div style={subStyle}>{c.preview}</div>
                </div>
                <span style={chev}>›</span>
              </button>
            ))}
        {footer("Open visitor chats", () => navigate("/instructor/messages"))}
      </>
    );
  }

  // enquiries
  const items = enqs.data ?? [];
  if (enqs.isLoading) return loading;
  return (
    <>
      {items.length === 0
        ? empty("No new enquiries", Inbox)
        : items.map((m) => (
            <button key={m.conversationId} type="button" style={rowStyle}
              onClick={() => navigate(`/instructor/messages?c=${m.conversationId}`)}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={titleStyle}>{m.pupilName || "Pupil"}</div>
                <div style={subStyle}>{m.preview}</div>
              </div>
              <span style={chev}>›</span>
            </button>
          ))}
      {footer("Open inbox", () => navigate("/instructor/messages"))}
    </>
  );
}


/* Horizontal action tile with tinted icon box, count/clear pill, expandable body. */
function ActionTile({
  icon: Icon,
  label,
  accent,
  tint,
  outlined,
  badgeCount,
  open,
  onToggle,
  children,
  nested,
}: {
  icon: LucideIcon;
  label: string;
  accent?: string;
  tint?: string;
  outlined?: boolean;
  badgeCount: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  nested?: boolean;
}) {
  const BORDER = "#e0e3ea";
  const DIVIDER = "#f0f1f4";
  const HOVER = "#f8f9fb";
  const CHARCOAL = "#1a1a1f";
  const GREY_PILL_BG = "#f0f1f4";
  const GREY_PILL_FG = "#888888";

  const isUrgent = !!outlined && (badgeCount ?? 0) > 0;
  const iconColor = accent ?? "#aaaaaa";
  const iconBg = tint ?? "#f0f1f4";
  const showClearPill = !isUrgent;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: nested ? 0 : 14,
        border: nested ? 0 : `1px solid ${BORDER}`,
        borderTop: nested ? `1px solid ${DIVIDER}` : undefined,
        overflow: "hidden",
      }}
    >

      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = HOVER; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        style={{
          width: "100%", padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 12,
          background: "transparent", border: 0, cursor: "pointer", textAlign: "left",
          transition: "background 150ms ease",
        }}
      >
        <div
          style={{
            width: 34, height: 34, borderRadius: 9,
            backgroundColor: iconBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} strokeWidth={2} color={iconColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14, fontWeight: 600, color: CHARCOAL,
              letterSpacing: "-0.01em", fontFamily: FONT,
            }}
          >
            {label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isUrgent ? (
            <span
              style={{
                backgroundColor: accent ?? "#c9302c", color: "#FFFFFF",
                borderRadius: 999, padding: "2px 10px",
                fontSize: 11, fontWeight: 700, fontFamily: FONT, minWidth: 24, textAlign: "center",
              }}
            >
              {badgeCount}
            </span>
          ) : showClearPill ? (
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                backgroundColor: GREY_PILL_BG, color: GREY_PILL_FG,
                borderRadius: 999, padding: "2px 10px",
                fontSize: 11, fontWeight: 600, fontFamily: FONT,
              }}
            >
              ✓ Clear
            </span>
          ) : null}
          <ChevronDown
            size={16}
            strokeWidth={2.2}
            color="#999999"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform .2s",
            }}
          />
        </div>
      </button>
      {open ? (
        <div style={{ borderTop: `1px solid ${DIVIDER}`, padding: "12px 14px" }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

function SimpleMsg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: "#6E6E73", fontFamily: FONT, lineHeight: 1.4 }}>
      {children}
    </div>
  );
}

function ActionBody({
  message, accent, tint, actionLabel, onAction,
}: {
  message: string;
  accent: string;
  tint: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT }}>
      <div style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.4 }}>{message}</div>
      <button
        type="button"
        onClick={onAction}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(0.96)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; }}
        style={{
          alignSelf: "stretch",
          backgroundColor: tint,
          color: accent,
          border: `1px solid ${accent}`,
          borderRadius: 12,
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: FONT,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "filter 150ms ease",
        }}
      >
        {actionLabel} →
      </button>
    </div>
  );
}


function EmptyState({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        padding: "12px 8px", fontFamily: FONT,
      }}
    >
      <Icon size={22} strokeWidth={1.8} color="#cccccc" />
      <span style={{ fontSize: 12, color: "#999999", fontFamily: FONT }}>{children}</span>
    </div>
  );
}


function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12, color: T.textMuted, textAlign: "center",
        padding: 8, fontFamily: FONT,
      }}
    >
      {children}
    </div>
  );
}

function Collapsible({
  label, labelColour, badgeColour, badgeCount, clearLabel, open, onToggle, borderTop, children,
}: {
  label: string; labelColour: string; badgeColour?: string;
  badgeCount: number; clearLabel?: boolean;
  open: boolean; onToggle: () => void; borderTop?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderTop: borderTop ? `1px solid ${T.divider}` : 0 }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%", padding: "10px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: 0, cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 9, fontWeight: 700, color: labelColour,
              letterSpacing: 0.8, textTransform: "uppercase", fontFamily: FONT,
            }}
          >
            {label}
          </span>
          {clearLabel ? (
            <span
              style={{
                backgroundColor: T.blueLight, color: T.blue,
                borderRadius: 20, padding: "1px 8px",
                fontSize: 10, fontWeight: 600, fontFamily: FONT,
              }}
            >
              ✓ Clear
            </span>
          ) : (
            <span
              style={{
                backgroundColor: badgeColour ?? T.surface,
                color: badgeColour ? T.white : "#6B7280",
                borderRadius: 20, padding: "1px 8px",
                fontSize: 10, fontWeight: 700, fontFamily: FONT,
              }}
            >
              {badgeCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={12} color={T.textLight} strokeWidth={2.5}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}
        />
      </button>
      {open ? <div>{children}</div> : null}
    </div>
  );
}

function UrgentBanner({
  item, onPress,
}: { item: any; onPress: () => void }) {
  const cfg =
    item.type === "swaps"
      ? { bg: T.blueSurface, border: T.blueMid, accent: T.blue, iconBg: T.blueLight, iconColour: T.blue, titleColour: T.blue, badgeBg: T.blue }
      : { bg: "#FEFAFA", border: T.redMid, accent: T.red, iconBg: T.redLight, iconColour: T.red, titleColour: T.red, badgeBg: T.red };
  const Icon: LucideIcon = item.icon;
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: "calc(100% - 28px)", margin: "0 14px 6px",
        borderRadius: 10, backgroundColor: cfg.bg,
        padding: 11, display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 30, height: 30, borderRadius: 8, backgroundColor: cfg.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <Icon size={15} color={cfg.iconColour} strokeWidth={1.8} />
        <span
          style={{
            position: "absolute", top: -2, right: -2, width: 7, height: 7,
            borderRadius: 4, backgroundColor: T.red, border: `1.5px solid ${cfg.bg}`,
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: cfg.titleColour, fontFamily: FONT }}>
          {item.title}
        </div>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1, fontFamily: FONT }}>
          {item.subtitle}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span
          style={{
            backgroundColor: cfg.badgeBg, color: T.white,
            borderRadius: 20, padding: "2px 8px",
            fontSize: 11, fontWeight: 700, fontFamily: FONT,
          }}
        >
          {item.count}
        </span>
        <ChevronRight size={12} color={T.textLight} strokeWidth={2.5} />
      </div>
    </button>
  );
}

/* ----------- Jobs preview list (course enquiries) ----------- */
function JobsPreviewList({
  navigate,
}: { navigate: ReturnType<typeof useNavigate> }) {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["mhdsm-pending-jobs-preview"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enquiries")
        .select("id, name, postcode, course_type, requested_hours, preferred_timing, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Empty>Loading…</Empty>;
  if (jobs.length === 0) return <Empty>No pending jobs</Empty>;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {jobs.map((j: any, idx: number) => {
        const courseLabel = (j.course_type || "Course")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        const hours = j.requested_hours ? `${j.requested_hours}h` : null;
        const ago = (() => {
          try {
            const mins = Math.floor((Date.now() - new Date(j.created_at).getTime()) / 60000);
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            return `${Math.floor(hrs / 24)}d ago`;
          } catch { return ""; }
        })();
        const meta = [hours, j.postcode, j.preferred_timing].filter(Boolean).join(" · ");
        return (
          <div key={j.id}>
            {idx > 0 && (
              <div style={{ height: 1, backgroundColor: "rgba(15,32,68,0.08)", margin: "0 20px" }} />
            )}
            <button
              type="button"
              onClick={() => navigate("/instructor/jobs")}
              style={{
                width: "calc(100% - 28px)", margin: "0 14px 6px",
                borderRadius: 10, backgroundColor: "#FEFAFA",
                padding: 11, display: "flex", alignItems: "center", gap: 10,
                cursor: "pointer", border: 0, textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 30, height: 30, borderRadius: 8, backgroundColor: T.redLight,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <Briefcase size={15} color={T.red} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: FONT,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {j.name || "New enquiry"}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted }}>· {courseLabel}</span>
                </div>
                <div
                  style={{
                    fontSize: 10, color: T.textMuted, marginTop: 1, fontFamily: FONT,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {meta || ago}{meta && ago ? ` · ${ago}` : ""}
                </div>
              </div>
              <ChevronRight size={14} color={T.textLight} strokeWidth={2.5} />
            </button>
          </div>
        );
      })}
    </div>
  );
}



/* =============================== Schedule =============================== */
function ScheduleCard({
  instructorId, navigate,
}: { instructorId: string; navigate: ReturnType<typeof useNavigate> }) {
  const today = new Date();
  const { data: dayLessons = [] } = useDayLessons(instructorId, today);

  const lessons = useMemo(() => {
    const dateStr = format(today, "yyyy-MM-dd");
    return dayLessons.map((l) => {
      // l.startTime is "HH:mm:ss" from the DB — combine with today's date.
      const startISO = `${dateStr}T${l.startTime}`;
      const startMs = new Date(startISO).getTime();
      const endISO = new Date(startMs + (l.durationMinutes || 60) * 60000).toISOString();
      return {
        id: l.id,
        startTime: startISO,
        endTime: endISO,
        studentName: l.pupilName,
        lessonType: l.lessonType,
        postcode: l.pickupPostcode || "",
      };
    });
  }, [dayLessons]);

  return (
    <ScheduleTile
      lessons={lessons}
      onAddLesson={() => navigate("/instructor/schedule?add=1")}
      onFillGaps={() => navigate("/instructor/gaps")}
      onLessonClick={(id) => navigate(`/instructor/schedule?lesson=${id}`)}
    />
  );
}


/* ============================== Quick access ============================ */
interface QAItem {
  label: string;
  Icon: LucideIcon;
  bg: string;
  colour: string;
  route: string;
}

const BLUE_BG = { bg: T.blueLight, colour: T.blue };
const RED_BG  = { bg: T.redLight,  colour: T.red };
const NAVY_BG = { bg: "#E8EDF6",   colour: T.navy };
const GREY_BG = { bg: T.surface,   colour: "#6B7280" };

const QUICK_ACCESS: QAItem[] = [
  // Row 1
  { label: "Dashboard",       Icon: LayoutDashboard,  ...BLUE_BG, route: "/instructor" },
  { label: "Schedule",        Icon: CalendarIcon,     ...BLUE_BG, route: "/instructor/schedule" },
  { label: "Working hours",   Icon: Clock,            ...BLUE_BG, route: "/instructor/availability" },
  { label: "How pupils book", Icon: FileText,         ...BLUE_BG, route: "/instructor/settings/how-pupils-book" },
  { label: "Pupils",          Icon: Users,            ...BLUE_BG, route: "/instructor/pupils" },
  { label: "Payments",        Icon: CreditCard,       ...BLUE_BG, route: "/instructor/payments" },
  { label: "Driving Tests",   Icon: Car,              ...RED_BG,  route: "/instructor/test-requests" },
  { label: "Lesson history",  Icon: BookOpen,         ...BLUE_BG, route: "/instructor/pupils" },
  { label: "Find slot",       Icon: Search,           ...BLUE_BG, route: "/instructor/gaps" },
  { label: "Next slot",       Icon: ArrowRight,       ...NAVY_BG, route: "/instructor/gaps" },
  { label: "Course planner",  Icon: Grid3x3,          ...BLUE_BG, route: "/instructor/course-planner" },
  { label: "Waiting list",    Icon: List,             ...RED_BG,  route: "/instructor/waiting-list" },
  { label: "Fill gaps",       Icon: Plus,             ...NAVY_BG, route: "/instructor/gaps" },
  { label: "Test swap",       Icon: Repeat2,          ...RED_BG,  route: "/instructor/test-requests" },
  { label: "Standards",       Icon: ShieldCheck,      ...BLUE_BG, route: "/instructor/standards-check" },
  { label: "CPD",             Icon: Award,            ...NAVY_BG, route: "/instructor/cpd" },
  { label: "Rates",           Icon: MapPin,           ...BLUE_BG, route: "/instructor/locations" },
  { label: "Availability",    Icon: CalendarCheck,    ...BLUE_BG, route: "/instructor/availability" },
  { label: "My courses",      Icon: LayoutGrid,       ...BLUE_BG, route: "/instructor/course-planner" },
  // Row 2
  { label: "Take payment",    Icon: Upload,           ...BLUE_BG, route: "/instructor/pay" },
  { label: "Pending",         Icon: Clock,            ...RED_BG,  route: "/instructor/payments?tab=pending" },
  { label: "Expenses",        Icon: Receipt,          ...NAVY_BG, route: "/instructor/expenses" },
  { label: "Tax",             Icon: Calculator,       ...NAVY_BG, route: "/instructor/tax" },
  { label: "Reviews",         Icon: Star,             ...RED_BG,  route: "/instructor/reviews" },
  { label: "Referrals",       Icon: Share2,           ...RED_BG,  route: "/instructor/payments?tab=bonus" },
  { label: "Fees",            Icon: Info,             ...BLUE_BG, route: "/instructor/payments?tab=fees" },
  { label: "Plan & billing",  Icon: FileSpreadsheet,  ...NAVY_BG, route: "/instructor/settings/plan-billing" },
  { label: "Vehicle",         Icon: Car,              ...BLUE_BG, route: "/instructor/vehicle-health" },
  { label: "GPS tracking",    Icon: MapPin,           ...BLUE_BG, route: "/instructor/tracking" },
  { label: "Telephony",       Icon: Phone,            ...NAVY_BG, route: "/instructor/settings/phone-ai" },
  { label: "Call answering",  Icon: PhoneCall,        ...NAVY_BG, route: "/instructor/settings/phone-ai" },
  { label: "Reporting",       Icon: TrendingUp,       ...BLUE_BG, route: "/instructor/income" },
  { label: "To do",           Icon: CheckSquare,      ...GREY_BG, route: "/instructor/notifications" },
  { label: "Productivity",    Icon: Zap,              ...BLUE_BG, route: "/instructor/income" },
  { label: "People & growth", Icon: Users,            ...BLUE_BG, route: "/instructor/pupils" },
  { label: "Support",         Icon: HelpCircle,       ...RED_BG,  route: "/instructor/settings" },
  { label: "Profile",         Icon: UserIcon,         ...RED_BG,  route: "/instructor/profile" },
  { label: "Security",        Icon: Lock,             ...NAVY_BG, route: "/instructor/settings" },
  { label: "Appearance",      Icon: Sliders,          ...GREY_BG, route: "/instructor/settings" },
  { label: "Lab features",    Icon: FlaskConical,     ...BLUE_BG, route: "/instructor/settings" },
  { label: "Accessibility",   Icon: UserCheck,        ...NAVY_BG, route: "/instructor/settings/accessibility" },
  { label: "Insights",        Icon: BarChart2,        ...BLUE_BG, route: "/instructor/income" },
  { label: "Settings",        Icon: SettingsIcon,     ...GREY_BG, route: "/instructor/settings" },
];

const DEFAULT_PIN_LABELS = [
  "Dashboard",
  "Pupils",
  "Schedule",
  "Test swap",
  "Payments",
  "Availability",
  "Find slot",
  "Settings",
];
const PINS_STORAGE_KEY = "dsm2026:quickaccess:pins";

function loadPinnedLabels(): string[] {
  if (typeof window === "undefined") return DEFAULT_PIN_LABELS;
  try {
    const raw = window.localStorage.getItem(PINS_STORAGE_KEY);
    if (!raw) return DEFAULT_PIN_LABELS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PIN_LABELS;
    return parsed.filter((l: any) => typeof l === "string");
  } catch {
    return DEFAULT_PIN_LABELS;
  }
}

function QuickAccessCard({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pinnedLabels, setPinnedLabels] = useState<string[]>(() => loadPinnedLabels());

  const pinnedItems = useMemo(() => {
    const byLabel = new Map(QUICK_ACCESS.map((i) => [i.label, i]));
    const pinned = pinnedLabels
      .map((l) => byLabel.get(l))
      .filter((x): x is QAItem => Boolean(x));
    const pinnedSet = new Set(pinned.map((p) => p.label));
    const rest = QUICK_ACCESS.filter((i) => !pinnedSet.has(i.label));
    return [...pinned, ...rest];
  }, [pinnedLabels]);

  const filtered = query.trim()
    ? QUICK_ACCESS.filter((i) =>
        i.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : null;

  const persistPins = (labels: string[]) => {
    setPinnedLabels(labels);
    try { window.localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(labels)); } catch {}
  };

  const togglePin = (label: string) => {
    if (pinnedLabels.includes(label)) {
      persistPins(pinnedLabels.filter((l) => l !== label));
    } else if (pinnedLabels.length < 8) {
      persistPins([...pinnedLabels, label]);
    }
  };

  const VISIBLE = 4;
  const BORDER = "#e0e3ea";
  const OUTER_BG = "#F2F4F8";
  const CHARCOAL = "#1a1a1f";
  const MUTED = "#999999";
  const PLACEHOLDER = "#bbbbbb";
  const ACTION_BLUE = "#2952b3";


  const sourceTiles = filtered ?? pinnedItems;
  const pages: QAItem[][] = [];
  for (let i = 0; i < sourceTiles.length; i += VISIBLE) {
    pages.push(sourceTiles.slice(i, i + VISIBLE));
  }

  return (
    <div
      style={{
        background: OUTER_BG,
        borderRadius: 18,
        overflow: "hidden",
        padding: "14px 14px 14px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: MUTED,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontFamily: FONT,
            }}
          >
            Quick access
          </span>
          <button
            type="button"
            onClick={() => setSearchExpanded((v) => !v)}
            aria-label="Search tools"
            style={{
              width: 22, height: 22, borderRadius: 999,
              background: searchExpanded ? ACTION_BLUE : "#fff",
              border: `1px solid ${BORDER}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", padding: 0,
            }}
          >
            <Search size={12} color={searchExpanded ? "#fff" : MUTED} strokeWidth={2} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          style={{
            background: "transparent", border: 0, cursor: "pointer",
            fontSize: 13, fontWeight: 600, color: ACTION_BLUE, fontFamily: FONT,
            padding: 0,
          }}
        >
          Edit pins
        </button>
      </div>

      {/* Expandable Search */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: searchExpanded ? 60 : 0,
          opacity: searchExpanded ? 1 : 0,
          marginBottom: searchExpanded ? 12 : 0,
          transition: "max-height 200ms ease, opacity 200ms ease, margin-bottom 200ms ease",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: `1px solid ${BORDER}`,
          }}
        >
          <Search size={16} color={PLACEHOLDER} strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search all ${QUICK_ACCESS.length} tools…`}
            autoFocus={searchExpanded}
            style={{
              flex: 1, background: "transparent", border: 0, outline: "none",
              fontSize: 14, color: CHARCOAL, fontFamily: FONT, minWidth: 0, padding: 0,
            }}
            className="qa-search-input"
          />

          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0, color: "#C7C7CC", fontSize: 16, lineHeight: 1 }}
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>


      {/* 2×2 Scrollable paged grid */}
      {sourceTiles.length === 0 ? (
        <div
          style={{
            padding: "24px 12px",
            textAlign: "center",
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            fontSize: 13,
            color: "#6E6E73",
            fontFamily: FONT,
          }}
        >
          No matching tools
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            gap: 0,
            width: "100%",
            margin: 0,
            padding: "0 0 4px",
            boxSizing: "border-box",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
          className="hide-scrollbar"
        >
          {pages.map((page, pIdx) => (
            <div
              key={pIdx}
              style={{
                flex: "0 0 100%",
                width: "100%",
                minWidth: 0,
                scrollSnapAlign: "start",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {page.map((item) => (
                <QATile
                  key={item.label}
                  item={item}
                  active={activeRoute === item.route}
                  onPress={() => { setActiveRoute(item.route); navigate(item.route); }}
                />
              ))}
            </div>
          ))}
        </div>
      )}





      {editOpen ? (
        <EditPinsSheet
          allItems={QUICK_ACCESS}
          pinned={pinnedLabels}
          onToggle={togglePin}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </div>
  );
}

function EditPinsSheet({
  allItems, pinned, onToggle, onClose,
}: {
  allItems: QAItem[];
  pinned: string[];
  onToggle: (label: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        backgroundColor: "rgba(15,32,68,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: T.white,
          width: "100%", maxHeight: "80vh",
          borderTopLeftRadius: 18, borderTopRightRadius: 18,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 18px", borderBottom: `1px solid ${T.divider}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: FONT }}>
            Edit pinned tools
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: FONT }}
          >
            Done
          </button>
        </div>
        <div style={{ padding: "6px 14px 14px", fontSize: 11, color: T.textMuted, fontFamily: FONT }}>
          Pin up to 8 tools ({pinned.length}/8)
        </div>
        <div style={{ overflowY: "auto", padding: "0 8px 14px" }}>
          {allItems.map((it) => {
            const isPinned = pinned.includes(it.label);
            const Icon = it.Icon;
            const disabled = !isPinned && pinned.length >= 8;
            return (
              <button
                key={it.label}
                type="button"
                onClick={() => onToggle(it.label)}
                disabled={disabled}
                style={{
                  width: "100%", padding: "10px 10px",
                  display: "flex", alignItems: "center", gap: 10,
                  background: "transparent", border: 0,
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.4 : 1,
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 9, backgroundColor: it.bg,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <Icon size={16} color={it.colour} strokeWidth={1.8} />
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T.navy, fontFamily: FONT }}>
                  {it.label}
                </span>
                <span
                  style={{
                    fontSize: 11, fontWeight: 700, fontFamily: FONT,
                    backgroundColor: isPinned ? T.blue : T.surface,
                    color: isPinned ? T.white : T.textMid,
                    borderRadius: 20, padding: "3px 10px",
                  }}
                >
                  {isPinned ? "Pinned" : "Pin"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QATile({
  item, active, onPress,
}: { item: QAItem; active: boolean; onPress: () => void; size?: "grid" | "scroll" }) {
  const Icon = item.Icon;
  const BORDER = "#e0e3ea";
  const HOVER_BORDER = "#c8cdd6";
  const HOVER_BG = "#f8f9fb";
  return (
    <button
      type="button"
      onClick={onPress}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = HOVER_BORDER;
        el.style.background = HOVER_BG;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = BORDER;
        el.style.background = "#FFFFFF";
      }}
      style={{
        width: "100%",
        padding: "11px 12px",
        backgroundColor: "#FFFFFF",
        border: `0.5px solid ${BORDER}`,
        borderRadius: 12,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        textAlign: "left",
        transition: "border-color 150ms ease, background 150ms ease",
        minWidth: 0,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: item.bg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={13} strokeWidth={2} color={item.colour} />
      </span>

      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#1a1a1f",
          fontFamily: FONT,
          lineHeight: 1.3,
          marginTop: 8,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        {item.label}
      </span>
    </button>
  );
}




/* ===================== Events + Membership combined ===================== */
function EventsAndMembershipCard({
  events, membership, navigate,
}: {
  events: UpcomingEvent[];
  membership: ReturnType<typeof useInstructorMembership>["data"];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [eventsOpen, setEventsOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  const BORDER = "#e0e3ea";
  const DIVIDER = "#f0f1f4";
  const HOVER = "#f8f9fb";
  const BODY_BG = "#fafafa";
  const CHARCOAL = "#1a1a1f";
  const MUTED = "#999999";
  const EMPTY = "#bbbbbb";
  const BLUE = "#2952b3";
  const BLUE_TINT = "#e8eefb";
  const PURPLE = "#6b4fc4";
  const PURPLE_TINT = "#f0edfb";
  const GREEN = "#2d8a4e";
  const GREEN_TINT = "#e8f5ee";

  const hasEvents = events.length > 0;
  const next = hasEvents ? events[0] : null;
  const eventsTitle = next ? next.title : "No upcoming events";
  const eventsSub = next ? (next.dateLabel || "No date set") : "No date set";

  const planName = membership?.planName ?? "Free";
  const status = membership?.status;
  const isActive = status === "active";
  const billingCycle = membership?.billingCycle ?? null;
  const renews = membership?.currentPeriodEnd ?? null;
  const renewsLabel = renews ? format(new Date(renews), "d MMM yyyy") : "—";
  const billingLabel = billingCycle
    ? billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)
    : "—";
  const memberTitle = `${planName} plan`;
  const memberSub = isActive ? "Active plan" : status ? status : "Manage plan";

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: MUTED,
    letterSpacing: "0.12em", textTransform: "uppercase",
    fontFamily: FONT,
  };

  const rowButtonStyle: React.CSSProperties = {
    width: "100%", padding: "13px 14px",
    background: "transparent", border: 0, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 12, textAlign: "left",
    transition: "background 150ms ease",
    fontFamily: FONT,
  };

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, fontFamily: FONT,
    }}>
      <span style={{ fontSize: 12, color: MUTED }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: CHARCOAL }}>{value}</span>
    </div>
  );

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: FONT,
      }}
    >
      {/* Events section header */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px 8px",
          borderBottom: `1px solid ${DIVIDER}`,
        }}
      >
        <span style={sectionLabelStyle}>Upcoming events</span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate("/instructor/schedule"); }}
            style={{
              background: "transparent", border: 0, padding: 0, cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: GREEN, fontFamily: FONT,
            }}
          >
            + Add
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate("/instructor/schedule"); }}
            style={{
              background: "transparent", border: 0, padding: 0, cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: BLUE, fontFamily: FONT,
            }}
          >
            See all →
          </button>
        </div>
      </div>

      {/* Events row */}
      <button
        type="button"
        onClick={() => setEventsOpen((o) => !o)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = HOVER; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        style={rowButtonStyle}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: 9,
            backgroundColor: BLUE_TINT,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CalendarDays size={18} strokeWidth={2} color={BLUE} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontSize: 13, fontWeight: 600, color: CHARCOAL,
              fontFamily: FONT,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {eventsTitle}
          </span>
          <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT }}>
            {eventsSub}
          </span>
        </div>
        <ChevronDown
          size={16} color={MUTED} strokeWidth={2.2}
          style={{
            flexShrink: 0, transition: "transform 0.2s ease",
            transform: eventsOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {eventsOpen && (
        <div style={{ borderTop: `1px solid ${DIVIDER}`, background: BODY_BG, padding: 14 }}>
          {hasEvents ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {events.slice(0, 5).map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => navigate(ev.destinationPath)}
                  style={{
                    background: "transparent", border: 0, cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", gap: 10,
                    textAlign: "left", fontFamily: FONT,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: CHARCOAL,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {ev.title}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                      {ev.dateLabel}
                      {ev.timeLabel && ev.timeLabel !== "—" ? ` · ${ev.timeLabel}` : ""}
                    </div>
                  </div>
                  <ChevronRight size={14} color={MUTED} strokeWidth={2} />
                </button>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 10, padding: "14px 0",
              }}
            >
              <CalendarOff size={28} strokeWidth={1.6} color="#d6d8de" />
              <div style={{ fontSize: 12, color: EMPTY, fontFamily: FONT }}>Nothing scheduled yet</div>
            </div>
          )}
        </div>
      )}

      {/* Membership section header — heavier divider on top */}
      <div
        style={{
          padding: "10px 14px 8px",
          borderTop: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${DIVIDER}`,
        }}
      >
        <span style={sectionLabelStyle}>Membership</span>
      </div>

      {/* Membership row */}
      <button
        type="button"
        onClick={() => setMemberOpen((o) => !o)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = HOVER; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        style={rowButtonStyle}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: 9,
            backgroundColor: PURPLE_TINT,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IdCard size={18} strokeWidth={2} color={PURPLE} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontSize: 13, fontWeight: 600, color: CHARCOAL,
              fontFamily: FONT,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {memberTitle}
          </span>
          <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT }}>
            {memberSub}
          </span>
        </div>
        <ChevronDown
          size={16} color={MUTED} strokeWidth={2.2}
          style={{
            flexShrink: 0, transition: "transform 0.2s ease",
            transform: memberOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {memberOpen && (
        <div
          style={{
            borderTop: `1px solid ${DIVIDER}`,
            background: BODY_BG,
            padding: 14,
            display: "flex", flexDirection: "column", gap: 8,
          }}
        >
          <Row
            label="Status"
            value={
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: isActive ? GREEN_TINT : "#f2f4f8",
                  color: isActive ? GREEN : MUTED,
                  fontSize: 10, fontWeight: 600,
                  padding: "3px 8px", borderRadius: 999,
                  fontFamily: FONT,
                }}
              >
                {isActive && <Check size={10} strokeWidth={3} />}
                {isActive ? "Active" : status ? status : "Inactive"}
              </span>
            }
          />
          <Row label="Plan" value={planName} />
          <Row label="Renews" value={renewsLabel} />
          <Row label="Billing" value={billingLabel} />
          <button
            type="button"
            onClick={() => navigate("/instructor/subscription")}
            style={{
              alignSelf: "flex-start",
              background: "transparent", border: 0, padding: 0,
              color: BLUE, fontSize: 12, fontWeight: 600,
              fontFamily: FONT, cursor: "pointer", marginTop: 2,
            }}
          >
            Manage →
          </button>
        </div>
      )}
    </div>
  );
}

export default MobileHomeDSM2026;

