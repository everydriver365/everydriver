import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, MessageSquare, AlertCircle,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { toast } from "@/hooks/use-toast";
import { InstructorCard } from "@/components/instructor/InstructorCard";
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
import { PupilPortalProfileEdit } from "@/components/pupil-portal/PupilPortalProfileEdit";
import { PupilNotes } from "@/components/pupil-portal/PupilNotes";
import { PortalIOSInstallBanner } from "@/components/pwa/PortalIOSInstallBanner";
import { PupilDetailsDrawer } from "@/components/pupil-portal/PupilDetailsDrawer";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { PupilDashboardInsights } from "@/components/pupil-portal/PupilDashboardInsights";
import { PupilAICoaching } from "@/components/pupil-portal/PupilAICoaching";
import { PupilTestRequests } from "@/components/test-requests/PupilTestRequests";
import { ReflectiveLog } from "@/components/pupil-portal/ReflectiveLog";
import { PupilEndOfLessonWizard } from "@/components/pupil-portal/PupilEndOfLessonWizard";
import { LessonSummaryCard } from "@/components/pupil-portal/LessonSummaryCard";
import { AchievementBadges } from "@/components/pupil-portal/AchievementBadges";
import { LessonPrepChecklist } from "@/components/pupil-portal/LessonPrepChecklist";
import { WhatsNewModal } from "@/components/shared/WhatsNewModal";
import TheoryProgressChart from "@/components/pupil-portal/TheoryProgressChart";
import { PupilCheckInCard } from "@/components/pupil-portal/PupilCheckInCard";
import { TheoryMockScoreLogger } from "@/components/pupil-portal/TheoryMockScoreLogger";
import { TheoryMockTest } from "@/components/pupil-portal/TheoryMockTest";
import { ShowMeTellMeSection } from "@/components/pupil-portal/ShowMeTellMeSection";
import { PupilRouteHistory } from "@/components/pupil-portal/PupilRouteHistory";
import { TheoryStreakTracker } from "@/components/pupil-portal/TheoryStreakTracker";
import { PupilPaymentFeed } from "@/components/pupil-portal/PupilPaymentFeed";
import { PupilWidgetGrid } from "@/components/pupil-portal/PupilWidgetGrid";
import { PupilJourneyTimeline } from "@/components/pupil-portal/PupilJourneyTimeline";
import { SlotOfferNotification } from "@/components/pupil-portal/SlotOfferNotification";
import { PupilLessonVideos } from "@/components/pupil-portal/PupilLessonVideos";
import { PupilDrivingStyleReport } from "@/components/pupil-portal/PupilDrivingStyleReport";
import { LearnerDrivingScore } from "@/components/pupil-portal/LearnerDrivingScore";
import { PupilGoals } from "@/components/pupil-portal/PupilGoals";
import { LessonStreakCard } from "@/components/pupil-portal/LessonStreakCard";
import { PupilWelcomeTour } from "@/components/pupil-portal/PupilWelcomeTour";
import { PupilDashboardSkeleton } from "@/components/ui/skeletons/PupilDashboardSkeleton";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { PostLessonRating } from "@/components/pupil-portal/PostLessonRating";
import { PassShareCard } from "@/components/pupil-portal/PassShareCard";
import { PupilCertificates } from "@/components/pupil-portal/PupilCertificates";
import { SubPageHeader } from "@/components/pupil-portal/SubPageHeader";
import { TestCountdownCard } from "@/components/pupil-portal/TestCountdownCard";
import { PupilQuickActions } from "@/components/pupil-portal/PupilQuickActions";
import { GroupedNavMenu } from "@/components/pupil-portal/GroupedNavMenu";
import { SwapSettingsPanel } from "@/components/pupil-portal/SwapSettingsPanel";
import { SwapNeedsAttentionBanner } from "@/components/pupil-portal/SwapNeedsAttentionBanner";
import { SwapChecklistPanel } from "@/components/pupil-portal/SwapChecklistPanel";
import { SwapChecklistNeedsAttentionBanner } from "@/components/pupil-portal/SwapChecklistNeedsAttentionBanner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

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
  payment_qr_url: string | null;
  payment_qr_url_pupil_pays: string | null;
  payment_qr_url_instructor_pays: string | null;
  payment_link_base_url: string | null;
  commission_payer: string | null;
  commission_split_percent: number | null;
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
  date_of_birth: string | null;
  driver_number: string | null;
  theory_cert_number: string | null;
  address: string | null;
  postcode: string | null;
  pickup_address: string | null;
  what3words: string | null;
  test_date?: string | null;
}

type ActiveSection = 'home' | 'schedule' | 'payments' | 'theory' | 'progress' | 'history' | 'gaps' | 'test-info' | 'messages' | 'profile' | 'notes' | 'coaching' | 'test-requests' | 'reflections' | 'book' | 'lesson-tracks' | 'lesson-videos' | 'driving-style' | 'show-tell' | 'documents' | 'swap-settings';

const sectionTitles: Record<string, string> = {
  schedule: "My Lessons",
  payments: "Payments",
  theory: "Theory",
  progress: "My Progress",
  history: "Lesson History",
  gaps: "Available Slots",
  messages: "Messages",
  profile: "My Profile",
  notes: "My Notes",
  coaching: "AI Coaching",
  "test-requests": "Test Swap",
  reflections: "My Reflections",
  book: "Book a Lesson",
  "lesson-tracks": "Lesson Tracks",
  "lesson-videos": "Lesson Videos",
  "driving-style": "Driving Style",
  "show-tell": "Show Me / Tell Me",
  documents: "My Documents",
};

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
  const [statsOpen, setStatsOpen] = useState(true);
  const [swapPanelOpen, setSwapPanelOpen] = useState(false);
  const [swapChecklistOpen, setSwapChecklistOpen] = useState(false);
  const swapStatus: "none" | "pending" | "matched" = "none";
  const [swapOptedIn, setSwapOptedIn] = useState(false);
  const { invalidatePaymentQueries } = usePaymentInvalidation();

  useEffect(() => {
    if (!pupil?.id) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("pupil_swap_profile")
        .select("opted_in")
        .eq("pupil_id", pupil.id)
        .maybeSingle();
      if (alive) setSwapOptedIn(!!data?.opted_in);
    })();
    return () => { alive = false; };
  }, [pupil?.id, swapPanelOpen]);

  const openSwapSettings = () => setSwapPanelOpen(true);

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
        .select("id, name, phone, email, logo_url, brand_colour, secondary_colour, pupil_app_dark_mode, pupil_app_enabled, profile_image_url, reflective_logs_enabled, pupil_self_booking_enabled, lesson_feedback_enabled, payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays, payment_link_base_url, commission_payer, commission_split_percent")
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

      // Look up the pupil from the active Supabase Auth session
      const { data: sessionData } = await supabase.auth.getSession();
      const authUserId = sessionData.session?.user?.id;
      if (authUserId) {
        const { data: pupilRow } = await supabase
          .from("pupils")
          .select("id")
          .eq("auth_user_id", authUserId)
          .eq("instructor_id", data.id)
          .maybeSingle();
        if (pupilRow?.id) {
          fetchPupil(pupilRow.id);
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
      .select("id, name, phone, email, lessons_completed, progress, account_balance, prepaid_hours, profile_image_url, date_of_birth, driver_number, theory_cert_number, address, postcode, pickup_address, what3words, test_date")
      .eq("id", pupilId)
      .single();

    if (!error && data) {
      setPupil(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (instructor) {
      sessionStorage.removeItem(`pupil_${instructor.id}`);
    }
    sessionStorage.removeItem("pupil_email_verified");
    setPupil(null);
    setActiveSection('home');
  };

  const wallpaperColor = effectiveDarkMode ? '#111111' : '#E8F1FE';

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: wallpaperColor }}>
        <PupilDashboardSkeleton />
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
  const drive365Blue = '#141b43';
  const handleBack = () => { setBookingRequested(false); setActiveSection('home'); };

  // Compute payment badge
  const paymentBadge = pupil && (pupil.account_balance || 0) < 0
    ? `£${Math.abs(pupil.account_balance!).toFixed(0)}`
    : undefined;

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{ backgroundColor: wallpaperColor }}
    >
      <PortalIOSInstallBanner 
        appName={instructor.name}
        storageKey={`ios-install-pupil-${instructor.id}`}
        primaryColor={'#141b43'}
      />

      <PupilMobileHeader
        pupilName={pupil?.name}
        pupilImageUrl={pupil?.profile_image_url}
        instructorName={instructor.name}
        instructorLogoUrl={instructor.logo_url}
        brandColour="#141b43"
        showBackButton={isSubPage}
        title={isSubPage ? sectionTitles[activeSection] || activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace(/-/g, ' ') : undefined}
        darkMode={effectiveDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={pupil ? handleLogout : undefined}
        onAvatarClick={() => setDetailsOpen(true)}
        onNavigate={pupil ? (section) => setActiveSection(section as ActiveSection) : undefined}
      />

      <main className="pb-20">
        {!pupil ? (
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
                  style={{ backgroundColor: '#141b43', color: '#ffffff' }}
                >
                  Sign In
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Use the email address registered with your instructor
                </p>
              </InstructorCard>

              <div className="mt-6 text-center">
                <p className="text-sm mb-2 text-muted-foreground">
                  Having trouble? Contact your instructor:
                </p>
                <div className="flex justify-center gap-3">
                  {instructor.phone && (
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `tel:${instructor.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />Call
                    </Button>
                  )}
                  {instructor.phone && (
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `sms:${instructor.phone}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />Text
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeSection === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <PupilWelcomeTour pupilId={pupil.id} />
                
                <PullToRefresh onRefresh={async () => { await fetchPupil(pupil.id); }}>
                <div className="p-4 space-y-4">
                  {/* iOS Greeting */}
                  <div className="flex items-center gap-3 pt-1">
                    <Avatar className="h-11 w-11 border-2 border-border">
                      <AvatarImage src={pupil.profile_image_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                        {pupil.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</p>
                      <h1 className="text-xl font-bold text-foreground">Hi {pupil.name.split(' ')[0]} 👋</h1>
                    </div>
                  </div>

                  {/* ═══ ZONE 1: RIGHT NOW ═══ */}
                  <SwapNeedsAttentionBanner
                    hasTestBooked={!!pupil.test_date}
                    optedIn={swapOptedIn}
                    onClick={openSwapSettings}
                  />
                  <SwapChecklistNeedsAttentionBanner
                    swapStatus={swapStatus}
                    onClick={() => setSwapChecklistOpen(true)}
                  />
                  <SlotOfferNotification pupilId={pupil.id} onAccept={() => setActiveSection('schedule')} />
                  <PupilCheckInCard pupilId={pupil.id} />
                  <PushNotificationBanner pupilId={pupil.id} brandColour={drive365Blue} />

                  {instructor.lesson_feedback_enabled !== false && (
                    <PupilEndOfLessonWizard pupilId={pupil.id} instructorId={instructor.id} brandColour={drive365Blue} />
                  )}
                  <PostLessonRating pupilId={pupil.id} instructorId={instructor.id} brandColour={drive365Blue} />
                  <LessonSummaryCard pupilId={pupil.id} />
                  <LessonPrepChecklist pupilId={pupil.id} instructorId={instructor.id} brandColour={drive365Blue} />

                  <PupilPortalLessonCountdown
                    pupilId={pupil.id}
                    instructorId={instructor.id}
                    brandColour={drive365Blue}
                    darkMode={instructor.pupil_app_dark_mode}
                    onBookLesson={() => { setBookingRequested(true); setActiveSection('schedule'); }}
                  />

                  {/* Test Countdown */}
                  <TestCountdownCard pupilId={pupil.id} brandColour={drive365Blue} />

                  {/* ═══ ZONE 2: YOUR STATS (collapsible) ═══ */}
                  <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between py-2">
                      <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Your Progress</span>
                      <motion.div animate={{ rotate: statsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
                      </motion.div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4">
                      <PupilWidgetGrid
                        pupilId={pupil.id}
                        pupil={{
                          lessons_completed: pupil.lessons_completed,
                          progress: pupil.progress,
                          account_balance: pupil.account_balance,
                          prepaid_hours: pupil.prepaid_hours,
                        }}
                        brandColour={drive365Blue}
                        onNavigate={(section) => setActiveSection(section as ActiveSection)}
                      />
                      <LessonStreakCard pupilId={pupil.id} brandColour={drive365Blue} />
                      <AchievementBadges pupilId={pupil.id} brandColour={drive365Blue} />
                    </CollapsibleContent>
                  </Collapsible>

                  <WhatsNewModal portalType="pupil" userId={pupil.id} />

                  {/* ═══ ZONE 3: QUICK ACCESS ═══ */}
                  <GroupedNavMenu
                    onNavigate={(section) => {
                      if (section === 'swap-settings') { openSwapSettings(); return; }
                      setActiveSection(section as ActiveSection);
                    }}
                    brandColour={instructor.brand_colour || drive365Blue}
                    selfBookingEnabled={instructor.pupil_self_booking_enabled ?? false}
                    reflectiveLogsEnabled={instructor.reflective_logs_enabled !== false}
                  />

                  <ReferralCard pupilId={pupil.id} instructorId={instructor.id} instructorSlug={slug} brandColour={drive365Blue} />
                  <PupilPortalContact instructor={instructor} />
                </div>
                </PullToRefresh>
              </motion.div>
            )}

            {activeSection === 'schedule' && (
              <motion.div key="schedule" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="My Lessons" onBack={handleBack} />
                <PupilPortalSchedule 
                  pupilId={pupil.id} instructorId={instructor.id} brandColour={drive365Blue}
                  darkMode={instructor.pupil_app_dark_mode} instructorPhone={instructor.phone}
                  initialShowBooking={bookingRequested}
                />
              </motion.div>
            )}

            {activeSection === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="Payments" onBack={handleBack} />
                <PupilPaymentFeed pupilId={pupil.id} brandColour={drive365Blue} currentBalance={pupil.account_balance} />
                <div className="px-4 pt-4">
                  <PupilPortalPayments 
                    pupilId={pupil.id} instructorId={instructor.id} instructorSlug={slug}
                    brandColour={drive365Blue} darkMode={instructor.pupil_app_dark_mode}
                    accountBalance={pupil.account_balance} prepaidHours={pupil.prepaid_hours}
                    pupilName={pupil.name} pupilEmail={pupil.email} pupilPhone={pupil.phone}
                    onBalanceUpdate={() => fetchPupil(pupil.id)} paymentQrUrl={instructor.payment_qr_url}
                    paymentQrUrlPupilPays={instructor.payment_qr_url_pupil_pays}
                    paymentQrUrlInstructorPays={instructor.payment_qr_url_instructor_pays}
                    paymentLinkBaseUrl={instructor.payment_link_base_url}
                    commissionPayer={instructor.commission_payer}
                  />
                </div>
              </motion.div>
            )}

            {activeSection === 'theory' && (
              <motion.div key="theory" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="Theory" onBack={handleBack} />
                <PupilPortalTheory brandColour={drive365Blue} darkMode={instructor.pupil_app_dark_mode} />
                <div className="px-4 pb-4 space-y-4">
                  <TheoryStreakTracker pupilId={pupil.id} brandColour={drive365Blue} />
                  <TheoryMockTest pupilId={pupil.id} />
                  <TheoryProgressChart pupilId={pupil.id} instructorId={instructor.id} brandColour={drive365Blue} />
                  <TheoryMockScoreLogger pupilId={pupil.id} instructorId={instructor.id} />
                </div>
              </motion.div>
            )}

            {activeSection === 'progress' && (
              <motion.div key="progress" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="My Progress" onBack={handleBack} />
                <PupilPortalProgress pupilId={pupil.id} brandColour={drive365Blue} darkMode={instructor.pupil_app_dark_mode} />
              </motion.div>
            )}

            {activeSection === 'coaching' && (
              <motion.div key="coaching" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="AI Coaching" onBack={handleBack} />
                <PupilAICoaching pupilId={pupil.id} instructorId={instructor.id} brandColour={drive365Blue} darkMode={instructor.pupil_app_dark_mode} />
              </motion.div>
            )}

            {activeSection === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-[calc(100vh-8rem)]">
                <PupilChat pupilId={pupil.id} instructorId={instructor.id} instructorName={instructor.name} onBack={handleBack} />
              </motion.div>
            )}

            {activeSection === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="Lesson History" onBack={handleBack} />
                <PupilPortalHistory pupilId={pupil.id} brandColour={drive365Blue} darkMode={instructor.pupil_app_dark_mode} />
                <div className="px-4 pb-4">
                  <PupilRouteHistory pupilId={pupil.id} brandColour={drive365Blue} />
                </div>
              </motion.div>
            )}

            {activeSection === 'show-tell' && (
              <motion.div key="show-tell" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="Show Me / Tell Me" onBack={handleBack} />
                <div className="px-4">
                  <ShowMeTellMeSection pupilId={pupil.id} brandColour={drive365Blue} />
                </div>
              </motion.div>
            )}

            {activeSection === 'gaps' && (
              <motion.div key="gaps" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="Available Slots" onBack={handleBack} />
                <PupilPortalGaps pupilId={pupil.id} instructorId={instructor.id} brandColour={drive365Blue} darkMode={instructor.pupil_app_dark_mode} />
              </motion.div>
            )}

            {activeSection === 'notes' && (
              <motion.div key="notes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="My Notes" onBack={handleBack} />
                <PupilNotes pupilId={pupil.id} instructorId={instructor.id} brandColour={drive365Blue} instructorName={instructor.name} />
              </motion.div>
            )}

            {activeSection === 'test-requests' && (
              <motion.div key="test-requests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="Test Swap" onBack={handleBack} />
                <PupilTestRequests pupilId={pupil.id} instructorId={instructor.id} brandColour={drive365Blue} />
              </motion.div>
            )}

            {activeSection === 'reflections' && (
              <motion.div key="reflections" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="My Reflections" onBack={handleBack} />
                <div className="px-4">
                  <ReflectiveLog pupilId={pupil.id} brandColour={drive365Blue} />
                </div>
              </motion.div>
            )}

            {activeSection === 'book' && (
              <motion.div key="book" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="Book a Lesson" onBack={handleBack} />
                <PupilPortalGaps pupilId={pupil.id} instructorId={instructor.id} brandColour={drive365Blue} darkMode={instructor.pupil_app_dark_mode} />
              </motion.div>
            )}

            {activeSection === 'lesson-tracks' && (
              <motion.div key="lesson-tracks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="Lesson Tracks" onBack={handleBack} />
                <div className="px-4 pb-4">
                  <PupilRouteHistory pupilId={pupil.id} brandColour={drive365Blue} />
                </div>
              </motion.div>
            )}

            {activeSection === 'lesson-videos' && (
              <motion.div key="lesson-videos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="Lesson Videos" onBack={handleBack} />
                <PupilLessonVideos pupilId={pupil.id} brandColour={drive365Blue} />
              </motion.div>
            )}

            {activeSection === 'driving-style' && (
              <motion.div key="driving-style" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="Driving Style" onBack={handleBack} />
                <LearnerDrivingScore pupilId={pupil.id} brandColour={drive365Blue} className="mb-4" />
                <PupilDrivingStyleReport pupilId={pupil.id} brandColour={drive365Blue} />
              </motion.div>
            )}

            {activeSection === 'documents' && instructor && (
              <motion.div key="documents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="My Documents" onBack={handleBack} />
                <PupilCertificates
                  pupilId={pupil.id}
                  pupilName={pupil.name}
                  instructorId={instructor.id}
                  instructorName={instructor.name}
                  brandColour={drive365Blue}
                />
              </motion.div>
            )}

            {activeSection === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SubPageHeader title="My Profile" onBack={handleBack} />
                <div className="px-4">
                  <PupilPortalProfileEdit
                    pupil={pupil}
                    onPupilUpdate={(updates) => setPupil(prev => prev ? { ...prev, ...updates } : null)}
                    brandColour={drive365Blue}
                    swapOptedIn={swapOptedIn}
                    onOpenSwapSettings={openSwapSettings}
                  />
                </div>
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
          brandColour={drive365Blue}
          wallpaperColor={wallpaperColor}
          courseProgress={pupil.progress || 0}
          badges={{
            payments: paymentBadge,
          }}
        />
      )}

      {pupil && (
        <PupilDetailsDrawer
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          pupilId={pupil.id}
          brandColour={drive365Blue}
          darkMode={effectiveDarkMode}
        />
      )}

      {pupil && instructor && (
        <Sheet open={swapPanelOpen} onOpenChange={setSwapPanelOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
            <SwapSettingsPanel
              pupilId={pupil.id}
              instructorId={instructor.id}
              onClose={() => setSwapPanelOpen(false)}
              onOpenChecklist={() => {
                setSwapPanelOpen(false);
                setSwapChecklistOpen(true);
              }}
            />
          </SheetContent>
        </Sheet>
      )}

      {pupil && instructor && (
        <Sheet open={swapChecklistOpen} onOpenChange={setSwapChecklistOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
            <SwapChecklistPanel
              pupilId={pupil.id}
              instructorId={instructor.id}
              onClose={() => setSwapChecklistOpen(false)}
              onOpenSwapSettings={() => setSwapPanelOpen(true)}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
