import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Car, PoundSterling, MessageSquare, Calendar, Users, Briefcase,
  BookOpen, Fuel, MapPin, BarChart3, Settings, PlusCircle,
  CheckCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorStreak } from "@/hooks/useInstructorStreak";
import { useTomorrowPreview } from "@/hooks/useTomorrowPreview";
import { triggerHaptic } from "@/lib/haptics";

import { NextUpTile } from "@/components/instructor/NextUpTile";
import { TodayMiniTimeline } from "@/components/instructor/TodayMiniTimeline";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { SwipeableQuickAccess } from "@/components/instructor/SwipeableQuickAccess";
import { TodayLessonsList } from "@/components/instructor/TodayLessonsList";
import { BottomPromoGroup } from "@/components/instructor/BottomPromoGroup";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";

import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { MorningBriefingCard } from "@/components/instructor/MorningBriefingCard";
import { InsightTilesGrid } from "@/components/instructor/InsightTilesGrid";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

import { TomorrowPreviewCard } from "@/components/instructor/TomorrowPreviewCard";
import { QuietDayEmpty } from "@/components/instructor/QuietDayEmpty";


interface BestMateHomeViewProps {
  instructorId: string | undefined;
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
  } | null;
}

// ─── Feature Tile ───
function FeatureTile({
  icon: Icon, title, subtitle, color, badge, onClick,
}: {
  icon: React.ElementType; title: string; subtitle: string; color: string;
  badge?: number; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={() => { triggerHaptic("light"); onClick(); }}
      className="flex flex-col items-center gap-2 rounded-none p-5 relative border-0 transition-all duration-200 ease-out"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "inset 0px 1px 0px rgba(255,255,255,0.6), 0px 8px 20px rgba(0,0,0,0.08), 0px 2px 6px rgba(0,0,0,0.04)",
      }}
    >
      {badge && badge > 0 ? (
        <span className="absolute top-2.5 right-2.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      <div
        className="w-[50px] h-[50px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: "#E6E8EC" }}
      >
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <span className="text-[13px] font-semibold text-foreground">{title}</span>
      <span className="text-[11px] text-muted-foreground -mt-1">{subtitle}</span>
    </motion.button>
  );
}

// ─── More Feature Mini Tile ───
function MoreTile({ icon: Icon, title, color, onClick }: {
  icon: React.ElementType; title: string; color: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={() => { triggerHaptic("light"); onClick(); }}
      className="flex flex-col items-center gap-2 rounded-none py-4 shrink-0 border-0 transition-all duration-200 ease-out"
      style={{
        width: 90,
        backgroundColor: "#FFFFFF",
        boxShadow: "inset 0px 1px 0px rgba(255,255,255,0.6), 0px 8px 20px rgba(0,0,0,0.08), 0px 2px 6px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "#E6E8EC" }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <span className="text-[11px] font-medium text-foreground truncate w-full text-center px-1">{title}</span>
    </motion.button>
  );
}

export function BestMateHomeView({ instructorId, instructor }: BestMateHomeViewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || resolvedTheme === "oled";

  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { monthEarnings } = useInstructorLiveStats(instructorId);
  const { data: unreadCount = 0 } = useUnreadMessagesCount(instructorId);
  const pendingJobsCount = usePendingJobsCount();
  const { data: todayOverview } = useTodayOverview(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const { total: combinedNotifCount, messageCount: pupilMsgCount, swapCount: testSwapCount } = useCombinedNotificationCount(instructorId);
  const { alerts, dismissAlert, location: alertsLocation } = useDrivingAlerts(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { instructor: authInstructor } = useInstructorAuth();
  const { data: streak } = useInstructorStreak(instructorId);
  const { data: tomorrowPreview } = useTomorrowPreview(instructorId);
  const authInstructorId = authInstructor?.id;

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const weeklyEarnings = weeklyGoals?.earningsThisWeek ?? 0;
  const upcomingBookings = (weeklyGoals?.lessonsScheduled ?? 0) + (weeklyGoals?.lessonsCompleted ?? 0);
  const diaryEntries = todayLessons?.length ?? 0;
  const lessonsToday = todayOverview?.lessonCount || 0;

  const isQuietDay = !nextLesson && (!todayLessons || todayLessons.length === 0) && lessonsToday === 0;

  const handleRefresh = async () => {
    triggerHaptic("light");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["today-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["weekly-goals"] }),
      queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] }),
      queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] }),
      queryClient.invalidateQueries({ queryKey: ["gap-suggestions"] }),
      queryClient.invalidateQueries({ queryKey: ["instructor-streak"] }),
      queryClient.invalidateQueries({ queryKey: ["tomorrow-preview"] }),
    ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen flex flex-col">
        {/* ─── 1. GRADIENT HEADER ─── */}
        <div
          className="w-full"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgb(20,31,56) 0%, rgb(26,46,82) 100%)"
              : "linear-gradient(135deg, rgb(38,64,97) 0%, rgb(51,84,122) 100%)",
          }}
        >
          <div style={{ height: 54 }} />
          <div className="flex items-center justify-between px-5 pb-3">
            <div>
              <h1 className="text-[24px] font-bold text-white leading-tight">{instructor?.name || "Instructor"}</h1>
              <p className="text-[15px] text-white/80">Welcome</p>
            </div>
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <Car className="h-6 w-6 text-white/90" />
            </div>
          </div>

          {/* Stats bar */}
          <div className="mx-5 mb-5 rounded-none p-3.5" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.15)" }}>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[10px] text-white/80 uppercase tracking-wide">Weekly</p>
                <p className="text-[22px] font-bold text-white mt-0.5 tabular-nums">£{weeklyEarnings}</p>
                <p className="text-[9px] text-white/60">Earnings this week</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/80 uppercase tracking-wide">Monthly</p>
                <p className="text-[22px] font-bold text-white mt-0.5 tabular-nums">£{Math.round(monthEarnings)}</p>
                <p className="text-[9px] text-white/60">Earnings this month</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/80 uppercase tracking-wide">Schedule</p>
                <p className="text-[22px] font-bold text-white mt-0.5 tabular-nums">{upcomingBookings}</p>
                <p className="text-[9px] text-white/60">Upcoming Bookings</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. BODY ─── */}
        <div className="flex-1 pb-24 bg-[#F2F2F7] dark:bg-[#111111]">
          {/* Date/time row */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <p className="text-[15px] font-semibold text-primary">
              {format(currentTime, "EEE, MMM d, yyyy")}
            </p>
            <p className="text-[15px] font-medium text-muted-foreground tabular-nums">
              {format(currentTime, "HH:mm")}
            </p>
          </div>


          {/* Feature tiles grid */}
          <div className="px-4 mb-5">
            <div className="grid grid-cols-3 gap-4">
              <FeatureTile icon={Users} title="Pupils" subtitle={`${todayOverview?.lessonCount ?? 0} Active`} color="#5856D6" onClick={() => navigate("/instructor/pupils")} />
              <FeatureTile icon={Calendar} title="Bookings" subtitle={`${upcomingBookings} upcoming`} color="#007AFF" onClick={() => navigate("/instructor/diary")} />
              <FeatureTile icon={PoundSterling} title="Finances" subtitle={`£${weeklyEarnings}`} color="#34C759" onClick={() => navigate("/instructor/pay")} />
              <FeatureTile icon={MessageSquare} title="Messages" subtitle={`${unreadCount} unread`} color="#FF9500" badge={unreadCount} onClick={() => navigate("/instructor/messages")} />
              <FeatureTile icon={Briefcase} title="Job Offers" subtitle={`${pendingJobsCount} available`} color="#AF52DE" badge={pendingJobsCount} onClick={() => navigate("/instructor/jobs")} />
              <FeatureTile icon={BookOpen} title="Diary" subtitle={`${diaryEntries} entries`} color="#5AC8FA" onClick={() => navigate("/instructor/diary")} />
            </div>
          </div>

          {/* More features scroll */}
          <div className="mb-6">
            <p className="text-[20px] font-bold text-foreground px-5 mb-3">More Features</p>
            <div className="flex gap-4 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
              <MoreTile icon={Fuel} title="Fuel Finder" color="#FF9500" onClick={() => navigate("/instructor/fuel")} />
              <MoreTile icon={MapPin} title="Live Tracking" color="#007AFF" onClick={() => navigate("/instructor/tracking")} />
              <MoreTile icon={BarChart3} title="Dashboard" color="#34C759" onClick={() => navigate("/instructor")} />
              <MoreTile icon={Settings} title="Settings" color="#8E8E93" onClick={() => navigate("/instructor/settings")} />
              <MoreTile icon={PlusCircle} title="Add Lesson" color="#00C7BE" onClick={() => navigate("/instructor/diary?action=add")} />
            </div>
          </div>

          {/* Morning Briefing — prominent position */}
          <MorningBriefingCard instructorId={instructorId} />

          {/* ─── EXISTING DASHBOARD CONTENT ─── */}
          <div className="px-4 space-y-4">

            {alerts.length > 0 && (
              <DrivingAlertsStrip
                alerts={alerts}
                onDismiss={dismissAlert}
                location={alertsLocation}
              />
            )}

            {isQuietDay ? (
              <QuietDayEmpty />
            ) : (
              <>
                {nextLesson && (
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
                )}

                {todayLessons && todayLessons.length > 0 && (
                  <TodayMiniTimeline lessons={todayLessons} />
                )}

                <TodayRoutePreview
                  instructorId={instructorId}
                  onTap={() => navigate("/instructor/diary")}
                />
              </>
            )}

            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Quick Access</p>
              <SwipeableQuickAccess />
            </div>


            <TodayLessonsList lessons={todayLessons || []} instructorId={instructorId || ""} />

            <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mt-2 mb-2">Insights</p>
            <InsightTilesGrid gapCount={gapSuggestions?.length || 0} />

            <div className="h-6" />


            <BottomPromoGroup className="mt-4 mb-4" />
            
          </div>

          <FloatingSessionBar instructorId={instructorId} />
        </div>
      </div>
    </PullToRefresh>
  );
}
