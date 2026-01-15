import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Car, Calendar, CheckCircle, CreditCard, User, Award, ShieldCheck, Play, Star, FileText, AlertCircle, Backpack, Loader2 } from "lucide-react";
import { format, parseISO, startOfDay, addDays, getDay, isAfter, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonScheduler } from "@/components/booking/LessonScheduler";
import { CourseCard } from "@/components/CourseCard";
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

interface OtherCourse {
  course_hours: number;
  course_name: string;
  course_image_url: string | null;
  nextAvailableDate?: Date;
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
  const [otherCourses, setOtherCourses] = useState<OtherCourse[]>([]);
  const [locationName, setLocationName] = useState<string>("");
  
  // Pupil details form state
  const [pupilName, setPupilName] = useState("");
  const [pupilEmail, setPupilEmail] = useState("");
  const [pupilPhone, setPupilPhone] = useState("");
  const [pupilAddress, setPupilAddress] = useState("");
  const [pupilPostcode, setPupilPostcode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearpayLoading, setIsClearpayLoading] = useState(false);
  const [isKlarnaLoading, setIsKlarnaLoading] = useState(false);

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
    const maxDays = 90; // Look ahead 90 days

    for (let i = 0; i < maxDays; i++) {
      const day = addDays(today, i);
      const dayOfWeek = getDay(day);
      const dateStr = format(day, "yyyy-MM-dd");

      // Check available_from
      if (availableFrom && isAfter(parseISO(availableFrom), day)) {
        continue;
      }

      // Check date overrides
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

      // Check working hours
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

      // Fetch all data in parallel
      const [instructorRes, templateRes, instructorCourseRes, reviewsRes, otherCoursesRes, workingHoursRes, dateOverridesRes, allTemplatesRes] = await Promise.all([
        supabase.from("instructors").select("*").eq("id", instructorId).maybeSingle(),
        supabase.from("course_templates").select("*").eq("course_hours", hours).maybeSingle(),
        supabase.from("instructor_courses").select("course_image_url").eq("instructor_id", instructorId).eq("course_hours", hours).maybeSingle(),
        supabase.from("course_reviews").select("*").eq("instructor_id", instructorId).eq("course_hours", hours).order("review_date", { ascending: false }).limit(5),
        supabase.from("instructor_courses").select("course_hours, course_name, course_image_url").eq("instructor_id", instructorId).eq("is_active", true).neq("course_hours", hours),
        supabase.from("instructor_working_hours").select("day_of_week, is_active").eq("instructor_id", instructorId),
        supabase.from("instructor_date_overrides").select("override_date, override_end_date, is_available").eq("instructor_id", instructorId),
        supabase.from("course_templates").select("course_hours, default_image_url"),
      ]);

      if (instructorRes.error || !instructorRes.data) {
        console.error("Error fetching instructor:", instructorRes.error);
        setLoading(false);
        return;
      }

      const instructor = instructorRes.data;
      const template = templateRes.data;
      const instructorCourse = instructorCourseRes.data;
      const workingHours = workingHoursRes.data || [];
      const dateOverrides = dateOverridesRes.data || [];
      
      const hourlyRate = instructor.hourly_rate || 40;
      const courseName = template?.course_name || (hours === 28 ? "Test in a Week" : `${hours} Hour Course`);
      const courseImageUrl = instructorCourse?.course_image_url || template?.default_image_url || null;

      // Calculate next available date
      const nextAvailableDate = findNextAvailableDate(
        instructor.available_from,
        workingHours,
        dateOverrides
      );

      // Fetch location name
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
      
      // Add next available date and default images to other courses
      if (otherCoursesRes.data) {
        const templateImages = new Map(
          (allTemplatesRes.data || []).map(t => [t.course_hours, t.default_image_url])
        );
        const coursesWithDates = otherCoursesRes.data.map((course) => ({
          ...course,
          course_image_url: course.course_image_url || templateImages.get(course.course_hours) || null,
          nextAvailableDate: nextAvailableDate,
        }));
        setOtherCourses(coursesWithDates);
      }
      
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
        // Redirect to Clearpay checkout
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

      // Klarna returns HTML snippet - we need to render it or redirect
      if (data?.htmlSnippet) {
        // Open in new window with the Klarna checkout widget
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

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <div className="animate-pulse">Loading course details...</div>
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
    ));
  };

  return (
    <MainLayout>
      {/* Hero Section - Bold Design */}
      <div className="relative bg-primary overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        
        <div className="container relative py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 gap-2 -ml-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </Button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Hero Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full lg:w-96 h-56 lg:h-64 shrink-0 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20"
            >
              <img
                src={courseImageUrl || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop"}
                alt={courseName}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <Badge className="bg-white text-primary font-semibold">
                  {instructor.car_type}
                </Badge>
              </div>
            </motion.div>

            {/* Course Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 flex flex-col justify-center text-primary-foreground"
            >
              <h1 className="text-3xl lg:text-4xl font-bold">{courseName}</h1>
              
              <div className="flex items-center gap-4 mt-4">
                <Avatar className="h-14 w-14 border-4 border-white/20 shadow-lg">
                  <AvatarImage src={instructor.profile_image_url || undefined} />
                  <AvatarFallback className="bg-white text-primary font-semibold text-lg">
                    {instructor.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">{instructor.name}</div>
                  <div className="text-sm text-primary-foreground/70 flex items-center gap-1.5">
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <span className="ml-1">4.9</span>
                    <span className="text-primary-foreground/50">({reviews.length} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-primary-foreground/80">
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{hours} hours</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{locationName || instructor.home_postcode}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                  <Car className="h-4 w-4" />
                  <span>{instructor.car_make} {instructor.car_model}</span>
                </div>
              </div>

              {/* Price & Payment */}
              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="bg-white text-primary rounded-xl px-5 py-3 shadow-lg">
                  <span className="text-3xl font-bold">£{totalPrice}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#ffb3c7] px-2 py-1 text-xs font-bold text-black">Klarna.</span>
                    <span className="rounded bg-[#b2fce4] px-2 py-1 text-xs font-bold text-black">clearpay</span>
                  </div>
                  <span className="text-sm text-primary-foreground/70">from £{Math.round(totalPrice / 4)}/mo</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border bg-card p-6 shadow-md"
            >
              <h2 className="text-lg font-semibold">Course Details</h2>
              
              {/* Selected Date - Prominent Display */}
              {selectedDate && (
                <div className="mt-2 mb-4">
                  <span className="text-xl font-bold text-foreground">
                    {format(selectedDate, "EEEE, d MMMM yyyy")}
                  </span>
                </div>
              )}
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Duration */}
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{hours} Hours Total</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(instructor.allowed_lesson_lengths || [60, 90, 120]).map((length) => {
                        const hrs = length / 60;
                        const colorClass = hrs <= 1.5 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                          : hrs <= 2.5 
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-blue-500 bg-blue-50 text-blue-700";
                        return (
                          <Badge key={length} variant="outline" className={`text-xs font-medium ${colorClass}`}>
                            {hrs}h lesson
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Vehicle with Image */}
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                  {instructor.car_image_url ? (
                    <img src={instructor.car_image_url} alt="Training vehicle" className="h-12 w-16 rounded object-cover" />
                  ) : (
                    <Car className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <div className="font-medium">{instructor.car_type} Vehicle</div>
                    <div className="text-sm text-muted-foreground">
                      {instructor.car_make} {instructor.car_model}
                    </div>
                  </div>
                </div>

                {/* Location - Named Area */}
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{locationName || instructor.home_postcode}</div>
                    <div className="text-sm text-muted-foreground">
                      Pick-up available
                    </div>
                  </div>
                </div>

                {/* Instructor */}
                <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-4 sm:col-span-2">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={instructor.profile_image_url || undefined} />
                    <AvatarFallback 
                      className="text-sm"
                      style={{ backgroundColor: brandColour, color: "white" }}
                    >
                      {instructor.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{instructor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {instructor.car_type} Driving Instructor
                    </div>
                    {/* Certifications */}
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
                          CPD Certified
                        </Badge>
                      )}
                      {instructor.adi_code_of_practice && (
                        <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700">
                          <ShieldCheck className="h-3 w-3" />
                          ADI Code of Practice
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Video Tiles */}
            {(template?.explainer_video_url || instructor.welcome_video_url) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid gap-4 sm:grid-cols-2"
              >
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
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Course Explainer</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {instructor.welcome_video_url && (
                  <Card className="overflow-hidden">
                    <div className="relative aspect-video bg-muted">
                      <video
                        src={instructor.welcome_video_url}
                        className="h-full w-full object-cover"
                        controls
                        poster=""
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Meet {instructor.name.split(" ")[0]}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* About This Course */}
            {courseDescription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border bg-card p-6 shadow-md"
              >
                <h2 className="text-lg font-semibold">About This Course</h2>
                <p className="mt-4 text-sm text-muted-foreground whitespace-pre-line">{courseDescription}</p>
              </motion.div>
            )}

            {/* Lesson Scheduler */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border bg-card p-6 shadow-md"
            >
              <h2 className="text-lg font-semibold mb-4">Select Your Lesson Slots</h2>
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

            {/* Your Details Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="rounded-2xl border bg-card p-6 shadow-md"
            >
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <User className="h-5 w-5" />
                Your Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pupilName">Full Name *</Label>
                  <Input
                    id="pupilName"
                    placeholder="John Smith"
                    value={pupilName}
                    onChange={(e) => setPupilName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pupilEmail">Email Address *</Label>
                  <Input
                    id="pupilEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={pupilEmail}
                    onChange={(e) => setPupilEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pupilPhone">Phone Number *</Label>
                  <Input
                    id="pupilPhone"
                    type="tel"
                    placeholder="07123 456789"
                    value={pupilPhone}
                    onChange={(e) => setPupilPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pupilPostcode">Postcode *</Label>
                  <Input
                    id="pupilPostcode"
                    placeholder="SW1A 1AA"
                    value={pupilPostcode}
                    onChange={(e) => setPupilPostcode(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pupilAddress">Pickup Address *</Label>
                  <Input
                    id="pupilAddress"
                    placeholder="123 High Street, London"
                    value={pupilAddress}
                    onChange={(e) => setPupilAddress(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>

            {/* What's Included */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border bg-card p-6 shadow-md"
            >
              <h2 className="text-lg font-semibold">What&apos;s Included</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(features || [
                  "Pick-up from home or work",
                  "Theory test support",
                  "Free re-test if needed",
                  "Dual controls vehicle",
                  "Patient, qualified instructor",
                  "Flexible rescheduling",
                ]).map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* What to Bring */}
            {template?.what_to_bring && template.what_to_bring.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border bg-card p-6 shadow-md"
              >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Backpack className="h-5 w-5" />
                  What to Bring
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {template.what_to_bring.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Prerequisites */}
            {template?.prerequisites && template.prerequisites.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border bg-card p-6 shadow-md"
              >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Prerequisites
                </h2>
                <div className="mt-4 space-y-2">
                  {template.prerequisites.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Theory & Driving Test Details */}
            {(template?.theory_test_details || template?.driving_test_details) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                {template?.theory_test_details && (
                  <Card className="p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Theory Test
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{template.theory_test_details}</p>
                  </Card>
                )}
                {template?.driving_test_details && (
                  <Card className="p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      Driving Test
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{template.driving_test_details}</p>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Payment Terms */}
            {template?.payment_terms && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border bg-card p-6 shadow-md"
              >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Terms
                </h2>
                <p className="mt-4 text-sm text-muted-foreground whitespace-pre-line">{template.payment_terms}</p>
              </motion.div>
            )}

            {/* Terms & Conditions */}
            {template?.terms_conditions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="rounded-2xl border bg-card p-6 shadow-md"
              >
                <h2 className="text-lg font-semibold">Terms & Conditions</h2>
                <p className="mt-4 text-sm text-muted-foreground whitespace-pre-line">{template.terms_conditions}</p>
              </motion.div>
            )}

            {/* Instructor Bio */}
            {instructor.bio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl border bg-card p-6 shadow-md"
              >
                <h2 className="text-lg font-semibold">About Your Instructor</h2>
                <p className="mt-4 text-sm text-muted-foreground">{instructor.bio}</p>
                {instructor.special_skills && (
                  <div className="mt-4">
                    <span className="text-sm font-medium">Specialties: </span>
                    <span className="text-sm text-muted-foreground">{instructor.special_skills}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="rounded-2xl border bg-card p-6 shadow-md"
              >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  Student Reviews
                </h2>
                <div className="mt-4 space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{review.reviewer_name}</span>
                          {review.is_verified && (
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          )}
                        </div>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{review.review_text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{format(parseISO(review.review_date), "d MMM yyyy")}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Other Courses from Instructor */}
            {otherCourses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="text-lg font-semibold mb-4">Other Courses from {instructor.name.split(" ")[0]}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {otherCourses.map((course) => (
                    <Card
                      key={course.course_hours}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                      onClick={() => navigate(`/book/${instructor.id}?hours=${course.course_hours}`)}
                    >
                      <div className="flex gap-3 p-3">
                        {/* Thumbnail */}
                        <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted">
                          {course.course_image_url ? (
                            <img 
                              src={course.course_image_url} 
                              alt={course.course_name} 
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10">
                              <Car className="h-6 w-6 text-primary/50" />
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{course.course_name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{course.course_hours}h</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-semibold text-sm">
                              £{(instructor.hourly_rate || 35) * course.course_hours}
                            </span>
                            {course.nextAvailableDate && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {format(course.nextAvailableDate, "d MMM")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Pricing */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="sticky top-24 rounded-2xl border bg-card p-6 shadow-md"
            >
              <h2 className="text-lg font-semibold">Price Summary</h2>
              
              <div className="mt-4 space-y-3">
                {/* Savings Badge */}
                {hours >= 10 && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                    <span className="text-emerald-700 font-semibold text-sm">
                      🎉 You save £{(hours * 5).toFixed(0)} vs individual lessons!
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total</span>
                  <div className="text-right">
                    <span className="font-semibold text-lg">£{totalPrice}</span>
                    {hours >= 10 && (
                      <div className="text-xs text-muted-foreground line-through">
                        £{totalPrice + (hours * 5)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Plans */}
                <div className="mt-4 border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">Pay in instalments</p>
                  
                  {/* Klarna */}
                  <button
                    onClick={handleKlarnaCheckout}
                    disabled={!isFullyScheduled || !isPupilDetailsComplete || isKlarnaLoading}
                    className="w-full rounded-lg border p-3 bg-[#ffb3c7]/10 hover:bg-[#ffb3c7]/20 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-[#ffb3c7] px-2 py-0.5 text-xs font-bold text-black">
                        Klarna.
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isKlarnaLoading ? "Loading..." : "Pay in 3"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">3 × £{(totalPrice / 3).toFixed(2)}</span>
                      <span className="font-medium">£{(totalPrice / 3).toFixed(2)}/mo</span>
                    </div>
                    {isFullyScheduled && isPupilDetailsComplete && (
                      <div className="mt-2 text-xs text-center text-pink-600 font-medium">
                        Click to pay with Klarna →
                      </div>
                    )}
                  </button>

                  {/* Clearpay */}
                  <button
                    onClick={handleClearpayCheckout}
                    disabled={!isFullyScheduled || !isPupilDetailsComplete || isClearpayLoading}
                    className="w-full rounded-lg border p-3 bg-[#b2fce4]/10 hover:bg-[#b2fce4]/20 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-[#b2fce4] px-2 py-0.5 text-xs font-bold text-black">
                        clearpay
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isClearpayLoading ? "Loading..." : "Pay in 4"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">4 × £{(totalPrice / 4).toFixed(2)}</span>
                      <span className="font-medium">£{(totalPrice / 4).toFixed(2)}/mo</span>
                    </div>
                    {isFullyScheduled && isPupilDetailsComplete && (
                      <div className="mt-2 text-xs text-center text-emerald-600 font-medium">
                        Click to pay with Clearpay →
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Scheduled Lessons Summary */}
              {selectedSlots.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lessons scheduled</span>
                    <span>{selectedSlots.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Hours scheduled</span>
                    <span>{scheduledHours}/{hours}h</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-6 gap-2" 
                size="lg"
                disabled={!canSubmit}
                onClick={handleBookingSubmit}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isSubmitting 
                  ? "Confirming Booking..." 
                  : isFullyScheduled 
                    ? isPupilDetailsComplete 
                      ? "Confirm Booking" 
                      : "Complete Your Details"
                    : "Schedule All Lessons First"}
              </Button>

              {!isFullyScheduled && (
                <p className="mt-2 text-center text-xs text-amber-600">
                  Please schedule all {hours} hours before proceeding
                </p>
              )}

              {isFullyScheduled && !isPupilDetailsComplete && (
                <p className="mt-2 text-center text-xs text-amber-600">
                  Please complete all your details above
                </p>
              )}

              <p className="mt-4 text-center text-xs text-muted-foreground">
                No payment required now. Pay when your lessons are confirmed.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
