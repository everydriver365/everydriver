import { toSentenceCase } from "@/lib/formatJobOffer";

/**
 * Maps a course type string to a system-palette colour.
 * Display-only — never mutates stored data.
 */
export function getCourseTypeColor(courseType: string | null | undefined): string {
  const key = (courseType ?? "").toLowerCase();
  if (key.includes("intensive")) return "#8A5BC9"; // purple (intensive / semi-intensive)
  if (key.includes("test") || key.includes("mock")) return "#3B8B3B"; // green
  if (key.includes("speed") || key.includes("awareness")) return "#B8801F"; // amber
  if (key.includes("standard") || key.includes("lesson") || key.includes("hour")) return "#2B7BC8"; // blue
  if (!key) return "#6E6E73";
  return "#2B7BC8"; // default to blue for known-but-unmapped
}

interface CourseTypeLabelProps {
  courseType: string | null | undefined;
  className?: string;
}

export function CourseTypeLabel({ courseType, className }: CourseTypeLabelProps) {
  const label = toSentenceCase(courseType) || "Lesson";
  const color = getCourseTypeColor(courseType);
  return (
    <span
      className={className}
      style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        color,
      }}
    >
      {label}
    </span>
  );
}
