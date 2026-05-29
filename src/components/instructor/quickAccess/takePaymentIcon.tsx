import { forwardRef } from "react";
import { Upload, type LucideProps } from "lucide-react";

export const TakePaymentIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Upload ref={ref} {...props} />
));
TakePaymentIcon.displayName = "take-payment";
