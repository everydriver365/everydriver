import { forwardRef } from "react";
import { Crown, type LucideProps } from "lucide-react";

export const YourPlanIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Crown ref={ref} {...props} />
));
YourPlanIcon.displayName = "your-plan";
