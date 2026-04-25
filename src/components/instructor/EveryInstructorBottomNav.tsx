import { useNavigate } from "react-router-dom";
import { BottomNav, BottomNavTabConfig } from "@/components/instructor/ui/BottomNav";
import {
  HomeNavIcon,
  ScheduleNavIcon,
  TrackNavIcon,
  MoneyNavIcon,
  PupilsNavIcon,
  MenuNavIcon,
} from "@/components/instructor/ui/NavIcons";

/**
 * Instructor mobile bottom navigation.
 *
 * Tab order, routes, badge bindings and tap behaviour are unchanged from
 * the previous implementation — this file only swaps the visual layer to
 * the premium tile design system. The "More" tab's user-visible label is
 * now "Menu" (route id stays /every-instructor/menu).
 */

const tabs: BottomNavTabConfig[] = [
  { label: "Home", icon: HomeNavIcon, path: "/every-instructor", exact: true },
  { label: "Schedule", icon: ScheduleNavIcon, path: "/every-instructor/schedule" },
  { label: "Track", icon: TrackNavIcon, path: "/every-instructor/tracking" },
  { label: "Money", icon: MoneyNavIcon, path: "/every-instructor/pay" },
  { label: "Pupils", icon: PupilsNavIcon, path: "/every-instructor/pupils" },
  { label: "Menu", icon: MenuNavIcon, path: "/every-instructor/menu" },
];

export function EveryInstructorBottomNav() {
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <BottomNav tabs={tabs} onNavigate={handleNav} />;
}
