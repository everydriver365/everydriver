import { forwardRef } from "react";
import { Search, type LucideProps } from "lucide-react";

export const FindSlotIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Search ref={ref} {...props} />
));
FindSlotIcon.displayName = "find-slot";
