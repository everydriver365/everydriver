import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  CalendarDays,
  Radio,
  PoundSterling,
  Grid3X3,
} from "lucide-react";
import { MobilePortalNav, MobileNavItem } from "@/components/layout/MobilePortalNav";

const navItems: MobileNavItem[] = [
  { label: "Home", icon: Home, path: "/every-instructor" },
  { label: "Schedule", icon: CalendarDays, path: "/every-instructor/schedule" },
  { label: "Track", icon: Radio, path: "/every-instructor/tracking" },
  { label: "Money", icon: PoundSterling, path: "/every-instructor/pay" },
  { label: "More", icon: Grid3X3, path: "/every-instructor/menu" },
];

export function EveryInstructorBottomNav() {
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <MobilePortalNav
      items={navItems}
      layoutId="eiActiveTab"
      activeColor="text-[#0066FF]"
      inactiveColor="text-[#8E8E93]"
      bgClassName="bg-white border-t border-gray-200"
      pillClassName="bg-[#0066FF]"
      onNavigate={handleNav}
    />
  );
}
