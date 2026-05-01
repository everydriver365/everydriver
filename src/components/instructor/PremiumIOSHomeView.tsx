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
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useLastWeekComparison } from "@/hooks/useLastWeekComparison";
import { useHomeActions } from "@/components/instructor/WarmHomeTiles";
import { getTimeOfDayGreeting } from "@/lib/composeStatusSubtitle";
import { ImpactAlertCard } from "@/components/instructor/ImpactAlertCard";

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
/* Visual primitives — local, iOS-flavoured, light-mode only                  */
/* -------------------------------------------------------------------------- */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-[22px] border border-black/[0.04] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.08)] overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <h2 className="text-[18px] font-semibold tracking-tight text-[#1C1C1E]">{title}</h2>
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

function Row({
  iconBg,
  icon,
  title,
  subtitle,
  pill,
  onClick,
  divider = true,
}: {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  pill?: { label: string; tone: "red" | "amber" | "green" | "blue" | "neutral" };
  onClick?: () => void;
  divider?: boolean;
}) {
  const pillTones: Record<string, string> = {
    red: "bg-[#FF3B30]/10 text-[#FF3B30]",
    amber: "bg-[#FF9500]/10 text-[#C46E00]",
    green: "bg-[#34C759]/10 text-[#1F8E3F]",
    blue: "bg-[#007AFF]/10 text-[#007AFF]",
    neutral: "bg-black/[0.06] text-[#3C3C43]/80",
  };
  return (
    <>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3.5 px-5 py-3.5 active:bg-black/[0.03] transition-colors text-left"
        style={{ minHeight: 72 }}
      >
        <div
          className="size-11 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-semibold text-[#1C1C1E] tracking-tight truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-[13px] text-[#3C3C43]/70 mt-0.5 truncate">{subtitle}</div>
          )}
        </div>
        {pill && (
          <span
            className={`text-[12px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${pillTones[pill.tone]}`}
          >
            {pill.label}
          </span>
        )}
        <ChevronRight className="size-4 text-[#3C3C43]/40 shrink-0" />
      </button>
      {divider && <div className="ml-[72px] border-t border-black/[0.06]" />}
    </>
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
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const { data: comparison } = useLastWeekComparison(instructorId);
  const {
    messageCount,
    pendingJobsCount,
  } = useCombinedNotificationCount(instructorId);
  const homeActions = useHomeActions(instructorId);

  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  /* ---------------- Subtitle counts (real data only) ---------------------- */
  const lessonsToday = todayOverview?.lessonCount ?? 0;
  const waitingCount = homeActions.length;
  const subParts: string[] = [];
  subParts.push(`${lessonsToday} lesson${lessonsToday === 1 ? "" : "s"} today`);
  if (waitingCount > 0)
    subParts.push(`${waitingCount} thing${waitingCount === 1 ? "" : "s"} waiting`);

  /* ---------------- Needs your attention rows ----------------------------- */
  const totalGapSlots =
    gapSuggestions?.reduce((sum, day) => sum + day.slots.length, 0) ?? 0;

  const attentionRows: Array<{
    key: string;
    iconBg: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    pill: { label: string; tone: "red" | "amber" | "green" | "blue" | "neutral" };
    onClick: () => void;
  }> = [];

  if (pendingJobsCount > 0) {
    attentionRows.push({
      key: "jobs",
      iconBg: "linear-gradient(135deg,#FFE5E1,#FFD0CB)",
      icon: <Briefcase className="size-5 text-[#FF3B30]" />,
      title: `${pendingJobsCount} new job offer${pendingJobsCount === 1 ? "" : "s"}`,
      subtitle: "Tap to review and respond",
      pill: { label: String(pendingJobsCount), tone: "red" },
      onClick: () => navigate("/instructor/jobs"),
    });
  }
  if (messageCount > 0) {
    attentionRows.push({
      key: "messages",
      iconBg: "linear-gradient(135deg,#FFF1D6,#FFE2A8)",
      icon: <MessageSquare className="size-5 text-[#C46E00]" />,
      title: `${messageCount} urgent message${messageCount === 1 ? "" : "s"}`,
      subtitle: "Replies waiting from pupils",
      pill: { label: String(messageCount), tone: "amber" },
      onClick: () => navigate("/instructor/messages"),
    });
  }
  if (totalGapSlots > 0) {
    attentionRows.push({
      key: "gaps",
      iconBg: "linear-gradient(135deg,#DCF7E4,#B6ECC4)",
      icon: <Clock className="size-5 text-[#1F8E3F]" />,
      title: `${totalGapSlots} open slot${totalGapSlots === 1 ? "" : "s"} to fill`,
      subtitle: "Suggested pupils available",
      pill: { label: String(totalGapSlots), tone: "green" },
      onClick: () => navigate("/instructor/schedule?view=gaps"),
    });
  }

  /* ---------------- Today's schedule preview ------------------------------ */
  const previewLessons = (todayLessons || []).slice(0, 4);

  /* ---------------- Smart suggestion (first available gap) ---------------- */
  const firstGap = gapSuggestions?.find((d) => d.slots.length > 0)?.slots?.[0];
  const gapMins = firstGap
    ? (() => {
        const [sh, sm] = firstGap.startTime.split(":").map(Number);
        const [eh, em] = firstGap.endTime.split(":").map(Number);
        return eh * 60 + em - (sh * 60 + sm);
      })()
    : 0;

  /* ---------------- Render ------------------------------------------------ */
  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-12">
      {/* 1. Header */}
      <header className="px-6 pt-12 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[32px] leading-[1.1] font-bold tracking-tight text-[#1C1C1E] text-balance">
              {greeting}
            </h1>
            <p className="mt-1.5 text-[15px] text-[#3C3C43]/70 font-medium">
              {subParts.join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/instructor/notifications")}
              className="size-10 rounded-full bg-white border border-black/5 flex items-center justify-center active:scale-95 transition-transform shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              aria-label="Notifications"
            >
              <Bell className="size-[18px] text-[#1C1C1E]" />
            </button>
            <button
              onClick={() => navigate("/instructor/schedule?action=add")}
              className="size-10 rounded-full bg-white border border-black/5 flex items-center justify-center active:scale-95 transition-transform shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              aria-label="Add"
            >
              <Plus className="size-[20px] text-[#007AFF]" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Needs your attention */}
      {attentionRows.length > 0 && (
        <section className="px-5 mb-6">
          <Card>
            <div className="px-5 pt-4 pb-1">
              <h2 className="text-[18px] font-semibold tracking-tight text-[#1C1C1E]">
                Needs your attention
              </h2>
            </div>
            <div className="pt-1 pb-1">
              {attentionRows.map((row, i) => (
                <Row
                  key={row.key}
                  iconBg={row.iconBg}
                  icon={row.icon}
                  title={row.title}
                  subtitle={row.subtitle}
                  pill={row.pill}
                  onClick={row.onClick}
                  divider={i < attentionRows.length - 1}
                />
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* 3. Today's schedule */}
      <section className="px-5 mb-6">
        <Card>
          <CardHeader
            title="Today's schedule"
            action={{
              label: "View full",
              onClick: () => navigate("/instructor/schedule"),
            }}
          />
          {previewLessons.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[15px] text-[#3C3C43]/70">No lessons scheduled today.</p>
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
                    : "Booked";
                return (
                  <div key={lesson.id || i}>
                    <button
                      onClick={() =>
                        navigate(`/instructor/schedule?lessonId=${lesson.id}`)
                      }
                      className="w-full flex items-center gap-4 px-5 py-3.5 active:bg-black/[0.03] transition-colors text-left"
                      style={{ minHeight: 72 }}
                    >
                      <div className="w-14 shrink-0">
                        <div className="text-[18px] font-semibold tracking-tight text-[#1C1C1E] tabular-nums">
                          {lesson.startTime?.slice(0, 5) || "--:--"}
                        </div>
                        <div className="text-[12px] text-[#3C3C43]/60 mt-0.5 tabular-nums">
                          {lesson.durationMinutes
                            ? `${lesson.durationMinutes >= 60 ? Math.floor(lesson.durationMinutes / 60) + "h " : ""}${lesson.durationMinutes % 60 ? (lesson.durationMinutes % 60) + "m" : ""}`.trim() || "--"
                            : "--"}
                        </div>
                      </div>
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
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-semibold text-[#1C1C1E] tracking-tight truncate">
                          {lesson.pupilName || "Pupil"}
                        </div>
                        <div className="text-[13px] text-[#3C3C43]/70 mt-0.5 truncate">
                          {[
                            (lesson as any).lessonType || "Lesson",
                            (lesson as any).pickupLocation ||
                              (lesson as any).pickupPostcode,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <span
                        className={`text-[12px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                          statusTone === "green"
                            ? "bg-[#34C759]/10 text-[#1F8E3F]"
                            : statusTone === "blue"
                            ? "bg-[#007AFF]/10 text-[#007AFF]"
                            : "bg-black/[0.06] text-[#3C3C43]/80"
                        }`}
                      >
                        {statusLabel}
                      </span>
                      <ChevronRight className="size-4 text-[#3C3C43]/40 shrink-0" />
                    </button>
                    {i < previewLessons.length - 1 && (
                      <div className="ml-[88px] border-t border-black/[0.06]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="border-t border-black/[0.06]">
            <button
              onClick={() => navigate("/instructor/schedule?action=add")}
              className="w-full flex items-center justify-center gap-2 py-4 text-[16px] font-semibold text-[#007AFF] active:bg-black/[0.03] transition-colors"
            >
              <Plus className="size-[18px]" />
              Add lesson
            </button>
          </div>
        </Card>
      </section>

      {/* 4. Quick actions */}
      <section className="px-5 mb-6">
        <Card>
          <CardHeader title="Quick actions" />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-1">
            <QuickActionPill
              icon={<CalendarPlus className="size-[18px]" />}
              label="Add lesson"
              tone="blue"
              onClick={() => navigate("/instructor/schedule?action=add")}
            />
            <QuickActionPill
              icon={<PoundSterling className="size-[18px]" />}
              label="Take payment"
              tone="green"
              onClick={onPaymentClick}
            />
            <QuickActionPill
              icon={<MessageCircle className="size-[18px]" />}
              label="Message"
              tone="indigo"
              onClick={() => navigate("/instructor/messages")}
            />
            <QuickActionPill
              icon={<Clock className="size-[18px]" />}
              label="Fill gap"
              tone="amber"
              onClick={() => navigate("/instructor/schedule?view=gaps")}
            />
          </div>
        </Card>
      </section>

      {/* 5. Smart suggestion */}
      {firstGap && !suggestionDismissed && gapMins > 0 && (
        <section className="px-5 mb-6">
          <div className="rounded-[22px] p-5 relative overflow-hidden border border-[#34C759]/20 bg-gradient-to-br from-[#E8F8EC] to-[#F4FBF6]">
            <button
              onClick={() => setSuggestionDismissed(true)}
              className="absolute top-3 right-3 size-7 rounded-full bg-white/70 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Dismiss"
            >
              <X className="size-[14px] text-[#3C3C43]/60" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-[16px] text-[#1F8E3F]" />
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#1F8E3F]">
                Smart suggestion
              </span>
            </div>
            <h3 className="text-[19px] font-semibold tracking-tight text-[#1C1C1E] leading-snug">
              You have a {gapMins} min gap at {firstGap.startTime.slice(0, 5)}
            </h3>
            <p className="text-[14px] text-[#3C3C43]/75 mt-1.5 leading-relaxed">
              Fill it with a new lesson and boost your earnings.
            </p>
            <button
              onClick={() => navigate("/instructor/schedule?view=gaps")}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#34C759] text-white text-[15px] font-semibold active:opacity-80 transition-opacity shadow-[0_4px_12px_rgba(52,199,89,0.3)]"
            >
              Fill slot
            </button>
          </div>
        </section>
      )}

      {/* 6. Earnings this week */}
      <section className="px-5 mb-6">
        <Card>
          <CardHeader
            title="Earnings this week"
            action={{
              label: "Details",
              onClick: () => navigate("/instructor/finance"),
            }}
          />
          <div className="px-5 pb-5 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] font-bold tracking-tight text-[#1C1C1E] tabular-nums">
                £{(comparison?.earningsThisWeek ?? 0).toLocaleString()}
              </span>
              {typeof comparison?.percentChange === "number" &&
                comparison.percentChange !== 0 && (
                  <span
                    className={`inline-flex items-center gap-1 text-[13px] font-semibold ${
                      comparison.isImprovement ? "text-[#1F8E3F]" : "text-[#C46E00]"
                    }`}
                  >
                    {comparison.isImprovement ? (
                      <TrendingUp className="size-[14px]" />
                    ) : (
                      <TrendingDown className="size-[14px]" />
                    )}
                    {Math.abs(comparison.percentChange)}%
                  </span>
                )}
            </div>
            <p className="text-[13px] text-[#3C3C43]/70 mt-1">
              {comparison?.lessonsThisWeek ?? 0} lessons ·{" "}
              {comparison?.hoursThisWeek ?? 0} h taught
            </p>

            {/* Minimal weekly bar chart from real data */}
            <WeekMiniChart
              thisWeek={comparison?.earningsThisWeek ?? 0}
              lastWeek={comparison?.earningsLastWeek ?? 0}
            />
          </div>
        </Card>
      </section>

      {/* 7. Bottom optional card — Impact / continue */}
      <section className="px-5">
        <ImpactAlertCard instructorId={instructorId || ""} />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
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
  const tones: Record<string, { bg: string; fg: string }> = {
    blue: { bg: "#E8F1FF", fg: "#007AFF" },
    green: { bg: "#E6F8EC", fg: "#1F8E3F" },
    amber: { bg: "#FFF3DC", fg: "#C46E00" },
    indigo: { bg: "#ECEAFE", fg: "#5856D6" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 rounded-[14px] active:scale-[0.98] transition-transform"
      style={{ background: t.bg, color: t.fg, minHeight: 56 }}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[15px] font-semibold tracking-tight">{label}</span>
    </button>
  );
}

function WeekMiniChart({ thisWeek, lastWeek }: { thisWeek: number; lastWeek: number }) {
  const max = Math.max(thisWeek, lastWeek, 1);
  const tw = Math.max(8, Math.round((thisWeek / max) * 100));
  const lw = Math.max(8, Math.round((lastWeek / max) * 100));
  return (
    <div className="mt-5 flex items-end gap-3 h-20">
      <div className="flex-1 flex flex-col items-center gap-1.5">
        <div
          className="w-full rounded-[8px] bg-[#E5E5EA]"
          style={{ height: `${lw}%` }}
        />
        <span className="text-[11px] font-medium text-[#3C3C43]/60">Last wk</span>
      </div>
      <div className="flex-1 flex flex-col items-center gap-1.5">
        <div
          className="w-full rounded-[8px] bg-[#007AFF]"
          style={{ height: `${tw}%` }}
        />
        <span className="text-[11px] font-medium text-[#1C1C1E]">This wk</span>
      </div>
    </div>
  );
}
