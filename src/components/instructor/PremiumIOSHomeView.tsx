import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  Bell,
  Plus,
  Briefcase,
  MessageSquare,
  Clock,
  CalendarPlus,
  PoundSterling,
  MessageCircle,
  Sparkles,
  X,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  MapPin,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { HomeToolsHub } from "@/components/instructor/HomeToolsHub";
import { NextUpTile } from "@/components/instructor/NextUpTile";

import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useInstructorProfile } from "@/hooks/useInstructorProfile";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useTomorrowLessons } from "@/hooks/useTomorrowLessons";
import { useLastWeekComparison } from "@/hooks/useLastWeekComparison";
import { useHomeActions } from "@/components/instructor/WarmHomeTiles";
import { getTimeOfDayGreeting } from "@/lib/composeStatusSubtitle";
import { AlertTriangle, GraduationCap } from "lucide-react";

interface Props {
  instructorId: string | undefined;
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
  } | null;
  onPaymentClick: () => void;
}

/* -------------------------------------------------------------------------- */
/* Visual primitives — iOS, light mode, large + spacious                      */
/* -------------------------------------------------------------------------- */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-[20px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_-12px_rgba(16,24,40,0.08)] overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-3">
      <h2 className="text-[20px] font-semibold tracking-tight text-[#1C1C1E]">{title}</h2>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[15px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main view                                                                  */
/* -------------------------------------------------------------------------- */

export function PremiumIOSHomeView({ instructorId, instructor, onPaymentClick }: Props) {
  const navigate = useNavigate();
  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const greeting = getTimeOfDayGreeting(new Date(), firstName);

  const { data: todayOverview } = useTodayOverview(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: tomorrowLessons } = useTomorrowLessons(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const { data: comparison } = useLastWeekComparison(instructorId);
  const { messageCount, pendingJobsCount } = useCombinedNotificationCount(instructorId);
  const homeActions = useHomeActions(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { profile: instructorProfile } = useInstructorProfile(instructorId);

  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  /* ---------------- Subtitle counts -------------------------------------- */
  const lessonsToday = todayOverview?.lessonCount ?? 0;
  const expectedEarnings = todayOverview?.expectedEarnings ?? 0;
  const waitingCount = homeActions.length;

  /* ---------------- Needs attention (max 3 rows) ------------------------- */
  const totalGapSlots =
    gapSuggestions?.reduce((sum, day) => sum + day.slots.length, 0) ?? 0;

  type AttentionTone = "red" | "amber" | "green";
  const attentionRows: Array<{
    key: string;
    iconBg: string;
    iconFg: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    pillTone: AttentionTone;
    pillLabel: string;
    onClick: () => void;
  }> = [];

  if (pendingJobsCount > 0) {
    attentionRows.push({
      key: "jobs",
      iconBg: "#FFE5E1",
      iconFg: "#FF3B30",
      icon: <Briefcase className="size-[22px]" />,
      title: `${pendingJobsCount} new job offer${pendingJobsCount === 1 ? "" : "s"}`,
      subtitle: "Tap to review and respond",
      pillTone: "red",
      pillLabel: String(pendingJobsCount),
      onClick: () => navigate("/instructor/jobs"),
    });
  }
  if (messageCount > 0) {
    attentionRows.push({
      key: "messages",
      iconBg: "#FFF1D6",
      iconFg: "#C46E00",
      icon: <MessageSquare className="size-[22px]" />,
      title: `${messageCount} urgent message${messageCount === 1 ? "" : "s"}`,
      subtitle: "Replies waiting from pupils",
      pillTone: "amber",
      pillLabel: String(messageCount),
      onClick: () => navigate("/instructor/messages"),
    });
  }
  if (totalGapSlots > 0) {
    attentionRows.push({
      key: "gaps",
      iconBg: "#DCF7E4",
      iconFg: "#1F8E3F",
      icon: <Clock className="size-[22px]" />,
      title: `${totalGapSlots} open slot${totalGapSlots === 1 ? "" : "s"} to fill`,
      subtitle: "Suggested pupils available",
      pillTone: "green",
      pillLabel: String(totalGapSlots),
      onClick: () => navigate("/instructor/gaps"),
    });
  }

  const pillStyles: Record<AttentionTone, string> = {
    red: "bg-[#FF3B30]/10 text-[#FF3B30]",
    amber: "bg-[#FF9500]/12 text-[#C46E00]",
    green: "bg-[#34C759]/12 text-[#1F8E3F]",
  };

  /* ---------------- Today's schedule — show all of today's lessons ------- */
  const previewLessons = todayLessons || [];

  /* ---------------- Smart suggestion ------------------------------------- */
  const firstGap = gapSuggestions?.find((d) => d.slots.length > 0)?.slots?.[0];
  const gapMins = firstGap
    ? (() => {
        const [sh, sm] = firstGap.startTime.split(":").map(Number);
        const [eh, em] = firstGap.endTime.split(":").map(Number);
        return eh * 60 + em - (sh * 60 + sm);
      })()
    : 0;

  /* ---------------- Render ----------------------------------------------- */
  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-32 px-4">
      {/* SECTION 1: Greeting / subtext / date pill — strict left-aligned vertical stack */}
      <header className="pt-2">
        <h1 className="text-[26px] leading-[1.05] font-bold tracking-tight text-[#1C1C1E] truncate">
          {greeting}
        </h1>
        <p className="mt-1 text-[13px] font-medium text-[#3C3C43]/65 whitespace-nowrap overflow-hidden text-ellipsis">
          <span>{lessonsToday} lesson{lessonsToday === 1 ? "" : "s"} today</span>
          {expectedEarnings > 0 && (
            <>
              <span className="mx-1.5 text-[#3C3C43]/40">·</span>
              <span>£{expectedEarnings} expected</span>
            </>
          )}
          {waitingCount > 0 && (
            <>
              <span className="mx-1.5 text-[#3C3C43]/40">·</span>
              <span className="text-[#FF3B30] font-semibold">
                {waitingCount} thing{waitingCount === 1 ? "" : "s"} waiting
              </span>
            </>
          )}
        </p>
        <button
          onClick={() => navigate("/instructor/schedule")}
          className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] active:scale-[0.97] transition-transform"
        >
          <CalendarIcon className="size-[12px] text-[#3C3C43]/70" />
          <span className="text-[12px] font-semibold text-[#1C1C1E]">
            {format(new Date(), "EEE, d MMM yyyy")}
          </span>
          <ChevronDown className="size-[12px] text-[#3C3C43]/55" />
        </button>
      </header>

      {/* SECTION: Next lesson tile (rich, with avatar / ETA / route recorder) */}
      <section className="mt-4">
        {instructorId && nextLesson ? (
          <NextUpTile
            lessonId={nextLesson.lessonId}
            pupilId={nextLesson.pupilId}
            pupilName={nextLesson.pupilName}
            pupilProfileImage={nextLesson.pupilProfileImage}
            pupilPhone={nextLesson.pupilPhone}
            lessonDate={nextLesson.lessonDate}
            pickupPostcode={nextLesson.pickupPostcode}
            pickupLocation={nextLesson.pickupLocation}
            startTime={nextLesson.startTime}
            minutesUntil={nextLesson.minutesUntil}
            accountBalance={nextLesson.accountBalance}
            prepaidHours={nextLesson.prepaidHours}
            durationMinutes={nextLesson.durationMinutes}
            instructorId={instructorId}
            checkInStatus={nextLesson.checkInStatus}
            lastLessonPlan={nextLesson.lastLessonPlan}
          />
        ) : (
          <div
            className="bg-white rounded-[22px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_-12px_rgba(16,24,40,0.08)] overflow-hidden"
            style={{ borderLeft: "3px solid #007AFF" }}
          >
            <div className="px-4 py-5 text-center">
              <div className="text-[11px] font-semibold tracking-[0.06em] text-[#3C3C43]/55 uppercase mb-2">
                Next lesson
              </div>
              <p className="text-[15px] font-medium text-[#1C1C1E]">No upcoming lesson</p>
              <button
                onClick={() => navigate("/instructor/schedule?action=add")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#007AFF]/[0.08] text-[#007AFF] text-[13px] font-semibold px-3.5 py-1.5 active:bg-[#007AFF]/[0.14] transition-colors"
              >
                <Plus className="size-[14px]" />
                Add lesson
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Smart inline alert: leave-soon prompt for next lesson (uses existing data) */}
      {(() => {
        if (!nextLesson) return null;
        const m = nextLesson.minutesUntil;
        // Only relevant when next lesson is today and within the next ~45 min
        if (m <= 0 || m > 45) return null;
        const hhmm = (nextLesson.startTime || "").slice(0, 5);
        const label =
          m <= 15
            ? `Leave now for your ${hhmm} lesson`
            : `Leave in ${m - 10} min for your ${hhmm} lesson`;
        return (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-[14px] bg-[#FFF6E0] text-[#8A5A00]">
            <Clock className="size-[14px] shrink-0" />
            <span className="text-[12.5px] font-medium leading-snug">{label}</span>
          </div>
        );
      })()}

      {/* Contextual nudges (conditional, subtle) */}
      {(() => {
        const nudges: Array<{ key: string; icon: React.ReactNode; label: string; onClick?: () => void }> = [];
        const testTomorrow = (tomorrowLessons || []).find((l: any) => {
          const t = (l.lessonType || "").toLowerCase();
          return t.includes("test");
        });
        if (testTomorrow) {
          nudges.push({
            key: "test-tomorrow",
            icon: <GraduationCap className="size-[14px]" />,
            label: `Pupil test tomorrow — ${testTomorrow.pupilName || "review prep"}`,
            onClick: () => navigate("/instructor/schedule"),
          });
        }
        if (!nudges.length) return null;
        return (
          <div className="mt-3 flex flex-col gap-2">
            {nudges.map((n) => (
              <button
                key={n.key}
                onClick={n.onClick}
                className="flex items-center gap-2 px-3 py-2 rounded-[14px] bg-[#EEF4FF] text-[#1A4FB8] active:opacity-80 transition-opacity text-left"
              >
                <span className="shrink-0">{n.icon}</span>
                <span className="text-[12.5px] font-medium leading-snug truncate">{n.label}</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* SECTION 2: Needs attention — single card, 64px rows */}
      {attentionRows.length > 0 && (
        <section className="mt-4">
          <Card>
            <div className="px-4 pt-4 pb-1">
              <h2 className="text-[17px] font-semibold tracking-tight text-[#1C1C1E]">
                Needs your attention
              </h2>
            </div>
            <div>
              {attentionRows.map((row, i) => (
                <div key={row.key}>
                  <button
                    onClick={row.onClick}
                    className="w-full flex items-center gap-3 px-4 active:bg-black/[0.03] transition-colors text-left"
                    style={{ height: 64 }}
                  >
                    <div
                      className="size-10 rounded-[12px] flex items-center justify-center shrink-0"
                      style={{ background: row.iconBg, color: row.iconFg }}
                    >
                      {row.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-[#1C1C1E] tracking-tight truncate">
                        {row.title}
                      </div>
                      <div className="text-[12.5px] text-[#3C3C43]/65 mt-0.5 truncate">
                        {row.subtitle}
                      </div>
                    </div>
                    <span
                      className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${pillStyles[row.pillTone]}`}
                    >
                      {row.pillLabel}
                    </span>
                    <ChevronRight className="size-[16px] text-[#3C3C43]/35 shrink-0" />
                  </button>
                  {i < attentionRows.length - 1 && (
                    <div className="ml-[68px] border-t border-black/[0.05]" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}


      {/* SECTION 3: Today's schedule */}
      <section className="mt-4">
        <Card>
          <div className="flex items-center justify-between px-4 pt-4 pb-1">
            <h2 className="text-[17px] font-semibold tracking-tight text-[#1C1C1E] leading-tight">
              Today's schedule
            </h2>
            <button
              onClick={() => navigate("/instructor/schedule")}
              className="flex items-center gap-0.5 text-[14px] font-semibold text-[#007AFF] active:opacity-60 transition-opacity shrink-0 ml-2"
            >
              View all
              <ChevronRight className="size-[15px]" />
            </button>
          </div>

          {previewLessons.length === 0 ? (
            <div className="px-4 pt-3 pb-5 text-center">
              <div className="size-12 rounded-full bg-[#F2F2F7] flex items-center justify-center mx-auto mb-3">
                <CalendarPlus className="size-[22px] text-[#3C3C43]/50" />
              </div>
              <p className="text-[15px] font-medium text-[#1C1C1E]">
                No lessons scheduled today
              </p>
              <p className="text-[13px] text-[#3C3C43]/60 mt-0.5">
                Add one to get started
              </p>
            </div>
          ) : (
            <div className="pt-1">
              {previewLessons.map((lesson, i) => {
                const initials = (lesson.pupilName || "?")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const isCompleted = lesson.status === "completed";
                const isInProgress = lesson.status === "in_progress";
                const owesAmount =
                  !isCompleted &&
                  lesson.paymentStatus !== "paid" &&
                  typeof lesson.amountDue === "number" &&
                  lesson.amountDue > 0
                    ? lesson.amountDue
                    : 0;
                // For non-completed / non-live lessons, show "Owed £X" pill if
                // payment is outstanding; otherwise show no pill (Upcoming removed).
                const statusTone: "green" | "blue" | "red" | null = isCompleted
                  ? "green"
                  : isInProgress
                  ? "blue"
                  : owesAmount > 0
                  ? "red"
                  : null;
                const statusLabel = isCompleted
                  ? "Done"
                  : isInProgress
                  ? "Live"
                  : owesAmount > 0
                  ? `Owed £${owesAmount % 1 === 0 ? owesAmount.toFixed(0) : owesAmount.toFixed(2)}`
                  : null;
                const statusClasses =
                  statusTone === "green"
                    ? "bg-[#34C759]/12 text-[#1F8E3F]"
                    : statusTone === "blue"
                    ? "bg-[#007AFF]/12 text-[#007AFF]"
                    : statusTone === "red"
                    ? "bg-[#FF3B30]/12 text-[#FF3B30]"
                    : "";
                const accentColor =
                  statusTone === "green"
                    ? "#34C759"
                    : statusTone === "blue"
                    ? "#007AFF"
                    : "#007AFF";
                const durationLabel = lesson.durationMinutes
                  ? `${lesson.durationMinutes >= 60 ? Math.floor(lesson.durationMinutes / 60) + "h " : ""}${lesson.durationMinutes % 60 ? (lesson.durationMinutes % 60) + "m" : ""}`.trim() || "--"
                  : "--";
                return (
                  <div key={lesson.id || i}>
                    <button
                      onClick={() =>
                        navigate(`/instructor/schedule?lessonId=${lesson.id}`)
                      }
                      className="w-full flex items-center gap-3 px-4 active:bg-black/[0.03] transition-colors text-left"
                      style={{ height: 68 }}
                    >
                      <div
                        className="w-[3px] h-12 rounded-full shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      <div className="w-[54px] shrink-0">
                        <div className="text-[18px] font-bold tracking-tight text-[#1C1C1E] tabular-nums leading-none">
                          {lesson.startTime?.slice(0, 5) || "--:--"}
                        </div>
                        <div className="text-[12px] font-medium text-[#3C3C43]/55 mt-1 tabular-nums">
                          {durationLabel}
                        </div>
                      </div>
                      <div className="size-10 rounded-full bg-[#E5E5EA] text-[#3C3C43] flex items-center justify-center text-[13px] font-semibold shrink-0 overflow-hidden">
                        {lesson.pupilProfileImageUrl ? (
                          <img
                            src={lesson.pupilProfileImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-[#1C1C1E] tracking-tight truncate">
                          {lesson.pupilName || "Pupil"}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 min-w-0">
                          <MapPin className="size-[12px] text-[#3C3C43]/55 shrink-0" />
                          <div className="text-[12.5px] text-[#3C3C43]/65 truncate">
                            {[
                              lesson.lessonType || "Lesson",
                              lesson.pickupLocation || lesson.pickupPostcode,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                      </div>
                      {statusLabel && (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusClasses}`}
                        >
                          {statusLabel}
                        </span>
                      )}
                    </button>
                    {i < previewLessons.length - 1 && (
                      <div className="ml-[80px] mr-4 border-t border-black/[0.05]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-4 pb-3 pt-2">
            <button
              onClick={() => navigate("/instructor/schedule?action=add")}
              className="w-full flex items-center justify-center gap-1.5 rounded-[10px] bg-[#007AFF]/[0.06] text-[13px] font-semibold text-[#007AFF] active:bg-[#007AFF]/[0.1] transition-colors"
              style={{ height: 40 }}
            >
              <Plus className="size-[15px]" />
              Add lesson
            </button>
          </div>
        </Card>
      </section>

      {/* SECTION 4: Quick actions — 4 tiles, single row */}
      <section className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-semibold tracking-tight text-[#1C1C1E]">
            Quick actions
          </h2>
          <button
            onClick={() => navigate("/instructor/settings?tab=appearance")}
            className="text-[14px] font-semibold text-[#007AFF] active:opacity-60 transition-opacity"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <QuickActionPill
            icon={<CalendarPlus className="size-[20px]" />}
            label="Add lesson"
            tone="blue"
            onClick={() => navigate("/instructor/schedule?action=add")}
          />
          <QuickActionPill
            icon={<PoundSterling className="size-[20px]" />}
            label="Payment"
            tone="green"
            onClick={onPaymentClick}
          />
          <QuickActionPill
            icon={<MessageCircle className="size-[20px]" />}
            label="Message"
            tone="indigo"
            onClick={() => navigate("/instructor/messages")}
          />
          <QuickActionPill
            icon={<Clock className="size-[20px]" />}
            label="Fill gap"
            tone="amber"
            onClick={() => navigate("/instructor/gaps")}
          />
        </div>
      </section>

      {/* SECTION: Tools — premium iOS hub */}
      <HomeToolsHub />


      {/* 5. Gap filler — subtle white card with light green tint + green accent */}
      {firstGap && !suggestionDismissed && gapMins > 0 && (() => {
        const startLabel = firstGap.startTime.slice(0, 5);
        const endLabel = firstGap.endTime.slice(0, 5);
        const hourly = instructorProfile?.hourly_rate ?? 0;
        const potential = hourly > 0 ? Math.round((gapMins / 60) * hourly) : 0;
        return (
          <section className="mt-5">
            <div className="rounded-[22px] p-5 relative overflow-hidden bg-gradient-to-br from-[#F1FBF4] to-white border border-[#34C759]/15 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_-12px_rgba(16,24,40,0.06)]">
              <button
                onClick={() => setSuggestionDismissed(true)}
                className="absolute top-3 right-3 size-7 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Dismiss"
              >
                <X className="size-[16px] text-[#3C3C43]/55" />
              </button>
              <div className="flex items-start gap-3 pr-7">
                <div className="size-10 rounded-[12px] bg-[#E6F8EC] flex items-center justify-center shrink-0">
                  <CalendarIcon className="size-[18px] text-[#1F8E3F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold tracking-wide uppercase text-[#1F8E3F]">
                    Gap opportunity
                  </div>
                  <h3 className="mt-0.5 text-[15.5px] font-semibold tracking-tight text-[#1C1C1E] leading-snug">
                    You have a {gapMins} min gap at {startLabel}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#3C3C43]/70">
                      <Clock className="size-[12px]" />
                      {startLabel} → {endLabel}
                    </span>
                    {potential > 0 && (
                      <>
                        <span className="text-[#3C3C43]/30">·</span>
                        <span className="text-[12.5px] font-semibold text-[#1F8E3F]">
                          +£{potential} potential
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/instructor/gaps")}
                className="mt-4 w-full h-11 rounded-[12px] bg-[#1F8E3F] text-white text-[14px] font-semibold active:opacity-85 transition-opacity shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
              >
                Fill slot
              </button>
            </div>
          </section>
        );
      })()}

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function QuickActionPill({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "blue" | "green" | "amber" | "indigo" | "neutral";
  onClick: () => void;
}) {
  const tones: Record<string, { bg: string; fg: string; iconBg: string }> = {
    blue: { bg: "#FFFFFF", fg: "#1C1C1E", iconBg: "#E8F1FF" },
    green: { bg: "#FFFFFF", fg: "#1C1C1E", iconBg: "#E6F8EC" },
    amber: { bg: "#FFFFFF", fg: "#1C1C1E", iconBg: "#FFF3DC" },
    indigo: { bg: "#FFFFFF", fg: "#1C1C1E", iconBg: "#ECEAFE" },
    neutral: { bg: "#FFFFFF", fg: "#1C1C1E", iconBg: "#EFEFF4" },
  };
  const iconColors: Record<string, string> = {
    blue: "#007AFF",
    green: "#1F8E3F",
    amber: "#C46E00",
    indigo: "#5856D6",
    neutral: "#3C3C43",
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 px-1.5 rounded-[16px] active:scale-[0.97] transition-transform shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-12px_rgba(16,24,40,0.08)]"
      style={{ background: t.bg, color: t.fg, height: 72 }}
    >
      <span
        className="size-9 rounded-[11px] flex items-center justify-center shrink-0"
        style={{ background: t.iconBg, color: iconColors[tone] }}
      >
        {icon}
      </span>
      <span className="text-[11.5px] font-semibold tracking-tight text-center leading-tight">
        {label}
      </span>
    </button>
  );
}

function WeekMiniChart({ thisWeek, lastWeek }: { thisWeek: number; lastWeek: number }) {
  const max = Math.max(thisWeek, lastWeek, 1);
  const tw = Math.max(8, Math.round((thisWeek / max) * 100));
  const lw = Math.max(8, Math.round((lastWeek / max) * 100));
  return (
    <div className="mt-6 flex items-end gap-4 h-24">
      <div className="flex-1 flex flex-col items-center gap-2">
        <div
          className="w-full rounded-[10px] bg-[#E5E5EA]"
          style={{ height: `${lw}%` }}
        />
        <span className="text-[12px] font-medium text-[#3C3C43]/60">Last wk</span>
      </div>
      <div className="flex-1 flex flex-col items-center gap-2">
        <div
          className="w-full rounded-[10px] bg-[#007AFF]"
          style={{ height: `${tw}%` }}
        />
        <span className="text-[12px] font-medium text-[#1C1C1E]">This wk</span>
      </div>
    </div>
  );
}

