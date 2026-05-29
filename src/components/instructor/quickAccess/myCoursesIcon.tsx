import { forwardRef } from "react";
import { LayoutGrid, type LucideProps } from "lucide-react";

export const MyCoursesIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <LayoutGrid ref={ref} {...props} />
));
MyCoursesIcon.displayName = "my-courses";
