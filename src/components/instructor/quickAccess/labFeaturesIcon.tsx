import { forwardRef } from "react";
import { FlaskConical, type LucideProps } from "lucide-react";

export const LabFeaturesIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <FlaskConical ref={ref} {...props} />
));
LabFeaturesIcon.displayName = "lab-features";
