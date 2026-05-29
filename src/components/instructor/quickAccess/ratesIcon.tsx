import { forwardRef } from "react";
import { MapPin, type LucideProps } from "lucide-react";

/**
 * Custom Quick Access "Rates" icon. Wraps Lucide's MapPin so the
 * 3D registry can swap it for the clay-style PNG via displayName.
 */
export const RatesIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <MapPin ref={ref} {...props} />
));
RatesIcon.displayName = "rates";
