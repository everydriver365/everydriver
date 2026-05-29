import { forwardRef } from "react";
import { ShieldCheck, type LucideProps } from "lucide-react";

export const StandardsIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <ShieldCheck ref={ref} {...props} />
));
StandardsIcon.displayName = "standards";
