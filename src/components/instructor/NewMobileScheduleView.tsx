import { useState, useEffect, useMemo } from "react";
import { triggerAutomations } from "@/utils/triggerAutomations";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, parseISO, startOfDay, endOfDay } from "date-fns";
import { Calendar, Loader2, Plus, Clock, MapPin, PoundSterling, CalendarDays, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScheduleDayTabs } from "./ScheduleDayTabs";
import { ExpandableLessonCard } from "./ExpandableLessonCard";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { AddLessonSheet } from "./AddLessonSheet";
import { TravelTimeIndicator } from "./TravelTimeIndicator";
import { PupilAvatar } from "./PupilAvatar";
import { useLessonTravelTimes } from "@/hooks/useLessonTravelTimes";
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
  notes: string | null;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
    address: string;
    postcode: string;
    prepaid_hours: number;
    account_balance: number;
    profile_image_url: string | null;
  };
}

interface NewMobileScheduleViewProps {
  instructorId: string;
}

const courseTypeLabels: Record<string, string> = {
  standard: "Standard",
  test_prep: "Test Prep",
  mock_test: "Mock Test",
  motorway: "Motorway",
  refresher: "Refresher",
  intensive: "Intensive",
  first_lesson: "First Lesson",
  pass_plus: "Pass Plus",
  driving_test: "Driving Test",
};

const lessonTypeColors: Record<string, { border: string; badge: string }> = {
  test_prep: { border: "border-l-amber-400", badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" },
  standard: { border: "border-l-blue-400", badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  intensive: { border: "border-l-purple-400", badge: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400" },
  motorway: { border: "border-l-emerald-400", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" },
  mock_test: { border: "border-l-rose-400", badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" },
  refresher: { border: "border-l-cyan-400", badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400" },
  first_lesson: { border: "border-l-green-400", badge: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" },
  pass_plus: { border: "border-l-indigo-400", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" },
  driving_test: { border: "border-l-orange-500", badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" },
};

interface ExternalEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  color: string | null;
  is_all_day: boolean;
}

export function NewMobileScheduleView({ instructorId }: NewMobileScheduleViewProps) {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ScheduledLesson | null>(null);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [lessonColors, setLessonColors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLessons();
    fetchExternalEvents();
  }, [instructorId, selectedDate]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id, lesson_date, start_time, duration_minutes, lesson_type,
          pickup_location, pickup_postcode, status, payment_status,
          prepaid_hours_used, amount_due, notes, check_in_status,
          pupil:pupils(id, name, phone, address, postcode, prepaid_hours, account_balance, profile_image_url)
        `)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", dateStr)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (error) throw error;
      
      const transformedData = (data || []).map((lesson: any) => ({
        ...lesson,
        pupil: lesson.pupil || { id: "", name: "Unknown", phone: null, address: "", postcode: "", prepaid_hours: 0, account_balance: 0, profile_image_url: null }
      }));
      
      setLessons(transformedData);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast({ title: "Error", description: "Failed to load schedule", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalEvents = async () => {
    try {
      const dayStart = startOfDay(selectedDate).toISOString();
      const dayEnd = endOfDay(selectedDate).toISOString();

      const { data, error } = await supabase
        .from("instructor_calendar_events")
        .select("id, title, start_time, end_time, color")
        .eq("instructor_id", instructorId)
        .lte("start_time", dayEnd)
        .gte("end_time", dayStart);

      if (error) throw error;

      const events: ExternalEvent[] = (data || []).map((evt: any) => {
        const start = parseISO(evt.start_time);
        const end = parseISO(evt.end_time);
        // Detect all-day events (starts at midnight, ends at 23:59)
        const startHour = start.getHours() + start.getMinutes();
        const endHour = end.getHours();
        const isAllDay = startHour === 0 && (endHour === 23 || endHour === 0);
        return {
          id: evt.id,
          title: evt.title || "Busy",
          start_time: evt.start_time,
          end_time: evt.end_time,
          color: evt.color,
          is_all_day: isAllDay,
        };
      });

      setExternalEvents(events);
    } catch (error) {
      console.error("Error fetching external events:", error);
    }
  };

  // --- All existing handlers preserved ---
  const handleNavigate = (address: string, postcode: string) => {
    const query = encodeURIComponent(`${address}, ${postcode}`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS ? `maps://maps.apple.com/?daddr=${query}` : `geo:0,0?q=${query}`;
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    window.location.href = url;
    setTimeout(() => { window.open(fallbackUrl, "_blank"); }, 500);
  };

  const handleCall = (phone: string | null) => {
    if (!phone) { toast({ title: "No phone number", description: "This pupil doesn't have a phone number on file", variant: "destructive" }); return; }
    window.location.href = `tel:${phone}`;
  };

  const handleText = (phone: string | null) => {
    if (!phone) { toast({ title: "No phone number", description: "This pupil doesn't have a phone number on file", variant: "destructive" }); return; }
    window.location.href = `sms:${phone}`;
  };

  const handleOnWay = async (lesson: ScheduledLesson, delayMinutes?: number) => {
    if (!lesson.pupil?.phone) { toast({ title: "No phone number", description: "This pupil doesn't have a phone number on file", variant: "destructive" }); return; }
    setSendingMessage(lesson.id);
    const firstName = (lesson.pupil?.name || "").split(" ")[0];
    let message: string;
    if (delayMinutes === -1) message = `Hi ${firstName}, I'll call you as soon as I can!`;
    else if (delayMinutes === -2) message = `Hi ${firstName}, I'm on my way to you now!`;
    else if (delayMinutes) message = `Hi ${firstName}, I'm on my way! I'll be with you in about ${delayMinutes} minutes.`;
    else message = `Hi ${firstName}, I'm on my way to you!`;
    window.location.href = `sms:${lesson.pupil.phone}?body=${encodeURIComponent(message)}`;
    setSendingMessage(null);
  };

  const handleCancelLesson = (lesson: ScheduledLesson) => { setSelectedLesson(lesson); setCancelDialogOpen(true); };
  const handleRescheduleLesson = (lesson: ScheduledLesson) => { setSelectedLesson(lesson); setRescheduleDialogOpen(true); };
  const handleDeleteLesson = (lesson: ScheduledLesson) => { setSelectedLesson(lesson); setCancelDialogOpen(true); };

  const handleNoShow = async (lesson: ScheduledLesson) => {
    try {
      await supabase
        .from("scheduled_lessons")
        .update({ status: "no_show" as any, marked_no_show_at: new Date().toISOString() } as any)
        .eq("id", lesson.id);

      // Auto-charge no-show fee if configured
      try {
        const { data: prefs } = await supabase
          .from("instructor_reminder_preferences")
          .select("no_show_fee, auto_charge_no_show")
          .eq("instructor_id", instructorId)
          .maybeSingle();

        if (prefs?.auto_charge_no_show && prefs.no_show_fee > 0) {
          const newBalance = (lesson.pupil?.account_balance || 0) - prefs.no_show_fee;
          await supabase.from("pupils").update({ account_balance: newBalance }).eq("id", lesson.pupil.id);
          await supabase.from("payment_history").insert({
            pupil_id: lesson.pupil.id,
            instructor_id: instructorId,
            amount: -prefs.no_show_fee,
            payment_method: "No-Show Fee",
            notes: `No-show charge for ${lesson.lesson_date} ${lesson.start_time}`,
          });
        }
      } catch (e) {
        console.error("No-show fee error:", e);
      }

      // Fire automations
      triggerAutomations({
        triggerType: "no_show",
        instructorId,
        pupilId: lesson.pupil.id,
        pupilName: lesson.pupil.name,
      });

      toast({ title: "Marked as no-show", description: `${lesson.pupil.name} didn't turn up` });
      fetchLessons();
    } catch (e) {
      console.error("No-show error:", e);
      toast({ title: "Error", description: "Failed to mark no-show", variant: "destructive" });
    }
  };

  const handleColorChange = (lessonId: string, color: string) => {
    setLessonColors(prev => ({ ...prev, [lessonId]: color }));
    const stored = JSON.parse(localStorage.getItem('lessonColors') || '{}');
    stored[lessonId] = color;
    localStorage.setItem('lessonColors', JSON.stringify(stored));
  };

  useEffect(() => {
    const stored = localStorage.getItem('lessonColors');
    if (stored) { try { setLessonColors(JSON.parse(stored)); } catch (e) { console.error(e); } }
  }, []);

  const lessonsForTravel = useMemo(
    () => lessons.map((l) => ({ id: l.id, start_time: l.start_time, duration_minutes: l.duration_minutes, pickup_postcode: l.pickup_postcode, pupil: l.pupil ? { postcode: l.pupil.postcode } : undefined })),
    [lessons]
  );
  const { getTravelTime } = useLessonTravelTimes(lessonsForTravel);

  // Split external events into all-day and timed
  const allDayEvents = externalEvents.filter(e => e.is_all_day);
  const timedExternalEvents = externalEvents.filter(e => !e.is_all_day);

  // Summary calculations
  const lessonCount = lessons.length;
  const totalScheduled = lessons.reduce((sum, l) => sum + (l.amount_due || 0), 0);

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    return `${h}:${m}`;
  };

  const getEndTime = (startTime: string, durationMinutes: number) => {
    const [h, m] = startTime.split(":").map(Number);
    const endMin = h * 60 + m + durationMinutes;
    return `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
  };

  const getPaymentLabel = (lesson: ScheduledLesson) => {
    if (lesson.payment_status === "paid") return { text: "Paid", color: "text-emerald-600" };
    return { text: "Unpaid", color: "text-amber-500" };
  };

  return (
    <div className="space-y-4">
      {/* Week Day Tabs */}
      <ScheduleDayTabs selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Summary Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
          </h2>
          <p className="text-sm text-muted-foreground">
            £{totalScheduled} scheduled
          </p>
        </div>
        <Button
          onClick={() => setAddLessonOpen(true)}
          className="rounded-none bg-[#1a3a4a] hover:bg-[#1a3a4a]/90 text-white gap-1.5 h-10 px-5"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Lesson Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : lessons.length === 0 && externalEvents.length === 0 ? (
        <div className="bg-card rounded-none border border-border flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">No lessons scheduled</p>
          <p className="text-sm text-muted-foreground/70">
            {isToday(selectedDate) ? "Enjoy your day off!" : `No lessons on ${format(selectedDate, "EEEE")}`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {lessons.map((lesson, index) => {
              const colors = lessonTypeColors[lesson.lesson_type] || { border: "border-l-border", badge: "bg-muted text-muted-foreground" };
              const payment = getPaymentLabel(lesson);
              const pickupAddress = lesson.pickup_location || lesson.pupil?.address || "No address";
              const nextLesson = lessons[index + 1];
              const travelTime = nextLesson ? getTravelTime(lesson.id, nextLesson.id) : null;

              return (
                <div key={lesson.id}>
                  <ExpandableLessonCard
                    lesson={lesson}
                    onNavigate={handleNavigate}
                    onCall={handleCall}
                    onText={handleText}
                    onOnWay={handleOnWay}
                    onCancel={handleCancelLesson}
                    onReschedule={handleRescheduleLesson}
                    onNoShow={handleNoShow}
                    sendingMessage={sendingMessage}
                    cardColor={lessonColors[lesson.id] || "bg-card"}
                    onColorChange={(color) => handleColorChange(lesson.id, color)}
                    onDelete={handleDeleteLesson}
                    renderCustomCollapsed={
                      <div className={`rounded-none border p-4 space-y-2 ${
                        lesson.lesson_type === 'driving_test' 
                          ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-300 dark:border-orange-500/30 border-l-4 border-l-orange-500 ring-1 ring-orange-200 dark:ring-orange-500/20' 
                          : `bg-card border-border ${colors.border}`
                      }`}>
                        {/* Driving Test Banner */}
                        {lesson.lesson_type === 'driving_test' && (
                          <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-500/20 rounded-none px-3 py-2 -mx-1 -mt-1 mb-1">
                            <Car className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm font-bold text-orange-700 dark:text-orange-300">DRIVING TEST</span>
                            <span className="ml-auto text-lg font-bold font-mono text-orange-700 dark:text-orange-300 tracking-tight">
                              {formatTime(lesson.start_time)}
                            </span>
                          </div>
                        )}
                        {/* Header: Avatar + Name + Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <PupilAvatar
                              name={lesson.pupil?.name || "Unknown"}
                              imageUrl={lesson.pupil?.profile_image_url}
                              size="sm"
                            />
                            <h3 className="text-base font-bold text-foreground truncate">{lesson.pupil?.name || "Unknown"}</h3>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <LessonCheckInBadge status={(lesson as any).check_in_status} />
                            {lesson.lesson_type !== 'driving_test' && (
                              <Badge className={`border-0 text-xs px-2.5 py-0.5 font-medium ${colors.badge}`}>
                                {courseTypeLabels[lesson.lesson_type] || lesson.lesson_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Time */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTime(lesson.start_time)} - {getEndTime(lesson.start_time, lesson.duration_minutes)}</span>
                        </div>
                        {/* Test Centre from notes */}
                        {lesson.lesson_type === 'driving_test' && lesson.notes && (
                          <div className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-400">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{lesson.notes.replace('Test Centre: ', '')}</span>
                          </div>
                        )}
                        {/* Location */}
                        {pickupAddress !== "No address" && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{pickupAddress}</span>
                          </div>
                        )}
                        {/* Price + Payment Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <PoundSterling className="h-3.5 w-3.5" />
                            <span>£{lesson.amount_due || 0}</span>
                          </div>
                          <span className={`text-xs font-semibold ${payment.color}`}>
                            {payment.text}
                          </span>
                        </div>
                        {/* View profile link */}
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/instructor/pupils?pupil=${lesson.pupil?.id}`); }}
                          className="text-xs text-primary font-medium hover:underline text-left"
                        >
                          View full profile →
                        </button>
                      </div>
                    }
                  />
                  {travelTime && (
                    <TravelTimeIndicator
                      durationMinutes={travelTime.durationMinutes}
                      durationText={travelTime.durationText}
                      gapMinutes={travelTime.gapMinutes}
                      status={travelTime.status}
                      isLoading={travelTime.isLoading}
                    />
                  )}
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* All-day external events */}
      {allDayEvents.length > 0 && (
        <div className="space-y-2">
          {allDayEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-warning/10 rounded-none border border-foreground px-4 py-2.5 flex items-center gap-2"
            >
              <CalendarDays className="h-3.5 w-3.5 text-warning shrink-0" />
              <span className="text-sm font-bold text-foreground truncate">{evt.title}</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 shrink-0 border-warning/30 text-foreground">All day</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Timed external events */}
      {timedExternalEvents.length > 0 && (
        <div className="space-y-2">
          {timedExternalEvents.map((evt) => {
            const startDt = parseISO(evt.start_time);
            const endDt = parseISO(evt.end_time);
            return (
              <div
                key={evt.id}
                className="bg-card rounded-none border border-border p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {evt.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: evt.color }} />}
                    <h3 className="text-sm font-semibold text-foreground truncate">{evt.title}</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 shrink-0 ml-2">Calendar</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{format(startDt, "HH:mm")} - {format(endDt, "HH:mm")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Dialog */}
      {selectedLesson && (
        <CancelLessonDialog
          open={cancelDialogOpen}
          onOpenChange={(open) => { setCancelDialogOpen(open); if (!open) setSelectedLesson(null); }}
          lessonId={selectedLesson.id}
          pupilId={selectedLesson.pupil?.id || ""}
          pupilName={selectedLesson.pupil?.name || "Unknown"}
          amountDue={selectedLesson.amount_due || 0}
          pupilBalance={selectedLesson.pupil?.account_balance || 0}
          durationMinutes={selectedLesson.duration_minutes}
          lessonDate={selectedLesson.lesson_date}
          lessonTime={selectedLesson.start_time}
          instructorId={instructorId}
          onCancelled={fetchLessons}
        />
      )}

      {/* Reschedule Sheet */}
      {selectedLesson && (
        <RescheduleLessonSheet
          open={rescheduleDialogOpen}
          onOpenChange={(open) => { setRescheduleDialogOpen(open); if (!open) setSelectedLesson(null); }}
          lessonId={selectedLesson.id}
          instructorId={instructorId}
          pupilName={selectedLesson.pupil?.name || "Unknown"}
          currentDate={selectedLesson.lesson_date}
          currentTime={selectedLesson.start_time}
          durationMinutes={selectedLesson.duration_minutes}
          onRescheduled={fetchLessons}
        />
      )}

      {/* Add Lesson Sheet */}
      <AddLessonSheet
        open={addLessonOpen}
        onOpenChange={setAddLessonOpen}
        instructorId={instructorId}
        defaultDate={selectedDate}
        onSuccess={fetchLessons}
      />
    </div>
  );
}
