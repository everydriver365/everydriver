import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, Users, Briefcase, MapPin, PoundSterling,
  MessageCircle, Award, ChevronRight, Clock, Play,
  CheckCircle, BookOpen, Car, Radio, Globe, Settings,
  Receipt, Navigation, FileText, Headphones, ClipboardCheck,
  BarChart3, Fuel, Camera, Coffee, Gift, Shield, Wallet,
} from "lucide-react";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { triggerHaptic } from "@/lib/haptics";
import { BottomPromoGroup } from "@/components/instructor/BottomPromoGroup";
import { TodayScheduleAgenda } from "@/components/instructor/TodayScheduleAgenda";
import { useTomorrowLessons } from "@/hooks/useTomorrowLessons";
import { SwipeableQuickAccess } from "@/components/instructor/SwipeableQuickAccess";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";

interface WidgetsHomeViewProps {
  instructorId: string | undefined;
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
  } | null;
}

/* ── Small Widget (1×1) ── */
function SmallWidget({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  onClick,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => { triggerHaptic("light"); onClick?.(); }}
      className="flex flex-col items-start justify-between p-3.5 rounded-[18px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)] aspect-square"
    >
      <div
        className="w-8 h-8 rounded-[10px] flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <div className="w-full text-left">
        <p className="text-[22px] font-bold leading-tight text-[#1C1C1E]">{value}</p>
        <p className="text-[11px] font-medium text-[#8E8E93] leading-tight">{label}</p>
      </div>
    </motion.button>
  );
}

/* ── Medium Widget (2×1) ── */
function MediumWidget({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => { triggerHaptic("light"); onClick?.(); }}
      className={`col-span-2 p-4 rounded-[18px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)] text-left ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ── Next Lesson Widget (2×1, featured) ── */
function NextLessonWidget({ instructorId }: { instructorId: string | undefined }) {
  const navigate = useNavigate();
  const { data: nextLesson } = useNextLessonDetails(instructorId);

  if (!nextLesson) {
    return (
      <MediumWidget onClick={() => navigate("/instructor/diary")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#34C759]/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-[#34C759]" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#1C1C1E]">All Clear</p>
            <p className="text-[13px] text-[#8E8E93]">No upcoming lessons</p>
          </div>
        </div>
      </MediumWidget>
    );
  }

  const isNow = nextLesson.minutesUntil <= 0;
  const countdownText = isNow
    ? "Now"
    : nextLesson.minutesUntil < 60
    ? `${nextLesson.minutesUntil}m`
    : `${Math.floor(nextLesson.minutesUntil / 60)}h ${nextLesson.minutesUntil % 60}m`;

  return (
    <MediumWidget onClick={() => navigate(`/instructor/pupils?pupil=${nextLesson.pupilId}`)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
            {nextLesson.pupilProfileImage ? (
              <img src={nextLesson.pupilProfileImage} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-[#007AFF]">
                {nextLesson.pupilName.split(" ").map(n => n[0]).join("").toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#1C1C1E]">{nextLesson.pupilName}</p>
            <p className="text-[13px] text-[#8E8E93]">{nextLesson.startTime} · {nextLesson.durationMinutes || 60}min</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${isNow ? "bg-[#FF3B30]/10 text-[#FF3B30]" : "bg-[#007AFF]/10 text-[#007AFF]"}`}>
          {countdownText}
        </div>
      </div>
      {nextLesson.pickupLocation && (
        <div className="flex items-center gap-1.5 mt-1">
          <MapPin className="h-3.5 w-3.5 text-[#8E8E93]" />
          <span className="text-[12px] text-[#8E8E93] truncate">{nextLesson.pickupLocation}</span>
        </div>
      )}
    </MediumWidget>
  );
}

/* ── Schedule Widget (2×1) ── */
function ScheduleWidget({ instructorId }: { instructorId: string | undefined }) {
  const navigate = useNavigate();
  const { data: todayOverview } = useTodayOverview(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);

  const remaining = (todayLessons?.length || 0);
  const completed = todayOverview?.completedCount || 0;
  const total = todayOverview?.lessonCount || 0;

  return (
    <MediumWidget onClick={() => navigate("/instructor/schedule")}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#FF9500]/10 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-[#FF9500]" />
          </div>
          <p className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Today</p>
        </div>
        <ChevronRight className="h-4 w-4 text-[#C7C7CC]" />
      </div>
      <div className="flex items-baseline gap-3">
        <p className="text-[28px] font-bold text-[#1C1C1E]">{total}</p>
        <div className="flex items-center gap-2 text-[13px] text-[#8E8E93]">
          <span className="text-[#34C759] font-medium">{completed} done</span>
          <span>·</span>
          <span>{remaining} left</span>
        </div>
      </div>
      {/* Mini progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-[#E5E5EA] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#34C759] transition-all"
          style={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
        />
      </div>
    </MediumWidget>
  );
}

/* ── Earnings Widget (2×1) ── */
function EarningsWidget({ instructorId }: { instructorId: string | undefined }) {
  const navigate = useNavigate();
  const stats = useInstructorLiveStats(instructorId);
  const { data: todayOverviewData } = useTodayOverview(instructorId);
  const todayEarnings = todayOverviewData?.expectedEarnings || 0;
  const weekEarnings = stats.monthEarnings || 0;

  return (
    <MediumWidget onClick={() => navigate("/instructor/pay")}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#34C759]/10 flex items-center justify-center">
            <PoundSterling className="h-4 w-4 text-[#34C759]" />
          </div>
          <p className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Earnings</p>
        </div>
        <ChevronRight className="h-4 w-4 text-[#C7C7CC]" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[13px] text-[#8E8E93]">£</span>
        <p className="text-[28px] font-bold text-[#1C1C1E]">{todayEarnings.toFixed(0)}</p>
        <span className="text-[13px] text-[#8E8E93] ml-1">today</span>
      </div>
      <p className="text-[13px] text-[#8E8E93] mt-0.5">£{weekEarnings.toFixed(0)} this week</p>
    </MediumWidget>
  );
}

/* ── Quick Nav Grid ── */
function QuickNavGrid() {
  const navigate = useNavigate();
  const items = [
    { icon: Calendar, label: "Schedule", path: "/instructor/schedule", bg: "#FF9500", bgLight: "#FF9500/10" },
    { icon: Users, label: "Pupils", path: "/instructor/pupils", bg: "#007AFF", bgLight: "#007AFF/10" },
    { icon: MessageCircle, label: "Messages", path: "/instructor/messages", bg: "#5856D6", bgLight: "#5856D6/10" },
    { icon: Briefcase, label: "Jobs", path: "/instructor/jobs", bg: "#FF2D55", bgLight: "#FF2D55/10" },
    { icon: MapPin, label: "Fill Gaps", path: "/instructor/gaps", bg: "#AF52DE", bgLight: "#AF52DE/10" },
    { icon: Award, label: "Tests", path: "/instructor/test-results", bg: "#FF9500", bgLight: "#FF9500/10" },
    { icon: Radio, label: "GPS", path: "/instructor/tracking", bg: "#34C759", bgLight: "#34C759/10" },
    { icon: Globe, label: "Website", path: "/instructor/website", bg: "#5AC8FA", bgLight: "#5AC8FA/10" },
    { icon: Receipt, label: "Expenses", path: "/instructor/expenses", bg: "#8E8E93", bgLight: "#8E8E93/10" },
    { icon: Wallet, label: "Accounts", path: "/instructor/accounts", bg: "#007AFF", bgLight: "#007AFF/10" },
    { icon: Navigation, label: "Routes", path: "/instructor/routes", bg: "#34C759", bgLight: "#34C759/10" },
    { icon: Car, label: "Fleet", path: "/instructor/fleet-dashboard", bg: "#FF3B30", bgLight: "#FF3B30/10" },
    { icon: Camera, label: "Dashcam", path: "/instructor/dashcam", bg: "#1C1C1E", bgLight: "#1C1C1E/10" },
    { icon: BookOpen, label: "Resources", path: "/instructor/resources", bg: "#FF9500", bgLight: "#FF9500/10" },
    { icon: Settings, label: "Settings", path: "/instructor/settings", bg: "#8E8E93", bgLight: "#8E8E93/10" },
    { icon: ClipboardCheck, label: "Checklists", path: "/instructor/checklists", bg: "#5856D6", bgLight: "#5856D6/10" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item) => (
        <motion.button
          key={item.path}
          whileTap={{ scale: 0.9 }}
          onClick={() => { triggerHaptic("light"); navigate(item.path); }}
          className="flex flex-col items-center gap-1.5 py-2"
        >
          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            style={{ backgroundColor: item.bg }}
          >
            <item.icon className="h-5.5 w-5.5 text-white" strokeWidth={1.8} />
          </div>
          <span className="text-[11px] font-medium text-[#3A3A3C] leading-tight text-center">{item.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

/* ── Main View ── */
export function WidgetsHomeView({ instructorId, instructor }: WidgetsHomeViewProps) {
  const navigate = useNavigate();
  const { data: todayOverview } = useTodayOverview(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { data: unreadCount = 0 } = useUnreadMessagesCount(instructorId);
  const pendingJobsCount = usePendingJobsCount();
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: tomorrowLessons } = useTomorrowLessons(instructorId);

  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = format(new Date(), "EEEE, d MMMM");

  return (
    <div className="pb-8">
      {/* ── Greeting ── */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide">{dateStr}</p>
        <h1 className="text-[28px] font-bold text-[#1C1C1E] leading-tight mt-0.5">
          {greeting}, {firstName}
        </h1>
      </div>

      {/* ── Widget Grid ── */}
      <div className="px-4 space-y-3 mt-2">
        {/* Next lesson — full width */}
        <NextLessonWidget instructorId={instructorId} />

        {/* 2×2 small widgets */}
        <div className="grid grid-cols-2 gap-3">
          <SmallWidget
            icon={Calendar}
            iconBg="#FF9500"
            iconColor="#fff"
            label="Lessons today"
            value={todayOverview?.lessonCount || 0}
            onClick={() => navigate("/instructor/schedule")}
          />
          <SmallWidget
            icon={PoundSterling}
            iconBg="#34C759"
            iconColor="#fff"
            label="Today"
            value={`£${todayOverview?.expectedEarnings?.toFixed(0) || 0}`}
            onClick={() => navigate("/instructor/pay")}
          />
          <SmallWidget
            icon={MessageCircle}
            iconBg="#5856D6"
            iconColor="#fff"
            label="Unread"
            value={unreadCount}
            onClick={() => navigate("/instructor/messages")}
          />
          <SmallWidget
            icon={Briefcase}
            iconBg="#FF2D55"
            iconColor="#fff"
            label="Job offers"
            value={pendingJobsCount}
            onClick={() => navigate("/instructor/jobs")}
          />
        </div>

        {/* Schedule overview */}
        <ScheduleWidget instructorId={instructorId} />

        {/* Earnings */}
        <EarningsWidget instructorId={instructorId} />
      </div>

      {/* ── Today's Agenda ── */}
      <div className="px-4 mt-6">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8E8E93] mb-2 px-1">Your Day</p>
        <TodayScheduleAgenda
          todayLessons={todayLessons || []}
          tomorrowLessons={tomorrowLessons || []}
        />
      </div>

      {/* ── Quick Access App Grid ── */}
      <div className="px-4 mt-6">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#8E8E93] mb-3 px-1">Quick Access</p>
        <div className="rounded-[18px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)] p-4">
          <QuickNavGrid />
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="px-4 mt-6">
        <BottomPromoGroup />
        <UpcomingEventsCard className="mt-4" />
      </div>

      <FloatingSessionBar instructorId={instructorId} />
    </div>
  );
}
