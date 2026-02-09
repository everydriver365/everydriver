import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useInstructorTilePreferences } from "@/hooks/useInstructorTilePreferences";
import { useInstructorHomepageContent, QuickAction } from "@/hooks/useInstructorHomepageContent";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";
import { cn } from "@/lib/utils";

// Import icon images from QuickActionTiles (duplicated mapping for decoupling)
import messagesIcon from "@/assets/messages-icon.png";
import paymentsIcon from "@/assets/payments-icon-new.png";
import takePaymentIcon from "@/assets/take-payment-icon.png";
import scheduleIcon from "@/assets/schedule-icon.png";
import pupilsIcon from "@/assets/pupils-icon.png";
import trackIcon from "@/assets/track-icon.png";
import satnavIcon from "@/assets/satnav-icon.png";
import findMyCarIcon from "@/assets/find_car2.png";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import availabilityIcon from "@/assets/availability-icon.png";
import healthHubIcon from "@/assets/health-hub-icon.png";
import findFuelIcon from "@/assets/find-fuel-icon.png";
import vehicleHealthIcon from "@/assets/vehicle-health-icon.png";
import expensesIcon from "@/assets/expenses-icon.png";
import todoIcon from "@/assets/todo-icon.png";
import settingsIcon from "@/assets/settings-icon.png";
import {
  Calendar, Users, Briefcase, CreditCard, Clock, Settings, Car, Receipt,
  Navigation, Award, MapPin, MessageSquare, Heart, ListTodo,
} from "lucide-react";

const customIconImages: Record<string, string> = {
  messages: messagesIcon, "take-payment": takePaymentIcon, payments: paymentsIcon,
  schedule: scheduleIcon, pupils: pupilsIcon, "track-lesson": trackIcon,
  satnav: satnavIcon, "find-my-car": findMyCarIcon, jobs: jobOffersIcon,
  availability: availabilityIcon, "health-hub": healthHubIcon, "find-fuel": findFuelIcon,
  "vehicle-health": vehicleHealthIcon, expenses: expensesIcon, todos: todoIcon,
  settings: settingsIcon,
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar, Users, Briefcase, CreditCard, Clock, Settings, Car, Receipt,
  Navigation, Award, MapPin, MessageSquare, Heart, Fuel: Car, ListTodo,
};

const additionalTiles: QuickAction[] = [
  { id: "fill-gaps", title: "Fill Gaps", icon: "Calendar", route: "/instructor/gaps", display_order: 98 },
  { id: "todos", title: "To Do", icon: "ListTodo", route: "/instructor/todos", display_order: 99 },
  { id: "vehicle-health", title: "Vehicle", icon: "Car", route: "/instructor/vehicle-health", display_order: 100 },
  { id: "find-fuel", title: "Find Fuel", icon: "Fuel", route: "/instructor/fuel", display_order: 100.5 },
  { id: "test-results", title: "Test Result", icon: "Award", route: "/instructor/test-results", display_order: 101 },
  { id: "messages", title: "Messages", icon: "MessageSquare", route: "/instructor/messages", display_order: 102 },
  { id: "locations", title: "Locations", icon: "MapPin", route: "/instructor/locations", display_order: 103 },
  { id: "cpd-log", title: "CPD Log", icon: "Award", route: "/instructor/cpd", display_order: 104 },
  { id: "settings", title: "Settings", icon: "Settings", route: "/instructor/settings", display_order: 105 },
  { id: "referrals", title: "Referrals", icon: "Users", route: "/instructor/referrals", display_order: 106 },
  { id: "availability", title: "Availability", icon: "Clock", route: "/instructor/availability", display_order: 106 },
  { id: "expenses", title: "Expenses", icon: "Receipt", route: "/instructor/expenses", display_order: 107 },
];

interface AppStyleHomeViewProps {
  instructorId: string | undefined;
  heroImageUrl: string | null;
  wallpaperColor: string | null;
  profileImageUrl?: string | null;
}

export function AppStyleHomeView({
  instructorId,
  heroImageUrl,
  wallpaperColor,
  profileImageUrl,
}: AppStyleHomeViewProps) {
  const navigate = useNavigate();
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { data: unreadCount = 0 } = useUnreadMessagesCount(instructorId);
  const pendingJobsCount = usePendingJobsCount();
  const { content } = useInstructorHomepageContent();
  const { getOrderedTiles } = useInstructorTilePreferences(instructorId);

  const heroSrc = heroImageUrl || instructorHeroImg;
  const hoursThisWeek = weeklyGoals?.hoursThisWeek ?? 0;
  const hoursGoal = weeklyGoals?.hoursGoal ?? 30;
  const hoursRemaining = Math.max(0, hoursGoal - hoursThisWeek);
  const progressPercent = weeklyGoals?.progressPercent ?? 0;

  const orderedTiles = getOrderedTiles(content?.quick_actions || [], additionalTiles);

  const getBadgeCount = (action: QuickAction): number => {
    if (action.route === "/instructor/jobs" || action.title.toLowerCase().includes("job")) return pendingJobsCount;
    if (action.route === "/instructor/messages" || action.title.toLowerCase().includes("message")) return unreadCount;
    return 0;
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: wallpaperColor || "#E8F1FE" }}>
      {/* ── Hero Section ── */}
      <div className="relative w-full" style={{ height: "35vh", minHeight: 240 }}>
        <img src={heroSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Profile avatar top-right */}
        {profileImageUrl && (
          <div className="absolute top-4 right-4 z-10">
            <img
              src={profileImageUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-white/60 object-cover shadow-lg"
            />
          </div>
        )}

        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-white/80 text-xs font-medium tracking-wide uppercase mb-1"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              Weekly Progress
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-white text-3xl font-bold"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                {hoursThisWeek}h
              </span>
              <span className="text-white/70 text-lg font-medium">/ {hoursGoal}h</span>
            </div>
            <p className="text-white/60 text-xs mt-0.5"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
              {hoursRemaining > 0 ? `${hoursRemaining.toFixed(1)} hours remaining` : "Goal reached! 🎉"}
            </p>

            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progressPercent)}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Glassmorphism Container ── */}
      <div className="relative -mt-4 z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-3 rounded-2xl border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div className="p-4">
            {/* 4-column icon grid */}
            <div className="grid grid-cols-4 gap-x-3 gap-y-4">
              {orderedTiles.map((action, index) => {
                const badgeCount = getBadgeCount(action);
                const hasCustomIcon = !!customIconImages[action.id];
                const FallbackIcon = iconMap[action.icon] || Calendar;

                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.03 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(action.route)}
                    className="flex flex-col items-center gap-1.5 relative"
                  >
                    {/* Icon tile */}
                    <div
                      className={cn(
                        "relative w-14 h-14 rounded-[16px] flex items-center justify-center overflow-hidden",
                        "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
                        !hasCustomIcon && "bg-primary/10"
                      )}
                    >
                      {hasCustomIcon ? (
                        <img
                          src={customIconImages[action.id]}
                          alt={action.title}
                          className="w-full h-full object-cover rounded-[16px]"
                        />
                      ) : (
                        <FallbackIcon className="h-6 w-6 text-primary" />
                      )}

                      {/* Notification badge */}
                      {badgeCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-sm"
                        >
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </motion.span>
                      )}
                    </div>

                    {/* Label */}
                    <span className="text-[11px] font-medium text-foreground/80 leading-tight text-center line-clamp-1 max-w-[60px]">
                      {action.title}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom spacing */}
      <div className="h-24" />
    </div>
  );
}
