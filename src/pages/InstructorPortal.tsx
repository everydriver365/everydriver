import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Calendar, Users, Clock, TrendingUp, Settings, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobOfferAlert } from "@/components/instructor/JobOfferAlert";
import { supabase } from "@/integrations/supabase/client";

interface Pupil {
  id: string;
  name: string;
  lessons_completed: number | null;
  next_lesson: string | null;
  progress: number | null;
}

const todaysSchedule = [
  { time: "09:00", pupil: "Alex Thompson", type: "1hr", status: "confirmed" },
  { time: "10:30", pupil: "Emma Wilson", type: "2hr", status: "confirmed" },
  { time: "14:00", pupil: "James Brown", type: "1hr", status: "pending" },
  { time: "16:00", pupil: "Sophie Davis", type: "Mock Test", status: "confirmed" },
];

// Mock instructor ID - in production this would come from auth
const MOCK_INSTRUCTOR_ID = "00000000-0000-0000-0000-000000000001";

export default function InstructorPortal() {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [pupilsLoading, setPupilsLoading] = useState(true);

  useEffect(() => {
    fetchPupils();
  }, []);

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

  // Combine mock data with real pupils for display
  const displayPupils = pupils.length > 0 ? pupils : [
    { id: "1", name: "Alex Thompson", lessons_completed: 12, next_lesson: "Tomorrow 10am", progress: 65 },
    { id: "2", name: "Emma Wilson", lessons_completed: 8, next_lesson: "Today 10:30am", progress: 45 },
    { id: "3", name: "James Brown", lessons_completed: 24, next_lesson: "Today 2pm", progress: 85 },
  ];

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Job Offer Alerts - At the top for visibility */}
        <JobOfferAlert instructorId={MOCK_INSTRUCTOR_ID} />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold md:text-3xl">Instructor Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, John Smith</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3"
          >
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="accent" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Availability
            </Button>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Calendar, label: "Today's Lessons", value: "4", change: "+2 this week" },
            { icon: Users, label: "Active Pupils", value: String(pupils.length || 18), change: "+3 new" },
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
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Today's Schedule
                </CardTitle>
                <Button variant="outline" size="sm">
                  Full Calendar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaysSchedule.map((lesson, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-center">
                          <div className="text-lg font-bold">{lesson.time}</div>
                        </div>
                        <div>
                          <div className="font-medium">{lesson.pupil}</div>
                          <div className="text-sm text-muted-foreground">{lesson.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            lesson.status === "confirmed"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {lesson.status}
                        </span>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                  {displayPupils.map((pupil) => (
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
                  ))}
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

        {/* Calendar Sync Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="border-accent/50 bg-accent/5">
            <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
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
              <Button variant="outline">Manage Sync</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
