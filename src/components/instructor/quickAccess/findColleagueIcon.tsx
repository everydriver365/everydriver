import { forwardRef } from "react";
import { Users, type LucideProps } from "lucide-react";

export const FindColleagueIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Users ref={ref} {...props} />
));
FindColleagueIcon.displayName = "find-colleague";
