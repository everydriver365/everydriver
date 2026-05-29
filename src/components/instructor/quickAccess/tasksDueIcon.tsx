import { forwardRef } from "react";
import { ClipboardCheck, type LucideProps } from "lucide-react";

export const TasksDueIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <ClipboardCheck ref={ref} {...props} />
));
TasksDueIcon.displayName = "tasks-due";
