import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useInstructorTilePreferences } from "@/hooks/useInstructorTilePreferences";
import { BottomPromoGroup } from "@/components/instructor/BottomPromoGroup";
import { useInstructorHomepageContent, QuickAction } from "@/hooks/useInstructorHomepageContent";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";
import { cn } from "@/lib/utils";

function getContrastTextColor(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.9)";
}

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
import monthEndIcon from "@/assets/month-end-icon.png";
import weeklyReportIcon from "@/assets/weekly-report-icon.png";
import tasksDueIcon from "@/assets/tasks-due-icon.png";
import {
  Calendar, Users, Briefcase, CreditCard, Clock, Settings, Car, Receipt,
  Navigation, Award, MapPin, MessageSquare, Heart, ListTodo, FileBarChart, BarChart3, ClipboardCheck,
} from "lucide-react";

const customIconImages: Record<string, string> = {
  messages: messagesIcon, "take-payment": takePaymentIcon, payments: paymentsIcon,
  schedule: scheduleIcon, pupils: pupilsIcon, "track-lesson": trackIcon,
  satnav: satnavIcon, "find-my-car": findMyCarIcon, jobs: jobOffersIcon,
  availability: availabilityIcon, "health-hub": healthHubIcon, "find-fuel": findFuelIcon,
  "vehicle-health": vehicleHealthIcon, expenses: expensesIcon, todos: todoIcon,
  settings: settingsIcon, "month-end": monthEndIcon, "weekly-report": weeklyReportIcon,
  "tasks-due": tasksDueIcon,
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar, Users, Briefcase, CreditCard, Clock, Settings, Car, Receipt,
  Navigation, Award, MapPin, MessageSquare, Heart, Fuel: Car, ListTodo, FileBarChart, BarChart3, ClipboardCheck,
};

const additionalTiles: QuickAction[] = [
  { id: "fill-gaps", title: "Fill Gaps", icon: "Calendar", route: "/instructor/gaps", display_order: 98 },
  { id: "todos", title: "To Do", icon: "ListTodo", route: "/instructor/todos", display_order: 99 },
  { id: "vehicle-health", title: "Vehicle", icon: "Car", route: "/instructor/vehicle-health", display_order: 100 },
  { id: "find-fuel", title: "Find Fuel", icon: "Fuel", route: "/instructor/fuel", display_order: 100.5 },
  { id: "test-results", title: "Test Result", icon: "Award", route: "/instructor/test-results", display_order: 101 },
  { id: "test-requests", title: "Test Swap", icon: "Award", route: "/instructor/test-requests", display_order: 101.5 },
  { id: "messages", title: "Messages", icon: "MessageSquare", route: "/instructor/messages", display_order: 102 },
  { id: "locations", title: "Locations", icon: "MapPin", route: "/instructor/locations", display_order: 103 },
  { id: "cpd-log", title: "CPD Log", icon: "Award", route: "/instructor/cpd", display_order: 104 },
  { id: "settings", title: "Settings", icon: "Settings", route: "/instructor/settings", display_order: 105 },
  { id: "referrals", title: "Referrals", icon: "Users", route: "/instructor/referrals", display_order: 106 },
  { id: "availability", title: "Availability", icon: "Clock", route: "/instructor/availability", display_order: 106 },
  { id: "expenses", title: "Expenses", icon: "Receipt", route: "/instructor/expenses", display_order: 107 },
  { id: "nearby-adis", title: "Nearby ADIs", icon: "Users", route: "/instructor/nearby-friends", display_order: 108 },
  { id: "month-end", title: "Month End", icon: "FileBarChart", route: "/instructor/month-end", display_order: 109 },
  { id: "weekly-report", title: "Weekly Report", icon: "BarChart3", route: "/instructor/weekly-report", display_order: 110 },
  { id: "tasks-due", title: "Tasks Due", icon: "ClipboardCheck", route: "/instructor/outstanding-tasks", display_order: 111 },
  { id: "end-of-day", title: "End of Day", icon: "Moon", route: "/instructor/end-of-day", display_order: 112 },
  { id: "pipeline", title: "Pipeline", icon: "Briefcase", route: "/instructor/pipeline", display_order: 113 },
  { id: "automations", title: "Automations", icon: "Zap", route: "/instructor/automations", display_order: 114 },
  { id: "find-nearby", title: "Find Nearby", icon: "MapPin", route: "/instructor/find-nearby", display_order: 114.5 },
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
    <div className="flex-1 flex flex-col" style={{ backgroundColor: wallpaperColor || "#F4F7F6" }}>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-20">
        <div className="grid grid-cols-4 gap-x-4 gap-y-5">
          {orderedTiles.map((action, index) => {
            const badgeCount = getBadgeCount(action);
            const hasCustomIcon = !!customIconImages[action.id];
            const FallbackIcon = iconMap[action.icon] || Calendar;

            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.05 + index * 0.025 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(action.route)}
                className="flex flex-col items-center gap-1.5 relative"
              >
                <div
                  className={cn(
                    "relative w-[60px] h-[60px] rounded-2xl flex items-center justify-center overflow-hidden",
                  )}
                >
                  {hasCustomIcon ? (
                    <img
                      src={customIconImages[action.id]}
                      alt={action.title}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <FallbackIcon className="h-7 w-7 text-primary" />
                  )}

                  {badgeCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center shadow-sm"
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </motion.span>
                  )}
                </div>

                <span
                  className="text-[11px] font-medium leading-tight text-center line-clamp-1 max-w-[64px]"
                  style={{ color: getContrastTextColor(wallpaperColor || "#F4F7F6") }}
                >
                  {action.title}
                </span>
              </motion.button>
            );
          })}
        </div>
        <BottomPromoGroup className="mt-6" />
      </div>
    </div>
  );
}
