import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Calendar, Users, Clock, TrendingUp, Settings, ChevronRight, CreditCard, Eye, EyeOff, Briefcase, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobOfferAlert } from "@/components/instructor/JobOfferAlert";
import { TodayScheduleView } from "@/components/instructor/TodayScheduleView";
import { TomorrowScheduleView } from "@/components/instructor/TomorrowScheduleView";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { PaymentSummaryWidget } from "@/components/instructor/PaymentSummaryWidget";
import { GapsFiller } from "@/components/instructor/GapsFiller";
import { UpcomingTestsView } from "@/components/instructor/UpcomingTestsView";
import { InstructorMobileHome } from "@/components/instructor/InstructorMobileHome";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";

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
  const { instructor: authInstructor, loading: authLoading, user } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  const navigate = useNavigate();
  
  const [instructorData, setInstructorData] = useState<InstructorData | null>(null);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [pupilsLoading, setPupilsLoading] = useState(true);
  const [todaysLessonCount, setTodaysLessonCount] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { hoursThisWeek, monthEarnings, loading: statsLoading } = useInstructorLiveStats(instructorId);

  // Redirect to login if not authenticated (after loading completes)
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

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </InstructorPortalLayout>
    );
  }

  // User is authenticated but has no instructor profile
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
    return null; // Will redirect to login via useEffect
  }

  // Mobile Layout - uses InstructorMobileHome component (no layout wrapper - has its own header)
  if (isMobile) {
    return (
      <>
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
      </>
    );
  }

  // Desktop Layout - Clean, organized structure
  return (
    <InstructorPortalLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarImage src={instructorData?.profile_image_url || undefined} alt={instructorData?.name} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {instructorData?.name ? getInitials(instructorData.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{instructorData?.name || "Dashboard"}</h1>
                {instructorData && (
                  <Badge 
                    variant="secondary" 
                    className={`gap-1 text-xs ${instructorData.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-amber-500/10 text-amber-600 border-amber-200"}`}
                  >
                    {instructorData.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {instructorData.is_active ? "Visible" : "Hidden"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex gap-2"
          >
            <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
              <CreditCard className="mr-1.5 h-4 w-4" />
              Take Payment
            </Button>
            <Link to="/instructor/settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-1.5 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Job Alerts */}
        <JobOfferAlert instructorId={instructorId} />

        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-3 grid-cols-2 lg:grid-cols-4"
        >
          {[
            { icon: Calendar, label: "Today's Lessons", value: String(todaysLessonCount), color: "text-blue-500" },
            { icon: Users, label: "Active Pupils", value: String(pupils.length), color: "text-emerald-500" },
            { icon: Clock, label: "Hours This Week", value: statsLoading ? "..." : String(hoursThisWeek), color: "text-amber-500" },
            { icon: TrendingUp, label: "Month Earnings", value: statsLoading ? "..." : `£${monthEarnings.toLocaleString()}`, color: "text-purple-500" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Left Column - Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 space-y-4"
          >
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                <TabsTrigger value="gaps">Fill Gaps</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="mt-4">
                <TodayScheduleView instructorId={instructorId} />
              </TabsContent>
              <TabsContent value="tomorrow" className="mt-4">
                <TomorrowScheduleView instructorId={instructorId} />
              </TabsContent>
              <TabsContent value="gaps" className="mt-4">
                <GapsFiller instructorId={instructorId} />
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Right Column - Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Payment Summary */}
            <Card>
              <CardContent className="p-4">
                <PaymentSummaryWidget instructorId={instructorId} instructorName={instructorData?.name} />
              </CardContent>
            </Card>

            {/* Active Pupils */}
            <Card>
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

            {/* Quick Links */}
            <Card>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/instructor/schedule">
                    <Button variant="outline" size="sm" className="w-full text-xs h-9">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      Schedule
                    </Button>
                  </Link>
                  <Link to="/instructor/jobs">
                    <Button variant="outline" size="sm" className="w-full text-xs h-9">
                      <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                      Jobs
                    </Button>
                  </Link>
                  <Link to="/instructor/expenses">
                    <Button variant="outline" size="sm" className="w-full text-xs h-9">
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Expenses
                    </Button>
                  </Link>
                  <Link to="/instructor/traccar">
                    <Button variant="outline" size="sm" className="w-full text-xs h-9">
                      <Car className="h-3.5 w-3.5 mr-1.5" />
                      Live
                    </Button>
                  </Link>
                </div>
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
      </div>
    </InstructorPortalLayout>
  );
}
