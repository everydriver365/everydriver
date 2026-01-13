import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Calendar, Users, Clock, TrendingUp, Settings, ChevronRight, CreditCard, Eye, EyeOff, Briefcase, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
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
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { InstructorMobileHome } from "@/components/instructor/InstructorMobileHome";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface Pupil {
  id: string;
  name: string;
  lessons_completed: number | null;
  next_lesson: string | null;
  progress: number | null;
  account_balance: number | null;
  phone: string | null;
}

const MOCK_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

interface Instructor {
  name: string;
  profile_image_url: string | null;
  payment_qr_url: string | null;
  is_active: boolean;
}

export default function InstructorPortal() {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [pupilsLoading, setPupilsLoading] = useState(true);
  const [todaysLessonCount, setTodaysLessonCount] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchInstructor();
    fetchPupils();
    fetchTodaysLessonCount();
  }, []);

  const fetchInstructor = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("name, profile_image_url, payment_qr_url, is_active")
        .eq("id", MOCK_INSTRUCTOR_ID)
        .single();

      if (error) throw error;
      setInstructor(data);
    } catch (error) {
      console.error("Error fetching instructor:", error);
    }
  };

  const fetchPupils = async () => {
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name, lessons_completed, next_lesson, progress, account_balance, phone")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
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
    try {
      const today = new Date().toISOString().split("T")[0];
      const { count, error } = await supabase
        .from("scheduled_lessons")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
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

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <InstructorMobileHome 
          instructor={instructor}
          todaysLessonCount={todaysLessonCount}
          onPaymentClick={() => setPaymentModalOpen(true)}
        />
        <PaymentQRModal 
          open={paymentModalOpen} 
          onOpenChange={setPaymentModalOpen}
          paymentQrUrl={instructor?.payment_qr_url}
          pupils={pupils}
          instructorId={MOCK_INSTRUCTOR_ID}
          instructorName={instructor?.name}
          onPaymentRecorded={fetchPupils}
        />
        <InstructorBottomNav />
      </>
    );
  }

  // Desktop Layout - Clean, organized structure
  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarImage src={instructor?.profile_image_url || undefined} alt={instructor?.name} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {instructor?.name ? getInitials(instructor.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{instructor?.name || "Dashboard"}</h1>
                {instructor && (
                  <Badge 
                    variant="secondary" 
                    className={`gap-1 text-xs ${instructor.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-amber-500/10 text-amber-600 border-amber-200"}`}
                  >
                    {instructor.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {instructor.is_active ? "Visible" : "Hidden"}
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
        <JobOfferAlert instructorId={MOCK_INSTRUCTOR_ID} />

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
            { icon: Clock, label: "Hours This Week", value: "32", color: "text-amber-500" },
            { icon: TrendingUp, label: "Month Earnings", value: "£2,450", color: "text-purple-500" },
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
                <TodayScheduleView instructorId={MOCK_INSTRUCTOR_ID} />
              </TabsContent>
              <TabsContent value="tomorrow" className="mt-4">
                <TomorrowScheduleView instructorId={MOCK_INSTRUCTOR_ID} />
              </TabsContent>
              <TabsContent value="gaps" className="mt-4">
                <GapsFiller instructorId={MOCK_INSTRUCTOR_ID} />
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
            <PaymentSummaryWidget instructorId={MOCK_INSTRUCTOR_ID} instructorName={instructor?.name} />

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
                  <Link to="/instructor/track">
                    <Button variant="outline" size="sm" className="w-full text-xs h-9">
                      <Car className="h-3.5 w-3.5 mr-1.5" />
                      Track
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
          <UpcomingTestsView instructorId={MOCK_INSTRUCTOR_ID} />
        </motion.div>

        <PaymentQRModal
          open={paymentModalOpen} 
          onOpenChange={setPaymentModalOpen}
          paymentQrUrl={instructor?.payment_qr_url}
          pupils={pupils}
          instructorId={MOCK_INSTRUCTOR_ID}
          instructorName={instructor?.name}
          onPaymentRecorded={fetchPupils}
        />
      </div>
    </MainLayout>
  );
}
