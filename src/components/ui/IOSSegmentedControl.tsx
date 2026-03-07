import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface Segment {
  value: string;
  label: string;
}

interface IOSSegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function IOSSegmentedControl({
  segments,
  value,
  onChange,
  className,
}: IOSSegmentedControlProps) {
  const activeIndex = segments.findIndex((s) => s.value === value);

  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-[10px] bg-muted/50 p-[3px] w-full",
        className
      )}
    >
      {/* Sliding pill */}
      <motion.div
        className="absolute top-[3px] bottom-[3px] rounded-[8px] bg-card shadow-sm"
        initial={false}
        animate={{
          left: `calc(${(activeIndex / segments.length) * 100}% + 3px)`,
          width: `calc(${100 / segments.length}% - 6px)`,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
          mass: 0.5,
        }}
      />

      {segments.map((segment) => (
        <button
          key={segment.value}
          onClick={() => {
            if (segment.value !== value) {
              haptics.selection();
              onChange(segment.value);
            }
          }}
          className={cn(
            "relative z-10 flex-1 py-1.5 px-3 text-[13px] font-medium text-center rounded-[8px] transition-colors duration-200",
            segment.value === value
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
}
