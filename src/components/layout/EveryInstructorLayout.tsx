import { ReactNode, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, MapPin, PoundSterling, MessageSquare, UsersRound } from "lucide-react";
import { AppHeader } from "@/components/instructor/ui/AppHeader";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { QuickActionsDrawer } from "@/components/instructor/QuickActionsDrawer";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { haptics } from "@/lib/haptics";

interface Props {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  route?: string;
  onClick?: () => void;
  color: string;
}

const buildQuickActions = (onAddLesson: () => void): QuickAction[] => [
  { id: "add-lesson",  icon: Calendar,       label: "Add Lesson",   onClick: onAddLesson,                               color: "bg-violet-500 hover:bg-violet-600" },
  { id: "add-pupil",   icon: Users,          label: "Add Pupil",    route: "/every-instructor/pupils?action=add",      color: "bg-[#0075c9] hover:bg-[#005a9e]" },
  { id: "track-live",  icon: MapPin,         label: "Track Live",   route: "/every-instructor/tracking",               color: "bg-emerald-500 hover:bg-emerald-600" },
  { id: "take-payment",icon: PoundSterling,  label: "Take Payment", route: "/every-instructor/pay",                    color: "bg-rose-500 hover:bg-rose-600" },
  { id: "messages",    icon: MessageSquare,  label: "Messages",     route: "/instructor/messages",                     color: "bg-cyan-500 hover:bg-cyan-600" },
  { id: "nearby-adis", icon: UsersRound,     label: "Nearby ADIs",  route: "/instructor/nearby-friends",               color: "bg-indigo-500 hover:bg-indigo-600" },
];

export function EveryInstructorLayout({
  children,
  title = "Driving School Manager",
  showHeader = true,
}: Props) {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);

  const [quickOpen, setQuickOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);

  const handleOpenAddLesson = useCallback(() => {
    setAddLessonOpen(true);
  }, []);

  const quickActions = buildQuickActions(handleOpenAddLesson);

  const handleQuickActionClick = (action: QuickAction) => {
    haptics.selection();
    if (action.route) {
      navigate(action.route);
    } else if (action.onClick) {
      action.onClick();
    }
    setQuickOpen(false);
  };

  return (
    <div
      className="min-h-screen ios-instructor instructor-portal ios-scroll"
      style={{ backgroundColor: "hsl(var(--dsm-bg))" }}
    >
      {showHeader && (
        <AppHeader
          title={title}
          rootPath="/every-instructor"
          notificationCount={notificationCount}
          onBellPress={() => navigate("/every-instructor/notifications")}
          onAddPress={() => setQuickOpen(true)}
          onMenuPress={() => navigate("/every-instructor/menu")}
        />
      )}

      <main className="pb-24">{children}</main>

      <QuickActionsDrawer
        open={quickOpen}
        onOpenChange={setQuickOpen}
        actions={quickActions}
        onActionClick={handleQuickActionClick}
      />

      <AddLessonSheet
        open={addLessonOpen}
        onOpenChange={setAddLessonOpen}
        instructorId={instructor?.id}
      />
    </div>
  );
}
