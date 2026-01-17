import { useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  CalendarDays, 
  Users, 
  BriefcaseBusiness, 
  Wallet, 
  Navigation,
  Clock,
  Calendar,
  UserPlus,
  UserCheck,
  Send,
  History,
  CreditCard,
  Receipt,
  Play,
  MapPin,
  LucideIcon
} from "lucide-react";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItemMenu {
  label: string;
  icon: LucideIcon;
  path: string;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  showBadge?: boolean;
  menuItems?: NavItemMenu[];
}

const navItems: NavItem[] = [
  { 
    label: "Home", 
    icon: Home, 
    path: "/instructor",
    menuItems: [
      { label: "Dashboard", icon: Home, path: "/instructor" },
      { label: "Today's Schedule", icon: Clock, path: "/instructor/schedule" },
      { label: "Job Offers", icon: BriefcaseBusiness, path: "/instructor/jobs" },
    ]
  },
  { 
    label: "Schedule", 
    icon: CalendarDays, 
    path: "/instructor/schedule",
    menuItems: [
      { label: "Weekly View", icon: CalendarDays, path: "/instructor/schedule" },
      { label: "Today", icon: Clock, path: "/instructor/schedule" },
      { label: "Calendar", icon: Calendar, path: "/instructor/diary" },
    ]
  },
  { 
    label: "Track", 
    icon: Navigation, 
    path: "/instructor/track-lesson",
    menuItems: [
      { label: "Start Tracking", icon: Play, path: "/instructor/track-lesson" },
      { label: "Route Map", icon: MapPin, path: "/instructor/track-lesson" },
      { label: "Session History", icon: History, path: "/instructor/track-lesson" },
    ]
  },
  { 
    label: "Pupils", 
    icon: Users, 
    path: "/instructor/pupils",
    menuItems: [
      { label: "All Pupils", icon: Users, path: "/instructor/pupils" },
      { label: "Add New Pupil", icon: UserPlus, path: "/instructor/pupils" },
      { label: "Active Pupils", icon: UserCheck, path: "/instructor/pupils" },
    ]
  },
  { 
    label: "Jobs", 
    icon: BriefcaseBusiness, 
    path: "/instructor/jobs", 
    showBadge: true,
    menuItems: [
      { label: "Pending Jobs", icon: BriefcaseBusiness, path: "/instructor/jobs" },
      { label: "Accepted Jobs", icon: UserCheck, path: "/instructor/jobs" },
      { label: "Job History", icon: History, path: "/instructor/jobs" },
    ]
  },
  { 
    label: "Pay", 
    icon: Wallet, 
    path: "/instructor/pay",
    menuItems: [
      { label: "Take Payment", icon: CreditCard, path: "/instructor/pay" },
      { label: "Send Payment Link", icon: Send, path: "/instructor/pay" },
      { label: "Payment History", icon: History, path: "/instructor/pay" },
      { label: "Earnings", icon: Wallet, path: "/instructor/pay" },
      { label: "Expenses", icon: Receipt, path: "/instructor/expenses" },
    ]
  },
];

export function InstructorBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingJobsCount = usePendingJobsCount();

  const handleNavClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-primary-foreground/10 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.15)] md:hidden">
      <div className="flex items-center justify-around h-16 w-full px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showNotification = item.showBadge && pendingJobsCount > 0;
          
          return (
            <DropdownMenu key={item.path}>
              <DropdownMenuTrigger asChild>
                <button
                  className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {/* Active indicator pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full"
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
                      <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-primary">
                        {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] tracking-tight transition-all duration-200 ${
                    isActive ? "font-semibold" : "font-medium opacity-80"
                  }`}>
                    {item.label}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                side="top" 
                sideOffset={8}
                className="w-48 bg-white dark:bg-gray-800 z-[60]"
              >
                <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {item.menuItems?.map((menuItem, index) => (
                  <DropdownMenuItem 
                    key={index}
                    onClick={() => handleNavClick(menuItem.path)}
                    className="cursor-pointer"
                  >
                    <menuItem.icon className="mr-2 h-4 w-4" />
                    {menuItem.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-primary" />
    </nav>
  );
}
