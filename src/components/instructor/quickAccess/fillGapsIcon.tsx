import { forwardRef } from "react";
import { Plus, type LucideProps } from "lucide-react";

export const FillGapsIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Plus ref={ref} {...props} />
));
FillGapsIcon.displayName = "fill-gaps";
