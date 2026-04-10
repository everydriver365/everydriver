import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { haptics } from "@/lib/haptics";
import {
  Calendar, Users, MapPin, PoundSterling, MessageSquare,
  Car, StickyNote, UsersRound, X, Coffee, Clock, Receipt,
  ClipboardCheck, CalendarPlus, BookOpen, Gift, Star, Megaphone,
} from "lucide-react";

interface QuickActionsPopoverMenuProps {
  open: boolean;
  onClose: () => void;
}

const PINNED_KEY = "pinned-quick-actions";

const quickActions = [
  { id: "add-lesson", label: "Add Lesson", icon: Calendar, color: "bg-violet-500", route: "/instructor/schedule?action=add" },
  { id: "add-pupil", label: "Add Pupil", icon: Users, color: "bg-[hsl(var(--primary))]", route: "/instructor/pupils?action=add" },
  { id: "track-live", label: "Track Live", icon: MapPin, color: "bg-emerald-500", route: "/instructor/tracking" },
  { id: "take-payment", label: "Take Payment", icon: PoundSterling, color: "bg-rose-500", route: "/instructor/take-payment" },
  { id: "messages", label: "Messages", icon: MessageSquare, color: "bg-cyan-500", route: "/instructor/messages?action=new" },
  { id: "nearby-adis", label: "Nearby ADIs", icon: UsersRound, color: "bg-indigo-500", route: "/instructor/nearby-friends" },
  
  { id: "availability", label: "Availability", icon: Clock, color: "bg-teal-500", route: "/instructor/availability?action=add" },
  { id: "end-of-day", label: "End of Day", icon: Coffee, color: "bg-indigo-500", route: "/instructor/end-of-day" },
  { id: "platform-updates", label: "Platform Updates", icon: Megaphone, color: "bg-amber-500", route: "/instructor/platform-updates" },
];

function loadPinned(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PINNED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function QuickActionsPopoverMenu({ open, onClose }: QuickActionsPopoverMenuProps) {
  const navigate = useNavigate();
  
  const [pinned, setPinned] = useState<string[]>(loadPinned);
  // Haptic on open
  useEffect(() => {
    if (open) {
      haptics.medium();
    }
  }, [open]);

  const togglePin = useCallback((id: string) => {
    haptics.light();
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      localStorage.setItem(PINNED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleAction = (route: string) => {
    haptics.light();
    onClose();
    navigate(route);
  };

  // Sort: pinned first
  const sorted = [...quickActions].sort((a, b) => {
    const aP = pinned.includes(a.id) ? 0 : 1;
    const bP = pinned.includes(b.id) ? 0 : 1;
    return aP - bP;
  });

  const pinnedVisible = sorted.filter(a => pinned.includes(a.id));
  const unpinnedVisible = sorted.filter(a => !pinned.includes(a.id));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[80]"
            onClick={onClose}
          />

          {/* Menu card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed inset-x-4 bottom-20 z-[81] max-w-sm mx-auto max-h-[calc(100vh-8rem)] flex flex-col"
          >
            <div className="bg-card rounded-none shadow-xl border border-border overflow-hidden flex flex-col min-h-0">
              <ScrollArea className="max-h-[55vh]">
                <div className="p-2 pt-1">

                  {/* Pinned section */}
                  {pinnedVisible.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-1 pb-1">
                        Pinned
                      </p>
                      {pinnedVisible.map((action, index) => (
                        <ActionRow
                          key={action.id}
                          action={action}
                          index={index}
                          isPinned
                          onAction={handleAction}
                          onTogglePin={togglePin}
                        />
                      ))}
                    </>
                  )}

                  {/* Unpinned section */}
                  {unpinnedVisible.length > 0 && pinnedVisible.length > 0 && (
                    <div className="mx-3 my-1 border-t border-border" />
                  )}
                  {unpinnedVisible.map((action, index) => (
                    <ActionRow
                      key={action.id}
                      action={action}
                      index={index + pinnedVisible.length}
                      isPinned={false}
                      onAction={handleAction}
                      onTogglePin={togglePin}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Close button */}
            <div className="flex justify-end mt-3 pr-1">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                onClick={onClose}
                className="h-12 w-12 rounded-full bg-muted-foreground/80 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <X className="h-6 w-6 text-white" strokeWidth={2.5} />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ActionRowProps {
  action: typeof quickActions[number];
  index: number;
  isPinned: boolean;
  onAction: (route: string) => void;
  onTogglePin: (id: string) => void;
}

function ActionRow({ action, index, isPinned, onAction, onTogglePin }: ActionRowProps) {
  const Icon = action.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025 }}
      className="flex items-center"
    >
      <button
        onClick={() => onAction(action.route)}
        className="flex-1 flex items-center gap-3 px-3 py-2 rounded-none hover:bg-muted/60 active:bg-muted transition-colors text-left"
      >
        <div className={`h-9 w-9 rounded-full ${action.color} flex items-center justify-center shrink-0`}>
          <Icon className="h-4.5 w-4.5 text-white" strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold text-foreground">{action.label}</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(action.id); }}
        className="p-2 rounded-none hover:bg-muted/60 active:bg-muted transition-colors shrink-0"
        aria-label={isPinned ? "Unpin action" : "Pin action"}
      >
        <Star
          className={`h-4 w-4 transition-colors ${isPinned ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40"}`}
          strokeWidth={2}
        />
      </button>
    </motion.div>
  );
}
