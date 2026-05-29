import { forwardRef } from "react";
import { ClipboardCheck, type LucideProps } from "lucide-react";

export const LogTestResultIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <ClipboardCheck ref={ref} {...props} />
));
LogTestResultIcon.displayName = "log-test-result";
