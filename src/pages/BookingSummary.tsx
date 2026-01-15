import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Car, CheckCircle, CreditCard, User, Award, ShieldCheck, Star, Loader2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO, startOfDay, addDays, getDay, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonScheduler } from "@/components/booking/LessonScheduler";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  
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
  const [isElavonLoading, setIsElavonLoading] = useState(false);

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

  const handleBookingSubmit = async () => {
    if (!canSubmit || !courseDetails) return;
    
    setIsSubmitting(true);
    try {
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
          slots: selectedSlots.map(slot => ({
            date: format(slot.date, "yyyy-MM-dd"),
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration,
          })),
        },
      });

      if (error) {
        console.error("Booking error:", error);
        toast.error("Failed to complete booking. Please try again.");
        return;
      }

      toast.success(`Booking confirmed! ${data.lessonsCreated} lessons scheduled.`);
      navigate(`/booking-confirmation?pupilId=${data.pupilId}`);
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
          items: [{
            name: `${courseName} - ${hours} Hour Driving Course`,
            quantity: 1,
            price: totalPrice,
          }],
          redirectUrls: {
            confirmUrl: `${currentUrl}/booking-confirmation?clearpay=success&ref=${merchantReference}`,
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
      const merchantReference = `${instructor.id}-${Date.now()}`;
      const currentUrl = window.location.origin;
      
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
          items: [{
            name: `${courseName} - ${hours} Hour Driving Course`,
            quantity: 1,
            unitPrice: totalPrice,
          }],
          redirectUrls: {
            confirmUrl: `${currentUrl}/booking-confirmation?klarna=success&ref=${merchantReference}`,
            cancelUrl: `${currentUrl}/book/${instructor.id}?hours=${hours}&klarna=cancelled`,
          },
        },
      });

      if (error) {
        console.error("Klarna checkout error:", error);
        toast.error("Failed to start Klarna checkout. Please try again.");
        return;
      }

      if (data?.htmlSnippet) {
        const klarnaWindow = window.open("", "_blank");
        if (klarnaWindow) {
          klarnaWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head><title>Klarna Checkout</title></head>
            <body style="margin:0;padding:20px;font-family:sans-serif;">
              <div id="klarna-checkout-container">${data.htmlSnippet}</div>
            </body>
            </html>
          `);
          klarnaWindow.document.close();
        } else {
          toast.error("Please allow popups for Klarna checkout");
        }
      } else if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error("Could not get Klarna checkout");
      }
    } catch (err) {
      console.error("Klarna error:", err);
      toast.error("Something went wrong with Klarna. Please try again.");
    } finally {
      setIsKlarnaLoading(false);
    }
  };

  const handleNPICheckout = async () => {
    if (!isFullyScheduled || !isPupilDetailsComplete || !courseDetails) {
      toast.error("Please complete all details and schedule all lessons first");
      return;
    }

    setIsNPILoading(true);
    try {
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
          returnUrl: `${currentUrl}/booking-confirmation?npi=success&ref=${orderReference}`,
          cancelUrl: `${currentUrl}/book/${instructor.id}?hours=${hours}&npi=cancelled`,
          instructorId: instructor.id,
        },
      });

      if (error) {
        console.error("NPI checkout error:", error);
        toast.error("Failed to start NPI checkout. Please try again.");
        return;
      }

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error("Could not get NPI checkout URL");
      }
    } catch (err) {
      console.error("NPI error:", err);
      toast.error("Something went wrong with NPI Payments. Please try again.");
    } finally {
      setIsNPILoading(false);
    }
  };

  const handleElavonCheckout = async () => {
    if (!isFullyScheduled || !isPupilDetailsComplete || !courseDetails) {
      toast.error("Please complete all details and schedule all lessons first");
      return;
    }

    setIsElavonLoading(true);
    try {
      const orderReference = `ELV-${instructor.id.slice(0, 8)}-${Date.now()}`;
      const currentUrl = window.location.origin;

      const { data, error } = await supabase.functions.invoke("elavon-checkout", {
        body: {
          amount: totalPrice,
          orderReference,
          customerEmail: pupilEmail.trim(),
          customerName: pupilName.trim(),
          description: `${courseName} - ${hours} Hour Driving Course`,
          returnUrl: `${currentUrl}/booking-confirmation?elavon=success&ref=${orderReference}`,
          cancelUrl: `${currentUrl}/book/${instructor.id}?hours=${hours}&elavon=cancelled`,
          instructorId: instructor.id,
        },
      });

      if (error) {
        console.error("Elavon checkout error:", error);
        toast.error("Failed to start Elavon checkout. Please try again.");
        return;
      }

      if (data?.formAction && data?.formFields) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.formAction;
        form.style.display = "none";

        Object.entries(data.formFields as Record<string, string>).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = String(value ?? "");
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error("Could not get Elavon checkout URL");
      }
    } catch (err) {
      console.error("Elavon error:", err);
      toast.error("Something went wrong with Elavon. Please try again.");
    } finally {
      setIsElavonLoading(false);
    }
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
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${isFullyScheduled ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}>
              {isFullyScheduled ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className={`text-sm font-medium ${isFullyScheduled ? 'text-emerald-600' : 'text-foreground'}`}>
              Choose slots
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-border mx-3" />
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${isPupilDetailsComplete ? 'bg-emerald-500 text-white' : isFullyScheduled ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {isPupilDetailsComplete ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <span className={`text-sm font-medium ${isPupilDetailsComplete ? 'text-emerald-600' : isFullyScheduled ? 'text-foreground' : 'text-muted-foreground'}`}>
              Your details
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

        {/* Step 1: Lesson Scheduler */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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

        {/* Step 2: Your Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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

        {/* Step 3: Payment Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm mb-6"
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
                {!isFullyScheduled 
                  ? `Please schedule all ${hours} hours first` 
                  : "Please complete all your details above"}
              </span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Pay in Full */}
            <Button 
              size="lg"
              className="w-full gap-2 h-auto py-4"
              disabled={!canSubmit}
              onClick={handleBookingSubmit}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              <div className="text-left">
                <div className="font-semibold">{isSubmitting ? "Processing..." : "Book Now - Pay Later"}</div>
                <div className="text-xs opacity-80">Confirm booking, pay when lessons start</div>
              </div>
            </Button>

            {/* Elavon Card Payment */}
            <button
              onClick={handleElavonCheckout}
              disabled={!canSubmit || isElavonLoading}
              className="w-full rounded-lg border-2 border-primary p-4 bg-primary/5 hover:bg-primary/10 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-white">
                  Card
                </span>
                <span className="text-xs text-muted-foreground">
                  {isElavonLoading ? "Loading..." : "Pay now"}
                </span>
              </div>
              <div className="font-semibold text-sm">Pay by Card</div>
              <div className="text-xs text-muted-foreground">Visa, Mastercard, Amex</div>
            </button>

            {/* Klarna */}
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

            {/* Clearpay */}
            <button
              onClick={handleClearpayCheckout}
              disabled={!canSubmit || isClearpayLoading}
              className="w-full rounded-lg border p-4 bg-[#b2fce4]/10 hover:bg-[#b2fce4]/20 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </motion.div>

        {/* Collapsible Course Details */}
        <Collapsible open={showMoreInfo} onOpenChange={setShowMoreInfo}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-foreground mb-4">
              {showMoreInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showMoreInfo ? "Hide" : "Show"} course details & instructor info
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-6">
            {/* Instructor Card */}
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
                </div>
              </div>
            </Card>

            {/* Course Description */}
            {courseDescription && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">About This Course</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{courseDescription}</p>
              </Card>
            )}

            {/* Features */}
            {features && features.length > 0 && (
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
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
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
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </MainLayout>
  );
}
