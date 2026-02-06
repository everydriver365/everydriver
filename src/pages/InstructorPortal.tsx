import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Calendar, Users, Clock, TrendingUp, Settings, ChevronRight, CreditCard, Eye, EyeOff, Briefcase, Car, MapPin, CheckCircle2, AlertTriangle, Globe, CalendarCheck, Search, MessageSquare, Plus, PoundSterling } from "lucide-react";
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
import edLogo from "@/assets/ed-black-white-logo.png";
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
  const [pupilSearch, setPupilSearch] = useState("");
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
          className="space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={edLogo} alt="EveryDriver" className="h-8 -mx-1 object-contain" />
              <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-foreground">
                {getGreeting()}, {instructorData?.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your business today.
              </p>
            </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search pupils..."
                  value={pupilSearch}
                  onChange={(e) => setPupilSearch(e.target.value)}
                  className="h-10 w-64 rounded-lg border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
                />
                {pupilSearch.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-popover border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {pupils
                      .filter(p => p.name.toLowerCase().includes(pupilSearch.toLowerCase()))
                      .length === 0 ? (
                        <p className="text-sm text-muted-foreground p-3 text-center">No pupils found</p>
                      ) : (
                        pupils
                          .filter(p => p.name.toLowerCase().includes(pupilSearch.toLowerCase()))
                          .slice(0, 8)
                          .map(pupil => (
                            <button
                              key={pupil.id}
                              onClick={() => {
                                navigate(`/instructor/pupils?pupil=${pupil.id}`);
                                setPupilSearch("");
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                            >
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                                {pupil.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{pupil.name}</div>
                                <div className="text-xs text-muted-foreground">{pupil.lessons_completed || 0} lessons · {pupil.progress || 0}%</div>
                              </div>
                            </button>
                          ))
                      )}
                  </div>
                )}
              </div>
              <Button
                onClick={() => navigate("/instructor/pupils")}
                className="h-10 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Online</span>
                <Switch
                  checked={authInstructor?.is_active ?? false}
                  onCheckedChange={handleVisibilityToggle}
                  disabled={updatingVisibility}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/instructor/schedule?action=add")}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Lesson
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/instructor/pupils?action=bespoke")}
              className="gap-1.5"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Bespoke Booking
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentModalOpen(true)}
              className="gap-1.5"
            >
              <PoundSterling className="h-3.5 w-3.5" />
              Take Payment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/instructor/messages?action=new")}
              className="gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Send Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/instructor/pupils?action=add")}
              className="gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              New Pupil
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAvailabilityModalOpen(true)}
              className="gap-1.5"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Availability
            </Button>
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
          </motion.div>

          {/* Right Column - Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Payment Summary */}
            <Card className="border-border">
              <CardContent className="p-4">
                <PaymentSummaryWidget instructorId={instructorId} instructorName={instructorData?.name} />
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
