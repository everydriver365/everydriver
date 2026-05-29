import { forwardRef } from "react";
import { Car, type LucideProps } from "lucide-react";

export const FindMyCarIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Car ref={ref} {...props} />
));
FindMyCarIcon.displayName = "find-my-car";
