import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Clock, MapPin, Car, CheckCircle, CreditCard, User, Award, 
  ShieldCheck, Star, Loader2, Calendar, ChevronDown, Zap, Play, 
  Backpack, AlertCircle, FileText, Banknote, Sparkles, UserCog
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
import { PaymentMessaging } from "@/components/payments/PaymentMessaging";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { UpsellSelector } from "@/components/booking/UpsellSelector";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookingUpsell } from "@/hooks/useBookingUpsells";
import ideal4FinanceLogo from "@/assets/logo-ideal4finance.png";

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
  // Form state
  pupilName: string;
  pupilEmail: string;
  pupilPhone: string;
  pupilAddress: string;
  pupilPostcode: string;
  setPupilName: (v: string) => void;
  setPupilEmail: (v: string) => void;
  setPupilPhone: (v: string) => void;
  setPupilAddress: (v: string) => void;
  setPupilPostcode: (v: string) => void;
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
  pupilName,
  pupilEmail,
  pupilPhone,
  pupilAddress,
  pupilPostcode,
  setPupilName,
  setPupilEmail,
  setPupilPhone,
  setPupilAddress,
  setPupilPostcode,
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
}: MobileBookingViewProps) {
  const navigate = useNavigate();
  const brandColour = instructor.brand_colour || "#1e3a5f";
  const bookingMode = instructor.booking_mode || 'pupil_choice';
  
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
  
  // For auto_assign and instructor_assigns modes, we consider scheduling "complete" differently
  const isScheduleComplete = bookingMode === 'instructor_assigns' 
    ? true // No scheduling needed - instructor will do it
    : bookingMode === 'auto_assign'
    ? isFullyScheduled // Still need to confirm auto-assigned slots
    : isFullyScheduled; // pupil_choice - normal behavior
  
  // Determine current step
  const currentStep = !isPupilDetailsComplete ? 1 : !isScheduleComplete ? 2 : 3;
  
  // Find first available date from slots
  const firstSlotDate = selectedSlots.length > 0 
    ? format(selectedSlots[0].date, "EEE, MMM d") 
    : null;

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold flex-1 truncate">{courseName}</h1>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">£{totalPrice}</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-4 bg-muted/30">
        <div className="flex items-center gap-2">
          {[
            { step: 1, label: "Details" },
            { step: 2, label: "Schedule" },
            { step: 3, label: "Pay" },
          ].map((s, i) => {
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
                {i < 2 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-emerald-500' : 'bg-muted'}`} />}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-1">
          {["Details", "Schedule", "Pay"].map((label, i) => (
            <span key={i} className="text-[10px] text-muted-foreground">{label}</span>
          ))}
        </div>
      </div>

      {/* "Book in 60 seconds" Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 p-3 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center gap-3"
      >
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="text-primary-foreground">
          <p className="font-semibold text-sm">Book in 60 seconds</p>
          <p className="text-xs opacity-80">Fast, simple, secure</p>
        </div>
      </motion.div>

      {/* Course Details - Expandable Tiles */}
      <div className="px-4 py-4">
        <Accordion type="multiple" defaultValue={["summary"]} className="space-y-2">
          {/* Summary Tile */}
          <AccordionItem value="summary" className="border rounded-xl overflow-hidden bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={courseImageUrl || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=200"}
                    alt={courseName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">{courseName}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {hours}h
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {locationName || instructor.home_postcode}
                    </span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {courseDescription && (
                <p className="text-sm text-muted-foreground mb-3">{courseDescription}</p>
              )}
              {features && features.length > 0 && (
                <div className="space-y-1.5">
                  {features.slice(0, 4).map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Instructor Tile */}
          <AccordionItem value="instructor" className="border rounded-xl overflow-hidden bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={instructor.profile_image_url || undefined} />
                  <AvatarFallback style={{ backgroundColor: brandColour, color: "white" }}>
                    {instructor.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">{instructor.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Car className="h-3 w-3" />
                    {instructor.car_type} Instructor
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-1.5 mb-3">
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
                <p className="text-xs text-muted-foreground">{instructor.bio}</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Start Dates Tile */}
          <AccordionItem value="dates" className="border rounded-xl overflow-hidden bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">Start Dates</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {firstSlotDate || "Select your lesson times below"}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="text-sm">
                {selectedSlots.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSlots.map((slot, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="font-medium">{format(slot.date, "EEE, MMM d")}</span>
                        <span className="text-muted-foreground">{slot.startTime} - {slot.endTime}</span>
                      </div>
                    ))}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="font-semibold">Total Scheduled</span>
                      <Badge variant={isFullyScheduled ? "default" : "secondary"} className={isFullyScheduled ? "bg-emerald-500" : ""}>
                        {scheduledHours}/{hours}h
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No lessons scheduled yet. Use the scheduler below to pick your times.</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Prerequisites Tile (if any) */}
          {template?.prerequisites && template.prerequisites.length > 0 && (
            <AccordionItem value="prerequisites" className="border rounded-xl overflow-hidden bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">Prerequisites</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.prerequisites.length} requirements</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-1.5">
                  {template.prerequisites.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* What to Bring Tile (if any) */}
          {template?.what_to_bring && template.what_to_bring.length > 0 && (
            <AccordionItem value="what-to-bring" className="border rounded-xl overflow-hidden bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Backpack className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">What to Bring</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.what_to_bring.length} items</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-1.5">
                  {template.what_to_bring.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-blue-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      {/* Step 1: Your Details */}
      <div className="px-4 pb-4">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isPupilDetailsComplete ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground'
            }`}>
              {isPupilDetailsComplete ? <CheckCircle className="h-3.5 w-3.5" /> : '1'}
            </div>
            Your Details
          </h2>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pupilName" className="text-xs">Full Name *</Label>
              <Input
                id="pupilName"
                value={pupilName}
                onChange={(e) => setPupilName(e.target.value)}
                placeholder="John Smith"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pupilEmail" className="text-xs">Email *</Label>
              <Input
                id="pupilEmail"
                type="email"
                value={pupilEmail}
                onChange={(e) => setPupilEmail(e.target.value)}
                placeholder="john@example.com"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pupilPhone" className="text-xs">Phone *</Label>
                <Input
                  id="pupilPhone"
                  type="tel"
                  value={pupilPhone}
                  onChange={(e) => setPupilPhone(e.target.value)}
                  placeholder="07123 456789"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pupilPostcode" className="text-xs">Postcode *</Label>
                <Input
                  id="pupilPostcode"
                  value={pupilPostcode}
                  onChange={(e) => setPupilPostcode(e.target.value)}
                  placeholder="SW1A 1AA"
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pupilAddress" className="text-xs">Pickup Address *</Label>
              <GoogleAddressAutocomplete
                value={pupilAddress}
                onChange={setPupilAddress}
                onPostcodeChange={setPupilPostcode}
                placeholder="Start typing your address..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Schedule - varies by booking mode */}
      <div className="px-4 pb-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isScheduleComplete ? 'bg-emerald-500 text-white' : isPupilDetailsComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {isScheduleComplete ? <CheckCircle className="h-3.5 w-3.5" /> : '2'}
              </div>
              {bookingMode === 'instructor_assigns' ? 'Scheduling Info' : 
               bookingMode === 'auto_assign' ? 'Your Preferences' : 'Select Lesson Slots'}
            </h2>
            {bookingMode === 'pupil_choice' && (
              <Badge variant={isFullyScheduled ? "default" : "secondary"} className={isFullyScheduled ? "bg-emerald-500" : ""}>
                {scheduledHours}/{hours}h
              </Badge>
            )}
            {bookingMode === 'auto_assign' && isFullyScheduled && (
              <Badge variant="default" className="bg-emerald-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Scheduled
              </Badge>
            )}
            {bookingMode === 'instructor_assigns' && (
              <Badge variant="secondary" className="gap-1">
                <UserCog className="h-3 w-3" />
                Instructor
              </Badge>
            )}
          </div>
          
          {/* Pupil Choice: Show calendar picker */}
          {bookingMode === 'pupil_choice' && (
            <LessonScheduler
              instructorId={instructor.id}
              totalHours={hours}
              maxLessonLength={instructor.preferred_lesson_length}
              bookingAdvanceDays={instructor.booking_advance_days || 28}
              availableFrom={instructor.available_from}
              allowedLessonLengths={instructor.allowed_lesson_lengths || undefined}
              onSlotsChange={onSlotsChange}
            />
          )}
          
          {/* Auto Assign: Show preference selector + auto-schedule preview */}
          {bookingMode === 'auto_assign' && (
            <div className="space-y-4">
              <PreferenceSelector
                onPreferencesChange={(prefs) => setAutoPreferences(prefs)}
                brandColour={brandColour}
              />
              {(autoPreferences.preferredTimes.length > 0 || autoPreferences.preferredDays.length > 0) && (
                <AutoSchedulePreview
                  instructorId={instructor.id}
                  totalHours={hours}
                  lessonLength={instructor.preferred_lesson_length}
                  courseType="weekly"
                  preferredTimes={autoPreferences.preferredTimes}
                  preferredDays={autoPreferences.preferredDays}
                  onSlotsConfirmed={onSlotsChange}
                  brandColour={brandColour}
                />
              )}
            </div>
          )}
          
          {/* Instructor Assigns: Show info message + basic preferences */}
          {bookingMode === 'instructor_assigns' && (
            <InstructorAssignsView
              instructorName={instructor.name}
              onPreferencesChange={(prefs) => setInstructorAssignsPrefs(prefs)}
              brandColour={brandColour}
            />
          )}
        </div>
      </div>

      {/* Boost Your Booking - Upsells */}
      {availableUpsells.length > 0 && onUpsellsChange && (
        <div className="px-4 pb-4">
          <div className="rounded-xl border bg-card p-4">
            <UpsellSelector
              upsells={availableUpsells}
              selectedUpsells={selectedUpsells}
              onSelectionChange={onUpsellsChange}
            />
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      <div className="px-4 pb-8">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                canSubmit ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
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
                  : `Schedule all ${hours} hours to continue`}
              </span>
            </div>
          )}

          {/* Payment Options */}
          <div className="space-y-2">
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
                disabled={!canSubmit || isNPILoading || !gatewayHealth.npi.available}
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
              disabled={!canSubmit || isClearpayLoading || !gatewayHealth.clearpay.available}
              className="w-full rounded-lg border-2 border-[#b2fce4] p-3 bg-[#b2fce4]/10 hover:bg-[#b2fce4]/20 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded bg-[#b2fce4] px-2 py-0.5 text-[10px] font-bold text-black">clearpay</span>
                  <p className="font-semibold text-sm mt-1">4 × £{((totalPrice + upsellTotal) / 4).toFixed(2)}</p>
                </div>
                <span className="text-xs text-muted-foreground">Interest-free</span>
              </div>
            </button>

            {/* Klarna */}
            <div className="w-full rounded-lg border-2 border-[#ffb3c7] p-3 bg-[#ffb3c7]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-[#ffb3c7] px-2 py-0.5 text-[10px] font-bold text-black">Klarna.</span>
                <span className="text-xs text-muted-foreground">Pay in 3</span>
              </div>
              <p className="font-semibold text-sm mb-2">3 × £{((totalPrice + upsellTotal) / 3).toFixed(2)}</p>
              <KlarnaExpressButton
                amount={totalPrice + upsellTotal}
                merchantReference={klarnaMerchantReference}
                orderDescription={`${courseName} - ${hours} Hour Course${upsellTotal > 0 ? ' + extras' : ''}`}
                disabled={!canSubmit}
                onSuccess={onKlarnaSuccess}
                onError={onKlarnaError}
                onCancel={onKlarnaCancel}
              />
            </div>

            {/* Finance Option */}
            <button
              onClick={onBookingSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full rounded-lg border-2 border-orange-400 p-3 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <img src={ideal4FinanceLogo} alt="Ideal4Finance" className="h-5 mb-1" />
                  <p className="font-semibold text-xs text-orange-900 dark:text-orange-100">
                    {isSubmitting ? "Creating..." : "Provisional Booking"}
                  </p>
                </div>
                <span className="text-xs text-orange-700 dark:text-orange-300">Finance Available</span>
              </div>
            </button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground mt-4">
            Secure checkout with SSL encryption
          </p>
        </div>
      </div>
    </div>
  );
}
