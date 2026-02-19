import { useMemo } from "react";
import { TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { format } from "date-fns";

export type ActivityType = 
  | "lesson-upcoming" 
  | "lesson-completed" 
  | "lesson-in-progress"
  | "message" 
  | "job-offer" 
  | "payment"
  | "alert"
  | "tomorrow-preview";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  time: string; // HH:mm for sorting
  sortKey: number; // numeric for ordering
  icon: string; // emoji
  accentClass: string; // tailwind bg class for the dot
  /** Whether this is in the future */
  isFuture: boolean;
}

interface UseActivityFeedOptions {
  todayLessons: TodayLesson[] | undefined;
  unreadMessages: number;
  pendingJobs: number;
  expectedEarnings: number;
  tomorrowLessonCount: number;
  tomorrowFirstTime: string | null;
  alerts: { id: string; message: string }[];
}

export function useActivityFeed({
  todayLessons,
  unreadMessages,
  pendingJobs,
  expectedEarnings,
  tomorrowLessonCount,
  tomorrowFirstTime,
  alerts,
}: UseActivityFeedOptions): ActivityItem[] {
  const now = format(new Date(), "HH:mm");
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  return useMemo(() => {
    const items: ActivityItem[] = [];

    // Lessons
    if (todayLessons) {
      todayLessons.forEach((lesson) => {
        const lessonTime = lesson.startTime?.substring(0, 5) || "00:00";
        const [h, m] = lessonTime.split(":").map(Number);
        const lessonMinutes = h * 60 + m;
        const endMinutes = lessonMinutes + (lesson.durationMinutes || 60);

        let type: ActivityType = "lesson-upcoming";
        let icon = "📅";
        let accentClass = "bg-primary";

        if (lesson.status === "completed") {
          type = "lesson-completed";
          icon = "✅";
          accentClass = "bg-emerald-500";
        } else if (nowMinutes >= lessonMinutes && nowMinutes < endMinutes) {
          type = "lesson-in-progress";
          icon = "🚗";
          accentClass = "bg-amber-500";
        } else if (lessonMinutes < nowMinutes) {
          // Past but not marked completed
          type = "lesson-completed";
          icon = "✅";
          accentClass = "bg-emerald-500";
        }

        items.push({
          id: `lesson-${lesson.id}`,
          type,
          title: lesson.pupilName,
          subtitle: type === "lesson-in-progress"
            ? `In progress • ${lesson.durationMinutes}min`
            : type === "lesson-completed"
              ? `Completed • ${lesson.durationMinutes}min`
              : `${lesson.durationMinutes}min lesson${lesson.pickupPostcode ? ` • ${lesson.pickupPostcode}` : ""}`,
          time: lessonTime,
          sortKey: lessonMinutes,
          icon,
          accentClass,
          isFuture: lessonMinutes > nowMinutes,
        });
      });
    }

    // Unread messages
    if (unreadMessages > 0) {
      items.push({
        id: "messages",
        type: "message",
        title: "Unread Messages",
        subtitle: `${unreadMessages} message${unreadMessages !== 1 ? "s" : ""} waiting`,
        time: now,
        sortKey: nowMinutes - 1, // Show just before "now"
        icon: "💬",
        accentClass: "bg-blue-500",
        isFuture: false,
      });
    }

    // Pending job offers
    if (pendingJobs > 0) {
      items.push({
        id: "jobs",
        type: "job-offer",
        title: "Job Offers",
        subtitle: `${pendingJobs} pending offer${pendingJobs !== 1 ? "s" : ""}`,
        time: now,
        sortKey: nowMinutes - 2,
        icon: "📋",
        accentClass: "bg-orange-500",
        isFuture: false,
      });
    }

    // Earnings summary (show in afternoon+)
    if (expectedEarnings > 0 && new Date().getHours() >= 12) {
      items.push({
        id: "earnings",
        type: "payment",
        title: "Today's Earnings",
        subtitle: `£${expectedEarnings} expected`,
        time: "23:59",
        sortKey: 1440, // End of day
        icon: "💷",
        accentClass: "bg-emerald-500",
        isFuture: true,
      });
    }

    // Tomorrow preview
    if (tomorrowLessonCount > 0) {
      items.push({
        id: "tomorrow",
        type: "tomorrow-preview",
        title: "Tomorrow",
        subtitle: `${tomorrowLessonCount} lesson${tomorrowLessonCount !== 1 ? "s" : ""}${tomorrowFirstTime ? ` • starts ${tomorrowFirstTime.substring(0, 5)}` : ""}`,
        time: "23:59",
        sortKey: 1441,
        icon: "🌅",
        accentClass: "bg-violet-500",
        isFuture: true,
      });
    }

    // Sort chronologically
    items.sort((a, b) => a.sortKey - b.sortKey);

    return items;
  }, [todayLessons, unreadMessages, pendingJobs, expectedEarnings, tomorrowLessonCount, tomorrowFirstTime, now, nowMinutes, alerts]);
}
