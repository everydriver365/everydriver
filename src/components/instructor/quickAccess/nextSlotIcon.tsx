import { forwardRef } from "react";
import { ArrowRight, type LucideProps } from "lucide-react";

export const NextSlotIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <ArrowRight ref={ref} {...props} />
));
NextSlotIcon.displayName = "next-slot";
