import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Users,
  PoundSterling,
  AlertCircle,
  MapPin,
  ChevronRight,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Map,
  Menu,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Snowflake,
  Wind,
  Sun,
  Target,
  Timer,
  BookOpen,
  Mail,
} from "lucide-react";
import type { TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useInstructorPupilsPaymentSummary } from "@/hooks/usePupilPaymentStatus";
import { useUpcomingTests } from "@/hooks/useUpcomingTests";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Existing feature components
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { VehicleHealthStrip } from "@/components/instructor/VehicleHealthStrip";
import { CheckEngineBanner } from "@/components/instructor/CheckEngineBanner";
import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";
import { NextUpTile } from "@/components/instructor/NextUpTile";
import { TodayMiniTimeline } from "@/components/instructor/TodayMiniTimeline";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { QuickActionTiles } from "@/components/instructor/QuickActionTiles";
import { UnifiedAgendaTile } from "@/components/instructor/dashboard/UnifiedAgendaTile";
import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { TomorrowPeekCard } from "@/components/instructor/TomorrowPeekCard";
import { EarningsForecaster } from "@/components/instructor/EarningsForecaster";
import { RoadAlertsRow } from "@/components/instructor/RoadAlertsRow";
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { TestRequestsTile } from "@/components/instructor/TestRequestsTile";
import { GapFillerCard } from "@/components/instructor/GapFillerCard";
import { CelebrationConfetti } from "@/components/instructor/CelebrationConfetti";
import { WeeklyGoalRing } from "@/components/instructor/WeeklyGoalRing";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { triggerHaptic } from "@/lib/haptics";

import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { useInstructorStreak } from "@/hooks/useInstructorStreak";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useTomorrowPreview } from "@/hooks/useTomorrowPreview";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useGPSConnectionStatus } from "@/hooks/useGPSConnectionStatus";
import { useInstructorHomepageContent } from "@/hooks/useInstructorHomepageContent";
import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";
import { useUrgentAlerts } from "@/hooks/useUrgentAlerts";
import { UrgentAlertOverlay } from "@/components/instructor/UrgentAlertOverlay";

import jobOffersIcon from "@/assets/job-offers-icon.png";
import messagesIcon from "@/assets/messages-icon.png";
import planAheadIcon from "@/assets/plan-ahead-icon.png";

/* ── Stat card ── */
function StatCard({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: ReactNode;
  iconBg: string;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-card rounded-[14px] border border-[hsl(214,20%,91%)] p-4 space-y-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

/* ── Lesson type badge config ── */
const lessonTypeBadges: Record<string, { label: string; bg: string; text: string }> = {
  standard: { label: "Standard", bg: "bg-blue-100", text: "text-blue-700" },
  test_prep: { label: "Test Prep", bg: "bg-amber-100", text: "text-amber-700" },
  mock_test: { label: "Mock Test", bg: "bg-purple-100", text: "text-purple-700" },
  motorway: { label: "Motorway", bg: "bg-green-100", text: "text-green-700" },
  refresher: { label: "Refresher", bg: "bg-pink-100", text: "text-pink-700" },
};

function getLessonTypeBadge(type: string) {
  return lessonTypeBadges[type] || lessonTypeBadges.standard;
}

/* ── Left border colour per lesson ── */
function getLessonBorderColor(type: string) {
  const map: Record<string, string> = {
    standard: "border-l-blue-400",
    test_prep: "border-l-amber-400",
    mock_test: "border-l-purple-400",
    motorway: "border-l-green-400",
    refresher: "border-l-pink-400",
  };
  return map[type] || "border-l-blue-400";
}

/* Weather icon */
const WeatherIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const iconMap: Record<string, React.ElementType> = { Sun, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudFog, CloudLightning, Snowflake, Wind };
  const IconComponent = iconMap[icon] || Cloud;
  return <IconComponent className={className} />;
};

/* ── Props ── */
export interface CleanHomeViewProps {
  instructorId: string | undefined;
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
  } | null;
  todayOverview: { lessonCount: number; expectedEarnings: number } | null | undefined;
  todayLessons: TodayLesson[] | undefined;
}

export function CleanHomeView({
  instructorId,
  instructor,
  todayOverview,
  todayLessons,
}: CleanHomeViewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const now = new Date();
  const dateStr = format(now, "EEEE d MMMM");

  // Greeting
  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const hour = now.getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? "Good Morning"
      : hour >= 12 && hour < 17
      ? "Good Afternoon"
      : hour >= 17 && hour < 21
      ? "Good Evening"
      : "Hello";

  // ─── All data hooks ───
  const { monthEarnings } = useInstructorLiveStats(instructorId);
  const { data: paymentSummary } = useInstructorPupilsPaymentSummary(instructorId);
  const { data: upcomingTests } = useUpcomingTests(instructorId);
  const pendingJobsCount = usePendingJobsCount();
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { total: combinedNotifCount, messageCount: pupilMsgCount } = useCombinedNotificationCount(instructorId);
  const { alerts, dismissAlert, location: alertsLocation, currentWeather } = useDrivingAlerts(instructorId);
  const { data: streak } = useInstructorStreak(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { data: tomorrowPreview } = useTomorrowPreview(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const { content, loading: contentLoading } = useInstructorHomepageContent();
  const { isConnected: isGPSConnected } = useGPSConnectionStatus(instructorId || null);
  const { roadName: gpsRoadName } = useInstructorLastPosition(instructorId || null);
  const { alerts: urgentAlerts, dismissAlert: dismissUrgentAlert } = useUrgentAlerts(instructorId);

  // Active pupils count
  const { data: activePupilCount } = useQuery({
    queryKey: ["active-pupil-count", instructorId],
    queryFn: async () => {
      if (!instructorId) return 0;
      const { count, error } = await (supabase.from("pupils") as any)
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .eq("is_active", true);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });

  const lessons = todayLessons || [];
  const tests = upcomingTests || [];

  // State
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRefreshFeedback, setShowRefreshFeedback] = useState(false);
  const [isTileEditMode, setIsTileEditMode] = useState(false);

  // Day completion confetti
  useEffect(() => {
    const h = new Date().getHours();
    if (todayOverview && todayOverview.lessonCount > 0 && h >= 18) {
      const today = new Date().toDateString();
      const last = localStorage.getItem("last-celebration-date");
      if (last !== today) {
        setShowConfetti(true);
        triggerHaptic("success");
        localStorage.setItem("last-celebration-date", today);
      }
    }
  }, [todayOverview]);

  // Pull to refresh
  const handleRefresh = async () => {
    triggerHaptic("light");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["today-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] }),
      queryClient.invalidateQueries({ queryKey: ["instructor-homepage-content"] }),
      queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] }),
      queryClient.invalidateQueries({ queryKey: ["instructor-streak"] }),
      queryClient.invalidateQueries({ queryKey: ["weekly-goals"] }),
      queryClient.invalidateQueries({ queryKey: ["tomorrow-preview"] }),
      queryClient.invalidateQueries({ queryKey: ["gap-suggestions"] }),
      queryClient.invalidateQueries({ queryKey: ["active-pupil-count"] }),
      queryClient.invalidateQueries({ queryKey: ["upcoming-tests"] }),
    ]);
    setShowRefreshFeedback(true);
    setTimeout(() => setShowRefreshFeedback(false), 1500);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <UrgentAlertOverlay alerts={urgentAlerts} onDismiss={dismissUrgentAlert} />
      <CelebrationConfetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="min-h-screen bg-[hsl(220,20%,97%)] pb-24">
        {/* ── Refresh feedback ── */}
        <AnimatePresence>
          {showRefreshFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center pt-2"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
                <CheckCircle className="h-3 w-3" />
                Updated just now
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Greeting + Status ── */}
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-[28px] font-bold text-foreground leading-tight">
            {greeting}, {firstName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground text-base">{dateStr}</p>
            {/* GPS status dot */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              isGPSConnected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-muted text-muted-foreground"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isGPSConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"}`} />
              {isGPSConnected ? "Online" : "Offline"}
            </span>
            {/* Weather */}
            {currentWeather?.temperature != null && (
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <WeatherIcon icon={currentWeather.icon || "Cloud"} className="h-3.5 w-3.5" />
                {currentWeather.temperature}°C
              </span>
            )}
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          <StatCard
            icon={<Clock className="h-5 w-5 text-[hsl(192,70%,35%)]" />}
            iconBg="bg-[hsl(192,70%,35%)]/10"
            value={String(todayOverview?.lessonCount || 0)}
            label="Today's Lessons"
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-[hsl(218,54%,40%)]" />}
            iconBg="bg-[hsl(218,54%,40%)]/10"
            value={String(activePupilCount || 0)}
            label="Active Pupils"
          />
          <StatCard
            icon={<PoundSterling className="h-5 w-5 text-[hsl(160,59%,40%)]" />}
            iconBg="bg-[hsl(160,59%,40%)]/10"
            value={`£${monthEarnings?.toFixed(2) || "0.00"}`}
            label="This Month"
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5 text-[hsl(40,90%,47%)]" />}
            iconBg="bg-[hsl(40,90%,47%)]/10"
            value={`£${paymentSummary?.totalDebt?.toFixed(2) || "0.00"}`}
            label="Outstanding"
          />
        </div>

        {/* ── Weekly Goal Progress ── */}
        {weeklyGoals && (
          <div className="px-4 mt-4">
            <div className="bg-card rounded-[14px] border border-[hsl(214,20%,91%)] p-4 flex items-center gap-4">
              <WeeklyGoalRing 
                hoursThisWeek={weeklyGoals.hoursThisWeek || 0}
                hoursGoal={weeklyGoals.hoursGoal || 20}
                progressPercent={weeklyGoals.progressPercent || 0}
                isAheadOfLastWeek={weeklyGoals.isAheadOfLastWeek || false}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Weekly Goal</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {weeklyGoals.hoursThisWeek?.toFixed(1) || 0}/{weeklyGoals.hoursGoal || 20}h · {Math.min(weeklyGoals.progressPercent || 0, 100)}% complete
                </p>
              </div>
              {streak && streak.currentStreak > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-500">🔥 {streak.currentStreak}</p>
                  <p className="text-[10px] text-muted-foreground">day streak</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Driving Alerts ── */}
        {alerts.length > 0 && (
          <div className="px-4 mt-4">
            <DrivingAlertsStrip 
              alerts={alerts} 
              onDismiss={dismissAlert}
              location={alertsLocation}
            />
          </div>
        )}

        {/* ── Check Engine Banner ── */}
        <div className="px-4 mt-2">
          <CheckEngineBanner />
        </div>

        {/* ── Tracker Reminder ── */}
        {nextLesson && nextLesson.minutesUntil <= 30 && !isGPSConnected && (
          <div className="px-4 mt-2">
            <TrackerReminderBanner 
              lessonId={nextLesson.lessonId}
              minutesUntil={nextLesson.minutesUntil}
            />
          </div>
        )}

        {/* ── Job Offers ── */}
        {pendingJobsCount > 0 && (
          <div className="px-4 mt-4">
            <button
              onClick={() => navigate("/instructor/jobs")}
              className="w-full bg-card rounded-[14px] border border-[hsl(214,20%,91%)] overflow-hidden active:scale-[0.98] transition-all"
            >
              <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white rounded-[14px]">
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={jobOffersIcon} alt="Job Offers" className="h-10 w-10 object-cover" />
                    <div>
                      <span className="font-semibold text-sm">Job Offers</span>
                      <p className="text-white/70 text-[10px]">{pendingJobsCount} pending offer{pendingJobsCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">
                    {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                  </span>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── Messages ── */}
        <div className="px-4 mt-3">
          <button
            onClick={() => navigate("/instructor/messages")}
            className="w-full bg-card rounded-[14px] border border-[hsl(214,20%,91%)] overflow-hidden active:scale-[0.98] transition-all"
          >
            <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white rounded-[14px]">
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={messagesIcon} alt="Messages" className="h-10 w-10 object-cover" />
                  <div>
                    <span className="font-semibold text-sm">Messages</span>
                    <p className="text-white/70 text-[10px]">
                      {pupilMsgCount > 0 ? `${pupilMsgCount} unread` : "No new messages"}
                    </p>
                  </div>
                </div>
                {pupilMsgCount > 0 && (
                  <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">
                    {pupilMsgCount > 9 ? "9+" : pupilMsgCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* ── Test Requests ── */}
        {instructorId && (
          <TestRequestsTile instructorId={instructorId} />
        )}

        {/* ── YOUR DAY section ── */}
        {(nextLesson || (todayLessons && todayLessons.length > 1)) && (
          <div className="px-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-6 mb-2">YOUR DAY</p>
          </div>
        )}

        {/* Next Lesson Card */}
        {nextLesson && (
          <div className="px-4 mt-2">
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
            />
          </div>
        )}

        {/* Today Mini Timeline */}
        {todayLessons && todayLessons.length > 1 && (
          <div className="px-4">
            <TodayMiniTimeline lessons={todayLessons} className="mt-4" />
          </div>
        )}

        {/* Today's Schedule */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Today's Schedule</h2>
            <button
              onClick={() => navigate("/instructor/diary")}
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              See all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {lessons.length === 0 && (
              <div className="bg-card rounded-[14px] border border-[hsl(214,20%,91%)] p-6 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No lessons scheduled today</p>
              </div>
            )}
            {lessons.map((lesson, i) => {
              const badge = getLessonTypeBadge(lesson.lessonType);
              const borderColor = getLessonBorderColor(lesson.lessonType);
              const endMinutes =
                (parseInt(lesson.startTime.substring(11, 13)) * 60 +
                  parseInt(lesson.startTime.substring(14, 16))) +
                (lesson.durationMinutes || 60);
              const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
              const endM = String(endMinutes % 60).padStart(2, "0");
              const startDisplay = lesson.startTime.substring(11, 16);
              const isPaid = lesson.paymentStatus === "paid";

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/instructor/pupils/${lesson.id}`)}
                  className={`bg-card rounded-[14px] border border-[hsl(214,20%,91%)] border-l-4 ${borderColor} p-4 cursor-pointer active:scale-[0.98] transition-transform`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground text-base">{lesson.pupilName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{startDisplay} – {endH}:{endM}</span>
                    </div>
                    {lesson.pickupPostcode && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{lesson.pickupPostcode}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <PoundSterling className="h-3.5 w-3.5" />
                        <span>£{lesson.amountDue?.toFixed(2) || "35.00"}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        isPaid
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {isPaid ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {isPaid ? "Paid" : "Due"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Today's Route Preview ── */}
        <div className="px-4">
          <TodayRoutePreview 
            instructorId={instructorId}
            onTap={() => navigate("/instructor/diary")}
            className="mt-4"
          />
        </div>

        {/* ── Upcoming Tests ── */}
        {tests.length > 0 && (
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Upcoming Tests</h2>
              <button
                onClick={() => navigate("/instructor/menu")}
                className="text-sm text-primary font-medium flex items-center gap-1"
              >
                View all <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {tests.map((test, i) => {
                const date = parseISO(test.testDate);
                const monthLabel = format(date, "MMM").toUpperCase();
                const dayLabel = format(date, "dd");

                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-[14px] border border-[hsl(214,20%,91%)] p-4 flex gap-4"
                  >
                    <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl w-14 h-14 flex-shrink-0">
                      <span className="text-[10px] font-bold text-primary uppercase leading-none">{monthLabel}</span>
                      <span className="text-xl font-bold text-primary leading-none mt-0.5">{dayLabel}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base truncate">{test.pupilName}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {test.testTime ? test.testTime.substring(0, 5) : "TBC"} — {test.testCentreName || "Centre TBC"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-muted-foreground capitalize">{test.testType}</span>
                        {test.isUrgent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            {test.daysUntil} days
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── QUICK ACTIONS section ── */}
        <div className="px-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-6 mb-2">QUICK ACTIONS</p>
          <div className="pb-4">
            <QuickActionTiles
              quickActions={content?.quick_actions || []}
              pendingJobsCount={pendingJobsCount}
              instructorId={instructorId}
              loading={contentLoading}
              isEditMode={isTileEditMode}
              onEditModeChange={setIsTileEditMode}
            />
          </div>
        </div>

        {/* ── Vehicle Health & Agenda ── */}
        <div className="px-4 mt-2 space-y-3">
          {instructorId && (
            <VehicleHealthStrip instructorId={instructorId} />
          )}
          <UnifiedAgendaTile instructorId={instructor?.id} />
          <PlanWidget />
        </div>

        {/* ── PLAN AHEAD section ── */}
        <div className="px-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-6 mb-2">PLAN AHEAD</p>

          {tomorrowPreview && tomorrowPreview.lessonCount > 0 ? (
            <TomorrowPeekCard
              lessonCount={tomorrowPreview.lessonCount}
              totalHours={tomorrowPreview.totalHours}
              expectedEarnings={tomorrowPreview.expectedEarnings}
              firstLessonTime={tomorrowPreview.firstLessonTime}
              lessons={tomorrowPreview.lessons}
              instructorId={instructorId}
            />
          ) : tomorrowPreview && tomorrowPreview.lessonCount === 0 ? (
            <div
              className="bg-card rounded-[14px] border border-[hsl(214,20%,91%)] overflow-hidden cursor-pointer"
              onClick={() => navigate("/instructor/gaps")}
            >
              <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white rounded-[14px]">
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                      <img src={planAheadIcon} alt="Plan Ahead" className="h-7 w-7 object-contain" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Plan Ahead</h3>
                      <p className="text-white/70 text-[10px]">Nothing scheduled tomorrow</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/60" />
                </div>
              </div>
            </div>
          ) : null}

          {/* Earnings Forecast */}
          {instructorId && (
            <div className="mt-3">
              <EarningsForecaster instructorId={instructorId} />
            </div>
          )}

          {/* Road Alerts */}
          <RoadAlertsRow alerts={alerts} className="mt-3" />

          {/* Setup Checklist */}
          {instructorId && (
            <InstructorSetupChecklist 
              instructorId={instructorId} 
              variant="mobile"
            />
          )}
        </div>

        {/* ── Floating Session Bar ── */}
        <FloatingSessionBar instructorId={instructorId} />

        {/* ── Bottom Quick Nav ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-[hsl(214,20%,91%)] px-4 py-2 flex justify-around z-50">
          {[
            { icon: Clock, label: "Today", path: "/instructor", active: true },
            { icon: Users, label: "Pupils", path: "/instructor/pupils", active: false },
            { icon: Calendar, label: "Schedule", path: "/instructor/diary", active: false },
            { icon: Map, label: "Live Map", path: "/instructor/live", active: false },
            { icon: Menu, label: "More", path: "/instructor/menu", active: false },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 ${
                item.active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </PullToRefresh>
  );
}
