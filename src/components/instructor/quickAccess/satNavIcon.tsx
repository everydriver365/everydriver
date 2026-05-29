import { forwardRef } from "react";
import { Navigation, type LucideProps } from "lucide-react";

export const SatNavIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Navigation ref={ref} {...props} />
));
SatNavIcon.displayName = "sat-nav";
