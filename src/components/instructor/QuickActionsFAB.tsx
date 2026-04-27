import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Users, MapPin, PoundSterling, MessageSquare, UsersRound, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { haptics } from "@/lib/haptics";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { QuickActionsDrawer } from "@/components/instructor/QuickActionsDrawer";
import { VoiceQuickAddLessonSheet } from "@/components/instructor/VoiceQuickAddLessonSheet";
import { useVoiceToText } from "@/hooks/useVoiceToText";

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
      {/* Side drawer menu */}
      <QuickActionsDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
        actions={quickActions}
        onActionClick={handleActionClick}
      />

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
