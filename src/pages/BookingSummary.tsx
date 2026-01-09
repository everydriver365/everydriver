import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Car, Calendar, CheckCircle, CreditCard, User, Award, ShieldCheck, Play, Star, FileText, AlertCircle, Backpack } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LessonScheduler } from "@/components/booking/LessonScheduler";
import { CourseCard } from "@/components/CourseCard";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    const fetchDetails = async () => {
      if (!instructorId) return;

      // Fetch all data in parallel
      const [instructorRes, templateRes, instructorCourseRes, reviewsRes, otherCoursesRes] = await Promise.all([
        supabase.from("instructors").select("*").eq("id", instructorId).maybeSingle(),
        supabase.from("course_templates").select("*").eq("course_hours", hours).maybeSingle(),
        supabase.from("instructor_courses").select("course_image_url").eq("instructor_id", instructorId).eq("course_hours", hours).maybeSingle(),
        supabase.from("course_reviews").select("*").eq("instructor_id", instructorId).eq("course_hours", hours).order("review_date", { ascending: false }).limit(5),
        supabase.from("instructor_courses").select("course_hours, course_name, course_image_url").eq("instructor_id", instructorId).eq("is_active", true).neq("course_hours", hours),
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
      if (otherCoursesRes.data) setOtherCourses(otherCoursesRes.data);
      
      setLoading(false);
    };

    fetchDetails();
  }, [instructorId, hours]);

  const handleSlotsChange = useCallback((slots: SelectedSlot[]) => {
    setSelectedSlots(slots);
  }, []);

  const scheduledHours = selectedSlots.reduce((acc, slot) => acc + slot.duration / 60, 0);
  const isFullyScheduled = scheduledHours >= hours;

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
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={courseImageUrl || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=400&fit=crop"}
          alt={courseName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 gap-2 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Course Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container">
            <Badge className="mb-2 bg-primary text-primary-foreground">
              {instructor.car_type}
            </Badge>
            <h1 className="text-2xl md:text-4xl font-bold text-white">{courseName}</h1>
            <p className="mt-2 text-white/80">with {instructor.name}</p>
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
                      <iframe
                        src={template.explainer_video_url}
                        className="h-full w-full"
                        allowFullScreen
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
                      <iframe
                        src={instructor.welcome_video_url}
                        className="h-full w-full"
                        allowFullScreen
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
                <div className="grid gap-6 sm:grid-cols-2">
                  {otherCourses.map((course) => (
                    <div 
                      key={course.course_hours}
                      onClick={() => navigate(`/book/${instructor.id}?hours=${course.course_hours}`)}
                    >
                      <CourseCard
                        course={{
                          id: course.course_hours,
                          title: course.course_name,
                          instructor: instructor.name,
                          instructorImage: instructor.profile_image_url || undefined,
                          price: (instructor.hourly_rate || 35) * course.course_hours,
                          location: locationName || instructor.home_postcode,
                          duration: `${course.course_hours} hours`,
                          description: `Complete ${course.course_hours}-hour driving course with ${instructor.name}`,
                          nextAvailableDay: "01",
                          nextAvailableMonth: "JAN",
                          tags: [`${course.course_hours}h`],
                          image: course.course_image_url || undefined,
                        }}
                      />
                    </div>
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
                  <div className="rounded-lg border p-3 bg-[#ffb3c7]/10">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-[#ffb3c7] px-2 py-0.5 text-xs font-bold text-black">
                        Klarna.
                      </span>
                      <span className="text-xs text-muted-foreground">Pay in 3</span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">3 × £{(totalPrice / 3).toFixed(2)}</span>
                      <span className="font-medium">£{(totalPrice / 3).toFixed(2)}/mo</span>
                    </div>
                  </div>

                  {/* Clearpay */}
                  <div className="rounded-lg border p-3 bg-[#b2fce4]/10">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-[#b2fce4] px-2 py-0.5 text-xs font-bold text-black">
                        clearpay
                      </span>
                      <span className="text-xs text-muted-foreground">Pay in 4</span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">4 × £{(totalPrice / 4).toFixed(2)}</span>
                      <span className="font-medium">£{(totalPrice / 4).toFixed(2)}/mo</span>
                    </div>
                  </div>
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
                disabled={!isFullyScheduled}
              >
                <CreditCard className="h-4 w-4" />
                {isFullyScheduled ? "Proceed to Payment" : "Schedule All Lessons First"}
              </Button>

              {!isFullyScheduled && (
                <p className="mt-2 text-center text-xs text-amber-600">
                  Please schedule all {hours} hours before proceeding
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
