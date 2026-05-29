import { forwardRef } from "react";
import { Shield, type LucideProps } from "lucide-react";

export const SecurityIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Shield ref={ref} {...props} />
));
SecurityIcon.displayName = "security";
