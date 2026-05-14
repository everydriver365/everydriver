import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, Clock, MapPin, Phone, Mail, ArrowRight, Download, Share2, Car, AlertTriangle, CalendarPlus, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { downloadMultiEventICS, getGoogleCalendarUrl } from "@/lib/calendar-export";
import { shareContent } from "@/lib/share-utils";
import { toast } from "sonner";
import { describeBookingConflictResponse } from "@/lib/lessonClashCheck";
import confetti from "canvas-confetti";

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
  payment_type: string | null;
  deposit_paid: number | null;
  balance_due_date: string | null;
  account_balance: number | null;
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
  
  const responseCode = searchParams.get("responseCode");
  const responseMessage = searchParams.get("responseMessage");
  const transactionId = searchParams.get("xref") || searchParams.get("transactionUnique");
  const authorisationCode = searchParams.get("authorisationCode");
  const amountReceived = searchParams.get("amountReceived");
  
  const clearpaySuccess = searchParams.get("clearpay") === "success";
  const klarnaSuccess = searchParams.get("klarna") === "success";
  const npiSuccess = searchParams.get("npi") === "success";
  const elavonSuccess = searchParams.get("elavon") === "success";
  const squareSuccess = searchParams.get("square") === "success";
  const cashPayment = searchParams.get("method") === "cash";
  const gocardlessSuccess = searchParams.get("gocardless") === "success";
  const paymentRef = searchParams.get("ref");
  const freeBooking = searchParams.get("free") === "true";
  
  const paymentSuccessful =
    responseCode === "0" ||
    clearpaySuccess ||
    klarnaSuccess ||
    npiSuccess ||
    elavonSuccess ||
    squareSuccess ||
    cashPayment ||
    gocardlessSuccess ||
    freeBooking;
  
  const [pupil, setPupil] = useState<PupilDetails | null>(null);
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const { invalidatePaymentQueries } = usePaymentInvalidation();

  const confirmTriggeredRef = useRef(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      let resolvedPupilId = pupilId;

      // GoCardless: booking hasn't been created yet — create it now from saved data
      if (gocardlessSuccess && !resolvedPupilId && !confirmTriggeredRef.current) {
        const savedData = localStorage.getItem("gc_pending_booking");
        if (savedData) {
          try {
            const bookingData = JSON.parse(savedData);
            confirmTriggeredRef.current = true;

            // Create the booking
            const { data: bookingResult, error: bookingError } = await supabase.functions.invoke("create-booking", {
              body: {
                instructorId: bookingData.instructorId,
                pupilName: bookingData.pupilName,
                pupilEmail: bookingData.pupilEmail,
                pupilPhone: bookingData.pupilPhone,
                pupilAddress: bookingData.pupilAddress,
                pupilPostcode: bookingData.pupilPostcode,
                pickupAddress: bookingData.pickupAddress,
                pickupPostcode: bookingData.pickupPostcode,
                pickupWhat3words: bookingData.pickupWhat3words,
                specialNeeds: bookingData.specialNeeds,
                courseType: bookingData.courseType,
                courseHours: bookingData.courseHours,
                totalPrice: bookingData.totalPrice,
                slots: bookingData.slots,
                paymentType: bookingData.paymentType,
                amountPaid: bookingData.amountPaid,
                depositAmount: bookingData.depositAmount,
                upsells: bookingData.upsells,
              },
            });

            if (bookingError || bookingResult?.error === 'SLOT_UNAVAILABLE' || !bookingResult?.pupilId) {
              console.error("GoCardless post-payment booking creation failed:", bookingError || bookingResult);
              const friendly = await describeBookingConflictResponse(bookingError || bookingResult);
              toast.error(friendly || "Payment received but booking creation failed. Please contact support.");
              localStorage.removeItem("gc_pending_booking");
              setLoading(false);
              return;
            }

            resolvedPupilId = bookingResult.pupilId;
            localStorage.removeItem("gc_pending_booking");

            // Trigger confirm-booking notifications
            try {
              await supabase.functions.invoke("confirm-booking", {
                body: { pupilId: resolvedPupilId, instructorId: bookingData.instructorId },
              });
              console.log("confirm-booking triggered after GoCardless payment");
            } catch (err) {
              console.error("confirm-booking error (non-fatal):", err);
            }
          } catch (parseErr) {
            console.error("Failed to parse pending booking data:", parseErr);
            localStorage.removeItem("gc_pending_booking");
            setLoading(false);
            return;
          }
        } else {
          // No saved data — can't create booking
          console.error("GoCardless success but no pending booking data found");
          setLoading(false);
          return;
        }
      }

      if (!resolvedPupilId) {
        setLoading(false);
        return;
      }

      const [pupilRes, lessonsRes] = await Promise.all([
        supabase
          .from("pupils")
          .select(`
            id, name, email, phone, address, postcode, course_type, prepaid_hours,
            payment_type, deposit_paid, balance_due_date, account_balance,
            instructor_id,
            instructor:instructors(id, name, phone, email, car_make, car_model, car_type, profile_image_url)
          `)
          .eq("id", resolvedPupilId)
          .maybeSingle(),
        supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, duration_minutes, pickup_location, status")
          .eq("pupil_id", resolvedPupilId)
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true }),
      ]);

      if (pupilRes.data) {
        const pupilData = pupilRes.data as any;
        const instructorData = Array.isArray(pupilData.instructor) ? pupilData.instructor[0] : pupilData.instructor;
        setPupil({
          ...pupilData,
          instructor: instructorData,
        });
        if (paymentSuccessful) {
          invalidatePaymentQueries({ pupilId: pupilData.id, instructorId: pupilData.instructor_id || instructorData?.id });
          
          // For redirect-based payments (Clearpay, Klarna, Square), trigger confirm-booking
          const isRedirectPayment = clearpaySuccess || klarnaSuccess || squareSuccess;
          if (isRedirectPayment && !confirmTriggeredRef.current) {
            confirmTriggeredRef.current = true;
            const instructorId =
              pupilData.instructor_id || instructorData?.id || searchParams.get("instructorId");

            // Clearpay: capture the authorised payment & record it before notifying
            if (clearpaySuccess) {
              const orderToken = searchParams.get("orderToken") || searchParams.get("token");
              const amountStr = searchParams.get("amount");
              const amount = amountStr ? parseFloat(amountStr) : undefined;
              if (orderToken && instructorId) {
                try {
                  const { error: capErr } = await supabase.functions.invoke("clearpay-capture", {
                    body: {
                      token: orderToken,
                      merchantReference: paymentRef || undefined,
                      instructorId,
                      pupilId: resolvedPupilId,
                      amount,
                    },
                  });
                  if (capErr) console.error("clearpay-capture error:", capErr);
                  else console.log("clearpay-capture succeeded");
                } catch (err) {
                  console.error("clearpay-capture invoke failed:", err);
                }
              } else {
                console.warn("Clearpay redirect missing orderToken or instructorId — skipping capture", {
                  orderToken,
                  instructorId,
                });
              }
            }

            if (instructorId) {
              try {
                await supabase.functions.invoke("confirm-booking", {
                  body: { pupilId: resolvedPupilId, instructorId },
                });
                console.log("confirm-booking triggered after redirect payment");
              } catch (err) {
                console.error("confirm-booking error (non-fatal):", err);
              }
            }
          }
        }
      }
      if (lessonsRes.data) setLessons(lessonsRes.data);
      setLoading(false);
    };

    fetchBookingDetails();
  }, [pupilId]);

  // Fire confetti on successful payment
  useEffect(() => {
    if (paymentSuccessful && !loading && pupil) {
      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3, angle: 60, spread: 55,
          origin: { x: 0 }, colors: ['#10b981', '#34d399', '#6ee7b7'],
        });
        confetti({
          particleCount: 3, angle: 120, spread: 55,
          origin: { x: 1 }, colors: ['#10b981', '#34d399', '#6ee7b7'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [paymentSuccessful, loading, pupil]);

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
            <p className="mt-2 text-sm text-muted-foreground">Error code: {responseCode}</p>
          )}
          <Button asChild className="mt-6">
            <Link to="/courses">Try Again</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const totalHours = lessons.reduce((acc, l) => acc + l.duration_minutes / 60, 0);

  const handleShare = () => {
    shareContent({
      title: "I just booked driving lessons!",
      text: `I've booked a ${pupil.prepaid_hours || totalHours}h driving course with ${pupil.instructor.name}. Check them out!`,
      url: window.location.origin + "/courses",
    });
  };

  return (
    <MainLayout>
      {/* Success Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
        <div className="container py-10 md:py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mx-auto mb-4 w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center"
          >
            <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-4xl font-bold"
          >
            {pupil.payment_type === "deposit" ? "Deposit Received! 🎉" : "Booking Confirmed! 🎉"}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-emerald-100 max-w-md mx-auto text-sm md:text-base"
          >
            Your {pupil.prepaid_hours || totalHours} hour {pupil.course_type || "driving course"} has been booked with {pupil.instructor.name}.
          </motion.p>

          {/* Payment confirmation details */}
          {(transactionId || paymentRef) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-3 text-sm text-emerald-100"
            >
              {amountReceived && <span>Payment of £{(parseInt(amountReceived) / 100).toFixed(2)} confirmed</span>}
              {authorisationCode && <span className="ml-2">• Auth: {authorisationCode}</span>}
              {paymentRef && <span>Reference: {paymentRef}</span>}
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile-first CTAs — shown prominently on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="container py-4 md:hidden space-y-2"
      >
        <Button className="w-full gap-2 h-12" asChild>
          <Link to={`/pupil?id=${pupil.id}`}>
            <ArrowRight className="h-4 w-4" />
            Go to My Dashboard
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" asChild>
            <Link to="/theory">Start Theory Practice</Link>
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </motion.div>

      {/* Deposit Warning */}
      {pupil.payment_type === "deposit" && pupil.balance_due_date && (
        <div className="container py-4">
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-300">Balance Payment Required</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Deposit of £{pupil.deposit_paid} received. Remaining balance of <strong>£{Math.abs(pupil.account_balance || 0)}</strong> due by{" "}
                  <strong>{new Date(pupil.balance_due_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container py-4 md:py-8">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lessons — compact on mobile */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5 text-primary" />
                    Your Lessons ({lessons.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Compact lesson list for mobile */}
                  <div className="space-y-2 md:space-y-3">
                    {lessons.map((lesson, index) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-secondary/50 border"
                      >
                        <div className="flex-shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-sm md:text-lg font-bold text-primary">
                            {format(parseISO(lesson.lesson_date), "d")}
                          </span>
                          <span className="text-[10px] md:text-xs text-primary font-medium">
                            {format(parseISO(lesson.lesson_date), "MMM")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {format(parseISO(lesson.lesson_date), "EEEE")}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            {lesson.start_time} ({lesson.duration_minutes / 60}h)
                          </div>
                          {lesson.pickup_location && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{lesson.pickup_location}</span>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px] md:text-xs shrink-0">
                          Confirmed
                        </Badge>
                      </motion.div>
                    ))}
                  </div>

                  <Separator className="my-4 md:my-6" />

                  {/* Calendar export */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => {
                        if (lessons.length > 0) {
                          const events = lessons.map((lesson) => ({
                            title: `Driving Lesson with ${pupil.instructor.name}`,
                            description: `${pupil.prepaid_hours || totalHours}h ${pupil.course_type || 'driving'} course`,
                            startDate: lesson.lesson_date,
                            startTime: lesson.start_time,
                            durationMinutes: lesson.duration_minutes,
                            location: lesson.pickup_location || pupil.address,
                          }));
                          downloadMultiEventICS(events);
                          toast.success(`${lessons.length} lesson${lessons.length > 1 ? 's' : ''} added to calendar file`);
                        }
                      }}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span> .ics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => {
                        if (lessons.length > 0) {
                          lessons.forEach((lesson, i) => {
                            setTimeout(() => {
                              window.open(
                                getGoogleCalendarUrl({
                                  title: `Driving Lesson with ${pupil.instructor.name}`,
                                  description: `${pupil.prepaid_hours || totalHours}h ${pupil.course_type || 'driving'} course - Lesson ${i + 1}/${lessons.length}`,
                                  startDate: lesson.lesson_date,
                                  startTime: lesson.start_time,
                                  durationMinutes: lesson.duration_minutes,
                                  location: lesson.pickup_location || pupil.address,
                                }),
                                "_blank"
                              );
                            }, i * 500);
                          });
                        }
                      }}
                    >
                      <Calendar className="h-4 w-4" />
                      Google Cal
                    </Button>
                  </div>

                  <div className="flex justify-between text-sm mt-4">
                    <span className="text-muted-foreground">Total lessons</span>
                    <span className="font-medium">{lessons.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Total hours</span>
                    <span className="font-medium">{totalHours}h</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Steps */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">What's Next?</CardTitle>
                </CardHeader>
                <CardContent>
                  {pupil.payment_type === "deposit" && pupil.balance_due_date && (
                    <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Balance of <strong>£{Math.abs(pupil.account_balance || 0)}</strong> due by{" "}
                          <strong>{new Date(pupil.balance_due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {[
                      { step: 1, title: "Confirmation Email Sent", description: `Details sent to ${pupil.email || "your email"}.`, done: true },
                      { step: 2, title: "Prepare for Your First Lesson", description: "Bring your provisional licence and wear comfortable shoes.", done: false },
                      { step: 3, title: "Your Instructor Will Arrive", description: `${pupil.instructor.name} will pick you up on your lesson day.`, done: false },
                      ...(pupil.payment_type === "deposit"
                        ? [{ step: 4, title: "Pay Outstanding Balance", description: `Remaining £${Math.abs(pupil.account_balance || 0)} due before deadline.`, done: false }]
                        : [{ step: 4, title: "Payment Complete", description: "Your course is fully paid!", done: true }]),
                    ].map((item) => (
                      <div key={item.step} className="flex gap-3">
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                          item.done ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"
                        }`}>
                          {item.done ? <CheckCircle className="h-3.5 w-3.5" /> : item.step}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Referral Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Card className="border-dashed border-2 border-primary/30 bg-primary/[0.03]">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">Know someone learning to drive?</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share your experience and help a friend find a great instructor. You could earn reward points!
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-1.5"
                        onClick={handleShare}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Share with Friends
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar — hidden on mobile (CTAs already shown above) */}
          <div className="hidden md:block space-y-6">
            {/* Instructor Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {pupil.instructor.profile_image_url ? (
                        <img src={pupil.instructor.profile_image_url} alt={pupil.instructor.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {pupil.instructor.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{pupil.instructor.name}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Car className="h-3.5 w-3.5" />
                        {pupil.instructor.car_make} {pupil.instructor.car_model} ({pupil.instructor.car_type})
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    {pupil.instructor.phone && (
                      <a href={`tel:${pupil.instructor.phone}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {pupil.instructor.phone}
                      </a>
                    )}
                    {pupil.instructor.email && (
                      <a href={`mailto:${pupil.instructor.email}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {pupil.instructor.email}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Desktop CTAs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3">
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

      {/* Mobile sticky instructor contact bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe">
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {pupil.instructor.profile_image_url ? (
                <img src={pupil.instructor.profile_image_url} alt={pupil.instructor.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-primary">
                  {pupil.instructor.name.split(" ").map(n => n[0]).join("")}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{pupil.instructor.name}</p>
              <p className="text-[10px] text-muted-foreground">Your instructor</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {pupil.instructor.phone && (
              <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                <a href={`tel:${pupil.instructor.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
            {pupil.instructor.email && (
              <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                <a href={`mailto:${pupil.instructor.email}`}>
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
