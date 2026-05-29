import { forwardRef } from "react";
import { Calculator, type LucideProps } from "lucide-react";

export const TaxIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Calculator ref={ref} {...props} />
));
TaxIcon.displayName = "tax";
