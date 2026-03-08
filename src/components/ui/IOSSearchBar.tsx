import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface IOSSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * iOS-style search bar with expand/collapse animation and cancel button.
 */
export function IOSSearchBar({
  value,
  onChange,
  placeholder = "Search",
  className,
}: IOSSearchBarProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = focused || value.length > 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        layout
        className="relative flex-1"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full h-9 pl-9 pr-8 rounded-[10px] text-[15px] bg-muted/80 text-foreground placeholder:text-muted-foreground/60",
            "outline-none border-0 transition-colors",
            "focus:bg-muted"
          )}
        />
        {/* Clear button */}
        <AnimatePresence>
          {value.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-muted-foreground/30 flex items-center justify-center"
            >
              <X className="h-2.5 w-2.5 text-background" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cancel button */}
      <AnimatePresence>
        {isActive && (
          <motion.button
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={() => {
              onChange("");
              setFocused(false);
              inputRef.current?.blur();
            }}
            className="text-primary text-[15px] font-normal whitespace-nowrap overflow-hidden"
          >
            Cancel
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
