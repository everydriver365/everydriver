import { forwardRef } from "react";
import { Megaphone, type LucideProps } from "lucide-react";

export const PlatformUpdatesIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Megaphone ref={ref} {...props} />
));
PlatformUpdatesIcon.displayName = "platform-updates";
