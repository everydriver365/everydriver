import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Car, CheckCircle, CreditCard, User, Award, ShieldCheck, Star, Loader2, Calendar, Play, Backpack, AlertCircle, FileText, Banknote, Sparkles, UserCog } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO, startOfDay, addDays, getDay, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonScheduler } from "@/components/booking/LessonScheduler";

import { SquarePaymentForm } from "@/components/payments/SquarePaymentForm";
import { PaymentMessaging } from "@/components/payments/PaymentMessaging";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { PostcodeAddressLookup } from "@/components/booking/PostcodeAddressLookup";
import { MobileBookingView } from "@/components/booking/MobileBookingView";
import { EnquiryFlow } from "@/components/booking/EnquiryFlow";
import { UpsellSelector } from "@/components/booking/UpsellSelector";
import { SquareWalletButtons } from "@/components/payments/SquareWalletButtons";
import { KlarnaPaymentModal } from "@/components/payments/KlarnaPaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentGatewayHealth } from "@/hooks/usePaymentGatewayHealth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBookingUpsells } from "@/hooks/useBookingUpsells";
import { resolveHourlyRate, type PostcodeRateRule } from "@/lib/pricing/resolveHourlyRate";
import { fetchInstructorPostcodeRules } from "@/hooks/useInstructorPostcodeRules";
import { applyRateModifiers, loadUkBankHolidays, type RateModifiers } from "@/lib/pricing/applyRateModifiers";
import { PLATFORM_FEE_GBP } from "@/lib/pricing/platformFee";
import { getWhitelabelConfig } from "@/lib/whitelabel";


interface Instructor {
  id: string;
  name: string;
  profile_image_url: string | null;
  car_type: string;
  car_make: string | null;
  car_model: string | null;
  car_image_url: string | null;
  home_postcode: string;
  home_address: string | null;
  hourly_rate: number | null;
  bio: string | null;
  special_skills: string | null;
  brand_colour: string | null;
  preferred_lesson_length: number;
  booking_advance_days: number | null;
  available_from: string | null;
  allowed_lesson_lengths: number[] | null;
  buffer_minutes: number;
  cpd_certified: boolean | null;
  adi_code_of_practice: boolean | null;
  instructor_grade: string | null;
  welcome_video_url: string | null;
  school_skim_amount?: number | null;
  booking_mode?: string | null;
}

interface CourseTemplate {
  course_hours: number;
  course_name: string;
  default_image_url: string | null;
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

interface CourseReview {
  id: string;
  reviewer_name: string;
  review_text: string;
  rating: number;
  review_date: string;
  is_verified: boolean;
}

interface WorkingHours {
  day_of_week: number;
  is_active: boolean;
}

interface DateOverride {
  override_date: string;
  override_end_date: string | null;
  is_available: boolean;
}

interface SelectedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
}

interface CourseDetails {
  instructor: Instructor;
  hours: number;
  courseName: string;
  totalPrice: number;
  pricePerHour: number;
  courseImageUrl: string | null;
  courseDescription: string | null;
  features: string[] | null;
  template: CourseTemplate | null;
}

export default function BookingSummary() {
  const { instructorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [postcodeRules, setPostcodeRules] = useState<PostcodeRateRule[]>([]);
  const [baseHourlyRate, setBaseHourlyRate] = useState<number>(40);
  const [schoolSkimAmount, setSchoolSkimAmount] = useState<number>(0);
  const [rateModifiers, setRateModifiers] = useState<RateModifiers | null>(null);
  const [bankHolidays, setBankHolidays] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [pausedInstructorName, setPausedInstructorName] = useState<string | null>(null);
  const [loadErrorReason, setLoadErrorReason] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [locationName, setLocationName] = useState<string>("");
  
  // Payment gateway health
  const { health: gatewayHealth } = usePaymentGatewayHealth();
  
  // Site settings for payment page branding
  const { getSetting } = useSiteSettings();
  
  // Pupil details form state
  const [pupilName, setPupilName] = useState("");
  const [pupilEmail, setPupilEmail] = useState("");
  const [pupilPhone, setPupilPhone] = useState("");
  const [pupilAddress, setPupilAddress] = useState("");
  const [pupilPostcode, setPupilPostcode] = useState("");
  const [differentPickup, setDifferentPickup] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPostcode, setPickupPostcode] = useState("");
  const [pickupWhat3words, setPickupWhat3words] = useState("");
  const [hasSpecialNeeds, setHasSpecialNeeds] = useState(false);
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearpayLoading, setIsClearpayLoading] = useState(false);
  const [isKlarnaLoading, setIsKlarnaLoading] = useState(false);
  const [isNPILoading, setIsNPILoading] = useState(false);
  const [isSquareLoading, setIsSquareLoading] = useState(false);
  const [isElavonLoading, setIsElavonLoading] = useState(false);
  const [bookingPupilId, setBookingPupilId] = useState<string | null>(null);
  const bookingPupilIdRef = useRef<string | null>(null);
  
  // NPI Hosted Fields state (embedded card form)
  const [showHostedFields, setShowHostedFields] = useState(false);
  const [showKlarnaModal, setShowKlarnaModal] = useState(false);
  
  // Deposit payment state
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositDeadlineDays, setDepositDeadlineDays] = useState(0);
  const [paymentOption, setPaymentOption] = useState<'full' | 'deposit'>('deposit');
  
  // Cancellation policy text
  const [cancellationPolicyText, setCancellationPolicyText] = useState("");
  
  // Cash payments
  const [cashPaymentsEnabled, setCashPaymentsEnabled] = useState(false);
  const [isCashProcessing, setIsCashProcessing] = useState(false);
  
  // Instant Bank Pay (GoCardless)
  const [instantBankPayEnabled, setInstantBankPayEnabled] = useState(false);
  const [isInstantBankPayLoading, setIsInstantBankPayLoading] = useState(false);
  
  // BNPL toggles
  const [klarnaEnabled, setKlarnaEnabled] = useState(false);
  const [clearpayEnabled, setClearpayEnabled] = useState(false);
  
  // Upsells
  const { data: availableUpsells = [] } = useBookingUpsells();
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  
  // Calculate upsell total
  const upsellTotal = availableUpsells
    .filter((u) => selectedUpsells.includes(u.id))
    .reduce((sum, u) => sum + Number(u.price), 0);

  // Clean up GoCardless pending booking on cancellation
  useEffect(() => {
    if (searchParams.get("gocardless") === "cancelled") {
      localStorage.removeItem("gc_pending_booking");
    }
  }, []);

  const hours = parseInt(searchParams.get("hours") || "10");
  const selectedDateParam = searchParams.get("date");
  const selectedDate = selectedDateParam ? parseISO(selectedDateParam) : null;

  // IMPORTANT: Keep merchant reference stable across re-renders.
  // If this changes, Klarna may fail with "container selector is invalid" because
  // the SDK tries to bind to an element by selector and the ID can change mid-flow.
  const klarnaMerchantReference = useMemo(() => {
    const id = courseDetails?.instructor?.id;
    if (!id) return "KL-pending";
    return `KL-${id.slice(0, 8)}-${Date.now()}`;
  }, [courseDetails?.instructor?.id]);

  // Fetch location name from postcode
  const fetchLocationName = async (postcode: string) => {
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
      const data = await response.json();
      if (data.status === 200 && data.result) {
        const { admin_district, parish, admin_ward } = data.result;
        setLocationName(parish || admin_ward || admin_district || postcode);
      } else {
        setLocationName(postcode);
      }
    } catch {
      setLocationName(postcode);
    }
  };

  // Helper to find the next available date for an instructor
  const findNextAvailableDate = useCallback((
    availableFrom: string | null,
    workingHours: WorkingHours[],
    dateOverrides: DateOverride[]
  ): Date | undefined => {
    const today = startOfDay(new Date());
    const maxDays = 90;

    for (let i = 0; i < maxDays; i++) {
      const day = addDays(today, i);
      const dayOfWeek = getDay(day);
      const dateStr = format(day, "yyyy-MM-dd");

      if (availableFrom && isAfter(parseISO(availableFrom), day)) {
        continue;
      }

      const override = dateOverrides.find((o) => {
        if (o.override_end_date) {
          return dateStr >= o.override_date && dateStr <= o.override_end_date;
        }
        return o.override_date === dateStr;
      });

      if (override) {
        if (override.is_available) return day;
        continue;
      }

      const hasWorkingHours = workingHours.some(
        (wh) => wh.day_of_week === dayOfWeek && wh.is_active
      );

      if (hasWorkingHours) return day;
    }

    return undefined;
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!instructorId) return;

      const [instructorRes, templateRes, instructorCourseRes, reviewsRes, rulesRes] = await Promise.all([
        supabase.from("public_instructors").select(`
          id, name, profile_image_url, car_type, car_make, car_model, car_image_url,
          home_postcode, hourly_rate, bio, special_skills, brand_colour,
          preferred_lesson_length, booking_advance_days, available_from,
          allowed_lesson_lengths, buffer_minutes, cpd_certified, adi_code_of_practice,
          instructor_grade, welcome_video_url,
          deposit_enabled, deposit_amount, deposit_deadline_days,
          cancellation_policy_text, booking_mode, is_active,
          cash_payments_enabled, klarna_enabled, clearpay_enabled,
          instant_bank_pay_enabled, school_skim_amount,
          weekend_surcharge_amount, bank_holiday_surcharge_amount,
          odd_hours_surcharge_amount, odd_hours_start, odd_hours_end
        `).eq("id", instructorId).maybeSingle(),
        supabase.from("course_templates").select("*").eq("course_hours", hours).maybeSingle(),
        supabase.from("instructor_courses").select("course_image_url").eq("instructor_id", instructorId).eq("course_hours", hours).maybeSingle(),
        supabase.from("course_reviews").select("*").eq("instructor_id", instructorId).eq("course_hours", hours).order("review_date", { ascending: false }).limit(5),
        fetchInstructorPostcodeRules(instructorId),
      ]);

      setPostcodeRules(rulesRes ?? []);



      if (instructorRes.error || !instructorRes.data) {
        // Could be RLS-hidden because the instructor toggled their visibility off.
        // On a whitelabel host, surface a friendly "Bookings paused" screen.
        const wl = getWhitelabelConfig();
        if (wl?.instructorSlug) {
          const { data: status } = await supabase
            .rpc("get_whitelabel_instructor_status", { p_slug: wl.instructorSlug })
            .maybeSingle();
          if (status && !status.is_active) {
            setPausedInstructorName(status.name ?? wl.brandName ?? null);
          }
        }
        console.error("Error fetching instructor:", instructorRes.error);
        setLoadErrorReason(instructorRes.error
          ? "We couldn't load this instructor right now. Please try again."
          : "This instructor profile is unavailable or no longer accepting bookings.");
        setLoading(false);
        return;
      }

      const instructor = instructorRes.data;
      const template = templateRes.data;
      const instructorCourse = instructorCourseRes.data;

      // LIVE DATA ONLY — refuse to load if the instructor hasn't configured pricing
      // or core scheduling values. No magic fallbacks.
      if (!instructor.hourly_rate || Number(instructor.hourly_rate) <= 0) {
        setLoadErrorReason("This instructor hasn't published an hourly rate yet, so this course can't be booked online. Please contact them directly.");
        setLoading(false);
        return;
      }
      if (!instructor.preferred_lesson_length || Number(instructor.preferred_lesson_length) <= 0) {
        setLoadErrorReason("This instructor hasn't configured a preferred lesson length yet, so this course can't be booked online.");
        setLoading(false);
        return;
      }
      if (instructor.buffer_minutes === null || instructor.buffer_minutes === undefined) {
        setLoadErrorReason("This instructor hasn't configured their travel buffer yet, so this course can't be booked online.");
        setLoading(false);
        return;
      }
      if (!instructor.booking_advance_days || Number(instructor.booking_advance_days) <= 0) {
        setLoadErrorReason("This instructor hasn't set how far ahead pupils can book, so this course can't be booked online.");
        setLoading(false);
        return;
      }

      // Set deposit settings from instructor (live values only — no magic defaults)
      setDepositEnabled(instructorRes.data.deposit_enabled ?? false);
      setDepositAmount(instructorRes.data.deposit_amount ?? 0);
      setDepositDeadlineDays(instructorRes.data.deposit_deadline_days ?? 0);
      setCancellationPolicyText(instructorRes.data.cancellation_policy_text ?? "");
      setCashPaymentsEnabled((instructorRes.data as any).cash_payments_enabled ?? false);
      setInstantBankPayEnabled((instructorRes.data as any).instant_bank_pay_enabled ?? false);
      setKlarnaEnabled((instructorRes.data as any).klarna_enabled ?? false);
      setClearpayEnabled((instructorRes.data as any).clearpay_enabled ?? false);

      const hourlyRate = Number(instructor.hourly_rate);
      const schoolSkim = Number(instructor.school_skim_amount ?? 0);
      setBaseHourlyRate(hourlyRate);
      setSchoolSkimAmount(schoolSkim);
      setRateModifiers({
        weekend_surcharge_amount: (instructor as any).weekend_surcharge_amount ?? 0,
        bank_holiday_surcharge_amount: (instructor as any).bank_holiday_surcharge_amount ?? 0,
        odd_hours_surcharge_amount: (instructor as any).odd_hours_surcharge_amount ?? 0,
        odd_hours_start: (instructor as any).odd_hours_start ?? null,
        odd_hours_end: (instructor as any).odd_hours_end ?? null,
      });
      loadUkBankHolidays().then(setBankHolidays);
      // Course name from the template if present, otherwise a neutral hours-based label.
      const courseName = template?.course_name || `${hours} Hour Course`;
      const courseImageUrl = instructorCourse?.course_image_url || template?.default_image_url || null;

      fetchLocationName(instructor.home_postcode);

      setCourseDetails({
        instructor: {
          ...instructor,
          home_address: null,
          preferred_lesson_length: instructor.preferred_lesson_length,
          booking_advance_days: instructor.booking_advance_days,
          available_from: instructor.available_from || null,
          allowed_lesson_lengths: instructor.allowed_lesson_lengths || null,
          buffer_minutes: instructor.buffer_minutes,
          car_image_url: instructor.car_image_url || null,
          welcome_video_url: instructor.welcome_video_url || null,
          booking_mode: instructor.booking_mode || 'pupil_choice',
        },
        hours,
        courseName,
        totalPrice: (hours * hourlyRate) + schoolSkim,
        pricePerHour: hourlyRate,
        courseImageUrl,
        courseDescription: template?.full_description || template?.short_description || null,
        features: template?.features || null,
        template: template || null,
      });

      if (reviewsRes.data) setReviews(reviewsRes.data);
      setLoading(false);
    };

    fetchDetails();
  }, [instructorId, hours]);

  const handleSlotsChange = useCallback((slots: SelectedSlot[]) => {
    setSelectedSlots(slots);
  }, []);

  const scheduledHours = selectedSlots.reduce((acc, slot) => acc + slot.duration / 60, 0);
  const isFullyScheduled = scheduledHours >= hours;
  const isPupilDetailsComplete = !!(pupilName.trim() && pupilEmail.trim() && pupilPhone.trim() && pupilAddress.trim() && pupilPostcode.trim());

  // Build a slot payload with the price snapshot (per-hour rate including
  // postcode override + surcharge, the £/hr surcharge portion, and the £
  // amount due for this slot). This is persisted on the lesson row so reports
  // show what was actually charged even if the instructor later changes rates.
  const buildSlotPayload = (slot: SelectedSlot) => {
    const dateStr = format(slot.date, "yyyy-MM-dd");
    const { finalRate, totalAmount } = applyRateModifiers({
      baseRate: effectiveHourlyRate,
      lessonDate: dateStr,
      lessonStartTime: slot.startTime,
      modifiers: rateModifiers,
      bankHolidaySet: bankHolidays,
    });
    const hoursDecimal = slot.duration / 60;
    return {
      date: dateStr,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      pricePerHour: Math.round(finalRate * 100) / 100,
      surchargeAmount: Math.round(totalAmount * 100) / 100,
      amountDue: Math.round(hoursDecimal * finalRate * 100) / 100,
    };
  };

  // Get booking mode - default to pupil_choice
  const bookingMode = courseDetails?.instructor?.booking_mode || 'pupil_choice';
  
  // For auto_assign and instructor_assigns modes, we don't require slot selection
  const requiresSlotSelection = bookingMode === 'pupil_choice';
  const canSubmit = isPupilDetailsComplete && (requiresSlotSelection ? isFullyScheduled : true) && !isSubmitting;

  // Auto-show card form when canSubmit becomes true
  useEffect(() => {
    if (canSubmit && !showHostedFields) {
      setShowHostedFields(true);
    }
  }, [canSubmit, showHostedFields]);

  const bookingInProgressRef = useRef(false);
  const ensureBookingCreated = async (
    paymentType: 'full' | 'deposit' = 'full',
    amountPaid?: number
  ): Promise<string | null> => {
    if (!courseDetails) return null;
    if (bookingPupilId) return bookingPupilId;
    
    // Prevent duplicate concurrent calls
    if (bookingInProgressRef.current) {
      // Wait for the in-progress booking to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      if (bookingPupilIdRef.current) return bookingPupilIdRef.current;
      return null;
    }
    
    bookingInProgressRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke("create-booking", {
        body: {
          instructorId: instructor.id,
          pupilName: pupilName.trim(),
          pupilEmail: pupilEmail.trim(),
          pupilPhone: pupilPhone.trim(),
          pupilAddress: pupilAddress.trim(),
          pupilPostcode: pupilPostcode.trim().toUpperCase(),
          pickupAddress: differentPickup ? pickupAddress.trim() : undefined,
          pickupPostcode: differentPickup ? pickupPostcode.trim().toUpperCase() : undefined,
          pickupWhat3words: differentPickup && pickupWhat3words.trim() ? pickupWhat3words.trim() : undefined,
          specialNeeds: hasSpecialNeeds && specialNeeds.trim() ? specialNeeds.trim() : undefined,
          courseType: courseName,
          courseHours: hours,
          totalPrice,
          platformFee,
          slots: selectedSlots.map(buildSlotPayload),
          paymentType,
          amountPaid: amountPaid ?? (paymentType === 'full' ? totalPrice + upsellTotal : depositAmount),
          depositAmount: paymentType === 'deposit' ? depositAmount : 0,
          upsells: selectedUpsells.map((id) => {
            const upsell = availableUpsells.find((u) => u.id === id);
            return { id, price: upsell?.price || 0 };
          }),
        },
      });

      if (error) {
        console.error("Booking error:", error);
        toast.error("Failed to create your booking. Please try again.");
        return null;
      }

      setBookingPupilId(data.pupilId);
      bookingPupilIdRef.current = data.pupilId;
      toast.info(`Booking created — completing payment...`);
      return data.pupilId as string;
    } finally {
      bookingInProgressRef.current = false;
    }
  };

  // Helper: call confirm-booking to trigger all notifications after payment
  const triggerConfirmBooking = async (pupilId: string) => {
    try {
      await supabase.functions.invoke("confirm-booking", {
        body: { pupilId, instructorId: instructor?.id },
      });
      console.log("confirm-booking triggered for", pupilId);
    } catch (err) {
      console.error("confirm-booking error (non-fatal):", err);
    }
  };

  const handleBookingSubmit = async () => {
    if (!canSubmit || !courseDetails) return;

    const totalAmount = totalPrice + upsellTotal;
    
    // Only allow direct booking (no payment) if total is £0
    if (totalAmount > 0) {
      toast.error("Please select a payment method to complete your booking.");
      return;
    }

    setIsSubmitting(true);
    try {
      const pupilId = await ensureBookingCreated();
      if (!pupilId) return;
      // Free booking — trigger notifications immediately
      await triggerConfirmBooking(pupilId);
      navigate(`/booking-confirmation?pupilId=${pupilId}&free=true`);
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearpayCheckout = async () => {
    const scheduleComplete = requiresSlotSelection ? isFullyScheduled : true;
    if (!scheduleComplete || !isPupilDetailsComplete || !courseDetails) {
      toast.error(requiresSlotSelection ? "Please complete all details and schedule all lessons first" : "Please complete all your details first");
      return;
    }

    setIsClearpayLoading(true);
    try {
      const pupilId = await ensureBookingCreated();
      if (!pupilId) return;

      const merchantReference = `${instructor.id}-${Date.now()}`;
      const currentUrl = window.location.origin;

      const nameParts = pupilName.trim().split(" ");
      const givenNames = nameParts.slice(0, -1).join(" ") || nameParts[0];
      const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

      const { data, error } = await supabase.functions.invoke("clearpay-checkout", {
        body: {
          amount: totalPrice + upsellTotal,
          currency: "GBP",
          merchantReference,
          consumer: {
            givenNames,
            surname: surname || givenNames,
            email: pupilEmail.trim(),
            phoneNumber: pupilPhone.trim(),
          },
          billing: {
            name: pupilName.trim(),
            line1: pupilAddress.trim(),
            postcode: pupilPostcode.trim().toUpperCase(),
            countryCode: "GB",
          },
          items: [
            {
              name: `${courseName} - ${hours} Hour Driving Course${upsellTotal > 0 ? ' + extras' : ''}`,
              quantity: 1,
              price: totalPrice + upsellTotal,
            },
          ],
          redirectUrls: {
            confirmUrl: `${currentUrl}/booking-confirmation?pupilId=${pupilId}&clearpay=success&ref=${merchantReference}&instructorId=${instructor.id}&amount=${(totalPrice + upsellTotal).toFixed(2)}`,
            cancelUrl: `${currentUrl}/book/${instructor.id}?hours=${hours}&clearpay=cancelled`,
          },
        },
      });

      if (error) {
        console.error("Clearpay checkout error:", error);
        toast.error("Failed to start Clearpay checkout. Please try again.");
        return;
      }

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error("Could not get Clearpay checkout URL");
      }
    } catch (err) {
      console.error("Clearpay error:", err);
      toast.error("Something went wrong with Clearpay. Please try again.");
    } finally {
      setIsClearpayLoading(false);
    }
  };

  const handleKlarnaCheckout = async () => {
    const scheduleComplete = requiresSlotSelection ? isFullyScheduled : true;
    if (!scheduleComplete || !isPupilDetailsComplete || !courseDetails) {
      toast.error(requiresSlotSelection ? "Please complete all details and schedule all lessons first" : "Please complete all your details first");
      return;
    }

    setIsKlarnaLoading(true);
    try {
      const pupilId = await ensureBookingCreated();
      if (!pupilId) return;
      setShowKlarnaModal(true);
    } catch (err) {
      console.error("Klarna error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsKlarnaLoading(false);
    }
  };

  const handleCashPayment = async () => {
    const scheduleComplete = requiresSlotSelection ? isFullyScheduled : true;
    if (!scheduleComplete || !isPupilDetailsComplete || !courseDetails) {
      toast.error(requiresSlotSelection ? "Please complete all details and schedule all lessons first" : "Please complete all your details first");
      return;
    }
    setIsCashProcessing(true);
    try {
      const pupilId = await ensureBookingCreated('full', 0);
      if (!pupilId) return;
      await triggerConfirmBooking(pupilId);
      navigate(`/booking-confirmation?pupilId=${pupilId}&method=cash`);
    } catch (err) {
      console.error("Cash booking error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCashProcessing(false);
    }
  };

  const handleInstantBankPay = async () => {
    const scheduleComplete = requiresSlotSelection ? isFullyScheduled : true;
    if (!scheduleComplete || !isPupilDetailsComplete || !courseDetails) {
      toast.error(requiresSlotSelection ? "Please complete all details and schedule all lessons first" : "Please complete all your details first");
      return;
    }
    setIsInstantBankPayLoading(true);
    try {
      const currentUrl = window.location.origin;
      const bookingRef = `GC-${instructor.id.slice(0, 8)}-${Date.now()}`;

      // Save booking data to localStorage so we can create the booking AFTER payment succeeds
      const pendingBookingData = {
        instructorId: instructor.id,
        pupilName: pupilName.trim(),
        pupilEmail: pupilEmail.trim(),
        pupilPhone: pupilPhone.trim(),
        pupilAddress: pupilAddress.trim(),
        pupilPostcode: pupilPostcode.trim().toUpperCase(),
        pickupAddress: differentPickup ? pickupAddress.trim() : undefined,
        pickupPostcode: differentPickup ? pickupPostcode.trim().toUpperCase() : undefined,
        pickupWhat3words: differentPickup && pickupWhat3words.trim() ? pickupWhat3words.trim() : undefined,
        specialNeeds: hasSpecialNeeds && specialNeeds.trim() ? specialNeeds.trim() : undefined,
        courseType: courseName,
        courseHours: hours,
        totalPrice,
        slots: selectedSlots.map(buildSlotPayload),
        paymentType: paymentOption === 'deposit' && depositEnabled ? 'deposit' : 'full',
        amountPaid: paymentOption === 'deposit' && depositEnabled ? depositAmount : totalPrice + upsellTotal,
        depositAmount: paymentOption === 'deposit' && depositEnabled ? depositAmount : 0,
        upsells: selectedUpsells.map((id) => {
          const upsell = availableUpsells.find((u) => u.id === id);
          return { id, price: upsell?.price || 0 };
        }),
        bookingRef,
      };
      localStorage.setItem("gc_pending_booking", JSON.stringify(pendingBookingData));

      const { data, error } = await supabase.functions.invoke("gocardless-instant-bank-pay", {
        body: {
          amount: totalPrice + upsellTotal,
          pupilId: "pending", // placeholder — booking created after payment
          bookingRef,
          redirectUrl: `${currentUrl}/booking-confirmation?gocardless=success&ref=${bookingRef}`,
          cancelUrl: `${currentUrl}/book/${instructor.id}?hours=${hours}&gocardless=cancelled`,
          customerEmail: pupilEmail.trim(),
          customerName: pupilName.trim(),
        },
      });

      if (error) {
        console.error("GoCardless Instant Bank Pay error:", error);
        toast.error("Failed to start bank payment. Please try again.");
        localStorage.removeItem("gc_pending_booking");
        return;
      }

      if (data?.authorisationUrl) {
        window.location.href = data.authorisationUrl;
      } else {
        toast.error("Could not get bank payment URL");
        localStorage.removeItem("gc_pending_booking");
      }
    } catch (err) {
      console.error("Instant Bank Pay error:", err);
      toast.error("Something went wrong. Please try again.");
      localStorage.removeItem("gc_pending_booking");
    } finally {
      setIsInstantBankPayLoading(false);
    }
  };

  const handleKlarnaSuccess = async (orderId: string) => {
    setShowKlarnaModal(false);
    const pupilId = bookingPupilId;
    if (!pupilId || !courseDetails) return;

    // Call confirm-booking for notifications
    try {
      await supabase.functions.invoke("confirm-booking", {
        body: { pupilId, instructorId: instructor.id },
      });
    } catch (err) {
      console.error("confirm-booking error:", err);
    }

    navigate(`/booking-confirmation?pupilId=${pupilId}&klarna=success&ref=${orderId}`);
  };

  const handleNPICheckout = async () => {
    const scheduleComplete = requiresSlotSelection ? isFullyScheduled : true;
    if (!scheduleComplete || !isPupilDetailsComplete || !courseDetails) {
      toast.error(requiresSlotSelection ? "Please complete all details and schedule all lessons first" : "Please complete all your details first");
      return;
    }

    // Show embedded checkout directly — booking will be created after payment succeeds
    setShowHostedFields(true);
  };

  // Handler for showing embedded hosted fields
  const handleShowHostedFields = async () => {
    const scheduleComplete = requiresSlotSelection ? isFullyScheduled : true;
    if (!scheduleComplete || !isPupilDetailsComplete || !courseDetails) {
      toast.error(requiresSlotSelection ? "Please complete all details and schedule all lessons first" : "Please complete all your details first");
      return;
    }

    // Show hosted fields directly — booking will be created after payment succeeds
    setShowHostedFields(true);
  };

  const handleSquareCheckout = async () => {
    const scheduleComplete = requiresSlotSelection ? isFullyScheduled : true;
    if (!scheduleComplete || !isPupilDetailsComplete || !courseDetails) {
      toast.error(requiresSlotSelection ? "Please complete all details and schedule all lessons first" : "Please complete all your details first");
      return;
    }

    setIsSquareLoading(true);
    try {
      const pupilId = await ensureBookingCreated();
      if (!pupilId) return;

      const orderReference = `SQ-${instructor.id.slice(0, 8)}-${Date.now()}`;
      const currentUrl = window.location.origin;

      // Build lesson slots for order metadata
      const lessonSlots = selectedSlots.map((slot) => ({
        date: format(slot.date, "yyyy-MM-dd"),
        time: slot.startTime,
      }));

      const { data, error } = await supabase.functions.invoke("square-checkout", {
        body: {
          amount: totalPrice + upsellTotal,
          orderReference,
          customerEmail: pupilEmail.trim(),
          customerName: pupilName.trim(),
          customerPhone: pupilPhone.trim(),
          courseName: courseName,
          description: `${courseName} - ${hours} Hour Driving Course`,
          returnUrl: `${currentUrl}/booking-confirmation?pupilId=${pupilId}&square=success&ref=${orderReference}`,
          cancelUrl: `${currentUrl}/book/${instructor.id}?hours=${hours}&square=cancelled`,
          instructorId: instructor.id,
          pupilId,
          lessonSlots,
        },
      });

      if (error) {
        console.error("Square checkout error:", error);
        toast.error("Failed to start Square checkout. Please try again.");
        return;
      }

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Could not get Square checkout URL");
      }
    } catch (err) {
      console.error("Square error:", err);
      toast.error("Something went wrong with Square. Please try again.");
    } finally {
      setIsSquareLoading(false);
    }
  };

  const handleElavonCheckout = async () => {
    const scheduleComplete = requiresSlotSelection ? isFullyScheduled : true;
    if (!scheduleComplete || !isPupilDetailsComplete || !courseDetails) {
      toast.error(requiresSlotSelection ? "Please complete all details and schedule all lessons first" : "Please complete all your details first");
      return;
    }

    // Show inline hosted fields directly — booking will be created after payment succeeds
    setShowHostedFields(true);
  };


  if (loading) {
    return (
      <MainLayout>
        <div className="container py-8 max-w-5xl mx-auto">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </div>
            {/* Form skeleton */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border bg-card p-6 space-y-4">
                  <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
                <div className="rounded-xl border bg-card p-6 space-y-4">
                  <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                  <div className="h-64 w-full bg-muted animate-pulse rounded-lg" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-6 space-y-3">
                  <div className="h-16 w-16 rounded-full bg-muted animate-pulse mx-auto" />
                  <div className="h-5 w-32 bg-muted animate-pulse rounded mx-auto" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!courseDetails) {
    if (pausedInstructorName) {
      return (
        <MainLayout>
          <SEOHead
            title="Bookings paused"
            description={`${pausedInstructorName} is not currently accepting new bookings.`}
            noindex
          />
          <div className="container py-16 text-center max-w-xl mx-auto">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Calendar className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Bookings paused</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {pausedInstructorName} is not currently accepting new bookings. Please check back soon.
            </p>
          </div>
        </MainLayout>
      );
    }
    return (
      <MainLayout>
        <div className="container py-16 text-center max-w-xl mx-auto">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Calendar className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">
            {loadErrorReason ? "Course unavailable" : "Course not found"}
          </h1>
          {loadErrorReason && (
            <p className="mt-2 text-sm text-muted-foreground">{loadErrorReason}</p>
          )}
          <Button onClick={() => navigate("/courses")} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { instructor, courseName, courseImageUrl, courseDescription, features, template } = courseDetails;
  const brandColour = instructor.brand_colour || "#1e3a5f";

  // Resolve effective hourly rate honoring per-postcode override entered by the learner.
  const effectiveHourlyRate = resolveHourlyRate({
    pupilPostcode: pupilPostcode || null,
    instructorDefaultRate: baseHourlyRate,
    postcodeRules,
  }) ?? baseHourlyRate;

  // Apply weekend / bank-holiday / off-peak surcharges per scheduled slot.
  // Unscheduled remaining hours fall back to the base effective rate.
  const scheduledHoursDecimal = selectedSlots.reduce((acc, s) => acc + (s.duration / 60), 0);
  const remainingHours = Math.max(0, hours - scheduledHoursDecimal);
  const surchargedSlotsTotal = selectedSlots.reduce((acc, s) => {
    const dateStr = (() => {
      const d = s.date instanceof Date ? s.date : new Date(s.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();
    const { finalRate } = applyRateModifiers({
      baseRate: effectiveHourlyRate,
      lessonDate: dateStr,
      lessonStartTime: s.startTime,
      modifiers: rateModifiers,
      bankHolidaySet: bankHolidays,
    });
    return acc + (s.duration / 60) * finalRate;
  }, 0);
  const surchargeTotal =
    Math.round((surchargedSlotsTotal + remainingHours * effectiveHourlyRate) * 100) / 100;
  // Bookings include a flat £1 platform fee (separate from school skim & Service Fee).
  const platformFee = PLATFORM_FEE_GBP;
  const totalPrice = surchargeTotal + schoolSkimAmount + platformFee;
  const postcodeOverrideActive = effectiveHourlyRate !== baseHourlyRate;
  const surchargesActive = totalPrice > (hours * effectiveHourlyRate + schoolSkimAmount + platformFee) + 0.001;


  // Enquiry-only mode: short-circuit the entire payment/scheduling flow
  if (bookingMode === "enquiry_only") {
    return (
      <EnquiryFlow
        instructor={instructor}
        courseName={courseName}
        hours={hours}
        totalPrice={totalPrice}
        courseImageUrl={courseImageUrl}
        locationName={locationName}
      />
    );
  }

  // Mobile View
  if (isMobile) {
    return (
      <>
      <MobileBookingView
        instructor={instructor}
        courseName={courseName}
        totalPrice={totalPrice}
        hours={hours}
        courseImageUrl={courseImageUrl}
        courseDescription={courseDescription}
        features={features}
        template={template}
        locationName={locationName}
        selectedDate={selectedDate}
        pupilName={pupilName}
        pupilEmail={pupilEmail}
        pupilPhone={pupilPhone}
        pupilAddress={pupilAddress}
        pupilPostcode={pupilPostcode}
        differentPickup={differentPickup}
        pickupAddress={pickupAddress}
        pickupPostcode={pickupPostcode}
        pickupWhat3words={pickupWhat3words}
        setPupilName={setPupilName}
        setPupilEmail={setPupilEmail}
        setPupilPhone={setPupilPhone}
        setPupilAddress={setPupilAddress}
        setPupilPostcode={setPupilPostcode}
        setDifferentPickup={setDifferentPickup}
        setPickupAddress={setPickupAddress}
        setPickupPostcode={setPickupPostcode}
        setPickupWhat3words={setPickupWhat3words}
        hasSpecialNeeds={hasSpecialNeeds}
        specialNeeds={specialNeeds}
        setHasSpecialNeeds={setHasSpecialNeeds}
        setSpecialNeeds={setSpecialNeeds}
        selectedSlots={selectedSlots}
        scheduledHours={scheduledHours}
        onSlotsChange={handleSlotsChange}
        depositEnabled={depositEnabled}
        depositAmount={depositAmount}
        paymentOption={paymentOption}
        setPaymentOption={setPaymentOption}
        availableUpsells={availableUpsells}
        selectedUpsells={selectedUpsells}
        onUpsellsChange={setSelectedUpsells}
        upsellTotal={upsellTotal}
        canSubmit={canSubmit}
        isPupilDetailsComplete={isPupilDetailsComplete}
        isFullyScheduled={isFullyScheduled}
        isSubmitting={isSubmitting}
        isNPILoading={isNPILoading}
        isClearpayLoading={isClearpayLoading}
        klarnaMerchantReference={klarnaMerchantReference}
        gatewayHealth={gatewayHealth}
        onBookingSubmit={handleBookingSubmit}
        onNPICheckout={handleElavonCheckout}
        onClearpayCheckout={handleClearpayCheckout}
        onKlarnaCheckout={handleKlarnaCheckout}
        isKlarnaLoading={isKlarnaLoading}
        onCashPayment={handleCashPayment}
        isCashProcessing={isCashProcessing}
        cashPaymentsEnabled={cashPaymentsEnabled}
        onInstantBankPay={handleInstantBankPay}
        isInstantBankPayLoading={isInstantBankPayLoading}
        instantBankPayEnabled={instantBankPayEnabled}
        klarnaEnabled={klarnaEnabled}
        clearpayEnabled={clearpayEnabled}
        onWalletSuccess={(pupilId) => navigate(`/booking-confirmation?pupilId=${pupilId}`)}
        showEmbeddedCheckout={showHostedFields}
        embeddedCheckoutPupilId={bookingPupilId}
        onEmbeddedCheckoutSuccess={async () => {
          const isDepositPayment = paymentOption === 'deposit' && depositEnabled;
          const fullPaymentAmount = totalPrice + upsellTotal;
          const pupilId = await ensureBookingCreated(
            isDepositPayment ? 'deposit' : 'full',
            isDepositPayment ? depositAmount : fullPaymentAmount
          );
          toast.success("Payment successful!");
          if (pupilId) {
            await triggerConfirmBooking(pupilId);
            navigate(`/booking-confirmation?pupilId=${pupilId}&npi=success`);
          }
        }}
        onEmbeddedCheckoutCancel={() => setShowHostedFields(false)}
        ensureBookingCreated={async () => {
          const id = await ensureBookingCreated();
          return id;
        }}
      />
      {courseDetails && (
        <KlarnaPaymentModal
          open={showKlarnaModal}
          onClose={() => setShowKlarnaModal(false)}
          amount={totalPrice + upsellTotal}
          merchantReference={klarnaMerchantReference}
          orderDescription={`${courseName} - ${hours} Hour Driving Course`}
          onSuccess={handleKlarnaSuccess}
          consumer={{
            givenName: pupilName.trim().split(" ")[0] || pupilName.trim(),
            familyName: pupilName.trim().split(" ").slice(1).join(" ") || pupilName.trim(),
            email: pupilEmail.trim(),
            phone: pupilPhone.trim(),
          }}
          billing={{
            streetAddress: pupilAddress.trim(),
            postalCode: pupilPostcode.trim().toUpperCase(),
            city: locationName || "UK",
            country: "GB",
          }}
          pupilId={bookingPupilId}
          instructorId={instructor?.id ?? null}
        />
      )}
    </>
    );
  }

  return (
    <MainLayout>
      {/* Compact Course Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-3 gap-2 -ml-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 h-8 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-4">
            {/* Course Image - Smaller */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden ring-2 ring-white/20">
              <img
                src={courseImageUrl || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=200&h=200&fit=crop"}
                alt={courseName}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{courseName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Avatar className="h-7 w-7 border-2 border-white/20">
                  <AvatarImage src={instructor.profile_image_url || undefined} />
                  <AvatarFallback className="bg-white text-primary text-xs font-semibold">
                    {instructor.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-primary-foreground/80">{instructor.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-primary-foreground/70">
                <span className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                  <Clock className="h-3 w-3" />
                  {hours}h
                </span>
                <span className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                  <MapPin className="h-3 w-3" />
                  {locationName || instructor.home_postcode}
                </span>
                <span className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                  <Car className="h-3 w-3" />
                  {instructor.car_type}
                </span>
              </div>
            </div>

            {/* Price Badge with Payment Messaging */}
            <div className="hidden sm:block bg-white text-primary rounded-xl px-4 py-3 shadow-lg">
              <span className="text-2xl font-bold">£{totalPrice + upsellTotal}</span>
              <div className="text-[10px] text-primary/70 mt-0.5">Includes £{platformFee.toFixed(2)} platform fee</div>
              <div className="mt-1 border-t border-primary/10 pt-1">
                <PaymentMessaging amount={totalPrice + upsellTotal} layout="stacked" className="text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Desktop Progress Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[
            { step: 1, label: "Your Details" },
            { step: 2, label: "Choose Lessons" },
            { step: 3, label: "Payment" },
          ].map((s, i, arr) => {
            const step = isPupilDetailsComplete ? (isFullyScheduled ? 3 : 2) : 1;
            const isDone = step > s.step;
            const isCurrent = step === s.step;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone ? 'bg-primary text-primary-foreground' :
                    isCurrent ? 'bg-primary/20 text-primary ring-2 ring-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? <CheckCircle className="h-4 w-4" /> : s.step}
                  </div>
                  <span className={`text-[10px] font-medium ${isCurrent ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && <div className={`w-12 h-0.5 mb-4 rounded-full ${isDone ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            );
          })}
        </div>
        {/* Selected Date Banner - Show when date is selected */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700">You have selected</p>
              <p className="text-emerald-600">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
            </div>
          </motion.div>
        )}

        {/* Course Details Section - Always Visible First */}
        <div className="space-y-4 mb-8">
          {/* Instructor Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={instructor.profile_image_url || undefined} />
                  <AvatarFallback 
                    style={{ backgroundColor: brandColour, color: "white" }}
                    className="text-lg"
                  >
                    {instructor.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{instructor.name}</h3>
                  <p className="text-sm text-muted-foreground">{instructor.car_type} Driving Instructor</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {instructor.instructor_grade && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Award className="h-3 w-3" />
                        Grade {instructor.instructor_grade}
                      </Badge>
                    )}
                    {instructor.cpd_certified && (
                      <Badge variant="secondary" className="text-xs gap-1 bg-emerald-100 text-emerald-700">
                        <CheckCircle className="h-3 w-3" />
                        CPD
                      </Badge>
                    )}
                    {instructor.adi_code_of_practice && (
                      <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700">
                        <ShieldCheck className="h-3 w-3" />
                        ADI
                      </Badge>
                    )}
                  </div>

                  {instructor.bio && (
                    <p className="mt-3 text-sm text-muted-foreground">{instructor.bio}</p>
                  )}
                  
                  {instructor.special_skills && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-muted-foreground">Specialties: </span>
                      <span className="text-xs text-muted-foreground">{instructor.special_skills}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Course Description */}
          {courseDescription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4">
                <h3 className="font-semibold mb-2">About This Course</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{courseDescription}</p>
              </Card>
            </motion.div>
          )}

          {/* Features / What's Included */}
          {features && features.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <Card className="p-4">
                <h3 className="font-semibold mb-3">What's Included</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* What to Bring */}
          {template?.what_to_bring && template.what_to_bring.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
            >
              <Card className="p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Backpack className="h-4 w-4 text-primary" />
                  What to Bring
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {template.what_to_bring.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Prerequisites */}
          {template?.prerequisites && template.prerequisites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              <Card className="p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Prerequisites
                </h3>
                <div className="space-y-2">
                  {template.prerequisites.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Theory & Driving Test Details */}
          {(template?.theory_test_details || template?.driving_test_details) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {template?.theory_test_details && (
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1.5">
                        Theory Test
                      </h3>
                      <p className="text-sm text-blue-700/80 dark:text-blue-300/80 whitespace-pre-line leading-relaxed">
                        {template.theory_test_details}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {template?.driving_test_details && (
                <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                      <Car className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1.5">
                        Driving Test
                      </h3>
                      <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 whitespace-pre-line leading-relaxed">
                        {template.driving_test_details}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {/* Video Section - Two side-by-side videos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.19 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Explainer Video */}
              {template?.explainer_video_url && (
                <Card className="overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    <video
                      src={template.explainer_video_url}
                      className="h-full w-full object-cover"
                      controls
                      poster=""
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Course Explainer</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Instructor Intro Video OR About EveryDriver fallback */}
              <Card className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {instructor.welcome_video_url ? (
                    <video
                      src={instructor.welcome_video_url}
                      className="h-full w-full object-cover"
                      controls
                      poster=""
                    />
                  ) : (
                    <iframe
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0"
                      title="About EveryDriver"
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">
                      {instructor.welcome_video_url 
                        ? `Meet ${instructor.name.split(" ")[0]}`
                        : "About EveryDriver"
                      }
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          {template?.payment_terms && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment Terms
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{template.payment_terms}</p>
              </Card>
            </motion.div>
          )}

          {/* Terms & Conditions */}
          {template?.terms_conditions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{template.terms_conditions}</p>
              </Card>
            </motion.div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              <Card className="p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  Student Reviews
                </h3>
                <div className="space-y-3">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{review.reviewer_name}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.review_text}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Booking Section Header */}
        <div className="border-t pt-6 mb-6">
          <h2 className="text-xl font-bold mb-2">Book Your Course</h2>
          <p className="text-sm text-muted-foreground">Complete the steps below to secure your lessons</p>
        </div>

        {/* Progress Indicator - Show 2 steps for auto/instructor modes, 3 for pupil choice */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${isPupilDetailsComplete ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}>
              {isPupilDetailsComplete ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className={`text-sm font-medium ${isPupilDetailsComplete ? 'text-emerald-600' : 'text-foreground'}`}>
              Your details
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-border mx-3" />
          {requiresSlotSelection && (
            <>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${isFullyScheduled ? 'bg-emerald-500 text-white' : isPupilDetailsComplete ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {isFullyScheduled ? <CheckCircle className="h-5 w-5" /> : '2'}
                </div>
                <span className={`text-sm font-medium ${isFullyScheduled ? 'text-emerald-600' : isPupilDetailsComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Choose slots
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-border mx-3" />
            </>
          )}
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${canSubmit ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {requiresSlotSelection ? '3' : '2'}
            </div>
            <span className={`text-sm font-medium ${canSubmit ? 'text-foreground' : 'text-muted-foreground'}`}>
              Pay
            </span>
          </div>
        </div>

        {/* Step 1: Your Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm mb-6"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            Your Details
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pupilName">Full Name *</Label>
              <Input
                id="pupilName"
                value={pupilName}
                onChange={(e) => setPupilName(e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pupilEmail">Email *</Label>
              <Input
                id="pupilEmail"
                type="email"
                value={pupilEmail}
                onChange={(e) => setPupilEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pupilPhone">Phone *</Label>
              <Input
                id="pupilPhone"
                type="tel"
                value={pupilPhone}
                onChange={(e) => setPupilPhone(e.target.value)}
                placeholder="07123 456789"
              />
            </div>
            <div className="sm:col-span-2">
              <PostcodeAddressLookup
                postcode={pupilPostcode}
                address={pupilAddress}
                onPostcodeChange={setPupilPostcode}
                onAddressChange={setPupilAddress}
              />
            </div>
            
            {/* Different pickup location */}
            <div className="sm:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={differentPickup}
                  onCheckedChange={(checked) => setDifferentPickup(checked === true)}
                />
                <span className="text-sm text-muted-foreground">My pickup location is different from my home address</span>
              </label>
            </div>
            
            {differentPickup && (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pickupAddress">Pickup Address *</Label>
                  <GoogleAddressAutocomplete
                    value={pickupAddress}
                    onChange={setPickupAddress}
                    onPostcodeChange={setPickupPostcode}
                    placeholder="Start typing your pickup address..."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pickupWhat3words" className="flex items-center gap-1.5">
                    what3words
                    <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="pickupWhat3words"
                    value={pickupWhat3words}
                    onChange={(e) => setPickupWhat3words(e.target.value)}
                    placeholder="///word.word.word"
                  />
                </div>
              </>
            )}
            
            {/* Special Needs */}
            <div className="sm:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={hasSpecialNeeds}
                  onCheckedChange={(checked) => setHasSpecialNeeds(checked === true)}
                />
                <span className="text-sm text-muted-foreground">Any special needs?</span>
              </label>
            </div>
            
            {hasSpecialNeeds && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="specialNeeds">Please describe your requirements</Label>
                <Input
                  id="specialNeeds"
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  placeholder="e.g. hearing impairment, mobility needs, anxiety support..."
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Banner - Show when instructor will assign slots */}
        {!requiresSlotSelection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 sm:p-6 mb-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <UserCog className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  {bookingMode === 'auto_assign' ? 'Your lessons will be scheduled automatically' : 'Your instructor will schedule your lessons'}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {bookingMode === 'auto_assign' 
                    ? 'After payment, our system will automatically find the best available times for your lessons based on your instructor\'s availability. You\'ll receive confirmation with your lesson schedule shortly.'
                    : 'After payment, your instructor will contact you to arrange lesson times that work best for both of you. You\'ll receive confirmation once your lessons are scheduled.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Lesson Scheduler - Only show for pupil_choice mode */}
        {requiresSlotSelection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Select Your Lesson Slots
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Schedule {hours} hours across multiple lessons
                </p>
              </div>
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
              onSlotsChange={handleSlotsChange}
            />
          </motion.div>
        )}

        {/* Step 3: Payment */}
        <CoursePaymentBlock
          courseName={courseName}
          hours={hours}
          instructorName={instructor.name}
          locationName={locationName || instructor.home_postcode}
          totalPrice={totalPrice}
          upsellTotal={upsellTotal}
          depositEnabled={depositEnabled}
          depositAmount={depositAmount}
          depositDeadlineDays={depositDeadlineDays}
          paymentOption={paymentOption}
          setPaymentOption={setPaymentOption}
          canSubmit={canSubmit}
          isPupilDetailsComplete={isPupilDetailsComplete}
          isFullyScheduled={isFullyScheduled}
          requiresSlotSelection={requiresSlotSelection}
          hoursRemaining={Math.max(0, hours - scheduledHours)}
          klarnaEnabled={klarnaEnabled}
          clearpayEnabled={clearpayEnabled}
          instantBankPayEnabled={instantBankPayEnabled}
          cashPaymentsEnabled={cashPaymentsEnabled}
          squareAvailable={gatewayHealth.square.available}
          clearpayAvailable={gatewayHealth.clearpay.available}
          isElavonLoading={isElavonLoading}
          isKlarnaLoading={isKlarnaLoading}
          isClearpayLoading={isClearpayLoading}
          isInstantBankPayLoading={isInstantBankPayLoading}
          isCashProcessing={isCashProcessing}
          onCardCheckout={handleElavonCheckout}
          onKlarnaCheckout={handleKlarnaCheckout}
          onClearpayCheckout={handleClearpayCheckout}
          onBankCheckout={handleInstantBankPay}
          onCashCheckout={handleCashPayment}
        />

        {showHostedFields && courseDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Enter card details
              </h3>
              <button
                onClick={() => setShowHostedFields(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
            <SquarePaymentForm
              amount={paymentOption === 'deposit' && depositEnabled ? depositAmount : totalPrice + upsellTotal}
              pupilId={bookingPupilId || undefined}
              instructorId={instructor.id}
              customerName={pupilName.trim()}
              customerEmail={pupilEmail.trim()}
              onCancel={() => setShowHostedFields(false)}
              onPaid={async () => {
                const isDepositPayment = paymentOption === 'deposit' && depositEnabled;
                const fullPaymentAmount = totalPrice + upsellTotal;
                const pupilId = await ensureBookingCreated(
                  isDepositPayment ? 'deposit' : 'full',
                  isDepositPayment ? depositAmount : fullPaymentAmount
                );
                toast.success("Payment successful!");
                if (pupilId) {
                  await triggerConfirmBooking(pupilId);
                  navigate(`/booking-confirmation?pupilId=${pupilId}&npi=success`);
                }
              }}
            />
          </motion.div>
        )}

        {/* Cancellation Policy */}
        {cancellationPolicyText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm mt-6"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Cancellation Policy
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {cancellationPolicyText}
            </p>
          </motion.div>
        )}
      </div>

      {/* Klarna Payment Modal */}
      {courseDetails && (
        <KlarnaPaymentModal
          open={showKlarnaModal}
          onClose={() => setShowKlarnaModal(false)}
          amount={totalPrice + upsellTotal}
          merchantReference={klarnaMerchantReference}
          orderDescription={`${courseName} - ${hours} Hour Driving Course`}
          onSuccess={handleKlarnaSuccess}
          consumer={{
            givenName: pupilName.trim().split(" ")[0] || pupilName.trim(),
            familyName: pupilName.trim().split(" ").slice(1).join(" ") || pupilName.trim(),
            email: pupilEmail.trim(),
            phone: pupilPhone.trim(),
          }}
          billing={{
            streetAddress: pupilAddress.trim(),
            postalCode: pupilPostcode.trim().toUpperCase(),
            city: locationName || "UK",
            country: "GB",
          }}
          pupilId={bookingPupilId}
          instructorId={instructor?.id ?? null}
        />
      )}
    </MainLayout>
  );
}
