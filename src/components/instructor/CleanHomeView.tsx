import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  PoundSterling,
  AlertCircle,
  MapPin,
  ChevronRight,
  Settings,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import type { TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useInstructorPupilsPaymentSummary } from "@/hooks/usePupilPaymentStatus";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// All existing widgets & hooks
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useTomorrowPreview } from "@/hooks/useTomorrowPreview";
import { useGPSConnectionStatus } from "@/hooks/useGPSConnectionStatus";
import { useInstructorHomepageContent } from "@/hooks/useInstructorHomepageContent";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { BottomPromoGroup } from "@/components/instructor/BottomPromoGroup";
import { UpcomingEventsCard } from "@/components/instructor/UpcomingEventsCard";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

import { QuickActionTiles } from "@/components/instructor/QuickActionTiles";
import { NextUpTile } from "@/components/instructor/NextUpTile";

import { TodayMiniTimeline } from "@/components/instructor/TodayMiniTimeline";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { TomorrowPeekCard } from "@/components/instructor/TomorrowPeekCard";

import { RoadAlertsRow } from "@/components/instructor/RoadAlertsRow";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { VehicleHealthStrip } from "@/components/instructor/VehicleHealthStrip";

import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";
import { UnifiedAgendaTile } from "@/components/instructor/dashboard/UnifiedAgendaTile";
import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { TestRequestsTile } from "@/components/instructor/TestRequestsTile";

import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { CelebrationConfetti } from "@/components/instructor/CelebrationConfetti";
import { DailyManifest } from "@/components/instructor/dashboard/DailyManifest";
import { CommunityAlertReporter } from "@/components/instructor/CommunityAlertReporter";
import { triggerHaptic } from "@/lib/haptics";
import { useIsMobile } from "@/hooks/use-mobile";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import messagesIcon from "@/assets/messages-icon.png";
import planAheadIcon from "@/assets/plan-ahead-icon.png";

/* ── Lesson helpers ── */
function getLessonTypeBadge(lesson: TodayLesson) {
  const duration = lesson.durationMinutes || 60;
  if (duration >= 120) return { label: "Test Prep", bg: "bg-amber-100/80", text: "text-amber-700" };
  return { label: "Standard", bg: "bg-emerald-100/80", text: "text-emerald-700" };
}

function getLessonBorderColor(index: number) {
  const colours = ["border-l-blue-400", "border-l-amber-400", "border-l-emerald-400", "border-l-violet-400", "border-l-pink-400"];
  return colours[index % colours.length];
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
  const { instructor: authInstructor } = useInstructorAuth();
  const isMobile = useIsMobile();
  const now = new Date();
  const dateStr = format(now, "EEEE d MMMM");

  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const hour = now.getHours();
  const greeting =
    hour >= 5 && hour < 12 ? "Good Morning" :
    hour >= 12 && hour < 17 ? "Good Afternoon" :
    hour >= 17 && hour < 21 ? "Good Evening" : "Hello";

  // All hooks
  const { monthEarnings } = useInstructorLiveStats(instructorId);
  const { data: paymentSummary } = useInstructorPupilsPaymentSummary(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { messageCount: pupilMsgCount } = useCombinedNotificationCount(instructorId);
  const { alerts, dismissAlert, location: alertsLocation, currentWeather } = useDrivingAlerts(instructorId);
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

  // iOS Quick Access items — squircle grid
  const quickAccessItems = [
    { icon: Users, label: "Pupils", sub: String(activePupilCount || 0), color: "text-primary", bg: "bg-primary/10", path: "/instructor/pupils" },
    { icon: CalendarDays, label: "Schedule", sub: `${todayOverview?.lessonCount || 0} today`, color: "text-amber-500", bg: "bg-amber-500/10", path: "/instructor/diary" },
    { icon: MapPin, label: "Live Map", sub: "Track", color: "text-emerald-500", bg: "bg-emerald-500/10", path: "/instructor/tracking" },
    { icon: PoundSterling, label: "Payments", sub: `£${paymentSummary?.totalDebt?.toFixed(0) || "0"} due`, color: "text-blue-500", bg: "bg-blue-500/10", path: "/instructor/pupils" },
    { icon: GraduationCap, label: "Tests", sub: "Upcoming", color: "text-violet-500", bg: "bg-violet-500/10", path: "/instructor/test-results" },
    { icon: Settings, label: "Settings", sub: "Admin", color: "text-muted-foreground", bg: "bg-muted/60", path: "/instructor/settings" },
  ];

  return (
    <div className="min-h-screen bg-[#f2f2f7] pb-8">
      {/* ── Greeting ── */}
      <div className="px-5 pt-6 pb-1">
        <p className="text-muted-foreground text-[13px]">{dateStr}</p>
        <h1 className="text-[28px] font-bold text-foreground leading-tight mt-0.5">{greeting}</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isGPSConnected ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isGPSConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
            {isGPSConnected ? "Online" : "Offline"}
          </span>
          {currentWeather?.temperature != null && (
            <span className="text-muted-foreground text-[11px]">
              {currentWeather.temperature}°C{currentWeather.description ? ` · ${currentWeather.description}` : ""}
            </span>
          )}
        </div>
      </div>

      <div className="px-4">
        {/* ── iOS Grouped Stats Card ── */}
        <div className="mt-4 bg-card rounded-2xl shadow-lift shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="divide-y divide-border/60">
            {/* Row 1 */}
            <div className="flex divide-x divide-border/60">
              <button onClick={() => navigate("/instructor/diary")} className="flex-1 p-3.5 flex items-center gap-3 active:bg-muted/50 transition-colors">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Clock className="h-[18px] w-[18px] text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-foreground leading-none">{todayOverview?.lessonCount || 0}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Today's Lessons</p>
                </div>
              </button>
              <button onClick={() => navigate("/instructor/pupils")} className="flex-1 p-3.5 flex items-center gap-3 active:bg-muted/50 transition-colors">
                <div className="w-9 h-9 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                  <Users className="h-[18px] w-[18px] text-teal-600" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-foreground leading-none">{activePupilCount || 0}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Active Pupils</p>
                </div>
              </button>
            </div>
            {/* Row 2 */}
            <div className="flex divide-x divide-border/60">
              <button onClick={() => navigate("/instructor/earnings")} className="flex-1 p-3.5 flex items-center gap-3 active:bg-muted/50 transition-colors">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <PoundSterling className="h-[18px] w-[18px] text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-foreground leading-none">£{monthEarnings?.toFixed(0) || "0"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">This Month</p>
                </div>
              </button>
              <button onClick={() => navigate("/instructor/pupils")} className="flex-1 p-3.5 flex items-center gap-3 active:bg-muted/50 transition-colors">
                <div className="w-9 h-9 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-[18px] w-[18px] text-red-500" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-foreground leading-none">£{paymentSummary?.totalDebt?.toFixed(0) || "0"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Outstanding</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ── Alerts ── */}
        {alerts.length > 0 && (
          <DrivingAlertsStrip alerts={alerts} onDismiss={dismissAlert} location={alertsLocation} className="mt-3" />
        )}
        
        {nextLesson && nextLesson.minutesUntil <= 30 && !isGPSConnected && (
          <TrackerReminderBanner lessonId={nextLesson.lessonId} minutesUntil={nextLesson.minutesUntil} />
        )}

        {/* ── Job Offers & Messages (iOS grouped card) ── */}
        <div className="mt-3 bg-card rounded-2xl shadow-lift shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden divide-y divide-border/60">
          {pendingJobsCount > 0 && (
            <button onClick={() => navigate("/instructor/jobs")} className="w-full px-4 py-3 flex items-center gap-3 active:bg-muted/50 transition-colors">
              <img src={jobOffersIcon} alt="" className="h-9 w-9 rounded-2xl" />
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold text-foreground">Job Offers</p>
                <p className="text-[11px] text-muted-foreground">{pendingJobsCount} pending</p>
              </div>
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </button>
          )}
          <button onClick={() => navigate("/instructor/messages")} className="w-full px-4 py-3 flex items-center gap-3 active:bg-muted/50 transition-colors">
            <img src={messagesIcon} alt="" className="h-9 w-9 rounded-2xl" />
            <div className="flex-1 text-left">
              <p className="text-[15px] font-semibold text-foreground">Messages</p>
              <p className="text-[11px] text-muted-foreground">{pupilMsgCount > 0 ? `${pupilMsgCount} unread` : "No new messages"}</p>
            </div>
            {pupilMsgCount > 0 && (
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                {pupilMsgCount > 9 ? "9+" : pupilMsgCount}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </button>
        </div>
      </div>

      {/* ── Test Requests ── */}
      {authInstructor?.id && <TestRequestsTile instructorId={authInstructor.id} />}

      <div className="px-4">
        {/* ── Quick Access — iOS squircle grid ── */}
        <div className="mt-6">
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">Quick Access</p>
          <div className="grid grid-cols-3 gap-3">
            {quickAccessItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="bg-card rounded-2xl shadow-lift p-3 text-center flex flex-col items-center justify-center gap-1.5 active:scale-[0.92] active:brightness-95 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.08)] aspect-square"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg}`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} strokeWidth={1.6} />
                </div>
                <p className="text-[11px] font-semibold text-foreground leading-tight">{item.label}</p>
                <p className="text-[9px] text-muted-foreground leading-none">{item.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── YOUR DAY ── */}
        {(nextLesson || (todayLessons && todayLessons.length > 1)) && (
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mt-6 mb-3 px-1">Your Day</p>
        )}

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

        {todayLessons && todayLessons.length > 1 && (
          <TodayMiniTimeline lessons={todayLessons} className="mt-3" />
        )}

        <TodayRoutePreview instructorId={instructorId} onTap={() => navigate("/instructor/diary")} className="mt-3" />

        {/* ── Today's Schedule — iOS grouped card ── */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Today's Schedule</p>
            <button onClick={() => navigate("/instructor/diary")} className="text-[13px] text-primary font-medium">See All</button>
          </div>
          {(() => {
            const totalHours = lessons.reduce((sum, l) => sum + (l.durationMinutes || 60) / 60, 0);
            const totalEarnings = lessons.reduce((sum, l) => sum + (l.amountDue || 0), 0);
            const paidCount = lessons.filter(l => l.paymentStatus === "paid").length;
            const statsBar = lessons.length > 0 ? (
              <div style={{ backgroundColor: "#2A394F", padding: "8px 16px" }}>
                <div className="flex items-center gap-0 text-xs">
                  <span style={{ color: "#fff", fontWeight: 500 }}>{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 6px" }}>·</span>
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>{totalHours.toFixed(1)}h</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 6px" }}>·</span>
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>£{totalEarnings}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 6px" }}>·</span>
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>{paidCount}/{lessons.length} paid</span>
                </div>
              </div>
            ) : null;
            return lessons.length === 0 ? (
              <div className="bg-card rounded-2xl shadow-lift shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 text-center">
                <p className="text-muted-foreground text-sm">No lessons scheduled today</p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl shadow-lift shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                {statsBar}
                <div className="divide-y divide-border/60">
              {lessons.map((lesson, i) => {
                const badge = getLessonTypeBadge(lesson);
                const endMinutes =
                  (parseInt(lesson.startTime.substring(11, 13)) * 60 +
                    parseInt(lesson.startTime.substring(14, 16))) +
                  (lesson.durationMinutes || 60);
                const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
                const endM = String(endMinutes % 60).padStart(2, "0");
                const startDisplay = lesson.startTime.substring(11, 16);

                return (
                  <motion.button
                    key={lesson.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(lesson.pupilId ? `/instructor/pupils/${lesson.pupilId}` : "/instructor/pupils")}
                    className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-muted/50 transition-colors text-left"
                  >
                    {/* Time column */}
                    <div className="w-12 text-center shrink-0">
                      <p className="text-[15px] font-bold text-foreground leading-none">{startDisplay}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{endH}:{endM}</p>
                    </div>
                    {/* Divider dot */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      ["bg-blue-400", "bg-amber-400", "bg-emerald-400", "bg-violet-400", "bg-pink-400"][i % 5]
                    }`} />
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground truncate">{lesson.pupilName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {lesson.pickupPostcode && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />{lesson.pickupPostcode}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded-2xl text-[9px] font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                  </motion.button>
                );
              })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Quick Actions (editable tiles) ── */}
        <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mt-6 mb-3 px-1">Quick Actions</p>
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

        {/* ── Daily Manifest (desktop only) ── */}
        {!isMobile && instructorId && (
          <div className="mt-4">
            <DailyManifest instructorId={instructorId} />
          </div>
        )}

        {/* ── Widgets ── */}
        <div className="mt-2 space-y-3">
          {authInstructor?.id && <VehicleHealthStrip instructorId={authInstructor.id} />}
          <UnifiedAgendaTile instructorId={instructor?.id} />
        </div>

        {/* ── Plan Ahead ── */}
        <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mt-6 mb-3 px-1">Plan Ahead</p>

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
          <button onClick={() => navigate("/instructor/gaps")} className="w-full bg-card rounded-2xl shadow-lift shadow-[0_1px_3px_rgba(0,0,0,0.08)] px-4 py-3.5 flex items-center gap-3 active:bg-muted/50 transition-colors text-left">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
              <img src={planAheadIcon} alt="" className="h-7 w-7 object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-foreground">Plan Ahead</p>
              <p className="text-[11px] text-muted-foreground">Nothing scheduled tomorrow</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          </button>
        ) : null}

        <RoadAlertsRow alerts={alerts} className="mt-3" />

        <BottomPromoGroup className="mt-4" />
        <UpcomingEventsCard className="mt-4" />

        

        <CelebrationConfetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
        <FloatingSessionBar instructorId={instructorId} />
        <CommunityAlertReporter instructorId={instructorId} />
      </div>
    </div>
  );
}
