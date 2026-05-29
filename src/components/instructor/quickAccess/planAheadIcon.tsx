import { forwardRef } from "react";
import { Lightbulb, type LucideProps } from "lucide-react";

export const PlanAheadIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Lightbulb ref={ref} {...props} />
));
PlanAheadIcon.displayName = "plan-ahead";
