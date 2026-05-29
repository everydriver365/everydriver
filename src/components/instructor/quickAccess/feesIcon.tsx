import { forwardRef } from "react";
import { Info, type LucideProps } from "lucide-react";

export const FeesIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Info ref={ref} {...props} />
));
FeesIcon.displayName = "fees";
