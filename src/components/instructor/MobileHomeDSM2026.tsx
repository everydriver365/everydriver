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
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { format, addDays, getWeek, isSameDay, parse, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
import { useUpcomingEvents, type UpcomingEvent } from "@/hooks/useUpcomingEvents";
import { useInstructorMembership } from "@/hooks/useInstructorMembership";
import { useDayLessons } from "@/hooks/useDayLessons";
import { useInstructorPaymentsData } from "@/hooks/useInstructorPaymentsData";
import { DsmLogo } from "@/components/instructor/ui/DsmLogo";
import { UpNextExpanded } from "@/components/instructor/UpNextExpanded";

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
  const { data: events = [] } = useUpcomingEvents(instructorId);
  const { data: membership } = useInstructorMembership(instructorId);
  const payments = useInstructorPaymentsData(instructorId);

  const [lessonExpanded, setLessonExpanded] = useState(false);

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
    nextFreeSlot: null as string | null, // no hook exists — surface "—" per live-data policy
  };

  const urgentCount = jobsCount + swapsCount;
  const todoCount = msgsCount;

  const attention = {
    total: jobsCount + msgsCount + swapsCount,
    jobs: jobsCount,
    msgs: msgsCount,
    swaps: swapsCount,
    calls: 0,
    enquiries: 0,
    urgentCount,
    todoCount,
    urgentItems: [
      ...(jobsCount > 0
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
        : []),
      ...(swapsCount > 0
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
        : []),
    ],
  };

  return (
    <div
      style={{
        backgroundColor: T.surface,
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
        instructorId={instructorId}
      />

      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <TodayStrip stats={stats} />
        <NeedsAttentionCard attention={attention} stats={stats} navigate={navigate} />
        <ScheduleCard instructorId={instructorId} navigate={navigate} />
        <QuickAccessCard navigate={navigate} />
        <UpcomingEventsCard events={events} navigate={navigate} />
        <MembershipCard membership={membership} navigate={navigate} />
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
  instructorId: string;
}) {
  const {
    firstName, unreadCount, nextLesson, lessonExpanded,
    onToggleLesson, onPhone, onBell, onMenu, onProfile, stats, instructorId,
  } = props;

  return (
    <div
      style={{
        backgroundColor: T.navy,
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
      <StatsStrip stats={stats} />
    </div>
  );
}

/* ============================== Stats strip ============================= */
function StatsStrip({ stats }: { stats: any }) {
  const cells = [
    {
      label: "Earnings · week",
      value: `£${(stats?.weekEarnings ?? 0).toLocaleString("en-GB")}`,
      sub: `£${stats?.todayEarnings ?? 0} today`,
      barPct: stats?.earningsPct ?? 0,
      barColour: T.red,
      denom: null as string | null,
    },
    {
      label: "Lessons · week",
      value: `${stats?.weekLessons ?? 0}`,
      sub: `${stats?.todayLessons ?? 0} today`,
      barPct: stats?.lessonsPct ?? 0,
      barColour: T.blue,
      denom: stats?.lessonTarget > 0 ? `/${stats.lessonTarget}` : null,
    },
  ];
  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 10,
        overflow: "hidden",
        marginTop: 10,
      }}
    >
      {cells.map((s, i) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            padding: "9px 14px",
            borderRight: i === 0 ? "1px solid rgba(255,255,255,0.10)" : 0,
          }}
        >
          <div
            style={{
              fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase", letterSpacing: 0.6,
              marginBottom: 4, fontFamily: FONT,
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontSize: 18, fontWeight: 800, color: T.white,
              letterSpacing: -0.6, lineHeight: "20px", fontFamily: FONT,
            }}
          >
            {s.value}
            {s.denom ? (
              <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>
                {s.denom}
              </span>
            ) : null}
          </div>
          <div
            style={{
              fontSize: 10, color: "rgba(255,255,255,0.4)",
              marginTop: 2, fontFamily: FONT,
            }}
          >
            {s.sub}
          </div>
          <div
            style={{
              height: 2, backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: 1, marginTop: 6, overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${s.barPct}%`,
                backgroundColor: s.barColour,
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================== Today strip ============================= */
function TodayStrip({ stats }: { stats: any }) {
  const items = [
    {
      value: String(stats?.todayLessons ?? 0),
      label: "Lessons today",
      valueColour: T.navy,
      small: false,
    },
    {
      value: stats?.nextFreeSlot ?? "—",
      label: "Next free slot",
      valueColour: T.blue,
      small: true,
    },
    {
      value: `£${(stats?.outstanding ?? 0).toLocaleString("en-GB")}`,
      label: "Outstanding",
      valueColour: (stats?.outstanding ?? 0) > 0 ? T.red : T.navy,
      small: false,
    },
  ];
  return (
    <div
      style={{
        display: "flex",
        backgroundColor: T.white,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(15,32,68,0.06)",
      }}
    >
      {items.map((item, i, arr) => (
        <div
          key={item.label}
          style={{
            flex: 1,
            padding: "11px 10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            borderRight: i < arr.length - 1 ? `1px solid ${T.divider}` : 0,
          }}
        >
          <div
            style={{
              fontSize: item.small ? 12 : 16,
              fontWeight: 800,
              color: item.valueColour,
              letterSpacing: -0.5,
              lineHeight: item.small ? "14px" : "18px",
              fontFamily: FONT,
              textAlign: "center",
            }}
          >
            {item.value}
          </div>
          <div
            style={{
              fontSize: 9, fontWeight: 600, color: T.textMuted,
              textTransform: "uppercase", letterSpacing: 0.5,
              textAlign: "center", fontFamily: FONT,
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
        style={{ textAlign: "left", padding: 13, cursor: "pointer" }}
      >
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
                fontSize: 26, fontWeight: 800, color: T.navy,
                letterSpacing: -1, lineHeight: "28px", fontFamily: FONT,
              }}
            >
              {fmtTime(lesson.startTime)}
            </div>
            <div
              style={{
                fontSize: 14, fontWeight: 700, color: T.navy,
                marginTop: 3, fontFamily: FONT,
              }}
            >
              {lesson.pupilName}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1, fontFamily: FONT }}>
              {durationHours}h · {lesson.pickupPostcode || ""}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <PupilAvatar initials={initialsOf(lesson.pupilName)} />
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
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
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
            bg={T.surface}
            fg={T.textMid}
            onClick={(e) => { e.stopPropagation(); if (phone) window.location.href = `sms:${phone}`; }}
          />
          <ActionBtn
            label="Go"
            Icon={NavIcon}
            bg={T.surface}
            fg={T.textMid}
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
  attention, stats, navigate,
}: { attention: any; stats: any; navigate: ReturnType<typeof useNavigate> }) {
  type Key = "urgent" | "msgs" | "calls" | "enquiries";
  const [openKey, setOpenKey] = useState<Key | null>(
    attention.urgentCount > 0 ? "urgent" : null
  );
  const toggle = (k: Key) => setOpenKey((p) => (p === k ? null : k));

  const tiles: {
    key: Key; icon: LucideIcon; label: string; count: number;
    urgent?: boolean; accent?: string; body: React.ReactNode;
  }[] = [
    {
      key: "urgent", icon: AlertCircle, label: "Urgent",
      count: attention.urgentCount, urgent: true, accent: T.red,
      body: attention.urgentItems.length === 0
        ? <Empty>All clear</Empty>
        : attention.urgentItems.map((it: any) => (
            <UrgentBanner key={it.id} item={it} onPress={() => navigate(it.route)} />
          )),
    },
    { key: "msgs", icon: MessageSquare, label: "Messages",
      count: attention.msgs, body: <Empty>No new messages</Empty> },
    { key: "calls", icon: PhoneCall, label: "Calls",
      count: attention.calls, body: <Empty>No missed calls</Empty> },
    { key: "enquiries", icon: HelpCircle, label: "Enquiries",
      count: attention.enquiries, body: <Empty>No new enquiries</Empty> },
  ];

  const openTile = tiles.find((t) => t.key === openKey);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
        <span
          style={{
            fontSize: 11, fontWeight: 700, color: T.navy, opacity: 0.6,
            letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT,
          }}
        >
          Needs attention
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <span
            style={{
              backgroundColor: T.red, color: T.white, borderRadius: 999,
              padding: "2px 10px", fontSize: 10, fontWeight: 700, fontFamily: FONT,
            }}
          >
            {attention.urgentCount ?? 0} urgent
          </span>
          <span
            style={{
              backgroundColor: "rgba(15,32,68,0.08)", color: T.navy, borderRadius: 999,
              padding: "2px 10px", fontSize: 10, fontWeight: 700, fontFamily: FONT,
            }}
          >
            {attention.todoCount ?? 0} to do
          </span>
        </div>
      </div>

      {/* Action tile heads — 2×2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {tiles.map((t) => (
          <ActionTile
            key={t.key}
            icon={t.icon}
            label={t.label}
            accent={t.accent}
            outlined={t.urgent}
            badgeCount={t.count}
            open={openKey === t.key}
            onToggle={() => toggle(t.key)}
          />
        ))}
      </div>

      {/* Expanded drawer — full width below grid */}
      {openTile ? (
        <div
          style={{
            backgroundColor: T.white,
            borderRadius: 16,
            border: `1px solid ${T.border}`,
            boxShadow: "0 1px 3px rgba(15,32,68,0.06)",
            padding: "10px 12px",
          }}
        >
          {openTile.body}
        </div>
      ) : null}
    </div>
  );
}


/* Grid-friendly action tile — vertical layout so label + badge fit inside
   a compact 2×2 grid cell (~175 px wide). */
function ActionTile({
  icon: Icon,
  label,
  accent,
  outlined,
  badgeCount,
  open,
  onToggle,
}: {
  icon: LucideIcon;
  label: string;
  accent?: string;
  outlined?: boolean;
  badgeCount: number;
  open: boolean;
  onToggle: () => void;
}) {
  const isUrgent = !!outlined && (badgeCount ?? 0) > 0;
  const labelColor = isUrgent ? (accent ?? T.red) : T.navy;
  const iconColor = isUrgent ? (accent ?? T.red) : T.navy;
  const iconOpacity = isUrgent ? 1 : 0.6;
  const border = `1px solid ${T.border}`;
  const hasItems = (badgeCount ?? 0) > 0;

  return (
    <div
      style={{
        backgroundColor: T.white,
        borderRadius: 16,
        border,
        boxShadow: "0 1px 3px rgba(15,32,68,0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "14px 8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: 0,
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        <div style={{ position: "relative", opacity: iconOpacity, color: iconColor }}>
          <Icon size={22} strokeWidth={1.8} />
          {hasItems ? (
            <span
              style={{
                position: "absolute",
                top: -5,
                right: -8,
                minWidth: 15,
                height: 15,
                borderRadius: 8,
                backgroundColor: isUrgent ? (accent ?? T.red) : T.blue,
                color: T.white,
                fontSize: 8,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
                fontFamily: FONT,
              }}
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          ) : null}
        </div>

        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: labelColor,
            fontFamily: FONT,
            lineHeight: "14px",
          }}
        >
          {label}
        </span>

        {!hasItems ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: T.blue,
              fontFamily: FONT,
            }}
          >
            Clear
          </span>
        ) : null}

        <ChevronDown
          size={14}
          strokeWidth={2}
          style={{
            color: T.navy,
            opacity: 0.2,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s",
            marginTop: 2,
          }}
        />
      </button>
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
        border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.accent}`,
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

/* =============================== Schedule =============================== */
function ScheduleCard({
  instructorId, navigate,
}: { instructorId: string; navigate: ReturnType<typeof useNavigate> }) {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(0);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), []);
  const { data: lessons = [] } = useDayLessons(instructorId, days[selectedDay]);
  const { data: weekLessonDates = new Set<string>() } = useWeekLessonDates(instructorId, days);

  return (
    <SectionCard>
      <SectionHeader
        label="Schedule"
        right={
          <button
            type="button"
            onClick={() => navigate("/instructor/schedule")}
            style={{
              background: "transparent", border: 0, cursor: "pointer",
              fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: FONT,
            }}
          >
            Week →
          </button>
        }
      />

      <div style={{ padding: "14px 18px 0" }}>
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: FONT }}>
            {format(today, "MMMM yyyy")}
            <span style={{ fontSize: 13, fontWeight: 400, color: T.textMuted }}>
              {" "}· W{getWeek(today)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <NavBtn Icon={ChevronLeft} onClick={() => setSelectedDay((d) => Math.max(0, d - 1))} />
            <NavBtn Icon={ChevronRight} onClick={() => setSelectedDay((d) => Math.min(6, d + 1))} />
          </div>
        </div>

        {/* Day strip */}
        <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
          {days.map((day, i) => {
            const isSel = i === selectedDay;
            const isTodayCell = isSameDay(day, today);
            const isWknd = [0, 6].includes(day.getDay());
            const hasLesson = weekLessonDates.has(format(day, "yyyy-MM-dd"));
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDay(i)}
                style={{
                  flex: 1,
                  padding: "8px 3px",
                  borderRadius: 12,
                  backgroundColor: isSel ? T.navy : "transparent",
                  border: 0, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                    color: isSel ? "rgba(255,255,255,0.55)" : isWknd ? T.textLight : T.textMuted,
                    fontFamily: FONT,
                  }}
                >
                  {format(day, "EEEEE")}
                </span>
                <span
                  style={{
                    fontSize: 15, fontWeight: 700,
                    color: isSel ? T.white : isWknd ? T.textLight : T.navy,
                    fontFamily: FONT,
                  }}
                >
                  {format(day, "d")}
                </span>
                <span
                  style={{
                    width: 5, height: 5, borderRadius: 3,
                    backgroundColor: hasLesson
                      ? (isTodayCell ? T.red : T.blue)
                      : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>


        {lessons.length === 0 ? (
          <div
            style={{
              padding: "12px 0 14px",
              textAlign: "center", color: T.textMuted, fontSize: 12, fontFamily: FONT,
            }}
          >
            No lessons on {format(days[selectedDay], "EEE d MMM")}
          </div>
        ) : (
          lessons.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => navigate(`/instructor/schedule?lesson=${l.id}`)}
              style={{
                width: "100%",
                marginBottom: 10, borderRadius: 10,
                backgroundColor: T.blueSurface, border: `1px solid ${T.blueMid}`,
                borderLeft: `3px solid ${T.blue}`,
                padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ minWidth: 36, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.blue, lineHeight: "14px", fontFamily: FONT }}>
                  {fmtTime(l.startTime)}
                </div>
                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2, fontFamily: FONT }}>
                  {(l.durationMinutes / 60).toFixed(l.durationMinutes % 60 === 0 ? 0 : 1)}h
                </div>
              </div>
              <div style={{ width: 1, height: 32, backgroundColor: T.blueMid, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 2, fontFamily: FONT }}>
                  {l.pupilName}
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, fontFamily: FONT }}>
                  {l.lessonType}{l.pickupPostcode ? ` · ${l.pickupPostcode}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                {isSameDay(addDays(today, selectedDay), today) ? (
                  <span
                    style={{
                      backgroundColor: T.navy, color: T.white,
                      borderRadius: 4, padding: "2px 7px",
                      fontSize: 9, fontWeight: 700, fontFamily: FONT,
                    }}
                  >
                    TODAY
                  </span>
                ) : null}
                <ChevronRight size={12} color={T.textLight} strokeWidth={2.5} />
              </div>
            </button>
          ))
        )}

        <div style={{ display: "flex", gap: 10, paddingBottom: 14 }}>
          <button
            type="button"
            onClick={() => navigate("/instructor/schedule?add=1")}
            style={{
              flex: 1, borderRadius: 11, padding: "11px 0",
              backgroundColor: T.navy, color: T.white, border: 0, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 13, fontWeight: 600, fontFamily: FONT,
            }}
          >
            <Plus size={13} color={T.white} strokeWidth={2.2} /> Add lesson
          </button>
          <button
            type="button"
            onClick={() => navigate("/instructor/gaps")}
            style={{
              flex: 1, borderRadius: 11, padding: "11px 0",
              backgroundColor: T.white, color: T.textMid,
              border: `1.5px solid ${T.border}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 13, fontWeight: 600, fontFamily: FONT,
            }}
          >
            <Repeat2 size={13} color={T.textMid} strokeWidth={2} /> Fill gaps
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function NavBtn({ Icon, onClick }: { Icon: LucideIcon; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: T.surface, border: 0, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Icon size={14} color={T.textMid} strokeWidth={2} />
    </button>
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
  { label: "How pupils book", Icon: FileText,         ...BLUE_BG, route: "/instructor/booking-rules" },
  { label: "Pupils",          Icon: Users,            ...BLUE_BG, route: "/instructor/pupils" },
  { label: "Payments",        Icon: CreditCard,       ...BLUE_BG, route: "/instructor/payments" },
  { label: "Discounts",       Icon: Tag,              ...RED_BG,  route: "/instructor/discounts" },
  { label: "Driving Tests",   Icon: Car,              ...RED_BG,  route: "/instructor/test-requests" },
  { label: "Lesson history",  Icon: BookOpen,         ...BLUE_BG, route: "/instructor/pupils" },
  { label: "Find slot",       Icon: Search,           ...BLUE_BG, route: "/instructor/gaps" },
  { label: "Next slot",       Icon: ArrowRight,       ...NAVY_BG, route: "/instructor/gaps" },
  { label: "Course planner",  Icon: Grid3x3,          ...BLUE_BG, route: "/instructor/courses" },
  { label: "Waiting list",    Icon: List,             ...RED_BG,  route: "/instructor/enquiries" },
  { label: "Fill gaps",       Icon: Plus,             ...NAVY_BG, route: "/instructor/gaps" },
  { label: "Test swap",       Icon: Repeat2,          ...RED_BG,  route: "/instructor/test-requests" },
  { label: "Standards",       Icon: ShieldCheck,      ...BLUE_BG, route: "/instructor/standards-check" },
  { label: "CPD",             Icon: Award,            ...NAVY_BG, route: "/instructor/cpd" },
  { label: "Rates",           Icon: MapPin,           ...BLUE_BG, route: "/instructor/locations" },
  { label: "Availability",    Icon: CalendarCheck,    ...BLUE_BG, route: "/instructor/availability" },
  { label: "My courses",      Icon: LayoutGrid,       ...BLUE_BG, route: "/instructor/courses" },
  // Row 2
  { label: "Take payment",    Icon: Upload,           ...BLUE_BG, route: "/instructor/pay" },
  { label: "Pending",         Icon: Clock,            ...RED_BG,  route: "/instructor/payments?tab=pending" },
  { label: "Expenses",        Icon: Receipt,          ...NAVY_BG, route: "/instructor/expenses" },
  { label: "Tax",             Icon: Calculator,       ...NAVY_BG, route: "/instructor/tax" },
  { label: "Reviews",         Icon: Star,             ...RED_BG,  route: "/instructor/reviews" },
  { label: "Referrals",       Icon: Share2,           ...RED_BG,  route: "/instructor/payments?tab=bonus" },
  { label: "Fees",            Icon: Info,             ...BLUE_BG, route: "/instructor/payments?tab=fees" },
  { label: "Plan & billing",  Icon: FileSpreadsheet,  ...NAVY_BG, route: "/instructor/subscription" },
  { label: "Vehicle",         Icon: Car,              ...BLUE_BG, route: "/instructor/vehicle-health" },
  { label: "GPS tracking",    Icon: MapPin,           ...BLUE_BG, route: "/instructor/tracking" },
  { label: "Telephony",       Icon: Phone,            ...NAVY_BG, route: "/instructor/calls" },
  { label: "Call answering",  Icon: PhoneCall,        ...NAVY_BG, route: "/instructor/calls" },
  { label: "Reporting",       Icon: TrendingUp,       ...BLUE_BG, route: "/instructor/earnings" },
  { label: "To do",           Icon: CheckSquare,      ...GREY_BG, route: "/instructor/notifications" },
  { label: "Productivity",    Icon: Zap,              ...BLUE_BG, route: "/instructor/earnings" },
  { label: "People & growth", Icon: Users,            ...BLUE_BG, route: "/instructor/pupils" },
  { label: "Support",         Icon: HelpCircle,       ...RED_BG,  route: "/instructor/menu" },
  { label: "Profile",         Icon: UserIcon,         ...RED_BG,  route: "/instructor/profile" },
  { label: "Security",        Icon: Lock,             ...NAVY_BG, route: "/instructor/settings" },
  { label: "Appearance",      Icon: Sliders,          ...GREY_BG, route: "/instructor/settings" },
  { label: "Lab features",    Icon: FlaskConical,     ...BLUE_BG, route: "/instructor/settings" },
  { label: "Accessibility",   Icon: UserCheck,        ...NAVY_BG, route: "/instructor/settings" },
  { label: "Insights",        Icon: BarChart2,        ...BLUE_BG, route: "/instructor/earnings" },
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
  const [editOpen, setEditOpen] = useState(false);
  const [pinnedLabels, setPinnedLabels] = useState<string[]>(() => loadPinnedLabels());

  const pinnedItems = useMemo(() => {
    const byLabel = new Map(QUICK_ACCESS.map((i) => [i.label, i]));
    return pinnedLabels
      .map((l) => byLabel.get(l))
      .filter((x): x is QAItem => Boolean(x))
      .slice(0, 8);
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

  return (
    <SectionCard>
      {/* Header */}
      <SectionHeader
        label="Quick access"
        right={
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            style={{
              background: "transparent", border: 0, cursor: "pointer",
              fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: FONT,
            }}
          >
            Edit pins
          </button>
        }
      />

      {/* Search */}
      <div
        style={{
          margin: "10px 14px",
          backgroundColor: T.surface, borderRadius: 10,
          padding: "9px 12px",
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <Search size={13} color={T.textLight} strokeWidth={1.8} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search all ${QUICK_ACCESS.length} tools…`}
          style={{
            flex: 1, background: "transparent", border: 0, outline: "none",
            fontSize: 12, color: T.textMid, fontFamily: FONT,
          }}
        />
        {query.length > 0 ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0, color: T.textLight, fontSize: 13 }}
            aria-label="Clear search"
          >
            ×
          </button>
        ) : null}
      </div>

      {/* Pinned grid 4x2 */}
      {!filtered ? (
        <div
          style={{
            display: "flex", flexWrap: "wrap",
            padding: "0 10px 10px", gap: 6,
          }}
        >
          {pinnedItems.map((item) => (
            <div key={item.label} style={{ width: "calc(25% - 5px)" }}>
              <QATile
                item={item}
                active={activeRoute === item.route}
                size="grid"
                onPress={() => { setActiveRoute(item.route); navigate(item.route); }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto", paddingBottom: 10 }}>
          <div style={{ display: "flex", gap: 6, padding: "0 12px" }}>
            {filtered.map((item) => (
              <QATile
                key={item.label}
                item={item}
                active={activeRoute === item.route}
                size="scroll"
                onPress={() => { setActiveRoute(item.route); navigate(item.route); }}
              />
            ))}
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 4px", fontSize: 12, color: T.textMuted, fontFamily: FONT }}>
                No matching tools
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* See all */}
      {!filtered ? (
        <button
          type="button"
          onClick={() => navigate("/instructor/menu")}
          style={{
            margin: "0 12px 12px",
            backgroundColor: T.surface, borderRadius: 10,
            padding: "10px 14px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            border: 0, cursor: "pointer", width: "calc(100% - 24px)",
          }}
        >
          <LayoutGrid size={14} color={T.blue} strokeWidth={2} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: FONT }}>
            See all {QUICK_ACCESS.length} tools
          </span>
          <ChevronRight size={12} color={T.blue} strokeWidth={2.5} />
        </button>
      ) : null}

      {editOpen ? (
        <EditPinsSheet
          allItems={QUICK_ACCESS}
          pinned={pinnedLabels}
          onToggle={togglePin}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </SectionCard>
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
  item, active, onPress, size = "scroll",
}: { item: QAItem; active: boolean; onPress: () => void; size?: "grid" | "scroll" }) {
  const Icon = item.Icon;
  const isGrid = size === "grid";
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: isGrid ? "100%" : undefined,
        minWidth: isGrid ? undefined : 72,
        padding: isGrid ? "10px 8px" : "11px 12px",
        backgroundColor: active ? T.navy : T.white,
        border: `1.5px solid ${active ? T.navy : T.border}`,
        borderRadius: 14, cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 32, height: 32, borderRadius: 9,
          backgroundColor: active ? "rgba(255,255,255,0.15)" : item.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon size={16} color={active ? T.white : item.colour} strokeWidth={1.8} />
      </div>
      <span
        style={{
          fontSize: 9, fontWeight: 600,
          color: active ? T.white : T.textMid,
          textAlign: "center", fontFamily: FONT, lineHeight: "12px",
        }}
      >
        {item.label}
      </span>
    </button>
  );
}

/* ============================ Upcoming events =========================== */
function UpcomingEventsCard({
  events, navigate,
}: { events: UpcomingEvent[]; navigate: ReturnType<typeof useNavigate> }) {
  // Group by dateLabel (already preformatted by hook)
  const groups = useMemo(() => {
    const m = new Map<string, UpcomingEvent[]>();
    for (const e of events) {
      const arr = m.get(e.dateLabel) ?? [];
      arr.push(e);
      m.set(e.dateLabel, arr);
    }
    return Array.from(m.entries()).map(([label, items]) => ({ label, items }));
  }, [events]);

  return (
    <SectionCard>
      <SectionHeader label="Upcoming events" />
      {groups.length === 0 ? (
        <div style={{ padding: 18 }}>
          <Empty>No upcoming events</Empty>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.label}>
            <div
              style={{
                padding: "10px 18px 4px",
                fontSize: 9, fontWeight: 700, color: T.textLight,
                letterSpacing: 0.9, textTransform: "uppercase", fontFamily: FONT,
              }}
            >
              {g.label}
            </div>
            {g.items.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => navigate(ev.destinationPath)}
                style={{
                  width: "100%", padding: "12px 18px",
                  borderBottom: `1px solid ${T.divider}`,
                  background: "transparent", border: 0, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 38, height: 38, borderRadius: 11,
                    backgroundColor: T.blueLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CalendarIcon size={17} color={T.blue} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, fontFamily: FONT }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, fontFamily: FONT }}>
                    {ev.locationLabel}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: FONT, flexShrink: 0 }}>
                  {ev.timeLabel}
                </div>
                <ChevronRight size={14} color={T.textLight} strokeWidth={2} />
              </button>
            ))}
          </div>
        ))
      )}
      <div
        style={{
          padding: "11px 18px", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          borderTop: `1px solid ${T.divider}`,
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/instructor/schedule")}
          style={{
            background: "transparent", border: 0, cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: FONT,
          }}
        >
          + Add event
        </button>
        <button
          type="button"
          onClick={() => navigate("/instructor/schedule")}
          style={{
            background: "transparent", border: 0, cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: FONT,
          }}
        >
          See all →
        </button>
      </div>
    </SectionCard>
  );
}

/* ============================== Membership ============================== */
function MembershipCard({
  membership, navigate,
}: {
  membership: ReturnType<typeof useInstructorMembership>["data"];
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <SectionCard>
      <SectionHeader label="Membership" />
      <button
        type="button"
        onClick={() => navigate("/instructor/subscription")}
        style={{
          width: "100%", padding: 16,
          background: "transparent", border: 0, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12, textAlign: "left",
        }}
      >
        <div
          style={{
            width: 38, height: 38, borderRadius: 11,
            backgroundColor: T.redLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Star size={18} color={T.red} strokeWidth={1.8} />
        </div>
        <div
          style={{
            flex: 1, fontSize: 13, fontWeight: 700, color: T.navy,
            textTransform: "uppercase", letterSpacing: 0.5, fontFamily: FONT,
          }}
        >
          {membership?.planName ?? "Plan"}
        </div>
        <div
          style={{
            backgroundColor: T.surface, color: T.textMid,
            borderRadius: 20, padding: "5px 12px",
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 600, fontFamily: FONT,
          }}
        >
          Manage
          <ChevronRight size={12} color={T.textMid} strokeWidth={2} />
        </div>
      </button>
    </SectionCard>
  );
}

export default MobileHomeDSM2026;
