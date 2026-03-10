import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Calendar, CreditCard, Clock, Bell, Phone, LogOut, Star, 
  MessageSquare, ChevronRight, Loader2, CheckCircle2, Car, TrendingUp, Shield, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { ParentMobileHeader } from "@/components/parent/ParentMobileHeader";
import { ParentBottomNav } from "@/components/parent/ParentBottomNav";
import { PortalIOSInstallBanner } from "@/components/pwa/PortalIOSInstallBanner";
import { ParentMessageCard } from "@/components/parent/ParentMessageCard";
import { ParentSyllabusOverview } from "@/components/parent/ParentSyllabusOverview";
import { ParentPaymentHistory } from "@/components/parent/ParentPaymentHistory";
import { ParentUpcomingLessons } from "@/components/parent/ParentUpcomingLessons";
import { ParentSafetyScores } from "@/components/parent/ParentSafetyScores";
import { PupilRouteHistory } from "@/components/pupil-portal/PupilRouteHistory";
import { ParentChat } from "@/components/parent/ParentChat";
import { ParentPushBanner } from "@/components/parent/ParentPushBanner";
import { ParentPaymentTopUp } from "@/components/parent/ParentPaymentTopUp";

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
type ParentSection = 'dashboard' | 'children' | 'feedback' | 'settings' | 'child-detail';

const WALLPAPER_COLOR = "#E8F1FE";

export default function ParentPortal() {
  const [parentPhone, setParentPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [authStep, setAuthStep] = useState<AuthStep>('phone');
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<LessonFeedback[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [activeSection, setActiveSection] = useState<ParentSection>('dashboard');

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
      if (data.error) { toast.error(data.error); return; }
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
    if (otp.length !== 6) { toast.error("Please enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-parent-otp", {
        body: { phone: parentPhone.trim(), code: otp },
      });
      if (error) throw error;
      if (data.error) { toast.error(data.error); return; }
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
      const { data: pupils, error: pupilsError } = await supabase
        .from("pupils")
        .select("id, name, lessons_completed, progress, account_balance, prepaid_hours, test_date, instructor_id")
        .or(`parent_phone.ilike.%${cleanPhone.slice(-9)}`);

      if (pupilsError) throw pupilsError;
      if (!pupils || pupils.length === 0) { setChildren([]); return; }

      const instructorIds = [...new Set(pupils.map(p => p.instructor_id))];
      const { data: instructors } = await supabase.from("instructors").select("id, name, phone").in("id", instructorIds);
      const instructorMap = new Map(instructors?.map(i => [i.id, i]) || []);

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
          nextLessonMap.set(lesson.pupil_id, { date: lesson.lesson_date, time: lesson.start_time });
        }
      });

      const childrenData: Child[] = pupils.map(p => {
        const instructor = instructorMap.get(p.instructor_id);
        return {
          id: p.id, name: p.name, instructor_id: p.instructor_id,
          instructor_name: instructor?.name || 'Unknown',
          instructor_phone: instructor?.phone || null,
          lessons_completed: p.lessons_completed || 0, progress: p.progress || 0,
          account_balance: p.account_balance || 0, prepaid_hours: p.prepaid_hours || 0,
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
      const { data: lessons } = await supabase.from("lesson_history").select("id, pupil_id, lesson_date, duration_minutes").in("pupil_id", pupilIds).order("created_at", { ascending: false }).limit(5);
      const { data: payments } = await supabase.from("payment_history").select("id, pupil_id, amount, recorded_at").in("pupil_id", pupilIds).order("recorded_at", { ascending: false }).limit(5);
      const { data: pupils } = await supabase.from("pupils").select("id, name").in("id", pupilIds);
      const pupilMap = new Map(pupils?.map(p => [p.id, p.name]) || []);
      const allActivities: Activity[] = [];
      lessons?.forEach(l => { allActivities.push({ id: `lesson-${l.id}`, type: 'lesson', text: `${pupilMap.get(l.pupil_id)} completed a ${l.duration_minutes} min lesson`, time: formatDistanceToNow(parseISO(l.lesson_date), { addSuffix: true }), pupil_name: pupilMap.get(l.pupil_id) || 'Unknown' }); });
      payments?.forEach(p => { allActivities.push({ id: `payment-${p.id}`, type: 'payment', text: `Payment of £${p.amount} received for ${pupilMap.get(p.pupil_id)}`, time: formatDistanceToNow(parseISO(p.recorded_at), { addSuffix: true }), pupil_name: pupilMap.get(p.pupil_id) || 'Unknown' }); });
      setActivities(allActivities.slice(0, 8));
    } catch (error) { console.error("Error fetching activities:", error); }
  };

  const fetchRecentFeedback = async (pupilIds: string[], pupils: any[]) => {
    try {
      const { data: feedback } = await supabase.from("lesson_history").select("id, pupil_id, lesson_date, notes, rating").in("pupil_id", pupilIds).not("notes", "is", null).order("lesson_date", { ascending: false }).limit(5);
      const pupilMap = new Map(pupils.map(p => [p.id, p.name]));
      setRecentFeedback((feedback || []).map(f => ({ id: f.id, pupil_name: pupilMap.get(f.pupil_id) || 'Unknown', lesson_date: f.lesson_date, notes: f.notes, rating: f.rating })));
    } catch (error) { console.error("Error fetching feedback:", error); }
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
      <div className="min-h-screen" style={{ backgroundColor: WALLPAPER_COLOR }}>
        <ParentMobileHeader />
        <div className="p-4 max-w-md mx-auto mt-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <InstructorCard>
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Parent Portal</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Monitor your children's driving progress and contact their instructor
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-1">
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
                <Button className="w-full" onClick={handleSendOTP} disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending Code...</> : "Send Verification Code"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We'll send a 6-digit code to verify your identity
                </p>
              </div>
            </InstructorCard>
          </motion.div>
        </div>
      </div>
    );
  }

  // OTP verification screen
  if (authStep === 'otp') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: WALLPAPER_COLOR }}>
        <ParentMobileHeader />
        <div className="p-4 max-w-md mx-auto mt-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <InstructorCard>
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Enter Verification Code</h2>
                <p className="text-muted-foreground mt-2 text-sm">We sent a 6-digit code to {parentPhone}</p>
              </div>
              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP value={otp} onChange={(value) => setOtp(value)} maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                      <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button className="w-full" onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying...</> : "Verify & Continue"}
                </Button>
                <div className="text-center">
                  <Button variant="link" onClick={() => setAuthStep('phone')} className="text-muted-foreground">
                    Use a different number
                  </Button>
                </div>
              </div>
            </InstructorCard>
          </motion.div>
        </div>
      </div>
    );
  }

  // No children found
  if (children.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: WALLPAPER_COLOR }}>
        <ParentMobileHeader onLogout={handleLogout} />
        <div className="p-4 mt-8">
          <InstructorCard>
            <div className="py-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Children Found</h3>
              <p className="text-muted-foreground text-sm">
                No pupils are linked to your phone number yet.<br />
                Please ask your child's instructor to add your contact details.
              </p>
            </div>
          </InstructorCard>
        </div>
      </div>
    );
  }

  // Child detail view
  if (selectedChild) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: WALLPAPER_COLOR }}>
        <ParentMobileHeader
          showBackButton
          title={selectedChild.name}
          onLogout={handleLogout}
          onBackClick={() => { setSelectedChild(null); setActiveSection('dashboard'); }}
        />
        <main className="p-4 pb-20 space-y-4">
          {/* Child Info Card — iOS Style */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0">
                {selectedChild.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{selectedChild.name}</h2>
                <p className="text-xs text-muted-foreground">with {selectedChild.instructor_name}</p>
              </div>
            </div>

            {/* 4-Column Stats Strip */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: "Lessons", value: selectedChild.lessons_completed },
                { label: "Progress", value: `${selectedChild.progress}%` },
                { label: "Credit", value: `${selectedChild.prepaid_hours}h` },
                { label: "Balance", value: `£${Math.abs(selectedChild.account_balance).toFixed(0)}`, negative: selectedChild.account_balance < 0 },
              ].map((stat, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-2.5 text-center">
                  <div className={`text-base font-bold ${stat.negative ? 'text-destructive' : 'text-foreground'}`}>
                    {stat.negative ? '-' : ''}{stat.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Learning Progress</span>
                <span className="font-medium text-foreground">{selectedChild.progress}%</span>
              </div>
              <Progress value={selectedChild.progress} className="h-2" />
            </div>

            {/* Next Lesson */}
            {selectedChild.next_lesson_date && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-primary/10 mb-2 text-xs">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium text-foreground">Next Lesson</div>
                  <div className="text-muted-foreground">
                    {format(parseISO(selectedChild.next_lesson_date), 'EEEE, d MMMM')}
                    {selectedChild.next_lesson_time && ` at ${formatTime(selectedChild.next_lesson_time)}`}
                  </div>
                </div>
              </div>
            )}

            {/* Test Date */}
            {selectedChild.test_date && (
              <div className="rounded-xl p-2.5 text-white text-xs" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-white/80" />
                    <span className="text-white/80">Test: {format(parseISO(selectedChild.test_date), 'd MMM yyyy')}</span>
                  </div>
                  <span className="font-bold text-sm">
                    {Math.max(0, Math.ceil((new Date(selectedChild.test_date).getTime() - Date.now()) / 86400000))} days
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Instructor Feedback */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Instructor Feedback
            </h2>
            {recentFeedback.filter(f => f.pupil_name === selectedChild.name).length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-xs">No feedback yet for {selectedChild.name}</p>
            ) : (
              <div className="space-y-3">
                {recentFeedback.filter(f => f.pupil_name === selectedChild.name).map((feedback) => (
                  <div key={feedback.id} className="p-3 rounded-xl bg-secondary/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground">{format(parseISO(feedback.lesson_date), 'EEE d MMM')}</span>
                      {feedback.rating && (
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((star) => (
                            <Star key={star} className={`h-3 w-3 ${star <= feedback.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{feedback.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ParentUpcomingLessons childId={selectedChild.id} />
          <ParentSyllabusOverview childId={selectedChild.id} childName={selectedChild.name} />
          <ParentPaymentHistory childId={selectedChild.id} />
          <ParentSafetyScores childId={selectedChild.id} />
          <div className="px-0">
            <PupilRouteHistory pupilId={selectedChild.id} />
          </div>
          <ParentMessageCard
            instructorId={selectedChild.instructor_id}
            instructorName={selectedChild.instructor_name}
            childName={selectedChild.name}
            parentPhone={parentPhone}
          />
        </main>
        <ParentBottomNav activeSection="children" onNavigate={(s) => { if (s !== 'children') { setSelectedChild(null); setActiveSection(s as ParentSection); } }} />
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen" style={{ backgroundColor: WALLPAPER_COLOR }}>
      <PortalIOSInstallBanner appName="DL Parent" storageKey="ios-install-parent-dismissed" primaryColor="#1e3a5f" />
      <ParentMobileHeader onLogout={handleLogout} />

      <main className="p-4 pb-20 space-y-4">
        <AnimatePresence mode="wait">
          {activeSection === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* iOS Greeting */}
              <div className="pt-1">
                <p className="text-xs text-muted-foreground">Welcome back</p>
                <h1 className="text-xl font-bold text-foreground">Parent Dashboard</h1>
              </div>

              {/* Children Overview */}
              {children.map((child, index) => (
                <motion.div key={child.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <div 
                    className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => { setSelectedChild(child); setActiveSection('children'); }}
                  >
                    <div className="p-4">
                      {/* Child Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shrink-0">
                            {child.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{child.name}</div>
                            <p className="text-[11px] text-muted-foreground">with {child.instructor_name}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </div>

                      {/* 3-Column Stats Strip */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
                          <div className="text-base font-bold text-foreground">{child.lessons_completed}</div>
                          <div className="text-[10px] text-muted-foreground">Lessons</div>
                        </div>
                        <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
                          <div className="text-base font-bold text-foreground">{child.progress}%</div>
                          <div className="text-[10px] text-muted-foreground">Progress</div>
                        </div>
                        <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
                          <div className={`text-base font-bold ${child.account_balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                            {child.account_balance < 0 ? '-' : ''}£{Math.abs(child.account_balance).toFixed(0)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Balance</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <Progress value={child.progress} className="h-2 mb-3" />

                      {/* Next Lesson */}
                      {child.next_lesson_date && (
                        <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-2.5 text-xs mb-2">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span className="text-foreground">
                            <strong>Next:</strong>{' '}
                            {format(parseISO(child.next_lesson_date), 'EEE d MMM')}
                            {child.next_lesson_time && ` at ${formatTime(child.next_lesson_time)}`}
                          </span>
                        </div>
                      )}

                      {/* Test Countdown */}
                      {child.test_date && (
                        <div className="rounded-xl p-2.5 text-white text-xs" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-white/80" />
                              <span className="text-white/80">Test: {format(parseISO(child.test_date), 'd MMM yyyy')}</span>
                            </div>
                            <span className="font-bold text-sm">
                              {Math.max(0, Math.ceil((new Date(child.test_date).getTime() - Date.now()) / 86400000))} days
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Recent Activity — iOS Card Style */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Recent Activity
                </h2>
                {activities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-xs">No recent activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start gap-2.5 text-xs">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-foreground">{activity.text}</div>
                            <div className="text-[10px] text-muted-foreground">{activity.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'feedback' && (
            <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Instructor Feedback
                </h2>
                {recentFeedback.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-xs">No feedback yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentFeedback.map((feedback) => (
                      <div key={feedback.id} className="rounded-xl bg-secondary/50 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-foreground">{feedback.pupil_name}</span>
                            <span className="text-[10px] text-muted-foreground">{format(parseISO(feedback.lesson_date), 'EEE d MMM')}</span>
                          </div>
                          {feedback.rating && (
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map((star) => (
                                <Star key={star} className={`h-3 w-3 ${star <= feedback.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{feedback.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'children' && !selectedChild && (
            <motion.div key="children" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {children.map((child) => (
                <div 
                  key={child.id} 
                  className="bg-card rounded-2xl border border-border shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedChild(child)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shrink-0">
                      {child.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-foreground">{child.name}</div>
                      <p className="text-[11px] text-muted-foreground">{child.instructor_name} · {child.lessons_completed} lessons · {child.progress}%</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeSection === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Settings
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium text-foreground">{parentPhone}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Children</span>
                    <span className="font-medium text-foreground">{children.length}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4 h-9 text-xs" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ParentBottomNav activeSection={activeSection} onNavigate={(s) => setActiveSection(s as ParentSection)} />
    </div>
  );
}
