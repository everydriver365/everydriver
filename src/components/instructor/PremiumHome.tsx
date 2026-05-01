import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Plus,
  Briefcase,
  MessageSquare,
  Clock,
  CalendarPlus,
  PoundSterling,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
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
 * PremiumHome — strict iOS, single column, oversized.
 * Sections (in order, large gaps between):
 *   1. Header
 *   2. Needs attention (single card, 3 stacked rows)
 *   3. Today's schedule (max 3 lessons, hero)
 *   4. Quick actions (exactly 4 stacked pills)
 *   5. ONE final card — Smart suggestion (fallback to nothing if no gap)
 */
export function PremiumHome({ instructorId, instructor, onPaymentClick }: Props) {
  const navigate = useNavigate();
  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const greeting = getTimeOfDayGreeting(new Date(), firstName);

  const { data: todayOverview } = useTodayOverview(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const { messageCount, pendingJobsCount } = useCombinedNotificationCount(instructorId);
  const homeActions = useHomeActions(instructorId);

  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  /* ------------- Header subtitle ------------- */
  const lessonsToday = todayOverview?.lessonCount ?? 0;
  const waitingCount = homeActions.length;
  const sub: string[] = [
    `${lessonsToday} lesson${lessonsToday === 1 ? "" : "s"} today`,
  ];
  if (waitingCount > 0)
    sub.push(`${waitingCount} thing${waitingCount === 1 ? "" : "s"} waiting`);

  /* ------------- Attention rows (max 3) ------------- */
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
      icon: <Briefcase className="size-[24px]" />,
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
      icon: <MessageSquare className="size-[24px]" />,
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
      icon: <Clock className="size-[24px]" />,
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

  /* ------------- Today's schedule (max 3) ------------- */
  const previewLessons = (todayLessons || []).slice(0, 3);

  /* ------------- Smart suggestion ------------- */
  const firstGap = gapSuggestions?.find((d) => d.slots.length > 0)?.slots?.[0];
  const gapMins = firstGap
    ? (() => {
        const [sh, sm] = firstGap.startTime.split(":").map(Number);
        const [eh, em] = firstGap.endTime.split(":").map(Number);
        return eh * 60 + em - (sh * 60 + sm);
      })()
    : 0;

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* 1. Header — oversized, lots of breathing room */}
      <header className="px-7 pt-16 pb-12">
        <h1 className="text-[34px] leading-[1.05] font-bold tracking-tight text-[#1C1C1E]">
          {greeting}
        </h1>
        <p className="mt-3 text-[16px] text-[#3C3C43]/65 font-medium">
          {sub.join(" · ")}
        </p>
      </header>

      {/* 2. Needs attention — one full-width card, max 3 stacked rows */}
      {attention.length > 0 && (
        <section className="px-5 mb-12">
          <FullCard>
            <div className="px-7 pt-6 pb-2">
              <h2 className="text-[22px] font-semibold tracking-tight text-[#1C1C1E]">
                Needs your attention
              </h2>
            </div>
            <div className="pt-3 pb-3">
              {attention.map((row, i) => (
                <div key={row.key}>
                  <button
                    onClick={row.onClick}
                    className="w-full flex items-center gap-5 px-7 py-5 active:bg-black/[0.03] transition-colors text-left"
                    style={{ minHeight: 88 }}
                  >
                    <div
                      className="size-14 rounded-[16px] flex items-center justify-center shrink-0"
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
                    <ChevronRight className="size-[20px] text-[#3C3C43]/35 shrink-0" />
                  </button>
                  {i < attention.length - 1 && (
                    <div className="ml-[100px] border-t border-black/[0.05]" />
                  )}
                </div>
              ))}
            </div>
          </FullCard>
        </section>
      )}

      {/* 3. Today's schedule — DOMINANT hero */}
      <section className="px-5 mb-12">
        <FullCard>
          <div className="flex items-end justify-between px-7 pt-7 pb-5">
            <h2 className="text-[24px] font-semibold tracking-tight text-[#1C1C1E]">
              Today's schedule
            </h2>
            <button
              onClick={() => navigate("/instructor/schedule")}
              className="text-[16px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
            >
              View all
            </button>
          </div>

          {previewLessons.length === 0 ? (
            <div className="px-7 py-16 text-center">
              <p className="text-[17px] text-[#3C3C43]/65">
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
                  ? `${dur >= 60 ? Math.floor(dur / 60) + "h " : ""}${dur % 60 ? (dur % 60) + "m" : ""}`.trim() || "--"
                  : "--";

                return (
                  <div key={lesson.id || i}>
                    <button
                      onClick={() =>
                        navigate(`/instructor/schedule?lessonId=${lesson.id}`)
                      }
                      className="w-full flex items-center gap-5 px-7 py-6 active:bg-black/[0.03] transition-colors text-left"
                      style={{ minHeight: 112 }}
                    >
                      <div className="w-[72px] shrink-0">
                        <div className="text-[24px] font-bold tracking-tight text-[#1C1C1E] tabular-nums leading-none">
                          {lesson.startTime?.slice(0, 5) || "--:--"}
                        </div>
                        <div className="text-[14px] text-[#3C3C43]/60 mt-1.5 tabular-nums">
                          {durLabel}
                        </div>
                      </div>
                      <div className="size-14 rounded-full bg-[#E5E5EA] text-[#3C3C43] flex items-center justify-center text-[16px] font-semibold shrink-0 overflow-hidden">
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
                        <div className="text-[19px] font-semibold text-[#1C1C1E] tracking-tight truncate">
                          {lesson.pupilName || "Pupil"}
                        </div>
                        <div className="text-[14px] text-[#3C3C43]/65 mt-1.5 truncate">
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
                      <div className="ml-[124px] border-t border-black/[0.05]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-black/[0.05]">
            <button
              onClick={() => navigate("/instructor/schedule?action=add")}
              className="w-full flex items-center justify-center gap-2 py-6 text-[17px] font-semibold text-[#007AFF] active:bg-black/[0.03] transition-colors"
            >
              <Plus className="size-[20px]" />
              Add lesson
            </button>
          </div>
        </FullCard>
      </section>

      {/* 4. Quick actions — exactly 4 large stacked pills, no grid */}
      <section className="px-5 mb-12">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#1C1C1E] mb-5 px-2">
          Quick actions
        </h2>
        <div className="space-y-3">
          <ActionPill
            icon={<CalendarPlus className="size-[22px]" />}
            label="Add lesson"
            tone="blue"
            onClick={() => navigate("/instructor/schedule?action=add")}
          />
          <ActionPill
            icon={<PoundSterling className="size-[22px]" />}
            label="Take payment"
            tone="green"
            onClick={onPaymentClick}
          />
          <ActionPill
            icon={<MessageCircle className="size-[22px]" />}
            label="Message"
            tone="indigo"
            onClick={() => navigate("/instructor/messages")}
          />
          <ActionPill
            icon={<Clock className="size-[22px]" />}
            label="Fill gap"
            tone="amber"
            onClick={() => navigate("/instructor/schedule?view=gaps")}
          />
        </div>
      </section>

      {/* 5. ONE final card — Smart suggestion (only when present) */}
      {firstGap && !suggestionDismissed && gapMins > 0 && (
        <section className="px-5">
          <div className="rounded-[24px] p-7 relative overflow-hidden bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_-12px_rgba(16,24,40,0.08)]">
            <button
              onClick={() => setSuggestionDismissed(true)}
              className="absolute top-5 right-5 size-9 rounded-full bg-black/[0.04] flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Dismiss"
            >
              <X className="size-[16px] text-[#3C3C43]/55" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-8 rounded-full bg-[#34C759]/12 flex items-center justify-center">
                <Sparkles className="size-[16px] text-[#1F8E3F]" />
              </div>
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1F8E3F]">
                Smart suggestion
              </span>
            </div>
            <h3 className="text-[24px] font-semibold tracking-tight text-[#1C1C1E] leading-tight pr-10">
              You have a {gapMins} min gap at {firstGap.startTime.slice(0, 5)}
            </h3>
            <p className="text-[16px] text-[#3C3C43]/70 mt-3 leading-relaxed">
              Fill it with a new lesson and boost your earnings.
            </p>
            <button
              onClick={() => navigate("/instructor/schedule?view=gaps")}
              className="mt-6 w-full py-5 rounded-[16px] bg-[#1C1C1E] text-white text-[17px] font-semibold active:opacity-85 transition-opacity"
            >
              Fill slot
            </button>
          </div>
        </section>
      )}
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
      className={`bg-white rounded-[24px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_32px_-14px_rgba(16,24,40,0.08)] overflow-hidden ${className}`}
    >
      {children}
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
      className="w-full flex items-center gap-5 px-6 rounded-[20px] bg-white active:scale-[0.99] transition-transform shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-12px_rgba(16,24,40,0.08)]"
      style={{ minHeight: 84 }}
    >
      <span
        className="size-12 rounded-[14px] flex items-center justify-center shrink-0"
        style={{ background: t.iconBg, color: t.iconFg }}
      >
        {icon}
      </span>
      <span className="flex-1 text-left text-[18px] font-semibold tracking-tight text-[#1C1C1E]">
        {label}
      </span>
      <ChevronRight className="size-[20px] text-[#3C3C43]/35 shrink-0" />
    </button>
  );
}
