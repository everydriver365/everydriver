import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, StickyNote, Navigation, MessageSquare, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface RadialFABAction {
  id: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}

interface RadialFABProps {
  className?: string;
  onAddNote?: () => void;
  onNavigate?: () => void;
  onMessage?: () => void;
  onLogBreak?: () => void;
}

const defaultActions: RadialFABAction[] = [
  {
    id: "note",
    icon: StickyNote,
    label: "Quick Note",
    onClick: () => {},
    color: "bg-amber-500 hover:bg-amber-600",
  },
  {
    id: "navigate",
    icon: Navigation,
    label: "Navigate",
    onClick: () => {},
    color: "bg-primary hover:bg-primary/90",
  },
  {
    id: "message",
    icon: MessageSquare,
    label: "Message",
    onClick: () => {},
    color: "bg-emerald-500 hover:bg-emerald-600",
  },
  {
    id: "break",
    icon: Coffee,
    label: "Log Break",
    onClick: () => {},
    color: "bg-purple-500 hover:bg-purple-600",
  },
];

export function RadialFAB({
  className,
  onAddNote,
  onNavigate,
  onMessage,
  onLogBreak,
}: RadialFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions: RadialFABAction[] = [
    {
      id: "note",
      icon: StickyNote,
      label: "Quick Note",
      onClick: () => {
        haptics.selection();
        onAddNote?.();
        setIsOpen(false);
      },
      color: "bg-amber-500 hover:bg-amber-600",
    },
    {
      id: "navigate",
      icon: Navigation,
      label: "Navigate",
      onClick: () => {
        haptics.selection();
        onNavigate?.();
        setIsOpen(false);
      },
      color: "bg-primary hover:bg-primary/90",
    },
    {
      id: "message",
      icon: MessageSquare,
      label: "Message",
      onClick: () => {
        haptics.selection();
        onMessage?.();
        setIsOpen(false);
      },
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      id: "break",
      icon: Coffee,
      label: "Log Break",
      onClick: () => {
        haptics.selection();
        onLogBreak?.();
        setIsOpen(false);
      },
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  const toggleOpen = () => {
    haptics.medium();
    setIsOpen(!isOpen);
  };

  // Calculate positions for semi-circle above the FAB
  const getPosition = (index: number, total: number) => {
    // Spread items in a 120-degree arc above the button
    const startAngle = -150; // Start angle in degrees (left side)
    const endAngle = -30; // End angle in degrees (right side)
    const angleRange = endAngle - startAngle;
    const angleStep = angleRange / (total - 1);
    const angle = startAngle + index * angleStep;
    const angleRad = (angle * Math.PI) / 180;
    
    const radius = 90; // Distance from center - increased for better spacing
    const x = Math.cos(angleRad) * radius;
    const y = Math.sin(angleRad) * radius;
    
    return { x, y };
  };

  return (
    <div
      className={cn(
        "fixed bottom-24 right-4 z-[60] md:hidden",
        className
      )}
    >
      {/* Backdrop when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[59]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Radial Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <>
            {actions.map((action, index) => {
              const { x, y } = getPosition(index, actions.length);
              const Icon = action.icon;
              
              return (
                <motion.div
                  key={action.id}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    x, 
                    y, 
                    opacity: 1,
                  }}
                  exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: index * 0.05,
                  }}
                  className="absolute bottom-0 right-0 z-[61]"
                  style={{
                    transformOrigin: "center center",
                  }}
                >
                  <Button
                    onClick={action.onClick}
                    className={cn(
                      "h-12 w-12 rounded-full shadow-lg text-white",
                      "flex items-center justify-center p-0",
                      "touch-manipulation active:scale-95 transition-transform",
                      action.color
                    )}
                    aria-label={action.label}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                  
                  {/* Label tooltip */}
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap
                      px-2 py-1 bg-foreground text-background text-xs rounded-2xl shadow-md"
                  >
                    {action.label}
                  </motion.span>
                </motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.div
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Button
          onClick={toggleOpen}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "flex items-center justify-center p-0",
            "touch-manipulation active:scale-95 transition-transform",
            isOpen && "bg-muted-foreground"
          )}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}
