import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  BookOpen,
  PoundSterling,
  Target,
  Timer,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useLastWeekComparison } from "@/hooks/useLastWeekComparison";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { useTomorrowPreview } from "@/hooks/useTomorrowPreview";
import { useInstructorHomepageContent } from "@/hooks/useInstructorHomepageContent";
import { ActivityTilesGrid } from "@/components/instructor/ActivityTilesGrid";
import { NextUpTile } from "@/components/instructor/NextUpTile";
import { TodayMiniTimeline } from "@/components/instructor/TodayMiniTimeline";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { SwipeableQuickAccess } from "@/components/instructor/SwipeableQuickAccess";
import { TodayLessonsList } from "@/components/instructor/TodayLessonsList";
import { GapFillerCard } from "@/components/instructor/GapFillerCard";
import { VehicleHealthStrip } from "@/components/instructor/VehicleHealthStrip";
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";
import { MorningBriefingCard } from "@/components/instructor/MorningBriefingCard";
import { SmartNudgesCard } from "@/components/instructor/SmartNudgesCard";
import { EndOfDaySummary } from "@/components/instructor/EndOfDaySummary";
import { DormantPupilsCard } from "@/components/instructor/DormantPupilsCard";

import { LessonPrepCard } from "@/components/instructor/LessonPrepCard";
import { useGPSConnectionStatus } from "@/hooks/useGPSConnectionStatus";
import { useNavigate } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

interface CompactHomeViewProps {
  instructorId: string | undefined;
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
  } | null;
}

const getGreeting = (firstName: string) => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Good morning, ${firstName}`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}`;
  if (hour >= 17 && hour < 21) return `Good evening, ${firstName}`;
  return `Hello, ${firstName}`;
};

export function CompactHomeView({ instructorId, instructor }: CompactHomeViewProps) {
  const navigate = useNavigate();
  const { instructor: authInstructor } = useInstructorAuth();
  const { data: todayOverview } = useTodayOverview(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { data: lastWeekComparison } = useLastWeekComparison(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { data: unreadCount } = useUnreadMessagesCount(instructorId);
  const pendingJobsCount = usePendingJobsCount();
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const { total: combinedNotifCount, messageCount: pupilMsgCount, swapCount: testSwapCount } = useCombinedNotificationCount(instructorId);
  const { alerts, dismissAlert, location: alertsLocation } = useDrivingAlerts(instructorId);
  const { isConnected: isGPSConnected } = useGPSConnectionStatus(instructorId || null);

  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const lessonsToday = todayOverview?.lessonCount || 0;
  const hoursToday = todayOverview?.totalHours || 0;
  const earningsToday = todayOverview?.expectedEarnings || 0;
  const progressPercent = weeklyGoals?.progressPercent || 0;

  const stats = [
    {
      label: "Lessons",
      value: lessonsToday,
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Hours",
      value: hoursToday,
      icon: Timer,
      color: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Earnings",
      value: `£${earningsToday}`,
      icon: PoundSterling,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Goal",
      value: `${progressPercent}%`,
      icon: Target,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10",
    },
  ];

  return (
    <>
      {/* Compact Header — greeting + date */}
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[22px] font-bold text-foreground leading-tight"
            >
              {getGreeting(firstName)}
            </motion.h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(new Date(), "EEEE d MMMM")}
            </p>
          </div>
          {lastWeekComparison && lastWeekComparison.percentChange !== 0 && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              lastWeekComparison.percentChange > 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}>
              <TrendingUp className={`h-3 w-3 ${lastWeekComparison.percentChange < 0 ? "rotate-180" : ""}`} />
              {Math.abs(lastWeekComparison.percentChange)}% vs last week
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 grid grid-cols-4 gap-2.5 mb-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card rounded-[14px] p-3 text-center border border-border/40"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            >
              <div className={`w-8 h-8 rounded-full ${stat.bgColor} flex items-center justify-center mx-auto mb-1.5`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-[15px] font-bold text-foreground leading-none">
                {typeof stat.value === "number" ? (
                  <AnimatedCounter value={stat.value} />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Morning Briefing — prominent position above activity tiles */}
      <MorningBriefingCard instructorId={instructorId} />

      {/* Activity Tiles (same as dashboard) */}
      <ActivityTilesGrid
        pendingJobsCount={pendingJobsCount}
        unreadMessagesCount={pupilMsgCount}
        testRequestsCount={testSwapCount}
        gapSlotsCount={gapSuggestions?.length || 0}
      />

      {/* Content sections — identical to dashboard */}
      <div className="px-4">
        <EndOfDaySummary instructorId={instructorId} />
        <SmartNudgesCard instructorId={instructorId} />

        {alerts.length > 0 && (
          <DrivingAlertsStrip
            alerts={alerts}
            onDismiss={dismissAlert}
            location={alertsLocation}
            className="mt-4"
          />
        )}

        {nextLesson && nextLesson.minutesUntil <= 30 && !isGPSConnected && (
          <TrackerReminderBanner
            lessonId={nextLesson.lessonId}
            minutesUntil={nextLesson.minutesUntil}
          />
        )}

        {(nextLesson || (todayLessons && todayLessons.length > 1)) && (
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">Your Day</p>
        )}

        {nextLesson && (
          <div className="mt-2">
            <NextUpTile
              lessonId={nextLesson.lessonId}
              pupilId={nextLesson.pupilId}
              pupilName={nextLesson.pupilName}
              pupilProfileImage={nextLesson.pupilProfileImage}
              pupilPhone={nextLesson.pupilPhone}
              lessonDate={nextLesson.lessonDate}
              pickupPostcode={nextLesson.pickupPostcode}
              pickupLocation={nextLesson.pickupLocation}
              startTime={nextLesson.startTime}
              minutesUntil={nextLesson.minutesUntil}
              accountBalance={nextLesson.accountBalance}
              prepaidHours={nextLesson.prepaidHours}
              durationMinutes={nextLesson.durationMinutes}
              instructorId={instructorId}
              checkInStatus={nextLesson.checkInStatus}
              lastLessonPlan={nextLesson.lastLessonPlan}
            />
            <LessonPrepCard
              instructorId={instructorId}
              pupilId={nextLesson.pupilId}
              pupilName={nextLesson.pupilName}
            />
          </div>
        )}

        {todayLessons && todayLessons.length > 0 && (
          <TodayMiniTimeline lessons={todayLessons} className="mt-4" />
        )}

        <TodayRoutePreview
          instructorId={instructorId}
          onTap={() => navigate("/instructor/diary")}
          className="mt-4"
        />

        <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">Quick Access</p>
        <div className="pb-4">
          <SwipeableQuickAccess />
        </div>

        <TodayLessonsList lessons={todayLessons || []} className="mt-4" />

        {gapSuggestions && gapSuggestions.length > 0 && (
          <div className="mt-4">
            <GapFillerCard gaps={gapSuggestions} />
          </div>
        )}

        {authInstructor?.id && (
          <div className="mt-4">
            <VehicleHealthStrip instructorId={authInstructor.id} />
          </div>
        )}

        <DormantPupilsCard instructorId={instructorId} />

        

        {instructorId && (
          <InstructorSetupChecklist instructorId={instructorId} variant="mobile" />
        )}

        <div className="mt-3">
          <PlanWidget />
        </div>

        <FloatingSessionBar instructorId={instructorId} />
      </div>
    </>
  );
}
