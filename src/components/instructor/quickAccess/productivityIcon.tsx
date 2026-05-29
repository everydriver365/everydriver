import { forwardRef } from "react";
import { Zap, type LucideProps } from "lucide-react";

export const ProductivityIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Zap ref={ref} {...props} />
));
ProductivityIcon.displayName = "productivity";
