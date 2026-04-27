import { format } from "date-fns";

export interface CoursePreviewState {
  totalHours: number | null;
  lessonLengthMinutes: number | null;
  testDate: Date | null;
  testCentreName: string | null;
  pupilName: string | null;
}

function firstName(name: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0];
}

function formatLessonLength(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

interface PreviewResult {
  bold: string | null;
  rest: string | null;
  hint: string | null;
  helper: string | null;
}

export function buildCoursePreview(state: CoursePreviewState): PreviewResult {
  const { totalHours, lessonLengthMinutes, testDate, testCentreName, pupilName } = state;

  if (!totalHours || !lessonLengthMinutes) {
    return { bold: null, rest: null, hint: null, helper: null };
  }

  const lessonLengthHours = lessonLengthMinutes / 60;
  const lessons = Math.floor(totalHours / lessonLengthHours);

  if (lessons < 1) {
    return {
      bold: null,
      rest: null,
      hint: null,
      helper: "Increase total hours or shorten lesson length",
    };
  }

  const bold = `${lessons} lessons of ${formatLessonLength(lessonLengthMinutes)}`;

  const parts: string[] = [];
  let prefix = "";
  const fname = firstName(pupilName);
  if (fname) prefix = `for ${fname} `;

  let weeks: number | null = null;
  let testInPast = false;
  if (testDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(testDate);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      testInPast = true;
    } else {
      weeks = Math.max(1, Math.ceil(diffDays / 7));
    }
  }

  if (weeks != null) {
    parts.push(`over ${weeks} ${weeks === 1 ? "week" : "weeks"}`);
  }

  if (testDate && testCentreName) {
    parts.push(`finishing ${format(testDate, "d MMM")} at ${testCentreName}`);
  } else if (testDate && weeks != null) {
    // already covered by "over N weeks"
  } else if (!testDate) {
    parts.push("to plan");
  }

  const rest = parts.length ? ` ${prefix}${parts.join(" · ")}`.replace(/\s+·/g, " ·") : null;

  // Hints
  let hint: string | null = null;
  if (testInPast) {
    hint = "Test date is in the past";
  } else if (weeks != null && lessons > weeks * 7) {
    hint = "Tight schedule — consider longer prep window";
  } else {
    const remainder = totalHours - lessons * lessonLengthHours;
    if (remainder >= 0.25) {
      const remH = Number.isInteger(remainder) ? `${remainder}h` : `${remainder.toFixed(1)}h`;
      hint = `${totalHours}h fits into ${lessons} lessons of ${formatLessonLength(lessonLengthMinutes)}, with ${remH} left over`;
    }
  }

  return { bold, rest, hint, helper: null };
}
