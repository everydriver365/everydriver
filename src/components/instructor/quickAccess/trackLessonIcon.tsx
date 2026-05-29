import { forwardRef } from "react";
import { MapPin, type LucideProps } from "lucide-react";

export const TrackLessonIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <MapPin ref={ref} {...props} />
));
TrackLessonIcon.displayName = "track-lesson";
