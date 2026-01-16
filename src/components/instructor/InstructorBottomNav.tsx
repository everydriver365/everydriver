import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  CalendarDays, 
  Users, 
  BriefcaseBusiness, 
  Wallet, 
  Settings,
  Navigation
} from "lucide-react";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { motion } from "framer-motion";

const navItems = [
  { label: "Home", icon: Home, path: "/instructor" },
  { label: "Schedule", icon: CalendarDays, path: "/instructor/schedule" },
  { label: "Track", icon: Navigation, path: "/instructor/track-lesson" },
  { label: "Pupils", icon: Users, path: "/instructor/pupils" },
  { label: "Jobs", icon: BriefcaseBusiness, path: "/instructor/jobs", showBadge: true },
  { label: "Pay", icon: Wallet, path: "/instructor/pay" },
];

export function InstructorBottomNav() {
  const location = useLocation();
  const pendingJobsCount = usePendingJobsCount();

  const handleNavClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.15)] md:hidden">
      <div className="flex items-center justify-around h-16 w-full px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showNotification = item.showBadge && pendingJobsCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {/* Active indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <item.icon
                    className={`h-5 w-5 transition-all duration-200 ${
                      isActive ? 'drop-shadow-sm' : ''
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
                {showNotification && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-background">
                    {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                  </span>
                )}
              </div>
              <span className={`text-[11px] tracking-tight transition-all duration-200 ${
                isActive ? "font-semibold" : "font-medium opacity-80"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
}
