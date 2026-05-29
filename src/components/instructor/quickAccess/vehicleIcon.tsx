import { forwardRef } from "react";
import { Car, type LucideProps } from "lucide-react";

export const VehicleIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Car ref={ref} {...props} />
));
VehicleIcon.displayName = "vehicle";
