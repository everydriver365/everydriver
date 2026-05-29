import { forwardRef } from "react";
import { Clock, type LucideProps } from "lucide-react";

export const PendingIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Clock ref={ref} {...props} />
));
PendingIcon.displayName = "pending";
