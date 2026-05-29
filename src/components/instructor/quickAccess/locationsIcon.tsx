import { forwardRef } from "react";
import { MapPinned, type LucideProps } from "lucide-react";

export const LocationsIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <MapPinned ref={ref} {...props} />
));
LocationsIcon.displayName = "locations";
