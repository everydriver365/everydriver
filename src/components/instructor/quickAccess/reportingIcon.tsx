import { forwardRef } from "react";
import { TrendingUp, type LucideProps } from "lucide-react";

export const ReportingIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <TrendingUp ref={ref} {...props} />
));
ReportingIcon.displayName = "reporting";
