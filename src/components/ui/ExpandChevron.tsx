import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandChevronProps {
  isExpanded: boolean;
  className?: string;
  size?: number;
}

/**
 * Uniform expansion indicator used across the site.
 * Renders a ChevronDown that rotates -90° when collapsed.
 */
export function ExpandChevron({ isExpanded, className, size = 16 }: ExpandChevronProps) {
  return (
    <ChevronDown
      className={cn(
        "text-muted-foreground transition-transform duration-200",
        !isExpanded && "-rotate-90",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
