import { forwardRef } from "react";
import { Award, type LucideProps } from "lucide-react";

export const CpdIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Award ref={ref} {...props} />
));
CpdIcon.displayName = "cpd";
