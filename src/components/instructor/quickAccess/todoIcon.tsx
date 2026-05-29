import { forwardRef } from "react";
import { CheckSquare, type LucideProps } from "lucide-react";

export const TodoIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <CheckSquare ref={ref} {...props} />
));
TodoIcon.displayName = "todo";
