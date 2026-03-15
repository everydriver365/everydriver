import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CalendarPlus, CreditCard, MessageSquare, X } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

interface PupilQuickActionsProps {
  onNavigate: (section: string) => void;
  brandColour?: string;
}

const actions = [
  { id: "book", icon: CalendarPlus, label: "Book" },
  { id: "payments", icon: CreditCard, label: "Pay" },
  { id: "messages", icon: MessageSquare, label: "Message" },
];

export function PupilQuickActions({ onNavigate, brandColour }: PupilQuickActionsProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const color = brandColour || "hsl(var(--primary))";

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < lastScroll || y < 100);
      setLastScroll(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScroll]);

  const handleAction = (id: string) => {
    haptics.selection();
    setOpen(false);
    onNavigate(id);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB + speed dial */}
      <div className={cn(
        "fixed right-4 bottom-20 z-50 flex flex-col items-end gap-2 transition-all duration-300",
        !visible && !open && "translate-y-24 opacity-0 pointer-events-none"
      )}>
        {/* Action items */}
        <AnimatePresence>
          {open && actions.map((action, i) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleAction(action.id)}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-card border border-border shadow-lg"
            >
              <action.icon className="h-4 w-4" style={{ color }} />
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            haptics.medium();
            setOpen((v) => !v);
          }}
          className="h-14 w-14 rounded-full shadow-xl flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            {open ? <X className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
