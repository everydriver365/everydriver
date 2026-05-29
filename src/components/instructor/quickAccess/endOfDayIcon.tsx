import { forwardRef } from "react";
import { Moon, type LucideProps } from "lucide-react";

export const EndOfDayIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Moon ref={ref} {...props} />
));
EndOfDayIcon.displayName = "end-of-day";
