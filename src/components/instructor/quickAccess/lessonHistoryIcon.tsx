import { forwardRef } from "react";
import { BookOpen, type LucideProps } from "lucide-react";

export const LessonHistoryIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <BookOpen ref={ref} {...props} />
));
LessonHistoryIcon.displayName = "lesson-history";
