import { forwardRef } from "react";
import { Users, type LucideProps } from "lucide-react";

export const WaitingRoomIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Users ref={ref} {...props} />
));
WaitingRoomIcon.displayName = "waiting-room";
