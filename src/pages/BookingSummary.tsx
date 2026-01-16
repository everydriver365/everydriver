import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Car, CheckCircle, CreditCard, User, Award, ShieldCheck, Star, Loader2, Calendar, Play, Backpack, AlertCircle, FileText, Banknote } from "lucide-react";
import { format, parseISO, startOfDay, addDays, getDay, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonScheduler } from "@/components/booking/LessonScheduler";
import { KlarnaPaymentWidget } from "@/components/booking/KlarnaPaymentWidget";
import { NPIHostedFields } from "@/components/booking/NPIHostedFields";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentGatewayHealth } from "@/hooks/usePaymentGatewayHealth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import ideal4FinanceLogo from "@/assets/logo-ideal4finance.png";

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
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearpayLoading, setIsClearpayLoading] = useState(false);
  const [isKlarnaLoading, setIsKlarnaLoading] = useState(false);
  const [isNPILoading, setIsNPILoading] = useState(false);
  const [isSquareLoading, setIsSquareLoading] = useState(false);
  const [isElavonLoading, setIsElavonLoading] = useState(false);
  const [isWooLoading, setIsWooLoading] = useState(false);
  const [bookingPupilId, setBookingPupilId] = useState<string | null>(null);
  
  // WooCommerce hybrid flow state
  const [wooOrder, setWooOrder] = useState<{
    orderId: number;
    orderKey: string;
    orderRef: string;
  } | null>(null);
  const [showWooPaymentOptions, setShowWooPaymentOptions] = useState(false);
  
  // Klarna inline widget state
  const [klarnaSession, setKlarnaSession] = useState<{
    clientToken: string;
    sessionId: string;
    paymentMethodCategories: Array<{ identifier: string; name: string }>;
    orderDetails: {
      amount: number;
      currency: string;
      merchantReference: string;
      confirmUrl: string;
      cancelUrl: string;
    };
  } | null>(null);
  const [showKlarnaWidget, setShowKlarnaWidget] = useState(false);
  
  // NPI Hosted Fields state (embedded card form)
  const [showHostedFields, setShowHostedFields] = useState(false);

  const hours = parseInt(searchParams.get("hours") || "10");
  const selectedDateParam = searchParams.get("date");
  const selectedDate = selectedDateParam ? parseISO(selectedDateParam) : null;

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

      const [instructorRes, templateRes, instructorCourseRes, reviewsRes, workingHoursRes, dateOverridesRes] = await Promise.all([
        supabase.from("instructors").select("*").eq("id", instructorId).maybeSingle(),
        supabase.from("course_templates").select("*").eq("course_hours", hours).maybeSingle(),
        supabase.from("instructor_courses").select("course_image_url").eq("instructor_id", instructorId).eq("course_hours", hours).maybeSingle(),
        supabase.from("course_reviews").select("*").eq("instructor_id", instructorId).eq("course_hours", hours).order("review_date", { ascending: false }).limit(5),
        supabase.from("instructor_working_hours").select("day_of_week, is_active").eq("instructor_id", instructorId),
        supabase.from("instructor_date_overrides").select("override_date, override_end_date, is_available").eq("instructor_id", instructorId),
      ]);

      if (instructorRes.error || !instructorRes.data) {
        console.error("Error fetching instructor:", instructorRes.error);
        setLoading(false);
        return;
      }

      const instructor = instructorRes.data;
      const template = templateRes.data;
      const instructorCourse = instructorCourseRes.data;
      
      const hourlyRate = instructor.hourly_rate || 40;
      const courseName = template?.course_name || (hours === 28 ? "Test in a Week" : `${hours} Hour Course`);
      const courseImageUrl = instructorCourse?.course_image_url || template?.default_image_url || null;

      fetchLocationName(instructor.home_postcode);

      setCourseDetails({
        instructor: {
          ...instructor,
          home_address: instructor.home_address || null,
          preferred_lesson_length: instructor.preferred_lesson_length || 60,
          booking_advance_days: instructor.booking_advance_days || 28,
          available_from: instructor.available_from || null,
          allowed_lesson_lengths: instructor.allowed_lesson_lengths || null,
          buffer_minutes: instructor.buffer_minutes || 15,
          car_image_url: instructor.car_image_url || null,
          welcome_video_url: instructor.welcome_video_url || null,
        },
        hours,
        courseName,
        totalPrice: hours * hourlyRate,
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
  }, [instructorId, hours, findNextAvailableDate]);

  const handleSlotsChange = useCallback((slots: SelectedSlot[]) => {
    setSelectedSlots(slots);
  }, []);

  const scheduledHours = selectedSlots.reduce((acc, slot) => acc + slot.duration / 60, 0);
  const isFullyScheduled = scheduledHours >= hours;
  const isPupilDetailsComplete = pupilName.trim() && pupilEmail.trim() && pupilPhone.trim() && pupilAddress.trim() && pupilPostcode.trim();
  const canSubmit = isFullyScheduled && isPupilDetailsComplete && !isSubmitting;

  const ensureBookingCreated = async (): Promise<string | null> => {
    if (!courseDetails) return null;
    if (bookingPupilId) return bookingPupilId;

    const { data, error } = await supabase.functions.invoke("create-booking", {
      body: {
        instructorId: instructor.id,
        pupilName: pupilName.trim(),
        pupilEmail: pupilEmail.trim(),
        pupilPhone: pupilPhone.trim(),
        pupilAddress: pupilAddress.trim(),
        pupilPostcode: pupilPostcode.trim().toUpperCase(),
        courseType: courseName,
        courseHours: hours,
        totalPrice,
        slots: selectedSlots.map((slot) => ({
          date: format(slot.date, "yyyy-MM-dd"),
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
        })),
      },
    });

    if (error) {
      console.error("Booking error:", error);
      toast.error("Failed to create your booking. Please try again.");
      return null;
    }

    setBookingPupilId(data.pupilId);
    toast.success(`Booking confirmed! ${data.lessonsCreated} lessons scheduled.`);
    return data.pupilId as string;
  };

  const handleBookingSubmit = async () => {
    if (!canSubmit || !courseDetails) return;

    setIsSubmitting(true);
    try {
      const pupilId = await ensureBookingCreated();
      if (!pupilId) return;
      navigate(`/booking-confirmation?pupilId=${pupilId}`);
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearpayCheckout = async () => {
    if (!isFullyScheduled || !isPupilDetailsComplete || !courseDetails) {
      toast.error("Please complete all details and schedule all lessons first");
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
          amount: totalPrice,
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
              name: `${courseName} - ${hours} Hour Driving Course`,
              quantity: 1,
              price: totalPrice,
            },
          ],
          redirectUrls: {
            confirmUrl: `${currentUrl}/booking-confirmation?pupilId=${pupilId}&clearpay=success&ref=${merchantReference}`,
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
    if (!isFullyScheduled || !isPupilDetailsComplete || !courseDetails) {
      toast.error("Please complete all details and schedule all lessons first");
      return;
    }

    setIsKlarnaLoading(true);
    try {
      const pupilId = await ensureBookingCreated();
      if (!pupilId) return;

      const merchantReference = `${instructor.id}-${Date.now()}`;
      const currentUrl = window.location.origin;

      const confirmUrl = `${currentUrl}/booking-confirmation?pupilId=${pupilId}&klarna=success&ref=${merchantReference}`;
      const cancelUrl = `${currentUrl}/book/${instructor.id}?hours=${hours}&klarna=cancelled`;

      const nameParts = pupilName.trim().split(" ");
      const givenName = nameParts[0] || pupilName.trim();
      const familyName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : givenName;

      const { data, error } = await supabase.functions.invoke("klarna-checkout", {
        body: {
          amount: totalPrice,
          currency: "GBP",
          merchantReference,
          consumer: {
            givenName,
            familyName,
            email: pupilEmail.trim(),
            phone: pupilPhone.trim(),
          },
          billing: {
            streetAddress: pupilAddress.trim(),
            postalCode: pupilPostcode.trim().toUpperCase(),
            city: locationName || "UK",
            country: "GB",
          },
          items: [
            {
              name: `${courseName} - ${hours} Hour Driving Course`,
              quantity: 1,
              unitPrice: totalPrice,
            },
          ],
          redirectUrls: {
            confirmUrl,
            cancelUrl,
          },
        },
      });

      if (error) {
        console.error("Klarna checkout error:", error);
        toast.error("Failed to start Klarna checkout. Please try again.");
        return;
      }

      // Klarna Checkout API returns a redirect URL for the hosted payment page
      if (data?.redirectUrl) {
        toast.success("Redirecting to Klarna...");
        window.location.href = data.redirectUrl;
      } else if (data?.htmlSnippet) {
        // If we get HTML snippet instead, we can still try to redirect
        console.log("Klarna returned HTML snippet, attempting to find checkout URL");
        toast.error("Klarna checkout not available. Please try another payment method.");
      } else {
        console.error("Klarna response missing redirect URL:", data);
        toast.error(data?.error || "Could not start Klarna checkout. Please try another payment method.");
      }
    } catch (err) {
      console.error("Klarna error:", err);
      toast.error("Something went wrong with Klarna. Please try again.");
    } finally {
      setIsKlarnaLoading(false);
    }
  };

  const handleKlarnaAuthorized = (authorizationToken: string) => {
    if (klarnaSession) {
      const confirmUrl = klarnaSession.orderDetails.confirmUrl;
      window.location.href = `${confirmUrl}&authorization_token=${authorizationToken}`;
    }
  };

  const handleKlarnaError = (error: string) => {
    toast.error(error);
    setShowKlarnaWidget(false);
    setKlarnaSession(null);
  };

  const handleKlarnaCancel = () => {
    setShowKlarnaWidget(false);
    setKlarnaSession(null);
  };

  const handleNPICheckout = async () => {
    if (!isFullyScheduled || !isPupilDetailsComplete || !courseDetails) {
      toast.error("Please complete all details and schedule all lessons first");
      return;
    }

    setIsNPILoading(true);
    try {
      const pupilId = await ensureBookingCreated();
      if (!pupilId) return;

      const orderReference = `NPI-${instructor.id.slice(0, 8)}-${Date.now()}`;
      const currentUrl = window.location.origin;

      const { data, error } = await supabase.functions.invoke("npi-checkout", {
        body: {
          amount: totalPrice,
          currency: "GBP",
          orderReference,
          customerEmail: pupilEmail.trim(),
          customerName: pupilName.trim(),
          description: `${courseName} - ${hours} Hour Driving Course`,
          returnUrl: `${currentUrl}/booking-confirmation?pupilId=${pupilId}&npi=success&ref=${orderReference}`,
          cancelUrl: `${currentUrl}/book/${instructor.id}?hours=${hours}&npi=cancelled`,
          instructorId: instructor.id,
          pupilId: pupilId,
          // HPP customization from CMS
          formResponsive: true,
          merchantName: getSetting("npi_merchant_name") || undefined,
        },
      });

      if (error) {
        console.error("NPI checkout error:", error);
        toast.error("Failed to start NPI checkout. Please try again.");
        return;
      }

      // NPI HPP requires form POST submission (not URL redirect)
      if (data?.gatewayUrl && data?.formData) {
        // Create and submit hidden form to NPI gateway
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.gatewayUrl;
        form.style.display = 'none';

        // Add all form fields from the response
        for (const [key, value] of Object.entries(data.formData)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }

        document.body.appendChild(form);
        toast.success("Redirecting to payment page...");
        form.submit();
      } else {
        toast.error("Could not get NPI payment form data");
      }
    } catch (err) {
      console.error("NPI error:", err);
      toast.error("Something went wrong with NPI Payments. Please try again.");
    } finally {
      setIsNPILoading(false);
    }
  };

  // Handler for showing embedded hosted fields
  const handleShowHostedFields = async () => {
    if (!isFullyScheduled || !isPupilDetailsComplete || !courseDetails) {
      toast.error("Please complete all details and schedule all lessons first");
      return;
    }

    const pupilId = await ensureBookingCreated();
    if (!pupilId) return;
    
    setShowHostedFields(true);
  };

  const handleSquareCheckout = async () => {
    if (!isFullyScheduled || !isPupilDetailsComplete || !courseDetails) {
      toast.error("Please complete all details and schedule all lessons first");
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
          amount: totalPrice,
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
    if (!isFullyScheduled || !isPupilDetailsComplete || !courseDetails) {
      toast.error("Please complete all details and schedule all lessons first");
      return;
    }

    setIsElavonLoading(true);
    try {
      const pupilId = await ensureBookingCreated();
      if (!pupilId) return;

      const orderReference = `ELV-${instructor.id.slice(0, 8)}-${Date.now()}`;
      const currentUrl = window.location.origin;

      const { data, error } = await supabase.functions.invoke("elavon-checkout", {
        body: {
          amount: totalPrice,
          orderReference,
          customerEmail: pupilEmail.trim(),
          customerName: pupilName.trim(),
          description: `${courseName} - ${hours} Hour Driving Course`,
          returnUrl: `${currentUrl}/booking-confirmation?pupilId=${pupilId}&elavon=success&ref=${orderReference}`,
          cancelUrl: `${currentUrl}/book/${instructor.id}?hours=${hours}&elavon=cancelled`,
          instructorId: instructor.id,
          pupilId: pupilId,
        },
      });

      if (error) {
        console.error("Elavon checkout error:", error);
        toast.error("Failed to start Elavon checkout. Please try again.");
        return;
      }

      // Elavon HPP requires form POST submission (same as NPI)
      if (data?.formAction && data?.formFields) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.formAction;
        form.style.display = 'none';

        for (const [key, value] of Object.entries(data.formFields)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }

        document.body.appendChild(form);
        toast.success("Redirecting to payment page...");
        form.submit();
      } else {
        toast.error("Could not get Elavon payment form data");
      }
    } catch (err) {
      console.error("Elavon error:", err);
      toast.error("Something went wrong with Elavon. Please try again.");
    } finally {
      setIsElavonLoading(false);
    }
  };

  // Step 1: Create WooCommerce order and show in-app payment options
  const handleWooCommerceCheckout = async () => {
    if (!isFullyScheduled || !isPupilDetailsComplete || !courseDetails) {
      toast.error("Please complete all details and schedule all lessons first");
      return;
    }

    setIsWooLoading(true);
    try {
      const pupilId = await ensureBookingCreated();
      if (!pupilId) return;

      const orderRef = `WOO-${instructor.id.slice(0, 8)}-${Date.now()}`;

      const { data, error } = await supabase.functions.invoke("woocommerce-checkout", {
        body: {
          amount: totalPrice,
          courseName: courseName,
          courseHours: hours,
          customerEmail: pupilEmail.trim(),
          customerName: pupilName.trim(),
          customerPhone: pupilPhone.trim(),
          orderRef,
          instructorId: instructor.id,
          pupilId,
        },
      });

      if (error) {
        console.error("WooCommerce checkout error:", error);
        toast.error("Failed to create WooCommerce order. Please try again.");
        return;
      }

      if (data?.checkoutUrl) {
        // Redirect directly to WooCommerce checkout page
        toast.success("Redirecting to payment...");
        window.location.href = data.checkoutUrl;
      } else if (data?.orderId) {
        // Fallback: Store WooCommerce order details and show in-app payment options
        setWooOrder({
          orderId: data.orderId,
          orderKey: data.orderKey,
          orderRef,
        });
        setShowWooPaymentOptions(true);
        toast.success("Order created! Choose your payment method below.");
      } else {
        toast.error("Could not create WooCommerce order");
      }
    } catch (err) {
      console.error("WooCommerce error:", err);
      toast.error("Something went wrong with WooCommerce. Please try again.");
    } finally {
      setIsWooLoading(false);
    }
  };

  // Step 2: After in-app payment succeeds, mark WooCommerce order as paid
  const markWooOrderPaid = async (paymentMethod: string, transactionId?: string) => {
    if (!wooOrder) return;

    try {
      const { data, error } = await supabase.functions.invoke("woocommerce-update-order", {
        body: {
          orderId: wooOrder.orderId,
          status: "completed",
          transactionId: transactionId || wooOrder.orderRef,
          paymentMethod: paymentMethod.toLowerCase(),
          paymentMethodTitle: paymentMethod,
        },
      });

      if (error) {
        console.error("Failed to update WooCommerce order:", error);
        // Don't block the user - payment succeeded, just log the sync issue
      } else {
        console.log("WooCommerce order marked as paid:", data);
      }
    } catch (err) {
      console.error("WooCommerce sync error:", err);
    }
  };

  // Modified payment handlers for WooCommerce hybrid flow
  const handleWooNPIPayment = async () => {
    if (!wooOrder || !courseDetails) return;
    
    setIsNPILoading(true);
    try {
      const orderReference = wooOrder.orderRef;
      const currentUrl = window.location.origin;

      const { data, error } = await supabase.functions.invoke("npi-checkout", {
        body: {
          amount: totalPrice,
          currency: "GBP",
          orderReference,
          customerEmail: pupilEmail.trim(),
          customerName: pupilName.trim(),
          description: `${courseName} - ${hours} Hour Driving Course`,
          returnUrl: `${currentUrl}/booking-confirmation?pupilId=${bookingPupilId}&npi=success&ref=${orderReference}&wooOrderId=${wooOrder.orderId}`,
          cancelUrl: `${currentUrl}/book/${instructor.id}?hours=${hours}&npi=cancelled`,
          instructorId: instructor.id,
          pupilId: bookingPupilId,
        },
      });

      if (error) {
        console.error("NPI checkout error:", error);
        toast.error("Failed to start card payment. Please try again.");
        return;
      }

      if (data?.redirectUrl) {
        // Mark WooCommerce order as processing before redirect
        await markWooOrderPaid("Card (NPI)", orderReference);
        window.location.href = data.redirectUrl;
      } else {
        toast.error("Could not get payment URL");
      }
    } catch (err) {
      console.error("NPI error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsNPILoading(false);
    }
  };

  const handleWooClearpayPayment = async () => {
    if (!wooOrder || !courseDetails) return;

    setIsClearpayLoading(true);
    try {
      const merchantReference = wooOrder.orderRef;
      const currentUrl = window.location.origin;

      const nameParts = pupilName.trim().split(" ");
      const givenNames = nameParts.slice(0, -1).join(" ") || nameParts[0];
      const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

      const { data, error } = await supabase.functions.invoke("clearpay-checkout", {
        body: {
          amount: totalPrice,
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
              name: `${courseName} - ${hours} Hour Driving Course`,
              quantity: 1,
              price: totalPrice,
            },
          ],
          redirectUrls: {
            confirmUrl: `${currentUrl}/booking-confirmation?pupilId=${bookingPupilId}&clearpay=success&ref=${merchantReference}&wooOrderId=${wooOrder.orderId}`,
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
        await markWooOrderPaid("Clearpay", merchantReference);
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

  const handleWooKlarnaPayment = async () => {
    if (!wooOrder || !courseDetails) return;

    setIsKlarnaLoading(true);
    try {
      const merchantReference = wooOrder.orderRef;
      const currentUrl = window.location.origin;

      const confirmUrl = `${currentUrl}/booking-confirmation?pupilId=${bookingPupilId}&klarna=success&ref=${merchantReference}&wooOrderId=${wooOrder.orderId}`;
      const cancelUrl = `${currentUrl}/book/${instructor.id}?hours=${hours}&klarna=cancelled`;

      const nameParts = pupilName.trim().split(" ");
      const givenName = nameParts[0] || pupilName.trim();
      const familyName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : givenName;

      const { data, error } = await supabase.functions.invoke("klarna-checkout", {
        body: {
          amount: totalPrice,
          currency: "GBP",
          merchantReference,
          consumer: {
            givenName,
            familyName,
            email: pupilEmail.trim(),
            phone: pupilPhone.trim(),
          },
          billing: {
            streetAddress: pupilAddress.trim(),
            postalCode: pupilPostcode.trim().toUpperCase(),
            city: locationName || "UK",
            country: "GB",
          },
          items: [
            {
              name: `${courseName} - ${hours} Hour Driving Course`,
              quantity: 1,
              unitPrice: totalPrice,
            },
          ],
          redirectUrls: {
            confirmUrl,
            cancelUrl,
          },
        },
      });

      if (error) {
        console.error("Klarna checkout error:", error);
        toast.error("Failed to start Klarna checkout. Please try again.");
        return;
      }

      if (data?.clientToken && data?.sessionId) {
        setKlarnaSession({
          clientToken: data.clientToken,
          sessionId: data.sessionId,
          paymentMethodCategories: data.paymentMethodCategories || [],
          orderDetails: {
            amount: data.orderDetails?.amount || Math.round(totalPrice * 100),
            currency: data.orderDetails?.currency || "GBP",
            merchantReference: data.orderDetails?.merchantReference || merchantReference,
            confirmUrl: data.orderDetails?.confirmUrl || confirmUrl,
            cancelUrl: data.orderDetails?.cancelUrl || cancelUrl,
          },
        });
        setShowKlarnaWidget(true);
        setShowWooPaymentOptions(false);
      } else if (data?.redirectUrl) {
        await markWooOrderPaid("Klarna", merchantReference);
        window.location.href = data.redirectUrl;
      } else {
        toast.error("Could not start Klarna checkout. Please try another payment method.");
      }
    } catch (err) {
      console.error("Klarna error:", err);
      toast.error("Something went wrong with Klarna. Please try again.");
    } finally {
      setIsKlarnaLoading(false);
    }
  };

  const handleCancelWooPayment = () => {
    setShowWooPaymentOptions(false);
    setWooOrder(null);
    toast.info("Payment cancelled. You can choose another option.");
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading course details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!courseDetails) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <Button onClick={() => navigate("/courses")} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { instructor, courseName, totalPrice, courseImageUrl, courseDescription, features, template } = courseDetails;
  const brandColour = instructor.brand_colour || "#1e3a5f";

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

            {/* Price Badge */}
            <div className="hidden sm:block bg-white text-primary rounded-xl px-4 py-2 shadow-lg">
              <span className="text-2xl font-bold">£{totalPrice}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
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

        {/* Progress Indicator */}
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
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${isFullyScheduled ? 'bg-emerald-500 text-white' : isPupilDetailsComplete ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {isFullyScheduled ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <span className={`text-sm font-medium ${isFullyScheduled ? 'text-emerald-600' : isPupilDetailsComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
              Choose slots
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-border mx-3" />
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${canSubmit ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              3
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
            <div className="space-y-2">
              <Label htmlFor="pupilPostcode">Postcode *</Label>
              <Input
                id="pupilPostcode"
                value={pupilPostcode}
                onChange={(e) => setPupilPostcode(e.target.value)}
                placeholder="SW1A 1AA"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pupilAddress">Pickup Address *</Label>
              <Input
                id="pupilAddress"
                value={pupilAddress}
                onChange={(e) => setPupilAddress(e.target.value)}
                placeholder="123 High Street, London"
              />
            </div>
          </div>
        </motion.div>

        {/* Step 2: Lesson Scheduler */}
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
            bookingAdvanceDays={instructor.booking_advance_days || 28}
            availableFrom={instructor.available_from}
            allowedLessonLengths={instructor.allowed_lesson_lengths || undefined}
            onSlotsChange={handleSlotsChange}
          />
        </motion.div>

        {/* Step 3: Payment Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment
            </h2>
            <div className="text-right">
              <div className="text-2xl font-bold">£{totalPrice}</div>
              <div className="text-xs text-muted-foreground">Total for {hours} hours</div>
            </div>
          </div>

          {!canSubmit && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4 text-center">
              <span className="text-amber-700 text-sm font-medium">
                {!isPupilDetailsComplete 
                  ? "Please complete all your details above"
                  : `Please schedule all ${hours} hours first`}
              </span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Ideal4Finance - Provisional Booking */}
            <button
              onClick={handleBookingSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full rounded-lg border-2 border-orange-400 p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-950/50 dark:hover:to-amber-950/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-2">
                <img 
                  src={ideal4FinanceLogo} 
                  alt="Ideal4Finance" 
                  className="h-6 object-contain"
                />
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  {isSubmitting ? "Processing..." : "Finance Available"}
                </span>
              </div>
              <div className="font-semibold text-sm text-orange-900 dark:text-orange-100">
                {isSubmitting ? "Creating Booking..." : "Provisional Booking"}
              </div>
              <div className="text-xs text-orange-700/80 dark:text-orange-300/80">
                Reserve your slots now, arrange finance after
              </div>
            </button>

            {/* NPI Card Payment - Redirect to HPP */}
            <button
              onClick={handleNPICheckout}
              disabled={!canSubmit || isNPILoading || !gatewayHealth.npi.available}
              className="w-full rounded-lg border-2 border-emerald-500 p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-950/50 dark:hover:to-green-950/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Recommended
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white flex items-center gap-1">
                  <Banknote className="h-3 w-3" />
                  Card
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {isNPILoading ? "Loading..." : "Secure Payment"}
                </span>
              </div>
              <div className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">Pay by Debit/Credit Card</div>
              <div className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Visa, Mastercard, Amex</div>
            </button>


            {/* Clearpay - Confirmed Working */}
            <button
              onClick={handleClearpayCheckout}
              disabled={!canSubmit || isClearpayLoading || !gatewayHealth.clearpay.available}
              className="w-full rounded-lg border-2 border-[#b2fce4] p-4 bg-[#b2fce4]/10 hover:bg-[#b2fce4]/20 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-[#b2fce4] px-2 py-0.5 text-xs font-bold text-black">
                  clearpay
                </span>
                <span className="text-xs text-muted-foreground">
                  {isClearpayLoading ? "Loading..." : "Pay in 4"}
                </span>
              </div>
              <div className="font-semibold text-sm">4 × £{(totalPrice / 4).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Interest-free instalments</div>
            </button>

            {/* Klarna */}
            {gatewayHealth.klarna.available ? (
              <button
                onClick={handleKlarnaCheckout}
                disabled={!canSubmit || isKlarnaLoading}
                className="w-full rounded-lg border p-4 bg-[#ffb3c7]/10 hover:bg-[#ffb3c7]/20 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded bg-[#ffb3c7] px-2 py-0.5 text-xs font-bold text-black">
                    Klarna.
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isKlarnaLoading ? "Loading..." : "Pay in 3"}
                  </span>
                </div>
                <div className="font-semibold text-sm">3 × £{(totalPrice / 3).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Interest-free instalments</div>
              </button>
            ) : (
              <div className="w-full rounded-lg border border-dashed p-4 bg-muted/30 text-left opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded bg-[#ffb3c7]/50 px-2 py-0.5 text-xs font-bold text-muted-foreground">
                    Klarna.
                  </span>
                  <span className="text-xs text-amber-600">Coming Soon</span>
                </div>
                <div className="font-semibold text-sm text-muted-foreground">3 × £{(totalPrice / 3).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Interest-free instalments</div>
              </div>
            )}
          </div>

          {/* Klarna Inline Widget */}
          {showKlarnaWidget && klarnaSession && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-lg border-2 border-[#FFB3C7] bg-[#FFB3C7]/5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="rounded bg-[#FFB3C7] px-2 py-0.5 text-xs font-bold text-black">
                    Klarna.
                  </span>
                  Complete Your Payment
                </h3>
                <span className="text-lg font-bold">
                  £{(klarnaSession.orderDetails.amount / 100).toFixed(2)}
                </span>
              </div>
              <KlarnaPaymentWidget
                clientToken={klarnaSession.clientToken}
                sessionId={klarnaSession.sessionId}
                paymentMethodCategories={klarnaSession.paymentMethodCategories}
                orderDetails={klarnaSession.orderDetails}
                onAuthorized={handleKlarnaAuthorized}
                onError={handleKlarnaError}
                onCancel={handleKlarnaCancel}
              />
            </motion.div>
          )}

          {/* NPI Hosted Fields - Embedded Card Form */}
          {showHostedFields && bookingPupilId && courseDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Enter Card Details
                </h3>
                <button 
                  onClick={() => setShowHostedFields(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
              <NPIHostedFields
                amount={totalPrice}
                orderReference={`NPI-${instructor.id.slice(0, 8)}-${Date.now()}`}
                customerEmail={pupilEmail.trim()}
                customerName={pupilName.trim()}
                returnUrl={`${window.location.origin}/booking-confirmation?pupilId=${bookingPupilId}&npi=success`}
                instructorId={instructor.id}
                pupilId={bookingPupilId}
                brandColor={getSetting("npi_brand_color") || "#3b82f6"}
                onSuccess={() => {
                  toast.success("Payment successful!");
                }}
                onError={(error) => {
                  toast.error(error);
                  setShowHostedFields(false);
                }}
              />
            </motion.div>
          )}

          {/* WooCommerce In-App Payment Options */}
          {showWooPaymentOptions && wooOrder && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-lg border-2 border-purple-500 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="rounded bg-purple-600 px-2 py-0.5 text-xs font-bold text-white">
                    WooCommerce
                  </span>
                  Choose Payment Method
                </h3>
                <button 
                  onClick={handleCancelWooPayment}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Order <span className="font-medium">#{wooOrder.orderId}</span> created. 
                Select how you'd like to pay:
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* NPI Card Payment */}
                <button
                  onClick={handleWooNPIPayment}
                  disabled={isNPILoading}
                  className="w-full rounded-lg border-2 border-emerald-400 p-3 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 hover:from-emerald-100 hover:to-green-100 transition-all text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">
                      {isNPILoading ? "Loading..." : "Debit/Credit Card"}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                    Visa, Mastercard, Amex
                  </div>
                </button>

                {/* Clearpay */}
                <button
                  onClick={handleWooClearpayPayment}
                  disabled={isClearpayLoading}
                  className="w-full rounded-lg border-2 border-[#b2fce4] p-3 bg-[#b2fce4]/10 hover:bg-[#b2fce4]/20 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-[#b2fce4] px-1.5 py-0.5 text-xs font-bold text-black">
                      clearpay
                    </span>
                  </div>
                  <div className="font-semibold text-sm">
                    {isClearpayLoading ? "Loading..." : `4 × £${(totalPrice / 4).toFixed(2)}`}
                  </div>
                  <div className="text-xs text-muted-foreground">Interest-free</div>
                </button>

                {/* Klarna */}
                <button
                  onClick={handleWooKlarnaPayment}
                  disabled={isKlarnaLoading}
                  className="w-full rounded-lg border-2 border-[#ffb3c7] p-3 bg-[#ffb3c7]/10 hover:bg-[#ffb3c7]/20 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-[#ffb3c7] px-1.5 py-0.5 text-xs font-bold text-black">
                      Klarna.
                    </span>
                  </div>
                  <div className="font-semibold text-sm">
                    {isKlarnaLoading ? "Loading..." : `3 × £${(totalPrice / 3).toFixed(2)}`}
                  </div>
                  <div className="text-xs text-muted-foreground">Pay in 3</div>
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}
