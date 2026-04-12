import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Navigation, 
  Phone, 
  MessageSquare, 
  Clock, 
  MapPin,
  Check,
  Loader2,
  CheckCircle2,
  CalendarClock,
  XCircle,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePaymentInvalidation } from "@/hooks/usePaymentInvalidation";
import { PostcodeMapPreview } from "./PostcodeMapPreview";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { EndLessonWizard } from "./EndLessonWizard";
import { TravelTimeIndicator } from "./TravelTimeIndicator";
import { useLessonTravelTimes } from "@/hooks/useLessonTravelTimes";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { LessonCheckInBadge } from "./LessonCheckInBadge";

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_type: string;
  pickup_location: string | null;
  pickup_postcode: string | null;
  status: string;
  payment_status: string;
  prepaid_hours_used: number;
  amount_due: number;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
    address: string;
    postcode: string;
    prepaid_hours: number;
    account_balance: number;
  };
}

interface TodayScheduleViewProps {
  instructorId: string;
}

export function TodayScheduleView({ instructorId }: TodayScheduleViewProps) {
  const { instructor: authInstructor } = useInstructorAuth();
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [completingLesson, setCompletingLesson] = useState<string | null>(null);
  const [rescheduleLesson, setRescheduleLesson] = useState<ScheduledLesson | null>(null);
  const [cancelLesson, setCancelLesson] = useState<ScheduledLesson | null>(null);
  const [wizardLesson, setWizardLesson] = useState<ScheduledLesson | null>(null);
  const { invalidatePaymentQueries } = usePaymentInvalidation();

  // Travel times between consecutive lessons
  const travelTimeLessons = lessons.map(l => ({
    id: l.id,
    start_time: l.start_time,
    duration_minutes: l.duration_minutes,
    pickup_postcode: l.pickup_postcode,
    pupil: l.pupil ? { postcode: l.pupil.postcode } : undefined,
  }));
  const { travelTimes, getTravelTime } = useLessonTravelTimes(travelTimeLessons);

  useEffect(() => {
    fetchLessons();
  }, [instructorId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id,
          lesson_date,
          start_time,
          duration_minutes,
          lesson_type,
          pickup_location,
          pickup_postcode,
          status,
          payment_status,
          prepaid_hours_used,
          amount_due,
          check_in_status,
          pupil:pupils(
            id,
            name,
            phone,
            address,
            postcode,
            prepaid_hours,
            account_balance
          )
        `)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", today)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (error) throw error;
      
      const transformedData = (data || []).map((lesson: any) => ({
        ...lesson,
        pupil: lesson.pupil || {
          id: "",
          name: "Unknown",
          phone: null,
          address: "",
          postcode: "",
          prepaid_hours: 0,
          account_balance: 0
        }
      }));
      
      setLessons(transformedData);
    } catch (error) {
      console.error("Error fetching today's lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const getPaymentStatusBadge = (lesson: ScheduledLesson) => {
    const { payment_status, pupil } = lesson;
    const balance = pupil?.account_balance || 0;
    
    if (payment_status === "paid") {
      return <Badge className="bg-success text-success-foreground text-xs">Paid</Badge>;
    }
    
    if (pupil?.prepaid_hours && pupil.prepaid_hours > 0) {
      return (
        <Badge variant="secondary" className="bg-accent/20 text-accent-foreground text-xs">
          {pupil.prepaid_hours}h Credit
        </Badge>
      );
    }

    // If pupil has positive account balance, show credit instead of unpaid
    if (balance > 0) {
      return (
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
          £{Math.round(balance)} Credit
        </Badge>
      );
    }

    // Negative balance = debt
    if (balance < 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          £{Math.abs(Math.round(balance))} Due
        </Badge>
      );
    }
    
    return <Badge variant="destructive" className="text-xs">Unpaid</Badge>;
  };

  const handleNavigate = (address: string, postcode: string) => {
    const query = encodeURIComponent(`${address}, ${postcode}`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS 
      ? `maps://maps.apple.com/?daddr=${query}`
      : `geo:0,0?q=${query}`;
    
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    
    window.location.href = url;
    setTimeout(() => {
      window.open(fallbackUrl, "_blank");
    }, 500);
  };

  const handleCall = (phone: string | null) => {
    if (!phone) {
      toast({ title: "No phone number", variant: "destructive" });
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const handleText = (phone: string | null) => {
    if (!phone) {
      toast({ title: "No phone number", variant: "destructive" });
      return;
    }
    window.location.href = `sms:${phone}`;
  };

  const handleOnWay = (lesson: ScheduledLesson, delayMinutes?: number) => {
    if (!lesson.pupil?.phone) {
      toast({ title: "No phone number", variant: "destructive" });
      return;
    }

    setSendingMessage(lesson.id);
    
    // Update lesson status to en_route
    supabase.from("scheduled_lessons").update({ status: "en_route" }).eq("id", lesson.id).then(() => {});
    
    // Send push notification to pupil
    supabase.functions.invoke("notify-pupil", {
      body: { pupilId: lesson.pupil.id, type: "en_route" },
    }).catch(() => {});
    
    const firstName = (lesson.pupil?.name || "").split(" ")[0];
    let message: string;
    
    if (delayMinutes === -1) {
      message = `Hi ${firstName}, I'll call you as soon as I can!`;
    } else if (delayMinutes === -2) {
      message = `Hi ${firstName}, I'm on my way to you now!`;
    } else if (delayMinutes) {
      message = `Hi ${firstName}, I'm on my way! I'll be with you in about ${delayMinutes} minutes.`;
    } else {
      message = `Hi ${firstName}, I'm on my way to you!`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `sms:${lesson.pupil.phone}?body=${encodedMessage}`;
    setSendingMessage(null);
  };

  const handleCompleteLesson = async (lesson: ScheduledLesson) => {
    setCompletingLesson(lesson.id);
    
    try {
      // 1. Update the scheduled lesson status to completed
      const { error: updateError } = await supabase
        .from("scheduled_lessons")
        .update({ status: "completed" })
        .eq("id", lesson.id);

      if (updateError) throw updateError;

      // 2. Log to lesson history
      const { error: historyError } = await supabase
        .from("lesson_history")
        .insert({
          instructor_id: instructorId,
          pupil_id: lesson.pupil.id,
          lesson_date: lesson.lesson_date,
          start_time: lesson.start_time,
          duration_minutes: lesson.duration_minutes,
        });

      if (historyError) throw historyError;

      // 3. Fetch points_per_lesson from site_settings and award points
      let pointsAwarded = 10; // Default fallback
      try {
        const { data: pointsSetting } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "points_per_lesson")
          .single();
        
        if (pointsSetting?.setting_value) {
          pointsAwarded = parseInt(pointsSetting.setting_value, 10) || 10;
        }

        // Get current pupil data for updates
        const { data: currentPupil } = await supabase
          .from("pupils")
          .select("reward_points, total_lessons_for_rewards, lessons_completed")
          .eq("id", lesson.pupil.id)
          .single();

        if (currentPupil) {
          const newRewardPoints = (currentPupil.reward_points || 0) + pointsAwarded;
          const newTotalLessons = (currentPupil.total_lessons_for_rewards || 0) + 1;
          const newLessonsCompleted = (currentPupil.lessons_completed || 0) + 1;

          // Check if pupil earns a free lesson (from points or lesson count)
          const { data: pointsForFree } = await supabase
            .from("site_settings")
            .select("setting_value")
            .eq("setting_key", "points_for_free_lesson")
            .single();
          
          const { data: lessonsForFree } = await supabase
            .from("site_settings")
            .select("setting_value")
            .eq("setting_key", "lessons_for_free_lesson")
            .single();

          const pointsThreshold = parseInt(pointsForFree?.setting_value || "100", 10);
          const lessonsThreshold = parseInt(lessonsForFree?.setting_value || "15", 10);

          // Calculate free lessons earned from points
          const previousFreeFromPoints = Math.floor((currentPupil.reward_points || 0) / pointsThreshold);
          const newFreeFromPoints = Math.floor(newRewardPoints / pointsThreshold);
          const freeFromPointsEarned = newFreeFromPoints - previousFreeFromPoints;

          // Calculate free lessons earned from lesson count
          const previousFreeFromLessons = Math.floor((currentPupil.total_lessons_for_rewards || 0) / lessonsThreshold);
          const newFreeFromLessons = Math.floor(newTotalLessons / lessonsThreshold);
          const freeFromLessonsEarned = newFreeFromLessons - previousFreeFromLessons;

          const totalNewFreeLessons = freeFromPointsEarned + freeFromLessonsEarned;

          // Update pupil with new points and lesson counts
          const { data: pupilData } = await supabase
            .from("pupils")
            .select("free_lessons_earned")
            .eq("id", lesson.pupil.id)
            .single();

          await supabase
            .from("pupils")
            .update({ 
              lessons_completed: newLessonsCompleted,
              reward_points: newRewardPoints,
              total_lessons_for_rewards: newTotalLessons,
              free_lessons_earned: (pupilData?.free_lessons_earned || 0) + totalNewFreeLessons
            })
            .eq("id", lesson.pupil.id);

          // Log points to rewards history
          await supabase
            .from("pupil_rewards_history")
            .insert({
              pupil_id: lesson.pupil.id,
              instructor_id: instructorId,
              points_change: pointsAwarded,
              reason: "Lesson completed"
            });
        }
      } catch (rewardsError) {
        console.error("Error awarding rewards:", rewardsError);
        // Non-blocking - still complete the lesson
      }

      // 4. Deduct lesson cost from pupil balance and record in payment_history
      try {
        const { data: instrRate } = await supabase
          .from("instructors")
          .select("hourly_rate")
          .eq("id", instructorId)
          .single();

        const hourlyRate = instrRate?.hourly_rate || 40;
        const lessonCost = (lesson.duration_minutes / 60) * hourlyRate;

        // Read fresh balance to avoid race conditions
        const { data: freshPupil } = await supabase
          .from("pupils")
          .select("account_balance")
          .eq("id", lesson.pupil.id)
          .single();

        const currentBalance = freshPupil?.account_balance || 0;
        const newBalance = currentBalance - lessonCost;

        await supabase
          .from("pupils")
          .update({ account_balance: newBalance })
          .eq("id", lesson.pupil.id);

        // Record the charge in payment_history
        await supabase.from("payment_history").insert({
          pupil_id: lesson.pupil.id,
          instructor_id: instructorId,
          amount: -lessonCost,
          payment_method: "Lesson Charge",
          notes: `${lesson.duration_minutes}min lesson on ${lesson.lesson_date}`,
        });

        invalidatePaymentQueries({ pupilId: lesson.pupil.id, instructorId });
      } catch (chargeError) {
        console.error("Error recording lesson charge:", chargeError);
        // Non-blocking - lesson is still completed
      }

      // 5. Auto-calculate mileage if pickup postcode is available
      if (lesson.pickup_postcode) {
        try {
          // Get instructor's home postcode
          const { data: instructor } = await supabase
            .from("instructors")
            .select("home_postcode")
            .eq("id", instructorId)
            .single();

          if (instructor?.home_postcode) {
            // Calculate distance via maps API
            const { data: routeData } = await supabase.functions.invoke("calculate-route-distance", {
              body: {
                from_postcode: lesson.pickup_postcode,
                instructor_home_postcode: instructor.home_postcode,
              },
            });

            if (routeData?.success && routeData?.estimated_lesson_miles) {
              // Update the lesson with calculated mileage
              await supabase
                .from("scheduled_lessons")
                .update({ lesson_miles: routeData.estimated_lesson_miles })
                .eq("id", lesson.id);

              toast({ 
                title: "Lesson completed!", 
                description: `${lesson.pupil.name} earned +${pointsAwarded} points! Mileage: ${routeData.estimated_lesson_miles.toFixed(1)} mi 🚗` 
              });
              
              // Remove from today's list and exit early
              setLessons(prev => prev.filter(l => l.id !== lesson.id));
              return;
            }
          }
        } catch (mileageError) {
          // Non-blocking - don't fail the lesson completion if mileage calc fails
          console.error("Error auto-calculating mileage:", mileageError);
        }
      }

      toast({ 
        title: "Lesson completed!", 
        description: `${lesson.pupil.name} earned +${pointsAwarded} points! 🎉` 
      });

      // Remove from today's list
      setLessons(prev => prev.filter(l => l.id !== lesson.id));
    } catch (error) {
      console.error("Error completing lesson:", error);
      toast({ 
        title: "Error", 
        description: "Failed to complete lesson. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setCompletingLesson(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Today
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Today
          <Badge variant="secondary" className="ml-auto">
            {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lessons.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No lessons scheduled for today
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {lessons.map((lesson, index) => {
              // Show travel time indicator between lessons
              const prevLesson = index > 0 ? lessons[index - 1] : null;
              const travelTime = prevLesson ? getTravelTime(prevLesson.id, lesson.id) : null;

              return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {travelTime && authInstructor?.drive_time_alerts_enabled && (
                  <TravelTimeIndicator
                    durationMinutes={travelTime.durationMinutes}
                    durationText={travelTime.durationText}
                    gapMinutes={travelTime.gapMinutes}
                    status={travelTime.status}
                    isLoading={travelTime.isLoading}
                    className="py-1.5"
                  />
                )}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Map Preview - only for next upcoming lesson */}
                    {index === 0 && (
                      <PostcodeMapPreview 
                        postcode={lesson.pickup_postcode || lesson.pupil?.postcode || ""} 
                        className="rounded-2xl border-0"
                        onClick={() => handleNavigate(
                          lesson.pickup_location || lesson.pupil?.address || "",
                          lesson.pickup_postcode || lesson.pupil?.postcode || ""
                        )}
                      />
                    )}
                    
                    {/* Time Header */}
                    <div className="bg-primary px-3 py-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary-foreground text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-bold">{formatTime(lesson.start_time)}</span>
                        <span className="opacity-70">•</span>
                        <span>{lesson.duration_minutes}m</span>
                      </div>
                      {getPaymentStatusBadge(lesson)}
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{lesson.pupil?.name}</h3>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-muted-foreground">{lesson.lesson_type}</p>
                            <LessonCheckInBadge status={(lesson as any).check_in_status} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="truncate">
                          {lesson.pickup_location || lesson.pupil?.address}
                        </span>
                      </div>

                      {/* Action Buttons - 3 cols on mobile, 6 on larger */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-col h-auto py-2 gap-1"
                          onClick={() => handleNavigate(
                            lesson.pickup_location || lesson.pupil?.address || "",
                            lesson.pickup_postcode || lesson.pupil?.postcode || ""
                          )}
                        >
                          <Navigation className="h-4 w-4 text-accent" />
                          <span className="text-[10px] leading-none">Nav</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-col h-auto py-2 gap-1"
                          onClick={() => handleCall(lesson.pupil?.phone)}
                        >
                          <Phone className="h-4 w-4 text-success" />
                          <span className="text-[10px] leading-none">Call</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-col h-auto py-2 gap-1"
                          onClick={() => handleText(lesson.pupil?.phone)}
                        >
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-[10px] leading-none">Text</span>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-col h-auto py-2 gap-1 w-full"
                              disabled={sendingMessage === lesson.id}
                            >
                              {sendingMessage === lesson.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 text-warning" />
                              )}
                              <span className="text-[10px] leading-none">On Way</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => handleOnWay(lesson)}>
                              On my way!
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOnWay(lesson, 5)}>
                              I'll be 5 mins
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOnWay(lesson, 10)}>
                              I'll be 10 mins
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOnWay(lesson, 15)}>
                              I'll be 15 mins
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOnWay(lesson, 20)}>
                              I'll be 20 mins
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOnWay(lesson, 30)}>
                              I'll be 30 mins
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOnWay(lesson, -1)}>
                              I'll call you ASAP
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOnWay(lesson, -2)}>
                              Send current ETA
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-col h-auto py-2 gap-1 w-full border-success/50 hover:bg-success/10"
                          onClick={() => setWizardLesson(lesson)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-[10px] leading-none">Done</span>
                        </Button>

                        {/* More Options */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-col h-auto py-2 gap-1 w-full"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="text-[10px] leading-none">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setRescheduleLesson(lesson)}>
                              <CalendarClock className="h-4 w-4 mr-2" />
                              Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setCancelLesson(lesson)}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Lesson
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </CardContent>

      {/* Reschedule Sheet */}
      {rescheduleLesson && (
        <RescheduleLessonSheet
          open={!!rescheduleLesson}
          onOpenChange={(open) => !open && setRescheduleLesson(null)}
          lessonId={rescheduleLesson.id}
          instructorId={instructorId}
          pupilName={rescheduleLesson.pupil?.name || "Pupil"}
          currentDate={rescheduleLesson.lesson_date}
          currentTime={rescheduleLesson.start_time}
          durationMinutes={rescheduleLesson.duration_minutes}
          onRescheduled={() => {
            setRescheduleLesson(null);
            fetchLessons();
          }}
        />
      )}

      {/* Cancel Dialog */}
      {cancelLesson && (
        <CancelLessonDialog
          open={!!cancelLesson}
          onOpenChange={(open) => !open && setCancelLesson(null)}
          lessonId={cancelLesson.id}
          pupilId={cancelLesson.pupil?.id || ""}
          pupilName={cancelLesson.pupil?.name || "Pupil"}
          amountDue={cancelLesson.amount_due || 0}
          pupilBalance={cancelLesson.pupil?.account_balance || 0}
          durationMinutes={cancelLesson.duration_minutes}
          lessonDate={cancelLesson.lesson_date}
          lessonTime={cancelLesson.start_time}
          instructorId={instructorId}
          onCancelled={() => {
            setCancelLesson(null);
            setLessons((prev) => prev.filter((l) => l.id !== cancelLesson.id));
          }}
        />
      )}

      {/* End Lesson Wizard */}
      {wizardLesson && (
        <EndLessonWizard
          open={!!wizardLesson}
          onOpenChange={(open) => !open && setWizardLesson(null)}
          lessonId={wizardLesson.id}
          pupilId={wizardLesson.pupil?.id || ""}
          pupilName={wizardLesson.pupil?.name || "Pupil"}
          instructorId={instructorId}
          durationMinutes={wizardLesson.duration_minutes}
          lessonDate={wizardLesson.lesson_date}
          startTime={wizardLesson.start_time}
          currentBalance={wizardLesson.pupil?.account_balance || 0}
          onCompleted={() => {
            setWizardLesson(null);
            setLessons((prev) => prev.filter((l) => l.id !== wizardLesson.id));
          }}
        />
      )}
    </Card>
  );
}
