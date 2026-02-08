import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { ReminderStatusWidget } from "@/components/instructor/dashboard/ReminderStatusWidget";
import { ReferralStatsWidget } from "@/components/instructor/dashboard/ReferralStatsWidget";
import { NotesWidget } from "@/components/instructor/dashboard/NotesWidget";
import { MessagesWidget } from "@/components/instructor/dashboard/MessagesWidget";
import { TodoHomeTile } from "@/components/instructor/TodoHomeTile";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import edLogo from "@/assets/ed-black-white-logo.png";
import { AvailabilityCalendar } from "@/components/instructor/AvailabilityCalendar";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
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
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
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
      </InstructorPortalLayout>
    );
  }

  // Desktop Layout - Bold & Branded
  return (
    <InstructorPortalLayout>
      <div className="space-y-6">

        {/* Welcome Hero */}
        <div className="bg-gradient-to-r from-[#142040] to-[#1e3a6e] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-white/20">
              <AvatarImage src={instructorData?.profile_image_url || undefined} />
              <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                {instructorData?.name ? getInitials(instructorData.name) : "I"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold">
                {getGreeting()}, {instructorData?.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                {todaysLessonCount > 0
                  ? `${todaysLessonCount} lesson${todaysLessonCount !== 1 ? 's' : ''} today · ${authInstructor?.is_active ? 'Online' : 'Offline'}`
                  : `No lessons today · ${authInstructor?.is_active ? 'Online' : 'Offline'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2">
              <Globe className="h-4 w-4 text-white/60" />
              <span className="text-sm text-white/80">Online</span>
              <Switch
                checked={authInstructor?.is_active ?? false}
                onCheckedChange={handleVisibilityToggle}
                disabled={updatingVisibility}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Button variant="outline" size="sm" onClick={() => navigate("/instructor/schedule?action=add")} className="gap-1 h-7 px-2 text-xs shrink-0">
            <Plus className="h-3 w-3" /> Add Lesson
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/instructor/pupils?action=bespoke")} className="gap-1 h-7 px-2 text-xs shrink-0">
            <Briefcase className="h-3 w-3" /> Bespoke
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPaymentSheetOpen(true)} className="gap-1 h-7 px-2 text-xs shrink-0">
            <PoundSterling className="h-3 w-3" /> Payment
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/instructor/messages?action=new")} className="gap-1 h-7 px-2 text-xs shrink-0">
            <MessageSquare className="h-3 w-3" /> Text
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/instructor/pupils?action=add")} className="gap-1 h-7 px-2 text-xs shrink-0">
            <Users className="h-3 w-3" /> New Pupil
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/instructor/schedule?tab=gaps")} className="gap-1 h-7 px-2 text-xs shrink-0">
            <Calendar className="h-3 w-3" /> Fill Gaps
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/instructor/payments?action=reminder")} className="gap-1 h-7 px-2 text-xs shrink-0">
            <CreditCard className="h-3 w-3" /> Reminder
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAvailabilityModalOpen(true)} className="gap-1 h-7 px-2 text-xs shrink-0">
            <CalendarCheck className="h-3 w-3" /> Availability
          </Button>
        </div>

        {/* Setup Checklist for new instructors */}
        <InstructorSetupChecklist instructorId={instructorId} variant="full" />

        {/* Stats Grid - Bold Metric Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { 
              icon: Calendar, 
              label: "Today's Lessons", 
              value: String(todaysLessonCount), 
              change: todaysLessonCount > 0 ? `${todaysLessonCount} scheduled` : "No lessons",
              color: "bg-primary/10 text-primary",
            },
            { 
              icon: TrendingUp, 
              label: "Monthly Earnings", 
              value: statsLoading ? "..." : `£${monthEarnings.toLocaleString()}`, 
              change: "This month",
              color: "bg-emerald-500/10 text-emerald-600",
            },
            { 
              icon: Users, 
              label: "Active Pupils", 
              value: String(pupils.length), 
              change: pupils.length > 0 ? `${pupils.length} enrolled` : "Add pupils",
              color: "bg-amber-500/10 text-amber-600",
            },
            { 
              icon: Clock, 
              label: "Hours This Week", 
              value: statsLoading ? "..." : String(hoursThisWeek), 
              change: "Teaching hours",
              color: "bg-purple-500/10 text-purple-600",
            },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={cn("w-10 h-10 flex items-center justify-center", stat.color)}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Job Alerts */}
        <JobOfferAlert instructorId={instructorId} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Left Column - Schedule */}
          <div className="lg:col-span-2">
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
          </div>

          {/* Right Column - Widgets */}
          <div className="space-y-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <PaymentSummaryWidget instructorId={instructorId} instructorName={instructorData?.name} />
              </CardContent>
            </Card>
            <TodoHomeTile instructorId={instructorId} />
            <NotesWidget instructorId={instructorId} />
            <MessagesWidget instructorId={instructorId} />
            <PlanWidget />
            <ReminderStatusWidget />
            <ReferralStatsWidget />
          </div>
        </div>

        {/* Bottom Section - Tests */}
        <div>
          <UpcomingTestsView instructorId={instructorId} />
        </div>

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

    </InstructorPortalLayout>
  );
}
