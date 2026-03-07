import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Users, MapPin, PoundSterling, MessageSquare,
  Car, StickyNote, UsersRound, X, Coffee, Clock, Receipt,
  ClipboardCheck, CalendarPlus, BookOpen, Gift,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Custom image icons (same as QuickActionTiles)
import messagesIcon from "@/assets/messages-icon.png";
import paymentsIcon from "@/assets/payments-icon-new.png";
import takePaymentIcon from "@/assets/take-payment-icon.png";
import scheduleIcon from "@/assets/calendar-icon.png";
import pupilsIcon from "@/assets/pupils-icon.png";
import trackIcon from "@/assets/track-icon.png";
import findMyCarIcon from "@/assets/find_car2.png";
import availabilityIcon from "@/assets/availability-icon.png";
import expensesIcon from "@/assets/expenses-icon.png";
import settingsIcon from "@/assets/settings-icon.png";

interface QuickActionsPopoverMenuProps {
  open: boolean;
  onClose: () => void;
}

const quickActions = [
  { id: "add-lesson", label: "Add Lesson", icon: Calendar, customIcon: scheduleIcon, route: "/instructor/schedule?action=add" },
  { id: "add-pupil", label: "Add Pupil", icon: Users, customIcon: pupilsIcon, route: "/instructor/pupils?action=add" },
  { id: "track-live", label: "Track Live", icon: MapPin, customIcon: trackIcon, route: "/instructor/tracking" },
  { id: "take-payment", label: "Take Payment", icon: PoundSterling, customIcon: takePaymentIcon, route: "/instructor/take-payment" },
  { id: "messages", label: "Messages", icon: MessageSquare, customIcon: messagesIcon, route: "/instructor/messages?action=new" },
  { id: "find-car", label: "Find My Car", icon: Car, customIcon: findMyCarIcon, route: "/instructor/find-my-car" },
  { id: "notes", label: "Notes", icon: StickyNote, route: "/instructor/notes" },
  { id: "nearby-adis", label: "Nearby ADIs", icon: UsersRound, route: "/instructor/nearby-friends" },
  { id: "log-break", label: "Log Break", icon: Coffee, route: "/instructor/schedule?action=break" },
  { id: "availability", label: "Availability", icon: Clock, customIcon: availabilityIcon, route: "/instructor/availability?action=add" },
  { id: "expenses", label: "Expenses", icon: Receipt, customIcon: expensesIcon, route: "/instructor/expenses?action=add" },
  { id: "log-test-result", label: "Log Test", icon: ClipboardCheck, route: "/instructor/test-results?action=add" },
  { id: "fill-gaps", label: "Fill Gaps", icon: CalendarPlus, route: "/instructor/gaps?action=add" },
  { id: "cpd-log", label: "CPD Log", icon: BookOpen, route: "/instructor/cpd?action=add" },
  { id: "referrals", label: "Referrals", icon: Gift, route: "/instructor/referrals?action=invite" },
  { id: "settings", label: "Settings", icon: settingsIcon ? Calendar : Calendar, customIcon: settingsIcon, route: "/instructor/settings" },
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
            onClick={onClose}
          />

          {/* Menu card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed inset-x-4 bottom-24 z-[81] max-w-sm mx-auto"
          >
            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
              <ScrollArea className="max-h-[60vh]">
                <div className="grid grid-cols-4 gap-1 p-3">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleAction(action.route)}
                        className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl hover:bg-muted/60 active:bg-muted transition-colors"
                      >
                        <div className="h-11 w-11 rounded-[10px] bg-muted flex items-center justify-center shrink-0">
                          {action.customIcon ? (
                            <img
                              src={action.customIcon}
                              alt={action.label}
                              className="h-7 w-7 object-contain"
                              style={{ borderRadius: "7px" }}
                            />
                          ) : (
                            <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.8} />
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-foreground leading-tight text-center line-clamp-2">
                          {action.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Close button */}
            <div className="flex justify-center mt-3">
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
