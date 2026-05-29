import { forwardRef } from "react";
import { Sliders, type LucideProps } from "lucide-react";

export const AppearanceIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Sliders ref={ref} {...props} />
));
AppearanceIcon.displayName = "appearance";
