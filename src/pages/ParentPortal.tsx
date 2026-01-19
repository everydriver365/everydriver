import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, CreditCard, FileText, Clock, Bell, Phone, LogOut, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { PortalIOSInstallBanner } from "@/components/pwa/PortalIOSInstallBanner";

interface Child {
  id: string;
  name: string;
  instructor_name: string;
  lessons_completed: number;
  progress: number;
  account_balance: number;
  prepaid_hours: number;
  next_lesson_date: string | null;
  next_lesson_time: string | null;
  test_date: string | null;
}

interface Activity {
  id: string;
  type: 'lesson' | 'payment' | 'feedback';
  text: string;
  time: string;
  pupil_name: string;
}

interface LessonFeedback {
  id: string;
  pupil_name: string;
  lesson_date: string;
  notes: string | null;
  rating: number | null;
}

export default function ParentPortal() {
  const [parentPhone, setParentPhone] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<LessonFeedback[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  // Check for existing session
  useEffect(() => {
    const savedPhone = localStorage.getItem('parent_phone');
    if (savedPhone) {
      setParentPhone(savedPhone);
      setIsVerified(true);
      fetchChildrenData(savedPhone);
    }
  }, []);

  const handleVerifyPhone = async () => {
    if (!parentPhone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setLoading(true);
    try {
      // Look up pupils linked to this parent phone
      const { data: pupils, error } = await supabase
        .from("pupils")
        .select(`
          id,
          name,
          lessons_completed,
          progress,
          account_balance,
          prepaid_hours,
          test_date,
          instructor_id,
          instructors!inner(name)
        `)
        .eq("parent_phone", parentPhone.trim());

      if (error) throw error;

      if (!pupils || pupils.length === 0) {
        toast.error("No children found linked to this phone number. Please contact your instructor.");
        return;
      }

      localStorage.setItem('parent_phone', parentPhone.trim());
      setIsVerified(true);
      await fetchChildrenData(parentPhone.trim());
      toast.success(`Welcome! Found ${pupils.length} child${pupils.length > 1 ? 'ren' : ''}`);
    } catch (error) {
      console.error("Error verifying phone:", error);
      toast.error("Unable to verify. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchChildrenData = async (phone: string) => {
    try {
      // Fetch pupils linked to parent phone
      const { data: pupils, error: pupilsError } = await supabase
        .from("pupils")
        .select(`
          id,
          name,
          lessons_completed,
          progress,
          account_balance,
          prepaid_hours,
          test_date,
          instructor_id
        `)
        .eq("parent_phone", phone);

      if (pupilsError) throw pupilsError;

      if (!pupils || pupils.length === 0) {
        setChildren([]);
        return;
      }

      // Get instructor names
      const instructorIds = [...new Set(pupils.map(p => p.instructor_id))];
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds);

      const instructorMap = new Map(instructors?.map(i => [i.id, i.name]) || []);

      // Get next lessons for each pupil
      const pupilIds = pupils.map(p => p.id);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: nextLessons } = await supabase
        .from("scheduled_lessons")
        .select("pupil_id, lesson_date, start_time")
        .in("pupil_id", pupilIds)
        .gte("lesson_date", today)
        .eq("status", "scheduled")
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true });

      // Map next lesson to each pupil
      const nextLessonMap = new Map<string, { date: string; time: string }>();
      nextLessons?.forEach(lesson => {
        if (!nextLessonMap.has(lesson.pupil_id)) {
          nextLessonMap.set(lesson.pupil_id, {
            date: lesson.lesson_date,
            time: lesson.start_time
          });
        }
      });

      const childrenData: Child[] = pupils.map(p => ({
        id: p.id,
        name: p.name,
        instructor_name: instructorMap.get(p.instructor_id) || 'Unknown',
        lessons_completed: p.lessons_completed || 0,
        progress: p.progress || 0,
        account_balance: p.account_balance || 0,
        prepaid_hours: p.prepaid_hours || 0,
        next_lesson_date: nextLessonMap.get(p.id)?.date || null,
        next_lesson_time: nextLessonMap.get(p.id)?.time || null,
        test_date: p.test_date
      }));

      setChildren(childrenData);

      // Fetch recent activities
      await fetchRecentActivities(pupilIds);
      
      // Fetch recent feedback
      await fetchRecentFeedback(pupilIds, pupils);

    } catch (error) {
      console.error("Error fetching children data:", error);
      toast.error("Failed to load data");
    }
  };

  const fetchRecentActivities = async (pupilIds: string[]) => {
    try {
      // Get recent lesson history
      const { data: lessons } = await supabase
        .from("lesson_history")
        .select("id, pupil_id, lesson_date, duration_minutes")
        .in("pupil_id", pupilIds)
        .order("created_at", { ascending: false })
        .limit(5);

      // Get recent payments
      const { data: payments } = await supabase
        .from("payment_history")
        .select("id, pupil_id, amount, recorded_at")
        .in("pupil_id", pupilIds)
        .order("recorded_at", { ascending: false })
        .limit(5);

      // Get pupil names
      const { data: pupils } = await supabase
        .from("pupils")
        .select("id, name")
        .in("id", pupilIds);

      const pupilMap = new Map(pupils?.map(p => [p.id, p.name]) || []);

      const allActivities: Activity[] = [];

      lessons?.forEach(l => {
        allActivities.push({
          id: `lesson-${l.id}`,
          type: 'lesson',
          text: `${pupilMap.get(l.pupil_id)} completed a ${l.duration_minutes} min lesson`,
          time: formatDistanceToNow(parseISO(l.lesson_date), { addSuffix: true }),
          pupil_name: pupilMap.get(l.pupil_id) || 'Unknown'
        });
      });

      payments?.forEach(p => {
        allActivities.push({
          id: `payment-${p.id}`,
          type: 'payment',
          text: `Payment of £${p.amount} received for ${pupilMap.get(p.pupil_id)}`,
          time: formatDistanceToNow(parseISO(p.recorded_at), { addSuffix: true }),
          pupil_name: pupilMap.get(p.pupil_id) || 'Unknown'
        });
      });

      // Sort by time (most recent first) and limit
      setActivities(allActivities.slice(0, 8));

    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchRecentFeedback = async (pupilIds: string[], pupils: any[]) => {
    try {
      const { data: feedback } = await supabase
        .from("lesson_history")
        .select("id, pupil_id, lesson_date, notes, rating")
        .in("pupil_id", pupilIds)
        .not("notes", "is", null)
        .order("lesson_date", { ascending: false })
        .limit(5);

      const pupilMap = new Map(pupils.map(p => [p.id, p.name]));

      const feedbackData: LessonFeedback[] = (feedback || []).map(f => ({
        id: f.id,
        pupil_name: pupilMap.get(f.pupil_id) || 'Unknown',
        lesson_date: f.lesson_date,
        notes: f.notes,
        rating: f.rating
      }));

      setRecentFeedback(feedbackData);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parent_phone');
    setIsVerified(false);
    setChildren([]);
    setActivities([]);
    setRecentFeedback([]);
    setParentPhone("");
    toast.success("Logged out successfully");
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson': return Calendar;
      case 'payment': return CreditCard;
      case 'feedback': return MessageSquare;
      default: return Bell;
    }
  };

  // Phone verification screen
  if (!isVerified) {
    return (
      <MainLayout>
        <div className="container py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Parent Portal</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Enter your phone number to view your children's progress
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="07XXX XXXXXX"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="pl-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyPhone()}
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleVerifyPhone}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "View My Children's Progress"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Your instructor will have linked your phone number to your child's account
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  // No children found
  if (children.length === 0) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Parent Dashboard</h1>
              <p className="text-muted-foreground">Monitor your children's driving progress</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Children Found</h3>
              <p className="text-muted-foreground">
                No pupils are linked to your phone number yet.<br />
                Please ask your child's instructor to add your contact details.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PortalIOSInstallBanner 
        appName="DL Parent"
        storageKey="ios-install-parent-dismissed"
        primaryColor="#1e3a5f"
      />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold md:text-3xl">Parent Dashboard</h1>
            <p className="text-muted-foreground">Monitor your children's driving progress</p>
          </motion.div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Children Overview */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                        {child.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{child.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Instructor: {child.instructor_name}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedChild(child)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg bg-secondary p-3">
                      <div className="text-xl font-bold">{child.lessons_completed}</div>
                      <div className="text-xs text-muted-foreground">Lessons Done</div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <div className="text-xl font-bold">{child.progress}%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                    <div className="rounded-lg bg-emerald-500/10 p-3">
                      <div className="text-xl font-bold text-emerald-600">
                        {child.prepaid_hours}h
                      </div>
                      <div className="text-xs text-muted-foreground">Credit</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Learning Progress</span>
                      <span>{child.progress}%</span>
                    </div>
                    <Progress value={child.progress} className="h-2" />
                  </div>

                  {child.next_lesson_date && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/10 p-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <strong>Next lesson:</strong>{' '}
                        {format(parseISO(child.next_lesson_date), 'EEE d MMM')}
                        {child.next_lesson_time && ` at ${formatTime(child.next_lesson_time)}`}
                      </span>
                    </div>
                  )}

                  {child.test_date && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 p-3">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <span className="text-sm">
                        <strong>Test Date:</strong>{' '}
                        {format(parseISO(child.test_date), 'EEE d MMMM yyyy')}
                      </span>
                    </div>
                  )}

                  {child.account_balance > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 p-3">
                      <CreditCard className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">
                        <strong>Outstanding:</strong> £{child.account_balance.toFixed(2)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Instructor Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentFeedback.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No feedback yet. Your instructor's notes will appear here after lessons.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentFeedback.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{feedback.pupil_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(feedback.lesson_date), 'EEE d MMM')}
                            </span>
                          </div>
                          {feedback.rating && (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${star <= feedback.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{feedback.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No recent activity yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-foreground truncate">{activity.text}</div>
                            <div className="text-xs text-muted-foreground">{activity.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}