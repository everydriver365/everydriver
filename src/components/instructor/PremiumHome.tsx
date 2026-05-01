import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ChevronRight,
  Plus,
  Bell,
  Calendar,
  Briefcase,
  MessageSquare,
  CalendarCheck,
  CalendarPlus,
  PoundSterling,
  MessageCircle,
  Clock,
  MoreHorizontal,
  X,
  MapPin,
} from "lucide-react";
import { useState } from "react";

import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useHomeActions } from "@/components/instructor/WarmHomeTiles";
import { getTimeOfDayGreeting } from "@/lib/composeStatusSubtitle";
import dsmLogo from "@/assets/dsm-logo.png";

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
 * PremiumHome — iOS-styled instructor mobile home, modelled on the
 * approved reference design (single column, branded header, attention
 * card with coloured pills, avatar schedule rows with coloured time
 * rails, horizontally-scrollable quick action chips and a soft grey
 * smart suggestion banner).
 */
export function PremiumHome({ instructorId, instructor, onPaymentClick }: Props) {
  const navigate = useNavigate();
  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const greeting = getTimeOfDayGreeting(new Date(), firstName);
  const today = new Date();

  const { data: todayOverview } = useTodayOverview(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const { messageCount, pendingJobsCount } = useCombinedNotificationCount(instructorId);
  const homeActions = useHomeActions(instructorId);

  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  /* ---------------- Subtitle counts ---------------- */
  const lessonsToday = todayOverview?.lessonCount ?? 0;
  const waitingCount = homeActions.length;

  /* ---------------- Notifications badge ---------------- */
  const notifBadge = messageCount + pendingJobsCount;
  const notifLabel = notifBadge > 9 ? "9+" : String(notifBadge);

  /* ---------------- Attention rows ---------------- */
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
      iconBg: "#FFEDEA",
      iconFg: "#FF3B30",
      icon: <Briefcase className="size-[20px]" />,
      title: `${pendingJobsCount} new job offer${pendingJobsCount === 1 ? "" : "s"}`,
      subtitle: "Respond now · +1 more",
      tone: "red",
      pill: "NEW",
      onClick: () => navigate("/instructor/jobs"),
    });
  if (messageCount > 0)
    attention.push({
      key: "messages",
      iconBg: "#FFF1E0",
      iconFg: "#C46E00",
      icon: <MessageSquare className="size-[20px]" />,
      title: `${messageCount} urgent message${messageCount === 1 ? "" : "s"}`,
      subtitle: "Reply to your pupils",
      tone: "amber",
      pill: String(messageCount),
      onClick: () => navigate("/instructor/messages"),
    });
  if (totalGapSlots > 0)
    attention.push({
      key: "gaps",
      iconBg: "#E2F5E8",
      iconFg: "#1F8E3F",
      icon: <CalendarCheck className="size-[20px]" />,
      title: `${totalGapSlots} open slot${totalGapSlots === 1 ? "" : "s"} to fill`,
      subtitle: "Boost your earnings",
      tone: "green",
      pill: String(totalGapSlots),
      onClick: () => navigate("/instructor/schedule?view=gaps"),
    });

  const pillCls: Record<Tone, string> = {
    red: "bg-[#FFE3DE] text-[#FF3B30]",
    amber: "bg-[#FFE9C9] text-[#C46E00]",
    green: "bg-[#D6F3DD] text-[#1F8E3F]",
  };

  /* ---------------- Today's schedule (max 2 in preview) ---------------- */
  const previewLessons = (todayLessons || []).slice(0, 2);
  // Color rail per row, cycled in reference order
  const rails = ["#007AFF", "#34C759", "#007AFF", "#34C759"];

  /* ---------------- Smart suggestion ---------------- */
  const firstGap = gapSuggestions?.find((d) => d.slots.length > 0)?.slots?.[0];
  const gapMins = firstGap
    ? (() => {
        const [sh, sm] = firstGap.startTime.split(":").map(Number);
        const [eh, em] = firstGap.endTime.split(":").map(Number);
        return eh * 60 + em - (sh * 60 + sm);
      })()
    : 0;

  return (
    <div className="pb-10" style={{ background: "#F7F6F3" }}>
      {/* Top bar (logo + bell + avatar) is provided by InstructorPortalLayout's
          MobileBlueHeader. Do not render a second header here. */}

      {/* ---------------- Greeting + date pill ---------------- */}
      <div className="px-6 pt-4 pb-5">
        <h1 className="text-[36px] leading-[1.05] font-bold tracking-tight text-[#1C1C1E]">
          {greeting} <span className="inline-block">👋</span>
        </h1>
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <p className="text-[15px] text-[#3C3C43]/70 min-w-0 truncate">
            <span>
              {lessonsToday} lesson{lessonsToday === 1 ? "" : "s"} today
            </span>
            {waitingCount > 0 && (
              <>
                <span className="mx-1.5 text-[#3C3C43]/40">·</span>
                <span className="text-[#FF3B30] font-medium">
                  {waitingCount} thing{waitingCount === 1 ? "" : "s"} waiting
                </span>
              </>
            )}
          </p>
          <button
            onClick={() => navigate("/instructor/schedule")}
            className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-black/[0.08] bg-white text-[13px] font-medium text-[#1C1C1E] active:bg-black/[0.03] transition-colors shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <Calendar className="size-[13px] text-[#3C3C43]/70" />
            {format(today, "EEE, d MMM")}
          </button>
        </div>
      </div>

      {/* ---------------- Needs your attention ---------------- */}
      {attention.length > 0 && (
        <section className="px-6 mb-7">
          <h2 className="text-[17px] font-semibold tracking-tight text-[#1C1C1E] mb-3">
            Needs your attention
          </h2>
          <div className="rounded-[24px] border border-black/[0.05] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {attention.map((row, i) => (
              <div key={row.key}>
                <button
                  onClick={row.onClick}
                  className="w-full flex items-center gap-4 px-5 py-4 active:bg-black/[0.03] transition-colors text-left"
                  style={{ minHeight: 92 }}
                >
                  <div
                    className="size-12 rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ background: row.iconBg, color: row.iconFg }}
                  >
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-semibold text-[#1C1C1E] tracking-tight truncate">
                      {row.title}
                    </div>
                    <div className="text-[13px] text-[#3C3C43]/65 mt-0.5 truncate">
                      {row.subtitle}
                    </div>
                  </div>
                  <span
                    className={`text-[12px] font-bold px-3 py-1 rounded-full shrink-0 ${pillCls[row.tone]}`}
                  >
                    {row.pill}
                  </span>
                  <ChevronRight className="size-[18px] text-[#3C3C43]/35 shrink-0" />
                </button>
                {i < attention.length - 1 && (
                  <div className="ml-[80px] border-t border-black/[0.05]" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Today's schedule ---------------- */}
      <section className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-[17px] font-semibold tracking-tight text-[#1C1C1E]">
            Today's schedule
          </h2>
          <button
            onClick={() => navigate("/instructor/schedule")}
            className="text-[13px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
          >
            View full schedule ›
          </button>
        </div>

        <div className="rounded-[20px] border border-black/[0.06] bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {previewLessons.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[15px] text-[#3C3C43]/65">
                No lessons scheduled today
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
                const tone =
                  lesson.status === "completed"
                    ? "bg-[#D6F3DD] text-[#1F8E3F]"
                    : lesson.status === "in_progress"
                    ? "bg-[#D7E9FF] text-[#007AFF]"
                    : i % 2 === 0
                    ? "bg-[#D7E9FF] text-[#007AFF]"
                    : "bg-[#D6F3DD] text-[#1F8E3F]";
                const label =
                  lesson.status === "completed"
                    ? "Done"
                    : lesson.status === "in_progress"
                    ? "Live"
                    : i % 2 === 0
                    ? "Upcoming"
                    : "Confirmed";
                const dur = lesson.durationMinutes;
                const durLabel = dur
                  ? `${dur >= 60 ? Math.floor(dur / 60) + "h" : ""}${dur % 60 ? " " + (dur % 60) + "m" : dur >= 60 ? "" : ""}`.trim() || "--"
                  : "--";

                return (
                  <div key={lesson.id || i}>
                    <button
                      onClick={() =>
                        navigate(`/instructor/schedule?lessonId=${lesson.id}`)
                      }
                      className="w-full flex items-stretch gap-4 pr-4 py-4 active:bg-black/[0.03] transition-colors text-left"
                      style={{ minHeight: 96 }}
                    >
                      {/* Coloured rail */}
                      <div
                        className="w-[3.5px] rounded-r-full ml-0 my-1.5"
                        style={{ background: rails[i % rails.length] }}
                      />
                      {/* Time + duration */}
                      <div className="w-[68px] shrink-0 self-center pl-1">
                        <div className="text-[21px] font-bold tracking-tight text-[#1C1C1E] tabular-nums leading-none">
                          {lesson.startTime?.slice(0, 5) || "--:--"}
                        </div>
                        <div className="text-[12.5px] text-[#3C3C43]/55 mt-1.5 tabular-nums">
                          {durLabel}
                        </div>
                      </div>
                      {/* Avatar */}
                      <div className="size-12 rounded-full bg-[#E5E5EA] text-[#3C3C43] flex items-center justify-center text-[14px] font-semibold shrink-0 overflow-hidden self-center">
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
                      <div className="flex-1 min-w-0 self-center">
                        <div className="text-[18px] font-semibold text-[#1C1C1E] tracking-tight truncate leading-tight">
                          {lesson.pupilName || "Pupil"}
                        </div>
                        <div className="text-[14px] text-[#3C3C43]/65 mt-1 truncate flex items-center gap-1">
                          <MapPin className="size-[12px] text-[#3C3C43]/45 shrink-0" />
                          <span className="truncate">
                            {[
                              lesson.lessonType || "Standard lesson",
                              lesson.pickupLocation || lesson.pickupPostcode,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[12px] font-semibold px-3 py-1.5 rounded-full shrink-0 self-center ${tone}`}
                      >
                        {label}
                      </span>
                      <ChevronRight className="size-[16px] text-[#3C3C43]/35 shrink-0 self-center" />
                    </button>
                    {i < previewLessons.length - 1 && (
                      <div className="ml-[96px] border-t border-black/[0.05]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-4 pb-4 pt-3">
            <button
              onClick={() => navigate("/instructor/schedule?action=add")}
              className="w-full flex items-center justify-center gap-2 h-[52px] rounded-[14px] bg-[#F2F4F7] text-[15px] font-semibold text-[#007AFF] active:bg-[#E9ECF1] transition-colors"
            >
              <Plus className="size-[18px]" />
              Add lesson
            </button>
          </div>
        </div>
      </section>

      {/* ---------------- Quick actions (horizontal chips) ---------------- */}
      <section className="px-5 mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[15px] font-semibold tracking-tight text-[#1C1C1E]">
            Quick actions
          </h2>
          <button
            onClick={() => navigate("/instructor/account?tab=quick-actions")}
            className="text-[13px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
          >
            Edit
          </button>
        </div>
        <div className="-mx-5 px-5 overflow-x-auto scrollbar-none">
          <div className="flex gap-2.5 pb-1">
            <ActionChip
              icon={<CalendarPlus className="size-[18px]" />}
              label="Add lesson"
              tone="blue"
              onClick={() => navigate("/instructor/schedule?action=add")}
            />
            <ActionChip
              icon={<PoundSterling className="size-[18px]" />}
              label="Take payment"
              tone="green"
              onClick={onPaymentClick}
            />
            <ActionChip
              icon={<MessageCircle className="size-[18px]" />}
              label="Message"
              tone="indigo"
              onClick={() => navigate("/instructor/messages")}
            />
            <ActionChip
              icon={<Clock className="size-[18px]" />}
              label="Fill gap"
              tone="amber"
              onClick={() => navigate("/instructor/schedule?view=gaps")}
            />
            <ActionChip
              icon={<MoreHorizontal className="size-[18px]" />}
              label="More"
              tone="grey"
              onClick={() => navigate("/instructor/account?tab=quick-actions")}
            />
          </div>
        </div>
      </section>

      {/* ---------------- Smart suggestion (soft grey card) ---------------- */}
      {firstGap && !suggestionDismissed && gapMins > 0 && (
        <section className="px-5">
          <div className="rounded-[18px] bg-[#F5F6F8] p-4 flex items-start gap-3.5 relative">
            <div className="size-10 rounded-[12px] bg-white flex items-center justify-center shrink-0 mt-0.5 border border-black/[0.04]">
              <CalendarCheck className="size-[18px] text-[#1F8E3F]" />
            </div>
            <div className="flex-1 min-w-0 pr-7">
              <div className="text-[15px] font-semibold text-[#1C1C1E] tracking-tight">
                You have a {gapMins} min gap at {firstGap.startTime.slice(0, 5)}
              </div>
              <p className="text-[12.5px] text-[#3C3C43]/70 mt-1 leading-snug">
                Fill it with a new lesson and boost your earnings.
              </p>
            </div>
            <button
              onClick={() => navigate("/instructor/schedule?view=gaps")}
              className="shrink-0 self-center px-4 h-10 rounded-[12px] bg-[#34C759] text-white text-[13px] font-semibold active:opacity-85 transition-opacity"
            >
              Add lesson
            </button>
            <button
              onClick={() => setSuggestionDismissed(true)}
              className="absolute top-2.5 right-2.5 size-6 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Dismiss"
            >
              <X className="size-[14px] text-[#3C3C43]/45" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ActionChip                                                                 */
/* -------------------------------------------------------------------------- */

function ActionChip({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "blue" | "green" | "amber" | "indigo" | "grey";
  onClick: () => void;
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    blue: { bg: "#E8F1FF", fg: "#007AFF" },
    green: { bg: "#E2F5E8", fg: "#1F8E3F" },
    amber: { bg: "#FFEFD6", fg: "#C46E00" },
    indigo: { bg: "#ECEAFE", fg: "#5856D6" },
    grey: { bg: "#EFEFF1", fg: "#3C3C43" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex flex-col items-start justify-between rounded-[16px] px-3.5 py-3 active:scale-[0.97] transition-transform"
      style={{ background: t.bg, color: t.fg, width: 96, minHeight: 76 }}
    >
      <span className="size-7 rounded-full bg-white/70 flex items-center justify-center">
        {icon}
      </span>
      <span className="text-[12.5px] font-semibold tracking-tight leading-tight text-left mt-2">
        {label}
      </span>
    </button>
  );
}
