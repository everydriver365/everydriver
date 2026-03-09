import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Phone, MessageSquare, CreditCard, 
  BookOpen, Car, History, ChevronRight, AlertCircle,
  Loader2, MapPin, User, StickyNote, Sparkles, TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { toast } from "@/hooks/use-toast";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { PupilMobileHeader } from "@/components/pupil-portal/PupilMobileHeader";
import { PupilBottomNav } from "@/components/pupil-portal/PupilBottomNav";
import { PupilPortalLessonCountdown } from "@/components/pupil-portal/PupilPortalLessonCountdown";
import { PupilPortalSchedule } from "@/components/pupil-portal/PupilPortalSchedule";
import { PupilPortalPayments } from "@/components/pupil-portal/PupilPortalPayments";
import { PupilPortalContact } from "@/components/pupil-portal/PupilPortalContact";
import { PupilPortalTheory } from "@/components/pupil-portal/PupilPortalTheory";
import { PupilPortalProgress } from "@/components/pupil-portal/PupilPortalProgress";
import { PupilPortalHistory } from "@/components/pupil-portal/PupilPortalHistory";
import { PupilPortalGaps } from "@/components/pupil-portal/PupilPortalGaps";
import { PupilChat } from "@/components/pupil-portal/PupilChat";
import { ReferralCard } from "@/components/pupil-portal/ReferralCard";
import { PushNotificationBanner } from "@/components/pupil-portal/PushNotificationBanner";
import { PupilProfilePictureUpload } from "@/components/pupil-portal/PupilProfilePictureUpload";
import { PupilNotes } from "@/components/pupil-portal/PupilNotes";
import { PortalIOSInstallBanner } from "@/components/pwa/PortalIOSInstallBanner";
import { PupilDetailsDrawer } from "@/components/pupil-portal/PupilDetailsDrawer";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { PupilDashboardInsights } from "@/components/pupil-portal/PupilDashboardInsights";
import { PupilAICoaching } from "@/components/pupil-portal/PupilAICoaching";
import { PupilTestRequests } from "@/components/test-requests/PupilTestRequests";
import { RefreshCw, PenLine, CalendarPlus } from "lucide-react";
import { ReflectiveLog } from "@/components/pupil-portal/ReflectiveLog";
import { PupilFeedbackPrompt } from "@/components/pupil-portal/PupilFeedbackPrompt";
import { PupilEndOfLessonWizard } from "@/components/pupil-portal/PupilEndOfLessonWizard";
import { LessonSummaryCard } from "@/components/pupil-portal/LessonSummaryCard";
import { AchievementBadges } from "@/components/pupil-portal/AchievementBadges";
import { LessonPrepChecklist } from "@/components/pupil-portal/LessonPrepChecklist";
import { WhatsNewModal } from "@/components/shared/WhatsNewModal";
import TheoryProgressChart from "@/components/pupil-portal/TheoryProgressChart";
import { PupilCheckInCard } from "@/components/pupil-portal/PupilCheckInCard";
import { TheoryMockScoreLogger } from "@/components/pupil-portal/TheoryMockScoreLogger";
import { TheoryMockTest } from "@/components/pupil-portal/TheoryMockTest";
import { PupilRouteHistory } from "@/components/pupil-portal/PupilRouteHistory";
import { TheoryStreakTracker } from "@/components/pupil-portal/TheoryStreakTracker";
import { PupilPaymentFeed } from "@/components/pupil-portal/PupilPaymentFeed";
import { PupilWidgetGrid } from "@/components/pupil-portal/PupilWidgetGrid";
import { PupilJourneyTimeline } from "@/components/pupil-portal/PupilJourneyTimeline";

interface InstructorBranding {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  brand_colour: string | null;
  secondary_colour: string | null;
  pupil_app_dark_mode: boolean;
  pupil_app_enabled: boolean;
  profile_image_url: string | null;
  reflective_logs_enabled: boolean | null;
  pupil_self_booking_enabled: boolean | null;
  lesson_feedback_enabled: boolean | null;
}

interface Pupil {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  lessons_completed: number | null;
  progress: number | null;
  account_balance: number | null;
  prepaid_hours: number | null;
  profile_image_url: string | null;
}

type ActiveSection = 'home' | 'schedule' | 'payments' | 'theory' | 'progress' | 'history' | 'gaps' | 'test-info' | 'messages' | 'profile' | 'notes' | 'coaching' | 'test-requests' | 'reflections' | 'book';

export default function BrandedPupilPortal() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [instructor, setInstructor] = useState<InstructorBranding | null>(null);
  const [pupil, setPupil] = useState<Pupil | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [bookingRequested, setBookingRequested] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [darkModeOverride, setDarkModeOverride] = useState<boolean | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { invalidatePaymentQueries } = usePaymentInvalidation();

  // Handle payment return params
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const paymentAmount = searchParams.get("amount");

    if (paymentStatus === "success") {
      toast({ 
        title: "Payment successful! ✓", 
        description: paymentAmount ? `£${parseFloat(paymentAmount).toFixed(2)} has been added to your account` : "Your payment has been processed",
      });
      searchParams.delete("payment");
      searchParams.delete("amount");
      setSearchParams(searchParams);
      invalidatePaymentQueries({ pupilId: pupil?.id, instructorId: instructor?.id });
      if (pupil) {
        fetchPupil(pupil.id);
      }
    } else if (paymentStatus === "failed" || paymentStatus === "cancelled") {
      toast({ 
        title: "Payment not completed", 
        description: "Your payment was not processed. Please try again.",
        variant: "destructive"
      });
      searchParams.delete("payment");
      searchParams.delete("amount");
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchInstructor();
  }, [slug]);

  useEffect(() => {
    if (instructor) {
      const stored = localStorage.getItem(`darkMode_${instructor.id}`);
      if (stored !== null) {
        setDarkModeOverride(stored === 'true');
      }
    }
  }, [instructor]);

  const effectiveDarkMode = darkModeOverride !== null ? darkModeOverride : instructor?.pupil_app_dark_mode ?? false;

  const toggleDarkMode = () => {
    const newValue = !effectiveDarkMode;
    setDarkModeOverride(newValue);
    if (instructor) {
      localStorage.setItem(`darkMode_${instructor.id}`, String(newValue));
    }
  };

  const fetchInstructor = async () => {
    if (!slug) return;
    
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, name, phone, email, logo_url, brand_colour, secondary_colour, pupil_app_dark_mode, pupil_app_enabled, profile_image_url, reflective_logs_enabled, pupil_self_booking_enabled, lesson_feedback_enabled")
        .eq("app_slug", slug)
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      if (!data.pupil_app_enabled) {
        setNotFound(true);
        return;
      }

      setInstructor(data);
      
      const storedPupilId = sessionStorage.getItem(`pupil_${data.id}`);
      if (storedPupilId) {
        fetchPupil(storedPupilId);
      } else {
        const verifiedEmail = sessionStorage.getItem("pupil_email_verified");
        if (verifiedEmail) {
          const { data: pupilData } = await supabase
            .from("pupils")
            .select("id")
            .eq("instructor_id", data.id)
            .eq("email", verifiedEmail)
            .single();
          if (pupilData) {
            sessionStorage.setItem(`pupil_${data.id}`, pupilData.id);
            fetchPupil(pupilData.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching instructor:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPupil = async (pupilId: string) => {
    const { data, error } = await supabase
      .from("pupils")
      .select("id, name, phone, email, lessons_completed, progress, account_balance, prepaid_hours, profile_image_url")
      .eq("id", pupilId)
      .single();

    if (!error && data) {
      setPupil(data);
    }
  };

  const handleLogout = () => {
    if (instructor) {
      sessionStorage.removeItem(`pupil_${instructor.id}`);
    }
    setPupil(null);
    setActiveSection('home');
  };

  // Wallpaper color - use brand-derived light tint or default
  const wallpaperColor = effectiveDarkMode ? '#111111' : '#E8F1FE';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: wallpaperColor }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: wallpaperColor }}>
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Portal Not Found</h1>
        <p className="text-muted-foreground text-center mb-4">
          This instructor portal doesn't exist or isn't available.
        </p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  if (!instructor) return null;

  const isSubPage = activeSection !== 'home';

  // Section back handler
  const handleBack = () => setActiveSection('home');

  // Render a sub-page wrapper with back button
  const renderSubPage = (content: React.ReactNode) => (
    <div className="p-4">
      <button 
        onClick={handleBack}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors"
      >
        ← Back
      </button>
      {content}
    </div>
  );

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{ backgroundColor: wallpaperColor }}
    >
      {/* iOS Install Banner */}
      <PortalIOSInstallBanner 
        appName={instructor.name}
        storageKey={`ios-install-pupil-${instructor.id}`}
        primaryColor={instructor.brand_colour || '#1e3a5f'}
      />

      {/* Header */}
      <PupilMobileHeader
        pupilName={pupil?.name}
        pupilImageUrl={pupil?.profile_image_url}
        instructorName={instructor.name}
        instructorLogoUrl={instructor.logo_url}
        brandColour={instructor.brand_colour}
        showBackButton={isSubPage}
        title={activeSection !== 'home' ? activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace(/-/g, ' ') : undefined}
        darkMode={effectiveDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={pupil ? handleLogout : undefined}
        onAvatarClick={() => setDetailsOpen(true)}
      />

      {/* Main Content */}
      <main className="pb-20">
        {!pupil ? (
          /* Sign In Screen */
          <div className="p-4 max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <InstructorCard>
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-foreground">
                    Welcome to {instructor.name}'s Portal
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sign in with your email and password to access your lessons and account
                  </p>
                </div>
                <Button 
                  className="w-full h-12 text-base"
                  onClick={() => navigate("/pupil/login")}
                  style={{ 
                    backgroundColor: instructor.brand_colour || 'hsl(var(--primary))',
                    color: '#ffffff'
                  }}
                >
                  Sign In
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Use the email address registered with your instructor
                </p>
              </InstructorCard>

              {/* Contact if issues */}
              <div className="mt-6 text-center">
                <p className="text-sm mb-2 text-muted-foreground">
                  Having trouble? Contact your instructor:
                </p>
                <div className="flex justify-center gap-3">
                  {instructor.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `tel:${instructor.phone}`}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  )}
                  {instructor.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `sms:${instructor.phone}`}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Text
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Logged In Pupil View */
          <AnimatePresence mode="wait">
            {activeSection === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {/* iOS Greeting */}
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</p>
                  <h1 className="text-xl font-bold text-foreground">Hi {pupil.name.split(' ')[0]} 👋</h1>
                </div>

                {/* Lesson Check-In */}
                <PupilCheckInCard pupilId={pupil.id} />

                {/* Push Notification Banner */}
                <PushNotificationBanner 
                  pupilId={pupil.id}
                  brandColour={instructor.brand_colour}
                />

                {/* End-of-Lesson Wizard (replaces simple feedback prompt) */}
                {instructor.lesson_feedback_enabled !== false && (
                  <PupilEndOfLessonWizard
                    pupilId={pupil.id}
                    instructorId={instructor.id}
                    brandColour={instructor.brand_colour}
                  />
                )}

                {/* Last Lesson Summary */}
                <LessonSummaryCard pupilId={pupil.id} />

                {/* Lesson Prep Checklist */}
                <LessonPrepChecklist
                  pupilId={pupil.id}
                  instructorId={instructor.id}
                  brandColour={instructor.brand_colour}
                />

                {/* Lesson Countdown */}
                <PupilPortalLessonCountdown
                  pupilId={pupil.id} 
                  instructorId={instructor.id}
                  brandColour={instructor.brand_colour}
                  darkMode={instructor.pupil_app_dark_mode}
                  onBookLesson={() => { setBookingRequested(true); setActiveSection('schedule'); }}
                />

                {/* Widget Grid — replaces static stats strip */}
                <PupilWidgetGrid
                  pupil={{
                    lessons_completed: pupil.lessons_completed,
                    progress: pupil.progress,
                    account_balance: pupil.account_balance,
                    prepaid_hours: pupil.prepaid_hours,
                  }}
                  brandColour={instructor.brand_colour}
                  onNavigate={(section) => setActiveSection(section as ActiveSection)}
                />

                {/* Journey Timeline */}
                <PupilJourneyTimeline
                  lessonsCompleted={pupil.lessons_completed || 0}
                  progress={pupil.progress || 0}
                  hasTestDate={false}
                  brandColour={instructor.brand_colour}
                />

                {/* Achievement Badges */}
                <AchievementBadges
                  pupilId={pupil.id}
                  brandColour={instructor.brand_colour}
                />

                {/* What's New */}
                <WhatsNewModal portalType="pupil" userId={pupil.id} />

                {/* AI Driving Insights */}
                <PupilDashboardInsights
                  pupilId={pupil.id}
                  instructorId={instructor.id}
                  brandColour={instructor.brand_colour}
                />

                {/* Navigation Menu — iOS List Style */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border">
                  {[
                    { id: 'profile' as const, icon: User, label: 'My Profile', desc: 'Photo & personal details' },
                    { id: 'schedule' as const, icon: Calendar, label: 'My Lessons', desc: 'Book, reschedule & manage' },
                    ...(instructor.pupil_self_booking_enabled ? [{ id: 'book' as const, icon: CalendarPlus, label: 'Book a Lesson', desc: 'Find available slots' }] : []),
                    { id: 'messages' as const, icon: MessageSquare, label: 'Messages', desc: 'Chat with instructor' },
                    { id: 'notes' as const, icon: StickyNote, label: 'My Notes', desc: 'Personal & shared notes' },
                    ...(instructor.reflective_logs_enabled !== false ? [{ id: 'reflections' as const, icon: PenLine, label: 'My Reflections', desc: 'Reflect on lessons' }] : []),
                    { id: 'payments' as const, icon: CreditCard, label: 'Payments', desc: 'Balance & history' },
                    { id: 'theory' as const, icon: BookOpen, label: 'Theory', desc: 'Practice tests & revision' },
                    { id: 'coaching' as const, icon: Sparkles, label: 'AI Coaching', desc: 'Personalised insights' },
                    { id: 'progress' as const, icon: Car, label: 'My Progress', desc: 'Skills & driving report' },
                    { id: 'test-requests' as const, icon: RefreshCw, label: 'Test Swap', desc: 'Request or swap test' },
                    { id: 'history' as const, icon: History, label: 'Lesson History', desc: 'Past lessons & notes' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div 
                        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${instructor.brand_colour || 'hsl(var(--primary))'}15` }}
                      >
                        <item.icon className="h-4.5 w-4.5" style={{ color: instructor.brand_colour || 'hsl(var(--primary))' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{item.label}</div>
                        <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    </button>
                  ))}
                </div>

                {/* Referral Card */}
                <ReferralCard 
                  pupilId={pupil.id}
                  instructorId={instructor.id}
                  instructorSlug={slug}
                  brandColour={instructor.brand_colour}
                />

                {/* Contact Instructor */}
                <PupilPortalContact instructor={instructor} />
              </motion.div>
            )}

            {activeSection === 'schedule' && (
              <motion.div key="schedule" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                </div>
                <PupilPortalSchedule 
                  pupilId={pupil.id}
                  instructorId={instructor.id}
                  brandColour={instructor.brand_colour}
                  darkMode={instructor.pupil_app_dark_mode}
                  instructorPhone={instructor.phone}
                />
              </motion.div>
            )}

            {activeSection === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                </div>
                <PupilPaymentFeed
                  pupilId={pupil.id}
                  brandColour={instructor.brand_colour}
                  currentBalance={pupil.account_balance}
                />
                <div className="px-4 pt-4">
                  <PupilPortalPayments 
                    pupilId={pupil.id}
                    instructorId={instructor.id}
                    instructorSlug={slug}
                    brandColour={instructor.brand_colour}
                    darkMode={instructor.pupil_app_dark_mode}
                    accountBalance={pupil.account_balance}
                    prepaidHours={pupil.prepaid_hours}
                    pupilName={pupil.name}
                    pupilEmail={pupil.email}
                    pupilPhone={pupil.phone}
                    onBalanceUpdate={() => fetchPupil(pupil.id)}
                  />
                </div>
              </motion.div>
            )}

            {activeSection === 'theory' && (
              <motion.div key="theory" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                </div>
                <PupilPortalTheory 
                  brandColour={instructor.brand_colour}
                  darkMode={instructor.pupil_app_dark_mode}
                />
                <div className="px-4 pb-4 space-y-4">
                  <TheoryStreakTracker pupilId={pupil.id} brandColour={instructor.brand_colour} />
                  <TheoryMockTest pupilId={pupil.id} />
                  <TheoryProgressChart pupilId={pupil.id} instructorId={instructor.id} brandColour={instructor.brand_colour} />
                  <TheoryMockScoreLogger pupilId={pupil.id} instructorId={instructor.id} />
                </div>
              </motion.div>
            )}

            {activeSection === 'progress' && (
              <motion.div key="progress" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                </div>
                <PupilPortalProgress pupilId={pupil.id} brandColour={instructor.brand_colour} darkMode={instructor.pupil_app_dark_mode} />
              </motion.div>
            )}

            {activeSection === 'coaching' && (
              <motion.div key="coaching" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                </div>
                <PupilAICoaching pupilId={pupil.id} instructorId={instructor.id} brandColour={instructor.brand_colour} darkMode={instructor.pupil_app_dark_mode} />
              </motion.div>
            )}

            {activeSection === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-[calc(100vh-8rem)]">
                <PupilChat pupilId={pupil.id} instructorId={instructor.id} instructorName={instructor.name} onBack={handleBack} />
              </motion.div>
            )}

            {activeSection === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                </div>
                <PupilPortalHistory pupilId={pupil.id} brandColour={instructor.brand_colour} darkMode={instructor.pupil_app_dark_mode} />
                <div className="px-4 pb-4">
                  <PupilRouteHistory pupilId={pupil.id} brandColour={instructor.brand_colour} />
                </div>
              </motion.div>
            )}

            {activeSection === 'gaps' && (
              <motion.div key="gaps" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                </div>
                <PupilPortalGaps pupilId={pupil.id} instructorId={instructor.id} brandColour={instructor.brand_colour} darkMode={instructor.pupil_app_dark_mode} />
              </motion.div>
            )}

            {activeSection === 'notes' && (
              <motion.div key="notes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                </div>
                <PupilNotes pupilId={pupil.id} instructorId={instructor.id} brandColour={instructor.brand_colour} instructorName={instructor.name} />
              </motion.div>
            )}

            {activeSection === 'test-requests' && (
              <motion.div key="test-requests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                </div>
                <PupilTestRequests pupilId={pupil.id} instructorId={instructor.id} brandColour={instructor.brand_colour} />
              </motion.div>
            )}

            {activeSection === 'reflections' && (
              <motion.div key="reflections" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                  <ReflectiveLog pupilId={pupil.id} brandColour={instructor.brand_colour} />
                </div>
              </motion.div>
            )}

            {activeSection === 'book' && (
              <motion.div key="book" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4">
                  <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                </div>
                <PupilPortalGaps pupilId={pupil.id} instructorId={instructor.id} brandColour={instructor.brand_colour} darkMode={instructor.pupil_app_dark_mode} />
              </motion.div>
            )}

            {activeSection === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4">
                <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-4 hover:text-foreground transition-colors">← Back</button>
                
                <InstructorCard>
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-foreground">My Profile</h2>
                    <p className="text-sm text-muted-foreground">Update your profile picture</p>
                  </div>
                  <PupilProfilePictureUpload
                    pupilId={pupil.id}
                    pupilName={pupil.name}
                    currentImageUrl={pupil.profile_image_url}
                    onImageUpdated={(newUrl) => {
                      setPupil(prev => prev ? { ...prev, profile_image_url: newUrl } : null);
                    }}
                  />
                  
                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium text-foreground">{pupil.name}</span>
                    </div>
                    {pupil.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium text-foreground">{pupil.email}</span>
                      </div>
                    )}
                    {pupil.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium text-foreground">{pupil.phone}</span>
                      </div>
                    )}
                  </div>
                </InstructorCard>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Nav */}
      {pupil && (
        <PupilBottomNav
          activeSection={activeSection}
          onNavigate={(section) => setActiveSection(section as ActiveSection)}
          brandColour={instructor.brand_colour}
          wallpaperColor={wallpaperColor}
          courseProgress={pupil.progress || 0}
        />
      )}

      {pupil && (
        <PupilDetailsDrawer
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          pupilId={pupil.id}
          brandColour={instructor.brand_colour}
          darkMode={effectiveDarkMode}
        />
      )}
    </div>
  );
}
