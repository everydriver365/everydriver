import { forwardRef } from "react";
import { MapPin, type LucideProps } from "lucide-react";

export const FindNearbyIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <MapPin ref={ref} {...props} />
));
FindNearbyIcon.displayName = "find-nearby";
