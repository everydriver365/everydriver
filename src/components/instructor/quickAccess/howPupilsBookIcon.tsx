import { forwardRef } from "react";
import { FileText, type LucideProps } from "lucide-react";

export const HowPupilsBookIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <FileText ref={ref} {...props} />
));
HowPupilsBookIcon.displayName = "how-pupils-book";
