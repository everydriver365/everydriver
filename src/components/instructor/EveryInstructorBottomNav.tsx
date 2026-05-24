import { useNavigate } from "react-router-dom";
import { BottomNav, BottomNavTabConfig } from "@/components/instructor/ui/BottomNav";
import {
  HomeNavIcon,
  ScheduleNavIcon,
  MessagesNavIcon,
  MoneyNavIcon,
  PupilsNavIcon,
  MenuNavIcon,
} from "@/components/instructor/ui/NavIcons";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";

/**
 * Instructor mobile bottom navigation.
 *
 * Tab order, routes, badge bindings and tap behaviour are unchanged from
 * the previous implementation — this file only swaps the visual layer to
 * the premium tile design system. The "More" tab's user-visible label is
 * now "Menu" (route id stays /every-instructor/menu).
 *
 * Track was removed from the bottom nav (still reachable from the
 * dashboard tile and auto-tracking indicator) and replaced with Messages,
 * which carries a live unread-count badge.
 */

export function EveryInstructorBottomNav() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const { data: unreadMessagesCount = 0 } = useUnreadMessagesCount(instructor?.id);

  const tabs: BottomNavTabConfig[] = [
    { label: "Home", icon: HomeNavIcon, path: "/every-instructor", exact: true },
    { label: "Schedule", icon: ScheduleNavIcon, path: "/every-instructor/schedule" },
    { label: "Messages", icon: MessagesNavIcon, path: "/every-instructor/messages", badge: unreadMessagesCount },
    { label: "Money", icon: MoneyNavIcon, path: "/every-instructor/pay" },
    { label: "Pupils", icon: PupilsNavIcon, path: "/every-instructor/pupils" },
    { label: "Menu", icon: MenuNavIcon, path: "/every-instructor/menu" },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <BottomNav tabs={tabs} onNavigate={handleNav} />;
}
