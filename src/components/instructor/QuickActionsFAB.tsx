import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Calendar, Users, MapPin, PoundSterling, MessageSquare, Settings, FileText, Car, StickyNote, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { haptics } from "@/lib/haptics";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  route?: string;
  onClick?: () => void;
  color: string;
}

interface QuickActionsFABProps {
  className?: string;
  position?: "bottom-right" | "bottom-left";
}

const getQuickActions = (onAddLesson: () => void): QuickAction[] => [
  {
    id: "add-lesson",
    icon: Calendar,
    label: "Add Lesson",
    onClick: onAddLesson,
    color: "bg-violet-500 hover:bg-violet-600",
  },
  {
    id: "add-pupil",
    icon: Users,
    label: "Add Pupil",
    route: "/instructor/pupils?action=add",
    color: "bg-[#0075c9] hover:bg-[#005a9e]",
  },
  {
    id: "track-live",
    icon: MapPin,
    label: "Track Live",
    route: "/instructor/tracking",
    color: "bg-emerald-500 hover:bg-emerald-600",
  },
  {
    id: "take-payment",
    icon: PoundSterling,
    label: "Take Payment",
    route: "/instructor/pay",
    color: "bg-rose-500 hover:bg-rose-600",
  },
  {
    id: "messages",
    icon: MessageSquare,
    label: "Messages",
    route: "/instructor/messages",
    color: "bg-cyan-500 hover:bg-cyan-600",
  },
  {
    id: "nearby-adis",
    icon: UsersRound,
    label: "Nearby ADIs",
    route: "/instructor/nearby-friends",
    color: "bg-indigo-500 hover:bg-indigo-600",
  },
];

export function QuickActionsFAB({ className, position = "bottom-right" }: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();

  const handleOpenAddLesson = useCallback(() => {
    setAddLessonOpen(true);
  }, []);

  const quickActions = getQuickActions(handleOpenAddLesson);

  const handleActionClick = (action: QuickAction) => {
    haptics.selection();
    if (action.route) {
      navigate(action.route);
    } else if (action.onClick) {
      action.onClick();
    }
    setIsOpen(false);
  };

  const toggleOpen = () => {
    haptics.medium();
    setIsOpen(!isOpen);
  };

  const positionClasses = position === "bottom-right" 
    ? "right-4 sm:right-6" 
    : "left-4 sm:left-6";

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-6 z-[60]",
        positionClasses,
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[59]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "absolute bottom-16 mb-2 z-[61]",
              position === "bottom-right" ? "right-0" : "left-0"
            )}
          >
            <div className="bg-background border border-border rounded-none shadow-xl overflow-hidden min-w-[200px]">
              <div className="p-1.5 space-y-0.5">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleActionClick(action)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-none hover:bg-muted transition-colors text-left group"
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110",
                        action.color
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
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
            "h-14 w-14 rounded-full",
            "bg-[#0075c9] hover:bg-[#005a9e] text-white",
            "shadow-[0_4px_20px_rgba(0,117,201,0.5)] hover:shadow-[0_6px_25px_rgba(0,117,201,0.6)]",
            "flex items-center justify-center p-0",
            "touch-manipulation active:scale-95 transition-all",
            !isOpen && "ring-4 ring-[#0075c9]/30",
            isOpen && "bg-muted-foreground hover:bg-muted-foreground/90 shadow-lg"
          )}
          aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        >
          <Plus className="h-8 w-8" strokeWidth={3} />
        </Button>
      </motion.div>
      {instructor?.id && (
        <AddLessonSheet
          open={addLessonOpen}
          onOpenChange={setAddLessonOpen}
          instructorId={instructor.id}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
