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

/**
 * PremiumHome
 * -----------
 * Brand-new instructor mobile Home screen layout.
 * Strict single-column structure, iOS light-mode, large typography,
 * generous whitespace, max 3 visible sections at any moment.
 *
 * NOTE: Visual layout only. All data hooks, navigation targets and
 * click handlers are reused from the existing Home screen.
 */
export function PremiumHome({ instructorId, instructor, onPaymentClick }: Props) {
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

  /* ---------------- Header subtitle -------------------------------------- */
  const lessonsToday = todayOverview?.lessonCount ?? 0;
  const waitingCount = homeActions.length;
  const sub: string[] = [
    `${lessonsToday} lesson${lessonsToday === 1 ? "" : "s"} today`,
  ];
  if (waitingCount > 0)
    sub.push(`${waitingCount} thing${waitingCount === 1 ? "" : "s"} waiting`);

  /* ---------------- Needs Attention rows --------------------------------- */
  const totalGapSlots =
    gapSuggestions?.reduce((sum, day) => sum + day.slots.length, 0) ?? 0;

  type Tone = "red" | "amber" | "green";
  const attention: Array<{
    key: string;
    iconBg: string;
    iconFg: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    tone: Tone;
    pill: string;
    onClick: () => void;
  }> = [];

  if (pendingJobsCount > 0)
    attention.push({
      key: "jobs",
      iconBg: "#FFE5E1",
      iconFg: "#FF3B30",
      icon: <Briefcase className="size-[22px]" />,
      title: `${pendingJobsCount} new job offer${pendingJobsCount === 1 ? "" : "s"}`,
      subtitle: "Tap to review and respond",
      tone: "red",
      pill: String(pendingJobsCount),
      onClick: () => navigate("/instructor/jobs"),
    });
  if (messageCount > 0)
    attention.push({
      key: "messages",
      iconBg: "#FFF1D6",
      iconFg: "#C46E00",
      icon: <MessageSquare className="size-[22px]" />,
      title: `${messageCount} urgent message${messageCount === 1 ? "" : "s"}`,
      subtitle: "Replies waiting from pupils",
      tone: "amber",
      pill: String(messageCount),
      onClick: () => navigate("/instructor/messages"),
    });
  if (totalGapSlots > 0)
    attention.push({
      key: "gaps",
      iconBg: "#DCF7E4",
      iconFg: "#1F8E3F",
      icon: <Clock className="size-[22px]" />,
      title: `${totalGapSlots} open slot${totalGapSlots === 1 ? "" : "s"} to fill`,
      subtitle: "Suggested pupils available",
      tone: "green",
      pill: String(totalGapSlots),
      onClick: () => navigate("/instructor/schedule?view=gaps"),
    });

  const pillCls: Record<Tone, string> = {
    red: "bg-[#FF3B30]/10 text-[#FF3B30]",
    amber: "bg-[#FF9500]/12 text-[#C46E00]",
    green: "bg-[#34C759]/12 text-[#1F8E3F]",
  };

  /* ---------------- Today's schedule (max 3) ----------------------------- */
  const previewLessons = (todayLessons || []).slice(0, 3);

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
    <div className="min-h-screen bg-[#F2F2F7] pb-20">
      {/* ---------------- 1. Header (large, spacious) ---------------- */}
      <header className="px-6 pt-14 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[32px] leading-[1.05] font-bold tracking-tight text-[#1C1C1E]">
              {greeting}
            </h1>
            <p className="mt-2 text-[15px] text-[#3C3C43]/65 font-medium">
              {sub.join(" · ")}
            </p>
          </div>
          <button
            onClick={() => navigate("/instructor/notifications")}
            className="size-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform shadow-[0_1px_2px_rgba(0,0,0,0.04)] shrink-0 mt-1"
            aria-label="Notifications"
          >
            <Bell className="size-[19px] text-[#1C1C1E]" />
          </button>
        </div>
      </header>

      {/* ---------------- 2. Needs your attention ---------------- */}
      {attention.length > 0 && (
        <section className="px-6 mb-8">
          <FullCard>
            <div className="px-6 pt-5">
              <h2 className="text-[20px] font-semibold tracking-tight text-[#1C1C1E]">
                Needs your attention
              </h2>
            </div>
            <div className="pt-3 pb-2">
              {attention.map((row, i) => (
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
                      className={`text-[13px] font-semibold px-3 py-1 rounded-full shrink-0 ${pillCls[row.tone]}`}
                    >
                      {row.pill}
                    </span>
                    <ChevronRight className="size-[18px] text-[#3C3C43]/35 shrink-0" />
                  </button>
                  {i < attention.length - 1 && (
                    <div className="ml-[88px] border-t border-black/[0.05]" />
                  )}
                </div>
              ))}
            </div>
          </FullCard>
        </section>
      )}

      {/* ---------------- 3. Today's schedule (HERO) ---------------- */}
      <section className="px-6 mb-8">
        <FullCard>
          <SectionHead
            title="Today's schedule"
            actionLabel="View full"
            onAction={() => navigate("/instructor/schedule")}
          />
          {previewLessons.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[16px] text-[#3C3C43]/65">
                No lessons scheduled today
              </p>
            </div>
          ) : (
            <div>
              {previewLessons.map((lesson, i) => {
                const initials = (lesson.pupilName || "?")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const tone =
                  lesson.status === "completed"
                    ? "bg-[#34C759]/12 text-[#1F8E3F]"
                    : lesson.status === "in_progress"
                    ? "bg-[#007AFF]/12 text-[#007AFF]"
                    : "bg-black/[0.06] text-[#3C3C43]/75";
                const label =
                  lesson.status === "completed"
                    ? "Done"
                    : lesson.status === "in_progress"
                    ? "Live"
                    : "Booked";
                const dur = lesson.durationMinutes;
                const durLabel = dur
                  ? `${dur >= 60 ? Math.floor(dur / 60) + "h " : ""}${dur % 60 ? (dur % 60) + "m" : ""}`.trim() ||
                    "--"
                  : "--";

                return (
                  <div key={lesson.id || i}>
                    <button
                      onClick={() =>
                        navigate(`/instructor/schedule?lessonId=${lesson.id}`)
                      }
                      className="w-full flex items-center gap-4 px-6 py-4 active:bg-black/[0.03] transition-colors text-left"
                      style={{ minHeight: 88 }}
                    >
                      <div className="w-16 shrink-0">
                        <div className="text-[20px] font-bold tracking-tight text-[#1C1C1E] tabular-nums leading-tight">
                          {lesson.startTime?.slice(0, 5) || "--:--"}
                        </div>
                        <div className="text-[13px] text-[#3C3C43]/60 mt-1 tabular-nums">
                          {durLabel}
                        </div>
                      </div>
                      <div className="size-12 rounded-full bg-[#E5E5EA] text-[#3C3C43] flex items-center justify-center text-[15px] font-semibold shrink-0 overflow-hidden">
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
                      </div>
                      <span
                        className={`text-[12px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${tone}`}
                      >
                        {label}
                      </span>
                    </button>
                    {i < previewLessons.length - 1 && (
                      <div className="ml-[104px] border-t border-black/[0.05]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="border-t border-black/[0.05]">
            <button
              onClick={() => navigate("/instructor/schedule?action=add")}
              className="w-full flex items-center justify-center gap-2 py-5 text-[16px] font-semibold text-[#007AFF] active:bg-black/[0.03] transition-colors"
            >
              <Plus className="size-[19px]" />
              Add lesson
            </button>
          </div>
        </FullCard>
      </section>

      {/* ---------------- 4. Quick actions (4 large pills) ---------------- */}
      <section className="px-6 mb-8">
        <h2 className="text-[20px] font-semibold tracking-tight text-[#1C1C1E] mb-4 px-1">
          Quick actions
        </h2>
        <div className="space-y-3">
          <ActionPill
            icon={<CalendarPlus className="size-[20px]" />}
            label="Add lesson"
            tone="blue"
            onClick={() => navigate("/instructor/schedule?action=add")}
          />
          <ActionPill
            icon={<PoundSterling className="size-[20px]" />}
            label="Take payment"
            tone="green"
            onClick={onPaymentClick}
          />
          <ActionPill
            icon={<MessageCircle className="size-[20px]" />}
            label="Message"
            tone="indigo"
            onClick={() => navigate("/instructor/messages")}
          />
          <ActionPill
            icon={<Clock className="size-[20px]" />}
            label="Fill gap"
            tone="amber"
            onClick={() => navigate("/instructor/schedule?view=gaps")}
          />
        </div>
      </section>

      {/* ---------------- 5. Smart suggestion (single full-width card) -- */}
      {firstGap && !suggestionDismissed && gapMins > 0 && (
        <section className="px-6 mb-8">
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

      {/* ---------------- 6. Earnings (lower priority) -------------- */}
      <section className="px-6">
        <FullCard>
          <SectionHead
            title="Earnings this week"
            actionLabel="Details"
            onAction={() => navigate("/instructor/finance")}
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
                      comparison.isImprovement
                        ? "text-[#1F8E3F]"
                        : "text-[#C46E00]"
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

            <MiniBarChart
              thisWeek={comparison?.earningsThisWeek ?? 0}
              lastWeek={comparison?.earningsLastWeek ?? 0}
            />
          </div>
        </FullCard>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Local primitives                                                           */
/* -------------------------------------------------------------------------- */

function FullCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-[20px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_-12px_rgba(16,24,40,0.08)] overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHead({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-5 pb-3">
      <h2 className="text-[20px] font-semibold tracking-tight text-[#1C1C1E]">
        {title}
      </h2>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-[15px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ActionPill({
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
  const tones: Record<string, { iconBg: string; iconFg: string }> = {
    blue: { iconBg: "#E8F1FF", iconFg: "#007AFF" },
    green: { iconBg: "#E6F8EC", iconFg: "#1F8E3F" },
    amber: { iconBg: "#FFF3DC", iconFg: "#C46E00" },
    indigo: { iconBg: "#ECEAFE", iconFg: "#5856D6" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 rounded-[18px] bg-white active:scale-[0.99] transition-transform shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-12px_rgba(16,24,40,0.08)]"
      style={{ minHeight: 72 }}
    >
      <span
        className="size-11 rounded-[13px] flex items-center justify-center shrink-0"
        style={{ background: t.iconBg, color: t.iconFg }}
      >
        {icon}
      </span>
      <span className="flex-1 text-left text-[17px] font-semibold tracking-tight text-[#1C1C1E]">
        {label}
      </span>
      <ChevronRight className="size-[18px] text-[#3C3C43]/35 shrink-0" />
    </button>
  );
}

function MiniBarChart({
  thisWeek,
  lastWeek,
}: {
  thisWeek: number;
  lastWeek: number;
}) {
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
        <span className="text-[12px] font-medium text-[#3C3C43]/60">
          Last wk
        </span>
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
