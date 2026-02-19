import { useState, useEffect, useMemo } from "react";

export type TimePhase = "morning" | "midday" | "afternoon" | "evening" | "night";

interface TimeOfDayConfig {
  phase: TimePhase;
  greeting: string;
  heroLabel: string;
  heroEmoji: string;
  headerGradient: string;
  accentColor: string;
  /** Which section to emphasize at top */
  primaryFocus: "schedule" | "active-lesson" | "earnings" | "tomorrow";
  /** Contextual subtitle shown under greeting */
  contextLine: string;
}

function getPhase(hour: number): TimePhase {
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 14) return "midday";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function buildConfig(
  phase: TimePhase,
  firstName: string,
  lessonCount: number,
  earnings: number,
  hasActiveLesson: boolean
): TimeOfDayConfig {
  switch (phase) {
    case "morning":
      return {
        phase,
        greeting: `Good morning, ${firstName}!`,
        heroLabel: "Today's Schedule",
        heroEmoji: "☀️",
        headerGradient: "from-amber-600 via-amber-500 to-orange-400",
        accentColor: "text-amber-500",
        primaryFocus: "schedule",
        contextLine: lessonCount > 0
          ? `${lessonCount} lesson${lessonCount !== 1 ? "s" : ""} lined up today`
          : "No lessons scheduled — enjoy the free time",
      };
    case "midday":
      return {
        phase,
        greeting: `Keep going, ${firstName}!`,
        heroLabel: hasActiveLesson ? "In Progress" : "Midday Check-in",
        heroEmoji: "🚗",
        headerGradient: "from-primary via-primary/90 to-primary/80",
        accentColor: "text-primary",
        primaryFocus: hasActiveLesson ? "active-lesson" : "schedule",
        contextLine: hasActiveLesson
          ? "Lesson in progress — stay focused"
          : `${lessonCount} lesson${lessonCount !== 1 ? "s" : ""} today`,
      };
    case "afternoon":
      return {
        phase,
        greeting: `Good afternoon, ${firstName}!`,
        heroLabel: "Afternoon Push",
        heroEmoji: "⚡",
        headerGradient: "from-blue-600 via-blue-500 to-sky-400",
        accentColor: "text-blue-500",
        primaryFocus: hasActiveLesson ? "active-lesson" : "schedule",
        contextLine: hasActiveLesson
          ? "Lesson in progress"
          : earnings > 0
            ? `£${earnings} earned so far today`
            : "Afternoon lessons ahead",
      };
    case "evening":
      return {
        phase,
        greeting: `Good evening, ${firstName}!`,
        heroLabel: "Today's Wrap-up",
        heroEmoji: "🌅",
        headerGradient: "from-violet-600 via-purple-500 to-indigo-500",
        accentColor: "text-violet-500",
        primaryFocus: "earnings",
        contextLine: earnings > 0
          ? `£${earnings} earned today — great work!`
          : "Another day done",
      };
    case "night":
      return {
        phase,
        greeting: `Evening, ${firstName}`,
        heroLabel: "Plan Tomorrow",
        heroEmoji: "🌙",
        headerGradient: "from-slate-700 via-slate-600 to-slate-500",
        accentColor: "text-slate-400",
        primaryFocus: "tomorrow",
        contextLine: "Rest up — tomorrow's schedule is ready",
      };
  }
}

export function useTimeOfDay(
  firstName: string,
  lessonCount: number,
  earnings: number,
  hasActiveLesson: boolean
): TimeOfDayConfig {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    // Re-check every 5 minutes so transitions happen naturally
    const interval = setInterval(() => {
      setHour(new Date().getHours());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(
    () => buildConfig(getPhase(hour), firstName, lessonCount, earnings, hasActiveLesson),
    [hour, firstName, lessonCount, earnings, hasActiveLesson]
  );
}
