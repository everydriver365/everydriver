import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  PoundSterling,
  Target,
  Timer,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { useInstructorStreak } from "@/hooks/useInstructorStreak";
import { ActivityTilesGrid } from "@/components/instructor/ActivityTilesGrid";
import { NextUpTile } from "@/components/instructor/NextUpTile";
import { TodayMiniTimeline } from "@/components/instructor/TodayMiniTimeline";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { SwipeableQuickAccess } from "@/components/instructor/SwipeableQuickAccess";
import { TodayLessonsList } from "@/components/instructor/TodayLessonsList";
import { BottomPromoGroup } from "@/components/instructor/BottomPromoGroup";
import { InsightTilesGrid } from "@/components/instructor/InsightTilesGrid";

import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";
import { MorningBriefingCard } from "@/components/instructor/MorningBriefingCard";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { SmartScheduleCard } from "@/components/instructor/SmartScheduleCard";

import { TomorrowPreviewCard } from "@/components/instructor/TomorrowPreviewCard";
import { QuietDayEmpty } from "@/components/instructor/QuietDayEmpty";
import { EndOfDaySummary } from "@/components/instructor/EndOfDaySummary";
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
  const queryClient = useQueryClient();
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
  const { data: streak } = useInstructorStreak(instructorId);
  const { data: tomorrowPreview } = useTomorrowPreview(instructorId);

  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const lessonsToday = todayOverview?.lessonCount || 0;
  const hoursToday = todayOverview?.totalHours || 0;
  const earningsToday = todayOverview?.expectedEarnings || 0;
  const progressPercent = weeklyGoals?.progressPercent || 0;

  // Hero promotion: next lesson within 2 hours
  const isNextLessonImminent = nextLesson && nextLesson.minutesUntil <= 120;
  const [statsExpanded, setStatsExpanded] = useState(!isNextLessonImminent);

  // End-of-day auto-prompt logic
  const hour = new Date().getHours();
  const today = format(new Date(), "yyyy-MM-dd");
  const eodDismissKey = `eod-dismissed-${today}`;
  const [eodDismissed, setEodDismissed] = useState(() => localStorage.getItem(eodDismissKey) === "true");
  const noLessonsRemaining = !todayLessons || todayLessons.length === 0;
  const showEndOfDay = hour >= 17 && noLessonsRemaining && lessonsToday > 0 && !eodDismissed;

  const handleDismissEod = () => {
    localStorage.setItem(eodDismissKey, "true");
    setEodDismissed(true);
  };

  // Empty state: no lessons at all today
  const isQuietDay = !nextLesson && (!todayLessons || todayLessons.length === 0) && lessonsToday === 0;

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["today-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["weekly-goals"] }),
      queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] }),
      queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] }),
      queryClient.invalidateQueries({ queryKey: ["gap-suggestions"] }),
      queryClient.invalidateQueries({ queryKey: ["instructor-streak"] }),
      queryClient.invalidateQueries({ queryKey: ["tomorrow-preview"] }),
      queryClient.invalidateQueries({ queryKey: ["last-week-comparison"] }),
    ]);
  };

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
    <PullToRefresh onRefresh={handleRefresh}>
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

      {/* Hero: NextUp tile when imminent */}
      {isNextLessonImminent && nextLesson && (
        <div className="px-4 mb-3">
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
        </div>
      )}

      {/* Stats Grid — collapsible when NextUp is hero */}
      {isNextLessonImminent ? (
        <div className="px-4 mb-4">
          <button
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-none bg-card border border-border/40"
          >
            <span className="text-[13px] font-medium text-muted-foreground">
              {lessonsToday} lessons · {hoursToday}h · £{earningsToday} · {progressPercent}% goal
            </span>
            <motion.div
              animate={{ rotate: statsExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>
          <AnimatePresence>
            {statsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-4 gap-2.5 mt-2">
                  {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-card rounded-none p-3 text-center border border-border/40"
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-4 gap-2.5 mb-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-none p-3 text-center border border-border/40"
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
      )}

      {/* Morning Briefing */}
      <MorningBriefingCard instructorId={instructorId} />

      {/* Smart Scheduling Suggestions */}
      <div className="px-4 mb-3">
        <SmartScheduleCard instructorId={instructorId} />
      </div>

      {/* Activity Tiles */}
      <ActivityTilesGrid
        pendingJobsCount={pendingJobsCount}
        unreadMessagesCount={pupilMsgCount}
        testRequestsCount={testSwapCount}
        gapSlotsCount={gapSuggestions?.length || 0}
      />

      {/* Content sections */}
      <div className="px-4">
        {/* End-of-Day Auto-Prompt */}
        {showEndOfDay && (
          <div className="mt-4 relative">
            <button
              onClick={handleDismissEod}
              className="absolute top-2 right-2 z-10 text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
            <EndOfDaySummary instructorId={instructorId} />
          </div>
        )}

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

        {/* Your Day section */}
        {isQuietDay ? (
          <QuietDayEmpty className="mt-6" />
        ) : (
          <>
            {(nextLesson || (todayLessons && todayLessons.length > 1)) && (
              <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">Your Day</p>
            )}

            {/* Show NextUp here only when NOT imminent (not promoted to hero) */}
            {nextLesson && !isNextLessonImminent && (
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
          </>
        )}

        <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">Quick Access</p>
        <div className="pb-4">
          <SwipeableQuickAccess />
        </div>


        <TodayLessonsList lessons={todayLessons || []} instructorId={instructorId || ""} className="mt-4" />

        <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">Insights</p>
        <InsightTilesGrid gapCount={gapSuggestions?.length || 0} />

        <div className="h-6" />


        <BottomPromoGroup className="mt-4 mb-4" />


        <div className="mt-3">
          <PlanWidget />
        </div>

        <FloatingSessionBar instructorId={instructorId} />
      </div>
    </PullToRefresh>
  );
}
