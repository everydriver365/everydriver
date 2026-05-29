import { forwardRef } from "react";
import { Phone, type LucideProps } from "lucide-react";

export const TelephonyIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Phone ref={ref} {...props} />
));
TelephonyIcon.displayName = "telephony";

export const CallAnsweringIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Phone ref={ref} {...props} />
));
CallAnsweringIcon.displayName = "telephony";
