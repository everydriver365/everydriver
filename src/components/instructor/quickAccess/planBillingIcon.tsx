import { forwardRef } from "react";
import { FileSpreadsheet, type LucideProps } from "lucide-react";

export const PlanBillingIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <FileSpreadsheet ref={ref} {...props} />
));
PlanBillingIcon.displayName = "plan-billing";
