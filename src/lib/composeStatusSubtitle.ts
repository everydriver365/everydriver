import { format, isToday, isTomorrow } from "date-fns";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "late";

function titleCase(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function getTimeOfDayGreeting(date: Date, firstName: string): string {
  const safeName = titleCase(firstName || "");
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return `Morning, ${safeName}`;
  if (hour >= 12 && hour < 17) return `Afternoon, ${safeName}`;
  if (hour >= 17 && hour < 22) return `Evening, ${safeName}`;
  return `Working late, ${safeName}`;
}

export interface LessonStateInput {
  upcomingTodayCount: number; // remaining (not completed) lessons today
  liveLessonEndsInMinutes: number | null; // > 0 if a live lesson is in progress
  hasLessonsToday: boolean; // any lessons scheduled today (including completed)
  lastEndTimeToday?: string | null; // "HH:mm" of last lesson today
  nextLesson?: {
    date: string; // ISO date string
    startTime: string; // "HH:mm" or "HH:mm:ss"
  } | null;
}

export interface ActionStateInput {
  totalActions: number;
}

function fmtTime(t: string): string {
  // Accept HH:mm or HH:mm:ss
  return t?.slice(0, 5) ?? "";
}

function nextLessonFragment(next: LessonStateInput["nextLesson"]): string | null {
  if (!next) return null;
  const d = new Date(next.date);
  let dayLabel: string;
  if (isToday(d)) dayLabel = "today";
  else if (isTomorrow(d)) dayLabel = "tomorrow";
  else dayLabel = format(d, "EEEE");
  return `next lesson ${dayLabel} ${fmtTime(next.startTime)}`;
}

export function composeStatusSubtitle(
  lesson: LessonStateInput,
  action: ActionStateInput
): string {
  const { totalActions } = action;
  const {
    upcomingTodayCount,
    liveLessonEndsInMinutes,
    hasLessonsToday,
    lastEndTimeToday,
    nextLesson,
  } = lesson;

  // Live lesson takes precedence
  if (liveLessonEndsInMinutes != null && liveLessonEndsInMinutes > 0) {
    return `Lesson in progress · ends in ${liveLessonEndsInMinutes} min`;
  }

  const actionFragment =
    totalActions > 0
      ? `${totalActions} ${totalActions === 1 ? "thing" : "things"} waiting`
      : null;

  // Lessons remaining today
  if (upcomingTodayCount > 0) {
    const lessonFrag = `${upcomingTodayCount} ${
      upcomingTodayCount === 1 ? "lesson" : "lessons"
    } today`;
    if (actionFragment) return `${lessonFrag} · ${actionFragment}`;
    if (lastEndTimeToday) return `${lessonFrag} · finished by ${fmtTime(lastEndTimeToday)}`;
    return lessonFrag;
  }

  // Day done (had lessons today, all completed)
  if (hasLessonsToday) {
    if (actionFragment) return `Done for today · ${actionFragment}`;
    const nextFrag = nextLessonFragment(nextLesson);
    if (nextFrag) return `Done for today · ${nextFrag}`;
    return "Done for today";
  }

  // No lessons today
  if (actionFragment) return `No lessons today · ${actionFragment}`;
  return "Quiet day — perfect for catching up";
}

export interface PriorityAction {
  kind: "job_offer" | "test_swap" | "message" | "visitor_chat" | "conflict" | "payment" | "generic";
  count: number;
  title: string;
  subtitle: string;
  eyebrow: string;
  route: string;
}

export function getMostPressingAction(actions: PriorityAction[]): PriorityAction | null {
  if (!actions.length) return null;
  // Already sorted by caller — pick first
  return actions[0];
}
