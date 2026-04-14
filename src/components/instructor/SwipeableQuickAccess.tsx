import { useState, useCallback, useEffect } from "react";
import { QuickActionsPopoverMenu } from "@/components/instructor/QuickActionsPopoverMenu";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import {
  CalendarDays, Users, MapPin, PoundSterling, Navigation,
  Car, Lightbulb, Crown, CalendarPlus, ListTodo,
  Wrench, Fuel, ClipboardCheck, ArrowLeftRight, Target,
  MessageSquare, MapPinned, BookOpen, Settings,
  Gift, Clock, Receipt, Plus, FileBarChart, BarChart3, Moon, Megaphone, Lock,
} from "lucide-react";
import expensesIcon from "@/assets/expenses-icon.png";
import trackLessonIcon from "@/assets/track-lesson-icon.png";
import planAheadIcon from "@/assets/plan-ahead-icon.png";
import yourPlanIcon from "@/assets/your-plan-icon.png";
import fillGapsIcon from "@/assets/fill-gaps-icon.png";
import todoIcon from "@/assets/todo-icon.png";
import vehicleHealthIcon from "@/assets/vehicle-health-icon.png";
import takePaymentIcon from "@/assets/take-payment-icon.png";
import agendaIcon from "@/assets/agenda-icon.png";
import pupilsIcon from "@/assets/pupils-icon.png";
import findMyCarIcon from "@/assets/find_car2.png";
import availabilityIcon from "@/assets/availability-icon.png";
import referralsIcon from "@/assets/referrals-icon.png";
import cpdIcon from "@/assets/cpd-icon.png";
import settingsIcon from "@/assets/settings-icon.png";
import locationsIcon from "@/assets/locations-icon.png";
import fuelIcon from "@/assets/fuel-icon.png";
import satnavIcon from "@/assets/satnav-icon.svg";
import messagesIcon from "@/assets/messages-icon.png";
import testResultIcon from "@/assets/test-result-icon.png";
import testSwapIcon from "@/assets/test-swap-icon.png";
import standardsCheckIcon from "@/assets/standards-check-icon.png";
import monthEndIcon from "@/assets/month-end-icon.png";
import weeklyReportIcon from "@/assets/weekly-report-icon.png";
import tasksDueIcon from "@/assets/tasks-due-icon.png";
import endOfDayIcon from "@/assets/end-of-day-icon.png";
import waitingRoomIcon from "@/assets/waiting-room-icon.png";
interface QuickTile {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  customIcon?: string;
  accent: string;
  route: string;
  quickAction?: string;
  requiredFeature?: string;
}

// Map tiles to required features
const TILE_FEATURE_MAP: Record<string, string> = {
  "Track Lesson": "telematics",
  "Take Payment": "payment_tracking",
  "Find My Car": "telematics",
  "Vehicle Health": "telematics",
  "Fill Gaps": "sms_notifications",
  "SatNav": "telematics",
  "Expenses": "expense_tracking",
  "Month End": "payment_tracking",
};

const quickActionRoutes: Record<string, string> = {
  "Agenda": "/instructor/schedule?action=add",
  "Pupils": "/instructor/pupils?action=add",
  "Track Lesson": "/instructor/tracking",
  "Take Payment": "/instructor/take-payment",
  "Fill Gaps": "/instructor/gaps?action=add",
  "To Do": "/instructor/todos?action=add",
  "Log Test Result": "/instructor/test-results?action=add",
  "Messages": "/instructor/messages?action=new",
  "CPD Log": "/instructor/cpd?action=add",
  "Referrals": "/instructor/referrals?action=invite",
  "Availability": "/instructor/availability?action=add",
  "Expenses": "/instructor/expenses?action=add",
};

const ALL_TILES: QuickTile[] = [
  { title: "Agenda", subtitle: "Your schedule", icon: CalendarDays, customIcon: agendaIcon, accent: "#007AFF", route: "/instructor/schedule" },
  { title: "Pupils", subtitle: "Manage learners", icon: Users, customIcon: pupilsIcon, accent: "#34C759", route: "/instructor/pupils" },
  { title: "Track Lesson", subtitle: "Start GPS", icon: MapPin, customIcon: trackLessonIcon, accent: "#FF3B30", route: "/instructor/tracking" },
  { title: "Take Payment", subtitle: "Record payment", icon: PoundSterling, customIcon: takePaymentIcon, accent: "#AF52DE", route: "/instructor/pay" },
  { title: "SatNav", subtitle: "Navigation", icon: Navigation, customIcon: satnavIcon, accent: "#007AFF", route: "/instructor/satnav" },
  { title: "Find My Car", subtitle: "Last position", icon: Car, customIcon: findMyCarIcon, accent: "#FF9500", route: "/instructor/find-my-car" },
  { title: "Plan Ahead", subtitle: "Tomorrow", icon: Lightbulb, customIcon: planAheadIcon, accent: "#FFCC00", route: "/instructor/diary" },
  { title: "Your Plan", subtitle: "Subscription", icon: Crown, customIcon: yourPlanIcon, accent: "#AF52DE", route: "/instructor/plans" },
  { title: "Fill Gaps", subtitle: "Open slots", icon: CalendarPlus, customIcon: fillGapsIcon, accent: "#FF2D55", route: "/instructor/gaps" },
  { title: "To Do", subtitle: "Task list", icon: ListTodo, customIcon: todoIcon, accent: "#5AC8FA", route: "/instructor/todos" },
  { title: "Vehicle Health", subtitle: "MOT & service", icon: Wrench, customIcon: vehicleHealthIcon, accent: "#8E8E93", route: "/instructor/vehicle-health" },
  { title: "Find Fuel", subtitle: "Nearby stations", icon: Fuel, customIcon: fuelIcon, accent: "#34C759", route: "/instructor/fuel" },
  { title: "Log Test Result", subtitle: "Record result", icon: ClipboardCheck, customIcon: testResultIcon, accent: "#007AFF", route: "/instructor/test-results" },
  { title: "Test Swap", subtitle: "Exchange dates", icon: ArrowLeftRight, customIcon: testSwapIcon, accent: "#FF9500", route: "/instructor/test-requests" },
  { title: "Standards Check", subtitle: "DVSA triggers", icon: Target, customIcon: standardsCheckIcon, accent: "#FF3B30", route: "/instructor/standards-check" },
  { title: "Messages", subtitle: "Chat", icon: MessageSquare, customIcon: messagesIcon, accent: "#007AFF", route: "/instructor/messages" },
  { title: "Find Nearby", subtitle: "Toilets, food & more", icon: MapPin, accent: "#0EA5E9", route: "/instructor/find-nearby" },
  { title: "Locations", subtitle: "Saved places", icon: MapPinned, customIcon: locationsIcon, accent: "#FF3B30", route: "/instructor/locations" },
  { title: "CPD Log", subtitle: "Training hours", icon: BookOpen, customIcon: cpdIcon, accent: "#5856D6", route: "/instructor/cpd" },
  { title: "Settings", subtitle: "Preferences", icon: Settings, customIcon: settingsIcon, accent: "#8E8E93", route: "/instructor/settings" },
  { title: "Referrals", subtitle: "Earn rewards", icon: Gift, customIcon: referralsIcon, accent: "#FF2D55", route: "/instructor/referrals" },
  { title: "Availability", subtitle: "Working hours", icon: Clock, customIcon: availabilityIcon, accent: "#34C759", route: "/instructor/availability" },
  { title: "Expenses", subtitle: "Track costs", icon: Receipt, customIcon: expensesIcon, accent: "#FF9500", route: "/instructor/expenses" },
  { title: "Nearby ADIs", subtitle: "Friends map", icon: Users, accent: "#5856D6", route: "/instructor/nearby-friends" },
  { title: "Month End", subtitle: "Review & submit", icon: FileBarChart, customIcon: monthEndIcon, accent: "#5856D6", route: "/instructor/month-end" },
  { title: "Weekly Report", subtitle: "AI summary", icon: BarChart3, customIcon: weeklyReportIcon, accent: "#7C3AED", route: "/instructor/weekly-report" },
  { title: "Tasks Due", subtitle: "Outstanding", icon: ClipboardCheck, customIcon: tasksDueIcon, accent: "#EA580C", route: "/instructor/outstanding-tasks" },
  { title: "End of Day", subtitle: "Day summary", icon: Moon, customIcon: endOfDayIcon, accent: "#6366F1", route: "/instructor/end-of-day" },
  { title: "Waiting Room", subtitle: "Weekly Zoom", icon: Users, customIcon: waitingRoomIcon, accent: "#2563EB", route: "/instructor/waiting-room" },
  { title: "Platform Updates", subtitle: "News & ideas", icon: Megaphone, accent: "#6366F1", route: "/instructor/platform-updates" },
];

const TILES_PER_PAGE = 6;

export function SwipeableQuickAccess() {
  const navigate = useNavigate();
  const { subscription } = useInstructorAuth();
  const features = subscription?.features || [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quickActionsMenuOpen, setQuickActionsMenuOpen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const pages: QuickTile[][] = [];
  for (let i = 0; i < ALL_TILES.length; i += TILES_PER_PAGE) {
    pages.push(ALL_TILES.slice(i, i + TILES_PER_PAGE));
  }

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {pages.map((page, pageIdx) => (
            <div key={pageIdx} className="flex-[0_0_100%] min-w-0">
              <div className="grid grid-cols-2 gap-4">
                {page.map((tile) => {
                  const Icon = tile.icon;
                  const requiredFeature = TILE_FEATURE_MAP[tile.title];
                  const locked = requiredFeature ? !features.includes(requiredFeature) : false;

                  const handleClick = () => {
                    if (locked) {
                      toast.info(`${tile.title} requires a plan upgrade`, {
                        action: { label: "View Plans", onClick: () => navigate("/instructor/plans") },
                      });
                      return;
                    }
                    navigate(tile.route);
                  };

                  return (
                    <motion.button
                      key={tile.title}
                      whileTap={{ scale: locked ? 1 : 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={handleClick}
                      className="relative text-left flex flex-col justify-between"
                      style={{
                        height: 110,
                        padding: 20,
                        backgroundColor: "#FFFFFF",
                        borderRadius: 22,
                        border: "1px solid #DAE4E1",
                        boxShadow: "0 2px 12px rgba(15, 70, 60, 0.06), 0 1px 4px rgba(15, 70, 60, 0.03)",
                        opacity: locked ? 0.5 : 1,
                      }}
                    >
                      {/* Lock overlay */}
                      {locked && (
                        <div className="absolute top-3 right-3 z-10">
                          <Lock className="h-3.5 w-3.5" style={{ color: "#6A7A78" }} />
                        </div>
                      )}
                      {/* Green plus button */}
                      {!locked && quickActionRoutes[tile.title] && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickActionsMenuOpen(true);
                          }}
                          className="absolute bottom-2.5 left-2.5 w-5 h-5 rounded-full flex items-center justify-center active:scale-90 transition-transform z-10"
                          style={{ backgroundColor: "rgba(15, 118, 110, 0.12)" }}
                        >
                          <Plus className="h-3 w-3" style={{ color: "#0F766E" }} strokeWidth={2} />
                        </div>
                      )}
                      <div>
                        <p className="text-[16px] font-bold leading-tight" style={{ color: "#12263A" }}>
                          {tile.title}
                        </p>
                        <p className="text-[13px] mt-0.5" style={{ color: "#6A7A78" }}>
                          {tile.subtitle}
                        </p>
                      </div>
                      <div className="self-end">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(15, 118, 110, 0.08)" }}>
                          {tile.customIcon ? (
                            <img src={tile.customIcon} alt={tile.title} className="w-6 h-6 object-contain" />
                          ) : (
                            <Icon size={22} strokeWidth={1.6} style={{ color: "#0F766E" }} />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {pages.map((_, idx) => (
          <div
            key={idx}
            className="transition-all duration-300 ease-in-out"
            style={{
              width: idx === selectedIndex ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: idx === selectedIndex ? "#0F766E" : "#DAE4E1",
            }}
          />
        ))}
      </div>

      <QuickActionsPopoverMenu
        open={quickActionsMenuOpen}
        onClose={() => setQuickActionsMenuOpen(false)}
      />
    </div>
  );
}
