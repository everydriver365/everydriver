import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Calendar, BookOpen, CreditCard, Clock, Award, ChevronRight, 
  MessageCircle, Phone, Mail, MapPin, User, Send, Car, CheckCircle, XCircle,
  Loader2
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  pickup_location: string | null;
  status: string;
  payment_status: string;
  amount_due: number | null;
}

interface PupilData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string;
  postcode: string;
  course_type: string | null;
  prepaid_hours: number | null;
  lessons_completed: number | null;
  progress: number | null;
  account_balance: number | null;
  instructor: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    car_make: string | null;
    car_model: string | null;
    car_type: string;
    profile_image_url: string | null;
  } | null;
}

interface LessonHistoryItem {
  id: string;
  lesson_date: string;
  duration_minutes: number;
  rating: number | null;
  notes: string | null;
  skills_practiced: string[] | null;
}

export default function PupilPortal() {
  const [searchParams] = useSearchParams();
  const pupilId = searchParams.get("id");
  
  const [pupil, setPupil] = useState<PupilData | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<ScheduledLesson[]>([]);
  const [pastLessons, setPastLessons] = useState<ScheduledLesson[]>([]);
  const [lessonHistory, setLessonHistory] = useState<LessonHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const fetchPupilData = async () => {
      if (!pupilId) {
        setLoading(false);
        return;
      }

      const today = startOfToday();
      const todayStr = format(today, "yyyy-MM-dd");

      const [pupilRes, lessonsRes, historyRes] = await Promise.all([
        supabase
          .from("pupils")
          .select(`
            id, name, email, phone, address, postcode, course_type, prepaid_hours,
            lessons_completed, progress, account_balance,
            instructor:instructors(id, name, email, phone, car_make, car_model, car_type, profile_image_url)
          `)
          .eq("id", pupilId)
          .maybeSingle(),
        supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, duration_minutes, pickup_location, status, payment_status, amount_due")
          .eq("pupil_id", pupilId)
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true }),
        supabase
          .from("lesson_history")
          .select("id, lesson_date, duration_minutes, rating, notes, skills_practiced")
          .eq("pupil_id", pupilId)
          .order("lesson_date", { ascending: false })
          .limit(20),
      ]);

      if (pupilRes.data) {
        const data = pupilRes.data as any;
        setPupil({
          ...data,
          instructor: Array.isArray(data.instructor) ? data.instructor[0] : data.instructor,
        });
      }

      if (lessonsRes.data) {
        const upcoming = lessonsRes.data.filter(l => l.lesson_date >= todayStr);
        const past = lessonsRes.data.filter(l => l.lesson_date < todayStr);
        setUpcomingLessons(upcoming);
        setPastLessons(past);
      }

      if (historyRes.data) {
        setLessonHistory(historyRes.data);
      }

      setLoading(false);
    };

    fetchPupilData();
  }, [pupilId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !pupil?.instructor) return;
    
    setSendingMessage(true);
    // In a real app, this would send an SMS or email via an edge function
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Message sent to your instructor!");
    setMessage("");
    setSendingMessage(false);
  };

  const totalScheduledHours = upcomingLessons.reduce((acc, l) => acc + l.duration_minutes / 60, 0);
  const totalCompletedHours = lessonHistory.reduce((acc, l) => acc + l.duration_minutes / 60, 0);

  // Demo mode if no pupilId
  if (!pupilId) {
    return (
      <MainLayout>
        <div className="container py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold md:text-3xl">Welcome back, Alex!</h1>
            <p className="text-muted-foreground">Track your progress and manage your lessons</p>
          </motion.div>

          {/* Quick Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Clock, label: "Total Hours", value: "24", color: "bg-primary" },
              { icon: Calendar, label: "Lessons Completed", value: "12", color: "bg-emerald-500" },
              { icon: BookOpen, label: "Theory Progress", value: "78%", color: "bg-amber-500" },
              { icon: Award, label: "Skills Mastered", value: "8/15", color: "bg-blue-500" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center py-12">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Demo Mode</h2>
            <p className="text-muted-foreground mb-6">
              This is a demo view. To see your actual lessons and progress, access your portal via the link sent to your email after booking.
            </p>
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

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
          <Button asChild className="mt-6">
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold md:text-3xl">Welcome back, {pupil.name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">Track your progress and manage your lessons</p>
        </motion.div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock, label: "Hours Scheduled", value: totalScheduledHours.toString(), color: "bg-primary" },
            { icon: Calendar, label: "Lessons Completed", value: (pupil.lessons_completed || 0).toString(), color: "bg-emerald-500" },
            { icon: CreditCard, label: "Balance", value: `£${Math.abs(pupil.account_balance || 0).toFixed(0)}`, color: (pupil.account_balance || 0) >= 0 ? "bg-emerald-500" : "bg-amber-500" },
            { icon: Award, label: "Progress", value: `${pupil.progress || 0}%`, color: "bg-blue-500" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lessons Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Your Lessons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="upcoming">
                    <TabsList className="mb-4">
                      <TabsTrigger value="upcoming">
                        Upcoming ({upcomingLessons.length})
                      </TabsTrigger>
                      <TabsTrigger value="history">
                        History ({lessonHistory.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming">
                      {upcomingLessons.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No upcoming lessons scheduled</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {upcomingLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                  <span className="text-xs font-medium">
                                    {format(parseISO(lesson.lesson_date), "EEE")}
                                  </span>
                                  <span className="text-lg font-bold">
                                    {format(parseISO(lesson.lesson_date), "d")}
                                  </span>
                                  <span className="text-[10px]">
                                    {format(parseISO(lesson.lesson_date), "MMM")}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {lesson.duration_minutes / 60}h Driving Lesson
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {lesson.start_time}
                                  </div>
                                  {lesson.pickup_location && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="h-3 w-3" />
                                      {lesson.pickup_location}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={lesson.payment_status === "paid" ? "secondary" : "outline"}
                                  className={lesson.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : ""}
                                >
                                  {lesson.payment_status === "paid" ? "Paid" : `£${lesson.amount_due || 0}`}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="history">
                      {lessonHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No lesson history yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {lessonHistory.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="rounded-lg border p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">
                                  {format(parseISO(lesson.lesson_date), "EEEE, d MMM yyyy")}
                                </div>
                                <Badge variant="secondary">
                                  {lesson.duration_minutes / 60}h
                                </Badge>
                              </div>
                              {lesson.rating && (
                                <div className="flex items-center gap-1 text-sm mb-2">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`h-2 w-2 rounded-full ${
                                        i < lesson.rating! ? "bg-amber-400" : "bg-gray-200"
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-2 text-muted-foreground">
                                    {lesson.rating}/5
                                  </span>
                                </div>
                              )}
                              {lesson.skills_practiced && lesson.skills_practiced.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {lesson.skills_practiced.slice(0, 4).map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {lesson.skills_practiced.length > 4 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{lesson.skills_practiced.length - 4} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {lesson.notes && (
                                <p className="text-sm text-muted-foreground mt-2 italic">
                                  "{lesson.notes}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-secondary/50 p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {pupil.prepaid_hours || 0}h
                      </div>
                      <div className="text-sm text-muted-foreground">Prepaid Hours</div>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-4 text-center">
                      <div className="text-2xl font-bold">
                        {totalCompletedHours}h
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-4 text-center">
                      <div className={`text-2xl font-bold ${(pupil.account_balance || 0) >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                        £{Math.abs(pupil.account_balance || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(pupil.account_balance || 0) >= 0 ? "Credit" : "Balance Due"}
                      </div>
                    </div>
                  </div>

                  {pastLessons.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Recent Payments</h4>
                        {pastLessons.slice(0, 5).map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              {lesson.payment_status === "paid" ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-amber-500" />
                              )}
                              <span>{format(parseISO(lesson.lesson_date), "d MMM")} - {lesson.duration_minutes / 60}h lesson</span>
                            </div>
                            <span className={lesson.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}>
                              {lesson.payment_status === "paid" ? "Paid" : `£${lesson.amount_due || 0}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Card */}
            {pupil.instructor && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={pupil.instructor.profile_image_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {pupil.instructor.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{pupil.instructor.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Car className="h-3.5 w-3.5" />
                          {pupil.instructor.car_make} {pupil.instructor.car_model}
                        </div>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {pupil.instructor.car_type}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {pupil.instructor.phone && (
                        <a
                          href={`tel:${pupil.instructor.phone}`}
                          className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {pupil.instructor.phone}
                        </a>
                      )}
                      {pupil.instructor.email && (
                        <a
                          href={`mailto:${pupil.instructor.email}`}
                          className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {pupil.instructor.email}
                        </a>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Quick Message */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Send a Message
                      </h4>
                      <Textarea
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                      />
                      <Button
                        className="w-full gap-2"
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendingMessage}
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Progress</span>
                      <span className="font-medium">{pupil.progress || 0}%</span>
                    </div>
                    <Progress value={pupil.progress || 0} className="h-3" />
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "Moving Off & Stopping", progress: 100 },
                      { name: "Use of Mirrors", progress: 85 },
                      { name: "Roundabouts", progress: 60 },
                      { name: "Parallel Parking", progress: 40 },
                    ].map((skill) => (
                      <div key={skill.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{skill.name}</span>
                          <span>{skill.progress}%</span>
                        </div>
                        <Progress value={skill.progress} className="h-1.5" />
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/theory">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Practice Theory
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
