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
        <InstructorMobileHome 
          instructor={instructorData}
          todaysLessonCount={todaysLessonCount}
          onPaymentClick={() => setPaymentModalOpen(true)}
        />
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

  // Desktop Layout — calm, system palette
  
  const lessonsTodayLabel =
    todaysLessonCount > 0
      ? `${todaysLessonCount} lesson${todaysLessonCount !== 1 ? "s" : ""} today`
      : "No lessons today — perfect for catching up";

  return (
    <InstructorPortalLayout>
      <div className="space-y-3" style={{ backgroundColor: "hsl(var(--dsm-bg))" }}>

        {/* Demo Mode Banner */}
        <DemoModeBanner />

        {/* PDI Banner */}
        {(subscription as any)?.is_pdi_programme && (
          <PDIBanner instructorName={instructorData?.name?.split(' ')[0]} />
        )}

        {/* Calm header card — greeting + online pill */}
        <div className="flex items-center justify-between bg-card rounded-2xl px-5 py-4">
          <div>
            <h1
              className="text-foreground"
              style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.4px", margin: 0 }}
            >
              {getGreeting()}, {instructorData?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: 13, margin: "2px 0 0" }}>
              {lessonsTodayLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5",
                authInstructor?.is_active
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
              style={{ fontSize: 11, fontWeight: 500 }}
            >
              <span
                className={cn(
                  "inline-block rounded-full",
                  authInstructor?.is_active ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}
                style={{ width: 6, height: 6 }}
              />
              {authInstructor?.is_active ? "Online" : "Offline"}
              <Switch
                checked={authInstructor?.is_active ?? false}
                onCheckedChange={handleVisibilityToggle}
                disabled={updatingVisibility}
                className="data-[state=checked]:bg-emerald-500 scale-75 ml-1"
              />
            </div>
          </div>
        </div>

        {/* KPI tiles — calm, no saturated icons */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: "Today",
              value: isDemoMode ? demoStats.todayLessonCount : todaysLessonCount,
              to: "/instructor/schedule",
            },
            {
              label: "This month",
              value: isDemoMode
                ? `£${demoStats.monthEarnings.toLocaleString()}`
                : statsLoading
                  ? "—"
                  : `£${monthEarnings.toLocaleString()}`,
              to: "/instructor/pay",
            },
            {
              label: "Active pupils",
              value: isDemoMode ? demoStats.activePupils : pupils.length,
              to: "/instructor/pupils",
            },
            {
              label: "This week",
              value: isDemoMode
                ? `${demoStats.hoursThisWeek}h`
                : statsLoading
                  ? "—"
                  : `${hoursThisWeek}h`,
              to: "/instructor/schedule",
            },
          ].map((tile) => (
            <button
              key={tile.label}
              onClick={() => navigate(tile.to)}
              className="bg-card rounded-xl px-4 py-3 text-left hover:bg-card/80 transition-colors"
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#6E6E73",
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  margin: "0 0 4px",
                }}
              >
                {tile.label}
              </p>
              <p
                className="text-foreground tabular-nums"
                style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.3px", margin: 0 }}
              >
                {tile.value}
              </p>
            </button>
          ))}
        </div>

        {/* Demo Mode Invite for empty accounts */}
        {!isDemoMode && pupils.length === 0 && todaysLessonCount === 0 && (
          <DemoModeInviteCard />
        )}

        {/* Main 2-Column Dashboard Grid */}
        <div className="grid gap-3 lg:grid-cols-3">
          
          {/* Left Column - Schedule & Primary Content */}
          <div className="lg:col-span-2 space-y-3">
            <Card className="border-0 shadow-none rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" style={{ fontWeight: 500, letterSpacing: "-0.3px" }}>
                    Today's schedule
                  </CardTitle>
                  <Link to="/instructor/schedule">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      View calendar <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="today" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 mb-4">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                    <TabsTrigger value="gaps">Fill gaps</TabsTrigger>
                  </TabsList>
                  <TabsContent value="today">
                    <TodayScheduleView instructorId={instructorId} />
                  </TabsContent>
                  <TabsContent value="tomorrow">
                    <TomorrowScheduleView instructorId={instructorId} />
                  </TabsContent>
                  <TabsContent value="gaps">
                    <GapsFiller instructorId={instructorId} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            <UpcomingTestsView instructorId={instructorId} />

            {/* Job Alerts in main column */}
            <JobOfferAlert instructorId={instructorId} />
          </div>

          {/* Right Column — consolidated to 4 cards */}
          <div className="space-y-3">
            {/* This month */}
            <Card className="border-0 shadow-none rounded-2xl">
              <CardContent className="p-4">
                <PaymentSummaryWidget instructorId={instructorId} instructorName={instructorData?.name} />
              </CardContent>
            </Card>

            {/* Needs attention (was Retention Alerts) */}
            <RetentionAlertsTile instructorId={instructorId} />

            {/* Tax savings */}
            <MileageTaxSavingsCard instructorId={instructorId} />

            {/* Messages */}
            <MessagesWidget instructorId={instructorId} />
          </div>
        </div>

        {/* What's New */}
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

        {/* Availability Calendar Modal */}
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
      </div>

      <AICommandCenter />
    </InstructorPortalLayout>
  );
}
