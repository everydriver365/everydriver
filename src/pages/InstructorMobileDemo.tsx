import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, Clock, PoundSterling, ChevronDown,
  MapPin, Car, Loader2, BookOpen, ArrowLeft,
  Sun, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudFog, CloudLightning, Snowflake, Wind,
} from "lucide-react";
import { format, parse, isToday, isTomorrow, parseISO } from "date-fns";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useInstructorHomepageContent } from "@/hooks/useInstructorHomepageContent";
import { useInstructorTilePreferences } from "@/hooks/useInstructorTilePreferences";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { PupilAvatar } from "@/components/instructor/PupilAvatar";
import { PaymentStatusBadge } from "@/components/instructor/PaymentStatusBadge";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";

// Custom icon images
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
import { QuickAction } from "@/hooks/useInstructorHomepageContent";

const customIconImages: Record<string, string> = {
  messages: messagesIcon,
  "take-payment": takePaymentIcon,
  payments: paymentsIcon,
  schedule: scheduleIcon,
  pupils: pupilsIcon,
  "track-lesson": trackIcon,
  satnav: satnavIcon,
  "find-my-car": findMyCarIcon,
  jobs: jobOffersIcon,
  availability: availabilityIcon,
  "health-hub": healthHubIcon,
  "find-fuel": findFuelIcon,
  "vehicle-health": vehicleHealthIcon,
  expenses: expensesIcon,
  todos: todoIcon,
  settings: settingsIcon,
};

const customIconRadius: Record<string, string> = {
  "find-my-car": "7px",
  jobs: "7px",
  "take-payment": "7px",
  payments: "7px",
  availability: "7px",
  "health-hub": "7px",
  "find-fuel": "7px",
  "vehicle-health": "7px",
  expenses: "7px",
  todos: "7px",
  settings: "7px",
};

// Weather icon helper
const WeatherIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const iconMap: Record<string, React.ElementType> = {
    Sun, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudFog, CloudLightning, Snowflake, Wind,
  };
  const IconComponent = iconMap[icon] || Cloud;
  return <IconComponent className={className} />;
};

const additionalTiles: QuickAction[] = [
  { id: "todos", title: "To Do", icon: "ListTodo", route: "/instructor/todos", display_order: 99 },
  { id: "vehicle-health", title: "Vehicle Health", icon: "Car", route: "/instructor/vehicle-health", display_order: 100 },
  { id: "find-fuel", title: "Find Fuel", icon: "Fuel", route: "/instructor/fuel", display_order: 100.5 },
  { id: "test-results", title: "Log Test Result", icon: "Award", route: "/instructor/test-results", display_order: 101 },
  { id: "messages", title: "Messages", icon: "MessageSquare", route: "/instructor/messages", display_order: 102 },
  { id: "locations", title: "Locations", icon: "MapPin", route: "/instructor/locations", display_order: 103 },
  { id: "cpd-log", title: "CPD Log", icon: "Award", route: "/instructor/cpd", display_order: 104 },
  { id: "settings", title: "Settings", icon: "Settings", route: "/instructor/settings", display_order: 105 },
  { id: "availability", title: "Availability", icon: "Clock", route: "/instructor/availability", display_order: 106 },
  { id: "expenses", title: "Expenses", icon: "Receipt", route: "/instructor/expenses", display_order: 107 },
];

// Mock data for when not authenticated
const mockNextLesson = {
  lessonId: "mock-1",
  pupilId: "mock-p1",
  pupilName: "Sarah Johnson",
  pupilProfileImage: null,
  pupilPhone: "07700900123",
  lessonDate: format(new Date(), "yyyy-MM-dd"),
  startTime: "10:30:00",
  minutesUntil: 25,
  pickupPostcode: "SW1A 1AA",
  pickupLocation: "10 Downing Street",
  accountBalance: 120,
  prepaidHours: 0,
  durationMinutes: 120,
};

const mockTodayOverview = {
  lessonCount: 4,
  totalHours: 6,
  expectedEarnings: 240,
  completedLessons: 1,
};

const mockWeeklyGoals = {
  hoursThisWeek: 13.5,
  hoursLastWeek: 28,
  hoursGoal: 30,
  lessonsThisWeek: 18,
  earningsThisWeek: 540,
  earningsLastWeek: 1120,
  progressPercent: 45,
  isAheadOfLastWeek: false,
  dayOfWeek: new Date().getDay(),
  expectedPace: 57,
};

const mockTiles: QuickAction[] = [
  { id: "schedule", title: "Today", icon: "Calendar", route: "/instructor/schedule", display_order: 1 },
  { id: "jobs", title: "Job Offers", icon: "Briefcase", route: "/instructor/jobs", display_order: 2 },
  { id: "messages", title: "Messages", icon: "MessageSquare", route: "/instructor/messages", display_order: 3 },
  { id: "payments", title: "Wallet", icon: "CreditCard", route: "/instructor/money", display_order: 4 },
  { id: "track-lesson", title: "Track Lesson", icon: "Car", route: "/instructor/track", display_order: 5 },
  { id: "satnav", title: "Sat Nav", icon: "Navigation", route: "/instructor/satnav", display_order: 6 },
  { id: "take-payment", title: "Take Payment", icon: "CreditCard", route: "/instructor/money", display_order: 7 },
  { id: "availability", title: "Availability", icon: "Clock", route: "/instructor/availability", display_order: 8 },
  { id: "find-my-car", title: "Find My Car", icon: "MapPin", route: "/instructor/find-car", display_order: 9 },
  { id: "find-fuel", title: "Find Fuel", icon: "Fuel", route: "/instructor/fuel", display_order: 10 },
  { id: "health-hub", title: "Health Hub", icon: "Heart", route: "/instructor/health", display_order: 11 },
  { id: "pupils", title: "Pupils", icon: "Users", route: "/instructor/pupils", display_order: 12 },
];

export default function InstructorMobileDemo() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;

  const { data: liveNextLesson } = useNextLessonDetails(instructorId);
  const { data: liveWeeklyGoals } = useWeeklyGoals(instructorId);
  const { data: liveTodayOverview } = useTodayOverview(instructorId);
  const { content } = useInstructorHomepageContent();
  const pendingJobsCount = usePendingJobsCount();
  const { data: unreadCount = 0 } = useUnreadMessagesCount(instructorId);
  const { currentWeather } = useDrivingAlerts(instructorId);
  const { getOrderedTiles } = useInstructorTilePreferences(instructorId);

  // Use live data if available, fallback to mock
  const nextLesson = liveNextLesson || mockNextLesson;
  const weeklyGoals = liveWeeklyGoals || mockWeeklyGoals;
  const todayOverview = liveTodayOverview || mockTodayOverview;
  
  const quickActions = content?.quick_actions || [];
  const liveOrderedTiles = getOrderedTiles(quickActions, additionalTiles);
  const orderedTiles = liveOrderedTiles.length > 0 ? liveOrderedTiles : mockTiles;

  const { durationText: etaText, trafficCondition, isLoading: etaLoading } = useTrafficETA(nextLesson?.pickupPostcode);

  // Weekly progress
  const hoursThisWeek = weeklyGoals?.hoursThisWeek || 0;
  const hoursGoal = weeklyGoals?.hoursGoal || 30;
  const progressPercent = weeklyGoals?.progressPercent || 0;
  const hoursRemaining = Math.max(hoursGoal - hoursThisWeek, 0);

  const formatTime = (time: string) => {
    try {
      const parsed = parse(time, "HH:mm:ss", new Date());
      return format(parsed, "h:mm a");
    } catch {
      return time;
    }
  };

  const getDateLabel = (lessonDate: string) => {
    const date = parseISO(lessonDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE d MMM");
  };

  const getBadgeCount = (action: QuickAction): number => {
    if (action.route === "/instructor/jobs" || action.title.toLowerCase().includes("job")) return pendingJobsCount;
    if (action.route === "/instructor/messages" || action.title.toLowerCase().includes("message")) return unreadCount;
    return 0;
  };

  return (
    <div className="min-h-screen bg-[#E8F1FE] dark:bg-background">
      {/* Back button overlay */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      {/* ── HERO with full-bleed image + overlaid stats ── */}
      <div className="relative w-full" style={{ height: "48vh", minHeight: 280, maxHeight: 400 }}>
        <img
          src={content?.hero_image_url || instructorHeroImg}
          alt="Hero"
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Weather badge - top right */}
        {currentWeather && currentWeather.temperature !== null && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium">
            <WeatherIcon icon={currentWeather.icon} className="h-3.5 w-3.5" />
            {currentWeather.temperature}°C
          </div>
        )}

        {/* Weekly progress overlay */}
        <div className="absolute bottom-6 left-5 right-5">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Weekly Progress</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">{hoursThisWeek}</span>
            <span className="text-lg text-white/70">/ {hoursGoal}h</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-2 w-full rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercent, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-white/60 text-xs mt-1.5">
            {hoursRemaining > 0 ? `${hoursRemaining.toFixed(1)} hours remaining` : "Weekly goal achieved! 🎉"}
          </p>
        </div>
      </div>

      {/* ── COMPACT NEXT LESSON CARD ── overlapping hero */}
      {nextLesson && (
        <div className="relative -mt-5 mx-4 z-10">
          <div
            className="bg-white dark:bg-card rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate("/instructor/schedule")}
          >
            <PupilAvatar
              name={nextLesson.pupilName}
              imageUrl={nextLesson.pupilProfileImage}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Next Lesson</span>
                <span className="text-[10px] text-muted-foreground">
                  · {getDateLabel(nextLesson.lessonDate)}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{nextLesson.pupilName}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">{formatTime(nextLesson.startTime)}</span>
                {nextLesson.pickupPostcode && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {nextLesson.pickupPostcode}
                    </span>
                  </>
                )}
                {etaLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : etaText ? (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${
                    trafficCondition === 'heavy' ? 'text-destructive' 
                    : trafficCondition === 'moderate' ? 'text-amber-600' 
                    : 'text-emerald-600'
                  }`}>
                    <Car className="h-3 w-3" />
                    {etaText}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <PaymentStatusBadge
                balance={nextLesson.prepaidHours > 0 ? nextLesson.prepaidHours * 40 : nextLesson.accountBalance}
                size="sm"
              />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      {/* ── TODAY'S STATS STRIP ── */}
      {todayOverview && todayOverview.lessonCount > 0 && (
        <div className="mx-4 mt-3 flex gap-2">
          <div className="flex-1 bg-white dark:bg-card rounded-xl p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 text-primary">
              <BookOpen className="h-4 w-4" />
              <span className="text-lg font-bold">{todayOverview.lessonCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Lessons</span>
          </div>
          <div className="flex-1 bg-white dark:bg-card rounded-xl p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <Clock className="h-4 w-4" />
              <span className="text-lg font-bold">{todayOverview.totalHours}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Hours</span>
          </div>
          <div className="flex-1 bg-white dark:bg-card rounded-xl p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 text-emerald-600">
              <PoundSterling className="h-4 w-4" />
              <span className="text-lg font-bold">£{todayOverview.expectedEarnings}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Expected</span>
          </div>
        </div>
      )}

      {/* ── 4-COLUMN QUICK ACTION GRID ── */}
      <div className="px-4 mt-5">
        <div className="grid grid-cols-4 gap-x-4 gap-y-5">
          {orderedTiles.map((action, i) => {
            const customImg = customIconImages[action.id];
            const badgeCount = getBadgeCount(action);
            return (
              <Link key={action.id} to={action.route} className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative w-14 h-14 rounded-2xl bg-white dark:bg-card shadow-sm flex items-center justify-center overflow-hidden border border-border/50"
                  style={customIconRadius[action.id] ? { borderRadius: customIconRadius[action.id] } : undefined}
                >
                  {customImg ? (
                    <img
                      src={customImg}
                      alt={action.title}
                      className="w-full h-full object-cover"
                      style={customIconRadius[action.id] ? { borderRadius: customIconRadius[action.id] } : undefined}
                    />
                  ) : (
                    <BookOpen className="h-6 w-6 text-primary" />
                  )}
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center shadow ring-2 ring-[#E8F1FE]">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </motion.div>
                <span className="text-[10px] font-medium text-foreground text-center leading-tight line-clamp-2">
                  {action.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom spacer for nav */}
      <div className="h-24" />
    </div>
  );
}
