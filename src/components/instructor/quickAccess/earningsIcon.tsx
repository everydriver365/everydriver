import { forwardRef } from "react";
import { FileBarChart, type LucideProps } from "lucide-react";

export const EarningsIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <FileBarChart ref={ref} {...props} />
));
EarningsIcon.displayName = "earnings";
