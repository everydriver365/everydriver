import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Calendar, CreditCard, Clock, Bell, Phone, LogOut, Star, 
  MessageSquare, ChevronRight, Loader2, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { PortalIOSInstallBanner } from "@/components/pwa/PortalIOSInstallBanner";
import { ParentMessageCard } from "@/components/parent/ParentMessageCard";

interface Child {
  id: string;
  name: string;
  instructor_id: string;
  instructor_name: string;
  instructor_phone: string | null;
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

type AuthStep = 'phone' | 'otp' | 'verified';

export default function ParentPortal() {
  const [parentPhone, setParentPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [authStep, setAuthStep] = useState<AuthStep>('phone');
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<LessonFeedback[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  // Check for existing session
  useEffect(() => {
    const savedPhone = localStorage.getItem('parent_phone_verified');
    if (savedPhone) {
      setParentPhone(savedPhone);
      setAuthStep('verified');
      fetchChildrenData(savedPhone);
    }
  }, []);

  const handleSendOTP = async () => {
    if (!parentPhone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-parent-otp", {
        body: { phone: parentPhone.trim() },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Verification code sent! Found ${data.childCount} child${data.childCount > 1 ? 'ren' : ''}`);
      setAuthStep('otp');
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Unable to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-parent-otp", {
        body: { phone: parentPhone.trim(), code: otp },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Store verified phone
      localStorage.setItem('parent_phone_verified', parentPhone.trim());
      setAuthStep('verified');
      await fetchChildrenData(parentPhone.trim());
      toast.success("Welcome to the Parent Portal!");
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchChildrenData = async (phone: string) => {
    try {
      const cleanPhone = phone.replace(/\s+/g, "");
      
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
        .or(`parent_phone.ilike.%${cleanPhone.slice(-9)}`);

      if (pupilsError) throw pupilsError;

      if (!pupils || pupils.length === 0) {
        setChildren([]);
        return;
      }

      // Get instructor info
      const instructorIds = [...new Set(pupils.map(p => p.instructor_id))];
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name, phone")
        .in("id", instructorIds);

      const instructorMap = new Map(instructors?.map(i => [i.id, i]) || []);

      // Get next lessons
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

      const nextLessonMap = new Map<string, { date: string; time: string }>();
      nextLessons?.forEach(lesson => {
        if (!nextLessonMap.has(lesson.pupil_id)) {
          nextLessonMap.set(lesson.pupil_id, {
            date: lesson.lesson_date,
            time: lesson.start_time
          });
        }
      });

      const childrenData: Child[] = pupils.map(p => {
        const instructor = instructorMap.get(p.instructor_id);
        return {
          id: p.id,
          name: p.name,
          instructor_id: p.instructor_id,
          instructor_name: instructor?.name || 'Unknown',
          instructor_phone: instructor?.phone || null,
          lessons_completed: p.lessons_completed || 0,
          progress: p.progress || 0,
          account_balance: p.account_balance || 0,
          prepaid_hours: p.prepaid_hours || 0,
          next_lesson_date: nextLessonMap.get(p.id)?.date || null,
          next_lesson_time: nextLessonMap.get(p.id)?.time || null,
          test_date: p.test_date
        };
      });

      setChildren(childrenData);
      await fetchRecentActivities(pupilIds);
      await fetchRecentFeedback(pupilIds, pupils);

    } catch (error) {
      console.error("Error fetching children data:", error);
      toast.error("Failed to load data");
    }
  };

  const fetchRecentActivities = async (pupilIds: string[]) => {
    try {
      const { data: lessons } = await supabase
        .from("lesson_history")
        .select("id, pupil_id, lesson_date, duration_minutes")
        .in("pupil_id", pupilIds)
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: payments } = await supabase
        .from("payment_history")
        .select("id, pupil_id, amount, recorded_at")
        .in("pupil_id", pupilIds)
        .order("recorded_at", { ascending: false })
        .limit(5);

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
    localStorage.removeItem('parent_phone_verified');
    setAuthStep('phone');
    setChildren([]);
    setActivities([]);
    setRecentFeedback([]);
    setParentPhone("");
    setOtp("");
    setSelectedChild(null);
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

  // Phone entry screen
  if (authStep === 'phone') {
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
                  Monitor your children's driving progress and contact their instructor
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
                        onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We'll send a 6-digit code to verify your identity
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  // OTP verification screen
  if (authStep === 'otp') {
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
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Enter Verification Code</CardTitle>
                <p className="text-muted-foreground mt-2">
                  We sent a 6-digit code to {parentPhone}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>
                <div className="text-center">
                  <Button 
                    variant="link" 
                    onClick={() => setAuthStep('phone')}
                    className="text-muted-foreground"
                  >
                    Use a different number
                  </Button>
                </div>
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

  // Child detail view
  if (selectedChild) {
    return (
      <MainLayout>
        <div className="container py-8">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedChild(null)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Child Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                      {selectedChild.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{selectedChild.name}</CardTitle>
                      <p className="text-muted-foreground">
                        Instructor: {selectedChild.instructor_name}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 rounded-lg bg-secondary">
                      <div className="text-2xl font-bold">{selectedChild.lessons_completed}</div>
                      <div className="text-xs text-muted-foreground">Lessons</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary">
                      <div className="text-2xl font-bold">{selectedChild.progress}%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                      <div className="text-2xl font-bold text-emerald-600">{selectedChild.prepaid_hours}h</div>
                      <div className="text-xs text-muted-foreground">Credit</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950">
                      <div className="text-2xl font-bold text-amber-600">
                        £{selectedChild.account_balance.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Balance</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Learning Progress</span>
                      <span>{selectedChild.progress}%</span>
                    </div>
                    <Progress value={selectedChild.progress} className="h-3" />
                  </div>

                  {selectedChild.next_lesson_date && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 mb-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Next Lesson</div>
                        <div className="text-sm text-muted-foreground">
                          {format(parseISO(selectedChild.next_lesson_date), 'EEEE, d MMMM')}
                          {selectedChild.next_lesson_time && ` at ${formatTime(selectedChild.next_lesson_time)}`}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedChild.test_date && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10">
                      <Calendar className="h-5 w-5 text-amber-600" />
                      <div>
                        <div className="font-medium">Test Date</div>
                        <div className="text-sm text-muted-foreground">
                          {format(parseISO(selectedChild.test_date), 'EEEE, d MMMM yyyy')}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Feedback for this child */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Instructor Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentFeedback.filter(f => f.pupil_name === selectedChild.name).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No feedback yet for {selectedChild.name}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentFeedback
                        .filter(f => f.pupil_name === selectedChild.name)
                        .map((feedback) => (
                          <div key={feedback.id} className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">
                                {format(parseISO(feedback.lesson_date), 'EEE d MMM')}
                              </span>
                              {feedback.rating && (
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3 w-3 ${star <= feedback.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-sm">{feedback.notes}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Message Instructor */}
            <div>
              <ParentMessageCard
                instructorId={selectedChild.instructor_id}
                instructorName={selectedChild.instructor_name}
                childName={selectedChild.name}
                parentPhone={parentPhone}
              />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Main dashboard
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
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedChild(child)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                        {child.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{child.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {child.instructor_name}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg bg-secondary p-3">
                      <div className="text-xl font-bold">{child.lessons_completed}</div>
                      <div className="text-xs text-muted-foreground">Lessons</div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <div className="text-xl font-bold">{child.progress}%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                    <div className="rounded-lg bg-emerald-500/10 p-3">
                      <div className="text-xl font-bold text-emerald-600">{child.prepaid_hours}h</div>
                      <div className="text-xs text-muted-foreground">Credit</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Progress value={child.progress} className="h-2" />
                  </div>

                  {child.next_lesson_date && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/10 p-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <strong>Next:</strong>{' '}
                        {format(parseISO(child.next_lesson_date), 'EEE d MMM')}
                        {child.next_lesson_time && ` at ${formatTime(child.next_lesson_time)}`}
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
                      <div key={feedback.id} className="rounded-lg border p-4">
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
                        <div key={activity.id} className="flex items-start gap-3 text-sm">
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
