import { Bell } from "lucide-react";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useVisitorChatUnreadCount } from "@/hooks/useVisitorChatUnreadCount";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { getTimeOfDayGreeting } from "@/lib/composeStatusSubtitle";

import { UpNextCard } from "@/components/UpNextCard";
import { NextLessonPreviewCard } from "@/components/instructor/NextLessonPreviewCard";
import { ActivityTilesGrid } from "@/components/instructor/ActivityTilesGrid";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { ImpactAlertCard } from "@/components/instructor/ImpactAlertCard";
import { HomeTodaySchedule } from "@/components/instructor/HomeTodaySchedule";
import { InsightTilesGrid } from "@/components/instructor/InsightTilesGrid";
import { TelematicsTile } from "@/components/instructor/TelematicsTile";
import { VehicleHealthCard } from "@/components/instructor/VehicleHealthCard";
import { IdleTimeCostCard } from "@/components/instructor/IdleTimeCostCard";
import { UpcomingEventsCard } from "@/components/instructor/UpcomingEventsCard";
import { QuickAccessSwipeablePaged } from "@/components/instructor/quickAccess/QuickAccessSwipeablePaged";
import { PupilMilestoneFeed } from "@/components/instructor/PupilMilestoneFeed";
import { MorningBriefingCard } from "@/components/instructor/MorningBriefingCard";
import { WeatherAlertBanner } from "@/components/instructor/WeatherAlertBanner";
import { QuietDayEmpty } from "@/components/instructor/QuietDayEmpty";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";

interface Props {
  instructorId: string | undefined;
  instructor: { id?: string; name: string; profile_image_url: string | null } | null;
}

const SECTION_ACCENTS = {
  Now: { fg: "#3D55A1", dot: "#3D55A1" },
  "Needs attention": { fg: "#B91C1C", dot: "#EF4444" },
  Today: { fg: "#B45309", dot: "#F59E0B" },
  "This week": { fg: "#047857", dot: "#10B981" },
  "Quick actions": { fg: "#6D28D9", dot: "#8B5CF6" },
  Telematics: { fg: "#0369A1", dot: "#0EA5E9" },
  Insights: { fg: "#7C3AED", dot: "#A855F7" },
} as const;

function SectionLabel({ title }: { title: string }) {
  const accent = (SECTION_ACCENTS as any)[title];
  return (
    <div style={{ padding: "0 20px 8px", display: "flex", alignItems: "center", gap: 6 }}>
      {accent && <span style={{ width: 6, height: 6, borderRadius: 999, background: accent.dot }} />}
      <p
        style={{
          fontSize: 12,
          color: accent?.fg ?? "#6B7280",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 700,
          margin: 0,
        }}
      >
        {title}
      </p>
    </div>
  );
}

function Card({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        margin: "0 16px 18px",
        overflow: "hidden",
        border: "1px solid #E4E8EF",
        boxShadow:
          "0 1px 0 rgba(15,23,42,0.04), 0 4px 12px -6px rgba(15,23,42,0.12), 0 14px 28px -18px rgba(15,23,42,0.18)",
      }}
    >
      {padded ? <div style={{ padding: 12 }}>{children}</div> : children}
    </div>
  );
}

function MiniMap() {
  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: "100%",
        height: 120,
        background: "#EAF1F5",
        overflow: "hidden",
      }}
    >
      <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ display: "block" }}>
        <path d="M 18 12 Q 50 4 86 18 T 138 32 L 130 60 Q 90 70 56 58 T 12 44 Z" fill="#DCE8D2" opacity={0.75} />
        <path d="M 220 80 Q 260 70 295 86 L 305 118 L 210 116 Z" fill="#DCE8D2" opacity={0.65} />
        <path d="M -10 80 Q 80 60 160 70 T 330 58" stroke="#FFFFFF" strokeWidth={6} fill="none" />
        <path d="M -10 80 Q 80 60 160 70 T 330 58" stroke="#D5DCE3" strokeWidth={3} fill="none" />
        <path d="M 30 -10 Q 50 40 80 70 T 130 130" stroke="#FFFFFF" strokeWidth={5} fill="none" />
        <path d="M 30 -10 Q 50 40 80 70 T 130 130" stroke="#D5DCE3" strokeWidth={2.5} fill="none" />
        <path d="M 200 -10 Q 210 40 240 70 T 290 130" stroke="#FFFFFF" strokeWidth={5} fill="none" />
        <path d="M 200 -10 Q 210 40 240 70 T 290 130" stroke="#D5DCE3" strokeWidth={2.5} fill="none" />
        <path d="M 60 78 Q 130 50 200 60 T 258 64" stroke="#3D55A1" strokeWidth={2.5} strokeDasharray="5 4" fill="none" strokeLinecap="round" />
        <circle cx={60} cy={78} r={8} fill="#10B981" stroke="#FFFFFF" strokeWidth={2.5} />
        <g transform="translate(258 60)">
          <path d="M 0 16 L -7 2 A 8 8 0 1 1 7 2 Z" fill="#3D55A1" stroke="#FFFFFF" strokeWidth={2} strokeLinejoin="round" />
          <circle cx={0} cy={-2} r={2.8} fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}

export function SettingsV2HomeView({ instructorId, instructor }: Props) {
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { alerts, dismissAlert, location: alertsLocation } = useDrivingAlerts(instructorId);
  const pendingJobsCount = usePendingJobsCount();
  const pupilMsgCount = useUnreadMessagesCount(instructorId);
  const { unreadCount: testSwapCount } = useTestSwapNotifications();
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const visitorChatCount = useVisitorChatUnreadCount(instructorId);
  const { data: todayOverview } = useTodayOverview(instructorId);

  const firstName = instructor?.name?.split(" ")[0] ?? "there";
  const greeting = getTimeOfDayGreeting(new Date(), firstName);
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const trafficAlerts = alerts.filter((a) => a.type === "weather");
  const otherAlerts = alerts.filter((a) => a.type !== "weather");

  return (
    <div
      style={{
        background: "#F2F2F7",
        minHeight: "100vh",
        paddingBottom: 80,
        fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 20px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A", margin: 0 }}>
          Home
        </h1>
        <button
          aria-label="Notifications"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            border: "1px solid #E4E8EF",
          }}
        >
          <Bell size={16} color="#3D55A1" />
          {(pendingJobsCount + pupilMsgCount) > 0 && (
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 5,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#EF4444",
                border: "1.5px solid #FFFFFF",
              }}
            />
          )}
        </button>
      </div>
      <p style={{ padding: "0 20px 16px", fontSize: 13, color: "#6B7280", margin: 0 }}>
        {greeting} · {dateLabel}
      </p>

      {/* Up Next */}
      {nextLesson ? (
        <>
          <SectionLabel title="Now" />
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              margin: "0 16px 18px",
              overflow: "hidden",
              border: "1px solid #E4E8EF",
              boxShadow:
                "0 1px 0 rgba(15,23,42,0.04), 0 6px 16px -8px rgba(15,23,42,0.18), 0 22px 40px -20px rgba(61,85,161,0.22)",
            }}
          >
            <MiniMap />
            <div style={{ padding: 10 }}>
              {nextLesson.minutesUntil > 240 ? (
                <NextLessonPreviewCard
                  lessonId={nextLesson.lessonId}
                  pupilId={nextLesson.pupilId}
                  pupilName={nextLesson.pupilName}
                  pupilPhone={nextLesson.pupilPhone}
                  pupilProfileImage={nextLesson.pupilProfileImage}
                  lessonDate={nextLesson.lessonDate}
                  startTime={nextLesson.startTime}
                  durationMinutes={nextLesson.durationMinutes}
                  pickupPostcode={nextLesson.pickupPostcode}
                  pickupLocation={nextLesson.pickupLocation}
                  minutesUntil={nextLesson.minutesUntil}
                  instructorId={instructorId!}
                />
              ) : (
                <UpNextCard
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
                  instructorId={instructorId!}
                  checkInStatus={nextLesson.checkInStatus}
                  lessonStatus={nextLesson.lessonStatus as any}
                  lastLessonPlan={nextLesson.lastLessonPlan}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ margin: "0 16px 18px" }}>
          <QuietDayEmpty />
        </div>
      )}

      {/* Morning briefing */}
      <div style={{ margin: "0 0 6px" }}>
        <MorningBriefingCard instructorId={instructorId} />
      </div>

      {/* Needs attention — moved ABOVE today's schedule */}
      <SectionLabel title="Needs attention" />
      <Card padded={false}>
        <div style={{ padding: 10 }}>
          <ActivityTilesGrid
            pendingJobsCount={pendingJobsCount}
            unreadMessagesCount={pupilMsgCount + visitorChatCount}
            testRequestsCount={testSwapCount}
            gapSlotsCount={gapSuggestions?.length || 0}
          />
        </div>
        {(trafficAlerts.length > 0 || otherAlerts.length > 0) && (
          <div style={{ borderTop: "1px solid #EEF1F6", padding: 10 }}>
            {trafficAlerts.length > 0 && (
              <WeatherAlertBanner
                trafficAlerts={trafficAlerts}
                currentWeather={null}
                onDismissTraffic={dismissAlert}
                nextLessonMinutesUntil={nextLesson?.minutesUntil}
                nextLessonEtaMinutes={null}
                nextLessonPupilName={nextLesson?.pupilName}
                nextLessonPupilPhone={nextLesson?.pupilPhone}
              />
            )}
            {otherAlerts.length > 0 && (
              <DrivingAlertsStrip
                alerts={otherAlerts}
                onDismiss={dismissAlert}
                location={alertsLocation}
                className="mt-2"
              />
            )}
          </div>
        )}
        <div style={{ borderTop: "1px solid #EEF1F6" }}>
          <ImpactAlertCard instructorId={instructorId} />
        </div>
      </Card>

      {/* Today */}
      <SectionLabel title="Today" />
      <Card padded={false}>
        <HomeTodaySchedule instructorId={instructorId} />
      </Card>

      {/* This week — insights */}
      <SectionLabel title="Insights" />
      <Card padded={false}>
        <InsightTilesGrid instructorId={instructorId} gapCount={gapSuggestions?.length || 0} />
      </Card>

      {/* Quick actions */}
      <SectionLabel title="Quick actions" />
      <Card padded={false}>
        <div style={{ padding: 8 }}>
          <QuickAccessSwipeablePaged instructorId={instructorId} />
        </div>
      </Card>

      {/* Telematics */}
      <SectionLabel title="Telematics" />
      <Card padded={false}>
        <TelematicsTile />
        <div style={{ borderTop: "1px solid #EEF1F6" }}>
          <VehicleHealthCard instructorId={instructorId} />
        </div>
        <div style={{ borderTop: "1px solid #EEF1F6" }}>
          <IdleTimeCostCard instructorId={instructorId} />
        </div>
      </Card>

      {/* Milestones + upcoming events */}
      <div style={{ padding: "0 16px 24px" }}>
        <PupilMilestoneFeed instructorId={instructorId} />
        <div style={{ marginTop: 16 }}>
          <UpcomingEventsCard />
        </div>
      </div>

      <FloatingSessionBar instructorId={instructorId} />
    </div>
  );
}
