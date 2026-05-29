import { forwardRef } from "react";
import { Share2, type LucideProps } from "lucide-react";

export const ReferralsIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Share2 ref={ref} {...props} />
));
ReferralsIcon.displayName = "referrals";
