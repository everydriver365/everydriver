import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BounceBadgeProps {
  count: number;
  className?: string;
  variant?: "primary" | "destructive";
}

export function BounceBadge({ count, className, variant = "destructive" }: BounceBadgeProps) {
  if (count <= 0) return null;

  const variantClasses = {
    primary: "bg-primary text-primary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
  };

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [1.3, 0.9, 1], opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
          variantClasses[variant],
          className
        )}
      >
        {count > 99 ? "99+" : count}
      </motion.span>
    </AnimatePresence>
  );
}
