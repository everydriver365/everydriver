import { forwardRef } from "react";
import { Star, type LucideProps } from "lucide-react";

export const ReviewsIcon = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Star ref={ref} {...props} />
));
ReviewsIcon.displayName = "reviews";
