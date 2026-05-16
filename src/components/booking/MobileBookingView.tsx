import { useState, useRef, useCallback, useEffect } from "react";
import squareCardsLogo from "@/assets/square-cards-3.jpg";
import gocardlessLogo from "@/assets/gocardless-logo.png";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Clock, MapPin, Car, CheckCircle, CreditCard, User, Award, 
  ShieldCheck, Star, Loader2, Calendar, ChevronDown, Play, 
  Backpack, AlertCircle, FileText, Banknote, Sparkles, UserCog, Info, Pencil
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonScheduler } from "@/components/booking/LessonScheduler";
import { PreferenceSelector } from "@/components/booking/PreferenceSelector";
import { AutoSchedulePreview } from "@/components/booking/AutoSchedulePreview";
import { InstructorAssignsView } from "@/components/booking/InstructorAssignsView";

import { SquareWalletButtons } from "@/components/payments/SquareWalletButtons";
import { BookingBottomBar } from "@/components/booking/BookingBottomBar";
import { PaymentMessaging } from "@/components/payments/PaymentMessaging";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { PostcodeAddressLookup } from "@/components/booking/PostcodeAddressLookup";
import { UpsellSelector } from "@/components/booking/UpsellSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { SquarePaymentForm } from "@/components/payments/SquarePaymentForm";
import { BookingFormField } from "@/components/booking/BookingFormField";
import { BookingRecoveryBanner } from "@/components/booking/BookingRecoveryBanner";
import { validateField, type FieldErrors } from "@/lib/booking-validation";
import klarnaLogo from "@/assets/klarna-logo.svg";
import klarnaRoundLogo from "@/assets/klarna-round-logo.png";
import clearpayLogo from "@/assets/clearpay-logo.svg";
import clearpayRoundLogo from "@/assets/clearpay-round-logo.png";

import { BookingUpsell } from "@/hooks/useBookingUpsells";
import { OrderReviewSummary } from "@/components/booking/OrderReviewSummary";



interface Instructor {
  id: string;
  name: string;
  profile_image_url: string | null;
  car_type: string;
  car_make: string | null;
  car_model: string | null;
  home_postcode: string;
  hourly_rate: number | null;
  bio: string | null;
  special_skills: string | null;
  brand_colour: string | null;
  preferred_lesson_length: number;
  booking_advance_days: number | null;
  available_from: string | null;
  allowed_lesson_lengths: number[] | null;
  cpd_certified: boolean | null;
  adi_code_of_practice: boolean | null;
  instructor_grade: string | null;
  welcome_video_url: string | null;
  booking_mode?: string | null;
  buffer_minutes: number;
}

interface CourseTemplate {
  course_hours: number;
  course_name: string;
  short_description: string | null;
  full_description: string | null;
  features: string[] | null;
  what_to_bring: string[] | null;
  prerequisites: string[] | null;
  theory_test_details: string | null;
  driving_test_details: string | null;
  payment_terms: string | null;
  terms_conditions: string | null;
  explainer_video_url: string | null;
}

interface SelectedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
}

interface MobileBookingViewProps {
  instructor: Instructor;
  courseName: string;
  totalPrice: number;
  hours: number;
  courseImageUrl: string | null;
  courseDescription: string | null;
  features: string[] | null;
  template: CourseTemplate | null;
  locationName: string;
  selectedDate?: Date | null;
  // Form state
  pupilName: string;
  pupilEmail: string;
  pupilPhone: string;
  pupilAddress: string;
  pupilPostcode: string;
  differentPickup: boolean;
  pickupAddress: string;
  pickupPostcode: string;
  pickupWhat3words: string;
  setPupilName: (v: string) => void;
  setPupilEmail: (v: string) => void;
  setPupilPhone: (v: string) => void;
  setPupilAddress: (v: string) => void;
  setPupilPostcode: (v: string) => void;
  setDifferentPickup: (v: boolean) => void;
  setPickupAddress: (v: string) => void;
  setPickupPostcode: (v: string) => void;
  setPickupWhat3words: (v: string) => void;
  hasSpecialNeeds: boolean;
  specialNeeds: string;
  setHasSpecialNeeds: (v: boolean) => void;
  setSpecialNeeds: (v: string) => void;
  // Scheduling
  selectedSlots: SelectedSlot[];
  scheduledHours: number;
  onSlotsChange: (slots: SelectedSlot[]) => void;
  // Payment
  depositEnabled: boolean;
  depositAmount: number;
  paymentOption: 'full' | 'deposit';
  setPaymentOption: (v: 'full' | 'deposit') => void;
  // Upsells
  availableUpsells?: BookingUpsell[];
  selectedUpsells?: string[];
  onUpsellsChange?: (ids: string[]) => void;
  upsellTotal?: number;
  // Actions
  canSubmit: boolean;
  isPupilDetailsComplete: boolean;
  isFullyScheduled: boolean;
  isSubmitting: boolean;
  isNPILoading: boolean;
  isClearpayLoading: boolean;
  klarnaMerchantReference: string;
  gatewayHealth: { npi: { available: boolean }; clearpay: { available: boolean }; elavon: { available: boolean }; square: { available: boolean }; gocardless: { available: boolean } };
  onBookingSubmit: () => void;
  onNPICheckout: () => void;
  onClearpayCheckout: () => void;
  onKlarnaCheckout: () => void;
  isKlarnaLoading: boolean;
  onCashPayment?: () => void;
  isCashProcessing?: boolean;
  cashPaymentsEnabled?: boolean;
  onInstantBankPay?: () => void;
  isInstantBankPayLoading?: boolean;
  instantBankPayEnabled?: boolean;
  klarnaEnabled?: boolean;
  clearpayEnabled?: boolean;
  onWalletSuccess: (pupilId: string) => void;
  // Embedded checkout
  showEmbeddedCheckout?: boolean;
  embeddedCheckoutPupilId?: string | null;
  onEmbeddedCheckoutSuccess?: () => void;
  onEmbeddedCheckoutCancel?: () => void;
  /** Called before wallet payment to ensure booking exists */
  ensureBookingCreated?: () => Promise<string | null>;
}

export function MobileBookingView({
  instructor,
  courseName,
  totalPrice,
  hours,
  courseImageUrl,
  courseDescription,
  features,
  template,
  locationName,
  selectedDate,
  pupilName,
  pupilEmail,
  pupilPhone,
  pupilAddress,
  pupilPostcode,
  differentPickup,
  pickupAddress,
  pickupPostcode,
  pickupWhat3words,
  setPupilName,
  setPupilEmail,
  setPupilPhone,
  setPupilAddress,
  setPupilPostcode,
  setDifferentPickup,
  setPickupAddress,
  setPickupPostcode,
  setPickupWhat3words,
  hasSpecialNeeds,
  specialNeeds,
  setHasSpecialNeeds,
  setSpecialNeeds,
  selectedSlots,
  scheduledHours,
  onSlotsChange,
  depositEnabled,
  depositAmount,
  paymentOption,
  setPaymentOption,
  availableUpsells = [],
  selectedUpsells = [],
  onUpsellsChange,
  upsellTotal = 0,
  canSubmit,
  isPupilDetailsComplete,
  isFullyScheduled,
  isSubmitting,
  isNPILoading,
  isClearpayLoading,
  klarnaMerchantReference,
  gatewayHealth,
  onBookingSubmit,
  onNPICheckout,
  onClearpayCheckout,
  onKlarnaCheckout,
  isKlarnaLoading,
  onCashPayment,
  isCashProcessing = false,
  cashPaymentsEnabled = false,
  onInstantBankPay,
  isInstantBankPayLoading = false,
  instantBankPayEnabled = false,
  klarnaEnabled = false,
  clearpayEnabled = false,
  onWalletSuccess,
  showEmbeddedCheckout,
  embeddedCheckoutPupilId,
  onEmbeddedCheckoutSuccess,
  onEmbeddedCheckoutCancel,
  ensureBookingCreated,
}: MobileBookingViewProps) {
  const navigate = useNavigate();
  const brandColour = instructor.brand_colour || "#1e3a5f";
  const bookingMode = instructor.booking_mode || 'pupil_choice';
  const paymentRef = useRef<HTMLDivElement>(null);
  
  // Wallet processing state
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Admin fee removed from course bookings — only applies to single lesson payments
  
  // Booking recovery: save form state to localStorage
  const storageKey = `booking_draft_${instructor.id}`;
  
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.pupilName || parsed.pupilEmail || parsed.pupilPhone) {
          setShowRecovery(true);
        }
      } catch {}
    }
  }, []);
  
  // Auto-save form fields to localStorage on change
  useEffect(() => {
    if (!pupilName && !pupilEmail && !pupilPhone) return;
    const draft = { pupilName, pupilEmail, pupilPhone, pupilAddress, pupilPostcode };
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [pupilName, pupilEmail, pupilPhone, pupilAddress, pupilPostcode]);

  // Abandoned booking capture: save to server when email is entered
  useEffect(() => {
    if (!pupilEmail || draftSaved) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(pupilEmail)) return;

    const timer = setTimeout(async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("booking_drafts").insert({
          email: pupilEmail,
          phone: pupilPhone || null,
          name: pupilName || null,
          instructor_id: instructor.id,
          course_name: courseName,
          course_hours: hours,
          total_price: totalPrice,
        });
        setDraftSaved(true);
      } catch {}
    }, 2000);
    return () => clearTimeout(timer);
  }, [pupilEmail, draftSaved]);
  
  const handleResumeDraft = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.pupilName) setPupilName(parsed.pupilName);
        if (parsed.pupilEmail) setPupilEmail(parsed.pupilEmail);
        if (parsed.pupilPhone) setPupilPhone(parsed.pupilPhone);
        if (parsed.pupilAddress) setPupilAddress(parsed.pupilAddress);
        if (parsed.pupilPostcode) setPupilPostcode(parsed.pupilPostcode);
      } catch {}
    }
    setShowRecovery(false);
  };
  
  const handleDiscardDraft = () => {
    localStorage.removeItem(storageKey);
    setShowRecovery(false);
  };
  
  // Form validation errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
  const handleFieldBlur = useCallback((field: 'name' | 'email' | 'phone' | 'postcode' | 'address', value: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  }, []);
  
  // Course info sheet state
  const [showCourseInfo, setShowCourseInfo] = useState(false);
  
  // Step editing state - controls whether details section is expanded or collapsed
  // Starts expanded (false = not confirmed yet), user must click "Continue" to collapse
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  
  // Auto-assign preferences state
  const [autoPreferences, setAutoPreferences] = useState<{
    preferredTimes: string[];
    preferredDays: string[];
    notes?: string;
  }>({ preferredTimes: [], preferredDays: [] });
  
  // Instructor assigns preferences state
  const [instructorAssignsPrefs, setInstructorAssignsPrefs] = useState<{
    preferredTimes: string[];
    notes: string;
  }>({ preferredTimes: [], notes: '' });
  
  // For auto_assign and instructor_assigns modes, skip the scheduling step entirely
  const requiresSlotSelection = bookingMode === 'pupil_choice';
  const isScheduleComplete = requiresSlotSelection ? isFullyScheduled : true;
  
  // Determine current step - only 2 steps for non-pupil_choice modes
  const currentStep = !isPupilDetailsComplete ? 1 : (requiresSlotSelection && !isScheduleComplete) ? 2 : (requiresSlotSelection ? 3 : 2);
  
  // Should details be collapsed? Only when user has explicitly confirmed
  const detailsCollapsed = detailsConfirmed && isPupilDetailsComplete && !editingDetails;

  const hasCourseInfo = !!(
    courseDescription ||
    (features && features.length > 0) ||
    (template?.prerequisites && template.prerequisites.length > 0) ||
    (template?.what_to_bring && template.what_to_bring.length > 0)
  );

  const scrollToPayment = () => {
    if (canSubmit) {
      onNPICheckout();
    }
    paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Navy Blue with merged summary + instructor */}
      <div className="sticky top-0 z-50 bg-[#142040]">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold flex-1 truncate text-white">{courseName}</h1>
          <div className="text-right">
            <span className="text-lg font-bold text-emerald-400">£{totalPrice}</span>
          </div>
        </div>

        {/* Compact course + instructor summary */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
            <img
              src={courseImageUrl || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=200"}
              alt={courseName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {hours}h
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                {locationName || instructor.home_postcode}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Avatar className="h-8 w-8 border border-white/20">
              <AvatarImage src={instructor.profile_image_url || undefined} />
              <AvatarFallback style={{ backgroundColor: brandColour, color: "white" }} className="text-xs">
                {instructor.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-white/80 max-w-[80px] truncate">{instructor.name}</span>
          </div>
        </div>
      </div>

      {/* Booking Recovery Banner */}
      {showRecovery && (
        <BookingRecoveryBanner onResume={handleResumeDraft} onDiscard={handleDiscardDraft} />
      )}

      {/* Progress Steps */}
      <div className="px-4 py-4 bg-muted/30">
        <div className="flex items-center gap-2">
          {(requiresSlotSelection 
            ? [
                { step: 1, label: "Details" },
                { step: 2, label: "Schedule" },
                { step: 3, label: "Pay" },
              ]
            : [
                { step: 1, label: "Details" },
                { step: 2, label: "Pay" },
              ]
          ).map((s, i, arr) => {
            const isDone = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div key={i} className="flex-1 flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone ? 'bg-emerald-500 text-white' :
                    isCurrent ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? <CheckCircle className="h-4 w-4" /> : s.step}
                </motion.div>
                {i < arr.length - 1 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-emerald-500' : 'bg-muted'}`} />}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-1">
          {(requiresSlotSelection 
            ? ["Details", "Schedule", "Pay"]
            : ["Details", "Pay"]
          ).map((label, i) => (
            <span key={i} className="text-[10px] text-muted-foreground">{label}</span>
          ))}
        </div>
      </div>

      {/* Selected Date Banner */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <Calendar className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-emerald-700">You have selected</p>
            <p className="text-sm text-emerald-600">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
          </div>
        </motion.div>
      )}

      {/* Course Info Expandable Card */}
      {hasCourseInfo && (
        <div className="px-4 mt-4">
          <div className="rounded-xl border bg-card overflow-hidden">
            <button
              onClick={() => setShowCourseInfo(!showCourseInfo)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors active:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Course Details</p>
                  <p className="text-[11px] text-muted-foreground">Prerequisites, what to bring & more</p>
                </div>
              </div>
              <motion.div animate={{ rotate: showCourseInfo ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showCourseInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4 border-t pt-3">
                    {courseDescription && (
                      <div>
                        <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-1">About</h3>
                        <p className="text-sm text-muted-foreground">{courseDescription}</p>
                      </div>
                    )}

                    {features && features.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-1.5">What's included</h3>
                        <div className="space-y-1.5">
                          {features.map((f, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {template?.prerequisites && template.prerequisites.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                          Prerequisites
                        </h3>
                        <div className="space-y-1.5">
                          {template.prerequisites.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                              <span className="text-muted-foreground">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {template?.what_to_bring && template.what_to_bring.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Backpack className="h-3.5 w-3.5 text-blue-500" />
                          What to Bring
                        </h3>
                        <div className="space-y-1.5">
                          {template.what_to_bring.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Instructor info */}
                    <div>
                      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Your Instructor</h3>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={instructor.profile_image_url || undefined} />
                          <AvatarFallback style={{ backgroundColor: brandColour, color: "white" }}>
                            {instructor.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{instructor.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Car className="h-3 w-3" />
                            {instructor.car_type} Instructor
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {instructor.instructor_grade && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Award className="h-2.5 w-2.5" />
                            Grade {instructor.instructor_grade}
                          </Badge>
                        )}
                        {instructor.cpd_certified && (
                          <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-100 text-emerald-700">
                            <CheckCircle className="h-2.5 w-2.5" />
                            CPD
                          </Badge>
                        )}
                        {instructor.adi_code_of_practice && (
                          <Badge variant="secondary" className="text-[10px] gap-1 bg-blue-100 text-blue-700">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            ADI
                          </Badge>
                        )}
                      </div>
                      {instructor.bio && (
                        <p className="text-xs text-muted-foreground mt-2">{instructor.bio}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Step 1: Your Details — auto-collapses when complete */}
      <div className="px-4 pt-4 pb-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isPupilDetailsComplete ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground'
              }`}>
                {isPupilDetailsComplete ? <CheckCircle className="h-3.5 w-3.5" /> : '1'}
              </div>
              Your Details
            </h2>
            {detailsCollapsed && (
              <button onClick={() => setEditingDetails(true)} className="text-xs text-primary font-medium flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {detailsCollapsed ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 text-xs text-muted-foreground truncate"
              >
                {pupilName} · {pupilEmail}
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="space-y-3">
                  <BookingFormField
                    id="pupilName"
                    label="Full Name"
                    value={pupilName}
                    onChange={setPupilName}
                    onBlur={() => handleFieldBlur('name', pupilName)}
                    error={touchedFields.has('name') ? fieldErrors.name : null}
                    placeholder="John Smith"
                  />
                  <BookingFormField
                    id="pupilEmail"
                    label="Email"
                    type="email"
                    value={pupilEmail}
                    onChange={setPupilEmail}
                    onBlur={() => handleFieldBlur('email', pupilEmail)}
                    error={touchedFields.has('email') ? fieldErrors.email : null}
                    placeholder="john@example.com"
                  />
                  <BookingFormField
                    id="pupilPhone"
                    label="Phone"
                    type="tel"
                    value={pupilPhone}
                    onChange={setPupilPhone}
                    onBlur={() => handleFieldBlur('phone', pupilPhone)}
                    error={touchedFields.has('phone') ? fieldErrors.phone : null}
                    placeholder="07123 456789"
                  />
                  <PostcodeAddressLookup
                    postcode={pupilPostcode}
                    address={pupilAddress}
                    onPostcodeChange={setPupilPostcode}
                    onAddressChange={(v) => { setPupilAddress(v); handleFieldBlur('address', v); }}
                    onBlurPostcode={() => handleFieldBlur('postcode', pupilPostcode)}
                    onBlurAddress={() => handleFieldBlur('address', pupilAddress)}
                    postcodeError={touchedFields.has('postcode') ? fieldErrors.postcode : null}
                    addressError={touchedFields.has('address') ? fieldErrors.address : null}
                  />
                  
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={differentPickup}
                        onCheckedChange={(checked) => setDifferentPickup(checked === true)}
                      />
                      <span className="text-xs text-muted-foreground">My pickup location is different</span>
                    </label>
                  </div>
                  
                  {differentPickup && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="pickupAddress" className="text-xs">Pickup Address *</Label>
                        <GoogleAddressAutocomplete
                          value={pickupAddress}
                          onChange={setPickupAddress}
                          onPostcodeChange={setPickupPostcode}
                          placeholder="Start typing your pickup address..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pickupWhat3words" className="text-xs flex items-center gap-1">
                          what3words
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Input
                          id="pickupWhat3words"
                          value={pickupWhat3words}
                          onChange={(e) => setPickupWhat3words(e.target.value)}
                          placeholder="///word.word.word"
                          className="h-10"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Special Needs */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={hasSpecialNeeds}
                        onCheckedChange={(checked) => setHasSpecialNeeds(checked === true)}
                      />
                      <span className="text-xs text-muted-foreground">Any special needs?</span>
                    </label>
                  </div>
                  
                  {hasSpecialNeeds && (
                    <div className="space-y-1.5">
                      <Label htmlFor="specialNeeds" className="text-xs">Please describe your requirements</Label>
                      <Input
                        id="specialNeeds"
                        value={specialNeeds}
                        onChange={(e) => setSpecialNeeds(e.target.value)}
                        placeholder="e.g. hearing impairment, mobility needs..."
                        className="h-10"
                      />
                    </div>
                  )}
                  {isPupilDetailsComplete && (
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => { setDetailsConfirmed(true); setEditingDetails(false); }}>
                      Continue
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Banner - Show when instructor will assign slots */}
      {!requiresSlotSelection && (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <UserCog className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-0.5">
                  {bookingMode === 'auto_assign' ? 'Lessons scheduled automatically' : 'Instructor will schedule lessons'}
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {bookingMode === 'auto_assign' 
                    ? 'After payment, we\'ll find the best times for your lessons. You\'ll receive your schedule shortly.'
                    : 'After payment, your instructor will contact you to arrange lesson times that work for you.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Schedule - Only show for pupil_choice mode */}
      {requiresSlotSelection && (
        <div className="px-4 pb-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isScheduleComplete ? 'bg-emerald-500 text-white' : isPupilDetailsComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {isScheduleComplete ? <CheckCircle className="h-3.5 w-3.5" /> : '2'}
                </div>
                Select Lesson Slots
              </h2>
              <Badge variant={isFullyScheduled ? "default" : "secondary"} className={isFullyScheduled ? "bg-emerald-500" : ""}>
                {scheduledHours}/{hours}h
              </Badge>
            </div>
            
            <LessonScheduler
              instructorId={instructor.id}
              totalHours={hours}
              maxLessonLength={instructor.preferred_lesson_length}
              bookingAdvanceDays={instructor.booking_advance_days}
              availableFrom={instructor.available_from}
              allowedLessonLengths={instructor.allowed_lesson_lengths || undefined}
              bufferMinutes={instructor.buffer_minutes}
              instructorHomePostcode={instructor.home_postcode}
              pupilPostcode={differentPickup ? pickupPostcode : pupilPostcode}
              initialDate={selectedDate ?? undefined}
              onSlotsChange={onSlotsChange}
            />
          </div>
        </div>
      )}

      {/* Upsells — between schedule and payment */}
      {availableUpsells.length > 0 && onUpsellsChange && isPupilDetailsComplete && (
        <div className="px-4 pb-4">
          <UpsellSelector
            upsells={availableUpsells}
            selectedUpsells={selectedUpsells}
            onSelectionChange={onUpsellsChange}
          />
        </div>
      )}

      {/* Order Review Summary — before payment */}
      {canSubmit && (
        <div className="px-4 pb-4">
          <OrderReviewSummary
            courseName={courseName}
            courseHours={hours}
            coursePrice={totalPrice}
            selectedSlots={selectedSlots}
            selectedUpsells={availableUpsells
              .filter((u) => selectedUpsells.includes(u.id))
              .map((u) => ({ id: u.id, name: u.name, price: Number(u.price) }))}
            upsellTotal={upsellTotal}
            depositEnabled={depositEnabled}
            depositAmount={depositAmount}
            paymentOption={paymentOption}
            adminFee={0}
            hasFee={false}
          />
        </div>
      )}

      {/* Step 3: Payment */}
      <div className="px-4 pb-8" ref={paymentRef}>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                canSubmit ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {requiresSlotSelection ? '3' : '2'}
              </div>
              Payment
            </h2>
            <div className="text-right">
              <span className="text-xl font-bold">£{totalPrice + upsellTotal}</span>
              {upsellTotal > 0 && (
                <div className="text-xs text-muted-foreground">incl. £{upsellTotal.toFixed(2)} extras</div>
              )}
            </div>
          </div>

          {!canSubmit && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mb-4 text-center">
              <span className="text-amber-700 dark:text-amber-300 text-xs font-medium">
                {!isPupilDetailsComplete 
                  ? "Complete your details above"
                  : requiresSlotSelection 
                    ? `Schedule all ${hours} hours to continue`
                    : "Complete your details above"}
              </span>
            </div>
          )}

          {/* Payment Options */}
          <div className="space-y-2">
            {/* Express Checkout - Apple/Google Pay */}
            {canSubmit && (
              <SquareWalletButtons
                amount={totalPrice + upsellTotal}
                instructorId={instructor.id}
                customerName={pupilName}
                customerEmail={pupilEmail}
                onPaid={() => onWalletSuccess(embeddedCheckoutPupilId || "")}
                onProcessing={setIsWalletProcessing}
                disabled={isWalletProcessing || isSubmitting || isNPILoading || isClearpayLoading}
                ensureBookingCreated={ensureBookingCreated}
              />
            )}

            {/* NPI Card Payment - Recommended */}
            <div className="rounded-lg border-2 border-primary p-3 bg-primary/5 relative">
              <div className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
                Recommended
              </div>
              
              {/* Deposit Toggle */}
              {depositEnabled && (
                <div className="mb-3 p-2 rounded-lg bg-background/60 border space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaymentOption('full')}
                      className={`flex-1 p-2 rounded-lg border text-center text-xs transition-all ${
                        paymentOption === 'full' 
                          ? 'border-primary bg-primary/10 font-semibold' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">Full</div>
                      <div className="text-sm font-bold">£{totalPrice}</div>
                    </button>
                    <button
                      onClick={() => setPaymentOption('deposit')}
                      className={`flex-1 p-2 rounded-lg border text-center text-xs transition-all ${
                        paymentOption === 'deposit' 
                          ? 'border-primary bg-primary/10 font-semibold' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">Deposit</div>
                      <div className="text-sm font-bold">£{depositAmount}</div>
                    </button>
                  </div>
                </div>
              )}

              {canSubmit && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white">💳 Pay by Card</span>
                    <img src={squareCardsLogo} alt="Visa, Mastercard, Amex" className="h-5 object-contain" />
                  </div>
                  <SquarePaymentForm
                    amount={paymentOption === 'deposit' && depositEnabled ? depositAmount : totalPrice + upsellTotal}
                    pupilId={embeddedCheckoutPupilId || undefined}
                    instructorId={instructor.id}
                    customerName={pupilName.trim()}
                    customerEmail={pupilEmail.trim()}
                    onPaid={onEmbeddedCheckoutSuccess}
                    onCancel={onEmbeddedCheckoutCancel}
                  />
                </div>
              )}
            </div>

            {/* Clearpay */}
            {clearpayEnabled && (
            <button
              onClick={onClearpayCheckout}
              disabled={!canSubmit || isClearpayLoading || !gatewayHealth.clearpay.available || isWalletProcessing}
              className="w-full rounded-lg border-2 border-[#b2fce4] p-3 bg-gradient-to-br from-[#b2fce4]/10 to-[#b2fce4]/20 hover:from-[#b2fce4]/20 hover:to-[#b2fce4]/30 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-2">
                <img src={clearpayRoundLogo} alt="Clearpay" className="h-4 object-contain" />
                <span className="text-xs text-muted-foreground">Interest-free</span>
              </div>
              <p className="font-semibold text-sm">4 × £{((totalPrice + upsellTotal) / 4).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Pay in 4 instalments</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">(Only available for payments up to £1200)</p>
            </button>
            )}

            {/* Klarna - Server-side redirect */}
            {klarnaEnabled && (
            <button
              onClick={onKlarnaCheckout}
              disabled={!canSubmit || isWalletProcessing || isKlarnaLoading}
              className="w-full rounded-lg border-2 border-[#ffb3c7] p-3 bg-gradient-to-br from-[#ffb3c7]/10 to-[#ffb3c7]/20 hover:from-[#ffb3c7]/20 hover:to-[#ffb3c7]/30 transition-colors text-left disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="flex items-center justify-between mb-2">
                <img src={klarnaRoundLogo} alt="Klarna" className="h-6 object-contain" />
                <span className="text-xs text-muted-foreground">Pay in 3</span>
              </div>
              <p className="font-semibold text-sm">
                {isKlarnaLoading ? "Loading..." : `3 × £${((totalPrice + upsellTotal) / 3).toFixed(2)}`}
              </p>
            </button>
            )}

            {/* Instant Bank Pay (GoCardless) */}
            {instantBankPayEnabled && onInstantBankPay && (
              <button
                onClick={onInstantBankPay}
                disabled={!canSubmit || isInstantBankPayLoading}
                className="w-full rounded-lg border-2 border-blue-300 dark:border-blue-700 p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-950/50 dark:hover:to-blue-900/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">🏦 Pay by Bank</span>
                  <img src={gocardlessLogo} alt="GoCardless" className="h-4 object-contain" />
                </div>
                <p className="font-semibold text-sm">{isInstantBankPayLoading ? "Connecting..." : `£${totalPrice + upsellTotal}`}</p>
                <p className="text-xs text-muted-foreground mt-1">Instant confirmation · Pay directly from your bank</p>
              </button>
            )}

            {/* Cash Payment */}
            {cashPaymentsEnabled && onCashPayment && (
              <button
                onClick={onCashPayment}
                disabled={!canSubmit || isCashProcessing}
                className="w-full rounded-lg border-2 border-emerald-300 dark:border-emerald-700 p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-950/50 dark:hover:to-emerald-900/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">💵 Cash</span>
                  <span className="text-xs text-muted-foreground">Pay your instructor</span>
                </div>
                <p className="font-semibold text-sm">{isCashProcessing ? "Processing..." : `£${totalPrice + upsellTotal}`}</p>
                <p className="text-xs text-muted-foreground mt-1">Pay cash on your first lesson to your instructor</p>
              </button>
            )}

            {/* Finance Option */}
          </div>


          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span className="text-[10px]">Secure checkout</span>
            </div>
            <img src={squareCardsLogo} alt="Square, Visa, Mastercard, Amex" className="h-5 object-contain" />
          </div>
        </div>
      </div>


      {/* Sticky Bottom Bar */}
      <BookingBottomBar
        totalPrice={totalPrice}
        upsellTotal={upsellTotal}
        canSubmit={canSubmit}
        onPayClick={scrollToPayment}
        isPupilDetailsComplete={isPupilDetailsComplete}
        isFullyScheduled={isFullyScheduled}
        requiresSlotSelection={requiresSlotSelection}
      />
    </div>
  );
}
