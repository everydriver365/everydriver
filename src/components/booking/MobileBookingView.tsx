import { useState, useRef, useCallback, useEffect } from "react";
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
import { KlarnaExpressButton } from "@/components/booking/KlarnaExpressButton";
import { BookingWalletButtons } from "@/components/booking/BookingWalletButtons";
import { BookingBottomBar } from "@/components/booking/BookingBottomBar";
import { PaymentMessaging } from "@/components/payments/PaymentMessaging";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { UpsellSelector } from "@/components/booking/UpsellSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { CardstreamPayButton } from "@/components/payments/CardstreamPayButton";
import { BookingFormField } from "@/components/booking/BookingFormField";
import { validateField, type FieldErrors } from "@/lib/booking-validation";

import { BookingUpsell } from "@/hooks/useBookingUpsells";


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
  gatewayHealth: { npi: { available: boolean }; clearpay: { available: boolean } };
  onBookingSubmit: () => void;
  onNPICheckout: () => void;
  onClearpayCheckout: () => void;
  onKlarnaSuccess: (authToken: string, orderId: string) => Promise<void>;
  onKlarnaError: (error: string) => void;
  onKlarnaCancel: () => void;
  onWalletSuccess: (pupilId: string) => void;
  // Embedded checkout
  showEmbeddedCheckout?: boolean;
  embeddedCheckoutPupilId?: string | null;
  onEmbeddedCheckoutSuccess?: () => void;
  onEmbeddedCheckoutCancel?: () => void;
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
  onKlarnaSuccess,
  onKlarnaError,
  onKlarnaCancel,
  onWalletSuccess,
  showEmbeddedCheckout,
  embeddedCheckoutPupilId,
  onEmbeddedCheckoutSuccess,
  onEmbeddedCheckoutCancel,
}: MobileBookingViewProps) {
  const navigate = useNavigate();
  const brandColour = instructor.brand_colour || "#1e3a5f";
  const bookingMode = instructor.booking_mode || 'pupil_choice';
  const paymentRef = useRef<HTMLDivElement>(null);
  
  // Wallet processing state
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  
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
  
  // Step editing state - allows re-expanding collapsed steps
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
  
  // Should details be collapsed?
  const detailsCollapsed = isPupilDetailsComplete && !editingDetails;

  const hasCourseInfo = !!(
    courseDescription ||
    (features && features.length > 0) ||
    (template?.prerequisites && template.prerequisites.length > 0) ||
    (template?.what_to_bring && template.what_to_bring.length > 0)
  );

  const scrollToPayment = () => {
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
                  <div className="grid grid-cols-2 gap-3">
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
                    <BookingFormField
                      id="pupilPostcode"
                      label="Postcode"
                      value={pupilPostcode}
                      onChange={setPupilPostcode}
                      onBlur={() => handleFieldBlur('postcode', pupilPostcode)}
                      error={touchedFields.has('postcode') ? fieldErrors.postcode : null}
                      placeholder="SW1A 1AA"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pupilAddress" className="text-xs">Home Address *</Label>
                    <GoogleAddressAutocomplete
                      value={pupilAddress}
                      onChange={(v) => { setPupilAddress(v); handleFieldBlur('address', v); }}
                      onPostcodeChange={setPupilPostcode}
                      placeholder="Start typing your home address..."
                    />
                    {touchedFields.has('address') && fieldErrors.address && (
                      <p className="text-[11px] text-destructive font-medium">{fieldErrors.address}</p>
                    )}
                  </div>
                  
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
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => setEditingDetails(false)}>
                      Done
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
              bookingAdvanceDays={instructor.booking_advance_days || 28}
              availableFrom={instructor.available_from}
              allowedLessonLengths={instructor.allowed_lesson_lengths || undefined}
              onSlotsChange={onSlotsChange}
            />
          </div>
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
              <BookingWalletButtons
                amount={totalPrice + upsellTotal}
                instructorId={instructor.id}
                pupilName={pupilName}
                pupilEmail={pupilEmail}
                pupilPhone={pupilPhone}
                pupilAddress={pupilAddress}
                pupilPostcode={pupilPostcode}
                courseType={courseName}
                courseHours={hours}
                totalPrice={totalPrice}
                slots={selectedSlots}
                upsells={availableUpsells
                  .filter((u) => selectedUpsells.includes(u.id))
                  .map((u) => ({ id: u.id, price: Number(u.price) }))}
                onSuccess={onWalletSuccess}
                onProcessing={setIsWalletProcessing}
                disabled={isWalletProcessing || isSubmitting || isNPILoading || isClearpayLoading}
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

              <Button
                onClick={onNPICheckout}
                disabled={!canSubmit || isNPILoading || !gatewayHealth.npi.available || isWalletProcessing}
                className="w-full h-12"
              >
                {isNPILoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay £{paymentOption === 'deposit' && depositEnabled ? depositAmount : totalPrice} Card
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Visa, Mastercard, Amex</p>
            </div>

            {/* Clearpay */}
            <button
              onClick={onClearpayCheckout}
              disabled={!canSubmit || isClearpayLoading || !gatewayHealth.clearpay.available || isWalletProcessing}
              className="w-full rounded-lg border-2 border-[#b2fce4] p-3 bg-gradient-to-br from-[#b2fce4]/10 to-[#b2fce4]/20 hover:from-[#b2fce4]/20 hover:to-[#b2fce4]/30 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-[#b2fce4] px-2 py-0.5 text-[10px] font-bold text-black">clearpay</span>
                <span className="text-xs text-muted-foreground">Interest-free</span>
              </div>
              <p className="font-semibold text-sm">4 × £{((totalPrice + upsellTotal) / 4).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Pay in 4 instalments</p>
            </button>

            {/* Klarna */}
            <div className="w-full rounded-lg border-2 border-[#ffb3c7] p-3 bg-gradient-to-br from-[#ffb3c7]/10 to-[#ffb3c7]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-[#ffb3c7] px-2 py-0.5 text-[10px] font-bold text-black">Klarna.</span>
                <span className="text-xs text-muted-foreground">Pay in 3</span>
              </div>
              <p className="font-semibold text-sm mb-2">3 × £{((totalPrice + upsellTotal) / 3).toFixed(2)}</p>
              <KlarnaExpressButton
                amount={totalPrice + upsellTotal}
                merchantReference={klarnaMerchantReference}
                orderDescription={`${courseName} - ${hours} Hour Course${upsellTotal > 0 ? ' + extras' : ''}`}
                disabled={!canSubmit || isWalletProcessing}
                onSuccess={onKlarnaSuccess}
                onError={onKlarnaError}
                onCancel={onKlarnaCancel}
              />
            </div>

            {/* Finance Option */}
          </div>

          {/* Embedded Card Checkout */}
          {showEmbeddedCheckout && embeddedCheckoutPupilId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl border-2 border-primary bg-card"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Enter Card Details
                </h3>
                <button 
                  onClick={onEmbeddedCheckoutCancel}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
              <CardstreamPayButton
                amount={paymentOption === 'deposit' && depositEnabled ? depositAmount : totalPrice + upsellTotal}
                pupilId={embeddedCheckoutPupilId}
                instructorId={instructor.id}
                customerName={pupilName.trim()}
                customerEmail={pupilEmail.trim()}
                onError={(msg) => { /* handled by component */ }}
              />
            </motion.div>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span className="text-[10px]">Secure checkout</span>
            </div>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-[10px] text-muted-foreground">256-bit SSL</span>
            <span className="text-muted-foreground/30">|</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">VISA</span>
              <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">MC</span>
              <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">AMEX</span>
            </div>
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
