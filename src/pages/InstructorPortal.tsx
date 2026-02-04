import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Calendar, Users, Clock, TrendingUp, Settings, ChevronRight, CreditCard, Eye, EyeOff, Briefcase, Car, MapPin, CheckCircle2, AlertTriangle, Globe, CalendarCheck } from "lucide-react";
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
import { PaymentSummaryWidget } from "@/components/instructor/PaymentSummaryWidget";
import { GapsFiller } from "@/components/instructor/GapsFiller";
import { UpcomingTestsView } from "@/components/instructor/UpcomingTestsView";
import { InstructorMobileHome } from "@/components/instructor/InstructorMobileHome";
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { AvailabilityCalendar } from "@/components/instructor/AvailabilityCalendar";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { cn } from "@/lib/utils";

interface Pupil {
  id: string;
  name: string;
  lessons_completed: number | null;
  next_lesson: string | null;
  progress: number | null;
  account_balance: number | null;
  phone: string | null;
}

interface InstructorData {
  id: string;
  name: string;
  profile_image_url: string | null;
  payment_qr_url: string | null;
  is_active: boolean;
}

export default function InstructorPortal() {
  const { instructor: authInstructor, loading: authLoading, user, refreshInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  const navigate = useNavigate();
  
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
        .select("id, name, profile_image_url, payment_qr_url, is_active")
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
        .select("id, name, lessons_completed, next_lesson, progress, account_balance, phone")
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
          onPaymentClick={() => setPaymentModalOpen(true)}
        />
        <PaymentQRModal 
          open={paymentModalOpen} 
          onOpenChange={setPaymentModalOpen}
          paymentQrUrl={instructorData?.payment_qr_url}
          pupils={pupils}
          instructorId={instructorId}
          instructorName={instructorData?.name}
          onPaymentRecorded={fetchPupils}
        />
      </InstructorPortalLayout>
    );
  }

  // Desktop Layout - Professional & Trusted Design
  return (
    <InstructorPortalLayout>
      <div className="space-y-6">
        
        {/* Welcome Section with Online Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4"
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-foreground">
              {getGreeting()}, {instructorData?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shrink-0">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Online</span>
            <Switch
              checked={authInstructor?.is_active ?? false}
              onCheckedChange={handleVisibilityToggle}
              disabled={updatingVisibility}
            />
          </div>
        </motion.div>

        {/* Setup Checklist for new instructors */}
        <InstructorSetupChecklist 
          instructorId={instructorId} 
          variant="full"
        />

        {/* Stats Grid - Professional Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        >
          {[
            { 
              icon: Calendar, 
              label: "Today's Lessons", 
              value: String(todaysLessonCount), 
              change: todaysLessonCount > 0 ? `${todaysLessonCount} scheduled` : "No lessons",
              color: "text-blue-600", 
              bgColor: "bg-blue-50 dark:bg-blue-950/50" 
            },
            { 
              icon: TrendingUp, 
              label: "This Week", 
              value: statsLoading ? "..." : `£${monthEarnings.toLocaleString()}`, 
              change: "Monthly earnings",
              color: "text-emerald-600", 
              bgColor: "bg-emerald-50 dark:bg-emerald-950/50" 
            },
            { 
              icon: Users, 
              label: "Active Pupils", 
              value: String(pupils.length), 
              change: pupils.length > 0 ? `${pupils.length} enrolled` : "Add pupils",
              color: "text-violet-600", 
              bgColor: "bg-violet-50 dark:bg-violet-950/50" 
            },
            { 
              icon: Clock, 
              label: "Hours This Week", 
              value: statsLoading ? "..." : String(hoursThisWeek), 
              change: "Teaching hours",
              color: "text-amber-600", 
              bgColor: "bg-amber-50 dark:bg-amber-950/50" 
            },
          ].map((stat, i) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bgColor)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Job Alerts */}
        <JobOfferAlert instructorId={instructorId} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Left Column - Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2"
          >
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
                  <TabsList className="w-full grid grid-cols-3 mb-4">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                    <TabsTrigger value="gaps">Fill Gaps</TabsTrigger>
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
          </motion.div>

          {/* Right Column - Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Quick Actions */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {[
                  { label: "Add Lesson", icon: Calendar, to: "/instructor/schedule" },
                  { label: "Take Payment", icon: CreditCard, onClick: () => setPaymentModalOpen(true) },
                  { label: "New Pupil", icon: Users, to: "/instructor/pupils" },
                  { label: "Availability", icon: CalendarCheck, onClick: () => setAvailabilityModalOpen(true) },
                ].map((action, i) => (
                  action.to ? (
                    <Link key={i} to={action.to}>
                      <Button variant="outline" className="h-auto py-3 flex-col gap-1 w-full">
                        <action.icon className="w-5 h-5" />
                        <span className="text-xs">{action.label}</span>
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      key={i} 
                      variant="outline" 
                      className="h-auto py-3 flex-col gap-1"
                      onClick={action.onClick}
                    >
                      <action.icon className="w-5 h-5" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  )
                ))}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="border-border">
              <CardContent className="p-4">
                <PaymentSummaryWidget instructorId={instructorId} instructorName={instructorData?.name} />
              </CardContent>
            </Card>

            {/* Active Pupils */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Pupils
                  </span>
                  <Badge variant="secondary" className="text-xs">{pupils.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {pupils.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No pupils yet</p>
                  ) : (
                    pupils.slice(0, 5).map((pupil) => (
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
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Section - Tests */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <UpcomingTestsView instructorId={instructorId} />
        </motion.div>

        <PaymentQRModal
          open={paymentModalOpen} 
          onOpenChange={setPaymentModalOpen}
          paymentQrUrl={instructorData?.payment_qr_url}
          pupils={pupils}
          instructorId={instructorId}
          instructorName={instructorData?.name}
          onPaymentRecorded={fetchPupils}
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
