import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Calendar, CalendarPlus } from "lucide-react";
import { MapHero } from "./MapHero";
import { StatTile } from "./StatTile";
import { RowCard } from "./RowCard";
import { TelematicsPanel } from "./TelematicsPanel";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";

import { HomeQuickActions } from "@/components/instructor/HomeQuickActions";
import { TodayLessonsList } from "@/components/instructor/TodayLessonsList";
import { SmartRemindersCard } from "@/components/instructor/SmartRemindersCard";
import { WaitingRoomPromoTile } from "@/components/instructor/WaitingRoomPromoTile";
import { BottomPromoGroup } from "@/components/instructor/BottomPromoGroup";
import { VehicleHealthCard } from "@/components/instructor/VehicleHealthCard";
import { UpcomingEventsCard } from "@/components/instructor/UpcomingEventsCard";

interface Props {
  instructorId: string | undefined;
  firstName: string;
  instructor?: any;
  onPaymentClick?: () => void;
  pendingJobsCount?: number;
  unreadCount?: number;
  testSwapCount?: number;
  gapSlotsCount?: number;
  todayLessons?: any;
  tomorrowLessons?: any;
  nextLesson?: any;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

export function RedesignedMobileHome({
  instructorId,
  firstName,
  instructor,
  onPaymentClick,
  pendingJobsCount = 0,
  unreadCount = 0,
  testSwapCount = 0,
  gapSlotsCount = 0,
  todayLessons,
  tomorrowLessons,
}: Props) {
  const navigate = useNavigate();
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const pendingJobs = usePendingJobsCount();
  const { data: unread } = useUnreadMessagesCount(instructorId);
  const { swapCount } = useCombinedNotificationCount(instructorId);
  const { data: gapSlots } = useRealGapSlots(instructorId);
  const { durationMinutes: etaMinutes } = useTrafficETA(
    nextLesson && nextLesson.minutesUntil <= 120 ? nextLesson.pickupPostcode : null
  );

  // Vehicle (best-effort)
  const { devices, vehicles } = useVehicleHealth() as any;
  const primaryDevice = devices?.[0];
  const primaryVehicle = primaryDevice?.vehicle || vehicles?.[0];
  const vehicleReg: string | null = primaryVehicle?.registration || null;
  const vehicleName: string | null =
    [primaryVehicle?.make, primaryVehicle?.model].filter(Boolean).join(" ") || null;
  const vehicleOnline: boolean = primaryDevice?.is_connected ?? false;

  // Re-render every 60s to keep countdown live
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const countdown = useMemo(() => {
    const m = nextLesson?.minutesUntil ?? 0;
    if (!nextLesson) return "—";
    if (m <= 0) return "now";
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  }, [nextLesson]);

  const dateStr = format(new Date(), "EEEE, d MMMM yyyy");

  return (
    <div
      style={{
        background: "#f5f6fa",
        minHeight: "100%",
        fontFamily: "-apple-system, 'SF Pro Text', 'SF Pro Display', Inter, sans-serif",
      }}
    >
      {/* Greeting */}
      <div style={{ padding: "8px 16px 4px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0a0e27", letterSpacing: "-0.01em" }}>
          {getGreeting()}, {firstName}
        </h1>
        <p style={{ fontSize: 12, color: "#5F5E5A", marginTop: 2 }}>{dateStr}</p>
      </div>

      <div style={{ padding: "8px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <MapHero
          countdown={countdown}
          pickupLocation={nextLesson?.pickupLocation || null}
          pickupPostcode={nextLesson?.pickupPostcode || null}
          startTime={nextLesson?.startTime || null}
          etaMinutes={etaMinutes ?? null}
          lessonId={nextLesson?.lessonId}
        />

        {/* 2x2 stat tiles */}
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="Earnings"
            value={`£${weeklyGoals?.earningsThisWeek ?? 0}`}
            caption="This week"
            onClick={() => navigate("/instructor/income")}
          />
          <StatTile
            label="Job offers"
            value={pendingJobs ?? 0}
            caption={pendingJobs > 0 ? `${pendingJobs} pending` : "None pending"}
            urgent={pendingJobs > 0}
            onClick={() => navigate("/instructor/jobs")}
          />
          <StatTile
            label="This week"
            value={weeklyGoals?.lessonsThisWeek ?? 0}
            caption="Lessons"
            onClick={() => navigate("/instructor/schedule")}
          />
          <StatTile
            label="Messages"
            value={unread ?? 0}
            caption={(unread ?? 0) === 0 ? "All caught up" : "Unread"}
            onClick={() => navigate("/instructor/messages")}
          />
        </div>

        {/* Tests row */}
        <RowCard
          accentColor="#1a6fd4"
          iconBg="#e6f1fb"
          iconColor="#1a6fd4"
          Icon={Calendar}
          title="Tests"
          caption="Swap requests"
          pillValue={swapCount ?? 0}
          pillBg="#1a6fd4"
          pillFg="#ffffff"
          onClick={() => navigate("/instructor/tests")}
        />

        {/* Fill gaps row */}
        <RowCard
          accentColor="#1a1a1a"
          iconBg="#f1efe8"
          iconColor="#1a1a1a"
          Icon={CalendarPlus}
          title="Fill gaps"
          caption="Open slots this week"
          pillValue={gapSlots?.length ?? 0}
          pillBg="#1a1a1a"
          pillFg="#ffffff"
          onClick={() => navigate("/instructor/schedule")}
        />

        {/* Telematics panel */}
        <TelematicsPanel
          reg={vehicleReg}
          vehicle={vehicleName}
          isOnline={vehicleOnline}
          onClick={() => navigate("/instructor/telematics")}
        />

        {/* ── Restored sections from previous home ─────────────────── */}

        <div className="pt-4 pb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Today
          </h2>
        </div>

        {todayLessons && todayLessons.length > 0 && instructorId && (
          <TodayLessonsList lessons={todayLessons} instructorId={instructorId} />
        )}

        <SmartRemindersCard />

        <div className="pt-4 pb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick actions
          </h2>
        </div>
        <HomeQuickActions onTakePayment={onPaymentClick} />

        {instructorId && <VehicleHealthCard instructorId={instructorId} />}

        <UpcomingEventsCard />

        <WaitingRoomPromoTile />

        <BottomPromoGroup />
      </div>
    </div>
  );
}
