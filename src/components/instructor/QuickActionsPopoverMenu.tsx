import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Users, MapPin, PoundSterling, MessageSquare,
  Car, StickyNote, UsersRound, X, Coffee, Clock, Receipt,
  ClipboardCheck, CalendarPlus, BookOpen, Gift,
} from "lucide-react";

interface QuickActionsPopoverMenuProps {
  open: boolean;
  onClose: () => void;
}

const quickActions = [
  { id: "add-lesson", label: "Add Lesson", icon: Calendar, color: "bg-violet-500", route: "/instructor/schedule?action=add" },
  { id: "add-pupil", label: "Add Pupil", icon: Users, color: "bg-[hsl(var(--primary))]", route: "/instructor/pupils?action=add" },
  { id: "track-live", label: "Track Live", icon: MapPin, color: "bg-emerald-500", route: "/instructor/tracking" },
  { id: "take-payment", label: "Take Payment", icon: PoundSterling, color: "bg-rose-500", route: "/instructor/take-payment" },
  { id: "messages", label: "Messages", icon: MessageSquare, color: "bg-cyan-500", route: "/instructor/messages?action=new" },
  { id: "find-car", label: "Find My Car", icon: Car, color: "bg-amber-500", route: "/instructor/find-my-car" },
  { id: "notes", label: "Notes", icon: StickyNote, color: "bg-yellow-500", route: "/instructor/notes" },
  { id: "nearby-adis", label: "Nearby ADIs", icon: UsersRound, color: "bg-indigo-500", route: "/instructor/nearby-friends" },
  { id: "log-break", label: "Log Break", icon: Coffee, color: "bg-orange-500", route: "/instructor/schedule?action=break" },
  { id: "availability", label: "Availability", icon: Clock, color: "bg-teal-500", route: "/instructor/availability?action=add" },
  { id: "expenses", label: "Expenses", icon: Receipt, color: "bg-pink-500", route: "/instructor/expenses?action=add" },
  { id: "log-test-result", label: "Log Test Result", icon: ClipboardCheck, color: "bg-blue-600", route: "/instructor/test-results?action=add" },
  { id: "fill-gaps", label: "Fill Gaps", icon: CalendarPlus, color: "bg-fuchsia-500", route: "/instructor/gaps?action=add" },
  { id: "cpd-log", label: "CPD Log", icon: BookOpen, color: "bg-purple-600", route: "/instructor/cpd?action=add" },
  { id: "referrals", label: "Referrals", icon: Gift, color: "bg-red-500", route: "/instructor/referrals?action=invite" },
];

export function QuickActionsPopoverMenu({ open, onClose }: QuickActionsPopoverMenuProps) {
  const navigate = useNavigate();

  const handleAction = (route: string) => {
    onClose();
    navigate(route);
  };

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
            className="fixed inset-x-4 bottom-24 z-[81] max-w-sm mx-auto"
          >
            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
              <div className="p-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleAction(action.route)}
                      className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-muted/60 active:bg-muted transition-colors text-left"
                    >
                      <div className={`h-10 w-10 rounded-full ${action.color} flex items-center justify-center shrink-0`}>
                        <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                      </div>
                      <span className="text-[15px] font-semibold text-foreground">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>
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
