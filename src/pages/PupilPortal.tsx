import { useEffect, useState } from "react";
import { useSearchParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap, Calendar, CreditCard, Clock, Award,
  MapPin, Car, Loader2, BookOpen, ChevronRight,
} from "lucide-react";
import { format, parseISO, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { PupilDashboardRadar } from "@/components/pupil-portal/PupilDashboardRadar";
import { PupilTelematicsCard } from "@/components/pupil-portal/PupilTelematicsCard";
import { PupilCoachingCard } from "@/components/pupil-portal/PupilCoachingCard";
import { PupilAIInsightsCard } from "@/components/pupil-portal/PupilAIInsightsCard";
import { LessonStatusBadge } from "@/components/pupil-portal/LessonStatusBadge";
import { PupilFeedbackPrompt } from "@/components/pupil-portal/PupilFeedbackPrompt";
import { LessonSummaryCard } from "@/components/pupil-portal/LessonSummaryCard";
import { ReflectiveLog } from "@/components/pupil-portal/ReflectiveLog";

interface PupilData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  course_type: string | null;
  prepaid_hours: number | null;
  lessons_completed: number | null;
  progress: number | null;
  account_balance: number | null;
  instructor: {
    id: string;
    name: string;
    phone: string | null;
    car_make: string | null;
    car_model: string | null;
    car_type: string;
    profile_image_url: string | null;
  } | null;
}

interface UpcomingLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  pickup_location: string | null;
  status: string;
  payment_status: string;
  amount_due: number | null;
}

export default function PupilPortal() {
  const [searchParams] = useSearchParams();
  const pupilId = searchParams.get("id");

  const [pupil, setPupil] = useState<PupilData | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pupilId) { setLoading(false); return; }

    const todayStr = format(startOfToday(), "yyyy-MM-dd");

    Promise.all([
      supabase
        .from("pupils")
        .select(`
          id, name, email, phone, course_type, prepaid_hours,
          lessons_completed, progress, account_balance,
          instructor:instructors(id, name, phone, car_make, car_model, car_type, profile_image_url)
        `)
        .eq("id", pupilId)
        .maybeSingle(),
      supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, pickup_location, status, payment_status, amount_due")
        .eq("pupil_id", pupilId)
        .gte("lesson_date", todayStr)
        .neq("status", "cancelled")
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(8),
    ]).then(([pupilRes, lessonsRes]) => {
      if (pupilRes.data) {
        const data = pupilRes.data as any;
        setPupil({
          ...data,
          instructor: Array.isArray(data.instructor) ? data.instructor[0] : data.instructor,
        });
      }
      if (lessonsRes.data) setUpcomingLessons(lessonsRes.data);
      setLoading(false);
    });
  }, [pupilId]);

  // Realtime subscription for lesson status changes (en_route, in_progress, etc.)
  useEffect(() => {
    if (!pupilId) return;
    const channel = supabase
      .channel("pupil-lesson-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scheduled_lessons", filter: `pupil_id=eq.${pupilId}` },
        (payload) => {
          const updated = payload.new as any;
          setUpcomingLessons(prev =>
            prev.map(l => l.id === updated.id ? { ...l, status: updated.status } : l)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [pupilId]);

  if (!pupilId) return <Navigate to="/pupil/login" replace />;

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  if (!pupil) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Pupil not found</h1>
          <p className="mt-2 text-muted-foreground">We couldn't find your account.</p>
          <Button asChild className="mt-6"><Link to="/courses">Browse Courses</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const totalScheduledHours = upcomingLessons.reduce((acc, l) => acc + l.duration_minutes / 60, 0);

  return (
    <MainLayout>
      <div className="container py-6 max-w-7xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-4">
            {pupil.instructor && (
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={pupil.instructor.profile_image_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {pupil.instructor.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {pupil.name.split(" ")[0]}!</h1>
              <p className="text-sm text-muted-foreground">
                {pupil.instructor ? `Learning with ${pupil.instructor.name}` : 'Track your progress and manage your lessons'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Clock, label: "Hours Booked", value: `${totalScheduledHours}h`, bg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400" },
            { icon: Calendar, label: "Lessons Done", value: `${pupil.lessons_completed || 0}`, bg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
            { icon: CreditCard, label: "Balance", value: `£${Math.abs(pupil.account_balance || 0).toFixed(0)}`, bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" },
            { icon: Award, label: "Progress", value: `${pupil.progress || 0}%`, bg: "bg-violet-100 dark:bg-violet-900/30", iconColor: "text-violet-600 dark:text-violet-400" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-bold truncate">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Feedback Prompt */}
            <PupilFeedbackPrompt pupilId={pupil.id} />

            {/* Last Lesson Summary */}
            <LessonSummaryCard pupilId={pupil.id} />

            {/* Upcoming Lessons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Upcoming Lessons
                    <Badge variant="secondary" className="ml-auto">{upcomingLessons.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingLessons.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No upcoming lessons scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingLessons.map((lesson) => {
                        const dateStr = format(parseISO(lesson.lesson_date), "yyyy-MM-dd");
                        const todayStr = format(new Date(), "yyyy-MM-dd");
                        const isToday = dateStr === todayStr;

                        return (
                          <div
                            key={lesson.id}
                            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                              isToday ? 'border-primary/30 bg-primary/5' : ''
                            }`}
                          >
                            <div className={`flex h-12 w-12 flex-col items-center justify-center rounded-lg shrink-0 ${
                              isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              <span className="text-[10px] font-medium">{format(parseISO(lesson.lesson_date), "EEE")}</span>
                              <span className="text-base font-bold leading-none">{format(parseISO(lesson.lesson_date), "d")}</span>
                              <span className="text-[10px]">{format(parseISO(lesson.lesson_date), "MMM")}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm flex items-center gap-1.5 flex-wrap">
                                {isToday && <Badge className="text-[10px] h-4">Today</Badge>}
                                {lesson.duration_minutes}min Lesson
                                {(lesson.status === "en_route" || lesson.status === "in_progress") && (
                                  <LessonStatusBadge status={lesson.status} />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{lesson.start_time}</div>
                              {lesson.pickup_location && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  {lesson.pickup_location}
                                </div>
                              )}
                            </div>
                            <Badge variant={lesson.payment_status === "paid" ? "default" : "outline"} className="shrink-0">
                              {lesson.payment_status === "paid" ? "Paid" : `£${lesson.amount_due || 0}`}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Coaching Messages */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <PupilCoachingCard pupilId={pupil.id} />
            </motion.div>

            {/* AI Driving Insights */}
            {pupil.instructor && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <PupilAIInsightsCard pupilId={pupil.id} instructorId={pupil.instructor.id} />
              </motion.div>
            )}

            {/* Reflective Log */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <ReflectiveLog pupilId={pupil.id} />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Syllabus Radar Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <PupilDashboardRadar pupilId={pupil.id} />
            </motion.div>

            {/* Telematics Safety Score */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <PupilTelematicsCard pupilId={pupil.id} />
            </motion.div>

            {/* Instructor Card */}
            {pupil.instructor && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <Car className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      Your Instructor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={pupil.instructor.profile_image_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {pupil.instructor.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{pupil.instructor.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {pupil.instructor.car_make} {pupil.instructor.car_model}
                        </div>
                        <Badge variant="secondary" className="mt-0.5 text-[10px]">{pupil.instructor.car_type}</Badge>
                      </div>
                    </div>
                    {pupil.instructor.phone && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={`tel:${pupil.instructor.phone}`}>
                          Call {pupil.instructor.name.split(" ")[0]}
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quick Links */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <Button variant="ghost" className="w-full justify-between h-auto py-2.5" asChild>
                    <Link to="/theory">
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        Practice Theory
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
