import { forwardRef } from "react";
import { MapPin, type LucideProps } from "lucide-react";

export const GpsTrackingIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <MapPin ref={ref} {...props} />
));
GpsTrackingIcon.displayName = "gps-tracking";
