import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Calendar, Users, Clock, TrendingUp, Settings, ChevronRight, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { JobOfferAlert } from "@/components/instructor/JobOfferAlert";
import { TodayScheduleView } from "@/components/instructor/TodayScheduleView";
import { TomorrowScheduleView } from "@/components/instructor/TomorrowScheduleView";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { PushNotificationSettings } from "@/components/instructor/PushNotificationSettings";
import { CancellationPolicyEditor } from "@/components/instructor/CancellationPolicyEditor";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface Pupil {
  id: string;
  name: string;
  lessons_completed: number | null;
  next_lesson: string | null;
  progress: number | null;
}

// Mock instructor ID - in production this would come from auth
const MOCK_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

interface Instructor {
  name: string;
  profile_image_url: string | null;
  payment_qr_url: string | null;
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
        .select("name, profile_image_url, payment_qr_url")
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
        .select("id, name, lessons_completed, next_lesson, progress")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
        .order("created_at", { ascending: false })
        .limit(5);

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
      <MainLayout>
        <div className="px-3 py-4 pb-24 space-y-4">
          {/* Mobile Header with Avatar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src={instructor?.profile_image_url || undefined} alt={instructor?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {instructor?.name ? getInitials(instructor.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-bold">{instructor?.name || "Dashboard"}</h1>
                <p className="text-sm text-muted-foreground">Welcome back</p>
              </div>
            </div>
            <Button 
              onClick={() => setPaymentModalOpen(true)}
              size="sm"
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Pay
            </Button>
          </div>

          {/* Job Offers - Top Priority */}
          <JobOfferAlert instructorId={MOCK_INSTRUCTOR_ID} />

          {/* Today's Schedule */}
          <TodayScheduleView instructorId={MOCK_INSTRUCTOR_ID} />

          {/* Tomorrow's Schedule */}
          <TomorrowScheduleView instructorId={MOCK_INSTRUCTOR_ID} />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link to="/instructor/pupils">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">My Pupils</span>
              </Button>
            </Link>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Settings className="h-5 w-5" />
              <span className="text-sm">Settings</span>
            </Button>
          </div>
        </div>

        <PaymentQRModal 
          open={paymentModalOpen} 
          onOpenChange={setPaymentModalOpen}
          paymentQrUrl={instructor?.payment_qr_url}
        />

        <InstructorBottomNav />
      </MainLayout>
    );
  }

  // Desktop Layout (existing)
  return (
    <MainLayout>
      <div className="container py-8">
        {/* Job Offer Alerts - At the top for visibility */}
        <JobOfferAlert instructorId={MOCK_INSTRUCTOR_ID} />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <Avatar className="h-14 w-14 border-2 border-primary">
              <AvatarImage src={instructor?.profile_image_url || undefined} alt={instructor?.name} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                {instructor?.name ? getInitials(instructor.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">{instructor?.name || "Instructor Dashboard"}</h1>
              <p className="text-muted-foreground">Welcome back</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3"
          >
            <Button onClick={() => setPaymentModalOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Take Payment
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Calendar, label: "Today's Lessons", value: String(todaysLessonCount), change: "+2 this week" },
            { icon: Users, label: "Active Pupils", value: String(pupils.length || 0), change: "+3 new" },
            { icon: Clock, label: "Hours This Week", value: "32", change: "On track" },
            { icon: TrendingUp, label: "Earnings (Month)", value: "£2,450", change: "+12%" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-success">{stat.change}</span>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Today's & Tomorrow's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <TodayScheduleView instructorId={MOCK_INSTRUCTOR_ID} />
            <TomorrowScheduleView instructorId={MOCK_INSTRUCTOR_ID} />
          </motion.div>

          {/* Active Pupils */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Active Pupils
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pupils.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pupils yet
                    </p>
                  ) : (
                    pupils.map((pupil) => (
                      <div
                        key={pupil.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {pupil.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{pupil.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {pupil.lessons_completed || 0} lessons • {pupil.progress || 0}% complete
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link to="/instructor/pupils">
                  <Button variant="outline" className="mt-4 w-full">
                    View All Pupils
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Settings Row */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Push Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <PushNotificationSettings instructorId={MOCK_INSTRUCTOR_ID} />
          </motion.div>

          {/* Cancellation Policy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <CancellationPolicyEditor instructorId={MOCK_INSTRUCTOR_ID} />
          </motion.div>

          {/* Calendar Sync Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-accent/50 bg-accent/5 h-full">
              <CardContent className="flex flex-col justify-center gap-4 p-6 h-full">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                    <Calendar className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">Google Calendar Sync</div>
                    <div className="text-sm text-muted-foreground">
                      Your availability is synced with Google Calendar
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-2">Manage Sync</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <PaymentQRModal 
          open={paymentModalOpen} 
          onOpenChange={setPaymentModalOpen}
          paymentQrUrl={instructor?.payment_qr_url}
        />
      </div>
    </MainLayout>
  );
}
