import { forwardRef } from "react";
import { BarChart3, type LucideProps } from "lucide-react";

export const WeeklyReportIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <BarChart3 ref={ref} {...props} />
));
WeeklyReportIcon.displayName = "weekly-report";
