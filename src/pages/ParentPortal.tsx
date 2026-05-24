import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Calendar, CreditCard, Clock, Bell, Phone, LogOut, Star, 
  MessageSquare, ChevronRight, Loader2, CheckCircle2, XCircle, Car, GraduationCap, Circle,
  TrendingUp, Shield, MapPin, Wallet, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";
import { SubPageHeader } from "@/components/pupil-portal/SubPageHeader";
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
import { NextSyllabusFocus } from "@/components/shared/NextSyllabusFocus";
import { ParentAttendanceReport } from "@/components/parent/ParentAttendanceReport";
import { ParentLessonNotes } from "@/components/parent/ParentLessonNotes";
import { ParentPaymentHistory } from "@/components/parent/ParentPaymentHistory";
import { ParentUpcomingLessons } from "@/components/parent/ParentUpcomingLessons";
import { ParentSafetyScores } from "@/components/parent/ParentSafetyScores";
import { PupilRouteHistory } from "@/components/pupil-portal/PupilRouteHistory";
import { ParentChat } from "@/components/parent/ParentChat";
import { ParentPushBanner } from "@/components/parent/ParentPushBanner";
import { ParentPaymentTopUp } from "@/components/parent/ParentPaymentTopUp";
import { ParentWelcomeTour } from "@/components/parent/ParentWelcomeTour";
import { ParentDashboardSkeleton } from "@/components/ui/skeletons/ParentDashboardSkeleton";
import {
  MobilePortalLoginShell,
  darkPortalInputClass,
  darkPortalInputStyle,
  darkPortalLabelClass,
  darkPortalPrimaryBtnClass,
} from "@/components/auth/MobilePortalLoginShell";
import drive365Logo from "@/assets/drive365-logo.png";

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
  test_passed: boolean | null;
  theory_test_date: string | null;
  theory_test_passed: boolean | null;
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
type ChildDetailTab = 'overview' | 'lessons' | 'progress' | 'payments';

const WALLPAPER_COLOR = "#E8F1FE";

const childDetailSegments = [
  { value: "overview", label: "Overview" },
  { value: "lessons", label: "Lessons" },
  { value: "progress", label: "Progress" },
  { value: "payments", label: "Payments" },
];

function TestStatusRow({ label, date, passed }: { label: string; date: string | null; passed: boolean | null }) {
  const fmt = (d: string) => format(parseISO(d), "EEE d MMM yyyy");
  const isFuture = date ? parseISO(date) >= new Date(new Date().toDateString()) : false;
  let badgeText = "Not set";
  let badgeBg = "transparent";
  let badgeFg = "var(--muted-foreground)";
  let Icon = Circle;

  if (passed === true) { badgeText = "Passed"; badgeBg = "#DCFCE7"; badgeFg = "#15803D"; Icon = CheckCircle2; }
  else if (passed === false) { badgeText = "Not passed"; badgeBg = "#FEE2E2"; badgeFg = "#B91C1C"; Icon = XCircle; }
  else if (date) {
    if (isFuture) { badgeText = "Booked"; badgeBg = "#DBEAFE"; badgeFg = "#1D4ED8"; Icon = Calendar; }
    else { badgeText = "Awaiting result"; badgeBg = "#FEF3C7"; badgeFg = "#92400E"; Icon = Calendar; }
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
      <div>
        <div className="text-xs font-medium text-foreground">{label} test</div>
        {date && <div className="text-[11px] text-muted-foreground mt-0.5">{fmt(date)}</div>}
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: badgeBg, color: badgeFg }}>
        <Icon className="h-3 w-3" />
        {badgeText}
      </div>
    </div>
  );
}

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
  const [childDetailTab, setChildDetailTab] = useState<ChildDetailTab>('overview');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const phoneFromSession = (session?.user?.user_metadata as any)?.parent_phone as string | undefined;
      if (session && phoneFromSession) {
        setParentPhone(phoneFromSession);
        setAuthStep('verified');
        fetchChildrenData(phoneFromSession);
      }
    })();
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
      const tokenHash: string | undefined = data?.token_hash;
      if (!tokenHash) throw new Error("Missing session token");
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "magiclink",
      });
      if (verifyErr) throw verifyErr;
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
          .select("id, name, lessons_completed, progress, account_balance, prepaid_hours, test_date, test_passed, theory_test_date, theory_test_passed, instructor_id")
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
          test_date: p.test_date,
          test_passed: p.test_passed,
          theory_test_date: p.theory_test_date,
          theory_test_passed: p.theory_test_passed,
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

  const handleLogout = async () => {
    localStorage.removeItem('parent_phone_verified');
    await supabase.auth.signOut().catch(() => undefined);
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

  const negativeBalanceCount = children.filter(c => c.account_balance < 0).length;

  // Phone entry screen
  if (authStep === 'phone') {
    return (
      <MobilePortalLoginShell
        logoSrc={drive365Logo}
        logoAlt="Drive365 Parent"
        title="Parent Portal"
        subtitle="Sign in to monitor your child's driving progress"
      >
        <div className="flex flex-col flex-1">
          <label className={darkPortalLabelClass}>Phone number</label>
          <div className="relative mb-4">
            <Phone className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white" strokeWidth={1.8} />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="07XXX XXXXXX"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
              className={darkPortalInputClass}
              style={darkPortalInputStyle}
            />
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.985, opacity: 0.85 }}
            onClick={handleSendOTP}
            disabled={loading || !parentPhone.trim()}
            style={{ opacity: loading || !parentPhone.trim() ? 0.6 : 1 }}
            className={darkPortalPrimaryBtnClass}
          >
            <span className="py-4 text-[15px] flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send verification code"}
            </span>
          </motion.button>

          <p className="text-[12px] text-white/60 text-center mt-3">
            We'll send a 6-digit code to verify your identity.
          </p>
        </div>
      </MobilePortalLoginShell>
    );
  }

  // OTP verification screen
  if (authStep === 'otp') {
    return (
      <MobilePortalLoginShell
        logoSrc={drive365Logo}
        logoAlt="Drive365 Parent"
        title="Enter verification code"
        subtitle={`We sent a 6-digit code to ${parentPhone}`}
        footer={
          <button
            type="button"
            onClick={() => setAuthStep('phone')}
            className="text-[13px] font-semibold text-white"
          >
            Use a different number
          </button>
        }
      >
        <div className="flex flex-col flex-1 items-center">
          <div className="my-2">
            <InputOTP value={otp} onChange={(value) => setOtp(value)} maxLength={6}>
              <InputOTPGroup>
                <InputOTPSlot index={0} className="bg-white/15 border-white/30 text-white" />
                <InputOTPSlot index={1} className="bg-white/15 border-white/30 text-white" />
                <InputOTPSlot index={2} className="bg-white/15 border-white/30 text-white" />
                <InputOTPSlot index={3} className="bg-white/15 border-white/30 text-white" />
                <InputOTPSlot index={4} className="bg-white/15 border-white/30 text-white" />
                <InputOTPSlot index={5} className="bg-white/15 border-white/30 text-white" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.985, opacity: 0.85 }}
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            style={{ opacity: loading || otp.length !== 6 ? 0.6 : 1 }}
            className={`${darkPortalPrimaryBtnClass} mt-6`}
          >
            <span className="py-4 text-[15px] flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & continue"}
            </span>
          </motion.button>
        </div>
      </MobilePortalLoginShell>
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

  // Child detail view — tabbed
  if (selectedChild) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: WALLPAPER_COLOR }}>
        <ParentMobileHeader
          showBackButton
          title={selectedChild.name}
          onLogout={handleLogout}
          onBackClick={() => { setSelectedChild(null); setActiveSection('dashboard'); setChildDetailTab('overview'); }}
        />
        <main className="p-4 pb-20 space-y-4">
          {/* Child Info Card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0">
                {selectedChild.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{selectedChild.name}</h2>
                <p className="text-xs text-muted-foreground">with {selectedChild.instructor_name}</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setChildDetailTab('payments')}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Wallet className="h-3.5 w-3.5" />
                Top Up
              </button>
              <button
                onClick={() => {
                  setChildDetailTab('overview');
                  // Scroll to chat after a tick
                  setTimeout(() => {
                    document.getElementById('parent-chat-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                Message
              </button>
              <button
                onClick={() => setChildDetailTab('progress')}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Progress
              </button>
            </div>

            {/* 4-Column Stats Strip */}
            <div className="grid grid-cols-4 gap-2">
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
          </div>

          {/* Segmented Control */}
          <IOSSegmentedControl
            segments={childDetailSegments}
            value={childDetailTab}
            onChange={(v) => setChildDetailTab(v as ChildDetailTab)}
          />

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {childDetailTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Progress Bar */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Learning Progress</span>
                    <span className="font-medium text-foreground">{selectedChild.progress}%</span>
                  </div>
                  <Progress value={selectedChild.progress} className="h-2" />
                </div>

                {/* Next Lesson */}
                {selectedChild.next_lesson_date && (
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border shadow-sm text-xs">
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

                {/* Tests */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-primary" /> Tests
                  </h3>
                  <TestStatusRow
                    label="Theory"
                    date={selectedChild.theory_test_date}
                    passed={selectedChild.theory_test_passed}
                  />
                  <TestStatusRow
                    label="Driving"
                    date={selectedChild.test_date}
                    passed={selectedChild.test_passed}
                  />
                </div>

                {/* Chat */}
                <div id="parent-chat-section">
                  <ParentChat
                    parentPhone={parentPhone}
                    instructorId={selectedChild.instructor_id}
                    instructorName={selectedChild.instructor_name}
                    pupilId={selectedChild.id}
                    childName={selectedChild.name}
                  />
                </div>
              </motion.div>
            )}

            {childDetailTab === 'lessons' && (
              <motion.div key="lessons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <ParentUpcomingLessons childId={selectedChild.id} />
                <ParentAttendanceReport childId={selectedChild.id} />
                <ParentLessonNotes childId={selectedChild.id} />
                <div className="px-0">
                  <PupilRouteHistory pupilId={selectedChild.id} />
                </div>
              </motion.div>
            )}

            {childDetailTab === 'progress' && (
              <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <ParentSyllabusOverview childId={selectedChild.id} childName={selectedChild.name} />
                <NextSyllabusFocus pupilId={selectedChild.id} audience="parent" />
                <ParentSafetyScores childId={selectedChild.id} />
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
              </motion.div>
            )}

            {childDetailTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <ParentPaymentTopUp
                  childId={selectedChild.id}
                  childName={selectedChild.name}
                  instructorId={selectedChild.instructor_id}
                  currentBalance={selectedChild.account_balance}
                />
                <ParentPaymentHistory childId={selectedChild.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <ParentBottomNav
          activeSection="children"
          onNavigate={(s) => { if (s !== 'children') { setSelectedChild(null); setActiveSection(s as ParentSection); setChildDetailTab('overview'); } }}
          negativeBadgeCount={negativeBalanceCount}
          feedbackBadgeCount={recentFeedback.length}
        />
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
              {/* Welcome Tour */}
              <ParentWelcomeTour parentPhone={parentPhone} />
              
              {/* iOS Greeting */}
              <div className="pt-1">
                <p className="text-xs text-muted-foreground">Welcome back</p>
                <h1 className="text-xl font-bold text-foreground">Parent Dashboard</h1>
              </div>

              {/* Push Notification Banner */}
              <ParentPushBanner parentPhone={parentPhone} />

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

                      {/* Quick Actions */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedChild(child); setActiveSection('children'); setChildDetailTab('payments'); }}
                          className="flex-1 text-xs font-medium py-1.5 px-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          Top Up
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedChild(child); setActiveSection('children'); }}
                          className="flex-1 text-xs font-medium py-1.5 px-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          Message
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedChild(child); setActiveSection('children'); setChildDetailTab('lessons'); }}
                          className="flex-1 text-xs font-medium py-1.5 px-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          Lessons
                        </button>
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

              {/* Recent Activity */}
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
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Account Info */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Account
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
              </div>

              {/* Notifications */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Notifications
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-foreground">Push Notifications</p>
                      <p className="text-[10px] text-muted-foreground">Lesson reminders & updates</p>
                    </div>
                    <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                  </div>
                </div>
              </div>

              {/* Linked Children */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  Linked Children
                </h2>
                <div className="space-y-3">
                  {children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50">
                      <div>
                        <p className="text-xs font-medium text-foreground">{child.name}</p>
                        <p className="text-[10px] text-muted-foreground">Instructor: {child.instructor_name}</p>
                        {child.instructor_phone && (
                          <a href={`tel:${child.instructor_phone}`} className="text-[10px] text-primary hover:underline">
                            {child.instructor_phone}
                          </a>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">{child.progress}%</p>
                        <p className="text-[10px] text-muted-foreground">{child.lessons_completed} lessons</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full h-9 text-xs" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Sign Out
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ParentBottomNav
        activeSection={activeSection}
        onNavigate={(s) => setActiveSection(s as ParentSection)}
        negativeBadgeCount={negativeBalanceCount}
        feedbackBadgeCount={recentFeedback.length}
      />
    </div>
  );
}
