import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Home, 
  CalendarDays, 
  Users, 
  Navigation,
  MessageCircle,
  PoundSterling,
  Grid3X3,
  LucideIcon
} from "lucide-react";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { motion } from "framer-motion";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { MessageNotificationBadge } from "@/components/instructor/MessageNotificationBadge";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  showBadge?: boolean;
  isMessages?: boolean;
  isTrack?: boolean;
}

const navItems: NavItem[] = [
  { 
    label: "Home", 
    icon: Home, 
    path: "/instructor"
  },
  { 
    label: "Schedule", 
    icon: CalendarDays, 
    path: "/instructor/schedule"
  },
  { 
    label: "Track", 
    icon: Navigation, 
    path: "/instructor/traccar",
    isTrack: true
  },
  { 
    label: "Pay", 
    icon: PoundSterling, 
    path: "/instructor/pay"
  },
  { 
    label: "Pupils", 
    icon: Users, 
    path: "/instructor/pupils"
  },
  { 
    label: "Messages", 
    icon: MessageCircle, 
    path: "/instructor/messages",
    isMessages: true
  },
];

export function InstructorBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingJobsCount = usePendingJobsCount();
  const { instructor } = useInstructorAuth();
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  // Check if there's an active tracking session
  useEffect(() => {
    if (!instructor?.id) return;

    const checkActiveSession = async () => {
      const { data } = await supabase
        .from("traccar_devices")
        .select("current_session_id")
        .eq("instructor_id", instructor.id)
        .not("current_session_id", "is", null)
        .limit(1);

      setIsTrackingActive((data?.length ?? 0) > 0);
    };

    checkActiveSession();

    // Poll every 10 seconds
    const interval = setInterval(checkActiveSession, 10000);
    return () => clearInterval(interval);
  }, [instructor?.id]);

  const handleNavClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card/95 dark:backdrop-blur-md border-t border-border shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.1)] md:hidden">
      <div className="flex items-center justify-around h-16 w-full px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showNotification = item.showBadge && pendingJobsCount > 0;
          const isMessages = item.isMessages;
          const isTrack = item.isTrack;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : isMessages
                  ? "text-cyan-500"
                  : "text-foreground/70 hover:text-foreground dark:text-white/70 dark:hover:text-white"
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
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-white">
                    {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                  </span>
                )}
                {isMessages && (
                  <MessageNotificationBadge 
                    instructorId={instructor?.id} 
                    className="absolute -top-1.5 -right-2 text-[10px] px-1 min-w-[18px] h-[18px] flex items-center justify-center ring-2 ring-white"
                  />
                )}
                {isTrack && isTrackingActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className={`text-[11px] tracking-tight transition-all duration-200 ${
                isActive ? "font-semibold" : isMessages ? "font-medium text-cyan-500" : "font-medium opacity-80"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Menu launcher button - bottom right */}
        <button
          onClick={() => navigate("/instructor/menu")}
          className="absolute bottom-20 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all duration-200 active:scale-95"
        >
          <Grid3X3 className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-white dark:bg-card/95" />
    </nav>
  );
}
