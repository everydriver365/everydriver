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
  const previewLessons = (todayLessons || []).slice(0, 4);

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
      {/* 1. Header — greeting + date pill (DSM logo & bell live in MobileBlueHeader above) */}
      <header className="px-6 pt-5 pb-5">
        <h1 className="text-[32px] leading-[1.1] font-bold tracking-tight text-[#1C1C1E]">
          {greeting}
        </h1>
        <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[15px] font-medium text-[#3C3C43]/65">
            <span>{lessonsToday} lesson{lessonsToday === 1 ? "" : "s"} today</span>
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
            className="flex items-center gap-2 pl-3 pr-3 py-2 rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] active:scale-[0.97] transition-transform shrink-0"
          >
            <CalendarIcon className="size-[15px] text-[#3C3C43]/70" />
            <span className="text-[14px] font-semibold text-[#1C1C1E]">
              {format(new Date(), "EEE, d MMM yyyy")}
            </span>
            <ChevronDown className="size-[14px] text-[#3C3C43]/55" />
          </button>
        </div>
      </header>

      {/* 2. Needs your attention (single card, compact rows) */}
      {attentionRows.length > 0 && (
        <section className="px-6 mb-5">
          <Card>
            <div className="px-5 pt-4 pb-1">
              <h2 className="text-[17px] font-semibold tracking-tight text-[#1C1C1E]">
                Needs your attention
              </h2>
            </div>
            <div className="pt-1 pb-1">
              {attentionRows.map((row, i) => (
                <div key={row.key}>
                  <button
                    onClick={row.onClick}
                    className="w-full flex items-center gap-3 px-5 py-3 active:bg-black/[0.03] transition-colors text-left"
                    style={{ minHeight: 76 }}
                  >
                    <div
                      className="size-11 rounded-[12px] flex items-center justify-center shrink-0"
                      style={{ background: row.iconBg, color: row.iconFg }}
                    >
                      {row.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15.5px] font-semibold text-[#1C1C1E] tracking-tight truncate">
                        {row.title}
                      </div>
                      <div className="text-[13px] text-[#3C3C43]/65 mt-0.5 truncate">
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
                    <div className="ml-[76px] border-t border-black/[0.05]" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* 3. Today's schedule — main section, balanced */}
      <section className="px-6 mb-5">
        <Card>
          <div className="flex items-center justify-between px-5 pt-4 pb-1">
            <div className="min-w-0">
              <h2 className="text-[19px] font-bold tracking-tight text-[#1C1C1E] leading-tight">
                Today's schedule
              </h2>
              <p className="text-[13px] text-[#3C3C43]/60 mt-0.5">
                {previewLessons.length === 0
                  ? "Nothing booked yet"
                  : `${lessonsToday} lesson${lessonsToday === 1 ? "" : "s"} planned`}
              </p>
            </div>
            <button
              onClick={() => navigate("/instructor/schedule")}
              className="flex items-center gap-0.5 text-[14px] font-semibold text-[#007AFF] active:opacity-60 transition-opacity shrink-0 ml-2"
            >
              View all
              <ChevronRight className="size-[15px]" />
            </button>
          </div>

          {previewLessons.length === 0 ? (
            <div className="px-5 pt-3 pb-6 text-center">
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
            <div className="pt-2 pb-1">
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
                      className="w-full flex items-center gap-3 px-5 py-3 active:bg-black/[0.03] transition-colors text-left"
                    >
                      {/* Accent bar */}
                      <div
                        className="w-[3px] h-12 rounded-full shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      {/* Time block */}
                      <div className="w-[58px] shrink-0">
                        <div className="text-[20px] font-bold tracking-tight text-[#1C1C1E] tabular-nums leading-none">
                          {lesson.startTime?.slice(0, 5) || "--:--"}
                        </div>
                        <div className="text-[12px] font-medium text-[#3C3C43]/55 mt-1 tabular-nums">
                          {durationLabel}
                        </div>
                      </div>
                      {/* Avatar */}
                      <div className="size-11 rounded-full bg-[#E5E5EA] text-[#3C3C43] flex items-center justify-center text-[14px] font-semibold shrink-0 overflow-hidden">
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
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusClasses}`}
                      >
                        {statusLabel}
                      </span>
                    </button>
                    {i < previewLessons.length - 1 && (
                      <div className="ml-[88px] mr-5 border-t border-black/[0.05]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-4 pb-4 pt-1">
            <button
              onClick={() => navigate("/instructor/schedule?action=add")}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-[12px] bg-[#007AFF]/[0.06] text-[14px] font-semibold text-[#007AFF] active:bg-[#007AFF]/[0.1] transition-colors"
            >
              <Plus className="size-[17px]" />
              Add lesson
            </button>
          </div>
        </Card>
      </section>

      {/* 4. Quick actions — 5 tiles in a row, with Edit link */}
      <section className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
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
        <div className="grid grid-cols-5 gap-2">
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
            onClick={() => navigate("/instructor/schedule?view=gaps")}
          />
          <QuickActionPill
            icon={<MoreHorizontal className="size-[20px]" />}
            label="More"
            tone="neutral"
            onClick={() => navigate("/instructor/more")}
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
      style={{ background: t.bg, color: t.fg, minHeight: 88 }}
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
