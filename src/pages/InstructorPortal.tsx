import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HomeSkeleton } from "@/components/ui/skeletons/HomeSkeleton";
import { User, Calendar, Users, Clock, TrendingUp, Settings, ChevronRight, CreditCard, Eye, EyeOff, Briefcase, Car, MapPin, CheckCircle2, AlertTriangle, Globe, CalendarCheck, MessageSquare, Plus, PoundSterling, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JobOfferAlert } from "@/components/instructor/JobOfferAlert";
import { TodayScheduleView } from "@/components/instructor/TodayScheduleView";
import { TomorrowScheduleView } from "@/components/instructor/TomorrowScheduleView";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { TakePaymentSheet } from "@/components/instructor/TakePaymentSheet";
import { PaymentSummaryWidget } from "@/components/instructor/PaymentSummaryWidget";
import { GapsFiller } from "@/components/instructor/GapsFiller";
import { UpcomingTestsView } from "@/components/instructor/UpcomingTestsView";
import { InstructorMobileHome } from "@/components/instructor/InstructorMobileHome";

import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { UnifiedAgendaTile } from "@/components/instructor/dashboard/UnifiedAgendaTile";
import { ReferralStatsWidget } from "@/components/instructor/dashboard/ReferralStatsWidget";
import { MileageTaxSavingsCard } from "@/components/instructor/dashboard/MileageTaxSavingsCard";
import { ReferralCard } from "@/components/instructor/ReferralCard";
import { NotesWidget } from "@/components/instructor/dashboard/NotesWidget";
import { MessagesWidget } from "@/components/instructor/dashboard/MessagesWidget";
import { RetentionAlertsTile } from "@/components/instructor/dashboard/RetentionAlertsTile";
import { WhatsNewModal } from "@/components/shared/WhatsNewModal";
import { AICommandCenter } from "@/components/instructor/AICommandCenter";
import { WelcomeTour } from "@/components/instructor/WelcomeTour";

import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import edLogo from "@/assets/ed-black-white-logo.png";
import { AvailabilityCalendar } from "@/components/instructor/AvailabilityCalendar";
import { TodayAtAGlance } from "@/components/instructor/TodayAtAGlance";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { PDIBanner } from "@/components/instructor/PDIBanner";
import { PlanBadge } from "@/components/instructor/PlanBadge";
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
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };
  
  const [instructorData, setInstructorData] = useState<InstructorData | null>(null);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [pupilsLoading, setPupilsLoading] = useState(true);
  const [todaysLessonCount, setTodaysLessonCount] = useState(0);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [paymentQROpen, setPaymentQROpen] = useState(false);
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

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
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
        <InstructorMobileHome 
          instructor={instructorData}
          todaysLessonCount={todaysLessonCount}
          onPaymentClick={() => setPaymentSheetOpen(true)}
        />
        <TakePaymentSheet
          open={paymentSheetOpen}
          onOpenChange={setPaymentSheetOpen}
          paymentQrUrl={getActivePaymentQrUrl(instructorData)}
          commissionPayer={instructorData?.commission_payer}
          instructorName={instructorData?.name}
          instructorId={instructorId}
          pupils={pupils}
          onShowQR={() => setPaymentQROpen(true)}
          onRecordPayment={() => navigate("/instructor/pupils")}
        />
        <PaymentQRModal
          open={paymentQROpen}
          onOpenChange={setPaymentQROpen}
          paymentQrUrl={getActivePaymentQrUrl(instructorData)}
          commissionPayer={instructorData?.commission_payer}
          instructorName={instructorData?.name}
        />
        <WelcomeTour instructorId={instructorId} hasCompletedTour={(authInstructor as any)?.has_completed_tour ?? true} />
      </InstructorPortalLayout>
    );
  }

  // Desktop Layout - Bold & Branded
  return (
    <InstructorPortalLayout>
      <div className="space-y-5">

        {/* PDI Banner */}
        {(subscription as any)?.is_pdi_programme && (
          <PDIBanner instructorName={instructorData?.name?.split(' ')[0]} />
        )}

        {/* Contextual Status Bar — replaces heavy hero */}
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={instructorData?.profile_image_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {instructorData?.name ? getInitials(instructorData.name) : "I"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {getGreeting()}, {instructorData?.name?.split(' ')[0] || 'there'}
              </p>
              <p className="text-xs text-muted-foreground">
                {todaysLessonCount > 0
                  ? `${todaysLessonCount} lesson${todaysLessonCount !== 1 ? 's' : ''} today`
                  : 'No lessons today'}
                {' · '}
                {pupils.filter(p => (Number(p.account_balance) || 0) < 0).length > 0
                  ? `${pupils.filter(p => (Number(p.account_balance) || 0) < 0).length} unpaid`
                  : 'All paid up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm",
              authInstructor?.is_active
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-muted border-border text-muted-foreground"
            )}>
              <Globe className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{authInstructor?.is_active ? 'Online' : 'Offline'}</span>
              <Switch
                checked={authInstructor?.is_active ?? false}
                onCheckedChange={handleVisibilityToggle}
                disabled={updatingVisibility}
                className="data-[state=checked]:bg-emerald-500 scale-90"
              />
            </div>
          </div>
        </div>

        {/* Inline Stats Strip */}
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/instructor/schedule")}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 hover:shadow-sm transition-all text-left group"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{todaysLessonCount}</p>
              <p className="text-[11px] text-muted-foreground">Today's Lessons</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/instructor/pay")}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-emerald-500/30 hover:shadow-sm transition-all text-left group"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{statsLoading ? '...' : `£${monthEarnings.toLocaleString()}`}</p>
              <p className="text-[11px] text-muted-foreground">This Month</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/instructor/pupils")}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-amber-500/30 hover:shadow-sm transition-all text-left group"
          >
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{pupils.length}</p>
              <p className="text-[11px] text-muted-foreground">Active Pupils</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/instructor/schedule")}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-purple-500/30 hover:shadow-sm transition-all text-left group"
          >
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{statsLoading ? '...' : hoursThisWeek}</p>
              <p className="text-[11px] text-muted-foreground">Hours This Week</p>
            </div>
          </button>
        </div>

        {/* Today at a Glance */}
        <TodayAtAGlance instructorId={instructorId} />

        {/* Main 2-Column Dashboard Grid */}
        <div className="grid gap-5 lg:grid-cols-3">
          
          {/* Left Column - Schedule & Primary Content */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Today's Schedule</CardTitle>
                  <Link to="/instructor/schedule">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      View Full Calendar <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="today" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 mb-4">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                    <TabsTrigger value="pupils">Pupils</TabsTrigger>
                    <TabsTrigger value="gaps">Fill Gaps</TabsTrigger>
                  </TabsList>
                  <TabsContent value="today">
                    <TodayScheduleView instructorId={instructorId} />
                  </TabsContent>
                  <TabsContent value="tomorrow">
                    <TomorrowScheduleView instructorId={instructorId} />
                  </TabsContent>
                  <TabsContent value="pupils">
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {pupils.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No pupils yet</p>
                      ) : (
                        pupils.map((pupil) => (
                          <div key={pupil.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                              {pupil.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{pupil.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {pupil.lessons_completed || 0} lessons
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">{pupil.progress || 0}%</div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link to="/instructor/pupils">
                      <Button variant="ghost" className="w-full mt-3 text-xs h-8">
                        View All <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
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

          {/* Right Column - Messages, Payments, Alerts */}
          <div className="space-y-4">
            <MessagesWidget instructorId={instructorId} />
            <Card className="border-border">
              <CardContent className="p-4">
                <PaymentSummaryWidget instructorId={instructorId} instructorName={instructorData?.name} />
              </CardContent>
            </Card>
            <RetentionAlertsTile instructorId={instructorId} />
            <UnifiedAgendaTile instructorId={instructorId} />
            <NotesWidget instructorId={instructorId} />
            <PlanWidget />
            <ReferralStatsWidget />
            <ReferralCard />
          </div>
        </div>

        {/* What's New */}
        <WhatsNewModal portalType="instructor" userId={instructorId} />

        <TakePaymentSheet
          open={paymentSheetOpen}
          onOpenChange={setPaymentSheetOpen}
          paymentQrUrl={getActivePaymentQrUrl(instructorData)}
          commissionPayer={instructorData?.commission_payer}
          instructorName={instructorData?.name}
          instructorId={instructorId}
          pupils={pupils}
          onShowQR={() => setPaymentQROpen(true)}
          onRecordPayment={() => navigate("/instructor/pupils")}
        />
        <PaymentQRModal
          open={paymentQROpen}
          onOpenChange={setPaymentQROpen}
          paymentQrUrl={getActivePaymentQrUrl(instructorData)}
          commissionPayer={instructorData?.commission_payer}
          instructorName={instructorData?.name}
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
