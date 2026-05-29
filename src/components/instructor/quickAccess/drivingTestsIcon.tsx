import { forwardRef } from "react";
import { Car, type LucideProps } from "lucide-react";

export const DrivingTestsIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Car ref={ref} {...props} />
));
DrivingTestsIcon.displayName = "driving-tests";
