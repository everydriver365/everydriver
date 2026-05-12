import { useState, useEffect } from "react";

import { HomeSkeleton } from "@/components/ui/skeletons/HomeSkeleton";
import { ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JobOfferAlert } from "@/components/instructor/JobOfferAlert";
import { TodayScheduleView } from "@/components/instructor/TodayScheduleView";
import { TomorrowScheduleView } from "@/components/instructor/TomorrowScheduleView";
import { TakePaymentModal } from "@/components/instructor/TakePaymentModal";
import { PaymentSummaryWidget } from "@/components/instructor/PaymentSummaryWidget";
import { GapsFiller } from "@/components/instructor/GapsFiller";
import { UpcomingTestsView } from "@/components/instructor/UpcomingTestsView";
import { InstructorMobileHome } from "@/components/instructor/InstructorMobileHome";
import { MobileHomeRedesign } from "@/components/instructor/MobileHomeRedesign";
import { SettingsV2HomeView } from "@/components/instructor/SettingsV2HomeView";
import { useInstructorAppearance } from "@/hooks/useInstructorAppearance";

import { MileageTaxSavingsCard } from "@/components/instructor/dashboard/MileageTaxSavingsCard";
import { MessagesWidget } from "@/components/instructor/dashboard/MessagesWidget";
import { RetentionAlertsTile } from "@/components/instructor/dashboard/RetentionAlertsTile";
import { WhatsNewModal } from "@/components/shared/WhatsNewModal";
import { AICommandCenter } from "@/components/instructor/AICommandCenter";
import { WelcomeTour } from "@/components/instructor/WelcomeTour";

import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { AvailabilityCalendar } from "@/components/instructor/AvailabilityCalendar";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useDemoMode } from "@/context/DemoModeContext";
import { DemoModeBanner, DemoModeInviteCard } from "@/components/instructor/DemoModeBanner";
import { demoStats } from "@/data/demoModeData";
import { PDIBanner } from "@/components/instructor/PDIBanner";

import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { cn } from "@/lib/utils";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";

interface Pupil {
  id: string;
  name: string;
  lessons_completed: number | null;
  next_lesson: string | null;
  progress: number | null;
  account_balance: number | null;
  phone: string | null;
  email: string | null;
}

interface InstructorData {
  id: string;
  name: string;
  profile_image_url: string | null;
  payment_qr_url: string | null;
  payment_qr_url_pupil_pays: string | null;
  payment_qr_url_instructor_pays: string | null;
  commission_payer: string | null;
  is_active: boolean;
}

export default function InstructorPortal() {
  const { instructor: authInstructor, loading: authLoading, user, refreshInstructor, subscription, signOut } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };
  
  const [instructorData, setInstructorData] = useState<InstructorData | null>(null);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [pupilsLoading, setPupilsLoading] = useState(true);
  const [todaysLessonCount, setTodaysLessonCount] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  
  const isMobile = useIsMobile();
  const { hoursThisWeek, monthEarnings, loading: statsLoading } = useInstructorLiveStats(instructorId);
  const { layoutStyle } = useInstructorAppearance(instructorId);

  const handleVisibilityToggle = async (isVisible: boolean) => {
    if (!instructorId) return;
    setUpdatingVisibility(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ is_active: isVisible })
        .eq("id", instructorId);

      if (error) throw error;
      await refreshInstructor();
      toast.success(isVisible ? "You're now visible online" : "You're now hidden online");
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    } finally {
      setUpdatingVisibility(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/instructor-app/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (instructorId) {
      fetchInstructor();
      fetchPupils();
      fetchTodaysLessonCount();
    }
  }, [instructorId]);

  const fetchInstructor = async () => {
    if (!instructorId) return;
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, name, profile_image_url, payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays, commission_payer, is_active")
        .eq("id", instructorId)
        .single();

      if (error) throw error;
      setInstructorData(data);
    } catch (error) {
      console.error("Error fetching instructor:", error);
    }
  };

  const fetchPupils = async () => {
    if (!instructorId) return;
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name, lessons_completed, next_lesson, progress, account_balance, phone, email")
        .eq("instructor_id", instructorId)
        .order("name", { ascending: true });

      if (error) throw error;
      setPupils(data || []);
    } catch (error) {
      console.error("Error fetching pupils:", error);
    } finally {
      setPupilsLoading(false);
    }
  };

  const fetchTodaysLessonCount = async () => {
    if (!instructorId) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { count, error } = await supabase
        .from("scheduled_lessons")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .eq("lesson_date", today)
        .neq("status", "cancelled");

      if (error) throw error;
      setTodaysLessonCount(count || 0);
    } catch (error) {
      console.error("Error fetching today's lessons:", error);
    }
  };


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  };

  if (authLoading) {
    return (
      <InstructorPortalLayout>
        <HomeSkeleton />
      </InstructorPortalLayout>
    );
  }

  if (!instructorId && user) {
    return (
      <InstructorPortalLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <p className="text-muted-foreground mb-4">No instructor profile found for this account.</p>
          <Button onClick={() => navigate("/instructor-app/signup")}>
            Complete Signup
          </Button>
        </div>
      </InstructorPortalLayout>
    );
  }

  if (!instructorId) {
    return null;
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <InstructorPortalLayout>
        <div className="space-y-0">
        <DemoModeBanner />
        {layoutStyle === "settings-v2" ? (
          <SettingsV2HomeView instructorId={instructorId} instructor={instructorData as any} />
        ) : (
          <MobileHomeRedesign
            instructorId={instructorId}
            instructorName={instructorData?.name}
          />
        )}
        <TakePaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          paymentQrUrl={getActivePaymentQrUrl(instructorData)}
          commissionPayer={instructorData?.commission_payer}
          commissionSplitPercent={authInstructor?.commission_split_percent}
          instructorName={instructorData?.name}
          instructorId={instructorId}
          pupils={pupils}
        />
        <WelcomeTour instructorId={instructorId} hasCompletedTour={(authInstructor as any)?.has_completed_tour ?? true} />
        </div>
      </InstructorPortalLayout>
    );
  }

  // Desktop Layout — redesigned (dashboardV2)
  return (
    <DesktopDashboardV2
      instructorId={instructorId}
      instructorData={instructorData}
      authInstructor={authInstructor}
      pupils={pupils}
      todaysLessonCount={todaysLessonCount}
      monthEarnings={monthEarnings}
      hoursThisWeek={hoursThisWeek}
      statsLoading={statsLoading}
      isDemoMode={isDemoMode}
      updatingVisibility={updatingVisibility}
      onVisibilityToggle={handleVisibilityToggle}
      onSignOut={handleSignOut}
      paymentModalOpen={paymentModalOpen}
      setPaymentModalOpen={setPaymentModalOpen}
      availabilityModalOpen={availabilityModalOpen}
      setAvailabilityModalOpen={setAvailabilityModalOpen}
      getGreeting={getGreeting}
    />
  );
}

// ---------------------------------------------------------------------------
// Desktop redesign (calm SaaS dashboard)
// ---------------------------------------------------------------------------
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { StatusStrip } from "@/components/instructor/dashboardV2/StatusStrip";
import { GreetingBlock } from "@/components/instructor/dashboardV2/GreetingBlock";
import { StatCardV2 } from "@/components/instructor/dashboardV2/StatCardV2";
import { TodaySchedulePanel } from "@/components/instructor/dashboardV2/TodaySchedulePanel";
import { MoneyStack } from "@/components/instructor/dashboardV2/MoneyStack";
import { RetentionAlertsPanel } from "@/components/instructor/dashboardV2/RetentionAlertsPanel";
import { DvsaIndicatorsPanel } from "@/components/instructor/dashboardV2/DvsaIndicatorsPanel";
import { PerformanceMetricsRow } from "@/components/instructor/dashboardV2/PerformanceMetricsRow";
import { RightRail } from "@/components/instructor/dashboardV2/RightRail";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useDailyEarnings } from "@/hooks/useDailyEarnings";
import { RealtimeHubProvider } from "@/hooks/useRealtimeHub";

interface DesktopDashboardV2Props {
  instructorId: string;
  instructorData: InstructorData | null;
  authInstructor: any;
  pupils: Pupil[];
  todaysLessonCount: number;
  monthEarnings: number;
  hoursThisWeek: number;
  statsLoading: boolean;
  isDemoMode: boolean;
  updatingVisibility: boolean;
  onVisibilityToggle: (v: boolean) => void;
  onSignOut: () => void;
  paymentModalOpen: boolean;
  setPaymentModalOpen: (v: boolean) => void;
  availabilityModalOpen: boolean;
  setAvailabilityModalOpen: (v: boolean) => void;
  getGreeting: () => string;
}

function DesktopDashboardV2(props: DesktopDashboardV2Props) {
  const {
    instructorId, instructorData, authInstructor, pupils, todaysLessonCount,
    monthEarnings, hoursThisWeek, statsLoading, isDemoMode, updatingVisibility,
    onVisibilityToggle, onSignOut, paymentModalOpen, setPaymentModalOpen,
    availabilityModalOpen, setAvailabilityModalOpen, getGreeting,
  } = props;

  const navigate = useNavigate();
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const { total: notificationCount } = useCombinedNotificationCount(instructorId);
  const { data: earnings } = useDailyEarnings(instructorId);

  const firstName = instructorData?.name?.split(" ")[0] || "there";
  const initials = (instructorData?.name || "")
    .split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "ID";

  const subtitle = todaysLessonCount > 0
    ? `${todaysLessonCount} lesson${todaysLessonCount !== 1 ? "s" : ""} today`
    : "No lessons today — perfect for catching up";

  // Outstanding totals from pupil balances (negative = owes money)
  const owing = pupils.filter(p => (p.account_balance ?? 0) < 0);
  const outstandingTotal = owing.reduce((sum, p) => sum + Math.abs(p.account_balance ?? 0), 0);

  // Sparklines from daily earnings (last 7 days)
  const dailySeries = (earnings?.dailyEarnings ?? []).slice(-7).map(d => d.amount);
  const todaySeries = dailySeries.length ? dailySeries.map(v => (v > 0 ? 1 : 0)) : [];

  return (
    <RealtimeHubProvider instructorId={instructorId}>
      <DashboardShell
        userInitials={initials}
        userName={instructorData?.name || "Instructor"}
        notificationCount={notificationCount}
        onSignOut={onSignOut}
        onAskED={() => {
          // AICommandCenter mounts globally below; trigger via custom event
          window.dispatchEvent(new CustomEvent("dsm:open-ai"));
        }}
        onBell={() => navigate("/instructor/notifications")}
        rightRail={
          <RightRail
            pupilCount={pupils.length}
            onAddLesson={() => setAddLessonOpen(true)}
            onTakePayment={() => setPaymentModalOpen(true)}
          />
        }
      >
        <div className="flex flex-col" style={{ gap: 24 }}>
          <StatusStrip />

          <GreetingBlock
            greeting={getGreeting()}
            name={firstName}
            subtitle={subtitle}
            isActive={!!authInstructor?.is_active}
            onToggle={onVisibilityToggle}
            disabled={updatingVisibility}
          />

          {/* Stat cards */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            <StatCardV2
              label="Today"
              value={isDemoMode ? demoStats.todayLessonCount : todaysLessonCount}
              data={todaySeries}
              onClick={() => navigate("/instructor/schedule")}
            />
            <StatCardV2
              label="This Month"
              value={statsLoading ? "—" : `£${(isDemoMode ? demoStats.monthEarnings : monthEarnings).toLocaleString()}`}
              data={dailySeries}
              color="#10B981"
              onClick={() => navigate("/instructor/pay")}
            />
            <StatCardV2
              label="Active Pupils"
              value={isDemoMode ? demoStats.activePupils : pupils.length}
              onClick={() => navigate("/instructor/pupils")}
            />
            <StatCardV2
              label="This Week"
              value={statsLoading ? "—" : `${isDemoMode ? demoStats.hoursThisWeek : hoursThisWeek}h`}
              onClick={() => navigate("/instructor/schedule")}
            />
          </div>

          <PerformanceMetricsRow
            instructorId={instructorId}
            activePupilCount={isDemoMode ? demoStats.activePupils : pupils.length}
          />

          {/* Schedule + Money */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
            <TodaySchedulePanel
              instructorId={instructorId}
              todayCount={todaysLessonCount}
              onAddLesson={() => setAddLessonOpen(true)}
            />
            <MoneyStack
              monthEarnings={isDemoMode ? demoStats.monthEarnings : monthEarnings}
              paymentsCount={0}
              outstanding={outstandingTotal}
              outstandingCount={owing.length}
            />
          </div>

          <DvsaIndicatorsPanel instructorId={instructorId} />
          <RetentionAlertsPanel instructorId={instructorId} />
        </div>

        <WhatsNewModal portalType="instructor" userId={instructorId} />

        <TakePaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          paymentQrUrl={getActivePaymentQrUrl(instructorData)}
          commissionPayer={instructorData?.commission_payer}
          commissionSplitPercent={authInstructor?.commission_split_percent}
          instructorName={instructorData?.name}
          instructorId={instructorId}
          pupils={pupils}
        />

        <Dialog open={availabilityModalOpen} onOpenChange={setAvailabilityModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Availability</DialogTitle>
            </DialogHeader>
            <AvailabilityCalendar
              instructorId={instructorId}
              onClose={() => setAvailabilityModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <AddLessonSheet
          open={addLessonOpen}
          onOpenChange={setAddLessonOpen}
          instructorId={instructorId}
          onSuccess={() => setAddLessonOpen(false)}
        />

        <AICommandCenter />
      </DashboardShell>
    </RealtimeHubProvider>
  );
}
