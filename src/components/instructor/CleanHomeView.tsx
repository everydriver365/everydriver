import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Users,
  PoundSterling,
  AlertCircle,
  MapPin,
  ChevronRight,
  Settings,
  CheckCircle,
  BookOpen,
  Target,
  Timer,
} from "lucide-react";
import type { TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useInstructorPupilsPaymentSummary } from "@/hooks/usePupilPaymentStatus";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Import all existing widgets & hooks
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { useInstructorStreak } from "@/hooks/useInstructorStreak";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useTomorrowPreview } from "@/hooks/useTomorrowPreview";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useGPSConnectionStatus } from "@/hooks/useGPSConnectionStatus";
import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";
import { useInstructorHomepageContent } from "@/hooks/useInstructorHomepageContent";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

import { QuickActionTiles } from "@/components/instructor/QuickActionTiles";
import { NextUpTile } from "@/components/instructor/NextUpTile";
import { TodayMiniTimeline } from "@/components/instructor/TodayMiniTimeline";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { TomorrowPeekCard } from "@/components/instructor/TomorrowPeekCard";
import { EarningsForecaster } from "@/components/instructor/EarningsForecaster";
import { RoadAlertsRow } from "@/components/instructor/RoadAlertsRow";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { VehicleHealthStrip } from "@/components/instructor/VehicleHealthStrip";
import { CheckEngineBanner } from "@/components/instructor/CheckEngineBanner";
import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";
import { UnifiedAgendaTile } from "@/components/instructor/dashboard/UnifiedAgendaTile";
import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { TestRequestsTile } from "@/components/instructor/TestRequestsTile";
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { CelebrationConfetti } from "@/components/instructor/CelebrationConfetti";
import { triggerHaptic } from "@/lib/haptics";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import messagesIcon from "@/assets/messages-icon.png";
import planAheadIcon from "@/assets/plan-ahead-icon.png";

/* ── Glass stat card ── */
function GlassStatCard({
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
    <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-4 space-y-3">
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

/* ── Lesson type badge colours ── */
function getLessonTypeBadge(lesson: TodayLesson) {
  const duration = lesson.durationMinutes || 60;
  if (duration >= 120) return { label: "Test Prep", bg: "bg-amber-50", text: "text-amber-600" };
  return { label: "Standard", bg: "bg-emerald-50", text: "text-emerald-600" };
}

function getLessonBorderColor(index: number) {
  const colours = ["border-l-amber-400", "border-l-emerald-400", "border-l-blue-400", "border-l-violet-400", "border-l-pink-400"];
  return colours[index % colours.length];
}

/* ── iOS Glass Section Wrapper ── */
function IOSSection({ title, children, action, onAction }: { title?: string; children: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="mt-6">
      {title && (
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {action && (
            <button onClick={onAction} className="text-xs text-primary font-medium">
              {action}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Props ── */
export interface CleanHomeViewProps {
  instructorId: string | undefined;
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
  } | null;
  todayOverview: { lessonCount: number; expectedEarnings: number; totalHours?: number } | null | undefined;
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
  const { instructor: authInstructor } = useInstructorAuth();
  const now = new Date();
  const dateStr = format(now, "EEEE d MMMM").toUpperCase();

  // Greeting
  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const hour = now.getHours();
  const greeting =
    hour >= 5 && hour < 12 ? "Good Morning" :
    hour >= 12 && hour < 17 ? "Good Afternoon" :
    hour >= 17 && hour < 21 ? "Good Evening" : "Hello";

  // All hooks for full feature parity
  const { monthEarnings } = useInstructorLiveStats(instructorId);
  const { data: paymentSummary } = useInstructorPupilsPaymentSummary(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { total: combinedNotifCount, messageCount: pupilMsgCount } = useCombinedNotificationCount(instructorId);
  const { alerts, dismissAlert, location: alertsLocation, currentWeather } = useDrivingAlerts(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { data: tomorrowPreview } = useTomorrowPreview(instructorId);
  const { content, loading: contentLoading } = useInstructorHomepageContent();
  const pendingJobsCount = usePendingJobsCount();
  const { isConnected: isGPSConnected } = useGPSConnectionStatus(instructorId || null);
  const [isTileEditMode, setIsTileEditMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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

  // Celebration confetti
  useEffect(() => {
    if (todayOverview && todayOverview.lessonCount > 0 && hour >= 18) {
      const today = new Date().toDateString();
      const last = localStorage.getItem("last-celebration-date");
      if (last !== today) {
        setShowConfetti(true);
        triggerHaptic("success");
        localStorage.setItem("last-celebration-date", today);
      }
    }
  }, [todayOverview, hour]);

  const lessons = todayLessons || [];

  return (
    <div className="min-h-screen bg-muted/30 pb-8">
      {/* ── Floating Card Hero (Variant #6 style) ── */}
      <div className="bg-card/60 backdrop-blur-sm mx-4 mt-6 rounded-2xl border border-border/50 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground tracking-widest">{dateStr}</p>
            <h1 className="text-xl font-bold text-foreground mt-1">{greeting} 👋</h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{todayOverview?.lessonCount || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lessons</p>
          </div>
        </div>
        {/* GPS & Weather strip */}
        <div className="flex items-center gap-2 mt-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isGPSConnected
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-muted text-muted-foreground"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isGPSConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"}`} />
            {isGPSConnected ? "Online" : "Offline"}
          </span>
          {currentWeather?.temperature != null && (
            <span className="text-muted-foreground text-[10px]">
              {currentWeather.temperature}°C{currentWeather.description ? ` · ${currentWeather.description}` : ""}
            </span>
          )}
        </div>
      </div>

      <div className="px-4">
        {/* ── Glass Stats Grid ── */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <GlassStatCard
            icon={<Clock className="h-5 w-5 text-primary" />}
            iconBg="bg-primary/10"
            value={String(todayOverview?.lessonCount || 0)}
            label="Today's Lessons"
          />
          <GlassStatCard
            icon={<Users className="h-5 w-5 text-teal-600" />}
            iconBg="bg-teal-500/10"
            value={String(activePupilCount || 0)}
            label="Active Pupils"
          />
          <GlassStatCard
            icon={<PoundSterling className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-500/10"
            value={`£${monthEarnings?.toFixed(2) || "0.00"}`}
            label="This Month"
          />
          <GlassStatCard
            icon={<AlertCircle className="h-5 w-5 text-red-500" />}
            iconBg="bg-red-500/10"
            value={`£${paymentSummary?.totalDebt?.toFixed(2) || "0.00"}`}
            label="Outstanding"
          />
        </div>

        {/* ── Driving Alerts ── */}
        {alerts.length > 0 && (
          <DrivingAlertsStrip
            alerts={alerts}
            onDismiss={dismissAlert}
            location={alertsLocation}
            className="mt-4"
          />
        )}

        {/* ── Check Engine ── */}
        <CheckEngineBanner />

        {/* ── Tracker Reminder ── */}
        {nextLesson && nextLesson.minutesUntil <= 30 && !isGPSConnected && (
          <TrackerReminderBanner
            lessonId={nextLesson.lessonId}
            minutesUntil={nextLesson.minutesUntil}
          />
        )}

        {/* ── Job Offers ── */}
        {pendingJobsCount > 0 && (
          <button
            onClick={() => navigate("/instructor/jobs")}
            className="w-full mt-4 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden active:scale-[0.98] transition-all"
          >
            <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white rounded-2xl">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
              </div>
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
        )}

        {/* ── Messages ── */}
        <button
          onClick={() => navigate("/instructor/messages")}
          className="w-full mt-3 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden active:scale-[0.98] transition-all"
        >
          <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white rounded-2xl">
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
            </div>
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
      {authInstructor?.id && (
        <TestRequestsTile instructorId={authInstructor.id} />
      )}

      <div className="px-4">
        {/* ── YOUR DAY ── */}
        {(nextLesson || (todayLessons && todayLessons.length > 1)) && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-6 mb-2">YOUR DAY</p>
        )}

        {/* ── Next Lesson ── */}
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
            />
          </div>
        )}

        {/* ── Today's Mini Timeline ── */}
        {todayLessons && todayLessons.length > 1 && (
          <TodayMiniTimeline lessons={todayLessons} className="mt-4" />
        )}

        {/* ── Today's Route Preview ── */}
        <TodayRoutePreview
          instructorId={instructorId}
          onTap={() => navigate("/instructor/diary")}
          className="mt-4"
        />

        {/* ── Today's Schedule ── */}
        <IOSSection title="Today's Schedule" action="See all" onAction={() => navigate("/instructor/diary")}>
          <div className="space-y-2.5">
            {lessons.length === 0 && (
              <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 text-center">
                <p className="text-muted-foreground text-sm">No lessons scheduled today</p>
              </div>
            )}
            {lessons.map((lesson, i) => {
              const badge = getLessonTypeBadge(lesson);
              const borderColor = getLessonBorderColor(i);
              const endMinutes =
                (parseInt(lesson.startTime.substring(11, 13)) * 60 +
                  parseInt(lesson.startTime.substring(14, 16))) +
                (lesson.durationMinutes || 60);
              const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
              const endM = String(endMinutes % 60).padStart(2, "0");
              const startDisplay = lesson.startTime.substring(11, 16);

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/instructor/pupils/${lesson.id}`)}
                  className={`bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 border-l-4 ${borderColor} p-4 cursor-pointer active:scale-[0.98] transition-transform`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground text-[15px]">{lesson.pupilName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{startDisplay} - {endH}:{endM}</span>
                    {lesson.pickupPostcode && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lesson.pickupPostcode}</span>
                    )}
                    <span className="flex items-center gap-1"><PoundSterling className="h-3 w-3" />£{todayOverview?.expectedEarnings ? Math.round(todayOverview.expectedEarnings / Math.max(todayOverview.lessonCount, 1)) : 35}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </IOSSection>

        {/* ── QUICK ACTIONS ── */}
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

        {/* ── Vehicle Health & Agenda ── */}
        <div className="mt-4 space-y-3">
          {authInstructor?.id && (
            <VehicleHealthStrip instructorId={authInstructor.id} />
          )}
          <UnifiedAgendaTile instructorId={instructor?.id} />
          <PlanWidget />
        </div>

        {/* ── PLAN AHEAD ── */}
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
            className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden cursor-pointer"
            onClick={() => navigate("/instructor/gaps")}
          >
            <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white rounded-2xl">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
              </div>
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

        {/* ── Earnings Forecast ── */}
        {instructorId && (
          <div className="mt-2">
            <EarningsForecaster instructorId={instructorId} />
          </div>
        )}

        {/* ── Road Alerts ── */}
        <RoadAlertsRow alerts={alerts} className="mt-2" />

        {/* ── Setup Checklist ── */}
        {instructorId && (
          <InstructorSetupChecklist
            instructorId={instructorId}
            variant="mobile"
          />
        )}

        {/* ── Confetti ── */}
        <CelebrationConfetti
          trigger={showConfetti}
          onComplete={() => setShowConfetti(false)}
        />

        {/* ── Floating Session Bar ── */}
        <FloatingSessionBar instructorId={instructorId} />
      </div>
    </div>
  );
}
