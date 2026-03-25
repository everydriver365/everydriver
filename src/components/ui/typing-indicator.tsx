import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  name?: string;
  className?: string;
}

export const TypingIndicator = forwardRef<HTMLDivElement, TypingIndicatorProps>(
  function TypingIndicator({ name, className }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={cn("flex items-center gap-2 px-4 py-2", className)}
      >
      <div className="flex items-center gap-1 bg-muted rounded-2xl rounded-bl-md px-4 py-2">
        <div className="flex items-center gap-1">
          <motion.span
            className="w-2 h-2 bg-muted-foreground/50 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="w-2 h-2 bg-muted-foreground/50 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.span
            className="w-2 h-2 bg-muted-foreground/50 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
        {name && (
          <span className="text-xs text-muted-foreground ml-2">
            {name} is typing...
          </span>
        )}
      </div>
    </motion.div>
  );
  }
);