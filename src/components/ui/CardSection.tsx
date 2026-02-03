import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface CardSectionProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: ReactNode;
  className?: string;
}

export function CardSection({
  title,
  subtitle,
  badge,
  defaultOpen = true,
  collapsible = true,
  children,
  className,
}: CardSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    if (!collapsible) return;
    haptics.selection();
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <button
        onClick={handleToggle}
        disabled={!collapsible}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2",
          "text-left",
          collapsible && "active:bg-muted/50 rounded-lg transition-colors"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
              {badge}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {subtitle && !isOpen && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {subtitle}
            </span>
          )}
          {collapsible && (
            <motion.div
              animate={{ rotate: isOpen ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simpler inline section header without collapse
interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-2", className)}>
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      {action}
    </div>
  );
}
