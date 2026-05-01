import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
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
} from "lucide-react";
import { useState } from "react";

import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useLastWeekComparison } from "@/hooks/useLastWeekComparison";
import { useHomeActions } from "@/components/instructor/WarmHomeTiles";
import { getTimeOfDayGreeting } from "@/lib/composeStatusSubtitle";

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
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const { data: comparison } = useLastWeekComparison(instructorId);
  const { messageCount, pendingJobsCount } = useCombinedNotificationCount(instructorId);
  const homeActions = useHomeActions(instructorId);

  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  /* ---------------- Subtitle counts -------------------------------------- */
  const lessonsToday = todayOverview?.lessonCount ?? 0;
  const waitingCount = homeActions.length;
  const subParts: string[] = [];
  subParts.push(`${lessonsToday} lesson${lessonsToday === 1 ? "" : "s"} today`);
  if (waitingCount > 0)
    subParts.push(`${waitingCount} thing${waitingCount === 1 ? "" : "s"} waiting`);

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
      onClick: () => navigate("/instructor/schedule?view=gaps"),
    });
  }

  const pillStyles: Record<AttentionTone, string> = {
    red: "bg-[#FF3B30]/10 text-[#FF3B30]",
    amber: "bg-[#FF9500]/12 text-[#C46E00]",
    green: "bg-[#34C759]/12 text-[#1F8E3F]",
  };

  /* ---------------- Today's schedule (max 2 for premium feel) ------------ */
  const previewLessons = (todayLessons || []).slice(0, 2);

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
    <div className="min-h-screen bg-[#F2F2F7] pb-32">
      {/* 1. Header — compact, balanced */}
      <header className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] leading-[1.15] font-bold tracking-tight text-[#1C1C1E] truncate">
              {greeting}
            </h1>
            <p className="mt-1 text-[14px] text-[#3C3C43]/65 font-medium">
              {subParts.join(" · ")}
            </p>
          </div>
          <button
            onClick={() => navigate("/instructor/notifications")}
            className="size-10 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform shadow-[0_1px_2px_rgba(0,0,0,0.04)] shrink-0"
            aria-label="Notifications"
          >
            <Bell className="size-[18px] text-[#1C1C1E]" />
          </button>
        </div>
      </header>

      {/* 2. Needs your attention (single card, stacked rows) */}
      {attentionRows.length > 0 && (
        <section className="px-6 mb-7">
          <Card>
            <div className="px-6 pt-5 pb-1">
              <h2 className="text-[20px] font-semibold tracking-tight text-[#1C1C1E]">
                Needs your attention
              </h2>
            </div>
            <div className="pt-2 pb-2">
              {attentionRows.map((row, i) => (
                <div key={row.key}>
                  <button
                    onClick={row.onClick}
                    className="w-full flex items-center gap-4 px-6 py-4 active:bg-black/[0.03] transition-colors text-left"
                    style={{ minHeight: 80 }}
                  >
                    <div
                      className="size-12 rounded-[14px] flex items-center justify-center shrink-0"
                      style={{ background: row.iconBg, color: row.iconFg }}
                    >
                      {row.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[18px] font-semibold text-[#1C1C1E] tracking-tight truncate">
                        {row.title}
                      </div>
                      <div className="text-[14px] text-[#3C3C43]/65 mt-1 truncate">
                        {row.subtitle}
                      </div>
                    </div>
                    <span
                      className={`text-[13px] font-semibold px-3 py-1 rounded-full shrink-0 ${pillStyles[row.pillTone]}`}
                    >
                      {row.pillLabel}
                    </span>
                    <ChevronRight className="size-[18px] text-[#3C3C43]/35 shrink-0" />
                  </button>
                  {i < attentionRows.length - 1 && (
                    <div className="ml-[88px] border-t border-black/[0.05]" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* 3. Today's schedule — HERO (premium, spacious) */}
      <section className="px-6 mb-8">
        <Card className="shadow-[0_2px_4px_rgba(16,24,40,0.04),0_16px_40px_-12px_rgba(16,24,40,0.12)]">
          {/* Larger header */}
          <div className="flex items-center justify-between px-7 pt-7 pb-2">
            <div>
              <h2 className="text-[26px] font-bold tracking-tight text-[#1C1C1E] leading-tight">
                Today's schedule
              </h2>
              <p className="text-[14px] text-[#3C3C43]/60 mt-1">
                {previewLessons.length === 0
                  ? "Nothing booked yet"
                  : `${lessonsToday} lesson${lessonsToday === 1 ? "" : "s"} planned`}
              </p>
            </div>
            <button
              onClick={() => navigate("/instructor/schedule")}
              className="flex items-center gap-1 text-[15px] font-semibold text-[#007AFF] active:opacity-60 transition-opacity shrink-0 ml-3"
            >
              View all
              <ChevronRight className="size-[16px]" />
            </button>
          </div>

          {previewLessons.length === 0 ? (
            <div className="px-7 pt-6 pb-10 text-center">
              <div className="size-14 rounded-full bg-[#F2F2F7] flex items-center justify-center mx-auto mb-4">
                <CalendarPlus className="size-[26px] text-[#3C3C43]/50" />
              </div>
              <p className="text-[17px] font-medium text-[#1C1C1E]">
                No lessons scheduled today
              </p>
              <p className="text-[14px] text-[#3C3C43]/60 mt-1">
                Add one to get started
              </p>
            </div>
          ) : (
            <div className="pt-3 pb-2">
              {previewLessons.map((lesson, i) => {
                const initials = (lesson.pupilName || "?")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const statusTone =
                  lesson.status === "completed"
                    ? "green"
                    : lesson.status === "in_progress"
                    ? "blue"
                    : "neutral";
                const statusLabel =
                  lesson.status === "completed"
                    ? "Done"
                    : lesson.status === "in_progress"
                    ? "Live"
                    : "Upcoming";
                const statusClasses =
                  statusTone === "green"
                    ? "bg-[#34C759]/12 text-[#1F8E3F]"
                    : statusTone === "blue"
                    ? "bg-[#007AFF]/12 text-[#007AFF]"
                    : "bg-[#007AFF]/10 text-[#007AFF]";
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
                      className="w-full flex items-stretch gap-4 px-7 py-5 active:bg-black/[0.03] transition-colors text-left"
                    >
                      {/* Accent bar */}
                      <div
                        className="w-[3px] rounded-full shrink-0 self-stretch"
                        style={{ backgroundColor: accentColor }}
                      />
                      {/* Time block */}
                      <div className="w-[72px] shrink-0 flex flex-col justify-center">
                        <div className="text-[28px] font-bold tracking-tight text-[#1C1C1E] tabular-nums leading-none">
                          {lesson.startTime?.slice(0, 5) || "--:--"}
                        </div>
                        <div className="text-[13px] font-medium text-[#3C3C43]/55 mt-1.5 tabular-nums">
                          {durationLabel}
                        </div>
                      </div>
                      {/* Avatar */}
                      <div className="size-14 rounded-full bg-[#E5E5EA] text-[#3C3C43] flex items-center justify-center text-[16px] font-semibold shrink-0 overflow-hidden self-center">
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
                      {/* Pupil + meta */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-[18px] font-semibold text-[#1C1C1E] tracking-tight truncate">
                          {lesson.pupilName || "Pupil"}
                        </div>
                        <div className="text-[14px] text-[#3C3C43]/65 mt-1 truncate">
                          {[
                            lesson.lessonType || "Lesson",
                            lesson.pickupLocation || lesson.pickupPostcode,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                        <span
                          className={`inline-flex self-start text-[11px] font-semibold px-2 py-0.5 rounded-full mt-2 ${statusClasses}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <ChevronRight className="size-[18px] text-[#3C3C43]/35 shrink-0 self-center" />
                    </button>
                    {i < previewLessons.length - 1 && (
                      <div className="ml-[112px] mr-7 border-t border-black/[0.05]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="border-t border-black/[0.05]">
            <button
              onClick={() => navigate("/instructor/schedule?action=add")}
              className="w-full flex items-center justify-center gap-2 py-6 text-[16px] font-semibold text-[#007AFF] active:bg-black/[0.03] transition-colors"
            >
              <Plus className="size-[20px]" />
              Add lesson
            </button>
          </div>
        </Card>
      </section>

      {/* 4. Quick actions — exactly 4 large pills */}
      <section className="px-6 mb-7">
        <h2 className="text-[20px] font-semibold tracking-tight text-[#1C1C1E] mb-4 px-1">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionPill
            icon={<CalendarPlus className="size-[20px]" />}
            label="Add lesson"
            tone="blue"
            onClick={() => navigate("/instructor/schedule?action=add")}
          />
          <QuickActionPill
            icon={<PoundSterling className="size-[20px]" />}
            label="Take payment"
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
            onClick={() => navigate("/instructor/schedule?view=gaps")}
          />
        </div>
      </section>

      {/* 5. Smart suggestion — single full-width card */}
      {firstGap && !suggestionDismissed && gapMins > 0 && (
        <section className="px-6 mb-7">
          <div className="rounded-[20px] p-6 relative overflow-hidden bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_-12px_rgba(16,24,40,0.08)]">
            <button
              onClick={() => setSuggestionDismissed(true)}
              className="absolute top-4 right-4 size-8 rounded-full bg-black/[0.04] flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Dismiss"
            >
              <X className="size-[15px] text-[#3C3C43]/55" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-7 rounded-full bg-[#34C759]/12 flex items-center justify-center">
                <Sparkles className="size-[15px] text-[#1F8E3F]" />
              </div>
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#1F8E3F]">
                Smart suggestion
              </span>
            </div>
            <h3 className="text-[22px] font-semibold tracking-tight text-[#1C1C1E] leading-tight pr-8">
              You have a {gapMins} min gap at {firstGap.startTime.slice(0, 5)}
            </h3>
            <p className="text-[15px] text-[#3C3C43]/70 mt-2 leading-relaxed">
              Fill it with a new lesson and boost your earnings.
            </p>
            <button
              onClick={() => navigate("/instructor/schedule?view=gaps")}
              className="mt-5 w-full py-4 rounded-[14px] bg-[#1C1C1E] text-white text-[16px] font-semibold active:opacity-85 transition-opacity"
            >
              Fill slot
            </button>
          </div>
        </section>
      )}

      {/* 6. Earnings — lower priority */}
      <section className="px-6">
        <Card>
          <SectionHeader
            title="Earnings this week"
            action={{
              label: "Details",
              onClick: () => navigate("/instructor/finance"),
            }}
          />
          <div className="px-6 pb-6 pt-1">
            <div className="flex items-baseline gap-3">
              <span className="text-[40px] font-bold tracking-tight text-[#1C1C1E] tabular-nums leading-none">
                £{(comparison?.earningsThisWeek ?? 0).toLocaleString()}
              </span>
              {typeof comparison?.percentChange === "number" &&
                comparison.percentChange !== 0 && (
                  <span
                    className={`inline-flex items-center gap-1 text-[14px] font-semibold ${
                      comparison.isImprovement ? "text-[#1F8E3F]" : "text-[#C46E00]"
                    }`}
                  >
                    {comparison.isImprovement ? (
                      <TrendingUp className="size-[15px]" />
                    ) : (
                      <TrendingDown className="size-[15px]" />
                    )}
                    {Math.abs(comparison.percentChange)}%
                  </span>
                )}
            </div>
            <p className="text-[14px] text-[#3C3C43]/65 mt-2">
              {comparison?.lessonsThisWeek ?? 0} lessons ·{" "}
              {comparison?.hoursThisWeek ?? 0} h taught
            </p>

            <WeekMiniChart
              thisWeek={comparison?.earningsThisWeek ?? 0}
              lastWeek={comparison?.earningsLastWeek ?? 0}
            />
          </div>
        </Card>
      </section>
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
  tone: "blue" | "green" | "amber" | "indigo";
  onClick: () => void;
}) {
  const tones: Record<string, { bg: string; fg: string; iconBg: string }> = {
    blue: { bg: "#FFFFFF", fg: "#1C1C1E", iconBg: "#E8F1FF" },
    green: { bg: "#FFFFFF", fg: "#1C1C1E", iconBg: "#E6F8EC" },
    amber: { bg: "#FFFFFF", fg: "#1C1C1E", iconBg: "#FFF3DC" },
    indigo: { bg: "#FFFFFF", fg: "#1C1C1E", iconBg: "#ECEAFE" },
  };
  const iconColors: Record<string, string> = {
    blue: "#007AFF",
    green: "#1F8E3F",
    amber: "#C46E00",
    indigo: "#5856D6",
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 rounded-[18px] active:scale-[0.98] transition-transform shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-12px_rgba(16,24,40,0.08)]"
      style={{ background: t.bg, color: t.fg, minHeight: 72 }}
    >
      <span
        className="size-10 rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: t.iconBg, color: iconColors[tone] }}
      >
        {icon}
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-left leading-tight">
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
