import { forwardRef } from "react";
import { HelpCircle, type LucideProps } from "lucide-react";

export const SupportIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <HelpCircle ref={ref} {...props} />
));
SupportIcon.displayName = "support";
