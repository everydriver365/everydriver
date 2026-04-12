import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  CalendarDays,
  Radio,
  PoundSterling,
  Grid3X3,
  LucideIcon,
} from "lucide-react";
import { haptics } from "@/lib/haptics";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const navItems: NavItem[] = [
  { label: "Home", icon: Home, path: "/every-instructor" },
  { label: "Schedule", icon: CalendarDays, path: "/every-instructor/schedule" },
  { label: "Track", icon: Radio, path: "/every-instructor/tracking" },
  { label: "Money", icon: PoundSterling, path: "/every-instructor/pay" },
  { label: "More", icon: Grid3X3, path: "/every-instructor/menu" },
];

const ACTIVE_COLOR = "#0066FF";
const INACTIVE_COLOR = "#8E8E93";

export function EveryInstructorBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    haptics.selection();
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200">
      <div className="flex items-center justify-around h-16 w-full px-1">
        {navItems.map((item) => {
          const isActive =
            item.path === "/every-instructor"
              ? location.pathname === "/every-instructor"
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="eiActiveTab"
                    className="absolute -inset-1.5 rounded-full"
                    style={{ backgroundColor: `${ACTIVE_COLOR}14` }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon
                  className="h-5 w-5 relative z-10"
                  strokeWidth={isActive ? 2.2 : 1.6}
                  color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                />
              </div>
              <span
                className="text-[11px] font-semibold"
                style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}
