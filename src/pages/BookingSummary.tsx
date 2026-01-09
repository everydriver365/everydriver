import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Car, Calendar, CheckCircle, CreditCard, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LessonScheduler } from "@/components/booking/LessonScheduler";
import { supabase } from "@/integrations/supabase/client";

interface Instructor {
  id: string;
  name: string;
  profile_image_url: string | null;
  car_type: string;
  car_make: string | null;
  car_model: string | null;
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
}

interface CourseTemplate {
  course_hours: number;
  course_name: string;
  default_image_url: string | null;
  short_description: string | null;
  full_description: string | null;
  features: string[] | null;
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
}

export default function BookingSummary() {
  const { instructorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

  const hours = parseInt(searchParams.get("hours") || "10");
  const selectedDateParam = searchParams.get("date");
  const selectedDate = selectedDateParam ? parseISO(selectedDateParam) : null;

  useEffect(() => {
    const fetchDetails = async () => {
      if (!instructorId) return;

      // Fetch instructor and course template in parallel
      const [instructorRes, templateRes, instructorCourseRes] = await Promise.all([
        supabase.from("instructors").select("*").eq("id", instructorId).maybeSingle(),
        supabase.from("course_templates").select("*").eq("course_hours", hours).maybeSingle(),
        supabase.from("instructor_courses").select("course_image_url").eq("instructor_id", instructorId).eq("course_hours", hours).maybeSingle(),
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

      setCourseDetails({
        instructor: {
          ...instructor,
          home_address: instructor.home_address || null,
          preferred_lesson_length: instructor.preferred_lesson_length || 60,
          booking_advance_days: instructor.booking_advance_days || 28,
          available_from: instructor.available_from || null,
          allowed_lesson_lengths: instructor.allowed_lesson_lengths || null,
          buffer_minutes: instructor.buffer_minutes || 15,
        },
        hours,
        courseName,
        totalPrice: hours * hourlyRate,
        pricePerHour: hourlyRate,
        courseImageUrl,
        courseDescription: template?.full_description || template?.short_description || null,
        features: template?.features || null,
      });
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

  const { instructor, courseName, totalPrice, pricePerHour, courseImageUrl, courseDescription, features } = courseDetails;
  const brandColour = instructor.brand_colour || "#1e3a5f";
  const locationDisplay = instructor.home_address || instructor.home_postcode;

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
                        const hours = length / 60;
                        const colorClass = hours <= 1.5 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                          : hours <= 2.5 
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-blue-500 bg-blue-50 text-blue-700";
                        return (
                          <Badge key={length} variant="outline" className={`text-xs font-medium ${colorClass}`}>
                            {hours}h lesson
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Vehicle */}
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                  <Car className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{instructor.car_type} Vehicle</div>
                    <div className="text-sm text-muted-foreground">
                      {instructor.car_make} {instructor.car_model}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{locationDisplay}</div>
                    <div className="text-sm text-muted-foreground">
                      Pick-up available
                    </div>
                  </div>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4 sm:col-span-2">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={instructor.profile_image_url || undefined} />
                    <AvatarFallback 
                      className="text-sm"
                      style={{ backgroundColor: brandColour, color: "white" }}
                    >
                      {instructor.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{instructor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {instructor.car_type} Driving Instructor
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Description */}
              {courseDescription && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-2">About This Course</h3>
                  <p className="text-sm text-muted-foreground">{courseDescription}</p>
                </div>
              )}
            </motion.div>

            {/* Lesson Scheduler */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border bg-card p-6 shadow-md"
            >
              <h2 className="text-lg font-semibold mb-4">Select Your Lesson Slots</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Choose available time slots from the instructor's calendar. Lessons are available in {instructor.allowed_lesson_lengths?.map(l => `${l/60}h`).join(", ") || "1-7 hour"} durations with {instructor.buffer_minutes} minute buffers between bookings.
              </p>
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
              <h2 className="text-lg font-semibold">What's Included</h2>
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

            {/* Instructor Bio */}
            {instructor.bio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {hours} hours × £{pricePerHour}/hr
                  </span>
                  <span>£{totalPrice}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>£{totalPrice}</span>
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
