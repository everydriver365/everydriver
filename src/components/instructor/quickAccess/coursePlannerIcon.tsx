import { GraduationCap, type LucideIcon, type LucideProps } from "lucide-react";
import { forwardRef } from "react";

/**
 * Lucide-shaped wrapper that exposes displayName "course-planner".
 * Used so `resolveIcon3D` maps the Course Planner tile to its dedicated
 * 3D icon instead of the shared graduation-cap asset.
 * Visual fallback (when no 3D asset matches) reuses GraduationCap.
 */
export const CoursePlannerIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  (props, ref) => <GraduationCap ref={ref} {...props} />,
) as unknown as LucideIcon;
(CoursePlannerIcon as { displayName?: string }).displayName = "course-planner";
