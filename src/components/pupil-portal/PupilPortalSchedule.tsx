import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, MapPin, Phone, MessageSquare, X, AlertTriangle, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RouteStatusBadge } from "@/components/instructor/driving-test/RouteStatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isBefore, startOfDay, addHours, isAfter } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SelfBookingCalendar from "./SelfBookingCalendar";
import { checkLessonClash, describeLessonClashError } from "@/lib/lessonClashCheck";
import { BookNewLessonButton } from "./lessons/BookNewLessonButton";
import { CancellationPolicy } from "./lessons/CancellationPolicy";
import { UpcomingLessonsSection } from "./lessons/UpcomingLessonsSection";
import { LessonHistorySection } from "./lessons/LessonHistorySection";
import type { LessonHistoryItem } from "./lessons/LessonHistoryRow";
import { usePupilLessonHistory } from "@/hooks/usePupilLessonHistory";

interface PupilPortalScheduleProps {
  pupilId: string;
  instructorId: string;
  brandColour: string | null;
  darkMode: boolean;
  instructorPhone: string | null;
  initialShowBooking?: boolean;
  onViewHistory?: () => void;
}

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  pickup_location: string | null;
  lesson_type: string;
  status: string;
  payment_status: string;
  booking_status: string | null;
}

interface BookingSettings {
  allow_self_booking: boolean;
  allow_self_cancel: boolean;
  allow_self_reschedule: boolean;
  require_approval: boolean;
  cancel_notice_hours: number;
  reschedule_notice_hours: number;
  min_notice_hours: number;
  max_advance_days: number;
  allowed_durations: number[];
  booking_message: string | null;
  allow_extra_hours_request: boolean;
}

export function PupilPortalSchedule({ 
  pupilId, 
  instructorId, 
  brandColour, 
  darkMode,
  instructorPhone,
  initialShowBooking = false,
  onViewHistory,
}: PupilPortalScheduleProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ScheduledLesson | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showBooking, setShowBooking] = useState(initialShowBooking);

  const queryClient = useQueryClient();

  // Fetch booking settings
  const { data: settings } = useQuery({
    queryKey: ['pupil-booking-settings', instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_booking_settings')
        .select('*')
        .eq('instructor_id', instructorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return (data || {
        allow_self_booking: false,
        allow_self_cancel: false,
        allow_self_reschedule: false,
        require_approval: true,
        cancel_notice_hours: 24,
        reschedule_notice_hours: 24,
        min_notice_hours: 24,
        max_advance_days: 56,
        allowed_durations: [60, 90, 120],
        booking_message: null,
        allow_extra_hours_request: false,
      }) as BookingSettings;
    },
  });

  // Fetch lessons
  const { data: lessons = [], isLoading: loading } = useQuery({
    queryKey: ['pupil-lessons', pupilId, instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, pickup_location, lesson_type, status, payment_status, booking_status")
        .eq("pupil_id", pupilId)
        .eq("instructor_id", instructorId)
        .neq("status", "cancelled")
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data || []) as ScheduledLesson[];
    },
  });

  const canCancelLesson = (lesson: ScheduledLesson): boolean => {
    if (!settings?.allow_self_cancel) return false;
    const lessonDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
    const cutoff = addHours(new Date(), settings.cancel_notice_hours);
    return isAfter(lessonDateTime, cutoff);
  };

  const canRescheduleLesson = (lesson: ScheduledLesson): boolean => {
    if (!settings?.allow_self_reschedule) return false;
    const lessonDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
    const cutoff = addHours(new Date(), settings.reschedule_notice_hours);
    return isAfter(lessonDateTime, cutoff);
  };

  const handleCancelRequest = (lesson: ScheduledLesson) => {
    setSelectedLesson(lesson);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleRescheduleRequest = (lesson: ScheduledLesson) => {
    setSelectedLesson(lesson);
    setRescheduleDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!selectedLesson) return;
    
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("scheduled_lessons")
        .update({ 
          status: "cancelled",
          cancelled_by: "pupil",
          cancellation_reason: cancelReason || null,
        })
        .eq("id", selectedLesson.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['pupil-lessons'] });
      toast({ title: "Lesson cancelled", description: "Your instructor has been notified" });
      setCancelDialogOpen(false);
      setSelectedLesson(null);
    } catch (error) {
      console.error("Error cancelling lesson:", error);
      toast({ title: "Error", description: "Failed to cancel lesson", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const today = startOfDay(new Date());
  const upcomingLessons = lessons.filter(l => !isBefore(parseISO(l.lesson_date), today));

  if (showBooking) {
    return (
      <div className="px-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBooking(false)}
          style={{ color: 'var(--brand-text)' }}
        >
          ← Back to Lessons
        </Button>
        <SelfBookingCalendar
          pupilId={pupilId}
          instructorId={instructorId}
          brandColour={brandColour || undefined}
        />
      </div>
    );
  }

  if (rescheduleDialogOpen && selectedLesson) {
    return (
      <div className="px-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setRescheduleDialogOpen(false);
            setSelectedLesson(null);
          }}
          style={{ color: 'var(--brand-text)' }}
        >
          ← Cancel Reschedule
        </Button>
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} />
              <span className="font-medium" style={{ color: 'var(--brand-text)' }}>
                Rescheduling: {format(parseISO(selectedLesson.lesson_date), 'EEE, d MMM')} at {formatTime(selectedLesson.start_time)}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
              Select a new time slot below. Your old lesson will be cancelled automatically.
            </p>
          </CardContent>
        </Card>
        <RescheduleBookingCalendar
          pupilId={pupilId}
          instructorId={instructorId}
          brandColour={brandColour}
          originalLessonId={selectedLesson.id}
          originalDuration={selectedLesson.duration_minutes}
          requireApproval={settings?.require_approval ?? true}
          onComplete={() => {
            setRescheduleDialogOpen(false);
            setSelectedLesson(null);
            queryClient.invalidateQueries({ queryKey: ['pupil-lessons'] });
          }}
        />
      </div>
    );
  }

  // Lesson history (last 3) for the new layout
  const { data: rawHistory = [], isLoading: historyLoading } = usePupilLessonHistory(pupilId, 3);
  const historyItems: LessonHistoryItem[] = useMemo(
    () =>
      rawHistory.map((h) => {
        const date = parseISO(h.lesson_date);
        const dateFormatted = format(date, "EEE d MMM");
        const startStr = h.start_time ?? "00:00";
        const [hh, mm] = startStr.split(":").map(Number);
        const totalEnd = hh * 60 + mm + h.duration_minutes;
        const eh = Math.floor(totalEnd / 60) % 24;
        const em = totalEnd % 60;
        const fmt = (hour: number, min: number) => {
          const ampm = hour >= 12 ? "pm" : "am";
          const dh = hour % 12 || 12;
          return `${dh}:${min.toString().padStart(2, "0")}${ampm}`;
        };
        const timeFormatted = h.start_time ? `${fmt(hh, mm)} – ${fmt(eh, em)}` : `${h.duration_minutes} mins`;
        const hours = h.duration_minutes / 60;
        const durationLabel = `${hours % 1 === 0 ? hours : hours.toFixed(1)} hour`;
        return {
          id: h.id,
          status: (h.status === "cancelled" ? "cancelled" : "completed") as "completed" | "cancelled",
          dateFormatted,
          timeFormatted,
          durationLabel,
        };
      }),
    [rawHistory]
  );

  return (
    <div
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        paddingBottom: 48,
        fontFamily: "Poppins, system-ui, sans-serif",
      }}
    >
      {settings?.allow_self_booking && (
        <BookNewLessonButton onClick={() => setShowBooking(true)} />
      )}

      {settings?.allow_self_cancel && (
        <CancellationPolicy cancelNoticeHours={settings.cancel_notice_hours} />
      )}

      <UpcomingLessonsSection
        lessons={upcomingLessons}
        loading={loading}
        instructorPhone={instructorPhone}
        cancelNoticeHours={settings?.cancel_notice_hours}
        canCancel={canCancelLesson}
        canReschedule={canRescheduleLesson}
        onViewSlots={() => setShowBooking(true)}
        onCancel={handleCancelRequest}
        onReschedule={handleRescheduleRequest}
      />

      <LessonHistorySection
        lessons={historyItems}
        loading={historyLoading}
        onViewAll={() => onViewHistory?.()}
      />

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Lesson?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your lesson on{' '}
              {selectedLesson && format(parseISO(selectedLesson.lesson_date), 'EEE, d MMM')} at{' '}
              {selectedLesson && formatTime(selectedLesson.start_time)}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              placeholder="Why are you cancelling?"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1"
              maxLength={500}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Lesson
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// Internal reschedule calendar component
function RescheduleBookingCalendar({
  pupilId,
  instructorId,
  brandColour,
  originalLessonId,
  originalDuration,
  requireApproval,
  onComplete,
}: {
  pupilId: string;
  instructorId: string;
  brandColour: string | null;
  originalLessonId: string;
  originalDuration: number;
  requireApproval: boolean;
  onComplete: () => void;
}) {
  const [booking, setBooking] = useState(false);

  // Fetch working hours
  const { data: workingHours } = useQuery({
    queryKey: ['reschedule-working-hours', instructorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructor_working_hours")
        .select("day_of_week, start_time, end_time, is_active")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);
      return data || [];
    },
  });

  // Fetch existing lessons for 8 weeks
  const { data: existingLessons } = useQuery({
    queryKey: ['reschedule-existing-lessons', instructorId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const eightWeeks = format(addHours(new Date(), 56 * 24), 'yyyy-MM-dd');
      const { data } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, start_time, duration_minutes")
        .eq("instructor_id", instructorId)
        .neq("status", "cancelled")
        .neq("id", originalLessonId)
        .gte("lesson_date", today)
        .lte("lesson_date", eightWeeks);
      return data || [];
    },
  });

  const availableSlots = useMemo(() => {
    if (!workingHours) return [];
    const slots: { date: string; startTime: string; endTime: string; duration: number }[] = [];

    for (let i = 1; i <= 56; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      const dateStr = format(date, 'yyyy-MM-dd');

      const dayHours = workingHours.find((wh: any) => wh.day_of_week === dayOfWeek);
      if (!dayHours) continue;

      const [startH, startM] = dayHours.start_time.split(':').map(Number);
      const [endH, endM] = dayHours.end_time.split(':').map(Number);
      const workStart = startH * 60 + startM;
      const workEnd = endH * 60 + endM;

      const dayLessons = (existingLessons || [])
        .filter((l: any) => l.lesson_date === dateStr)
        .map((l: any) => {
          const [h, m] = l.start_time.split(':').map(Number);
          return { start: h * 60 + m, end: h * 60 + m + l.duration_minutes };
        })
        .sort((a: any, b: any) => a.start - b.start);

      let currentTime = workStart;
      for (const lesson of dayLessons) {
        if (lesson.start > currentTime && lesson.start - currentTime >= originalDuration) {
          slots.push({
            date: dateStr,
            startTime: `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`,
            endTime: `${Math.floor(lesson.start / 60).toString().padStart(2, '0')}:${(lesson.start % 60).toString().padStart(2, '0')}`,
            duration: lesson.start - currentTime,
          });
        }
        currentTime = Math.max(currentTime, lesson.end);
      }
      if (currentTime < workEnd && workEnd - currentTime >= originalDuration) {
        slots.push({
          date: dateStr,
          startTime: `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`,
          endTime: `${Math.floor(workEnd / 60).toString().padStart(2, '0')}:${(workEnd % 60).toString().padStart(2, '0')}`,
          duration: workEnd - currentTime,
        });
      }
    }
    return slots.slice(0, 30);
  }, [workingHours, existingLessons, originalDuration]);

  const handleReschedule = async (slot: { date: string; startTime: string }) => {
    setBooking(true);
    try {
      // Get pupil details
      const { data: pupilData } = await supabase
        .from("pupils")
        .select("address, postcode")
        .eq("id", pupilId)
        .single();

      // Pre-check for a clash on the new slot, ignoring the lesson being rescheduled.
      const clash = await checkLessonClash({
        instructorId,
        date: slot.date,
        startTime: slot.startTime,
        durationMinutes: originalDuration,
        excludeLessonId: originalLessonId,
      });
      if (clash.hardOverlap) {
        toast({
          title: "Slot just got booked",
          description: clash.message ?? "That slot is already booked. Please pick another time.",
          variant: "destructive",
        });
        return;
      }

      // Cancel old lesson
      await supabase
        .from("scheduled_lessons")
        .update({ 
          status: "cancelled", 
          cancelled_by: "pupil",
          cancellation_reason: "Rescheduled by pupil",
        })
        .eq("id", originalLessonId);

      // Create new lesson
      const { error } = await supabase
        .from("scheduled_lessons")
        .insert({
          instructor_id: instructorId,
          pupil_id: pupilId,
          lesson_date: slot.date,
          start_time: slot.startTime,
          duration_minutes: originalDuration,
          pickup_location: pupilData?.address || '',
          pickup_postcode: pupilData?.postcode || '',
          lesson_type: 'Standard Lesson',
          status: 'scheduled',
          booking_status: requireApproval ? 'pending_approval' : 'confirmed',
          payment_status: 'not_paid',
          original_lesson_id: originalLessonId,
        });

      if (error) {
        const friendly = describeLessonClashError(error);
        toast({
          title: friendly ? "Slot just got booked" : "Error",
          description: friendly ?? "Failed to reschedule lesson",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: requireApproval ? "Reschedule Requested!" : "Lesson Rescheduled!",
        description: requireApproval
          ? "Your instructor will confirm the new time."
          : `Moved to ${format(parseISO(slot.date), 'EEE, d MMM')} at ${slot.startTime}`,
      });
      onComplete();
    } catch (error) {
      console.error("Reschedule error:", error);
      toast({ title: "Error", description: "Failed to reschedule lesson", variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  // Group by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, typeof availableSlots>);

  if (availableSlots.length === 0) {
    return (
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardContent className="p-6 text-center">
          <Calendar className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--brand-muted)' }} />
          <p style={{ color: 'var(--brand-muted)' }}>No available slots found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(slotsByDate).map(([date, slots]) => (
        <Card key={date} style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
              <Calendar className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} />
              {format(parseISO(date), 'EEEE, d MMMM')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {slots.map((slot, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  disabled={booking}
                  onClick={() => handleReschedule(slot)}
                  className="min-h-[40px]"
                  style={{ borderColor: brandColour || '#1e3a5f', color: brandColour || '#1e3a5f' }}
                >
                  {booking ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    formatTime(slot.startTime)
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
