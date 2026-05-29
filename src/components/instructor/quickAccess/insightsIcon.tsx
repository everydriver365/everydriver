import { forwardRef } from "react";
import { BarChart2, type LucideProps } from "lucide-react";

export const InsightsIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <BarChart2 ref={ref} {...props} />
));
InsightsIcon.displayName = "insights";
