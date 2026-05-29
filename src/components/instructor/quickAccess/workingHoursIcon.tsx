import { forwardRef } from "react";
import { Clock, type LucideProps } from "lucide-react";

export const WorkingHoursIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Clock ref={ref} {...props} />
));
WorkingHoursIcon.displayName = "working-hours";
