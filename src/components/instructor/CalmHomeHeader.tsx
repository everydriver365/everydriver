import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, Clock,
  Briefcase, MessageSquare, ClipboardCheck, CalendarPlus,
  CheckCircle2,
} from "lucide-react";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { triggerHaptic } from "@/lib/haptics";
import { WeekAtAGlanceCard } from "@/components/instructor/WeekAtAGlanceCard";

// ─── Helpers ──────────────────────────────────────
function titleCase(s: string): string {
  return s.toLowerCase().split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}
function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  const name = titleCase(firstName);
  if (hour >= 6 && hour < 12) return `Morning, ${name}`;
  if (hour >= 12 && hour < 17) return `Afternoon, ${name}`;
  if (hour >= 17 && hour < 22) return `Evening, ${name}`;
  return `Working late, ${name}`;
}
function getStatusLine(args: { remainingToday: number; totalToday: number; nextStartTime?: string | null; nextDayLabel?: string | null; }): string {
  const { remainingToday, totalToday, nextStartTime, nextDayLabel } = args;
  if (remainingToday > 0) return `${remainingToday} ${remainingToday === 1 ? "lesson" : "lessons"} left today`;
  if (totalToday > 0) {
    if (nextStartTime && nextDayLabel) return `You're done for today · next lesson ${nextDayLabel} at ${nextStartTime}`;
    return "You're done for today";
  }
  if (nextStartTime && nextDayLabel) return `No lessons today — next ${nextDayLabel} at ${nextStartTime}`;
  return "No lessons today — perfect for catching up on admin";
}


// ─── Greeting ────────────────────────────────────
function HomeGreeting({ firstName, statusText }: { firstName: string; statusText: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontSize: 28, fontWeight: 500, color: "#000000", letterSpacing: "-0.6px", lineHeight: 1.1, margin: "0 0 4px" }}>
        {getGreeting(firstName)}
      </h1>
      <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>{statusText}</p>
    </div>
  );
}

// ─── Concentric rings ────────────────────────────
function ConcentricRings({ pctOuter, pctMiddle, pctInner, size = 80 }: { pctOuter: number; pctMiddle: number; pctInner: number; size?: number; }) {
  const stroke = 5;
  const center = size / 2;
  const radii = [center - stroke / 2 - 1, center - stroke * 2, center - stroke * 3.5];
  const colors = ["#C8434F", "#2B7BC8", "#3B8B3B"];
  const pcts = [pctOuter, pctMiddle, pctInner];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {radii.map((r, i) => {
        const c = 2 * Math.PI * r;
        const clamped = Math.max(0, Math.min(100, pcts[i]));
        const dash = (clamped / 100) * c;
        return (
          <g key={i} transform={`rotate(-90 ${center} ${center})`}>
            <circle cx={center} cy={center} r={r} stroke={`${colors[i]}22`} strokeWidth={stroke} fill="none" />
            <circle cx={center} cy={center} r={r} stroke={colors[i]} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={`${dash} ${c - dash}`} />
          </g>
        );
      })}
    </svg>
  );
}

function LegendRow({ color, valueBold, valueRest }: { color: string; valueBold: string; valueRest: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#000000" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontWeight: 500 }}>{valueBold}</span>
      <span style={{ color: "#6E6E73" }}>{valueRest}</span>
    </div>
  );
}

function ProgressRingsCompact({ lessonsDone, lessonsTotal, earned, hoursTaught, onPress }: { lessonsDone: number; lessonsTotal: number; earned: number; hoursTaught: number; onPress: () => void; }) {
  const lessonsPct = lessonsTotal > 0 ? (lessonsDone / lessonsTotal) * 100 : 0;
  const earnedPct = lessonsPct * 0.92;
  const hoursPct = lessonsPct * 0.85;
  const overall = Math.round(lessonsPct);
  return (
    <button type="button" onClick={onPress} style={{ width: "100%", background: "#FFFFFF", border: "none", borderRadius: 16, padding: 18, marginBottom: 16, cursor: "pointer", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
          <ConcentricRings pctOuter={lessonsPct} pctMiddle={earnedPct} pctInner={hoursPct} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 500, color: "#000000", letterSpacing: "-0.3px" }}>{overall}%</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#6E6E73", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 4px" }}>On track today</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <LegendRow color="#C8434F" valueBold={`${lessonsDone} of ${lessonsTotal}`} valueRest="lessons" />
            <LegendRow color="#2B7BC8" valueBold={`£${Math.round(earned)}`} valueRest="earned" />
            <LegendRow color="#3B8B3B" valueBold={`${hoursTaught.toFixed(1)}h`} valueRest="taught" />
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Up Next tile ────────────────────────────────
function UpNextTile({ pupilName, startTime, durationMinutes, pickupLocation, minutesUntil, onPress }: { pupilName: string | null; startTime: string | null; durationMinutes: number | null; pickupLocation: string | null; minutesUntil: number | null; onPress: () => void; }) {
  if (!pupilName || !startTime || minutesUntil == null) {
    return (
      <button type="button" onClick={onPress} style={{ width: "100%", background: "#FFFFFF", border: "none", borderRadius: 14, padding: 16, marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: "#E8F3E8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CheckCircle2 style={{ width: 22, height: 22, color: "#3B8B3B" }} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#3B8B3B", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 2px" }}>Done for today</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: "#000000", letterSpacing: "-0.2px", margin: "0 0 1px" }}>No lessons coming up</p>
          <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>Tap to open your diary</p>
        </div>
        <ChevronRight style={{ width: 14, height: 14, color: "#6E6E73", flexShrink: 0 }} strokeWidth={1.6} />
      </button>
    );
  }
  let eyebrow = "Up next · later";
  if (minutesUntil < 90) {
    const h = Math.floor(minutesUntil / 60);
    const m = minutesUntil % 60;
    eyebrow = h > 0 ? `Up next · in ${h}h ${m}m` : `Up next · in ${m}m`;
  } else if (minutesUntil < 1440) eyebrow = "Up next · later today";
  else if (minutesUntil < 2880) eyebrow = "Up next · tomorrow";
  else eyebrow = `Up next · in ${Math.floor(minutesUntil / 1440)} days`;
  const durationLabel = durationMinutes && durationMinutes >= 60 ? `${(durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1)}h lesson` : `${durationMinutes ?? 60}m lesson`;
  const subtitle = pickupLocation ? `${durationLabel} · ${startTime} at ${pickupLocation}` : `${durationLabel} · ${startTime}`;
  return (
    <button type="button" onClick={onPress} style={{ width: "100%", background: "#FFFFFF", border: "none", borderRadius: 14, padding: 16, marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Clock style={{ width: 22, height: 22, color: "#2B7BC8" }} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: "#2B7BC8", letterSpacing: "0.3px", textTransform: "uppercase", margin: "0 0 2px" }}>{eyebrow}</p>
        <p style={{ fontSize: 16, fontWeight: 500, color: "#000000", letterSpacing: "-0.2px", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titleCase(pupilName)}</p>
        <p style={{ fontSize: 12, color: "#6E6E73", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>
      </div>
      <ChevronRight style={{ width: 14, height: 14, color: "#6E6E73", flexShrink: 0 }} strokeWidth={1.6} />
    </button>
  );
}

// ─── Dashboard tile ──────────────────────────────
function DashboardTile({ icon: Icon, iconColor, iconBackground, title, subtitle, pillText, pillColor, pillBackground, showCheck, onPress }: { icon: React.ElementType; iconColor: string; iconBackground: string; title: string; subtitle: string; pillText?: string; pillColor?: string; pillBackground?: string; showCheck?: boolean; onPress: () => void; }) {
  return (
    <button type="button" onClick={() => { triggerHaptic("light"); onPress(); }} style={{ background: "#FFFFFF", border: "none", borderRadius: 14, padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBackground, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 22, height: 22, color: iconColor }} strokeWidth={2} />
        </div>
        {pillText ? (
          <span style={{ fontSize: 11, fontWeight: 500, color: pillColor, background: pillBackground, padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{pillText}</span>
        ) : showCheck ? (
          <CheckCircle2 style={{ width: 14, height: 14, color: "#3B8B3B" }} strokeWidth={2} />
        ) : null}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#000000", letterSpacing: "-0.1px", margin: "0 0 2px" }}>{title}</p>
        <p style={{ fontSize: 12, color: "#6E6E73", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>
      </div>
    </button>
  );
}


// ─── Main ────────────────────────────────────────
interface CalmHomeHeaderProps {
  instructorId: string | undefined;
  instructorName: string | null | undefined;
}

export function CalmHomeHeader({ instructorId, instructorName }: CalmHomeHeaderProps) {
  const navigate = useNavigate();

  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { monthEarnings } = useInstructorLiveStats(instructorId);
  const { data: unreadMessages = 0 } = useUnreadMessagesCount(instructorId);
  const pendingJobsCount = usePendingJobsCount();
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: todayOverview } = useTodayOverview(instructorId);
  const { total: combinedNotifs } = useCombinedNotificationCount(instructorId);
  const { data: testSwapCount = 0 } = useTestSwapNotifications(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);

  const firstName = (instructorName || "Instructor").split(" ")[0];
  const remainingToday = todayLessons?.length ?? 0;
  const totalToday = todayOverview?.lessonCount ?? 0;
  const lessonsDone = Math.max(0, totalToday - remainingToday);
  const hoursTaught = lessonsDone;

  const statusText = useMemo(() => {
    let nextStartTime: string | null = null;
    let nextDayLabel: string | null = null;
    if (nextLesson) {
      nextStartTime = nextLesson.startTime;
      const mu = nextLesson.minutesUntil ?? 0;
      if (mu < 1440) nextDayLabel = "today";
      else if (mu < 2880) nextDayLabel = "tomorrow";
      else nextDayLabel = `in ${Math.floor(mu / 1440)} days`;
    }
    return getStatusLine({ remainingToday, totalToday, nextStartTime, nextDayLabel });
  }, [remainingToday, totalToday, nextLesson]);

  const tip = useMemo(() => {
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return TIPS[day % TIPS.length];
  }, []);

  const jobsSubtitle = pendingJobsCount > 0 ? `${pendingJobsCount} ${pendingJobsCount === 1 ? "course" : "courses"} available` : "Up to date";
  const messagesSubtitle = unreadMessages > 0 ? `${unreadMessages} unread` : "All caught up";
  const testsSubtitle = testSwapCount > 0 ? `${testSwapCount} this week` : "No new matches";
  const gapsCount = gapSuggestions?.length ?? 0;
  const gapsSubtitle = gapsCount > 0 ? `${gapsCount} this week` : "Nothing to fill";

  const earnedToday = (weeklyGoals?.earningsThisWeek ?? 0) > 0
    ? Math.round((weeklyGoals!.earningsThisWeek) / 7)
    : Math.round((monthEarnings ?? 0) / 30);

  return (
    <div style={{ background: "#F2F2F4", padding: "20px 16px" }}>
      <HomeGreeting firstName={firstName} statusText={statusText} />
      <div style={{ marginBottom: 16 }}>
        <WeekAtAGlanceCard instructorId={instructorId} />
      </div>
      <UpNextTile
        pupilName={nextLesson?.pupilName ?? null}
        startTime={nextLesson?.startTime ?? null}
        durationMinutes={nextLesson?.durationMinutes ?? null}
        pickupLocation={nextLesson?.pickupLocation ?? nextLesson?.pickupPostcode ?? null}
        minutesUntil={nextLesson?.minutesUntil ?? null}
        onPress={() => navigate("/instructor/diary")}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 18 }}>
        <DashboardTile icon={Briefcase} iconColor="#8A5BC9" iconBackground="#F1ECFA" title="Job offers" subtitle={jobsSubtitle}
          pillText={pendingJobsCount > 0 ? `${pendingJobsCount} new` : undefined} pillColor="#8A5BC9" pillBackground="#F1ECFA"
          showCheck={pendingJobsCount === 0} onPress={() => navigate("/instructor/jobs")} />
        <DashboardTile icon={MessageSquare} iconColor="#B8801F" iconBackground="#FBF1DE" title="Messages" subtitle={messagesSubtitle}
          pillText={unreadMessages > 0 ? `${unreadMessages} unread` : undefined} pillColor="#B8801F" pillBackground="#FBF1DE"
          showCheck={unreadMessages === 0} onPress={() => navigate("/instructor/messages")} />
        <DashboardTile icon={ClipboardCheck} iconColor="#2B7BC8" iconBackground="#E6F1FB" title="Test swaps" subtitle={testsSubtitle}
          pillText={testSwapCount > 0 ? `${testSwapCount} matches` : undefined} pillColor="#2B7BC8" pillBackground="#E6F1FB"
          onPress={() => navigate("/instructor/test-requests")} />
        <DashboardTile icon={CalendarPlus} iconColor="#3B8B3B" iconBackground="#E8F3E8" title="Fill gaps" subtitle={gapsSubtitle}
          pillText={gapsCount > 0 ? `${gapsCount} open` : undefined} pillColor="#3B8B3B" pillBackground="#E8F3E8"
          onPress={() => navigate("/instructor/gaps")} />
      </div>
      <TipOfDayCard tip={tip} onPress={() => navigate(tip.path)} />
    </div>
  );
}
