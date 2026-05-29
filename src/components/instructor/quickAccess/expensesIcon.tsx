import { forwardRef } from "react";
import { Receipt, type LucideProps } from "lucide-react";

export const ExpensesIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Receipt ref={ref} {...props} />
));
ExpensesIcon.displayName = "expenses";
