import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  PoundSterling,
  Target,
  Timer,
  ChevronRight,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Snowflake,
  Wind,
  Sun,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import type { DrivingAlert } from "@/hooks/useDrivingAlerts";
import type { TodayLesson } from "@/hooks/useTodayRemainingLessons";

import { NextUpTile } from "@/components/instructor/NextUpTile";
import { QuickActionTiles } from "@/components/instructor/QuickActionTiles";
import { TodayMiniTimeline } from "@/components/instructor/TodayMiniTimeline";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { BottomPromoGroup } from "@/components/instructor/BottomPromoGroup";

import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";
import { VehicleHealthStrip } from "@/components/instructor/VehicleHealthStrip";
import { UnifiedAgendaTile } from "@/components/instructor/dashboard/UnifiedAgendaTile";
import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { TomorrowPeekCard } from "@/components/instructor/TomorrowPeekCard";
import { EarningsForecaster } from "@/components/instructor/EarningsForecaster";
import { RoadAlertsRow } from "@/components/instructor/RoadAlertsRow";

import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { TestRequestsTile } from "@/components/instructor/TestRequestsTile";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import messagesIcon from "@/assets/messages-icon.png";
import planAheadIcon from "@/assets/plan-ahead-icon.png";

/* ── Frosted glass wrapper ── */
function FrostedCard({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`backdrop-blur-xl bg-white/[0.12] border border-white/[0.15] rounded-none ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {children}
    </div>
  );
}

/* ── Section label ── */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 mt-6 mb-2 px-1">
      {children}
    </p>
  );
}

/* ── Weather icon ── */
const WeatherIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const iconMap: Record<string, React.ElementType> = { Sun, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudFog, CloudLightning, Snowflake, Wind };
  const I = iconMap[icon] || Cloud;
  return <I className={className} />;
};

/* ── Props ── */
export interface LockScreenHomeViewProps {
  instructorId: string | undefined;
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
  } | null;
  // Data from hooks
  todayOverview: { lessonCount: number; expectedEarnings: number } | null | undefined;
  nextLesson: any;
  weeklyGoals: { progressPercent: number } | null | undefined;
  streak: any;
  pendingJobsCount: number;
  pupilMsgCount: number;
  alerts: DrivingAlert[];
  dismissAlert: (id: string) => void;
  alertsLocation: string | null;
  currentWeather: { temperature: number | null; icon: string; description: string } | null | undefined;
  isGPSConnected: boolean;
  todayLessons: TodayLesson[] | undefined;
  tomorrowPreview: any;
  content: any;
  contentLoading: boolean;
  isTileEditMode: boolean;
  onTileEditModeChange: (v: boolean) => void;
  authInstructorId: string | undefined;
}

export function LockScreenHomeView({
  instructorId,
  instructor,
  todayOverview,
  nextLesson,
  weeklyGoals,
  streak,
  pendingJobsCount,
  pupilMsgCount,
  alerts,
  dismissAlert,
  alertsLocation,
  currentWeather,
  isGPSConnected,
  todayLessons,
  tomorrowPreview,
  content,
  contentLoading,
  isTileEditMode,
  onTileEditModeChange,
  authInstructorId,
}: LockScreenHomeViewProps) {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = format(time, "EEEE, d MMMM");
  const timeStr = format(time, "HH:mm");

  return (
    <div
      className="min-h-screen pb-8"
      style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
      }}
    >
      {/* ── Clock header ── */}
      <div className="text-center pt-10 pb-4 px-4">
        <p className="text-white/50 text-sm font-medium tracking-wide">{dateStr}</p>
        <h1 className="text-[72px] leading-none font-extralight text-white tracking-tight tabular-nums">
          {timeStr}
        </h1>

        {/* Weather + GPS pill */}
        <div className="flex items-center justify-center gap-3 mt-2">
          {currentWeather?.temperature != null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs">
              <WeatherIcon icon={currentWeather.icon || "Cloud"} className="h-3.5 w-3.5" />
              {currentWeather.temperature}°C
              {currentWeather.description ? ` · ${currentWeather.description}` : ""}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
            isGPSConnected ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/50"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isGPSConnected ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`} />
            {isGPSConnected ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* ── Notification stack ── */}
      <div className="px-4 space-y-2">

        {/* Driving alerts */}
        {alerts.length > 0 && (
          <FrostedCard className="p-3">
            <DrivingAlertsStrip
              alerts={alerts}
              onDismiss={dismissAlert}
              location={alertsLocation}
              className="[&_*]:!text-white/80 [&_.bg-amber-50]:!bg-white/5 [&_.bg-red-50]:!bg-white/5 [&_.border-amber-100]:!border-white/10 [&_.border-red-100]:!border-white/10"
            />
          </FrostedCard>
        )}


        {/* Tracker reminder */}
        {nextLesson && nextLesson.minutesUntil <= 30 && !isGPSConnected && (
          <FrostedCard className="overflow-hidden">
            <TrackerReminderBanner lessonId={nextLesson.lessonId} minutesUntil={nextLesson.minutesUntil} />
          </FrostedCard>
        )}

        {/* ── Next Lesson notification ── */}
        {nextLesson && (
          <FrostedCard className="p-0 overflow-hidden">
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
          </FrostedCard>
        )}

        {/* ── Stats card ── */}
        <FrostedCard className="p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-none bg-white/5">
              <BookOpen className="h-4 w-4 text-blue-300" />
              <div>
                <p className="text-sm font-bold text-white leading-none">{todayOverview?.lessonCount || 0}</p>
                <p className="text-[10px] text-white/50 mt-0.5">Lessons</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-none bg-white/5">
              <PoundSterling className="h-4 w-4 text-emerald-300" />
              <div>
                <p className="text-sm font-bold text-white leading-none">£{todayOverview?.expectedEarnings || 0}</p>
                <p className="text-[10px] text-white/50 mt-0.5">Expected</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-none bg-white/5">
              <Target className="h-4 w-4 text-violet-300" />
              <div>
                <p className="text-sm font-bold text-white leading-none">{Math.min(weeklyGoals?.progressPercent || 0, 100)}%</p>
                <p className="text-[10px] text-white/50 mt-0.5">Weekly</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-none bg-white/5">
              <Timer className="h-4 w-4 text-amber-300" />
              <div>
                <p className="text-sm font-bold text-white leading-none">
                  {nextLesson?.startTime ? nextLesson.startTime.substring(0, 5) : "--"}
                </p>
                <p className="text-[10px] text-white/50 mt-0.5">{nextLesson?.pupilName || "Next up"}</p>
              </div>
            </div>
          </div>
        </FrostedCard>

        {/* ── Messages notification ── */}
        <FrostedCard
          className="p-3 active:scale-[0.98] transition-transform cursor-pointer"
          onClick={() => navigate("/instructor/messages")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={messagesIcon} alt="Messages" className="h-9 w-9 object-cover" />
              <div>
                <span className="font-semibold text-sm text-white">Messages</span>
                <p className="text-white/50 text-[10px]">
                  {pupilMsgCount > 0 ? `${pupilMsgCount} unread` : "No new messages"}
                </p>
              </div>
            </div>
            {pupilMsgCount > 0 && (
              <span className="min-w-[24px] h-6 px-2 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">
                {pupilMsgCount > 9 ? "9+" : pupilMsgCount}
              </span>
            )}
          </div>
        </FrostedCard>

        {/* ── Job Offers notification ── */}
        {pendingJobsCount > 0 && (
          <FrostedCard
            className="p-3 active:scale-[0.98] transition-transform cursor-pointer"
            onClick={() => navigate("/instructor/jobs")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={jobOffersIcon} alt="Job Offers" className="h-9 w-9 object-cover" />
                <div>
                  <span className="font-semibold text-sm text-white">Job Offers</span>
                  <p className="text-white/50 text-[10px]">{pendingJobsCount} pending</p>
                </div>
              </div>
              <span className="min-w-[24px] h-6 px-2 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">
                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
              </span>
            </div>
          </FrostedCard>
        )}

        {/* ── Test Requests ── */}
        {authInstructorId && (
          <FrostedCard className="overflow-hidden">
            <TestRequestsTile instructorId={authInstructorId} />
          </FrostedCard>
        )}

        {/* ── YOUR DAY ── */}
        {(nextLesson || (todayLessons && todayLessons.length > 1)) && (
          <SectionLabel>YOUR DAY</SectionLabel>
        )}

        {todayLessons && todayLessons.length > 1 && (
          <FrostedCard className="p-3 overflow-hidden">
            <TodayMiniTimeline
              lessons={todayLessons}
              className="[&_*]:!text-white/80 [&_.text-muted-foreground]:!text-white/50"
            />
          </FrostedCard>
        )}

        <FrostedCard className="overflow-hidden">
          <TodayRoutePreview
            instructorId={instructorId}
            onTap={() => navigate("/instructor/diary")}
          />
        </FrostedCard>

        {/* ── QUICK ACTIONS ── */}
        <SectionLabel>QUICK ACTIONS</SectionLabel>

        <div className="pb-2">
          <QuickActionTiles
            quickActions={content?.quick_actions || []}
            pendingJobsCount={pendingJobsCount}
            instructorId={instructorId}
            loading={contentLoading}
            isEditMode={isTileEditMode}
            onEditModeChange={onTileEditModeChange}
          />
        </div>

        {/* ── MORE ── */}
        <SectionLabel>MORE</SectionLabel>

        {authInstructorId && (
          <FrostedCard className="overflow-hidden">
            <VehicleHealthStrip instructorId={authInstructorId} />
          </FrostedCard>
        )}

        <FrostedCard className="p-3 overflow-hidden">
          <UnifiedAgendaTile instructorId={instructor?.id} />
        </FrostedCard>

        <FrostedCard className="overflow-hidden">
          <PlanWidget />
        </FrostedCard>

        {/* ── PLAN AHEAD ── */}
        <SectionLabel>PLAN AHEAD</SectionLabel>

        {tomorrowPreview && tomorrowPreview.lessonCount > 0 ? (
          <FrostedCard className="overflow-hidden">
            <TomorrowPeekCard
              lessonCount={tomorrowPreview.lessonCount}
              totalHours={tomorrowPreview.totalHours}
              expectedEarnings={tomorrowPreview.expectedEarnings}
              firstLessonTime={tomorrowPreview.firstLessonTime}
              lessons={tomorrowPreview.lessons}
              instructorId={instructorId}
            />
          </FrostedCard>
        ) : tomorrowPreview && tomorrowPreview.lessonCount === 0 ? (
          <FrostedCard
            className="p-3 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate("/instructor/gaps")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-none bg-white/10 flex items-center justify-center overflow-hidden">
                  <img src={planAheadIcon} alt="Plan Ahead" className="h-7 w-7 object-contain" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Plan Ahead</h3>
                  <p className="text-white/50 text-[10px]">Nothing scheduled tomorrow</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/30" />
            </div>
          </FrostedCard>
        ) : null}

        {instructorId && (
          <FrostedCard className="overflow-hidden mt-2">
            <EarningsForecaster instructorId={instructorId} />
          </FrostedCard>
        )}

        <FrostedCard className="overflow-hidden mt-2">
          <RoadAlertsRow alerts={alerts} />
        </FrostedCard>

        <BottomPromoGroup className="mt-4" />


        <FloatingSessionBar instructorId={instructorId} />
      </div>
    </div>
  );
}
