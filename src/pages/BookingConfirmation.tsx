import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, Clock, MapPin, Phone, Mail, ArrowRight, Download, Share2, Car } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  pickup_location: string | null;
  status: string;
}

interface PupilDetails {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string;
  postcode: string;
  course_type: string | null;
  prepaid_hours: number | null;
  instructor: {
    name: string;
    phone: string | null;
    email: string | null;
    car_make: string | null;
    car_model: string | null;
    car_type: string;
    profile_image_url: string | null;
  };
}

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const pupilId = searchParams.get("pupilId");
  
  // Cardstream response parameters
  const responseCode = searchParams.get("responseCode");
  const responseMessage = searchParams.get("responseMessage");
  const transactionId = searchParams.get("xref") || searchParams.get("transactionUnique");
  const authorisationCode = searchParams.get("authorisationCode");
  const amountReceived = searchParams.get("amountReceived");
  
  // Payment provider parameters
  const clearpaySuccess = searchParams.get("clearpay") === "success";
  const klarnaSuccess = searchParams.get("klarna") === "success";
  const npiSuccess = searchParams.get("npi") === "success";
  const elavonSuccess = searchParams.get("elavon") === "success";
  const squareSuccess = searchParams.get("square") === "success";
  const paymentRef = searchParams.get("ref");
  
  // Payment was successful if Cardstream approved OR provider success flag OR direct booking (no payment params)
  const paymentSuccessful =
    responseCode === "0" ||
    responseCode === null ||
    clearpaySuccess ||
    klarnaSuccess ||
    npiSuccess ||
    elavonSuccess ||
    squareSuccess;
  
  const [pupil, setPupil] = useState<PupilDetails | null>(null);
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!pupilId) {
        setLoading(false);
        return;
      }

      const [pupilRes, lessonsRes] = await Promise.all([
        supabase
          .from("pupils")
          .select(`
            id, name, email, phone, address, postcode, course_type, prepaid_hours,
            instructor:instructors(name, phone, email, car_make, car_model, car_type, profile_image_url)
          `)
          .eq("id", pupilId)
          .maybeSingle(),
        supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, duration_minutes, pickup_location, status")
          .eq("pupil_id", pupilId)
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true }),
      ]);

      if (pupilRes.data) {
        // Transform the data to match our interface
        const pupilData = pupilRes.data as any;
        setPupil({
          ...pupilData,
          instructor: Array.isArray(pupilData.instructor) ? pupilData.instructor[0] : pupilData.instructor,
        });
      }
      if (lessonsRes.data) setLessons(lessonsRes.data);
      setLoading(false);
    };

    fetchBookingDetails();
  }, [pupilId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <div className="animate-pulse">Loading your booking...</div>
        </div>
      </MainLayout>
    );
  }

  if (!pupil || !pupilId) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Booking not found</h1>
          <p className="mt-2 text-muted-foreground">We couldn't find your booking details.</p>
          <Button asChild className="mt-6">
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Payment failed state
  if (!paymentSuccessful) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-destructive">Payment Failed</h1>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            {responseMessage || "Your payment could not be processed. Please try again."}
          </p>
          {responseCode && (
            <p className="mt-2 text-sm text-muted-foreground">
              Error code: {responseCode}
            </p>
          )}
          <Button asChild className="mt-6">
            <Link to="/courses">Try Again</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const totalHours = lessons.reduce((acc, l) => acc + l.duration_minutes / 60, 0);

  return (
    <MainLayout>
      {/* Success Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
        <div className="container py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mx-auto mb-6 w-20 h-20 rounded-full bg-white/20 flex items-center justify-center"
          >
            <CheckCircle className="h-12 w-12 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold"
          >
            Booking Confirmed! 🎉
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-emerald-100 max-w-md mx-auto"
          >
            Your {pupil.prepaid_hours || totalHours} hour {pupil.course_type || "driving course"} has been booked with {pupil.instructor.name}.
          </motion.p>

          {/* Payment confirmation details */}
          {(transactionId || paymentRef) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-4 text-sm text-emerald-100"
            >
              {amountReceived && <span>Payment of £{(parseInt(amountReceived) / 100).toFixed(2)} confirmed</span>}
              {authorisationCode && <span className="ml-2">• Auth: {authorisationCode}</span>}
              {paymentRef && <span>Reference: {paymentRef}</span>}
            </motion.div>
          )}
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scheduled Lessons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Your Scheduled Lessons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lessons.map((lesson, index) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 border"
                      >
                        <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {format(parseISO(lesson.lesson_date), "d")}
                          </span>
                          <span className="text-xs text-primary font-medium">
                            {format(parseISO(lesson.lesson_date), "MMM")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">
                            {format(parseISO(lesson.lesson_date), "EEEE")}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {lesson.start_time} ({lesson.duration_minutes / 60}h)
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {lesson.duration_minutes / 60}h
                            </Badge>
                          </div>
                          {lesson.pickup_location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{lesson.pickup_location}</span>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                          Confirmed
                        </Badge>
                      </motion.div>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total lessons</span>
                    <span className="font-medium">{lessons.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Total hours scheduled</span>
                    <span className="font-medium">{totalHours}h</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>What's Next?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        step: 1,
                        title: "Confirmation Email Sent",
                        description: `We've sent your booking details to ${pupil.email || "your email address"}.`,
                        done: true,
                      },
                      {
                        step: 2,
                        title: "Prepare for Your First Lesson",
                        description: "Bring your provisional licence and wear comfortable shoes.",
                        done: false,
                      },
                      {
                        step: 3,
                        title: "Your Instructor Will Arrive",
                        description: `${pupil.instructor.name} will pick you up at your address on your lesson day.`,
                        done: false,
                      },
                      {
                        step: 4,
                        title: "Payment",
                        description: "Pay your instructor directly at the start of each lesson or prepay the full amount.",
                        done: false,
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            item.done
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {item.done ? <CheckCircle className="h-4 w-4" /> : item.step}
                        </div>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {pupil.instructor.profile_image_url ? (
                        <img
                          src={pupil.instructor.profile_image_url}
                          alt={pupil.instructor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-primary">
                          {pupil.instructor.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{pupil.instructor.name}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Car className="h-3.5 w-3.5" />
                        <span>
                          {pupil.instructor.car_make} {pupil.instructor.car_model} ({pupil.instructor.car_type})
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    {pupil.instructor.phone && (
                      <a
                        href={`tel:${pupil.instructor.phone}`}
                        className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {pupil.instructor.phone}
                      </a>
                    )}
                    {pupil.instructor.email && (
                      <a
                        href={`mailto:${pupil.instructor.email}`}
                        className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {pupil.instructor.email}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Your Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium">{pupil.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pickup:</span>{" "}
                    <span className="font-medium">{pupil.address}, {pupil.postcode}</span>
                  </div>
                  {pupil.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <span className="font-medium">{pupil.phone}</span>
                    </div>
                  )}
                  {pupil.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="font-medium">{pupil.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button className="w-full gap-2" asChild>
                <Link to={`/pupil?id=${pupil.id}`}>
                  <ArrowRight className="h-4 w-4" />
                  Go to My Dashboard
                </Link>
              </Button>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link to="/theory">
                  <ArrowRight className="h-4 w-4" />
                  Start Theory Practice
                </Link>
              </Button>
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link to="/faqs">
                  <ArrowRight className="h-4 w-4" />
                  Read FAQs
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
