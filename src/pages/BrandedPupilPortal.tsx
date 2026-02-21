import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Phone, MessageSquare, CreditCard, 
  BookOpen, Car, History, ChevronRight, ChevronDown, X, AlertCircle,
  Loader2, Moon, Sun, MapPin, CheckCircle2, User, StickyNote, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { toast } from "@/hooks/use-toast";
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
import { RefreshCw } from "lucide-react";

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

type ActiveSection = 'home' | 'schedule' | 'payments' | 'theory' | 'progress' | 'history' | 'gaps' | 'test-info' | 'messages' | 'profile' | 'notes' | 'coaching' | 'test-requests';

export default function BrandedPupilPortal() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [instructor, setInstructor] = useState<InstructorBranding | null>(null);
  const [pupil, setPupil] = useState<Pupil | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
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
      // Clear the params from URL
      searchParams.delete("payment");
      searchParams.delete("amount");
      setSearchParams(searchParams);
      // Invalidate all payment caches and refresh pupil data
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

  // Load dark mode preference from localStorage
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
        .select("id, name, phone, email, logo_url, brand_colour, secondary_colour, pupil_app_dark_mode, pupil_app_enabled, profile_image_url")
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
      
      // Check if pupil is already verified in session
      const storedPupilId = sessionStorage.getItem(`pupil_${data.id}`);
      if (storedPupilId) {
        fetchPupil(storedPupilId);
      } else {
        // Check email-based session from /pupil/login
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

  // Generate CSS variables for branding
  const brandStyles = instructor ? {
    '--brand-primary': instructor.brand_colour || '#1e3a5f',
    '--brand-secondary': instructor.secondary_colour || '#d4a574',
    '--brand-bg': effectiveDarkMode ? '#0f0f0f' : '#ffffff',
    '--brand-card': effectiveDarkMode ? '#1a1a1a' : '#ffffff',
    '--brand-text': effectiveDarkMode ? '#ffffff' : '#1a1a1a',
    '--brand-muted': effectiveDarkMode ? '#a0a0a0' : '#6b7280',
    '--brand-border': effectiveDarkMode ? '#2a2a2a' : '#e5e7eb',
  } as React.CSSProperties : {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
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

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{
        ...brandStyles,
        backgroundColor: 'var(--brand-bg)',
        color: 'var(--brand-text)',
      }}
    >
      {/* iOS Install Banner */}
      <PortalIOSInstallBanner 
        appName={instructor.name}
        storageKey={`ios-install-pupil-${instructor.id}`}
        primaryColor={instructor.brand_colour || '#1e3a5f'}
      />

      {/* Header */}
      <header 
        className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: instructor.brand_colour || '#1e3a5f' }}
      >
        <div className="flex items-center gap-3">
          {pupil ? (
            <button onClick={() => setDetailsOpen(true)} className="flex items-center gap-3">
              {pupil.profile_image_url ? (
                <img 
                  src={pupil.profile_image_url} 
                  alt={pupil.name} 
                  className="h-10 w-10 object-cover rounded-full border-2 border-white/30"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {pupil.name.charAt(0)}
                </div>
              )}
              <div className="text-left">
                <h1 className="font-bold text-white text-sm line-clamp-1">{pupil.name}</h1>
                <p className="text-white/70 text-xs">{instructor.name}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </button>
          ) : (
            <>
              {instructor.logo_url ? (
                <img 
                  src={instructor.logo_url} 
                  alt={instructor.name} 
                  className="h-10 w-10 object-contain rounded-lg bg-white/10 p-1"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {instructor.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-bold text-white text-sm line-clamp-1">{instructor.name}</h1>
                <p className="text-white/70 text-xs">Pupil Portal</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
          >
            {effectiveDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {pupil && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Logout
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {!pupil ? (
          // Sign In Screen
          <div className="p-4 max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card 
                className="border-0 shadow-lg"
                style={{ 
                  backgroundColor: 'var(--brand-card)',
                  borderColor: 'var(--brand-border)'
                }}
              >
                <CardHeader className="text-center">
                  <CardTitle style={{ color: 'var(--brand-text)' }}>
                    Welcome to {instructor.name}'s Portal
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--brand-muted)' }}>
                    Sign in with your email and password to access your lessons and account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full h-12 text-base"
                    onClick={() => navigate("/pupil/login")}
                    style={{ 
                      backgroundColor: instructor.brand_colour || '#1e3a5f',
                      color: '#ffffff'
                    }}
                  >
                    Sign In
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-center" style={{ color: 'var(--brand-muted)' }}>
                    Use the email address registered with your instructor
                  </p>
                </CardContent>
              </Card>

              {/* Contact if issues */}
              <div className="mt-6 text-center">
                <p className="text-sm mb-2" style={{ color: 'var(--brand-muted)' }}>
                  Having trouble? Contact your instructor:
                </p>
                <div className="flex justify-center gap-3">
                  {instructor.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `tel:${instructor.phone}`}
                      style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
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
                      style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
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
          // Logged In Pupil View
          <AnimatePresence mode="wait">
            {activeSection === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {/* Push Notification Banner */}
                <PushNotificationBanner 
                  pupilId={pupil.id}
                  brandColour={instructor.brand_colour}
                />

                {/* Welcome & Next Lesson Countdown */}
                <PupilPortalLessonCountdown
                  pupilId={pupil.id} 
                  instructorId={instructor.id}
                  brandColour={instructor.brand_colour}
                  darkMode={instructor.pupil_app_dark_mode}
                />

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold" style={{ color: instructor.brand_colour || '#1e3a5f' }}>
                        {pupil.lessons_completed || 0}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                        Lessons Done
                      </div>
                    </CardContent>
                  </Card>
                  <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold" style={{ color: instructor.brand_colour || '#1e3a5f' }}>
                        {pupil.progress || 0}%
                      </div>
                      <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                        Progress
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Driving Insights Summary */}
                <PupilDashboardInsights
                  pupilId={pupil.id}
                  instructorId={instructor.id}
                  brandColour={instructor.brand_colour}
                />

                {/* Navigation Menu */}
                <div className="space-y-2">
                  {[
                    { id: 'profile' as const, icon: User, label: 'My Profile', desc: 'Photo & personal details' },
                    { id: 'schedule' as const, icon: Calendar, label: 'My Lessons', desc: 'Book, reschedule & manage lessons' },
                    { id: 'messages' as const, icon: MessageSquare, label: 'Messages', desc: 'Chat with your instructor' },
                    { id: 'notes' as const, icon: StickyNote, label: 'My Notes', desc: 'Personal notes & instructor shared' },
                    { id: 'payments' as const, icon: CreditCard, label: 'Payments', desc: 'Balance & payment history' },
                    { id: 'theory' as const, icon: BookOpen, label: 'Theory', desc: 'Practice tests & book exam' },
                    { id: 'coaching' as const, icon: Sparkles, label: 'AI Coaching', desc: 'Personalised driving insights' },
                    { id: 'progress' as const, icon: Car, label: 'My Progress', desc: 'Skills & driving report' },
                    { id: 'test-requests' as const, icon: RefreshCw, label: 'Test Swap', desc: 'Request or swap a driving test' },
                    { id: 'history' as const, icon: History, label: 'Lesson History', desc: 'Past lessons & notes' },
                  ].map((item) => (
                    <Card 
                      key={item.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}
                      onClick={() => setActiveSection(item.id)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div 
                          className="h-10 w-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${instructor.brand_colour}20` }}
                        >
                          <item.icon className="h-5 w-5" style={{ color: instructor.brand_colour || '#1e3a5f' }} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: 'var(--brand-text)' }}>{item.label}</div>
                          <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>{item.desc}</div>
                        </div>
                        <ChevronRight className="h-5 w-5" style={{ color: 'var(--brand-muted)' }} />
                      </CardContent>
                    </Card>
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
                <PupilPortalContact 
                  instructor={instructor}
                />
              </motion.div>
            )}

            {activeSection === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSection('home')}
                    className="mb-4"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    ← Back
                  </Button>
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
              <motion.div
                key="payments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSection('home')}
                    className="mb-4"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    ← Back
                  </Button>
                </div>
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
              </motion.div>
            )}

            {activeSection === 'theory' && (
              <motion.div
                key="theory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSection('home')}
                    className="mb-4"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    ← Back
                  </Button>
                </div>
                <PupilPortalTheory 
                  brandColour={instructor.brand_colour}
                  darkMode={instructor.pupil_app_dark_mode}
                />
              </motion.div>
            )}

            {activeSection === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSection('home')}
                    className="mb-4"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    ← Back
                  </Button>
                </div>
                <PupilPortalProgress 
                  pupilId={pupil.id}
                  brandColour={instructor.brand_colour}
                  darkMode={instructor.pupil_app_dark_mode}
                />
              </motion.div>
            )}

            {activeSection === 'coaching' && (
              <motion.div
                key="coaching"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSection('home')}
                    className="mb-4"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    ← Back
                  </Button>
                </div>
                <PupilAICoaching 
                  pupilId={pupil.id}
                  instructorId={instructor.id}
                  brandColour={instructor.brand_colour}
                  darkMode={instructor.pupil_app_dark_mode}
                />
              </motion.div>
            )}

            {activeSection === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-[calc(100vh-8rem)]"
              >
                <PupilChat 
                  pupilId={pupil.id}
                  instructorId={instructor.id}
                  instructorName={instructor.name}
                  onBack={() => setActiveSection('home')}
                />
              </motion.div>
            )}

            {activeSection === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSection('home')}
                    className="mb-4"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    ← Back
                  </Button>
                </div>
                <PupilPortalHistory 
                  pupilId={pupil.id}
                  brandColour={instructor.brand_colour}
                  darkMode={instructor.pupil_app_dark_mode}
                />
              </motion.div>
            )}

            {activeSection === 'gaps' && (
              <motion.div
                key="gaps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSection('home')}
                    className="mb-4"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    ← Back
                  </Button>
                </div>
                <PupilPortalGaps 
                  pupilId={pupil.id}
                  instructorId={instructor.id}
                  brandColour={instructor.brand_colour}
                  darkMode={instructor.pupil_app_dark_mode}
                />
              </motion.div>
            )}

            {activeSection === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSection('home')}
                    className="mb-4"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    ← Back
                  </Button>
                </div>
                <PupilNotes
                  pupilId={pupil.id}
                  instructorId={instructor.id}
                  brandColour={instructor.brand_colour}
                  instructorName={instructor.name}
                />
              </motion.div>
            )}

            {activeSection === 'test-requests' && (
              <motion.div
                key="test-requests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSection('home')}
                    className="mb-4"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    ← Back
                  </Button>
                </div>
                <PupilTestRequests
                  pupilId={pupil.id}
                  instructorId={instructor.id}
                  brandColour={instructor.brand_colour}
                />
              </motion.div>
            )}

            {activeSection === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4"
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveSection('home')}
                  className="mb-4"
                  style={{ color: 'var(--brand-text)' }}
                >
                  ← Back
                </Button>
                
                <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
                  <CardHeader className="text-center">
                    <CardTitle style={{ color: 'var(--brand-text)' }}>My Profile</CardTitle>
                    <CardDescription style={{ color: 'var(--brand-muted)' }}>
                      Update your profile picture
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PupilProfilePictureUpload
                      pupilId={pupil.id}
                      pupilName={pupil.name}
                      currentImageUrl={pupil.profile_image_url}
                      onImageUpdated={(newUrl) => {
                        setPupil(prev => prev ? { ...prev, profile_image_url: newUrl } : null);
                      }}
                    />
                    
                    <div className="mt-6 pt-6 border-t space-y-3" style={{ borderColor: 'var(--brand-border)' }}>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--brand-muted)' }}>Name</span>
                        <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{pupil.name}</span>
                      </div>
                      {pupil.email && (
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--brand-muted)' }}>Email</span>
                          <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{pupil.email}</span>
                        </div>
                      )}
                      {pupil.phone && (
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--brand-muted)' }}>Phone</span>
                          <span className="font-medium" style={{ color: 'var(--brand-text)' }}>{pupil.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Nav for logged in users */}
      {pupil && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-50 border-t"
          style={{ 
            backgroundColor: 'var(--brand-card)',
            borderColor: 'var(--brand-border)'
          }}
        >
          <div className="flex items-center justify-around h-16 px-2">
            {[
              { id: 'home' as const, icon: Calendar, label: 'Home' },
              { id: 'schedule' as const, icon: Clock, label: 'Lessons' },
              { id: 'payments' as const, icon: CreditCard, label: 'Payments' },
              { id: 'theory' as const, icon: BookOpen, label: 'Theory' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
                style={{ 
                  color: activeSection === item.id 
                    ? instructor.brand_colour || '#1e3a5f' 
                    : 'var(--brand-muted)'
                }}
              >
                <item.icon className={`h-5 w-5 ${activeSection === item.id ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="h-safe-area-inset-bottom" style={{ backgroundColor: 'var(--brand-card)' }} />
        </nav>
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
